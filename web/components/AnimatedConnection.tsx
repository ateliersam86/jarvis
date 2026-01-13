'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Point {
    x: number;
    y: number;
}

interface AnimatedConnectionProps {
    from: Point;
    to: Point;
    color?: string;
    duration?: number;
    delay?: number;
    particlesCount?: number;
}

export function DataParticle({ from, to, duration, delay, color }: { from: Point, to: Point, duration: number, delay: number, color: string }) {
    return (
        <motion.circle
            r="1.5"
            fill={color}
            initial={{ offsetDistance: "0%", opacity: 0 }}
            animate={{ 
                offsetDistance: ["0%", "100%"],
                opacity: [0, 1, 1, 0]
            }}
            transition={{
                duration: duration,
                repeat: Infinity,
                delay: delay,
                ease: "linear"
            }}
            style={{ 
                offsetPath: `path('M ${from.x} ${from.y} L ${to.x} ${to.y}')`,
                filter: `drop-shadow(0 0 4px ${color})`
            }}
        />
    );
}

export default function AnimatedConnection({ 
    from, 
    to, 
    color = "#3b82f6", 
    duration = 3, 
    delay = 0,
    particlesCount = 3 
}: AnimatedConnectionProps) {
    const [path, setPath] = useState('');

    useEffect(() => {
        setPath(`M ${from.x} ${from.y} L ${to.x} ${to.y}`);
    }, [from, to]);

    return (
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0">
            <defs>
                <linearGradient id={`gradient-${from.x}-${from.y}`} x1={from.x} y1={from.y} x2={to.x} y2={to.y} gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor={color} stopOpacity="0" />
                    <stop offset="50%" stopColor={color} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* Base Line */}
            <path
                d={path}
                stroke={color}
                strokeWidth="1"
                strokeOpacity="0.1"
                fill="none"
            />

            {/* Glowing Flow Line */}
            <motion.path
                d={path}
                stroke={`url(#gradient-${from.x}-${from.y})`}
                strokeWidth="2"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ 
                    pathLength: [0, 1, 0],
                    pathOffset: [0, 0, 1],
                    opacity: [0, 1, 0]
                }}
                transition={{
                    duration: duration * 2,
                    repeat: Infinity,
                    delay: delay,
                    ease: "easeInOut"
                }}
                filter="url(#glow)"
            />

            {/* Particles */}
            {Array.from({ length: particlesCount }).map((_, i) => (
                <DataParticle 
                    key={i} 
                    from={from} 
                    to={to} 
                    duration={duration} 
                    delay={delay + (i * (duration / particlesCount))} 
                    color={color}
                />
            ))}
        </svg>
    );
}
