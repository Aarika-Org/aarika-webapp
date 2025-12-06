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
    <div className="absolute inset-0 z-0 opacity-100 pointer-events-none overflow-hidden">
      {/* Left Side - Full coverage */}
      <div className="absolute top-0 left-0 w-[45%] h-full">
        <Canvas camera={{ position: [0, 0, 10] }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[10, 10, 5]} intensity={1} />

          {/* Far left edge shapes */}
          <FloatingShape position={[-7, 3, -2]} color="#ff90e8" type="torus" scale={1.0} rotation={[1, 1, 0]} />
          <FloatingShape position={[-8, -2, -3]} color="#ffc900" type="sphere" scale={0.8} />
          <FloatingShape position={[-6, -5, -2]} color="#3290FF" type="box" scale={0.7} rotation={[0.3, 0.2, 0.1]} />

          {/* Middle left shapes */}
          <FloatingShape position={[-4, 5, -1]} color="#27E8A7" type="sphere" scale={0.9} />
          <FloatingShape position={[-3, 1, -2]} color="#3290FF" type="box" scale={0.8} rotation={[0.5, 0.5, 0]} />
          <FloatingShape position={[-5, -1, -3]} color="#ff90e8" type="torus" scale={0.7} rotation={[0.5, 0, 0.5]} />

          {/* Near center shapes */}
          <FloatingShape position={[-1, 4, -2]} color="#ffc900" type="box" scale={0.6} rotation={[0.1, 0.3, 0.2]} />
          <FloatingShape position={[-2, -3, -2]} color="#27E8A7" type="torus" scale={0.6} rotation={[0, 1, 0]} />
          <FloatingShape position={[-1, 7, -4]} color="#ff90e8" type="sphere" scale={0.5} />
          <FloatingShape position={[-3, -6, -3]} color="#3290FF" type="sphere" scale={0.5} />
        </Canvas>
      </div>

      {/* Right Side - Full coverage */}
      <div className="absolute top-0 right-0 w-[45%] h-full">
        <Canvas camera={{ position: [0, 0, 10] }}>
          <ambientLight intensity={0.8} />
          <directionalLight position={[-10, 10, 5]} intensity={1} />

          {/* Far right edge shapes */}
          <FloatingShape position={[7, 3, -2]} color="#ffc900" type="sphere" scale={1.2} />
          <FloatingShape position={[8, -2, -3]} color="#27E8A7" type="box" scale={0.8} rotation={[0.2, 0.4, 0.1]} />
          <FloatingShape position={[6, -5, -2]} color="#ff90e8" type="torus" scale={0.7} rotation={[0.5, 0, 0]} />

          {/* Middle right shapes */}
          <FloatingShape position={[4, 5, -1]} color="#3290FF" type="box" scale={0.9} rotation={[0.2, 0.1, 0.3]} />
          <FloatingShape position={[3, 1, -2]} color="#ff90e8" type="torus" scale={0.8} rotation={[1, 0, 0]} />
          <FloatingShape position={[5, -1, -3]} color="#ffc900" type="sphere" scale={0.7} />

          {/* Near center shapes */}
          <FloatingShape position={[1, 4, -2]} color="#27E8A7" type="sphere" scale={0.6} />
          <FloatingShape position={[2, -3, -2]} color="#3290FF" type="box" scale={0.6} rotation={[0.5, 0.5, 0]} />
          <FloatingShape position={[1, 7, -4]} color="#ffc900" type="torus" scale={0.5} rotation={[0, 0.5, 0.5]} />
          <FloatingShape position={[3, -6, -3]} color="#ff90e8" type="sphere" scale={0.5} />
        </Canvas>
      </div>
    </div>
  );
};

export default AbstractBackground;
