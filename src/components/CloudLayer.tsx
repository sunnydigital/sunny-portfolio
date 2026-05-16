"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

const CLOUD_SRCS = [
  "/shadowbox/cloud-1.webp",
  "/shadowbox/cloud-2.webp",
  "/shadowbox/cloud-3.webp",
  "/shadowbox/cloud-4.webp",
];

// One floating cloud carrying optional ReactNode content. Drifts left-to-right
// (or right-to-left if `dir = -1`) via CSS @keyframes — using CSS instead of
// JS requestAnimationFrame so that `animation-play-state: paused` (set by the
// `group-hover` pseudo) works reliably without React re-renders fighting the
// hover state.
interface FloatingCloudProps {
  src: string;
  widthVw: number;
  topVh: number;
  durationS: number;
  dir: 1 | -1;
  children?: ReactNode;
  // Reports the side the cloud exited on so the slot can decide where the
  // replacement cloud should re-enter. "natural" = CSS animation iteration
  // (no user input), "right"/"left" = JS-mode exit (drift or fling).
  onCycleDone?: (exit: "left" | "right" | "natural") => void;
  // Fraction 0..1 into the trajectory at which to start on the first cycle.
  // Used to stagger slots so same-direction clouds don't bunch up. Subsequent
  // cycles always start at 0. Default 0 (off-screen start).
  startPhase?: number;
}

// Unique-per-cloud animation name so multiple clouds with different widths /
// directions don't share keyframes.
let animSeq = 0;

