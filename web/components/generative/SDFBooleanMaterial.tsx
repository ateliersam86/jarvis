'use client';

import * as THREE from 'three';
import { shaderMaterial } from '@react-three/drei';
import { extend, useFrame, ThreeElement } from '@react-three/fiber';
import { useRef } from 'react';

const SDFBooleanMaterialImpl = shaderMaterial(
    {
        time: 0,
        resolution: new THREE.Vector2(1, 1),
        op: 0, // 0: Union, 1: Subtraction, 2: Intersection
        colorA: new THREE.Color('#ff0066'),
        colorB: new THREE.Color('#00ffff'),
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
    uniform vec2 resolution;
    uniform int op;
    uniform vec3 colorA;
    uniform vec3 colorB;

    const int MAX_STEPS = 100;
    const float MAX_DIST = 100.0;
    const float SURF_DIST = 0.001;

    // SDF functions
    float sdSphere(vec3 p, float s) {
        return length(p) - s;
    }

    float sdBox(vec3 p, vec3 b) {
        vec3 q = abs(p) - b;
        return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
    }

    // Boolean operations
    float opUnion(float d1, float d2) { return min(d1, d2); }
    float opSubtraction(float d1, float d2) { return max(-d1, d2); }
    float opIntersection(float d1, float d2) { return max(d1, d2); }

    // Smooth operations
    float opSmoothUnion(float d1, float d2, float k) {
        float h = clamp(0.5 + 0.5 * (d2 - d1) / k, 0.0, 1.0);
        return mix(d2, d1, h) - k * h * (1.0 - h);
    }

    float GetDist(vec3 p) {
        vec3 p1 = p - vec3(sin(time) * 0.5, 0, 0);
        float sphere = sdSphere(p1, 0.75);
        
        vec3 p2 = p + vec3(sin(time) * 0.5, 0, 0);
        // Rotate box
        float s = sin(time * 0.5);
        float c = cos(time * 0.5);
        mat2 rot = mat2(c, -s, s, c);
        p2.xz *= rot;
        p2.xy *= rot;
        
        float box = sdBox(p2, vec3(0.6));
        
        float d;
        if (op == 0) d = opSmoothUnion(sphere, box, 0.2);
        else if (op == 1) d = opSubtraction(sphere, box);
        else d = opIntersection(sphere, box);
        
        return d;
    }

    float RayMarch(vec3 ro, vec3 rd) {
        float dO = 0.0;
        for(int i=0; i<MAX_STEPS; i++) {
            vec3 p = ro + rd * dO;
            float dS = GetDist(p);
            dO += dS;
            if(dO > MAX_DIST || dS < SURF_DIST) break;
        }
        return dO;
    }

    vec3 GetNormal(vec3 p) {
        float d = GetDist(p);
        vec2 e = vec2(0.01, 0);
        vec3 n = d - vec3(
            GetDist(p-e.xyy),
            GetDist(p-e.yxy),
            GetDist(p-e.yyx));
        return normalize(n);
    }

    void main() {
        vec2 uv = (vUv - 0.5) * 2.0;
        float aspect = resolution.x / resolution.y;
        uv.x *= aspect;
        
        vec3 ro = vec3(0, 0, -3); // Ray origin
        vec3 rd = normalize(vec3(uv, 1)); // Ray direction

        float d = RayMarch(ro, rd);
        
        vec3 color = vec3(0.05); // Background

        if(d < MAX_DIST) {
            vec3 p = ro + rd * d;
            vec3 n = GetNormal(p);
            float dif = dot(n, normalize(vec3(1, 2, 3))) * 0.5 + 0.5;
            
            // Basic coloring based on normal and position
            vec3 baseColor = mix(colorA, colorB, n.y * 0.5 + 0.5);
            color = baseColor * dif;
            
            // Add some "rim" lighting
            float rim = 1.0 - max(dot(n, -rd), 0.0);
            color += pow(rim, 3.0) * colorB;
        }

        gl_FragColor = vec4(color, 1.0);
    }
    `
);

extend({ SDFBooleanMaterial: SDFBooleanMaterialImpl });

declare module '@react-three/fiber' {
  interface ThreeElements {
    sDFBooleanMaterial: ThreeElement<typeof SDFBooleanMaterialImpl>;
  }
}

interface SDFBooleanMaterialProps extends Partial<ThreeElement<typeof SDFBooleanMaterialImpl>> {
    resolution?: THREE.Vector2;
    op?: number;
    colorA?: THREE.Color | string;
    colorB?: THREE.Color | string;
}

export function SDFBooleanMaterial(props: SDFBooleanMaterialProps) {
    const materialRef = useRef<THREE.ShaderMaterial & { time: number; resolution: THREE.Vector2 }>(null);

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.time = state.clock.getElapsedTime();
            if (props.resolution) {
                materialRef.current.resolution.copy(props.resolution);
            }
        }
    });

    return <sDFBooleanMaterial ref={materialRef} {...props} />;
}
