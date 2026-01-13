'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Canvas, useFrame, extend, ThreeElement } from '@react-three/fiber';
import { OrbitControls, Sphere, MeshDistortMaterial, Environment } from '@react-three/drei';
import { EffectComposer, Glitch, Bloom, ChromaticAberration, Noise, Vignette } from '@react-three/postprocessing';
import { GlitchMode, BlendFunction } from 'postprocessing';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, Hand } from 'lucide-react';
import * as THREE from 'three';
import { ShaderMaterial } from 'three';
// @ts-expect-error - AfterimagePass is not typed in three examples
import { AfterimagePass } from 'three/examples/jsm/postprocessing/AfterimagePass';
import ExperienceDashboard from '@/components/ExperienceDashboard';
import { useHandTracking, type HandMetrics } from '@/hooks/useHandTracking';

// Register AfterimagePass for R3F
extend({ AfterimagePass });

declare module '@react-three/fiber' {
    interface ThreeElements {
        afterimagePass: ThreeElement<typeof AfterimagePass>;
    }
}

const booleanVertexShader = `
varying vec2 vUv;
varying vec3 vPosition;
void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const booleanFragmentShader = `
uniform float uTime;
uniform float uDist;
uniform float uRot;
uniform vec2 uResolution;
uniform vec3 uColorA;
uniform vec3 uColorB;

varying vec2 vUv;
varying vec3 vPosition;

// SDF Primitives
float sdSphere(vec3 p, float s) {
  return length(p) - s;
}

float sdBox(vec3 p, vec3 b) {
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

// Smooth Boolean Operations
float opSmoothUnion(float d1, float d2, float k) {
    float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) - k * h * (1.0 - h);
}

float opSmoothSub(float d1, float d2, float k) {
    float h = clamp(0.5 - 0.5 * (d2 + d1) / k, 0.0, 1.0);
    return mix(d2, -d1, h) + k * h * (1.0 - h);
}

float opSmoothInt(float d1, float d2, float k) {
    float h = clamp(0.5 - 0.5 * (d2 - d1) / k, 0.0, 1.0);
    return mix(d2, d1, h) + k * h * (1.0 - h);
}

// Rotation Matrix
mat2 rot(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
}

// Scene Mapping
float map(vec3 p) {
    vec3 p1 = p;
    vec3 p2 = p;
    
    // Rotate entire world slowly + hand rotation
    p1.xz *= rot(uTime * 0.5 + uRot * 2.0);
    p1.xy *= rot(uTime * 0.3);
    
    p2.xz *= rot(uTime * 0.2 - uRot);
    
    // Primitive 1: Sphere (pulsing)
    float sphere = sdSphere(p1, 1.0 + sin(uTime) * 0.1);
    
    // Primitive 2: Box (distorted by hand distance)
    // Map uDist (0..1) to box size or position
    float boxSize = 0.8 + uDist * 0.5;
    float box = sdBox(p2 - vec3(sin(uTime)*0.5, 0.0, 0.0), vec3(boxSize));
    
    // Dynamic Boolean Op based on time
    float d = opSmoothSub(box, sphere, 0.1 + uDist * 0.2);
    
    // Add some noise displacement for "liquid" look
    d += sin(p.x * 10.0 + uTime) * 0.02;
    
    return d;
}

vec3 getNormal(vec3 p) {
    const vec2 e = vec2(0.001, 0.0);
    return normalize(vec3(
        map(p + e.xyy) - map(p - e.xyy),
        map(p + e.yxy) - map(p - e.yxy),
        map(p + e.yyx) - map(p - e.yyx)
    ));
}

