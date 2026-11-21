"use client";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, type RootState } from "@react-three/fiber";
import { ContactShadows, OrbitControls, RoundedBox } from "@react-three/drei";
import { deriveToggles, useStudio, type Arrangement, type Lighting } from "@/lib/studio/store";
import { dprFor } from "@/lib/device";
import { useExperience } from "@/lib/store";

const LIGHTS: Record<Lighting, { ambient: number; hemi: [string, string, number]; key: [string, number]; bg: string; candle: number; fog: [number, number] }> = {
  golden: { ambient: 0.35, hemi: ["#ffe2b8", "#3a2a22", 0.8], key: ["#ffc98a", 2.2], bg: "#2a1d18", candle: 1.2, fog: [12, 30] },
  candlelit: { ambient: 0.08, hemi: ["#5a4a6a", "#120c10", 0.25], key: ["#8f7cff", 0.35], bg: "#0d0a12", candle: 3.2, fog: [8, 22] },
  daylight: { ambient: 0.6, hemi: ["#ffffff", "#c9c2b6", 1.1], key: ["#ffffff", 2.4], bg: "#e9e4dc", candle: 0.4, fog: [16, 40] },
};

/** Instanced bloom cluster: one draw call per colour group. */
function Blooms({ points, colors, radius = 0.09 }: { points: THREE.Vector3[]; colors: string[]; radius?: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    const c = new THREE.Color();
    points.forEach((p, i) => {
      const s = radius * (0.75 + ((i * 7) % 5) * 0.12);
      m.compose(p, new THREE.Quaternion(), new THREE.Vector3(s, s * 0.85, s));
      mesh.setMatrixAt(i, m);
      mesh.setColorAt(i, c.set(colors[i % colors.length]));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [points, colors, radius]);
  return (
    <instancedMesh key={points.length} ref={ref} args={[undefined, undefined, points.length]} castShadow>
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial roughness={0.65} />
    </instancedMesh>
  );
}

function cluster(center: THREE.Vector3, n: number, spread: number, seed = 1) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i * 137.5 + seed * 17) * (Math.PI / 180);
    const r = Math.sqrt((i + 0.5) / n) * spread;
    return new THREE.Vector3(center.x + Math.cos(a) * r, center.y + Math.sin(a * 1.7) * spread * 0.45, center.z + Math.sin(a) * r * 0.6);
  });
}

function Arch({ palette }: { palette: string[] }) {
  const points = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 70; i++) {
      const a = (i / 70) * Math.PI * 2;
      const wob = ((i * 13) % 7) * 0.012;
      pts.push(new THREE.Vector3(Math.cos(a) * (1.55 + wob), 1.75 + Math.sin(a) * (1.55 + wob), ((i * 5) % 3) * 0.05 - 0.05));
    }
    // Heavier florals on one side, like a styled moon gate.
    return [...pts, ...cluster(new THREE.Vector3(-1.2, 0.7, 0.05), 40, 0.45, 2), ...cluster(new THREE.Vector3(0.9, 3.0, 0.05), 30, 0.4, 5)];
  }, []);
  return (
    <group position={[0, 0.25, -0.6]}>
      <mesh position={[0, 1.75, 0]} castShadow>
        <torusGeometry args={[1.55, 0.03, 8, 96]} />
        <meshStandardMaterial color="#c8a46a" metalness={0.8} roughness={0.3} />
      </mesh>
      {/* Crystal strands */}
      {Array.from({ length: 22 }, (_, i) => {
        const x = -1.3 + (i / 21) * 2.6;
        const top = 1.75 + Math.sqrt(Math.max(0, 1.5 * 1.5 - x * x));
        const len = top - 0.4 - ((i * 7) % 4) * 0.12;
        return (
          <mesh key={i} position={[x, top - len / 2, -0.05]}>
            <cylinderGeometry args={[0.006, 0.006, len, 4]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.25} transparent opacity={0.7} />
          </mesh>
        );
      })}
      <Blooms points={points} colors={palette} radius={0.1} />
    </group>
  );
}

function Florals({ palette, positions }: { palette: string[]; positions: [number, number, number][] }) {
  const points = useMemo(() => positions.flatMap((p, i) => cluster(new THREE.Vector3(...p), 26, 0.32, i + 3)), [positions]);
  return (
    <>
      {positions.map((p, i) => (
        <mesh key={i} position={[p[0], p[1] / 2 - 0.05, p[2]]}>
          <cylinderGeometry args={[0.02, 0.02, p[1], 6]} />
          <meshStandardMaterial color="#c8a46a" metalness={0.8} roughness={0.3} />
        </mesh>
      ))}
      <Blooms points={points} colors={[palette[0], palette[2] ?? palette[0], palette[1] ?? palette[0], "#7d8b6f"]} />
    </>
  );
}

