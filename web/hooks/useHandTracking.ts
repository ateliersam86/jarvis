'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Hands, Results, LandmarkList } from '@mediapipe/hands';

export interface HandMetrics {
    distance: number;      // Pinch distance (0 to 1)
    rotation: number;      // Palm rotation (normalized)
    velocity: number;      // Hand movement velocity
    isTracking: boolean;
    palmCenter: { x: number; y: number; z: number };
}

export function useHandTracking(videoRef: React.RefObject<HTMLVideoElement | null>) {
    const [metrics, setMetrics] = useState<HandMetrics>({
        distance: 0,
        rotation: 0,
        velocity: 0,
        isTracking: false,
        palmCenter: { x: 0.5, y: 0.5, z: 0 },
    });

    const handsRef = useRef<Hands | null>(null);
    const lastPalmCenterRef = useRef<{ x: number; y: number; z: number } | null>(null);
    const lastTimestampRef = useRef<number>(0);

    const onResults = useCallback((results: Results) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks: LandmarkList = results.multiHandLandmarks[0];

            // 1. Pinch Distance (Thumb tip index 4 to Index tip index 8)
            const thumbTip = landmarks[4];
            const indexTip = landmarks[8];
            const pinchDist = Math.sqrt(
                Math.pow(thumbTip.x - indexTip.x, 2) +
                Math.pow(thumbTip.y - indexTip.y, 2) +
                Math.pow(thumbTip.z - indexTip.z, 2)
            );
            // Normalize pinch distance (roughly 0.02 to 0.2)
            const normalizedPinch = Math.max(0, Math.min(1, (pinchDist - 0.02) / 0.15));

            // 2. Palm Rotation
            // We can use the vector from wrist (0) to middle finger base (9) 
            // and the vector from index finger base (5) to pinky finger base (17)
            const wrist = landmarks[0];
            const middleBase = landmarks[9];
            const indexBase = landmarks[5];
            const pinkyBase = landmarks[17];

            // Vertical orientation
            const dy = middleBase.y - wrist.y;
            const dx = middleBase.x - wrist.x;
            const angle = Math.atan2(dy, dx) + Math.PI / 2; // Offset so up is 0

            // 3. Palm Center & Velocity
            const palmCenter = {
                x: (wrist.x + indexBase.x + pinkyBase.x + middleBase.x) / 4,
                y: (wrist.y + indexBase.y + pinkyBase.y + middleBase.y) / 4,
                z: (wrist.z + indexBase.z + pinkyBase.z + middleBase.z) / 4,
            };

            const now = performance.now();
            let velocity = 0;
            if (lastPalmCenterRef.current && lastTimestampRef.current) {
                const dt = (now - lastTimestampRef.current) / 1000;
                if (dt > 0) {
                    const distMoved = Math.sqrt(
                        Math.pow(palmCenter.x - lastPalmCenterRef.current.x, 2) +
                        Math.pow(palmCenter.y - lastPalmCenterRef.current.y, 2)
                    );
                    velocity = distMoved / dt;
                }
            }

            lastPalmCenterRef.current = palmCenter;
            lastTimestampRef.current = now;

            setMetrics({
                distance: 1 - normalizedPinch, // Invert so close = high
                rotation: angle,
                velocity: Math.min(1, velocity * 2), // Cap and scale
                isTracking: true,
                palmCenter,
            });
        } else {
            setMetrics(prev => ({ ...prev, isTracking: false }));
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        let camera: { start(): Promise<void>; stop(): void } | null = null;

        async function setupMediaPipe() {
            // Guard against SSR and missing mediaDevices API
            if (typeof window === 'undefined' || !navigator?.mediaDevices?.getUserMedia) {
                console.warn('[useHandTracking] MediaDevices API not available');
                return;
            }

            const { Hands } = await import('@mediapipe/hands');
            const { Camera } = await import('@mediapipe/camera_utils');

            if (!isMounted) return;

            const hands = new Hands({
                locateFile: (file) => {
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                },
            });

            hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5,
            });

            hands.onResults(onResults);
            handsRef.current = hands;

            if (videoRef.current) {
                camera = new Camera(videoRef.current, {
                    onFrame: async () => {
                        if (videoRef.current && handsRef.current) {
                            await handsRef.current.send({ image: videoRef.current });
                        }
                    },
                    width: 640,
                    height: 480,
                });
                camera.start();
            }
        }

        setupMediaPipe();

        return () => {
            isMounted = false;
            if (camera) camera.stop();
            if (handsRef.current) handsRef.current.close();
        };
    }, [videoRef, onResults]);

    return metrics;
}
