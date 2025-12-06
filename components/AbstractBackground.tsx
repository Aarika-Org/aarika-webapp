import React from 'react';
import { Canvas } from '@react-three/fiber';
import { Float, Sphere, Box, Torus } from '@react-three/drei';

const FloatingShape = ({ position, color, type, scale = 1, rotation = [0, 0, 0] }: { position: [number, number, number], color: string, type: 'sphere' | 'box' | 'torus', scale?: number, rotation?: [number, number, number] }) => {
  return (
    <Float speed={2} rotationIntensity={1} floatIntensity={2}>
      <mesh position={position} scale={scale} rotation={rotation as any}>
        {type === 'sphere' && <Sphere args={[1, 32, 32]} />}
        {type === 'box' && <Box args={[1.5, 1.5, 1.5]} />}
        {type === 'torus' && <Torus args={[1, 0.4, 16, 32]} />}
        <meshStandardMaterial
          color={color}
          roughness={0.3}
          metalness={0.1}
        />
        {/* Black Outline */}
        <meshBasicMaterial color="black" wireframe />
      </mesh>
    </Float>
  );
};

const AbstractBackground: React.FC = () => {
  return (
    <div className="absolute inset-0 z-0 opacity-100 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 10] }}>
        <ambientLight intensity={0.8} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} />

        {/* Left Side Shapes */}
        <FloatingShape position={[-7, 3, -2]} color="#ff90e8" type="torus" scale={1.5} rotation={[1, 1, 0]} />
        <FloatingShape position={[-6, -4, -4]} color="#3290FF" type="box" scale={1.2} rotation={[0.5, 0.5, 0]} />

        {/* Right Side Shapes */}
        <FloatingShape position={[7, -2, -2]} color="#ffc900" type="sphere" scale={1.8} />
        <FloatingShape position={[6, 4, -4]} color="#27E8A7" type="box" scale={1} rotation={[0.2, 0.4, 0.1]} />

        {/* Center/Background Shapes */}
        <FloatingShape position={[0, 6, -8]} color="#ff90e8" type="sphere" scale={0.8} />
        <FloatingShape position={[0, -6, -8]} color="#ffc900" type="torus" scale={1} rotation={[1, 0, 0]} />

      </Canvas>
    </div>
  );
};

export default AbstractBackground;