function FloatingCloud({
  src,
  widthVw,
  topVh,
  durationS,
  dir,
  children,
  onCycleDone,
  startPhase = 0,
}: FloatingCloudProps) {
  const animNameRef = useRef<string>(`cloud-drift-${animSeq++}`);
  const animName = animNameRef.current;
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  // mode: "css" — CSS animation drives motion. "js" — JS rAF drives motion
  // (used after any user interaction).
  const [mode, setMode] = useState<"css" | "js">("css");
  // For CSS mode, hover paused the animation.
  const [cssPaused, setCssPaused] = useState(false);
  const [iteration, setIteration] = useState(0);
  // JS-mode position (vw) and velocity (vw/sec).
  const xVwRef = useRef(0);
  const velocityRef = useRef(0); // vw/s — signed, used for flinging
  // Drag tracking
  const dragStartRef = useRef<{
    x: number;
    t: number;
    cloudXVw: number;
    moved: boolean;
  } | null>(null);
  // Velocity samples during drag: timestamps + clientX pairs
  const velSamplesRef = useRef<{ t: number; x: number }[]>([]);
  // jsPhase: "drift" | "drag" | "fling" — only meaningful when mode === "js"
  const jsPhaseRef = useRef<"drift" | "drag" | "fling">("drift");
  const hoverRef = useRef(false);
  const [, forceRender] = useState(0);
  const rerender = () => forceRender((n) => n + 1);

  // Trajectory bounds — out of viewport on each side.
  const startVw = dir === 1 ? -widthVw : 100 + widthVw;
  const endVw = dir === 1 ? 100 + widthVw : -widthVw;
  const exitedLeft = (x: number) => x < -widthVw - 5;
  const exitedRight = (x: number) => x > 100 + widthVw + 5;
  const exited = (x: number) => exitedLeft(x) || exitedRight(x);

  // Generate per-cloud keyframes covering drift + fade in/out. Using a unique
  // CSS animation name per cloud avoids interference with concurrent clouds.
  const keyframes = `
    @keyframes ${animName} {
      0%   { transform: translateX(${startVw}vw); opacity: 0; }
      8%   { opacity: 1; }
      85%  { opacity: 1; }
      100% { transform: translateX(${endVw}vw); opacity: 0; }
    }
  `;

  // -----------------------------------------------------------------
  // JS-mode physics loop. Runs as long as mode === "js". Each frame:
  //   - drift: cloud continues at base velocity (signed) until exit
  //   - drag:  position is set by pointer; no rAF-driven motion
  //   - fling: cloud moves at velocityRef.current, capped & lightly damped,
  //            paused when hoverRef true. Ends when cloud exits viewport.
  useEffect(() => {
    if (mode !== "js") return;
    let last = performance.now();
    let frame = 0;
    const driftSpeed = (endVw - startVw) / durationS; // signed vw/s
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const phase = jsPhaseRef.current;
      if (phase === "drift") {
        if (!hoverRef.current) xVwRef.current += driftSpeed * dt;
      } else if (phase === "fling") {
        if (!hoverRef.current) {
          xVwRef.current += velocityRef.current * dt;
          // gentle linear damping so a hard fling slows over distance
          const damp = 0.4 * dt;
          velocityRef.current *= Math.max(0, 1 - damp);
        }
      }
      // drag has no rAF motion — position is set in onPointerMove
      if (wrapperRef.current) {
        wrapperRef.current.style.transform = `translateX(${xVwRef.current}vw)`;
      }
      if (phase !== "drag" && exited(xVwRef.current)) {
        const side = exitedRight(xVwRef.current) ? "right" : "left";
        onCycleDone?.(side);
        return; // stop the rAF loop; component will be remounted by parent
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // -----------------------------------------------------------------
  // Pointer handlers. Click-vs-drag threshold of 6px so a small wiggle still
  // triggers the child's onClick navigation. Once threshold is exceeded the
  // cloud transitions to JS mode permanently for its lifetime.
  const DRAG_THRESHOLD_PX = 6;

  const captureCurrentXVw = () => {
    // Compute the cloud's current visible X position from getBoundingClientRect
    // and stash it as the JS-mode starting position. Converts px → vw.
    const el = wrapperRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return (rect.left / window.innerWidth) * 100;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== undefined && e.button !== 0) return;
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    const cloudXVw = mode === "js" ? xVwRef.current : captureCurrentXVw();
    dragStartRef.current = {
      x: e.clientX,
      t: performance.now(),
      cloudXVw,
      moved: false,
    };
    velSamplesRef.current = [{ t: performance.now(), x: e.clientX }];
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const start = dragStartRef.current;
    if (!start) return;
    const dxPx = e.clientX - start.x;
    if (!start.moved && Math.abs(dxPx) < DRAG_THRESHOLD_PX) return;
    if (!start.moved) {
      // Threshold crossed — enter JS mode + drag phase.
      start.moved = true;
      jsPhaseRef.current = "drag";
      if (mode !== "js") {
        // Snapshot current visible position before switching to JS-driven motion.
        xVwRef.current = start.cloudXVw;
        setMode("js");
      }
    }
    // X-axis only: dy ignored.
    const dxVw = (dxPx / window.innerWidth) * 100;
    xVwRef.current = start.cloudXVw + dxVw;
    velSamplesRef.current.push({ t: performance.now(), x: e.clientX });
    // Keep only the last ~120ms of samples for velocity estimation
    const cutoff = performance.now() - 120;
    velSamplesRef.current = velSamplesRef.current.filter((s) => s.t >= cutoff);
    if (wrapperRef.current) {
      wrapperRef.current.style.transform = `translateX(${xVwRef.current}vw)`;
    }
    rerender(); // ensure mode change picks up
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const start = dragStartRef.current;
    dragStartRef.current = null;
    (e.currentTarget as Element).releasePointerCapture?.(e.pointerId);
    if (!start || !start.moved) {
      // Treat as a click — do nothing here; the inner content's onClick will
      // bubble naturally (we did not preventDefault).
      return;
    }
    // Compute release velocity from the last ~100ms of samples.
    const samples = velSamplesRef.current;
    let vxPxPerS = 0;
    if (samples.length >= 2) {
      const first = samples[0];
      const last = samples[samples.length - 1];
      const dt = (last.t - first.t) / 1000;
      if (dt > 0.001) vxPxPerS = (last.x - first.x) / dt;
    }
    const vxVwPerS = (vxPxPerS / window.innerWidth) * 100;
    // Clamp to a reasonable max so a violent fling doesn't teleport off-screen.
    velocityRef.current = Math.max(-300, Math.min(300, vxVwPerS));
    jsPhaseRef.current = "fling";
  };

  const onPointerCancel = onPointerUp;
  const onPointerEnter = () => {
    hoverRef.current = true;
    if (mode === "css") setCssPaused(true);
    rerender();
  };
  const onPointerLeave = () => {
    hoverRef.current = false;
    if (mode === "css") setCssPaused(false);
    rerender();
  };

  // CSS animation only used while mode === "css".
  const cssAnimation = mode === "css"
    ? {
        animation: `${animName} ${durationS}s linear infinite`,
        animationDelay:
          iteration === 0 && startPhase > 0 ? `-${durationS * startPhase}s` : "0s",
        animationPlayState: cssPaused ? "paused" : "running",
      }
    : {
        animation: "none",
        // Initial transform stays applied during js mode (rAF loop writes
        // directly to wrapperRef.current.style.transform)
      };

  return (
    <>
      <style>{keyframes}</style>
      <div
        ref={wrapperRef}
        className="absolute"
        style={{
          top: `${topVh}vh`,
          left: 0,
          width: `${widthVw}vw`,
          // Both content clouds and decorative drifters are interactive so the
          // user can drag any cloud (whether or not it has text content).
          pointerEvents: "auto",
          ...cssAnimation,
          willChange: "transform, opacity",
          cursor: jsPhaseRef.current === "drag" ? "grabbing" : "grab",
          touchAction: "none",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onAnimationIteration={() => {
          // Only fires while CSS animation is active.
          setIteration((n) => n + 1);
          onCycleDone?.("natural");
        }}
      >
        <img
          src={src}
          alt=""
          aria-hidden
          draggable={false}
          className="block w-full select-none"
          style={{
            filter: "drop-shadow(0 4px 10px rgba(0,0,0,0.25))",
            pointerEvents: "auto",
          }}
        />
        {children && (() => {
          // Per-cloud-image content alignment. Each cloud silhouette is a
          // different shape so the safe text region differs. Values are
          // tuned empirically — keep text centered but nudge it toward the
          // visually-thicker half of each cloud.
          let padY = "py-[10%]";
          if (src.includes("cloud-1")) {
            // cloud-1: chunky cumulus, heavier top — push down.
            padY = "pt-[18%] pb-[6%]";
          } else if (src.includes("cloud-2")) {
            // cloud-2: long low stratus, balanced — slight downward nudge.
            padY = "pt-[14%] pb-[8%]";
          } else if (src.includes("cloud-3")) {
            // cloud-3: three-bump cluster, slightly top-heavy — gentle nudge down.
            padY = "pt-[16%] pb-[8%]";
          }
          // cloud-4: smooth oval, default centering.
          return (
            <div
              className={`absolute inset-0 flex items-center justify-center px-[10%] ${padY}`}
              // Cloud paper is cream — force dark text for contrast regardless of theme.
              style={{ color: "#1f1a17", pointerEvents: "auto" }}
            >
              <div className="w-full text-center">{children}</div>
            </div>
          );
        })()}
      </div>
    </>
  );
}

// Renders a cloud layer for a section. `items` is the list of content nodes
// that cycle through `slots` visible cloud positions. Each slot independently
// advances to the next item once its current cloud has drifted off.
//
// If `items` has length 1 (e.g., About), we render exactly one slow-drifting
// cloud that re-spawns the same content.
//
// `decorative` adds N empty drifting clouds at faster speeds in both directions
// for atmospheric texture.
export interface CloudLayerProps {
  items: ReactNode[];
  slots?: number;
  baseDurationS?: number;
  decorative?: number;
  // vh band the content clouds travel through
  topRange?: [number, number];
  // Optional explicit width (vw) for content clouds. If omitted, defaults to
  // varying 32–40vw based on slot/cycle index.
  widthVw?: number;
}

export default function CloudLayer({
  items,
  slots = 2,
  baseDurationS = 38,
  decorative = 3,
  topRange = [18, 32],
  widthVw,
}: CloudLayerProps) {
  return (
    <>
      {/* Decorative drifters: z=40 — sit BEHIND the entire hill stack (whose
          parent stacking context lives at z=50) but in front of stars (z=11),
          galaxy + moon (z=12). So drifters appear as atmospheric clouds in
          the sky band, occluded by the hills they pass behind. */}
      <div className="absolute inset-0" style={{ zIndex: 40, pointerEvents: "none" }}>
        {Array.from({ length: decorative }).map((_, i) => (
          <DecorativeCloudSlot
            key={`deco-${i}`}
            slotIndex={i}
            slotCount={decorative}
          />
        ))}
      </div>
      {/* Content clouds: frontmost so they're always readable and the
          pause-on-hover target is unambiguously the cloud. */}
      <div className="absolute inset-0" style={{ zIndex: 150, pointerEvents: "none" }}>
        {Array.from({ length: slots }).map((_, i) => (
          <ContentCloudSlot
            key={`content-${i}`}
            slotIndex={i}
            slotCount={slots}
            items={items}
            baseDurationS={baseDurationS}
            topRange={topRange}
            widthVw={widthVw}
          />
        ))}
      </div>
    </>
  );
}

function ContentCloudSlot({
  slotIndex,
  slotCount,
  items,
  baseDurationS,
  topRange,
  widthVw: widthOverride,
}: {
  slotIndex: number;
  slotCount: number;
  items: ReactNode[];
  baseDurationS: number;
  topRange: [number, number];
  widthVw?: number;
}) {
  // Each slot starts on a different item, staggered phase offset so they
  // don't bunch up.
  const [itemIdx, setItemIdx] = useState(slotIndex % items.length);
  const [cycleKey, setCycleKey] = useState(0);
  // Direction override for the *next* mount, set by the last exit side so the
  // next cloud re-enters from the opposite edge of where the user flicked.
  // null = use the slot's default direction.
  const [nextDirOverride, setNextDirOverride] = useState<1 | -1 | null>(null);
  const onCycleDone = (exit: "left" | "right" | "natural") => {
    setItemIdx((i) => (i + slotCount) % items.length);
    setCycleKey((k) => k + 1);
    // Flicked right → reappear from left (dir=1). Flicked left → from right (dir=-1).
    // Natural cycle end keeps the slot's default direction.
    if (exit === "right") setNextDirOverride(1);
    else if (exit === "left") setNextDirOverride(-1);
    else setNextDirOverride(null);
  };

  // Stable variant per slot+cycle so the cloud silhouette varies
  const cloudSrc = CLOUD_SRCS[(slotIndex + cycleKey) % CLOUD_SRCS.length];
  const widthVw = widthOverride ?? 32 + ((slotIndex + cycleKey) % 3) * 4; // 32, 36, 40
  // Stagger vertically so same-direction slots also separate on the y axis.
  const topVh = topRange[0] + (slotIndex % Math.max(1, slotCount)) * ((topRange[1] - topRange[0]) / Math.max(1, slotCount));
  const defaultDir: 1 | -1 = slotIndex % 2 === 0 ? 1 : -1;
  const dir: 1 | -1 = nextDirOverride ?? defaultDir;
  const duration = baseDurationS + (slotIndex % 3) * 4;

  // Randomize each slot's initial startPhase across the trajectory so the
  // first set of clouds is spread out across the screen width. Seeded by
  // slotIndex so the layout is stable per page-load. Across (0.10, 0.90).
  const seed = (slotIndex * 2654435761) >>> 0;
  const seededRand = ((seed ^ (seed >>> 16)) % 10000) / 10000; // 0..1
  const startPhase = 0.10 + seededRand * 0.80;

  return (
    <FloatingCloud
      key={`${slotIndex}-${cycleKey}`}
      src={cloudSrc}
      widthVw={widthVw}
      topVh={topVh}
      durationS={duration}
      dir={dir}
      onCycleDone={onCycleDone}
      // On first cycle, start at a slot-specific phase of the trajectory so
      // same-direction clouds don't overlap. Later cycles spawn normally
      // (off-screen) since their start time is naturally staggered by the
      // previous cycle completion.
      startPhase={cycleKey === 0 ? startPhase : 0}
    >
      {items[itemIdx]}
    </FloatingCloud>
  );
}

function DecorativeCloudSlot({
  slotIndex,
  slotCount,
}: {
  slotIndex: number;
  slotCount: number;
}) {
  const [cycleKey, setCycleKey] = useState(0);
  const [nextDirOverride, setNextDirOverride] = useState<1 | -1 | null>(null);
  const onCycleDone = (exit: "left" | "right" | "natural") => {
    setCycleKey((k) => k + 1);
    if (exit === "right") setNextDirOverride(1);
    else if (exit === "left") setNextDirOverride(-1);
    else setNextDirOverride(null);
  };

  // Tiny faster decorative clouds, varied
  const cloudSrc = CLOUD_SRCS[(slotIndex + cycleKey * 3) % CLOUD_SRCS.length];
  const widthVw = 10 + ((slotIndex + cycleKey) % 4) * 3; // 10..19vw
  const topVh = 8 + ((slotIndex + cycleKey * 7) % 9) * 4; // 8..40vh roughly
  const defaultDir: 1 | -1 = (slotIndex + cycleKey) % 2 === 0 ? 1 : -1;
  const dir: 1 | -1 = nextDirOverride ?? defaultDir;
  const duration = 55 + ((slotIndex + cycleKey) % 6) * 6; // 55..85s
  void slotCount;

  return (
    <FloatingCloud
      key={`${slotIndex}-${cycleKey}`}
      src={cloudSrc}
      widthVw={widthVw}
      topVh={topVh}
      durationS={duration}
      dir={dir}
      onCycleDone={onCycleDone}
    />
  );
}

// TitleCloud: a single dedicated cloud-4 silhouette carrying just the
// section title in blue. Drifts continuously left→right across the middle
// vertical band of the viewport, looping forever. Sits at z=140 — above the
// cluster (z=100) so it's always visible, just below content clouds (z=150)
// so passing content can briefly occlude it for depth.
export function TitleCloud({ title, subtitle }: { title: string; subtitle?: string }) {
  // Pick a left→right or right→left direction at mount, stable per render.
  // useMemo with `Math.random` resolves once per component instance — section
  // navigation remounts TitleCloud so each entry to a section picks fresh.
  const initialDir = useMemo<1 | -1>(() => (Math.random() < 0.5 ? 1 : -1), []);
  const [cycleKey, setCycleKey] = useState(0);
  const [nextDirOverride, setNextDirOverride] = useState<1 | -1 | null>(null);
  // When flung off-screen the JS rAF loop ends and the cloud disappears, since
  // TitleCloud isn't backed by a parent slot. Respawn it ourselves: bump
  // cycleKey to remount FloatingCloud, and override its dir so it re-enters
  // from the opposite edge of where the user flicked.
  const onCycleDone = (exit: "left" | "right" | "natural") => {
    if (exit === "right") setNextDirOverride(1);
    else if (exit === "left") setNextDirOverride(-1);
    else return; // CSS iteration loops naturally — no remount needed.
    setCycleKey((k) => k + 1);
  };
  const dir: 1 | -1 = nextDirOverride ?? initialDir;
  return (
    <div className="absolute inset-0" style={{ zIndex: 140, pointerEvents: "none" }}>
      <FloatingCloud
        key={cycleKey}
        src="/shadowbox/cloud-4.webp"
        widthVw={13}
        topVh={42}
        durationS={75}
        dir={dir}
        startPhase={cycleKey === 0 ? 0.25 : 0}
        onCycleDone={onCycleDone}
      >
        <div className="flex flex-col items-center">
          <h2
            className="font-bold tracking-wide whitespace-nowrap"
            style={{
              color: "#0d3a55",
              // Text uses viewport-width-ish sizing independent of the cloud
              // (cloud is half-sized but text is the same as before).
              fontSize: "clamp(1rem, 2.4vw, 2.2rem)",
              margin: 0,
              lineHeight: 1.1,
            }}
          >
            {title}
          </h2>
          {subtitle && (
            <p
              className="italic whitespace-nowrap"
              style={{
                color: "#1f1a17",
                opacity: 0.75,
                fontSize: "clamp(0.55rem, 0.9vw, 0.85rem)",
                marginTop: "0.15em",
                lineHeight: 1.1,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </FloatingCloud>
    </div>
  );
}

// EmbeddedCard: a stationary paper-card anchored on the hill for sections
// that don't drift (Skills, Resume, Contact). Sits in front of the hill but
// behind the section's UI chrome.
interface EmbeddedCardProps {
  children: ReactNode;
  widthVw?: number;
  topVh?: number;
}

export function EmbeddedCard({ children, widthVw = 70, topVh = 18 }: EmbeddedCardProps) {
  return (
    <motion.div
      className="absolute left-1/2 pointer-events-auto"
      style={{
        top: `${topVh}vh`,
        width: `${widthVw}vw`,
        zIndex: 150,
        transform: "translateX(-50%)",
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative">
        <img
          src="/shadowbox/paper-card.webp"
          alt=""
          aria-hidden
          draggable={false}
          className="block w-full select-none"
          style={{ filter: "drop-shadow(0 8px 18px rgba(0,0,0,0.35))" }}
        />
        <div
          className="absolute inset-0 flex items-start justify-center px-[6%] py-[5%]"
          style={{ color: "var(--text)" }}
        >
          <div className="w-full max-h-full overflow-y-auto" style={{ scrollbarWidth: "thin" }}>
            {children}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
