'use client';

import { useState, useEffect } from 'react';
import { signIn, getCsrfToken } from 'next-auth/react';
import { useRouter, Link } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Github, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/shared/Logo';

export default function LoginPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [csrfToken, setCsrfToken] = useState<string>('');

    // Fetch CSRF token on mount
    useEffect(() => {
        getCsrfToken().then(token => setCsrfToken(token || ''));
    }, []);

    // Check for error in URL params
    useEffect(() => {
        const urlError = searchParams.get('error');
        if (urlError === 'CredentialsSignin') {
            setError('Invalid credentials. Please try again.');
        }
    }, [searchParams]);

    const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        // Submit form natively to NextAuth endpoint with CSRF
        const formData = new FormData(e.currentTarget);

        try {
            const res = await fetch('/api/auth/callback/credentials', {
                method: 'POST',
                body: new URLSearchParams({
                    csrfToken: formData.get('csrfToken') as string,
                    email: formData.get('email') as string,
                    password: formData.get('password') as string,
                    callbackUrl: '/dashboard',
                }),
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                redirect: 'manual',
            });

            // Check response - NextAuth returns 302 on success
            if (res.type === 'opaqueredirect' || res.status === 302 || res.ok) {
                router.push('/dashboard');
            } else {
                setError('Invalid credentials. Please try again.');
                setIsLoading(false);
            }
        } catch {
            setError('An error occurred. Please try again.');
            setIsLoading(false);
        }
    };

    const handleOAuthLogin = (provider: 'google' | 'github') => {
        setIsLoading(true);
        signIn(provider, { callbackUrl: '/dashboard' });
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Subtle Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 w-full max-w-[400px]"
            >
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <Logo width={48} height={48} className="scale-125" />
                    </div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
                    <p className="text-muted text-sm mt-2">Enter your credentials to access the cockpit.</p>
                </div>

                <div className="bg-surface/50 border border-border backdrop-blur-xl rounded-xl p-8 shadow-2xl">
                    <div className="space-y-3 mb-6">
                        <Button
                            variant="outline"
                            className="w-full bg-white hover:bg-gray-50 text-black border-none"
                            onClick={() => handleOAuthLogin('google')}
                            disabled={isLoading}
                        >
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => handleOAuthLogin('github')}
                            disabled={isLoading}
                        >
                            <Github className="w-5 h-5 mr-2" />
                            Continue with GitHub
                        </Button>
                    </div>

                    <div className="relative mb-6">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-surface px-2 text-muted">Or continue with</span>
                        </div>
                    </div>

                    <form onSubmit={handleEmailLogin} className="space-y-4">
                        <input type="hidden" name="csrfToken" value={csrfToken} />
                        <Input
                            label="Email"
                            name="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                        />

                        <Input
                            label="Password"
                            name="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={isLoading}
                        />

                        {error && (
                            <div className="text-red-400 text-xs flex items-center gap-2 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                                <AlertCircle className="w-3 h-3" />
                                {error}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                            isLoading={isLoading}
                        >
                            Sign In
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-muted">Don&apos;t have an account? </span>
                        <Link href="/register" className="text-primary hover:underline font-medium">
                            Register
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}