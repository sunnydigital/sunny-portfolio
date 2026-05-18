"use client";

import { useRef, useMemo, useState, useCallback, useEffect } from "react";
import { Canvas, useFrame, useThree, extend } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { Concept } from "@/types";
import { useScroll } from "@/lib/scroll";
import { useShadowbox } from "@/lib/shadowbox";
import { useRouter } from "next/navigation";
import { computeClusterPositions } from "@/lib/embeddings";
import { renderLatex } from "@/lib/latex";
import { parseLocalDate } from "@/lib/date";
import { useSession } from "next-auth/react";
import { constellations } from "@/data/constellations";

extend({ EffectComposer, RenderPass, UnrealBloomPass, OutputPass });

// Galaxy-view starfield. Replaces the painted /shadowbox/sky.webp backdrop for
// galaxy / clusters / constellation modes with a procedural starfield over the
// same dark-blue gradient as the painted sky's tonal range. The shadowbox view
// keeps the painted sky.webp because its hand-painted texture matters there;
// here the dynamic stars feel more alive while users orbit the 3D galaxy.
//
// Stars use a deterministic mulberry32 PRNG so positions/sizes/twinkle phases
// don't reshuffle across re-renders (the parent re-renders on every scroll +
// shadowbox-phase tick). Memoized at module scope for the same reason.
function makeStarfieldRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// Tier of larger, rarer stars + a denser sprinkle of small ones reads as
// realistic depth without overpowering the 3D galaxy in front of it.
const STARFIELD_COUNT = 220;
const STARFIELD_STARS = Array.from({ length: STARFIELD_COUNT }, (_, i) => {
  const r = makeStarfieldRng(0xc0ffee ^ (i * 2654435761));
  // 92% small (1-2.5px), 7% medium (2.5-4px), 1% large (4-6px) — most stars
  // are barely-visible points; a handful of brighter ones anchor the eye.
  const tier = r();
  const size = tier < 0.92 ? 1 + r() * 1.5 : tier < 0.99 ? 2.5 + r() * 1.5 : 4 + r() * 2;
  // Slight blue/white tint variance.
  const hue = 200 + r() * 40;
  const sat = 10 + r() * 30;
  const light = 80 + r() * 20;
  return {
    left: r() * 100,
    top: r() * 100,
    size,
    color: `hsl(${hue}, ${sat}%, ${light}%)`,
    delay: r() * 6,
    duration: 2.5 + r() * 4,
    opacityMin: 0.2 + r() * 0.3,
    opacityMax: 0.7 + r() * 0.3,
  };
});

