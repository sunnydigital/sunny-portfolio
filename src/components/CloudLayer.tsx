"use client";

import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";

const CLOUD_SRCS = [
  "/shadowbox/cloud-1.webp",
  "/shadowbox/cloud-2.webp",
  "/shadowbox/cloud-3.webp",
  "/shadowbox/cloud-4.webp",
];

// Preload every cloud silhouette once, globally. Without this, each <img>
// fetches independently the first time a section mounts — and because the
// webps range from ~22KB to ~68KB, the smaller ones paint first and the
// larger ones pop in afterwards. Visually that looks like back clouds
// arriving and being clipped by center clouds that haven't loaded yet.
// We resolve a single shared promise once every sprite has decoded, and
// CloudLayer/TitleCloud gate their first render on it so the whole set
// appears in the same frame.
let cloudsReadyPromise: Promise<void> | null = null;
function ensureCloudsPreloaded(): Promise<void> {
  if (cloudsReadyPromise) return cloudsReadyPromise;
  if (typeof window === "undefined") return Promise.resolve();
  cloudsReadyPromise = Promise.all(
    CLOUD_SRCS.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            // `decode()` waits for the bitmap to be ready to paint, not just
            // for the bytes to arrive — avoids the first-paint hitch.
            img.decode?.().catch(() => {}).finally(() => resolve());
          };
          img.onerror = () => resolve();
          img.src = src;
        }),
    ),
  ).then(() => undefined);
  return cloudsReadyPromise;
}

