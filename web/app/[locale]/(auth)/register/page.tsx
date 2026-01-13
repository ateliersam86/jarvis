'use client';

import { useState } from 'react';
import { useRouter, Link } from '@/i18n/routing';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Logo } from '@/components/shared/Logo';

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            if (res.ok) {
                router.push('/login');
            } else {
                const data = await res.json();
                setError(data.error || 'Registration failed');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
            {/* Subtle Background */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

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
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Create an account</h1>
                    <p className="text-muted text-sm mt-2">Join the swarm and start orchestrating.</p>
                </div>

                <div className="bg-surface/50 border border-border backdrop-blur-xl rounded-xl p-8 shadow-2xl">
                    <form onSubmit={handleRegister} className="space-y-4">
                        <Input
                            label="Full Name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            disabled={isLoading}
                        />

                        <Input
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                        />

                        <Input
                            label="Password"
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
                            Sign Up
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <span className="text-muted">Already have an account? </span>
                        <Link href="/login" className="text-primary hover:underline font-medium">
                            Log in
                        </Link>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}