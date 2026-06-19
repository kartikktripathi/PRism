"use client";

import React, { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { cn } from "../../lib/utils";

const DEFAULT_THEME = {
  background: 0x000000,
  gridColor: 0x333333,
  accentColor: 0xf00589,
};

interface OceanMeshProps {
  geoSize: number;
  geoFragments: number;
  waveAmplitude: number;
  waveSpeed: number;
  accentColor: number;
  showWireframe: boolean;
  opacity: number;
}

function OceanMesh({
  geoSize,
  geoFragments,
  waveAmplitude,
  waveSpeed,
  accentColor,
  showWireframe,
  opacity,
}: OceanMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const wireRef = useRef<THREE.Mesh>(null);

  const { geometry, waves } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(
      geoSize,
      geoSize,
      geoFragments,
      geoFragments,
    );
    const positionAttribute = geo.getAttribute("position");
    const waveData: Array<{
      x: number;
      y: number;
      z: number;
      ang: number;
      amp: number;
      speed: number;
    }> = [];

    for (let i = 0; i < positionAttribute.count; i++) {
      waveData.push({
        x: positionAttribute.getX(i),
        y: positionAttribute.getY(i),
        z: positionAttribute.getZ(i),
        ang: Math.PI * 2,
        amp: Math.random() * waveAmplitude,
        speed: 0.03 + Math.random() * waveSpeed,
      });
    }

    return { geometry: geo, waves: waveData };
  }, [geoSize, geoFragments, waveAmplitude, waveSpeed]);

  useFrame(() => {
    if (!meshRef.current) return;

    const positionAttribute = meshRef.current.geometry.getAttribute("position");

    for (let i = 0; i < positionAttribute.count; i++) {
      const wave = waves[i];
      positionAttribute.setX(i, wave.x + Math.cos(wave.ang) * wave.amp);
      positionAttribute.setY(i, wave.y + Math.sin(wave.ang / 2) * wave.amp);
      positionAttribute.setZ(i, wave.z + Math.cos(wave.ang / 3) * wave.amp);
      wave.ang += wave.speed;
    }

    positionAttribute.needsUpdate = true;
  });

  const wireframeMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: accentColor,
        wireframe: true,
        transparent: false,
        opacity: 1,
      }),
    [accentColor],
  );

  const surfaceMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: accentColor,
        transparent: true,
        opacity: opacity,
        wireframe: false,
      }),
    [accentColor, opacity],
  );

  return (
    <group rotation={[(-90 * Math.PI) / 180, 0, 0]}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        material={surfaceMaterial}
        receiveShadow
      />
      {showWireframe && (
        <mesh ref={wireRef} geometry={geometry} material={wireframeMaterial} />
      )}
    </group>
  );
}

interface BoatData {
  position: [number, number, number];
  scale: [number, number, number];
  rotationY: number;
  vel: number;
  amp: number;
  pos: number;
}