function GalaxyStarfield({ opacity }: { opacity: number }) {
  return (
    <div
      aria-hidden
      className="fixed inset-0 w-screen h-screen pointer-events-none select-none"
      style={{
        zIndex: 0,
        opacity,
        transition: "opacity 0.4s ease",
        // Matches the painted sky.webp's tonal range — sampled top ~rgb(22,31,48),
        // bottom ~rgb(2,8,24). Keeps the visual handoff to the shadowbox sky
        // continuous.
        background: "linear-gradient(180deg, rgb(22,31,48) 0%, rgb(10,16,32) 55%, rgb(2,8,24) 100%)",
      }}
    >
      <style>{`
        @keyframes galaxy-starfield-twinkle {
          0%, 100% { opacity: var(--gs-min, 0.2); }
          50%      { opacity: var(--gs-max, 1); }
        }
      `}</style>
      {STARFIELD_STARS.map((s, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${s.left}vw`,
            top: `${s.top}vh`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            borderRadius: "50%",
            background: s.color,
            // Soft halo for the larger stars; the small ones get a tiny glow.
            boxShadow: `0 0 ${Math.max(2, s.size * 1.5)}px ${s.size * 0.4}px ${s.color}`,
            ["--gs-min" as string]: s.opacityMin,
            ["--gs-max" as string]: s.opacityMax,
            animation: `galaxy-starfield-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// --- Galaxy generation config ---
const NUM_STARS = 7000;
const GALAXY_THICKNESS = 5;
const CORE_X_DIST = 33;
const CORE_Y_DIST = 33;
const OUTER_CORE_X_DIST = 100;
const OUTER_CORE_Y_DIST = 100;
const ARM_X_DIST = 100;
const ARM_Y_DIST = 50;
const ARM_X_MEAN = 200;
const ARM_Y_MEAN = 100;
const SPIRAL_FACTOR = 3.0;
const ARMS = 2;
const HAZE_RATIO = 0.5;
const GALAXY_SCALE = 0.03;

const STAR_COLORS = [0xffcc6f, 0xffd2a1, 0xfff4ea, 0xf8f7ff, 0xcad7ff, 0xaabfff];
const STAR_PERCENTAGES = [76.45, 12.1, 7.6, 3.0, 0.6, 0.13];
const STAR_SIZES = [0.7, 0.7, 1.15, 1.48, 2.0, 2.5];

function gaussianRandom(mean = 0, stdev = 1) {
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return z * stdev + mean;
}

function spiral(x: number, y: number, z: number, offset: number): THREE.Vector3 {
  const r = Math.sqrt(x ** 2 + y ** 2);
  let theta = offset;
  theta += x > 0 ? Math.atan(y / x) : Math.atan(y / x) + Math.PI;
  theta += (r / ARM_X_DIST) * SPIRAL_FACTOR;
  return new THREE.Vector3(r * Math.cos(theta) * GALAXY_SCALE, z * GALAXY_SCALE, r * Math.sin(theta) * GALAXY_SCALE);
}

function pickStarType(): number {
  const roll = Math.random() * 100;
  let cumulative = 0;
  for (let i = 0; i < STAR_PERCENTAGES.length; i++) {
    cumulative += STAR_PERCENTAGES[i];
    if (roll <= cumulative) return i;
  }
  return 0;
}

interface StarData {
  position: THREE.Vector3;
  color: THREE.Color;
  size: number;
  isHaze: boolean;
}

function generateGalaxy(): StarData[] {
  const stars: StarData[] = [];
  const quarter = Math.floor(NUM_STARS / 4);

  for (let i = 0; i < quarter; i++) {
    const x = gaussianRandom(0, CORE_X_DIST);
    const y = gaussianRandom(0, CORE_Y_DIST);
    const z = gaussianRandom(0, GALAXY_THICKNESS);
    const type = pickStarType();
    stars.push({
      position: new THREE.Vector3(x * GALAXY_SCALE, z * GALAXY_SCALE, y * GALAXY_SCALE),
      color: new THREE.Color(STAR_COLORS[type]),
      size: STAR_SIZES[type] * 0.15,
      isHaze: false,
    });
  }

  for (let i = 0; i < quarter; i++) {
    const x = gaussianRandom(0, OUTER_CORE_X_DIST);
    const y = gaussianRandom(0, OUTER_CORE_Y_DIST);
    const z = gaussianRandom(0, GALAXY_THICKNESS);
    const type = pickStarType();
    stars.push({
      position: new THREE.Vector3(x * GALAXY_SCALE, z * GALAXY_SCALE, y * GALAXY_SCALE),
      color: new THREE.Color(STAR_COLORS[type]),
      size: STAR_SIZES[type] * 0.15,
      isHaze: false,
    });
  }

  const armStars = NUM_STARS - 2 * quarter;
  const perArm = Math.floor(armStars / ARMS);
  for (let j = 0; j < ARMS; j++) {
    const offset = (j * 2 * Math.PI) / ARMS;
    for (let i = 0; i < perArm; i++) {
      const x = gaussianRandom(ARM_X_MEAN, ARM_X_DIST);
      const y = gaussianRandom(ARM_Y_MEAN, ARM_Y_DIST);
      const z = gaussianRandom(0, GALAXY_THICKNESS);
      const pos = spiral(x, y, z, offset);
      const type = pickStarType();
      stars.push({
        position: pos,
        color: new THREE.Color(STAR_COLORS[type]),
        size: STAR_SIZES[type] * 0.15,
        isHaze: false,
      });
    }
  }

  const numHaze = Math.floor(NUM_STARS * HAZE_RATIO);
  for (let i = 0; i < numHaze; i++) {
    const x = gaussianRandom(0, OUTER_CORE_X_DIST * 1.5);
    const y = gaussianRandom(0, OUTER_CORE_Y_DIST * 1.5);
    const z = gaussianRandom(0, GALAXY_THICKNESS * 0.5);
    stars.push({
      position: new THREE.Vector3(x * GALAXY_SCALE, z * GALAXY_SCALE, y * GALAXY_SCALE),
      color: new THREE.Color(0x2244aa),
      size: 0.8 + Math.random() * 1.2,
      isHaze: true,
    });
  }

  return stars;
}

function createStarTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.3, "rgba(255,255,255,0.8)");
  gradient.addColorStop(0.7, "rgba(255,255,255,0.15)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

interface TimelineResult {
  positions: Map<string, THREE.Vector3>;
  constellationAssignments: { constellationIndex: number; conceptIds: string[]; firstDate: Date }[];
  chronologicalOrder: string[];
}

function getTimelineData(concepts: Concept[]): TimelineResult {
  const sorted = [...concepts].sort(
    (a, b) => parseLocalDate(a.date_learned).getTime() - parseLocalDate(b.date_learned).getTime()
  );
  const map = new Map<string, THREE.Vector3>();
  const assignments: TimelineResult["constellationAssignments"] = [];
  const chronologicalOrder = sorted.map(c => c.id);

  let conceptIdx = 0;
  for (let ci = 0; ci < constellations.length && conceptIdx < sorted.length; ci++) {
    const constellation = constellations[ci];
    const numStars = constellation.stars.length;
    const conceptsForThis = sorted.slice(conceptIdx, conceptIdx + numStars);
    const ids: string[] = [];

    conceptsForThis.forEach((c, si) => {
      const star = constellation.stars[si];
      const pos = new THREE.Vector3(
        star.x + constellation.offset.x,
        star.y + constellation.offset.y,
        star.z + constellation.offset.z
      );
      map.set(c.id, pos);
      ids.push(c.id);
    });

    if (ids.length > 0) {
      assignments.push({
        constellationIndex: ci,
        conceptIds: ids,
        firstDate: parseLocalDate(conceptsForThis[0].date_learned),
      });
    }

    conceptIdx += numStars;
  }

  // If we have leftover concepts, distribute them around the last constellation
  while (conceptIdx < sorted.length) {
    const c = sorted[conceptIdx];
    const lastConst = constellations[constellations.length - 1];
    const angle = (conceptIdx - sorted.length) * 0.8;
    const pos = new THREE.Vector3(
      Math.cos(angle) * 0.8 + lastConst.offset.x,
      Math.sin(angle) * 0.8 + lastConst.offset.y,
      lastConst.offset.z
    );
    map.set(c.id, pos);
    conceptIdx++;
  }

  return { positions: map, constellationAssignments: assignments, chronologicalOrder };
}

function getTimelinePositions(concepts: Concept[]): Map<string, THREE.Vector3> {
  return getTimelineData(concepts).positions;
}

function placeConceptsInGalaxy(concepts: Concept[]): Map<string, THREE.Vector3> {
  const map = new Map<string, THREE.Vector3>();
  concepts.forEach((c, i) => {
    const armIdx = i % ARMS;
    const offset = (armIdx * 2 * Math.PI) / ARMS;
    const x = gaussianRandom(ARM_X_MEAN * 0.8, ARM_X_DIST * 0.5);
    const y = gaussianRandom(ARM_Y_MEAN * 0.3, ARM_Y_DIST * 0.3);
    const z = gaussianRandom(0, GALAXY_THICKNESS * 0.3);
    const pos = spiral(x, y, z, offset);
    map.set(c.id, pos);
  });
  return map;
}

// Bloom post-processing
function Bloom() {
  const { gl, scene, camera, size } = useThree();
  const composer = useRef<EffectComposer | null>(null);

  useEffect(() => {
    const comp = new EffectComposer(gl);
    comp.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      1.5, 0.4, 0.2
    );
    comp.addPass(bloom);
    comp.addPass(new OutputPass());
    composer.current = comp;
    return () => { comp.dispose(); };
  }, [gl, scene, camera, size]);

  useEffect(() => {
    if (composer.current) composer.current.setSize(size.width, size.height);
  }, [size]);

  useFrame(() => {
    if (composer.current) composer.current.render();
  }, 1);

  return null;
}

// Galaxy stars with dispersion/gathering animation
function GalaxyStars({ dispersionProgress }: { dispersionProgress: number }) {
  const pointsRef = useRef<THREE.Points>(null!);
  const hazeRef = useRef<THREE.Points>(null!);

  const { stars, hazeStars, starTexture, disperseDirections, hazeDisperseDirections } = useMemo(() => {
    const allStars = generateGalaxy();
    const s = allStars.filter((st) => !st.isHaze);
    const h = allStars.filter((st) => st.isHaze);
    
    // Pre-compute random disperse directions for each star
    const sDirs = s.map(() => {
      const dir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize();
      const dist = 15 + Math.random() * 25; // fly far out
      return dir.multiplyScalar(dist);
    });
    const hDirs = h.map(() => {
      const dir = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 2
      ).normalize();
      const dist = 15 + Math.random() * 25;
      return dir.multiplyScalar(dist);
    });

    return {
      stars: s,
      hazeStars: h,
      starTexture: createStarTexture(),
      disperseDirections: sDirs,
      hazeDisperseDirections: hDirs,
    };
  }, []);

  // Base positions (galaxy shape)
  const { baseStarPositions, starColors, starSizes } = useMemo(() => {
    const positions = new Float32Array(stars.length * 3);
    const colors = new Float32Array(stars.length * 3);
    const sizes = new Float32Array(stars.length);
    stars.forEach((s, i) => {
      positions[i * 3] = s.position.x;
      positions[i * 3 + 1] = s.position.y;
      positions[i * 3 + 2] = s.position.z;
      colors[i * 3] = s.color.r;
      colors[i * 3 + 1] = s.color.g;
      colors[i * 3 + 2] = s.color.b;
      sizes[i] = s.size;
    });
    return { baseStarPositions: positions, starColors: colors, starSizes: sizes };
  }, [stars]);

  const { baseHazePositions, hazeColors, hazeSizes } = useMemo(() => {
    const positions = new Float32Array(hazeStars.length * 3);
    const colors = new Float32Array(hazeStars.length * 3);
    const sizes = new Float32Array(hazeStars.length);
    hazeStars.forEach((s, i) => {
      positions[i * 3] = s.position.x;
      positions[i * 3 + 1] = s.position.y;
      positions[i * 3 + 2] = s.position.z;
      colors[i * 3] = s.color.r;
      colors[i * 3 + 1] = s.color.g;
      colors[i * 3 + 2] = s.color.b;
      sizes[i] = s.size;
    });
    return { baseHazePositions: positions, hazeColors: colors, hazeSizes: sizes };
  }, [hazeStars]);

  // Animated positions buffer
  const animatedStarPositions = useRef(new Float32Array(baseStarPositions.length));
  const animatedHazePositions = useRef(new Float32Array(baseHazePositions.length));

  useFrame((_, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.05;
    }
    if (hazeRef.current) {
      hazeRef.current.rotation.y += delta * 0.05;
    }

    // Apply dispersion: lerp from base positions to dispersed positions
    const p = dispersionProgress; // 0 = galaxy, 1 = fully dispersed
    
    // Stars
    const starPos = animatedStarPositions.current;
    for (let i = 0; i < stars.length; i++) {
      const i3 = i * 3;
      const dir = disperseDirections[i];
      starPos[i3] = baseStarPositions[i3] + dir.x * p;
      starPos[i3 + 1] = baseStarPositions[i3 + 1] + dir.y * p;
      starPos[i3 + 2] = baseStarPositions[i3 + 2] + dir.z * p;
    }
    if (pointsRef.current) {
      const posAttr = pointsRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      posAttr.array.set(starPos);
      posAttr.needsUpdate = true;
      (pointsRef.current.material as THREE.PointsMaterial).opacity = 0.9 * (1 - p);
    }

    // Haze
    const hazePos = animatedHazePositions.current;
    for (let i = 0; i < hazeStars.length; i++) {
      const i3 = i * 3;
      const dir = hazeDisperseDirections[i];
      hazePos[i3] = baseHazePositions[i3] + dir.x * p;
      hazePos[i3 + 1] = baseHazePositions[i3 + 1] + dir.y * p;
      hazePos[i3 + 2] = baseHazePositions[i3 + 2] + dir.z * p;
    }
    if (hazeRef.current) {
      const posAttr = hazeRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      posAttr.array.set(hazePos);
      posAttr.needsUpdate = true;
      (hazeRef.current.material as THREE.PointsMaterial).opacity = 0.08 * (1 - p);
    }
  });

  // Initialize animated positions
  useEffect(() => {
    animatedStarPositions.current.set(baseStarPositions);
    animatedHazePositions.current.set(baseHazePositions);
  }, [baseStarPositions, baseHazePositions]);

  return (
    <>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array(baseStarPositions), 3]} />
          <bufferAttribute attach="attributes-color" args={[starColors, 3]} />
          <bufferAttribute attach="attributes-size" args={[starSizes, 1]} />
        </bufferGeometry>
        <pointsMaterial
          map={starTexture}
          vertexColors
          transparent
          opacity={0.9}
          sizeAttenuation
          size={0.15}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
      <points ref={hazeRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array(baseHazePositions), 3]} />
          <bufferAttribute attach="attributes-color" args={[hazeColors, 3]} />
          <bufferAttribute attach="attributes-size" args={[hazeSizes, 1]} />
        </bufferGeometry>
        <pointsMaterial
          map={starTexture}
          vertexColors
          transparent
          opacity={0.08}
          sizeAttenuation
          size={0.8}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </>
  );
}