void main() {
    // Raymarching inside the cube volume (approximate)
    // Since we are rendering on a sphere or a box in Three.js, we use local coords
    // But to make it look like a volumetric window, we can just map the 3D position
    
    vec3 rd = normalize(vPosition - vec3(0.0, 0.0, 2.0)); // Fake camera
    vec3 ro = vec3(0.0, 0.0, 3.0); // Fake origin
    
    // Actually, let's just use the vPosition as the coordinate directly for a "texture" 3D effect
    // To do true raymarching, we need a fullscreen quad, but we are inside a Mesh.
    // Let's do a "SDF Pattern" on the surface of the mesh instead, simpler and performant.
    
    vec3 p = vPosition * 2.0; // Scale coords
    
    float d = map(p);
    
    // Visualizing the Distance Field
    vec3 col = vec3(0.0);
    
    if (d < 0.001) {
        col = uColorA;
    } else {
        // Isoline strips
        float strips = sin(d * 40.0 - uTime * 5.0);
        col = mix(uColorB, uColorA, smoothstep(0.9, 1.0, strips));
    }
    
    // Fake lighting
    vec3 n = getNormal(p);
    vec3 light = normalize(vec3(1.0, 1.0, 1.0));
    float diff = max(dot(n, light), 0.0);
    
    col *= (0.5 + 0.5 * diff);
    
    // Rim light
    float rim = 1.0 - max(dot(n, vec3(0.0, 0.0, 1.0)), 0.0);
    col += vec3(0.0, 1.0, 1.0) * pow(rim, 3.0) * 0.5;
    
    gl_FragColor = vec4(col, 1.0);
}
`;

function SDFBooleanShape({ metrics }: { metrics: HandMetrics }) {
    const materialRef = useRef<ShaderMaterial>(null);

    useFrame(({ clock }) => {
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
            materialRef.current.uniforms.uDist.value = THREE.MathUtils.lerp(
                materialRef.current.uniforms.uDist.value,
                metrics.distance,
                0.1
            );
            materialRef.current.uniforms.uRot.value = THREE.MathUtils.lerp(
                materialRef.current.uniforms.uRot.value,
                metrics.rotation,
                0.1
            );
        }
    });

    return (
        <Sphere args={[1.5, 64, 64]}>
            <shaderMaterial
                ref={materialRef}
                vertexShader={booleanVertexShader}
                fragmentShader={booleanFragmentShader}
                uniforms={{
                    uTime: { value: 0 },
                    uDist: { value: 0 },
                    uRot: { value: 0 },
                    uColorA: { value: new THREE.Color('#00ffff') },
                    uColorB: { value: new THREE.Color('#ff00ff') }
                }}
            />
        </Sphere>
    );
}

// FPS Counter utility
function FPSCounter({ onFPS }: { onFPS: (fps: number) => void }) {
    const frames = useRef(0);
    const prevTime = useRef(0);

    useEffect(() => {
        prevTime.current = performance.now();
    }, []);

    useFrame(() => {
        frames.current++;
        const time = performance.now();
        if (time >= prevTime.current + 1000) {
            onFPS(Math.round((frames.current * 1000) / (time - prevTime.current)));
            frames.current = 0;
            prevTime.current = time;
        }
    });

    return null;
}

// Animated sphere that responds to hand metrics
function DefaultReactiveShape({ metrics, mode }: { metrics: HandMetrics, mode: string }) {
    const meshRef = useRef<THREE.Mesh>(null);
    const [hue, setHue] = useState(0);

    useFrame((_state) => {
        if (meshRef.current) {
            // Scale based on finger distance (pinch gesture)
            const baseScale = mode === 'glitch' ? 1.5 : 1;
            const scale = (baseScale + metrics.distance * 2.5) * (mode === 'glitch' ? 0.9 + Math.random() * 0.2 : 1);
            meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);

            // Rotation based on hand rotation + velocity
            const rotSpeed = mode === 'particle' ? 0.05 : 0.01;
            meshRef.current.rotation.x += rotSpeed + (metrics.velocity * 0.1);
            meshRef.current.rotation.y += (rotSpeed * 2) + (metrics.rotation * 0.05);

            // Position based on palm center
            if (metrics.isTracking) {
                const targetX = (metrics.palmCenter.x - 0.5) * 12;
                const targetY = -(metrics.palmCenter.y - 0.5) * 12;
                meshRef.current.position.x = THREE.MathUtils.lerp(meshRef.current.position.x, targetX, 0.1);
                meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, targetY, 0.1);
            }

            // Color shift over time
            setHue((prev) => (prev + 0.001 + metrics.velocity * 0.01) % 1);
        }
    });

    const color = useMemo(() => new THREE.Color().setHSL(hue, 0.8, 0.5), [hue]);

    return (
        <Sphere ref={meshRef} args={[1, 64, 64]} position={[0, 0, 0]}>
            <MeshDistortMaterial
                color={color}
                attach="material"
                distort={mode === 'particle' ? 0.1 : 0.3 + metrics.distance * 0.7}
                speed={mode === 'glitch' ? 5 : 2 + metrics.velocity * 5}
                roughness={mode === 'glitch' ? 0.1 : 0.2}
                metalness={0.8}
            />
        </Sphere>
    );
}

function ReactiveShape({ metrics, mode }: { metrics: HandMetrics, mode: string }) {
    if (mode === 'boolean') {
        return <SDFBooleanShape metrics={metrics} />;
    }

    return <DefaultReactiveShape metrics={metrics} mode={mode} />;
}

// Orbiting particles
function Particles({ count = 200, metrics, mode }: { count?: number; metrics: HandMetrics, mode: string }) {
    const points = useRef<THREE.Points>(null);

    const [positions] = useState(() => {
        const p = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            p[i * 3] = (Math.random() - 0.5) * 15;
            p[i * 3 + 1] = (Math.random() - 0.5) * 15;
            p[i * 3 + 2] = (Math.random() - 0.5) * 15;
        }
        return p;
    });

    useFrame((_state) => {
        if (points.current) {
            const rotMult = mode === 'particle' ? 3 : 1;
            points.current.rotation.y += (0.001 + metrics.velocity * 0.05) * rotMult;
            points.current.rotation.x += (0.0005 + metrics.distance * 0.01) * rotMult;
        }
    });

    return (
        <points ref={points}>
            <bufferGeometry>
                <bufferAttribute
                    attach="attributes-position"
                    args={[positions, 3]}
                />
            </bufferGeometry>
            <pointsMaterial
                size={mode === 'particle' ? 0.12 : 0.06}
                color={metrics.isTracking ? (mode === 'glitch' ? '#ff00ff' : '#00ffff') : '#444444'}
                transparent
                opacity={0.6}
                sizeAttenuation
            />
        </points>
    );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TypedEffectComposer = EffectComposer as any;

// Scene with post-processing effects
function Scene({ metrics, mode, onFPS }: { metrics: HandMetrics, mode: string, onFPS: (fps: number) => void }) {
    const afterimageRef = useRef<AfterimagePass>(null);

    // Optimize afterimage dampening based on velocity
    useFrame(() => {
        if (afterimageRef.current) {
            // Trails persist longer when moving fast, creating a 'ghosting' effect
            const targetDamp = 0.8 + Math.min(0.16, metrics.velocity * 4);
            afterimageRef.current.uniforms['damp'].value = THREE.MathUtils.lerp(
                afterimageRef.current.uniforms['damp'].value,
                targetDamp,
                0.1
            );
        }
    });

    return (
        <>
            <FPSCounter onFPS={onFPS} />
            <ambientLight intensity={0.2} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#ffffff" />
            <pointLight position={[-10, -10, -5]} intensity={0.5} color="#00ffff" />

            <ReactiveShape metrics={metrics} mode={mode} />
            <Particles metrics={metrics} mode={mode} count={mode === 'particle' ? 500 : 100} />

            <Environment preset="night" />
            <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={mode === 'particle' ? 2 : 0.5} />

            <TypedEffectComposer multisampling={0} disableNormalPass>
                {/* Custom Afterimage/Trails for hand movement */}
                <afterimagePass ref={afterimageRef} args={[0.8]} />

                <Bloom
                    intensity={mode === 'glitch' ? 2.5 : 1.5 + metrics.velocity * 3}
                    luminanceThreshold={0.25}
                    luminanceSmoothing={0.9}
                />

                <Glitch
                    delay={new THREE.Vector2(mode === 'glitch' ? 0.2 : 1.5, 3.5)}
                    duration={new THREE.Vector2(0.1, mode === 'glitch' ? 0.8 : 0.3)}
                    strength={new THREE.Vector2(
                        0.1 + metrics.velocity * 0.8,
                        0.2 + metrics.velocity * 1.2
                    )}
                    // Reactive triggers: CONSTANT mode when moving fast
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    mode={metrics.velocity > 0.05 || mode === 'glitch' ? (GlitchMode as any).CONSTANT : GlitchMode.SPORADIC}
                    active={metrics.isTracking}
                    ratio={0.85}
                />

                <ChromaticAberration
                    blendFunction={BlendFunction.NORMAL}
                    // Chromatic aberration scales with distance (pinch/proximity)
                    offset={new THREE.Vector2(0.002 + metrics.distance * 0.015, 0.002 + metrics.distance * 0.015)}
                />

                <Noise opacity={0.05 + metrics.velocity * 0.2} />
                <Vignette eskil={false} offset={0.1} darkness={0.6} />
            </TypedEffectComposer>
        </>
    );
}

// Main Experience page
export default function ExperiencePage() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [activeMode, setActiveMode] = useState('default');
    const [fps, setFps] = useState(0);

    const realMetrics = useHandTracking(videoRef);

    const [idleMetrics, setIdleMetrics] = useState<HandMetrics>({
        distance: 0.2,
        rotation: 0,
        velocity: 0,
        isTracking: false,
        palmCenter: { x: 0.5, y: 0.5, z: 0 },
    });

    useEffect(() => {
        if (isCameraActive && realMetrics.isTracking) return;

        const interval = setInterval(() => {
            setIdleMetrics(prev => ({
                ...prev,
                rotation: prev.rotation + 0.01,
                distance: 0.2 + Math.sin(Date.now() * 0.001) * 0.1,
            }));
        }, 16);
        return () => clearInterval(interval);
    }, [isCameraActive, realMetrics.isTracking]);

    const metrics = (isCameraActive && realMetrics.isTracking) ? realMetrics : idleMetrics;

    const toggleCamera = useCallback(() => {
        setIsCameraActive(prev => !prev);
    }, []);

    return (
        <div className="relative w-full h-screen bg-black overflow-hidden">
            {/* Header */}
            <header className="absolute top-0 left-0 right-0 z-30 p-6 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-4 pointer-events-auto">
                    <Link
                        href="/"
                        className="p-2 bg-slate-900/50 hover:bg-slate-800 rounded-lg border border-white/10 backdrop-blur-md transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-slate-400" />
                    </Link>
                    <div className="hidden md:block">
                        <h1 className="text-xl font-bold text-white uppercase tracking-tighter">Neuromancer</h1>
                        <p className="text-xs text-cyan-500 uppercase tracking-widest font-bold">Neural Interface v2.0</p>
                    </div>
                </div>
            </header>

            {/* 3D Canvas */}
            <Canvas
                camera={{ position: [0, 0, 8], fov: 50 }}
                className="absolute inset-0"
            >
                <Scene
                    metrics={metrics}
                    mode={activeMode}
                    onFPS={setFps}
                />
            </Canvas>

            {/* Premium Dashboard Overlay */}
            <ExperienceDashboard
                metrics={metrics}
                isCameraActive={isCameraActive}
                onToggleCamera={toggleCamera}
                activeMode={activeMode}
                onModeChange={setActiveMode}
                fps={fps}
                videoRef={videoRef}
            />

            {/* Instructions */}
            <AnimatePresence>
                {!isCameraActive && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-20"
                    >
                        <div className="bg-slate-900/40 backdrop-blur-3xl p-12 rounded-[3rem] border border-white/10 shadow-2xl">
                            <div className="w-20 h-20 bg-cyan-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-cyan-500/20">
                                <Hand className="w-10 h-10 text-cyan-400" />
                            </div>
                            <h2 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Initialize Interface</h2>
                            <p className="text-slate-400 mb-8 max-w-xs mx-auto text-sm font-medium">
                                Grant camera access to enable neural hand tracking and interactive visual synthesis.
                            </p>
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={toggleCamera}
                                className="px-10 py-4 bg-white text-black rounded-2xl font-black text-lg shadow-2xl transition-all hover:bg-cyan-400"
                            >
                                START SCAN
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
