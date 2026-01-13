export const projectThemes = {
    jarvis: {
        color: '#3b82f6',
        icon: '🤖',
        gradient: 'from-blue-500 to-purple-600',
        bgGradient: 'bg-gradient-to-br from-blue-500/10 to-purple-600/10',
    },
    'atelier-sam': {
        color: '#8b5cf6',
        icon: '🎨',
        gradient: 'from-purple-500 to-pink-600',
        bgGradient: 'bg-gradient-to-br from-purple-500/10 to-pink-600/10',
    },
    'esprit-chalet': {
        color: '#10b981',
        icon: '🏔️',
        gradient: 'from-green-500 to-teal-600',
        bgGradient: 'bg-gradient-to-br from-green-500/10 to-teal-600/10',
    },
} as const;

export type ProjectId = keyof typeof projectThemes;