// Concept dots that transition between modes
interface ConceptDotsProps {
  concepts: Concept[];
  onHover: (concept: Concept | null, pos: THREE.Vector3 | null) => void;
  onClick: (concept: Concept) => void;
  overrideMode?: string;
}

function ConceptDots({ concepts, onHover, onClick, overrideMode }: ConceptDotsProps) {
  const { mode: scrollMode } = useScroll();
  const mode = overrideMode ?? scrollMode;
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const transitionRef = useRef({ progress: 0, currentMode: "galaxy" as string });

  const galaxyPositions = useMemo(() => placeConceptsInGalaxy(concepts), [concepts]);
  const timelinePositions = useMemo(() => getTimelinePositions(concepts), [concepts]);
  const clusterPositions = useMemo(() => computeClusterPositions(concepts), [concepts]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const prevPositions = useRef<THREE.Vector3[]>([]);
  const targetPositions = useRef<THREE.Vector3[]>([]);
  const currentPositions = useRef<THREE.Vector3[]>([]);

  // Ensure position arrays stay in sync with concepts length
  useEffect(() => {
    const len = concepts.length;
    while (prevPositions.current.length < len) prevPositions.current.push(new THREE.Vector3());
    while (targetPositions.current.length < len) targetPositions.current.push(new THREE.Vector3());
    while (currentPositions.current.length < len) currentPositions.current.push(new THREE.Vector3());
    prevPositions.current.length = len;
    targetPositions.current.length = len;
    currentPositions.current.length = len;
  }, [concepts]);

  useEffect(() => {
    if (prevPositions.current.length === 0) return;
    const posMap = mode === "galaxy" ? galaxyPositions : mode === "reduction" ? clusterPositions : timelinePositions;
    concepts.forEach((c, i) => {
      prevPositions.current[i].copy(currentPositions.current[i]);
      const target = posMap.get(c.id) || new THREE.Vector3();
      targetPositions.current[i].copy(target);
    });
    transitionRef.current.progress = 0;
    transitionRef.current.currentMode = mode;
  }, [mode, concepts, galaxyPositions, clusterPositions, timelinePositions]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const t = transitionRef.current;
    t.progress = Math.min(t.progress + delta / 1.5, 1);
    const ease = t.progress < 0.5
      ? 4 * t.progress * t.progress * t.progress
      : 1 - Math.pow(-2 * t.progress + 2, 3) / 2;

    const len = Math.min(concepts.length, currentPositions.current.length);
    for (let i = 0; i < len; i++) {
      currentPositions.current[i].lerpVectors(prevPositions.current[i], targetPositions.current[i], ease);
      dummy.position.copy(currentPositions.current[i]);
      dummy.scale.setScalar(0.06);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
      color.set(STAR_COLORS[i % STAR_COLORS.length]);
      meshRef.current.setColorAt(i, color);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  });

  const { camera, raycaster, pointer } = useThree();

  const findNearest = useCallback((): { concept: Concept; pos: THREE.Vector3 } | null => {
    if (!meshRef.current) return null;
    raycaster.setFromCamera(pointer, camera);
    const ray = raycaster.ray;
    const PROXIMITY = 0.5;
    let closest: { concept: Concept; pos: THREE.Vector3; dist: number } | null = null;
    const mat = new THREE.Matrix4();
    const pos = new THREE.Vector3();
    for (let i = 0; i < concepts.length; i++) {
      meshRef.current.getMatrixAt(i, mat);
      pos.setFromMatrixPosition(mat);
      const dist = ray.distanceToPoint(pos);
      if (dist < PROXIMITY && (!closest || dist < closest.dist)) {
        closest = { concept: concepts[i], pos: pos.clone(), dist };
      }
    }
    return closest;
  }, [concepts, camera, raycaster, pointer]);

  // Periodically clear stale hover if pointer has drifted away
  const lastHoverRef = useRef<string | null>(null);
  useFrame(() => {
    const result = findNearest();
    const newId = result?.concept.id ?? null;
    if (lastHoverRef.current !== null && newId === null) {
      onHover(null, null);
    }
    lastHoverRef.current = newId;
  });

  // Track pointer down position/time to distinguish clicks from drags
  const pointerDownRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handlePointerDown = useCallback((e: { clientX?: number; clientY?: number; nativeEvent?: { clientX: number; clientY: number } }) => {
    const clientX = e.clientX ?? e.nativeEvent?.clientX ?? 0;
    const clientY = e.clientY ?? e.nativeEvent?.clientY ?? 0;
    pointerDownRef.current = { x: clientX, y: clientY, time: Date.now() };
  }, []);

  const handlePointerMove = useCallback(() => {
    const result = findNearest();
    if (result) {
      onHover(result.concept, result.pos);
    } else {
      onHover(null, null);
    }
  }, [findNearest, onHover]);

  const handleClick = useCallback((e: { clientX?: number; clientY?: number; nativeEvent?: { clientX: number; clientY: number } }) => {
    const down = pointerDownRef.current;
    if (down) {
      const clientX = e.clientX ?? e.nativeEvent?.clientX ?? 0;
      const clientY = e.clientY ?? e.nativeEvent?.clientY ?? 0;
      const dx = clientX - down.x;
      const dy = clientY - down.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const elapsed = Date.now() - down.time;
      // Only treat as click if pointer moved < 8px and held < 500ms
      if (dist > 8 || elapsed > 500) return;
    }
    const result = findNearest();
    if (result) {
      onClick(result.concept);
    }
  }, [findNearest, onClick]);

  const handlePointerLeave = useCallback(() => {
    onHover(null, null);
  }, [onHover]);

  // Floating concept labels for galaxy/clusters — same pattern as TimelineOverlay
  const [labelPositions, setLabelPositions] = useState<{ id: string; name: string; pos: THREE.Vector3 }[]>([]);
  const [labelsVisible, setLabelsVisible] = useState(false);
  const labelOpacityRef = useRef(0);
  const [labelOpacity, setLabelOpacity] = useState(0);
  const labelPrevModeRef = useRef<string | null>(null);
  const labelEnteringRef = useRef(false);
  const labelEnterDelayRef = useRef(0);
  const labelLeavingRef = useRef(false);
  const labelUpdateCounter = useRef(0);

  // Detect mode changes — mirror TimelineOverlay pattern
  useEffect(() => {
    const isNonTimeline = mode !== "timeline";
    const wasNonTimeline = labelPrevModeRef.current !== null && labelPrevModeRef.current !== "timeline";
    const modeChanged = labelPrevModeRef.current !== null && labelPrevModeRef.current !== mode;

    if (isNonTimeline && (labelPrevModeRef.current === null || !wasNonTimeline || modeChanged)) {
      // Entering a non-timeline mode — show labels after stars settle
      setLabelsVisible(true);
      labelEnteringRef.current = true;
      labelEnterDelayRef.current = labelPrevModeRef.current === null ? 0.8 : 0;
      labelOpacityRef.current = 0;
      labelLeavingRef.current = false;
    } else if (!isNonTimeline && wasNonTimeline) {
      // Leaving to timeline — fade out labels first
      labelLeavingRef.current = true;
      labelEnteringRef.current = false;
    } else if (isNonTimeline && modeChanged) {
      // Switching between galaxy and clusters — fade out then back in
      labelLeavingRef.current = true;
      labelEnteringRef.current = false;
    }
    labelPrevModeRef.current = mode;
  }, [mode]);

  useFrame((_, delta) => {
    if (labelEnteringRef.current) {
      // Wait 1.6s for stars to arrive before fading in
      labelEnterDelayRef.current += delta;
      if (labelEnterDelayRef.current >= 1.6) {
        labelEnteringRef.current = false;
      }
      labelOpacityRef.current = 0;
    } else if (labelLeavingRef.current) {
      // Fade out quickly (0.5s)
      labelOpacityRef.current = Math.max(labelOpacityRef.current - delta * 2, 0);
      if (labelOpacityRef.current <= 0.01) {
        labelLeavingRef.current = false;
        setLabelsVisible(false);
        // If we're still in a non-timeline mode (galaxy↔clusters switch), re-enter
        if (mode !== "timeline") {
          setLabelsVisible(true);
          labelEnteringRef.current = true;
          labelEnterDelayRef.current = 0;
          labelOpacityRef.current = 0;
        }
      }
    } else if (mode !== "timeline" && labelsVisible) {
      // Fade in over ~0.8s
      labelOpacityRef.current = Math.min(labelOpacityRef.current + delta * 1.25, 1);
    }

    // Update positions periodically
    labelUpdateCounter.current++;
    if (labelUpdateCounter.current % 10 !== 0) return;

    setLabelOpacity(labelOpacityRef.current);

    if (!labelsVisible || labelOpacityRef.current < 0.02) { setLabelPositions([]); return; }
    const labels: { id: string; name: string; pos: THREE.Vector3 }[] = [];
    const len = Math.min(concepts.length, currentPositions.current.length);
    for (let i = 0; i < len; i++) {
      const p = currentPositions.current[i];
      if (p) {
        labels.push({
          id: concepts[i].id,
          name: concepts[i].name.length > 18 ? concepts[i].name.slice(0, 16) + "…" : concepts[i].name,
          pos: p.clone().add(new THREE.Vector3(0, -0.15, 0)),
        });
      }
    }
    setLabelPositions(labels);
  });

  return (
    <group onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave} onClick={handleClick}>
      {/* Invisible large sphere to capture pointer events from any camera angle */}
      <mesh visible={false}>
        <sphereGeometry args={[50, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
      <instancedMesh ref={meshRef} args={[undefined, undefined, concepts.length]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial toneMapped={false} transparent opacity={0.9} />
      </instancedMesh>
      {/* Floating concept name labels in galaxy/clusters modes */}
      {labelPositions.length > 0 && labelPositions.map((lp) => (
        <Html key={`clabel-${lp.id}`} position={lp.pos} center style={{ pointerEvents: "none" }}>
          <div style={{
            fontSize: "8px",
            color: "var(--text-muted)",
            opacity: 0.35 * labelOpacity,
            whiteSpace: "nowrap",
            fontFamily: "monospace",
            textShadow: "0 0 4px rgba(0,0,0,0.8)",
          }}>
            {lp.name}
          </div>
        </Html>
      ))}
    </group>
  );
}

function Tooltip({ concept, position }: { concept: Concept | null; position: THREE.Vector3 | null }) {
  if (!concept || !position) return null;

  const displaySummary = typeof window !== "undefined"
    ? localStorage.getItem(`concept-short-summary-${concept.id}`) ?? concept.short_summary
    : concept.short_summary;

  return (
    <Html position={position} center style={{ pointerEvents: "none" }}>
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border-strong)",
        color: "var(--text)",
        padding: "8px 16px",
        borderRadius: "8px",
        width: "480px",
        backdropFilter: "blur(8px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        pointerEvents: "none",
      }}>
        <p style={{ fontWeight: 600, color: "var(--accent-mid)", fontSize: "13px" }}>{concept.name}</p>
        <p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }} dangerouslySetInnerHTML={{ __html: renderLatex(displaySummary) }} />
        {concept.date_learned && (
          <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px", opacity: 0.7 }}>
            Added: {parseLocalDate(concept.date_learned).toLocaleDateString()}
          </p>
        )}
      </div>
    </Html>
  );
}

