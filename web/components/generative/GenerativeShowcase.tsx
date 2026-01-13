'use client';

import { useState } from 'react';
import * as THREE from 'three';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Center } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { NoiseDisplacementMaterial } from './NoiseDisplacementMaterial';
import { ZebraDistortionMaterial } from './ZebraDistortionMaterial';
import { SDFBooleanMaterial } from './SDFBooleanMaterial';
import { motion } from 'framer-motion';

function Scene({ mode }: { mode: 'noise' | 'zebra' | 'sdf' }) {
    const { size } = useThree();
    
    return (
        <>
            <PerspectiveCamera makeDefault position={[0, 0, 5]} />
            <OrbitControls enableDamping />
            
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            
            <Center>
                {mode === 'noise' && (
                    <mesh>
                        <sphereGeometry args={[1.5, 128, 128]} />
                        <NoiseDisplacementMaterial 
                            distortion={1.5} 
                            speed={0.5} 
                            intensity={0.8} 
                            color="#00ffcc" 
                        />
                    </mesh>
                )}
                
                {mode === 'zebra' && (
                    <mesh>
                        <torusKnotGeometry args={[1, 0.4, 256, 64]} />
                        <ZebraDistortionMaterial 
                            lines={20.0} 
                            distortion={2.0} 
                            speed={1.5} 
                            colorA="#000000" 
                            colorB="#00ffff" 
                        />
                    </mesh>
                )}
                
                {mode === 'sdf' && (
                    <mesh>
                        <planeGeometry args={[4, 4]} />
                        <SDFBooleanMaterial op={0} resolution={new THREE.Vector2(size.width, size.height)} />
                    </mesh>
                )}
            </Center>
        </>
    );
}

export default function GenerativeShowcase() {
    const [mode, setMode] = useState<'noise' | 'zebra' | 'sdf'>('noise');

    return (
        <div className="w-full h-full flex flex-col bg-black text-white">
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 flex gap-4 bg-white/10 p-2 rounded-full backdrop-blur-md border border-white/20">
                <button 
                    onClick={() => setMode('noise')}
                    className={`px-4 py-1 rounded-full transition-colors ${mode === 'noise' ? 'bg-cyan-500 text-black' : 'hover:bg-white/10'}`}
                >
                    Noise
                </button>
                <button 
                    onClick={() => setMode('zebra')}
                    className={`px-4 py-1 rounded-full transition-colors ${mode === 'zebra' ? 'bg-cyan-500 text-black' : 'hover:bg-white/10'}`}
                >
                    Zebra
                </button>
                <button 
                    onClick={() => setMode('sdf')}
                    className={`px-4 py-1 rounded-full transition-colors ${mode === 'sdf' ? 'bg-cyan-500 text-black' : 'hover:bg-white/10'}`}
                >
                    SDF Boolean
                </button>
            </div>

            <Canvas shadows className="flex-grow">
                <Scene mode={mode} />
            </Canvas>

            <div className="absolute bottom-10 left-10 max-w-md">
                <motion.div
                    key={mode}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-2 bg-black/40 p-6 rounded-2xl border border-white/10 backdrop-blur-xl"
                >
                    <h2 className="text-2xl font-bold capitalize">{mode} Material</h2>
                    <p className="text-slate-400">
                        {mode === 'noise' && "Vertex displacement using 3D Simplex noise. Creates organic, flowing forms that react to time."}
                        {mode === 'zebra' && "Fragment-based distortion using sine waves and pseudo-random noise. Inspired by high-contrast zebra patterns."}
                        {mode === 'sdf' && "Raymarched Signed Distance Fields with smooth boolean union. Real-time geometric intersection and blending."}
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
