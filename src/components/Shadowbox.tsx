"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useShadowbox, SECTION_COUNT, SECTION_IDS, SectionId } from "@/lib/shadowbox";

function useIsPortrait() {
  const [portrait, setPortrait] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-aspect-ratio: 1/1)");
    const update = () => setPortrait(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return portrait;
}

// Layer reveal staging: each layer fades + slides in over its window of the
// transition progress (0..1).
type StaticLayer = {
  src: string;
  alt: string;
  start: number;
  end: number;
  className: string;
  style?: React.CSSProperties;
  spin?: boolean; // continuous rotation for the galaxy
  wobble?: boolean; // back-and-forth rotation (moon)
};

// Composition uses % units relative to viewport. All non-sky layers stack in
// a deliberate depth order via inline z-index further below.
const STATIC_LAYERS: StaticLayer[] = [
  // Galaxy in upper-right, where the telescope is pointed. Continuous spin.
  {
    src: "/shadowbox/galaxy-paper.webp",
    alt: "Spiral galaxy",
    start: 0.0,
    end: 0.35,
    className: "absolute right-[4%] top-[6%] w-[28%] max-w-[360px]",
    style: { filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.55))" },
    spin: true,
  },
  // Moon: smaller, placed to the LEFT of the galaxy as a nearby companion.
  // Wobbles back-and-forth so the rotation reverses periodically.
  {
    src: "/shadowbox/moon.webp",
    alt: "Moon",
    start: 0.15,
    end: 0.45,
    className: "absolute right-[32%] top-[14%] w-[13%] max-w-[160px]",
    style: { filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.45))" },
    wobble: true,
  },
];

// Tree / figure / telescope cluster — rendered ABOVE the hills (separate z
// stack below). Positioned just south of the front-hill crest.
// Cluster items: tree (left), figure (center), telescope (right). Sizes are
// the cluster's BASE size at scale 1.0 — they get multiplied by the active
// hill's scale at render time so the cluster grows with the foreground hill.
// `extraBottomVh` lifts a specific item up beyond the cluster's shared baseline.
type ClusterLayer = StaticLayer & { extraBottomVh?: number; rotateDeg?: number };
const HILL_CLUSTER_LAYERS: ClusterLayer[] = [
  {
    src: "/shadowbox/tree.webp",
    alt: "Bare tree",
    start: 0.45,
    end: 0.7,
    // Tree: moved up and further right (left-[32%] from left-[28%])
    className: "absolute left-[32%] w-[28%] max-w-[500px]",
    style: { filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.55))" },
    extraBottomVh: 16,
    // Slight counter-clockwise lean
    rotateDeg: -10,
  },
  {
    src: "/shadowbox/figure.webp",
    alt: "Figure gazing up",
    start: 0.55,
    end: 0.8,
    className: "absolute left-1/2 -translate-x-1/2 w-[6%] max-w-[84px]",
    style: { filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.55))" },
    extraBottomVh: 14,
  },
  {
    src: "/shadowbox/telescope.webp",
    alt: "Telescope",
    start: 0.6,
    end: 0.85,
    className: "absolute left-[56%] w-[9%] max-w-[150px]",
    style: { filter: "drop-shadow(0 3px 5px rgba(0,0,0,0.55))" },
    extraBottomVh: 16,
    // Slight clockwise lean
    rotateDeg: 2
  },
];

// Hill arc layering. The user asked for hills going least-tall → tallest as
// they scroll down through sections, with the same hill PNG reused via shifts.
// hill-2 happens to be the shortest in our generated set, hill-1 the widest.
// We reuse 4 PNGs across 7 sections with varying y-offsets and scales so each
// section has a distinctly-tall front hill.
type HillSlot = {
  src: string;
  scale: number;
  bottomVh: number; // higher number = shorter (slides hill down out of frame)
};

const HILL_SLOTS: HillSlot[] = [
  // Section 0 (About) — shortest hill in front, mostly tucked below the viewport
  { src: "/shadowbox/hill-2.webp", scale: 0.7, bottomVh: -48 },
  // Section 1 (Projects)
  { src: "/shadowbox/hill-3.webp", scale: 0.75, bottomVh: -46 },
  // Section 2 (Papers)
  { src: "/shadowbox/hill-2.webp", scale: 0.8, bottomVh: -42 },
  // Section 3 (Posts)
  { src: "/shadowbox/hill-4.webp", scale: 0.85, bottomVh: -32 },
  // Section 4 (Skills)
  { src: "/shadowbox/hill-5.webp", scale: 0.9, bottomVh: -28 },
  // Section 5 (Resume)
  { src: "/shadowbox/hill-6.webp", scale: 0.95, bottomVh: -16 },
  // Section 6 (Contact) — tallest, peeks up to ~25% of viewport
  { src: "/shadowbox/hill-1.webp", scale: 1.0, bottomVh: -26 },
];