// Dispersion controller — drives the dispersion progress inside the Canvas
function DispersionController({ dispersionRef }: { dispersionRef: React.MutableRefObject<{ target: number; current: number }> }) {
  useFrame((_, delta) => {
    const d = dispersionRef.current;
    const speed = 1.2; // ~1-1.5s transition
    if (d.current < d.target) {
      d.current = Math.min(d.current + delta * speed, d.target);
    } else if (d.current > d.target) {
      d.current = Math.max(d.current - delta * speed, d.target);
    }
  });
  return null;
}

// Zoom by holding right mouse button and dragging up/down
function RightClickZoom() {
  const { camera, gl } = useThree();
  const state = useRef({ active: false, lastY: 0 });

  useEffect(() => {
    const canvas = gl.domElement;

    const onDown = (e: MouseEvent) => {
      if (e.button === 2) {
        state.current.active = true;
        state.current.lastY = e.clientY;
        e.preventDefault();
      }
    };

    const onUp = (e: MouseEvent) => {
      if (e.button === 2) {
        state.current.active = false;
      }
    };

    const onMove = (e: MouseEvent) => {
      if (!state.current.active) return;
      const dy = e.clientY - state.current.lastY;
      state.current.lastY = e.clientY;
      const zoomSpeed = 0.03;
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      camera.position.addScaledVector(direction, -dy * zoomSpeed);
    };

    const onContext = (e: Event) => {
      e.preventDefault();
    };

    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);
    canvas.addEventListener("contextmenu", onContext);

    return () => {
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("contextmenu", onContext);
    };
  }, [camera, gl]);

  return null;
}