let cloudsAlreadyReady = false;
function useCloudsReady(): boolean {
  // If preloading already finished on a prior mount, the singleton resolves
  // synchronously and we want the first render to already be `true` — no
  // one-frame gap. Track that with a module-level flag.
  const [ready, setReady] = useState<boolean>(cloudsAlreadyReady);
  useEffect(() => {
    if (ready) return;
    let cancelled = false;
    ensureCloudsPreloaded().then(() => {
      if (cancelled) return;
      cloudsAlreadyReady = true;
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [ready]);
  return ready;
}

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
  // When true, measure the child's natural size against the cloud's safe inner
  // region and uniformly scale the child down so it never overflows the cloud
  // silhouette. Use for content that uses absolute units (e.g., Tailwind
  // text-lg, fixed-px image boxes) instead of cqw-relative sizing.
  fit?: boolean;
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
  fit = false,
}: FloatingCloudProps) {
  const animNameRef = useRef<string>(`cloud-drift-${animSeq++}`);
  const animName = animNameRef.current;
  const [paused, setPaused] = useState(false);
  const [iteration, setIteration] = useState(0);

  // Trajectory bounds — out of the stage on each side. Units are now `%`
  // (of the stage / parent) instead of `vw` so the drift tracks the Stage
  // box at any viewport aspect ratio. `widthVw` is kept as the prop name
  // for compatibility but is interpreted as "% of stage width".
  const startPct = dir === 1 ? -widthVw : 100 + widthVw;
  const endPct = dir === 1 ? 100 + widthVw : -widthVw;

  // Generate per-cloud keyframes covering drift + fade in/out. Using a unique
  // CSS animation name per cloud avoids interference with concurrent clouds.
  // Use `%` so the keyframe scales relative to the cloud wrapper's own
  // width (which is itself `widthVw%` of the stage) — meaning a cloud of
  // width N% starts at -N% and ends at 100% + N%, fully off-stage at both
  // ends. translate% is relative to the element's own size, so we scale by
  // (100/widthVw) to express stage-percent in element-percent.
  const startElPct = (startPct / widthVw) * 100;
  const endElPct = (endPct / widthVw) * 100;
  // Fade in/out boundaries are tied to the off-stage portion of the trajectory
  // so the cloud is fully opaque the entire time its silhouette is over the
  // stage. Total trajectory spans (100 + 2*widthVw)% of stage; the cloud is
  // off-stage during the first/last widthVw of that. We bring fade-in/out
  // slightly tighter than the strict edge (0.6x) so the appear/disappear
  // happens just past the visible edge rather than the moment it crosses.
  const offStageFraction = widthVw / (100 + 2 * widthVw);
  const fadeInEnd = +(offStageFraction * 0.6 * 100).toFixed(2);
  const fadeOutStart = +(100 - offStageFraction * 0.6 * 100).toFixed(2);
  const keyframes = `
    @keyframes ${animName} {
      0%   { transform: translateX(${startElPct}%); opacity: 0; }
      ${fadeInEnd}%   { opacity: 1; }
      ${fadeOutStart}%  { opacity: 1; }
      100% { transform: translateX(${endElPct}%); opacity: 0; }
    }
  `;

  // Hover-to-pause: pointer events on the cloud wrapper toggle the CSS
  // animation play state. Children remain freely clickable because the wrapper
  // doesn't intercept clicks (no setPointerCapture, no preventDefault).
  const onPointerEnter = children ? () => setPaused(true) : undefined;
  const onPointerLeave = children ? () => setPaused(false) : undefined;

  return (
    <>
      <style>{keyframes}</style>
      <div
        className="absolute"
        style={{
          // `topVh` and `widthVw` are kept as prop names for compatibility,
          // but inside the Stage they're interpreted as percentages of the
          // stage box rather than the viewport.
          top: `${topVh}%`,
          left: 0,
          width: `${widthVw}%`,
          // Only content clouds (those with children) accept pointer events
          // so decorative drifters never intercept clicks aimed at things
          // behind them.
          pointerEvents: children ? "auto" : "none",
          animation: `${animName} ${durationS}s linear infinite`,
          animationDelay:
            iteration === 0 && startPhase > 0 ? `-${durationS * startPhase}s` : "0s",
          animationPlayState: paused ? "paused" : "running",
          willChange: "transform, opacity",
        }}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onAnimationIteration={() => {
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
            // Inherit pointer-events from wrapper so decorative drifters
            // (children-less, pointer-events: none on wrapper) never block
            // clicks behind them.
            pointerEvents: children ? "auto" : "none",
          }}
        />
        {children && (() => {
          // Per-cloud-image content alignment. Each cloud silhouette is a
          // different shape so the safe text region differs. Values are
          // tuned empirically — keep text centered but nudge it toward the
          // visually-thicker half of each cloud.
          let padY = "py-[12%]";
          if (src.includes("cloud-1")) {
            // cloud-1: chunky cumulus, heavier top — push down.
            padY = "pt-[20%] pb-[8%]";
          } else if (src.includes("cloud-2")) {
            // cloud-2: long low stratus, balanced — slight downward nudge.
            padY = "pt-[16%] pb-[10%]";
          } else if (src.includes("cloud-3")) {
            // cloud-3: three-bump cluster, slightly top-heavy — gentle nudge down.
            padY = "pt-[18%] pb-[10%]";
          }
          // cloud-4: smooth oval, default centering.
          return (
            <div
              className={`absolute inset-0 flex items-center justify-center px-[16%] ${padY}`}
              // Cloud paper is cream — force dark text for contrast regardless of theme.
              // `containerType: inline-size` lets nested text use `cqw` units to
              // scale with this cloud's own width — bigger clouds get bigger text,
              // smaller clouds get smaller text. Base font-size is set in `cqw`
              // so the cards inside (which use `em`-relative sizes) all track
              // the cloud's silhouette size. Tuned so the content never spills
              // outside the silhouette's safe region for the widest item card.
              style={{
                color: "#1f1a17",
                pointerEvents: "auto",
                containerType: "inline-size",
                fontSize: "clamp(7px, 1.6cqw, 11px)",
                lineHeight: 1.25,
              }}
            >
              {fit ? (
                <FitToBox>{children}</FitToBox>
              ) : (
                <div className="w-full text-center">{children}</div>
              )}
            </div>
          );
        })()}
      </div>
    </>
  );
}

// Uniformly shrinks its child to fit the parent's box. Renders the child at
// a fixed design width (so text wrapping is stable across resizes), measures
// its natural rendered height, then applies `transform: scale(s)` where
// s = min(1, boxW/designW, boxH/contentH). Never enlarges past 1.0.
// Used for cloud content authored with absolute units (Tailwind text-lg,
// fixed-px photos, etc.) that can't track the cloud's silhouette via cqw.
function FitToBox({ children, designWidth = 700 }: { children: ReactNode; designWidth?: number }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const box = boxRef.current;
    const content = contentRef.current;
    if (!box || !content) return;
    const recompute = () => {
      const bw = box.clientWidth;
      const bh = box.clientHeight;
      // `content` is laid out at the fixed designWidth (transforms don't
      // affect layout), so offsetHeight reflects the natural wrapped height
      // at that width. Pick the tighter of width/height fit, capped at 1.
      const ch = content.offsetHeight;
      if (bw === 0 || bh === 0 || ch === 0) return;
      const s = Math.min(1, bw / designWidth, bh / ch);
      setScale((prev) => (Math.abs(prev - s) > 0.005 ? s : prev));
    };
    const ro = new ResizeObserver(recompute);
    ro.observe(box);
    ro.observe(content);
    recompute();
    return () => ro.disconnect();
  }, [designWidth]);
  return (
    <div ref={boxRef} className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <div
        ref={contentRef}
        style={{
          width: designWidth,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        {children}
      </div>
    </div>
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
//
// Each content item carries its OWN cloud silhouette + size + vertical band +
// drift duration + direction. Callers pass `CloudItem` objects with a stable
// `key` (e.g., post.id) — the cloud's silhouette and config are derived
// deterministically from that key so the same post always rides the same
// cloud, regardless of which slot it lands in or which cycle it's on. Callers
// can also pass explicit overrides per item to hand-pick a specific look.
// Bare ReactNodes are still accepted (back-compat) and fall back to
// slot/cycle-based variation.
export interface CloudItem {
  key: string;
  node: ReactNode;
  cloudSrc?: string;
  widthVw?: number;
  topVh?: number;
  durationS?: number;
  dir?: 1 | -1;
  // When true, the cloud's content area shrinks the child uniformly so it
  // never overflows the silhouette. Use for items authored with absolute
  // CSS units (e.g., About) instead of cqw-relative sizing.
  fit?: boolean;
}

export interface CloudLayerProps {
  items: (ReactNode | CloudItem)[];
  slots?: number;
  baseDurationS?: number;
  decorative?: number;
  // vh band the content clouds travel through
  topRange?: [number, number];
  // Optional explicit width (vw) for content clouds. Used as fallback when
  // an item doesn't specify its own width.
  widthVw?: number;
}

// Tag for runtime check — CloudItem objects have `key` and `node`.
function isCloudItem(x: ReactNode | CloudItem): x is CloudItem {
  return !!x && typeof x === "object" && "key" in (x as object) && "node" in (x as object);
}

// FNV-1a 32-bit hash — stable, fast, no deps. Used to derive per-item cloud
// config from the item's `key` so the mapping is deterministic across reloads.
function hashKey(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// Resolve an item to its fully-specified cloud config. Explicit overrides on
// the CloudItem win; otherwise derive deterministically from the hashed key.
// `fallback` provides slot-based defaults for bare-ReactNode items.
// `topRange` lets per-item topVh spread across the section's vertical band.
function resolveItemConfig(
  item: ReactNode | CloudItem,
  fallback: {
    cloudSrc: string;
    widthVw: number;
    topVh: number;
    durationS: number;
    dir: 1 | -1;
  },
  topRange: [number, number],
  widthOverride: number | undefined,
): {
  node: ReactNode;
  cloudSrc: string;
  widthVw: number;
  topVh: number;
  durationS: number;
  dir: 1 | -1;
  fit: boolean;
} {
  if (!isCloudItem(item)) {
    return { node: item, ...fallback, fit: false };
  }
  const h = hashKey(item.key);
  const cloudSrc = item.cloudSrc ?? CLOUD_SRCS[h % CLOUD_SRCS.length];
  // Per-item width. Defer to caller's widthVw override if no per-item value
  // (so section-level widthVw still works); otherwise 44/48/52 by hash —
  // sized so the text-safe region inside the cloud silhouette comfortably
  // fits the card content without clipping.
  const widthVw = item.widthVw ?? widthOverride ?? 44 + ((h >>> 4) % 3) * 4;
  // Per-item vertical band: spread across the section's topRange via hash.
  const span = Math.max(0, topRange[1] - topRange[0]);
  const topVh = item.topVh ?? topRange[0] + ((h >>> 16) % 1000) / 1000 * span;
  // Per-item duration: ±6s around fallback base, in 3s steps.
  const durationS = item.durationS ?? fallback.durationS + (((h >>> 8) % 5) - 2) * 3;
  // Per-item direction: half/half by hash, unless caller pinned one.
  const dir = item.dir ?? ((h >>> 12) & 1 ? 1 : -1);
  return { node: item.node, cloudSrc, widthVw, topVh, durationS, dir, fit: !!item.fit };
}

export default function CloudLayer({
  items,
  slots = 2,
  baseDurationS = 38,
  decorative = 3,
  topRange = [18, 32],
  widthVw,
}: CloudLayerProps) {
  // Portal the decorative drifters to a Shadowbox-provided host element
  // (`#shadowbox-bg-clouds`) so they escape the Stage's transform-induced
  // stacking context. Inside the Stage, even `position: fixed` descendants
  // are trapped by the parent `transform: scale(...)` and end up painting
  // at the Stage's z (auto/0), which lets decoratives appear in front of
  // hill-7 (z=40) and the cluster (z=45). The host is a sibling of the sky
  // and hills inside Shadowbox's `z-10` outer container, set at z=15 — so
  // decoratives sit ABOVE stars (z=11) and galaxy + moon (z=12) but BEHIND
  // hill-7, the cluster, and the foreground hills, as deep atmospheric
  // clouds occluded by the entire foreground silhouette.
  const [host, setHost] = useState<HTMLElement | null>(null);
  const cloudsReady = useCloudsReady();
  useEffect(() => {
    // Look up the host on mount; if not present yet (Shadowbox renders it
    // conditionally on `showLayers`), poll briefly until it appears so
    // decoratives don't silently disappear when the layout hasn't settled.
    const find = () => document.getElementById("shadowbox-bg-clouds");
    const initial = find();
    if (initial) {
      setHost(initial);
      return;
    }
    let raf = 0;
    const tick = () => {
      const el = find();
      if (el) setHost(el);
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  // Don't render any cloud until the full sprite set is decoded — otherwise
  // back/front clouds appear in whatever order the network returned them.
  if (!cloudsReady) return null;
  const decorativeNode = (
    <>
      {Array.from({ length: decorative }).map((_, i) => (
        <DecorativeCloudSlot
          key={`deco-${i}`}
          slotIndex={i}
          slotCount={decorative}
        />
      ))}
    </>
  );
  return (
    <>
      {host && decorative > 0 && createPortal(decorativeNode, host)}
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
  items: (ReactNode | CloudItem)[];
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
  // null = use the item's natural direction.
  const [nextDirOverride, setNextDirOverride] = useState<1 | -1 | null>(null);
  const onCycleDone = (exit: "left" | "right" | "natural") => {
    setItemIdx((i) => (i + slotCount) % items.length);
    setCycleKey((k) => k + 1);
    // Flicked right → reappear from left (dir=1). Flicked left → from right (dir=-1).
    // Natural cycle end keeps the item's natural direction.
    if (exit === "right") setNextDirOverride(1);
    else if (exit === "left") setNextDirOverride(-1);
    else setNextDirOverride(null);
  };

  // Slot-based fallback config — used only when an item is a bare ReactNode
  // (no CloudItem wrapping). Mirrors the legacy behavior so back-compat callers
  // see no change.
  const fallbackTopVh =
    topRange[0] +
    (slotIndex % Math.max(1, slotCount)) *
      ((topRange[1] - topRange[0]) / Math.max(1, slotCount));
  const fallback = {
    cloudSrc: CLOUD_SRCS[(slotIndex + cycleKey) % CLOUD_SRCS.length],
    widthVw: widthOverride ?? 32 + ((slotIndex + cycleKey) % 3) * 4,
    topVh: fallbackTopVh,
    durationS: baseDurationS + (slotIndex % 3) * 4,
    dir: (slotIndex % 2 === 0 ? 1 : -1) as 1 | -1,
  };

  // Per-item config: deterministic from the item's stable key (or explicit
  // overrides on the CloudItem). Slot-based fallback fills in for bare nodes.
  const item = items[itemIdx];
  const cfg = resolveItemConfig(item, fallback, topRange, widthOverride);
  const dir: 1 | -1 = nextDirOverride ?? cfg.dir;

  // Randomize each slot's initial startPhase across the trajectory so the
  // first set of clouds is spread out across the screen width. Seeded by
  // slotIndex so the layout is stable per page-load. Across (0.10, 0.90).
  const seed = (slotIndex * 2654435761) >>> 0;
  const seededRand = ((seed ^ (seed >>> 16)) % 10000) / 10000; // 0..1
  const startPhase = 0.10 + seededRand * 0.80;

  return (
    <FloatingCloud
      key={`${slotIndex}-${cycleKey}`}
      src={cfg.cloudSrc}
      widthVw={cfg.widthVw}
      topVh={cfg.topVh}
      durationS={cfg.durationS}
      dir={dir}
      fit={cfg.fit}
      onCycleDone={onCycleDone}
      // On first cycle, start at a slot-specific phase of the trajectory so
      // same-direction clouds don't overlap. Later cycles spawn normally
      // (off-screen) since their start time is naturally staggered by the
      // previous cycle completion.
      startPhase={cycleKey === 0 ? startPhase : 0}
    >
      {cfg.node}
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
  const duration = 28 + ((slotIndex + cycleKey) % 6) * 4; // 28..48s
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
  const cloudsReady = useCloudsReady();
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
  if (!cloudsReady) return null;
  return (
    <div className="absolute inset-0" style={{ zIndex: 140, pointerEvents: "none" }}>
      <FloatingCloud
        key={cycleKey}
        src="/shadowbox/cloud-4.webp"
        widthVw={18}
        topVh={42}
        durationS={40}
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
              fontSize: "clamp(0.7rem, 1.6vw, 1.5rem)",
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
                fontSize: "clamp(0.4rem, 0.65vw, 0.6rem)",
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
        // Prop names kept for compatibility; treated as Stage % so the card
        // scales-to-fit with the rest of the scene.
        top: `${topVh}%`,
        width: `${widthVw}%`,
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