function Boat({ data, color }: { data: BoatData; color: number }) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const time = clock.getElapsedTime() * 3;

    meshRef.current.rotation.z =
      (Math.sin(time / data.vel) * data.amp * Math.PI) / 180;
    meshRef.current.rotation.x = (Math.cos(time) * data.vel * Math.PI) / 180;
    meshRef.current.position.y = Math.sin(time / data.vel) * data.pos;
  });

  return (
    <mesh
      ref={meshRef}
      position={data.position}
      rotation={[0, data.rotationY, 0]}
      scale={data.scale}
      castShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function BoatGroup({
  count,
  spreadRange,
  color,
}: {
  count: number;
  spreadRange: number;
  color: number;
}) {
  const boats = useMemo(() => {
    const items: BoatData[] = [];
    for (let i = 0; i < count; i++) {
      const x = -Math.random() * spreadRange + Math.random() * spreadRange;
      const z = -Math.random() * spreadRange + Math.random() * spreadRange;
      const sX = Math.random();
      const sY = 0.5 + Math.random() * 2;

      items.push({
        position: [x, 0, z],
        scale: [sX, sY, sX],
        rotationY: (Math.random() * 360 * Math.PI) / 180,
        vel: 1 + Math.random() * 4,
        amp: 1 + Math.random() * 6,
        pos: Math.random() * 0.2,
      });
    }
    return items;
  }, [count, spreadRange]);

  return (
    <group>
      {boats.map((boat, i) => (
        <Boat key={i} data={boat} color={color} />
      ))}
    </group>
  );
}

interface SceneContentProps {
  backgroundColor: number;
  gridColor: number;
  accentColor: number;
  rotationSpeed: number;
  showGrid: boolean;
  showBoats: boolean;
  boatCount: number;
  boatSpread: number;
  oceanSize: number;
  oceanFragments: number;
  waveAmplitude: number;
  waveSpeed: number;
  showWireframe: boolean;
  oceanOpacity: number;
}

function SceneContent({
  backgroundColor,
  gridColor,
  accentColor,
  rotationSpeed,
  showGrid,
  showBoats,
  boatCount,
  boatSpread,
  oceanSize,
  oceanFragments,
  waveAmplitude,
  waveSpeed,
  showWireframe,
  oceanOpacity,
}: SceneContentProps) {
  const { scene, camera } = useThree();
  const rectLightRef = useRef<THREE.RectAreaLight>(null);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    scene.fog = new THREE.Fog(backgroundColor, 5, 20);
    scene.background = new THREE.Color(backgroundColor);
  }, [scene, backgroundColor]);

  useFrame(() => {
    camera.lookAt(0, 0, 0);
    if (rectLightRef.current) {
      rectLightRef.current.lookAt(0, 0, 0);
    }
    if (groupRef.current) {
      groupRef.current.rotation.y += rotationSpeed;
    }
  });

  return (
    <>
      <hemisphereLight args={[0xffd3d3, accentColor, 2]} />
      <pointLight args={[accentColor, 1]} position={[-5, -20, -20]} />
      <rectAreaLight
        ref={rectLightRef}
        args={[accentColor, 20, 3, 3]}
        position={[2, 2, -20]}
      />
      <pointLight args={[accentColor, 0.1]} position={[0, 2, -2]} />

      <group ref={groupRef}>
        {showGrid && <gridHelper args={[20, 20]} position={[0, -1, 0]} />}
        {showBoats && (
          <BoatGroup
            count={boatCount}
            spreadRange={boatSpread}
            color={accentColor}
          />
        )}
        <OceanMesh
          geoSize={oceanSize}
          geoFragments={oceanFragments}
          waveAmplitude={waveAmplitude}
          waveSpeed={waveSpeed}
          accentColor={accentColor}
          showWireframe={showWireframe}
          opacity={oceanOpacity}
        />
      </group>
    </>
  );
}

export interface LiquidOceanProps {
  className?: string;
  backgroundColor?: number;
  gridColor?: number;
  accentColor?: number;
  fov?: number;
  rotationSpeed?: number;
  showGrid?: boolean;
  showBoats?: boolean;
  boatCount?: number;
  boatSpread?: number;
  oceanSize?: number;
  oceanFragments?: number;
  waveAmplitude?: number;
  waveSpeed?: number;
  showWireframe?: boolean;
  oceanOpacity?: number;
  children?: React.ReactNode;
}

export function LiquidOcean({
  className,
  backgroundColor = DEFAULT_THEME.background,
  gridColor = DEFAULT_THEME.gridColor,
  accentColor = DEFAULT_THEME.accentColor,
  fov = 20,
  rotationSpeed = 0.001,
  showGrid = true,
  showBoats = true,
  boatCount = 5,
  boatSpread = 5,
  oceanSize = 25,
  oceanFragments = 25,
  waveAmplitude = 0.2,
  waveSpeed = 0.05,
  showWireframe = true,
  oceanOpacity = 0.85,
  children,
}: LiquidOceanProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    import("three/examples/jsm/lights/RectAreaLightUniformsLib.js")
      .then((mod) => {
        mod.RectAreaLightUniformsLib.init();
      })
      .catch((err) => console.error(err));
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0 },
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full min-h-[400px] overflow-hidden bg-black cursor-crosshair",
        className,
      )}
    >
      {mounted && (
        <Canvas
          shadows
          dpr={1}
          frameloop={isVisible ? "always" : "never"}
          camera={{ position: [0, 2, 10], fov }}
          gl={{ antialias: false, alpha: false }}
          style={{ position: "absolute", inset: 0 }}
        >
          <SceneContent
            backgroundColor={backgroundColor}
            gridColor={gridColor}
            accentColor={accentColor}
            rotationSpeed={rotationSpeed}
            showGrid={showGrid}
            showBoats={showBoats}
            boatCount={boatCount}
            boatSpread={boatSpread}
            oceanSize={oceanSize}
            oceanFragments={isVisible ? oceanFragments : 5}
            waveAmplitude={waveAmplitude}
            waveSpeed={waveSpeed}
            showWireframe={showWireframe}
            oceanOpacity={oceanOpacity}
          />
        </Canvas>
      )}

      {children && (
        <div className="relative z-10 w-full h-full pointer-events-none select-none">
          {children}
        </div>
      )}
    </div>
  );
}

export default LiquidOcean;