// Timeline constellation lines + labels
// Animation sequencing:
//   Entering timeline: stars move first (1.5s), then lines/labels fade in
//   Leaving timeline: lines/labels fade out first (0.5s), then stars move
function TimelineOverlay({ concepts, mode, onLinesHidden }: { concepts: Concept[]; mode: string; onLinesHidden?: () => void }) {
  const groupRef = useRef<THREE.Group>(null!);
  const [visible, setVisible] = useState(false);
  const opacityRef = useRef(0);
  const prevModeRef = useRef<string | null>(null); // null on first mount
  // Delay before lines appear (wait for stars to arrive)
  const enterDelayRef = useRef(0);
  const enteringRef = useRef(false);
  // Track leaving state — lines fade out before stars move
  const leavingRef = useRef(false);
  const leavingDoneRef = useRef(false);

  const timelineData = useMemo(() => getTimelineData(concepts), [concepts]);

  useEffect(() => {
    if (mode === "timeline" && prevModeRef.current !== "timeline") {
      // Entering timeline (or mounting in timeline mode) — delay lines until stars settle
      setVisible(true);
      enteringRef.current = true;
      enterDelayRef.current = 0; // wait full 1.6s for stars to settle (including remount from concept page)
      opacityRef.current = 0;
      leavingRef.current = false;
      leavingDoneRef.current = false;
    } else if (mode !== "timeline" && prevModeRef.current === "timeline") {
      // Leaving timeline — fade out lines first
      leavingRef.current = true;
      leavingDoneRef.current = false;
      enteringRef.current = false;
    }
    prevModeRef.current = mode;
  }, [mode]);

  // Intra-constellation chronological lines (solid)
  const intraLines = useMemo(() => {
    const lines: { geometry: THREE.BufferGeometry }[] = [];
    for (const assignment of timelineData.constellationAssignments) {
      const ids = assignment.conceptIds;
      if (ids.length < 2) continue;
      const points: number[] = [];
      for (const id of ids) {
        const p = timelineData.positions.get(id);
        if (p) points.push(p.x, p.y, p.z);
      }
      if (points.length >= 6) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
        lines.push({ geometry: geo });
      }
    }
    return lines;
  }, [timelineData]);

  // Inter-constellation lines (dashed) — connect last concept of one to first of next
  const interLines = useMemo(() => {
    const lines: { geometry: THREE.BufferGeometry }[] = [];
    const assignments = timelineData.constellationAssignments;
    for (let i = 0; i < assignments.length - 1; i++) {
      const lastId = assignments[i].conceptIds[assignments[i].conceptIds.length - 1];
      const firstId = assignments[i + 1].conceptIds[0];
      const p1 = timelineData.positions.get(lastId);
      const p2 = timelineData.positions.get(firstId);
      if (p1 && p2) {
        const points = [p1.x, p1.y, p1.z, p2.x, p2.y, p2.z];
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
        lines.push({ geometry: geo });
      }
    }
    return lines;
  }, [timelineData]);

  // Constellation stick-figure lines
  const constellationLines = useMemo(() => {
    const lines: { geometry: THREE.BufferGeometry }[] = [];
    for (const assignment of timelineData.constellationAssignments) {
      const constellation = constellations[assignment.constellationIndex];
      // Only draw lines between star indices that have concepts assigned
      const occupiedStarIndices = new Set<number>();
      for (let si = 0; si < assignment.conceptIds.length; si++) {
        occupiedStarIndices.add(si);
      }
      const points: number[] = [];
      for (const [a, b] of constellation.connections) {
        // Only draw this connection if BOTH endpoints have concepts
        if (!occupiedStarIndices.has(a) || !occupiedStarIndices.has(b)) continue;
        const sa = constellation.stars[a];
        const sb = constellation.stars[b];
        if (sa && sb) {
          const off = constellation.offset;
          points.push(sa.x + off.x, sa.y + off.y, sa.z + off.z);
          points.push(sb.x + off.x, sb.y + off.y, sb.z + off.z);
        }
      }
      if (points.length > 0) {
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
        lines.push({ geometry: geo });
      }
    }
    return lines;
  }, [timelineData]);

  // Date + constellation labels
  const labels = useMemo(() => {
    const result: { position: THREE.Vector3; date: string; name: string }[] = [];
    for (const assignment of timelineData.constellationAssignments) {
      const constellation = constellations[assignment.constellationIndex];
      const firstId = assignment.conceptIds[0];
      const pos = timelineData.positions.get(firstId);
      if (pos) {
        const d = assignment.firstDate;
        const dateStr = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        result.push({ position: pos.clone().add(new THREE.Vector3(0, 0.9, 0)), date: dateStr, name: constellation.name });
      }
    }
    return result;
  }, [timelineData]);

  // Concept name labels (limit to 25)
  const conceptLabels = useMemo(() => {
    const sorted = [...concepts].sort(
      (a, b) => parseLocalDate(a.date_learned).getTime() - parseLocalDate(b.date_learned).getTime()
    );
    return sorted.slice(0, 25).map(c => ({
      id: c.id,
      name: c.name.length > 20 ? c.name.slice(0, 18) + "…" : c.name,
      position: timelineData.positions.get(c.id)?.clone().add(new THREE.Vector3(0, -0.15, 0)) || new THREE.Vector3(),
    }));
  }, [concepts, timelineData]);

  // Create dashed line materials once
  const dashedMaterials = useRef<THREE.LineDashedMaterial[]>([]);
  const [labelOpacityState, setLabelOpacityState] = useState(0);
  const labelUpdateThrottle = useRef(0);

  useFrame((_, delta) => {
    if (enteringRef.current) {
      // Wait 1.6s for stars to arrive before fading in
      enterDelayRef.current += delta;
      if (enterDelayRef.current >= 1.6) {
        enteringRef.current = false;
        // Now start fading in
      }
      opacityRef.current = 0;
    } else if (leavingRef.current) {
      // Fade out quickly (0.5s)
      opacityRef.current = Math.max(opacityRef.current - delta * 2, 0);
      if (opacityRef.current <= 0.01) {
        leavingRef.current = false;
        leavingDoneRef.current = true;
        setVisible(false);
        onLinesHidden?.();
      }
    } else if (mode === "timeline") {
      // Fade in over ~0.8s
      opacityRef.current = Math.min(opacityRef.current + delta * 1.25, 1);
    }

    // Update label opacity state periodically (drives React re-renders for Html labels)
    labelUpdateThrottle.current++;
    if (labelUpdateThrottle.current % 5 === 0) {
      setLabelOpacityState(opacityRef.current);
    }

    // Update all line material opacities
    if (groupRef.current) {
      groupRef.current.traverse((child) => {
        if ((child as THREE.Line).isLine) {
          const mat = (child as THREE.Line).material as THREE.LineBasicMaterial | THREE.LineDashedMaterial;
          if (mat.userData?.baseOpacity != null) {
            mat.opacity = mat.userData.baseOpacity * opacityRef.current;
          }
        }
      });
    }

    // Update dashed materials
    for (const mat of dashedMaterials.current) {
      mat.opacity = (mat.userData?.baseOpacity ?? 0.3) * opacityRef.current;
    }
  });

  if (!visible) return null;

  return (
    <group ref={groupRef}>
      {/* Intra-constellation chronological path (solid) */}
      {intraLines.map((line, i) => {
        const mat = new THREE.LineBasicMaterial({ color: "#0ea5e9", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
        mat.userData = { baseOpacity: 0.4 };
        return <primitive key={`intra-${i}`} object={new THREE.Line(line.geometry, mat)} />;
      })}
      {/* Inter-constellation path (dashed) */}
      {interLines.map((line, i) => {
        const mat = new THREE.LineDashedMaterial({ color: "#0ea5e9", transparent: true, opacity: 0, dashSize: 0.15, gapSize: 0.1, blending: THREE.AdditiveBlending, depthWrite: false });
        mat.userData = { baseOpacity: 0.3 };
        // computeLineDistances needed for dashes to work
        const lineObj = new THREE.Line(line.geometry, mat);
        lineObj.computeLineDistances();
        if (!dashedMaterials.current.includes(mat)) dashedMaterials.current.push(mat);
        return <primitive key={`inter-${i}`} object={lineObj} />;
      })}
      {/* Constellation stick figures */}
      {constellationLines.map((line, i) => {
        const mat = new THREE.LineBasicMaterial({ color: "#4488cc", transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
        mat.userData = { baseOpacity: 0.15 };
        return <primitive key={`const-line-${i}`} object={new THREE.LineSegments(line.geometry, mat)} />;
      })}
      {/* Date + constellation labels */}
      {labelOpacityState > 0.05 && labels.map((label, i) => (
        <Html key={`label-${i}`} position={label.position} center style={{ pointerEvents: "none" }}>
          <div style={{ textAlign: "center", opacity: labelOpacityState }}>
            <div style={{
              fontSize: "14px",
              fontFamily: "monospace",
              color: "var(--text-muted)",
              opacity: 0.5,
              whiteSpace: "nowrap",
            }}>
              {label.date}
            </div>
            <div style={{
              fontSize: "15px",
              color: "var(--text-muted)",
              opacity: 0.25,
              whiteSpace: "nowrap",
              marginTop: "2px",
            }}>
              {label.name}
            </div>
          </div>
        </Html>
      ))}
      {/* Concept name labels */}
      {labelOpacityState > 0.05 && conceptLabels.map((cl) => (
        <Html key={`cname-${cl.id}`} position={cl.position} center style={{ pointerEvents: "none" }}>
          <div style={{
            fontSize: "9px",
            color: "var(--text-muted)",
            opacity: 0.4 * labelOpacityState,
            whiteSpace: "nowrap",
            fontFamily: "monospace",
          }}>
            {cl.name}
          </div>
        </Html>
      ))}
    </group>
  );
}

// Camera zoom-out rig: previously dollied the camera back during transition.
// Now disabled because the outer DOM container scales+translates the entire
// canvas to the upper-right, which provides the shrink effect more cleanly.
// Kept as a no-op so the rest of the Scene tree is untouched.
function CameraZoomRig() {
  return null;
}

function Scene({ concepts, dispersionRef, onConceptClick, hasSession, isMobile, orbitControlsRef }: { concepts: Concept[]; dispersionRef: React.MutableRefObject<{ target: number; current: number }>; onConceptClick: (concept: Concept) => void; hasSession: boolean; isMobile: boolean; orbitControlsRef: React.MutableRefObject<OrbitControlsImpl | null> }) {
  const [hovered, setHovered] = useState<Concept | null>(null);
  const [hoveredPos, setHoveredPos] = useState<THREE.Vector3 | null>(null);
  const { mode } = useScroll();
  const { phase: sbPhase } = useShadowbox();
  const [dispersionProgress, setDispersionProgress] = useState(0);
  // OrbitControls auto-rotates the camera around its target. While the
  // GalaxyReturnAnimator is manually driving the camera (entry/exit camera
  // reorient + shrink transition), auto-rotate would fight the lerp and
  // produce visible jitter. Disable it during those phases.
  const animatingCamera =
    sbPhase === "pre-enter" || sbPhase === "transition" || sbPhase === "pre-exit";
  const enableUserRotate = !animatingCamera;
  // Deferred mode: when leaving timeline, stars wait until lines fade out
  const [deferredMode, setDeferredMode] = useState(mode);
  const prevModeRef = useRef(mode);

  useEffect(() => {
    if (mode === "timeline") {
      // Entering timeline — stars move immediately
      setDeferredMode("timeline");
    } else if (prevModeRef.current === "timeline") {
      // Leaving timeline — defer star movement until lines hidden
      // deferredMode stays "timeline" until onLinesHidden fires
    } else {
      // Not involving timeline — immediate
      setDeferredMode(mode);
    }
    prevModeRef.current = mode;
  }, [mode]);

  const handleLinesHidden = useCallback(() => {
    // Lines have faded out — now let stars move
    setDeferredMode(prevModeRef.current);
  }, []);

  const handleHover = useCallback((concept: Concept | null, pos: THREE.Vector3 | null) => {
    setHovered(concept);
    setHoveredPos(pos);
  }, []);

  // Read dispersion progress each frame
  useFrame(() => {
    setDispersionProgress(dispersionRef.current.current);
  });

  return (
    <>
      <ambientLight intensity={0.2} />
      <CameraZoomRig />
      <group visible={dispersionProgress < 0.99}>
        <group>
          <GalaxyStars dispersionProgress={dispersionProgress} />
        </group>
      </group>
      <ConceptDots concepts={concepts} onHover={handleHover} onClick={onConceptClick} overrideMode={deferredMode} />
      <TimelineOverlay concepts={concepts} mode={mode} onLinesHidden={handleLinesHidden} />
      <Tooltip concept={hovered} position={hoveredPos} />
      <OrbitControls
        ref={orbitControlsRef}
        enableZoom={isMobile}
        enablePan={isMobile}
        enableRotate={enableUserRotate}
        autoRotate={enableUserRotate && mode === "galaxy"}
        autoRotateSpeed={0.3}
        touches={isMobile ? { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN } : undefined}
        mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: undefined as unknown as THREE.MOUSE, RIGHT: undefined as unknown as THREE.MOUSE }}
      />
      {/* When the user returns to the galaxy from the shadowbox sections,
          pull the camera out to a top-down overview wide enough to frame the
          entire galaxy. */}
      <GalaxyReturnAnimator controlsRef={orbitControlsRef} />
      <RightClickZoom />
      <Bloom />
      <DispersionController dispersionRef={dispersionRef} />
    </>
  );
}

interface Props {
  concepts: Concept[];
  onReady?: () => void;
}

export default function GalaxyVisualization({ concepts, onReady }: Props) {
  const { data: sessionData } = useSession();
  const { mode, nextMode, prevMode, setMode, pastVisualization, setPastVisualization } = useScroll();
  const { transition: sbTransition, phase: sbPhase } = useShadowbox();
  const [mounted, setMounted] = useState(false);
  const lastWheelTime = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const dispersionRef = useRef({ target: 0, current: 0 });
  // Ref into <OrbitControls> so the galaxy-return animator can drive both
  // the camera position AND the controls.target during the top-down pull-out.
  const orbitControlsRef = useRef<OrbitControlsImpl | null>(null);
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);
  const [showMobileHint, setShowMobileHint] = useState(true);
  const [touchedOnce, setTouchedOnce] = useState(false);
  // Track viewport size so the shadowbox shrink transform can land the
  // galaxy on the staged paper-galaxy's actual pixel position at any
  // viewport aspect ratio or zoom level.
  const [viewportSize, setViewportSize] = useState({ w: 1600, h: 900 });

  const handleConceptClick = useCallback((concept: Concept) => {
    router.push(`/concept/${concept.id}`);
  }, [router]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const update = () => setViewportSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Detect touch/mobile device (pointer: coarse = touchscreen)
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Drive dispersion target based on mode
  useEffect(() => {
    dispersionRef.current.target = mode === "galaxy" ? 0 : 1;
  }, [mode]);

  // Track whether we're in a scroll transition to prevent re-entrant triggers
  const isTransitioning = useRef(false);

  // Helper: snap to a scroll position and lock during animation
  const snapTo = useCallback((top: number, onDone?: () => void) => {
    isTransitioning.current = true;
    window.scrollTo({ top, behavior: "smooth" });
    // Listen for scroll end (scrollend event with fallback timeout)
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      isTransitioning.current = false;
      onDone?.();
    };
    window.addEventListener("scrollend", finish, { once: true });
    // Fallback: release after 800ms in case scrollend doesn't fire (Safari)
    setTimeout(finish, 800);
  }, []);

  // Fade out the hint after first touch interaction
  const handleFirstTouch = useCallback(() => {
    if (!touchedOnce) {
      setTouchedOnce(true);
      setTimeout(() => setShowMobileHint(false), 2000);
    }
  }, [touchedOnce]);

  // Scroll past the visualization on mobile (equivalent to desktop scroll-past)
  const handleScrollPast = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    setPastVisualization(true);
    snapTo(container.getBoundingClientRect().height + window.scrollY);
  }, [setPastVisualization, snapTo]);

  // Snap-back: when scrolling up and viz becomes partially visible, snap to top
  useEffect(() => {
    if (!mounted) return;
    const container = containerRef.current;
    if (!container) return;

    let lastY = window.scrollY;
    const handleScroll = () => {
      if (isTransitioning.current) return;

      const currentY = window.scrollY;
      const scrollingUp = currentY < lastY;
      lastY = currentY;

      if (!pastVisualization || !scrollingUp) return;

      const rect = container.getBoundingClientRect();
      // If any part of the viz is visible while scrolling up, snap back to it
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        setPastVisualization(false);
        setMode("timeline");
        snapTo(0);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mounted, pastVisualization, setPastVisualization, setMode, snapTo]);

  // Stuck-in-between fix: if page is idle at a position between galaxy and content, resolve it
  useEffect(() => {
    if (!mounted) return;
    const container = containerRef.current;
    if (!container) return;

    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const checkStuck = () => {
      if (isTransitioning.current) return;
      const rect = container.getBoundingClientRect();
      const scrollY = window.scrollY;
      // "Stuck" = scrolled past top of viz but not fully past it (in the dead zone)
      if (scrollY > 0 && rect.bottom > 0 && rect.top < 0 && !pastVisualization) {
        // Snap to content below
        setPastVisualization(true);
        snapTo(rect.height + scrollY);
      }
    };

    const handleScrollEnd = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(checkStuck, 150);
    };

    window.addEventListener("scroll", handleScrollEnd, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScrollEnd);
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, [mounted, pastVisualization, setPastVisualization, snapTo]);

  // Global scroll lock: intercept wheel events on the whole page
  useEffect(() => {
    if (!mounted) return;

    const handleWheel = (e: WheelEvent) => {
      const container = containerRef.current;
      if (!container) return;

      // Block all wheel events during transitions
      if (isTransitioning.current) { e.preventDefault(); return; }

      const rect = container.getBoundingClientRect();
      const viewportH = window.innerHeight;

      // Check if visualization section is in view (at least partially)
      const vizInView = rect.top < viewportH && rect.bottom > 0;

      // If we're past the visualization, allow normal scroll in both directions
      // (snap-back is handled by the scroll listener above)
      if (pastVisualization) {
        return;
      }

      // If visualization is in view and not past it, lock scroll
      if (vizInView && !pastVisualization) {
        e.preventDefault();

        const now = Date.now();
        if (now - lastWheelTime.current < 800) return;
        lastWheelTime.current = now;

        if (e.deltaY > 0) {
          // Scrolling down
          if (mode === "timeline") {
            // Already at last mode, scroll past visualization
            setPastVisualization(true);
            snapTo(rect.height + window.scrollY);
          } else {
            nextMode();
          }
        } else if (e.deltaY < 0) {
          // Scrolling up — if at galaxy (first mode), allow normal page scroll
          if (mode === "galaxy") {
            return;
          }
          prevMode();
        }
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [mounted, mode, nextMode, prevMode, pastVisualization, setPastVisualization, snapTo]);

  // Reset pastVisualization when mode changes back from timeline
  useEffect(() => {
    if (mode !== "timeline") {
      setPastVisualization(false);
    }
  }, [mode, setPastVisualization]);

  if (!mounted) {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div style={{ color: "var(--accent-mid)" }} className="animate-pulse text-lg">Loading visualization...</div>
      </div>
    );
  }

  // During shadowbox transition: scale the entire galaxy down to the size of
  // the paper galaxy in the upper-right, then fade out so the static paper
  // galaxy appears to take its place seamlessly.
  // sbTransition: 0 = full galaxy view, 1 = fully in upper-right
  //
  // The paper galaxy is laid out inside the Shadowbox Stage (1600x900 design
  // canvas, scaled-to-fit, centered). Its CSS box: `right-[4%] top-[6%]
  // w-[28%]`. We mirror that target in viewport pixel space so the shrink
  // lands exactly where the static paper galaxy will appear.
  //
  // pre-enter / pre-exit are camera-only stages — the outer DOM must stay at
  // its non-shrunk pose so the shrink/expand only happens during the
  // "transition" phase itself.
  const t =
    sbPhase === "galaxy" || sbPhase === "pre-enter" || sbPhase === "pre-exit"
      ? 0
      : sbPhase === "section"
      ? 1
      : sbTransition;
  // Stage geometry mirrored from src/components/Stage.tsx.
  const STAGE_W = 1600;
  const STAGE_H = 900;
  const stageScale = Math.min(viewportSize.w / STAGE_W, viewportSize.h / STAGE_H);
  // Stage's top-left in viewport pixels (centered with `align/justify center`).
  const stageLeftPx = (viewportSize.w - STAGE_W * stageScale) / 2;
  const stageTopPx = (viewportSize.h - STAGE_H * stageScale) / 2;
  // Paper galaxy center in design-canvas coords: right 4% + width 28%, top 6%.
  // The image is `w-[28%]`, height auto — but we don't know its natural aspect
  // ratio here; the paper galaxy image is approximately square so we treat
  // height ≈ 28% of stage width for the vertical center estimate.
  const paperRightPct = 4;
  const paperTopPct = 6;
  const paperWidthPct = 28;
  const paperCenterXdesign = STAGE_W * (1 - (paperRightPct + paperWidthPct / 2) / 100);
  const paperCenterYdesign = STAGE_H * (paperTopPct / 100) + (STAGE_W * paperWidthPct / 100) / 2;
  // Convert to viewport pixels.
  const paperCenterXvp = stageLeftPx + paperCenterXdesign * stageScale;
  const paperCenterYvp = stageTopPx + paperCenterYdesign * stageScale;
  // Galaxy container is `w-full h-screen`, so its center is the viewport center.
  const galaxyCenterXvp = viewportSize.w / 2;
  const galaxyCenterYvp = viewportSize.h / 2;
  // Translate the galaxy container so its center coincides with the paper
  // galaxy's center at t=1. translateXpx/translateYpx are in viewport pixels.
  const translateXpx = t * (paperCenterXvp - galaxyCenterXvp);
  const translateYpx = t * (paperCenterYvp - galaxyCenterYvp);
  // Shrink the galaxy so its visible diameter roughly matches the paper
  // galaxy's width. Original heuristic was scale 0.22 at fullscreen 16:9
  // (where stageScale=1 against a 1600x900 viewport). Now scale tracks the
  // paper galaxy's actual rendered width: (STAGE_W * paperWidthPct/100 *
  // stageScale) / viewportSize.h roughly. Keep the original ~0.22 endpoint
  // at the reference aspect ratio.
  const targetScaleAtT1 = (STAGE_W * (paperWidthPct / 100) * stageScale) / Math.min(viewportSize.w, viewportSize.h) * 0.78;
  const targetScale = 1 - t * (1 - Math.max(0.12, Math.min(0.35, targetScaleAtT1)));
  // Stay fully visible through the entire shrink. Only fade out AFTER the
  // galaxy has fully minimized into the paper-galaxy slot — i.e. once the
  // shadowbox has switched to the "section" phase. The CSS opacity transition
  // below (0.4s ease) handles the fade itself.
  const containerOpacity = sbPhase === "section" ? 0 : 1;

  return (
    <>
      {/* Galaxy-view starfield backdrop. Solid dark-blue gradient matching
          the painted sky.webp's tonal range (top ~rgb(22,31,48), bottom
          ~rgb(2,8,24)) with procedurally-generated stars overlaid. The
          shadowbox's own painted sky.webp (z=10) takes over once the user
          enters a section — by then this layer has faded out so the
          appearance handoff is visually continuous. */}
      <GalaxyStarfield opacity={containerOpacity} />
      <div
      ref={containerRef}
      id="galaxy-container"
      className="w-full h-screen relative"
      style={{
        opacity: containerOpacity,
        transformOrigin: "50% 50%",
        transform: `translate(${translateXpx}px, ${translateYpx}px) scale(${targetScale})`,
        // Smooth interpolation in both directions, so scrolling back up from
        // section to galaxy animates the shrink reversal rather than snapping.
        transition: "opacity 0.4s ease, transform 0.8s ease",
      }}
    >
      {/* Dedication quote — hidden once user enters the shadowbox */}
      <div
        className="absolute left-6 z-10 pointer-events-none"
        style={{
          top: isMobile ? "5.5rem" : "5rem",
          color: "var(--text-muted)",
          fontSize: "0.75rem",
          fontStyle: "italic",
          opacity: pastVisualization ? 0 : 0.6,
          maxWidth: isMobile ? "55vw" : "480px",
          lineHeight: 1.5,
          transition: "opacity 0.5s ease",
        }}
      >
        Dedicated to the bright lights that have guided me<br />through wayward roads, tumultuous seas, and trying times
      </div>
      {/* Mode title overlay — hidden once user enters the shadowbox */}
      <div
        className="absolute right-6 z-10 pointer-events-none text-right"
        style={{
          top: isMobile ? "5.5rem" : "5rem",
          opacity: pastVisualization ? 0 : 1,
          transition: "opacity 0.5s ease",
        }}
      >
        <h2
          className="text-3xl sm:text-4xl font-bold tracking-tight"
          style={{
            color: "var(--accent-mid)",
            opacity: 0.85,
            transition: "opacity 0.5s ease",
            textShadow: "0 2px 20px rgba(0,0,0,0.5)",
          }}
        >
          {mode === "galaxy" ? "Galaxy" : mode === "reduction" ? "Clusters" : "Timeline"}
        </h2>
        {!isMobile && (
          <p
            className="text-sm mt-1"
            style={{
              color: "var(--text-muted)",
              opacity: 0.7,
              maxWidth: "280px",
              marginLeft: "auto",
              transition: "opacity 0.5s ease",
            }}
          >
            {mode === "galaxy"
              ? "Each star is a concept — scroll to explore"
              : mode === "reduction"
              ? "Concepts clustered by semantic similarity"
              : "Concepts arranged chronologically"}
          </p>
        )}
      </div>
      <Canvas
        camera={{ position: [0, 3, 8], fov: 60 }}
        style={{ background: "transparent", touchAction: isMobile ? "none" : "auto" }}
        gl={{ antialias: true, alpha: true }}
        onCreated={() => { if (onReady) onReady(); }}
        onTouchStart={isMobile ? handleFirstTouch : undefined}
      >
        <Scene concepts={concepts} dispersionRef={dispersionRef} onConceptClick={handleConceptClick} hasSession={!!sessionData} isMobile={isMobile} orbitControlsRef={orbitControlsRef} />
      </Canvas>
      {/* Bottom overlay — isolated from canvas touch events; hidden in shadowbox */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 flex flex-col items-center"
        style={{
          paddingBottom: "1.5rem",
          gap: "0.75rem",
          pointerEvents: "none",
          opacity: pastVisualization ? 0 : 1,
          transition: "opacity 0.5s ease",
        }}
      >
        {/* Mobile: drag/pinch hint */}
        {isMobile && showMobileHint && (
          <div
            style={{
              color: "var(--text-muted)",
              fontSize: "11px",
              opacity: touchedOnce ? 0 : 0.55,
              transition: "opacity 1.5s ease",
              whiteSpace: "nowrap",
              letterSpacing: "0.04em",
              pointerEvents: "none",
            }}
          >
            drag to rotate · pinch to zoom
          </div>
        )}
        {/* Mobile: scroll past button */}
        {isMobile && (
          <button
            onPointerDown={(e) => { e.stopPropagation(); handleScrollPast(); }}
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1px solid rgba(255,255,255,0.13)",
              borderRadius: "20px",
              padding: "7px 18px",
              color: "var(--text-muted)",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              letterSpacing: "0.03em",
              whiteSpace: "nowrap",
              touchAction: "manipulation",
              pointerEvents: "auto",
            }}
          >
            <span style={{ fontSize: "10px" }}>↓</span> Explore Portfolio
          </button>
        )}
        {/* Mode toggle pills */}
        <div style={{ display: "flex", gap: "0.5rem", pointerEvents: "auto" }}>
          {(["galaxy", "reduction", "timeline"] as const).map((m) => (
            <button
              key={m}
              onPointerDown={(e) => { e.stopPropagation(); setMode(m); }}
              style={{
                width: isMobile ? "3.5rem" : "2rem",
                height: isMobile ? "2.75rem" : "0.375rem",
                padding: isMobile ? "1.1rem 0.5rem" : "0",
                background: "transparent",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                touchAction: "manipulation",
                pointerEvents: "auto",
              }}
              aria-label={m === "galaxy" ? "Galaxy view" : m === "reduction" ? "Clusters view" : "Timeline view"}
            >
              <span
                style={{
                  display: "block",
                  width: "100%",
                  height: isMobile ? "0.6rem" : "0.375rem",
                  borderRadius: "9999px",
                  background: mode === m ? "var(--accent-mid)" : "rgba(255,255,255,0.2)",
                  transform: mode === m ? "scaleX(1.15)" : "scaleX(1)",
                  transition: "background 0.5s ease, transform 0.5s ease",
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// GalaxyReturnAnimator — drives a smooth top-down "open the box" camera move
// whenever the shadowbox transitions back to the galaxy phase. The galaxy is
// a flat spiral on the XZ plane (Y is thickness), so a true top-down view sits
// the camera on +Y looking straight down at the origin. Distance is chosen so
// the galaxy's outermost arms fit comfortably inside the viewport at FOV 60°
// regardless of aspect ratio.
// ─────────────────────────────────────────────────────────────────────────────

// Galaxy geometry summary (see ARM_X_MEAN / ARM_X_DIST / GALAXY_SCALE above):
//   arm stars centred at ±200 with stdev 100, scaled by 0.03.
// So 3-sigma reach is ~(200 + 3·100) * 0.03 ≈ 15 world-units from origin.
const GALAXY_FIT_RADIUS = 15;
// Distance to fit `radius` vertically at FOV 60°: r / tan(fov/2). Multiply by
// a fudge factor so narrow (portrait-ish) browser viewports still frame the
// whole galaxy without clipping the horizontal extent.
const GALAXY_TOPDOWN_HEIGHT = (() => {
  const fovRad = (60 * Math.PI) / 180;
  const fit = GALAXY_FIT_RADIUS / Math.tan(fovRad / 2);
  return fit * 1.25;
})();

// Default perspective pose — matches the camera prop on the <Canvas> below.
// Used as the "return to" pose when leaving the shadowbox.
const PERSPECTIVE_CAMERA_POS = new THREE.Vector3(0, 3, 8);
const TOPDOWN_CAMERA_POS = new THREE.Vector3(0, GALAXY_TOPDOWN_HEIGHT, 0);
const ORIGIN_TARGET = new THREE.Vector3(0, 0, 0);

function GalaxyReturnAnimator({
  controlsRef,
}: {
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>;
}) {
  const { camera } = useThree();
  const { phase } = useShadowbox();
  // The animator drives the camera toward one of two poses depending on
  // shadowbox phase:
  //   pre-enter, transition  → top-down "paper galaxy" pose
  //   pre-exit               → default perspective pose
  // In all other phases it stays inert and lets the user control the camera
  // via OrbitControls.
  const targetRef = useRef<"topdown" | "perspective" | null>(null);
  const prevPhaseRef = useRef(phase);

  useEffect(() => {
    if (phase === "pre-enter" || phase === "transition") {
      // Entering: lerp to top-down. Also re-engages on the return-trip
      // transition (galaxy unshrinking) so we stay top-down through the
      // shrink reversal.
      targetRef.current = "topdown";
    } else if (phase === "pre-exit") {
      // Exiting: lerp from top-down back to perspective.
      targetRef.current = "perspective";
    } else {
      // galaxy / section — done animating, hand control back to OrbitControls.
      targetRef.current = null;
    }
    prevPhaseRef.current = phase;
  }, [phase]);

  useFrame(() => {
    const target = targetRef.current;
    if (!target) return;
    const ctrls = controlsRef.current;
    if (!ctrls?.target) return;
    // Exponential approach via Vector3.lerp(): lerps quickly at first,
    // decelerates as it lands. Higher k = snappier; 0.08 settles in ~600ms
    // which matches PRE_ENTER_MS.
    const k = 0.08;
    const desiredPos = target === "topdown" ? TOPDOWN_CAMERA_POS : PERSPECTIVE_CAMERA_POS;
    camera.position.lerp(desiredPos, k);
    ctrls.target.lerp(ORIGIN_TARGET, k);
    camera.lookAt(ctrls.target);
    ctrls.update?.();
  });
  return null;
}
