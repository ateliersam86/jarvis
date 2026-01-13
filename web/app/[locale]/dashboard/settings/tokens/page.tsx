'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Key, Copy, Check, Trash2, Plus, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Link } from '@/i18n/routing'

interface ApiToken {
    id: string
    name: string
    prefix: string
    createdAt: string
    lastUsed: string | null
    expiresAt: string | null
}

export default function TokensPage() {
    const [tokens, setTokens] = useState<ApiToken[]>([])
    const [loading, setLoading] = useState(true)
    const [newToken, setNewToken] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [tokenName, setTokenName] = useState('')

    // Fetch user's tokens
    useEffect(() => {
        fetchTokens()
    }, [])

    const fetchTokens = async () => {
        try {
            const res = await fetch('/api/v1/auth/token')
            const data = await res.json()
            setTokens(data.tokens || [])
        } catch (err) {
            console.error('Failed to fetch tokens:', err)
        } finally {
            setLoading(false)
        }
    }

    const generateToken = async () => {
        setGenerating(true)
        try {
            const res = await fetch('/api/v1/auth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: tokenName || 'CLI Token' })
            })
            const data = await res.json()

            if (data.token) {
                setNewToken(data.token)
                setTokenName('')
                fetchTokens() // Refresh list
            }
        } catch (err) {
            console.error('Failed to generate token:', err)
        } finally {
            setGenerating(false)
        }
    }

    const revokeToken = async (id: string) => {
        try {
            await fetch(`/api/v1/auth/token?id=${id}`, { method: 'DELETE' })
            fetchTokens()
        } catch (err) {
            console.error('Failed to revoke token:', err)
        }
    }

    const copyToken = () => {
        if (newToken) {
            navigator.clipboard.writeText(newToken)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    return (
        <div className="min-h-screen bg-background p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/dashboard">
                        <Button variant="secondary" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Retour
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">API Tokens</h1>
                        <p className="text-muted">Gérez vos tokens d'accès pour le CLI Jarvis</p>
                    </div>
                </div>

                {/* New Token Modal */}
                <AnimatePresence>
                    {newToken && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="mb-8"
                        >
                            <Card className="p-6 border-green-500/30 bg-green-500/10 backdrop-blur-md">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                        <Key className="w-5 h-5 text-green-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-green-400 mb-2">Token créé avec succès !</h3>
                                        <p className="text-sm text-muted mb-4">
                                            Copiez ce token maintenant. Il ne sera plus visible après fermeture.
                                        </p>
                                        <div className="bg-black/40 rounded-lg p-3 font-mono text-sm break-all mb-4 border border-white/5">
                                            {newToken}
                                        </div>
                                        <div className="flex gap-3">
                                            <Button onClick={copyToken} size="sm">
                                                {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
                                                {copied ? 'Copié !' : 'Copier'}
                                            </Button>
                                            <Button variant="secondary" size="sm" onClick={() => setNewToken(null)}>
                                                Fermer
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Generate Token */}
                <Card className="p-6 mb-8">
                    <h2 className="text-lg font-semibold mb-4">Générer un nouveau token</h2>
                    <div className="flex items-end gap-4">
                        <div className="flex-1">
                            <Input
                                label="Nom du token (optionnel)"
                                value={tokenName}
                                onChange={(e) => setTokenName(e.target.value)}
                            />
                        </div>
                        <Button onClick={generateToken} disabled={generating} className="mb-[2px]">
                            <Plus className="w-4 h-4 mr-2" />
                            {generating ? 'Génération...' : 'Générer'}
                        </Button>
                    </div>
                </Card>

                {/* Token List */}
                <Card className="p-6">
                    <h2 className="text-lg font-semibold mb-4">Vos tokens</h2>

                    {loading ? (
                        <div className="text-center py-8 text-muted">Chargement...</div>
                    ) : tokens.length === 0 ? (
                        <div className="text-center py-8 text-muted">
                            Aucun token. Générez-en un pour utiliser le CLI.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {tokens.map((token) => (
                                <motion.div
                                    key={token.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                            <Key className="w-5 h-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{token.name}</p>
                                            <p className="text-xs text-muted font-mono">{token.prefix}••••••••••••</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right text-xs text-muted hidden sm:block">
                                            <p>Créé: {new Date(token.createdAt).toLocaleDateString()}</p>
                                            {token.lastUsed ? (
                                                <p>Dernier usage: {new Date(token.lastUsed).toLocaleDateString()}</p>
                                            ) : (
                                                <p>Jamais utilisé</p>
                                            )}
                                        </div>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            onClick={() => revokeToken(token.id)}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                                            title="Révoquer le token"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </Card>

                {/* CLI Instructions */}
                <Card className="p-6 mt-8 border-primary/20 bg-primary/5">
                    <h2 className="text-lg font-semibold mb-4">Utilisation avec le CLI</h2>
                    <div className="bg-black/60 rounded-lg p-4 font-mono text-sm border border-white/10">
                        <p className="text-muted mb-2"># Authentifiez votre CLI</p>
                        <div className="flex items-center gap-2 group">
                            <p className="text-green-400 flex-1">
                                <span className="text-yellow-500">$</span> node scripts/jarvis-config.mjs login &lt;votre-token&gt;
                            </p>
                        </div>
                        <p className="text-muted mt-4 mb-2"># Vérifiez la connexion</p>
                        <p className="text-green-400">
                            <span className="text-yellow-500">$</span> node scripts/jarvis-config.mjs status
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    )
}