function Candles({ positions, intensity }: { positions: [number, number, number][]; intensity: number }) {
  const flames = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    flames.current?.children.forEach((child, i) => {
      const s = 1 + Math.sin(clock.elapsedTime * 9 + i * 1.7) * 0.08;
      child.scale.set(1, s, 1);
    });
  });
  return (
    <group>
      {positions.map(([x, h, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, h / 2, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.05, h, 10]} />
            <meshStandardMaterial color="#c8a46a" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, h + 0.08, 0]}>
            <cylinderGeometry args={[0.045, 0.045, 0.16, 12]} />
            <meshStandardMaterial color="#f8f1e4" roughness={0.9} />
          </mesh>
        </group>
      ))}
      <group ref={flames}>
        {positions.map(([x, h, z], i) => (
          <mesh key={i} position={[x, h + 0.2, z]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <meshBasicMaterial color="#ffd58a" toneMapped={false} />
          </mesh>
        ))}
      </group>
      {/* A few real lights (not one per candle) keep the cost bounded. */}
      {positions.filter((_, i) => i % 3 === 0).slice(0, 4).map(([x, h, z], i) => (
        <pointLight key={i} position={[x, h + 0.3, z]} color="#ffb85c" intensity={intensity} distance={3.2} decay={2} />
      ))}
    </group>
  );
}

function Drape({ palette }: { palette: string[] }) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(7, 4.2, 80, 1);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.sin(pos.getX(i) * 9) * 0.06);
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <group position={[0, 2.1, -1.6]}>
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial color={palette[0]} roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 1.75, 1.45, 0.12]} rotation={[0, 0, s * 0.06]}>
          <torusGeometry args={[1.75, 0.12, 8, 40, Math.PI]} />
          <meshStandardMaterial color={palette[1] ?? palette[0]} roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

function Seating({ palette, arrangement }: { palette: string[]; arrangement: Arrangement }) {
  const sofa = palette[0];
  const cushion = palette[1] ?? palette[0];
  if (arrangement === "ceremony") {
    return (
      <group position={[0, 0.25, -0.2]}>
        <RoundedBox args={[1.3, 0.22, 0.5]} radius={0.06} position={[0, 0.35, 0]} castShadow><meshStandardMaterial color="#f3ece2" roughness={0.8} /></RoundedBox>
        {[-0.55, 0.55].map((x) => <mesh key={x} position={[x, 0.12, 0]}><boxGeometry args={[0.05, 0.3, 0.4]} /><meshStandardMaterial color="#c8a46a" metalness={0.7} roughness={0.3} /></mesh>)}
      </group>
    );
  }
  return (
    <group position={[0, 0.25, -0.5]}>
      <RoundedBox args={[2.4, 0.4, 0.8]} radius={0.12} position={[0, 0.38, 0]} castShadow><meshStandardMaterial color={sofa} roughness={0.85} /></RoundedBox>
      <RoundedBox args={[2.4, 0.75, 0.25]} radius={0.12} position={[0, 0.75, -0.3]} castShadow><meshStandardMaterial color={sofa} roughness={0.85} /></RoundedBox>
      {[-0.7, 0, 0.7].map((x) => <RoundedBox key={x} args={[0.4, 0.38, 0.12]} radius={0.08} position={[x, 0.75, -0.12]} rotation={[0.2, 0, x * 0.1]}><meshStandardMaterial color={cushion} roughness={0.7} /></RoundedBox>)}
      {[-1.4, 1.4].map((x) => <RoundedBox key={x} args={[0.7, 0.8, 0.7]} radius={0.25} position={[x, 0.5, 0.1]} castShadow><meshStandardMaterial color={sofa} roughness={0.85} /></RoundedBox>)}
    </group>
  );
}

function Tables({ palette, arrangement }: { palette: string[]; arrangement: Arrangement }) {
  // Tables stay clear of the aisle and stage: flanking for a ceremony, in front for a stage, filling the room for a dinner.
  const spots: [number, number][] = arrangement === "ceremony" ? [[-3.2, 1.4], [3.2, 1.4], [-3.4, 3.6], [3.4, 3.6]]
    : arrangement === "stage" ? [[-2.6, 2.6], [2.6, 2.6], [0, 4.2]]
    : [[-2.4, 1.6], [0, 2.3], [2.4, 1.6], [-1.3, 3.6], [1.3, 3.6]];
  const chairColor = palette[1] ?? palette[0];
  return (
    <group>
      {spots.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.38, 0]} castShadow receiveShadow><cylinderGeometry args={[0.55, 0.55, 0.04, 32]} /><meshStandardMaterial color="#faf6ef" roughness={0.9} /></mesh>
          <mesh position={[0, 0.18, 0]}><cylinderGeometry args={[0.56, 0.62, 0.36, 32, 1, true]} /><meshStandardMaterial color="#f4ede2" roughness={1} side={THREE.DoubleSide} /></mesh>
          {Array.from({ length: 8 }, (_, k) => {
            const a = (k / 8) * Math.PI * 2;
            return <RoundedBox key={k} args={[0.2, 0.42, 0.2]} radius={0.04} position={[Math.cos(a) * 0.8, 0.21, Math.sin(a) * 0.8]} rotation={[0, -a, 0]} castShadow><meshStandardMaterial color={chairColor} roughness={0.8} /></RoundedBox>;
          })}
          <Blooms points={cluster(new THREE.Vector3(0, 0.62, 0), 14, 0.16, i)} colors={palette} radius={0.06} />
          <mesh position={[0, 0.5, 0]}><cylinderGeometry args={[0.012, 0.012, 0.24, 6]} /><meshStandardMaterial color="#c8a46a" metalness={0.8} roughness={0.3} /></mesh>
        </group>
      ))}
    </group>
  );
}

