import { auth } from "@/lib/auth";
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

export default auth((req) => {
    const { nextUrl, auth: session } = req;
    const isLoggedIn = !!session?.user;

    // --- Proxy Logic (Project ID) ---
    const hostname = req.headers.get('host') || '';
    const projectMap: Record<string, string> = {
        'jarvis.atelier-sam.fr': 'jarvis',
        'portfolio.atelier-sam.fr': 'atelier-sam',
        'esprit.atelier-sam.fr': 'esprit-chalet',
        'localhost:9000': 'jarvis',
        process.env.JARVIS_SERVER_IP || 'localhost': 'jarvis',
    };
    const hostnameWithoutPort = hostname.split(':')[0];
    const projectId = projectMap[hostname] || projectMap[hostnameWithoutPort] || 'jarvis';

    // --- Path Analysis ---
    const pathname = nextUrl.pathname;
    
    // Check if path is an API route or public file (should skip intl logic usually, but here we handle API explicitly)
    const isApiRoute = pathname.startsWith('/api');
    
    // Normalize path for auth checks (remove locale prefix)
    // Regex: Start with slash, optionally 'en' or 'fr', then optional slash, then rest
    const localeMatch = pathname.match(/^\/(en|fr)(\/|$)/);
    const locale = localeMatch ? localeMatch[1] : routing.defaultLocale;
    
    let pathWithoutLocale = pathname;
    if (localeMatch) {
        pathWithoutLocale = pathname.replace(/^\/(en|fr)/, '') || '/';
    }

    // --- Auth Logic ---

    // Protected paths that require authentication
    const protectedPaths = [
        "/dashboard",
        "/projects",
        "/settings",
        // API routes are checked separately or included here?
        // Let's include specific API paths if needed, or rely on them being handled by route handlers
        // But here we block access at middleware level
    ];
    
    const protectedApiPaths = [
        "/api/user",
        "/api/projects"
    ];

    const isProtectedPage = protectedPaths.some((path) =>
        pathWithoutLocale.startsWith(path) && pathWithoutLocale !== '/' 
    );
    
    const isProtectedApi = protectedApiPaths.some((path) => 
        pathWithoutLocale.startsWith(path)
    );

    // Redirect unauthenticated users trying to access protected paths
    if ((isProtectedPage || isProtectedApi) && !isLoggedIn) {
        if (isApiRoute) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const loginUrl = new URL(`/${locale}/login`, nextUrl.origin);
        loginUrl.searchParams.set("callbackUrl", nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
    }

    // Redirect authenticated users away from login/register
    if ((pathWithoutLocale === "/login" || pathWithoutLocale === "/register") && isLoggedIn) {
        return NextResponse.redirect(new URL(`/${locale}/dashboard`, nextUrl.origin));
    }

    // --- Response Generation ---

    let response;

    if (isApiRoute) {
        // Skip intlMiddleware for API routes
        response = NextResponse.next();
    } else {
        // Run Intl Middleware for pages
        response = intlMiddleware(req);
    }

    // --- Inject Project ID Header ---
    response.headers.set('X-Project-ID', projectId);
    
    return response;
});

export const config = {
    matcher: [
        "/", 
        "/(fr|en)/:path*",
        "/((?!_next/static|_next/image|favicon.ico|logo.png|grid.svg|api/auth).*)", 
    ],
};