function clamp(x: number, lo = 0, hi = 1) {
  return x < lo ? lo : x > hi ? hi : x;
}
function smoothstep(a: number, b: number, x: number) {
  const t = clamp((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

// Twinkling-star layer rendered just in front of the galaxy. Picks from 5
// hand-painted star variants matching the sky aesthetic, randomized in size
// and blink phase so each star twinkles asynchronously. Positions and
// per-star choices are deterministic (seeded) so they don't reshuffle on
// re-render.
const TWINKLE_COUNT = 140;
const STAR_VARIANTS = [
  "/shadowbox/star-1.webp",
  "/shadowbox/star-2.webp",
  "/shadowbox/star-3.webp",
  "/shadowbox/star-4.webp",
  "/shadowbox/star-5.webp",
];
// mulberry32: better-mixed deterministic PRNG. Seeded by index per attribute
// so different attributes don't correlate, which is what produced visible
// diagonal star clumps with the old LCG.
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const TWINKLE_STARS = Array.from({ length: TWINKLE_COUNT }, (_, i) => {
  const r = makeRng(0xA5F1B2C3 ^ (i * 2654435761));
  return {
    variant: Math.floor(r() * STAR_VARIANTS.length),
    left: 2 + r() * 96,
    top: 4 + r() * 84,
    size: 10 + r() * 38,
    delay: r() * 5,
    duration: 1.6 + r() * 3.0,
    opacityMax: 0.55 + r() * 0.45,
    opacityMin: 0.05 + r() * 0.15,
    rotateDeg: -30 + r() * 60,
  };
});

function TwinkleStars({ opacity }: { opacity: number }) {
  return (
    <>
      <style>{`
        @keyframes shadowbox-twinkle {
          0%, 100% { opacity: var(--tw-min, 0.1); }
          50% { opacity: var(--tw-max, 1); }
        }
      `}</style>
      <div className="absolute inset-0" style={{ opacity, zIndex: 11, pointerEvents: "none" }}>
        {TWINKLE_STARS.map((s, i) => (
          <img
            key={i}
            src={STAR_VARIANTS[s.variant]}
            alt=""
            aria-hidden
            draggable={false}
            className="absolute"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: `${s.size}px`,
              height: "auto",
              transform: `rotate(${s.rotateDeg}deg)`,
              ["--tw-max" as string]: s.opacityMax,
              ["--tw-min" as string]: s.opacityMin,
              animation: `shadowbox-twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
              filter: "drop-shadow(0 0 6px rgba(255,248,224,0.4))",
              pointerEvents: "none",
              userSelect: "none",
            }}
          />
        ))}
      </div>
    </>
  );
}

interface ShadowboxProps {
  sectionContent: Record<SectionId, ReactNode>;
}

export default function Shadowbox({ sectionContent }: ShadowboxProps) {
  const { phase, transition, sectionIndex, nextSection, prevSection, goToSection, returnToGalaxy } = useShadowbox();
  const wheelLockRef = useRef(false);
  const isPortrait = useIsPortrait();

  // Wheel-based section advance during section phase. At the first section,
  // scrolling up reverses the transition all the way back to the 3D galaxy
  // view so the user can re-explore galaxy / clusters / timeline modes.
  useEffect(() => {
    if (phase !== "section") return;
    const onWheel = (e: WheelEvent) => {
      if (wheelLockRef.current) return;
      if (Math.abs(e.deltaY) < 8) return;
      const isLast = sectionIndex >= SECTION_COUNT - 1;
      const isFirst = sectionIndex <= 0;
      if (e.deltaY > 0 && !isLast) {
        e.preventDefault();
        wheelLockRef.current = true;
        nextSection();
        setTimeout(() => (wheelLockRef.current = false), 700);
      } else if (e.deltaY < 0) {
        e.preventDefault();
        wheelLockRef.current = true;
        if (!isFirst) {
          prevSection();
        } else {
          // At the very first section — scrolling up exits the shadowbox and
          // returns to the 3D galaxy view.
          returnToGalaxy();
        }
        // Slightly longer cooldown on the return-to-galaxy case so the
        // transition has time to settle before the galaxy's own wheel handler
        // re-takes over.
        setTimeout(() => (wheelLockRef.current = false), isFirst ? 1500 : 700);
      }
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [phase, sectionIndex, nextSection, prevSection, returnToGalaxy]);

  // Whole-stack opacity. Invisible during galaxy phase, fades in during
  // transition, fully visible during section phase.
  const stackOpacity = phase === "galaxy" ? 0 : transition;
  const showLayers = phase !== "galaxy";

  // Camera zoom-in across sections: each step scales the whole composition up
  // slightly so it feels like pushing deeper into the scene.
  const sceneScale = phase === "section" ? 1 + sectionIndex * 0.015 : 1;

  return (
    <div className="fixed inset-0 z-10 pointer-events-none" aria-hidden={phase === "galaxy"}>
      <style>{`
        @keyframes shadowbox-galaxy-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
      {/* Sky paper as the backmost layer, covers full viewport */}
      {showLayers && (
        <img
          src="/shadowbox/sky.webp"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: stackOpacity, zIndex: 0, pointerEvents: "none" }}
          draggable={false}
        />
      )}

      {/* Background paper layers (galaxy + moon + twinkle stars) — these
          stay at a constant scale across sections. Foreground elements like
          the hills and cluster zoom via sceneScale separately. */}
      <div
        className="absolute inset-0"
        style={{ opacity: stackOpacity, zIndex: 1 }}
      >
        {/* Twinkling stars sit between the galaxy (z=10) and the moon. */}
        {showLayers && <TwinkleStars opacity={stackOpacity} />}

        {showLayers && STATIC_LAYERS.map((layer) => {
          const tIn = smoothstep(layer.start, layer.end, transition);
          // Galaxy and moon both sit at z=12, above the twinkle-star layer
          // (z=11). DOM order still controls which renders on top of the
          // other when they overlap (later entry wins).
          const z = 12;
          if (layer.spin) {
            // CSS animation instead of framer's `animate` prop — framer can
            // reset rotate state on parent re-renders (the wrapper above
            // re-renders on every scroll tick via `opacity: stackOpacity`),
            // which visually freezes the galaxy. CSS keyframes are immune.
            return (
              <img
                key={layer.src}
                src={layer.src}
                alt={layer.alt}
                className={layer.className}
                style={{
                  ...layer.style,
                  opacity: tIn,
                  zIndex: z,
                  pointerEvents: "none",
                  userSelect: "none",
                  transformOrigin: "50% 50%",
                  animation: "shadowbox-galaxy-spin 90s linear infinite",
                }}
                draggable={false}
              />
            );
          }
          if (layer.wobble) {
            return (
              <motion.img
                key={layer.src}
                src={layer.src}
                alt={layer.alt}
                className={layer.className}
                style={{
                  ...layer.style,
                  opacity: tIn,
                  zIndex: z,
                  pointerEvents: "none",
                  userSelect: "none",
                  transformOrigin: "50% 50%",
                }}
                animate={{ rotate: [0, 12, -8, 14, -12, 6, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 14,
                  ease: "easeInOut",
                  times: [0, 0.18, 0.36, 0.54, 0.72, 0.88, 1],
                }}
                draggable={false}
              />
            );
          }
          return (
            <img
              key={layer.src}
              src={layer.src}
              alt={layer.alt}
              className={layer.className}
              style={{
                ...layer.style,
                opacity: tIn,
                zIndex: z,
                transform: `translateY(${(1 - tIn) * 24}px)`,
                transition: "transform 250ms ease-out",
                pointerEvents: "none",
                userSelect: "none",
              }}
              draggable={false}
            />
          );
        })}
      </div>

      {/* Hill stack — only visible during section phase. The active hill is
          biggest and frontmost; prior hills slide off; future hills stay
          parked as the backdrop. The whole stack zooms with sceneScale so
          the foreground pans inward alongside the rest of the scene. */}
      {phase === "section" && (
        <motion.div
          className="absolute inset-0"
          style={{ zIndex: 50, transformOrigin: "50% 100%" }}
          animate={{ scale: sceneScale }}
          transition={{ type: "spring", stiffness: 80, damping: 24 }}
        >
          {HILL_SLOTS.map((slot, i) => {
            const isPast = i < sectionIndex;
            const stackPos = i - sectionIndex;

            // Future hills sit at their own slot's bottomVh (no lift / no
            // shrink) so the tallest backmost hill (section 6) stays visible
            // throughout — it's literally the backdrop.
            const targetBottom = isPast ? slot.bottomVh - 60 : slot.bottomVh;
            // Past hills exit horizontally on landscape, vertically on portrait
            const exitX = isPast
              ? isPortrait
                ? 0
                : (sectionIndex - i) % 2 === 1 ? -130 : 130
              : 0;
            const exitY = isPast && isPortrait ? 80 : 0;
            const scale = slot.scale;

            return (
              <motion.img
                key={`hill-slot-${i}`}
                src={slot.src}
                alt=""
                className="absolute left-1/2 w-screen min-w-[1200px]"
                initial={false}
                animate={{
                  x: `calc(-50% + ${exitX}%)`,
                  y: `${exitY}vh`,
                  scale,
                  bottom: `${targetBottom}vh`,
                  opacity: 1,
                }}
                transition={{ type: "spring", stiffness: 110, damping: 22 }}
                style={{
                  zIndex: 60 - i, // closer-to-active hills render in front
                  pointerEvents: "none",
                  userSelect: "none",
                  filter: `drop-shadow(0 -6px 12px rgba(0,0,0,${0.3 + Math.max(0, stackPos) * 0.04}))`,
                  transformOrigin: "50% 100%",
                }}
                draggable={false}
              />
            );
          })}
        </motion.div>
      )}

      {/* Figure / tree / telescope cluster — sits at a fixed baseline above
          the front-hill crest, sharing the same gentle per-section zoom as
          the rest of the landscape (sceneScale ~9% across all 7 sections).
          This keeps the cluster from moving/scaling more aggressively than
          the mountains and other foreground elements. */}
      {phase === "section" && (
        <motion.div
          className="absolute inset-0"
          style={{ zIndex: 100, pointerEvents: "none", transformOrigin: "50% 100%" }}
          initial={false}
          animate={{ scale: sceneScale }}
          transition={{ type: "spring", stiffness: 80, damping: 24 }}
        >
          {HILL_CLUSTER_LAYERS.map((layer) => {
            const tIn = smoothstep(layer.start, layer.end, transition);
            // Fixed cluster baseline (35vh) plus per-item extra lift.
            const itemBottomVh = 35 + (layer.extraBottomVh ?? 0);
            const rotate = layer.rotateDeg ?? 0;
            return (
              <img
                key={layer.src}
                src={layer.src}
                alt={layer.alt}
                className={layer.className}
                style={{
                  ...layer.style,
                  bottom: `${itemBottomVh}vh`,
                  opacity: tIn,
                  transform: `translateY(${(1 - tIn) * 24}px) rotate(${rotate}deg)`,
                  transition: "transform 250ms ease-out",
                  pointerEvents: "none",
                  userSelect: "none",
                }}
                draggable={false}
              />
            );
          })}
        </motion.div>
      )}

      {/* Active section content. Sections that use the cloud/embedded-card
          presentation (currently just "about") render full-viewport — the
          cloud component already positions itself absolutely. Everything
          else still uses the bottom-card panel until those sections get
          migrated to the cloud system. */}
      {phase === "section" && (() => {
        const id = SECTION_IDS[sectionIndex];
        const usesCloud = id === "about" || id === "projects" || id === "papers" || id === "posts" || id === "skills" || id === "resume" || id === "contact";
        if (usesCloud) {
          return (
            <AnimatePresence mode="wait">
              <motion.div
                key={id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0"
                style={{ pointerEvents: "none" }}
              >
                {sectionContent[id]}
              </motion.div>
            </AnimatePresence>
          );
        }
        return (
          <div className="absolute inset-x-0 bottom-0 top-[55%] pointer-events-auto flex justify-center" style={{ zIndex: 200 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-4xl px-4 sm:px-8 pt-4 pb-8 overflow-y-auto"
                style={{ scrollbarWidth: "thin", WebkitOverflowScrolling: "touch" }}
              >
                <div
                  className="rounded-2xl p-5 sm:p-7 backdrop-blur-sm"
                  style={{
                    background: "color-mix(in srgb, var(--bg) 78%, transparent)",
                    border: "1px solid var(--border)",
                  }}
                >
                  {sectionContent[id]}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        );
      })()}

      {/* Section dot navigator */}
      {phase === "section" && (
        <div
          className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 flex-col gap-3 pointer-events-auto"
          style={{ zIndex: 250 }}
        >
          {SECTION_IDS.map((id, i) => (
            <button
              key={id}
              onClick={() => goToSection(i)}
              aria-label={`Go to ${id}`}
              className="block w-3 h-3 rounded-full transition-all"
              style={{
                background: i === sectionIndex ? "var(--accent)" : "color-mix(in srgb, var(--text) 30%, transparent)",
                transform: i === sectionIndex ? "scale(1.4)" : "scale(1)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