function Runner({ palette }: { palette: string[] }) {
  const petals = useMemo(() => Array.from({ length: 90 }, (_, i) => new THREE.Vector3(((i * 53) % 100) / 100 * 1.3 - 0.65, 0.012, 0.6 + ((i * 37) % 100) / 100 * 4.2)), []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 2.7]} receiveShadow><planeGeometry args={[1.4, 4.4]} /><meshStandardMaterial color="#fbf8f3" roughness={1} /></mesh>
      <Blooms points={petals} colors={[palette[1] ?? palette[0], palette[2] ?? palette[0]]} radius={0.025} />
    </group>
  );
}

function Scene() {
  const { palette, lighting, arrangement, items } = useStudio();
  // Same décor as the moodboard: whatever is on the board appears here.
  const toggles = deriveToggles(items);
  const L = LIGHTS[lighting];
  const aisle: [number, number, number][] = arrangement === "banquet"
    ? [[-3.2, 1.1, -0.8], [3.2, 1.1, -0.8], [-1.3, 0.9, 1.5], [1.3, 0.9, 1.5]]
    : [[-1.9, 1.2, -0.5], [1.9, 1.2, -0.5], [-1.0, 0.9, 1.1], [1.0, 0.9, 1.1], [-1.0, 0.9, 2.6], [1.0, 0.9, 2.6], [-1.0, 0.9, 4.1], [1.0, 0.9, 4.1]];
  const floralSpots: [number, number, number][] = arrangement === "stage" ? [[-2.2, 1.1, -0.4], [2.2, 1.1, -0.4]] : arrangement === "banquet" ? [[-2.6, 1.3, -1.1], [2.6, 1.3, -1.1]] : [[-0.95, 0.75, 0.6], [0.95, 0.75, 0.6], [-0.95, 0.75, 2.0], [0.95, 0.75, 2.0], [-0.95, 0.75, 3.4], [0.95, 0.75, 3.4]];

  return (
    <>
      <color attach="background" args={[L.bg]} />
      <fog attach="fog" args={[L.bg, L.fog[0], L.fog[1]]} />
      <ambientLight intensity={L.ambient} />
      <hemisphereLight args={[L.hemi[0], L.hemi[1], L.hemi[2]]} />
      <directionalLight position={[4, 7, 5]} color={L.key[0]} intensity={L.key[1]} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} />

      {/* Floor and stage platform */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow><circleGeometry args={[9, 64]} /><meshStandardMaterial color={lighting === "daylight" ? "#d8d1c6" : "#2a2224"} roughness={0.55} metalness={0.1} /></mesh>
      <mesh position={[0, 0.12, -0.6]} receiveShadow castShadow><cylinderGeometry args={[3.2, 3.3, 0.24, 64, 1, false, Math.PI, Math.PI]} /><meshStandardMaterial color="#f4efe6" roughness={0.7} /></mesh>

      {toggles.drape && <Drape palette={palette} />}
      {toggles.arch && <Arch palette={palette} />}
      {toggles.seating && <Seating palette={palette} arrangement={arrangement} />}
      {toggles.tables && <Tables palette={palette} arrangement={arrangement} />}
      {toggles.runner && arrangement !== "banquet" && <Runner palette={palette} />}
      {toggles.florals && <Florals palette={palette} positions={floralSpots} />}
      {toggles.candles && <Candles positions={aisle} intensity={L.candle} />}

      <ContactShadows position={[0, 0.005, 0]} opacity={lighting === "daylight" ? 0.35 : 0.6} scale={18} blur={2.4} far={4} />
      <OrbitControls makeDefault enablePan={false} minDistance={4} maxDistance={13} minPolarAngle={0.35} maxPolarAngle={Math.PI / 2.15} target={[0, 1.6, 0]} enableDamping />
    </>
  );
}

/**
 * Mode B: an honest, stylized 3D concept preview built from primitives and instanced geometry.
 * It reflects the chosen palette, arrangement, lighting and decor toggles; it is not a venue model.
 */
export default function ConceptPreview3D({ onReady }: { onReady?: (state: RootState) => void }) {
  const tier = useExperience((s) => s.tier);
  return (
    <Canvas
      shadows={tier !== "low"}
      dpr={dprFor(tier)}
      camera={{ position: [0, 3.8, 10.5], fov: 40 }}
      gl={{ preserveDrawingBuffer: true, antialias: true }}
      onCreated={onReady}
      data-native-cursor
    >
      <Scene />
    </Canvas>
  );
}
