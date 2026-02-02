'use client';

import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stage, Float } from '@react-three/drei';
import * as THREE from 'three';
import { UnlockableItemType } from '@/context/UnlockedItemsContext';

function CarModel(props: any) {
    return (
        <group {...props}>
            <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[2, 0.5, 1]} />
                <meshStandardMaterial color="red" roughness={0.3} metalness={0.8} />
            </mesh>
            <mesh position={[0, 1, 0]}>
                <boxGeometry args={[1, 0.5, 0.8]} />
                <meshStandardMaterial color="#444" />
            </mesh>
            <mesh position={[-0.8, 0.25, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 0.1]} />
                <meshStandardMaterial color="black" />
            </mesh>
            <mesh position={[0.8, 0.25, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 0.1]} />
                <meshStandardMaterial color="black" />
            </mesh>
            <mesh position={[-0.8, 0.25, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 0.1]} />
                <meshStandardMaterial color="black" />
            </mesh>
            <mesh position={[0.8, 0.25, -0.5]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.2, 0.2, 0.1]} />
                <meshStandardMaterial color="black" />
            </mesh>
        </group>
    )
}

function PlaneModel(props: any) {
    return (
        <group {...props}>
            <mesh rotation={[0, 0, Math.PI / 2]}>
                <capsuleGeometry args={[0.4, 2, 4, 8]} />
                <meshStandardMaterial color="white" />
            </mesh>
            <mesh position={[0, 0, 0]}>
                <boxGeometry args={[0.5, 0.1, 3]} />
                <meshStandardMaterial color="#3498db" />
            </mesh>
            <mesh position={[-0.8, 0.5, 0]}>
                <boxGeometry args={[0.5, 0.8, 0.1]} />
                <meshStandardMaterial color="#3498db" />
            </mesh>
        </group>
    )
}

function TrainModel(props: any) {
    return (
        <group {...props}>
            <mesh position={[0, 0.6, 0]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.5, 0.5, 2]} />
                <meshStandardMaterial color="#2c3e50" />
            </mesh>
            <mesh position={[0.8, 0.3, 0]}>
                <boxGeometry args={[1, 0.6, 1.1]} />
                <meshStandardMaterial color="#c0392b" />
            </mesh>
            <mesh position={[-0.5, 1.2, 0]}>
                <cylinderGeometry args={[0.2, 0.1, 0.6]} />
                <meshStandardMaterial color="#2c3e50" />
            </mesh>
        </group>
    )
}

function GenericBox(props: any) {
    const mesh = useRef<THREE.Mesh>(null);
    useFrame((state, delta) => {
        if (mesh.current) mesh.current.rotation.y += delta;
    });
    return (
        <mesh ref={mesh} {...props}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="gold" metalness={1} roughness={0.2} />
        </mesh>
    );
}

const MODELS: Record<UnlockableItemType | string, React.FC<any>> = {
    car: CarModel,
    plane: PlaneModel,
    train: TrainModel,
    ship: GenericBox // Placeholder
};

export const ItemViewer = ({ type }: { type: UnlockableItemType }) => {
    const Model = MODELS[type] || GenericBox;

    return (
        <div style={{ width: '100%', height: '300px', background: 'transparent' }}>
            <Canvas shadows dpr={[1, 2]} camera={{ fov: 50 }}>
                <Stage environment="city" intensity={0.6}>
                    <Float speed={2} rotationIntensity={1} floatIntensity={1}>
                        <Model />
                    </Float>
                </Stage>
                <OrbitControls autoRotate />
            </Canvas>
        </div>
    );
};
