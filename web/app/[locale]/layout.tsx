import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "../globals.css";
import { SessionProvider } from "@/components/SessionProvider";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Jarvis AI Nexus",
    template: "%s | Jarvis AI Nexus",
  },
  description: "Advanced Multi-Agent Orchestration System for autonomous task execution and project management.",
  keywords: ["AI", "Agents", "Orchestration", "Automation", "Developer Tools", "Jarvis"],
  authors: [{ name: "Samuel Muselet" }],
  creator: "Samuel Muselet",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000",
    title: "Jarvis AI Nexus",
    description: "Advanced Multi-Agent Orchestration System",
    siteName: "Jarvis AI Nexus",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "Jarvis AI Nexus Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jarvis AI Nexus",
    description: "Advanced Multi-Agent Orchestration System",
    images: ["/logo.png"],
    creator: "@samuelmuselet",
  },
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/logo.png', type: 'image/png' },
    ],
    apple: '/logo.png',
  },
  manifest: '/site.webmanifest',
};

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} antialiased font-sans bg-background text-foreground`}
      >
        <NextIntlClientProvider messages={messages}>
          <SessionProvider>
            {children}
          </SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
