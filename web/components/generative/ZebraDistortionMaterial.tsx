'use client';

import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame, ThreeElement } from '@react-three/fiber';
import { useRef } from 'react';

const ZebraDistortionMaterialImpl = shaderMaterial(
    {
        time: 0,
        colorA: new THREE.Color('#000000'),
        colorB: new THREE.Color('#ffffff'),
        lines: 10.0,
        distortion: 1.0,
        speed: 1.0,
    },
    // Vertex Shader
    `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `,
    // Fragment Shader
    `
    varying vec2 vUv;
    uniform float time;
    uniform vec3 colorA;
    uniform vec3 colorB;
    uniform float lines;
    uniform float distortion;
    uniform float speed;

    // Pseudo-random noise
    float rand(vec2 n) { 
        return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
    }

    float noise(vec2 p) {
        vec2 ip = floor(p);
        vec2 u = fract(p);
        u = u*u*(3.0-2.0*u);
        
        float res = mix(
            mix(rand(ip), rand(ip+vec2(1.0,0.0)), u.x),
            mix(rand(ip+vec2(0.0,1.0)), rand(ip+vec2(1.0,1.0)), u.x), u.y);
        return res*res;
    }

    void main() {
      vec2 uv = vUv;
      
      // Distort UVs with noise
      float n = noise(uv * distortion + time * speed * 0.2);
      
      // Create zebra patterns using sine wave on distorted UVs
      float pattern = sin((uv.y + n * 0.5) * lines * 3.14159);
      
      // Sharpen the stripes
      pattern = smoothstep(-0.1, 0.1, pattern);
      
      vec3 finalColor = mix(colorA, colorB, pattern);
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
    `
);

extend({ ZebraDistortionMaterial: ZebraDistortionMaterialImpl });

declare module '@react-three/fiber' {
  interface ThreeElements {
    zebraDistortionMaterial: ThreeElement<typeof ZebraDistortionMaterialImpl>;
  }
}

interface ZebraDistortionMaterialProps extends Partial<ThreeElement<typeof ZebraDistortionMaterialImpl>> {
    colorA?: THREE.Color | string;
    colorB?: THREE.Color | string;
    lines?: number;
    distortion?: number;
    speed?: number;
}

export function ZebraDistortionMaterial(props: ZebraDistortionMaterialProps) {
    const materialRef = useRef<THREE.ShaderMaterial & { time: number }>(null);

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.time = state.clock.getElapsedTime();
        }
    });

    return <zebraDistortionMaterial ref={materialRef} {...props} />;
}
