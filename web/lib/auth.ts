import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

const prisma = new PrismaClient();

export const authConfig: NextAuthConfig = {
    adapter: PrismaAdapter(prisma) as NextAuthConfig["adapter"],
    providers: [
        // Google OAuth
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
        }),

        // GitHub OAuth
        GitHub({
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
            allowDangerousEmailAccountLinking: true,
        }),

        // Email/Password
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
                });

                if (!user || !user.password) {
                    return null;
                }

                const isValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                if (!isValid) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    image: user.image,
                };
            },
        }),
    ],

    session: {
        strategy: "jwt",
    },

    pages: {
        signIn: "/login",
        signOut: "/",
        error: "/login",
        newUser: "/onboarding",
    },

    callbacks: {
        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id;
            }
            if (account) {
                token.provider = account.provider;
            }
            return token;
        },

        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
            }
            return session;
        },

        async signIn({ user, account }) {
            // Create user settings on first login
            if (user.id && account) {
                const existingSettings = await prisma.userSettings.findUnique({
                    where: { userId: user.id },
                });

                if (!existingSettings) {
                    await prisma.userSettings.create({
                        data: { userId: user.id },
                    });
                }
            }
            return true;
        },
    },

    events: {
        async createUser({ user }) {
            // Create default settings for new users
            if (user.id) {
                await prisma.userSettings.create({
                    data: { userId: user.id },
                });
            }
        },
    },

    debug: process.env.NODE_ENV === "development",
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
