'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, 
    Key, 
    Shield, 
    Settings as SettingsIcon, 
    ArrowLeft, 
    Save, 
    Trash2, 
    Copy, 
    Check, 
    Github, 
    Globe, 
    Plus,
    Loader2,
    Cpu
} from 'lucide-react';
import Link from 'next/link';

interface UserData {
    name: string | null;
    email: string | null;
    image: string | null;
    providers: string[];
    settings: {
        preferredModel: string;
        emailNotifications: boolean;
        geminiConnected: boolean;
    } | null;
}

interface ApiKey {
    id: string;
    name: string;
    prefix: string;
    createdAt: string;
    lastUsed: string | null;
}

const SectionWrapper = ({ children, delay = 0 }: { children: React.ReactNode, delay?: number }) => (
    <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
        className="bg-white/5 border border-white/10 rounded-[2rem] p-8 backdrop-blur-xl hover:border-white/20 transition-all group"
    >
        {children}
    </motion.section>
);

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<UserData | null>(null);
    const [keys, setKeys] = useState<ApiKey[]>([]);
    
    // Form States
    const [name, setName] = useState('');
    const [savingProfile, setSavingProfile] = useState(false);
    
    // API Key States
    const [newKeyName, setNewKeyName] = useState('');
    const [creatingKey, setCreatingKey] = useState(false);
    const [createdKey, setCreatedKey] = useState<string | null>(null);
    
    // UI States
    const [copied, setCopied] = useState<string | null>(null);

    useEffect(() => {
        Promise.all([
            fetch('/api/user').then(r => r.json()),
            fetch('/api/keys').then(r => r.json())
        ]).then(([userData, keysData]) => {
            setUser(userData);
            setName(userData.name || '');
            setKeys(keysData);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        try {
            await fetch('/api/user', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name })
            });
        } finally {
            setSavingProfile(false);
        }
    };

    const handleCreateKey = async () => {
        if (!newKeyName) return;
        setCreatingKey(true);
        try {
            const res = await fetch('/api/keys', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newKeyName })
            });
            const data = await res.json();
            setKeys([data, ...keys]);
            setCreatedKey(data.fullKey);
            setNewKeyName('');
        } finally {
            setCreatingKey(false);
        }
    };

    const handleRevokeKey = async (id: string) => {
        if (!confirm('Are you sure you want to revoke this key?')) return;
        await fetch(`/api/keys?id=${id}`, { method: 'DELETE' });
        setKeys(keys.filter(k => k.id !== id));
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 font-mono">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="mb-4"
                >
                    <Cpu className="w-10 h-10 text-blue-500" />
                </motion.div>
                <motion.div
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    Accessing Neural Configuration...
                </motion.div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-slate-950 text-slate-200 relative overflow-hidden flex flex-col p-8">
            {/* Background Decor */}
            <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }}
                transition={{ duration: 15, repeat: Infinity }}
                className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-900/10 blur-[120px] rounded-full pointer-events-none" 
            />
            <motion.div 
                animate={{ scale: [1.2, 1, 1.2], opacity: [0.1, 0.15, 0.1] }}
                transition={{ duration: 20, repeat: Infinity, delay: 2 }}
                className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none" 
            />

            {/* Header */}
            <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative z-10 flex items-center justify-between mb-12 max-w-6xl mx-auto w-full"
            >
                <div className="flex items-center gap-6">
                    <motion.div whileHover={{ x: -5 }} whileTap={{ scale: 0.9 }}>
                        <Link href="/dashboard" className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl transition-all text-slate-400 hover:text-white border border-white/5">
                            <ArrowLeft className="w-6 h-6" />
                        </Link>
                    </motion.div>
                    <div>
                        <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 tracking-tight uppercase italic">
                            System Configuration
                        </h1>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">Manage identity, access, and neural links</p>
                    </div>
                </div>
            </motion.div>

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto w-full">
                
                {/* Column 1: Profile & Integrations */}
                <div className="space-y-8">
                    {/* Profile Card */}
                    <SectionWrapper delay={0.1}>
                        <div className="flex items-center gap-3 mb-8 text-blue-400">
                            <motion.div whileHover={{ rotate: 10 }}>
                                <User className="w-6 h-6" />
                            </motion.div>
                            <h2 className="font-black uppercase tracking-widest text-sm italic">Identity</h2>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="block text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Display Name</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="bg-black/40 border border-white/10 rounded-2xl px-4 py-3 w-full focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                                    />
                                    <motion.button 
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleSaveProfile}
                                        disabled={savingProfile}
                                        className="p-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-2xl border border-blue-500/20 transition-all disabled:opacity-50"
                                    >
                                        {savingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                    </motion.button>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <label className="block text-[10px] text-slate-500 uppercase font-black tracking-widest ml-1">Neural ID (Email)</label>
                                <div className="bg-black/20 border border-white/5 rounded-2xl px-4 py-3 text-slate-400 text-sm font-mono">
                                    {user?.email}
                                </div>
                            </div>
                        </div>
                    </SectionWrapper>

                    {/* Integrations Card */}
                    <SectionWrapper delay={0.2}>
                        <div className="flex items-center gap-3 mb-8 text-purple-400">
                            <motion.div whileHover={{ rotate: -10 }}>
                                <Globe className="w-6 h-6" />
                            </motion.div>
                            <h2 className="font-black uppercase tracking-widest text-sm italic">Neural Links</h2>
                        </div>
                        
                        <div className="space-y-4">
                            {[
                                { name: 'Google', icon: <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>, id: 'google' },
                                { name: 'GitHub', icon: <Github className="w-5 h-5" />, id: 'github' }
                            ].map((provider) => (
                                <motion.div 
                                    key={provider.id}
                                    whileHover={{ x: 5, backgroundColor: "rgba(255, 255, 255, 0.05)" }}
                                    className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5 group transition-all"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                                            {provider.icon}
                                        </div>
                                        <span className="font-bold uppercase tracking-widest text-xs">{provider.name}</span>
                                    </div>
                                    {user?.providers.includes(provider.id) ? (
                                        <motion.span 
                                            initial={{ scale: 0.9, opacity: 0.8 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-black px-3 py-1.5 bg-emerald-400/10 rounded-full border border-emerald-400/20 uppercase tracking-widest"
                                        >
                                            <Check className="w-3 h-3" /> Connected
                                        </motion.span>
                                    ) : (
                                        <span className="text-slate-500 text-[10px] font-black px-3 py-1.5 bg-slate-500/10 rounded-full border border-white/5 uppercase tracking-widest">
                                            Inactive
                                        </span>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </SectionWrapper>
                </div>

                {/* Column 2 & 3: API Keys (Spans 2 columns) */}
                <div className="lg:col-span-2 space-y-8">
                    <SectionWrapper delay={0.3}>
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3 text-yellow-400">
                                <motion.div whileHover={{ rotate: 45 }}>
                                    <Key className="w-6 h-6" />
                                </motion.div>
                                <h2 className="font-black uppercase tracking-widest text-sm italic">Access Tokens</h2>
                            </div>
                        </div>

                        {/* Create Key Form */}
                        <div className="mb-10 p-6 bg-yellow-400/5 border border-yellow-400/10 rounded-[2rem] relative overflow-hidden">
                            <h3 className="text-xs font-black text-yellow-200 mb-4 uppercase tracking-[0.2em] ml-1">Generate New Token</h3>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <input 
                                    type="text" 
                                    placeholder="Token Name (e.g. CI/CD Pipeline)"
                                    value={newKeyName}
                                    onChange={(e) => setNewKeyName(e.target.value)}
                                    className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 transition-all font-medium"
                                />
                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={handleCreateKey}
                                    disabled={!newKeyName || creatingKey}
                                    className="px-6 py-3 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400 rounded-2xl border border-yellow-400/20 transition-all disabled:opacity-50 font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    {creatingKey ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                                    Generate
                                </motion.button>
                            </div>

                            {/* New Key Display Modal/Area */}
                            <AnimatePresence>
                                {createdKey && (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                        exit={{ opacity: 0, height: 0, scale: 0.95 }}
                                        className="mt-6 overflow-hidden"
                                    >
                                        <div className="bg-slate-950 border border-yellow-400/30 rounded-2xl p-6 shadow-2xl relative">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-yellow-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                    <Shield className="w-3 h-3" /> Secret Key Generated
                                                </span>
                                                <button onClick={() => setCreatedKey(null)} className="text-slate-500 hover:text-white transition-colors">
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <p className="text-xs text-slate-500 mb-4 italic">Copy this key now. For your security, it won&apos;t be shown again.</p>
                                            <div className="flex items-center gap-3">
                                                <code className="flex-1 bg-black/60 p-4 rounded-xl text-yellow-100 font-mono text-xs break-all border border-white/5">
                                                    {createdKey}
                                                </code>
                                                <motion.button 
                                                    whileHover={{ scale: 1.1 }}
                                                    whileTap={{ scale: 0.9 }}
                                                    onClick={() => copyToClipboard(createdKey, 'new-key')}
                                                    className="p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10"
                                                >
                                                    {copied === 'new-key' ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 text-slate-400" />}
                                                </motion.button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Keys List */}
                        <div className="space-y-3">
                            <AnimatePresence initial={false}>
                                {keys.length === 0 ? (
                                    <motion.div 
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="text-center py-12 text-slate-500 italic font-medium"
                                    >
                                        No active access tokens found.
                                    </motion.div>
                                ) : (
                                    keys.map((key, i) => (
                                        <motion.div 
                                            key={key.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: i * 0.05 }}
                                            whileHover={{ x: 5, backgroundColor: "rgba(255, 255, 255, 0.03)" }}
                                            className="flex items-center justify-between p-5 bg-black/20 rounded-2xl border border-white/5 group transition-all"
                                        >
                                            <div>
                                                <div className="font-black text-slate-200 tracking-tight uppercase italic">{key.name}</div>
                                                <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                                                    Prefix: <span className="text-slate-300 font-mono">{key.prefix}</span> • Created: {new Date(key.createdAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                            <motion.button 
                                                whileHover={{ scale: 1.1, color: "#f87171" }}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => handleRevokeKey(key.id)}
                                                className="p-3 text-slate-600 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                                title="Revoke Token"
                                            >
                                                <Trash2 className="w-5 h-5" />
                                            </motion.button>
                                        </motion.div>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </SectionWrapper>
                </div>
            </div>
        </main>
    );
}
