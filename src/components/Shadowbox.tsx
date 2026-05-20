"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useShadowbox, SECTION_COUNT, SECTION_IDS, SectionId } from "@/lib/shadowbox";
import Stage from "@/components/Stage";

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
    className: "absolute right-[-16%] top-[-10%] w-[28%] max-w-[360px]",
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
    className: "absolute right-[32%] top-[0%] w-[13%] max-w-[160px]",
    style: { filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.45))" },
    wobble: true,
  },
];

// Tree / figure / telescope cluster — rendered ABOVE the deepest hill
// (hill-7, z=40) and BELOW the foreground hills (z=50) at z=45.
//
// Pinned to hill-7's silhouette: every coordinate is expressed in `vw`
// (viewport-width units) and the entire cluster receives hill-7's exact
// `scale(slot.scale × sceneScale)` transform around `transformOrigin:
// 50% 100%` (viewport bottom-center). That puts the cluster in hill-7's
// own coordinate frame, so the contact point each item makes with the
// painted hill stays glued to the same point on the silhouette at every
// viewport size and every section.
//
// Coordinate model — all values in `vw`:
//   - `widthVw`: rendered image width (height is auto).
//   - `bottomVw`: distance from the viewport bottom up to the image's
//     bottom edge. Same units the hill itself uses, which is the whole
//     point — both the hill and the cluster move together on resize.
//   - `leftFromCenterVw`: horizontal offset from viewport center to the
//     image's left edge (negative = left of center). Centered items use
//     `-widthVw/2`.
//
// The original tuning was done at a 16:9 viewport in stage pixels; values
// below are the 1:1 conversion: 1 stage-px = (100/1600) vw = 0.0625 vw.
type ClusterLayer = {
  src: string;
  alt: string;
  start: number;
  end: number;
  widthVw: number;
  bottomVw: number;
  leftFromCenterVw: number;
  rotateDeg?: number;
  dropShadow: string;
};
const HILL_CLUSTER_LAYERS: ClusterLayer[] = [
  {
    src: "/shadowbox/tree.gif",
    alt: "Bare tree",
    start: 0.45,
    end: 0.7,
    widthVw: 480 / 16,   // 31.25vw
    bottomVw: 250 / 16,  // 25.875vw
    // Tree's right edge anchored to viewport center (left edge one
    // tree-width to the left).
    leftFromCenterVw: -422 / 16, // -31.25vw
    rotateDeg: -10,
    dropShadow: "drop-shadow(0 6px 10px rgba(0,0,0,0.55))",
  },
  {
    src: "/shadowbox/figure.webp",
    alt: "Figure gazing up",
    start: 0.55,
    end: 0.8,
    widthVw: 50 / 16,    // 5.25vw
    bottomVw: 270 / 16,  // 27vw
    leftFromCenterVw: -(42 / 16) / 2, // centered
    dropShadow: "drop-shadow(0 3px 5px rgba(0,0,0,0.55))",
  },
  {
    src: "/shadowbox/telescope.webp",
    alt: "Telescope",
    start: 0.6,
    end: 0.85,
    widthVw: 70 / 16,   // 7.8125vw
    bottomVw: 270 / 16,  // 27vw
    // Original telescope left edge was at 56% of stage width = 56vw from
    // viewport left = +6vw from viewport center.
    leftFromCenterVw: 53 - 50, // +6vw
    rotateDeg: 0,
    dropShadow: "drop-shadow(0 3px 5px rgba(0,0,0,0.55))",
  },
];

// Hill arc layering. Hills go least-tall → tallest as the user scrolls down
// through sections. Same hill PNG can be reused via different y-offsets and
// scales so each section gets a distinctly-tall front hill silhouette.
//
// Hills render OUTSIDE the Stage (full-viewport, anchored to viewport bottom)
// because they need to always cover the bottom band of the screen regardless
// of viewport aspect ratio. `bottomVh` is a viewport-vh offset for the image
// bottom: 0 = image bottom at viewport bottom, negative = pushed below.
type HillSlot = {
  src: string;
  scale: number;
  // Offset for the image bottom edge as a fraction of the hill image's own
  // HEIGHT. 0 = image bottom flush with viewport bottom; -1 = the entire
  // image is pushed below the viewport. Negative values reveal only the top
  // crown peeking up. Expressing this as a fraction of image height means
  // the same point on the painted hill stays at the viewport bottom no
  // matter how the window is resized.
  bottomFrac: number;
  // Image aspect ratio (width / height). The hill is sized via width: 100vw,
  // so its rendered height in viewport-width units equals 100vw / aspect,
  // and bottomFrac * (100 / aspect)vw gives the matching bottom offset.
  aspect: number;
};

// Hills are sized by WIDTH (100vw) so they scale with the window. Crucially,
// the `bottom` offset is derived from each hill's IMAGE HEIGHT (via
// bottomFrac × image height), so the same point on the painted hill stays
// pinned to the viewport bottom as the window resizes — the contact line
// you set visually stays put even as the hill grows or shrinks.
//
// bottomFrac was migrated from the previous bottomVh values: on a 16:9
// viewport, the rendered hill height = 100vw/aspect ≈ 56.25/aspect vh,
// so bottomFrac = bottomVh / (56.25 / aspect) = bottomVh * aspect / 56.25.
const HILL_SLOTS: HillSlot[] = [
  // Section 0 (About) — front hill covers the bottom 35-40vh of the viewport.
  { src: "/shadowbox/hill-1.webp", scale: 1.12, bottomFrac: -11 * (2345 / 627) / 56.25, aspect: 2345 / 627 },
  // Section 1 (Projects)
  { src: "/shadowbox/hill-2.webp", scale: 1.17, bottomFrac: -12 * (2330 / 689) / 56.25, aspect: 2330 / 689 },
  // Section 2 (Papers)
  { src: "/shadowbox/hill-3.webp", scale: 1.22, bottomFrac: -14 * (2400 / 803) / 56.25, aspect: 2400 / 803 },
  // Section 3 (Posts)
  { src: "/shadowbox/hill-4.webp", scale: 1.27, bottomFrac: -17 * (2400 / 915) / 56.25, aspect: 2400 / 915 },
  // Section 4 (Skills)
  { src: "/shadowbox/hill-5.webp", scale: 1.32, bottomFrac: -21 * (2290 / 1003) / 56.25, aspect: 2290 / 1003 },
  // Section 5 (Resume)
  { src: "/shadowbox/hill-6.webp", scale: 1.37, bottomFrac: -21 * (2400 / 1066) / 56.25, aspect: 2400 / 1066 },
  // Section 6 (Contact) — tallest, peeks up to ~half the viewport.
  { src: "/shadowbox/hill-7.webp", scale: 1.42, bottomFrac: -25 * (2400 / 1189) / 56.25, aspect: 2400 / 1189 },
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
    left: r() * 100,
    top: r() * 100,
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
      <div className="fixed inset-0 w-screen h-screen" style={{ opacity, zIndex: 11, pointerEvents: "none" }}>
        {TWINKLE_STARS.map((s, i) => (
          <img
            key={i}
            src={STAR_VARIANTS[s.variant]}
            alt=""
            aria-hidden
            draggable={false}
            className="absolute"
            style={{
              left: `${s.left}vw`,
              top: `${s.top}vh`,
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

  // Direction of the current "transition" phase: "in" = galaxy → shadowbox
  // (shrinking), "out" = shadowbox → galaxy (expanding). Inferred from the
  // phase the user came from. Used to decide when the shadowbox wrapper
  // should fade in vs out so the fade is asymmetric per the design:
  //   Entering: galaxy shrinks fully → THEN shadowbox fades in.
  //   Exiting:  shadowbox stays visible through the full expand → THEN fades.
  // Updated synchronously during render so the first frame of the new phase
  // already sees the correct direction (a useEffect-based update would lag
  // by one frame and produce a brief opacity flash at the start of exit).
  const transitionDirRef = useRef<"in" | "out">("in");
  const prevPhaseRef = useRef(phase);
  if (phase === "transition" && prevPhaseRef.current !== "transition") {
    if (prevPhaseRef.current === "section") transitionDirRef.current = "out";
    else if (prevPhaseRef.current === "pre-enter") transitionDirRef.current = "in";
  }
  prevPhaseRef.current = phase;

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
        // re-takes over. Matches the combined exit duration in shadowbox.tsx
        // (EXIT_TRANSITION_MS + PRE_EXIT_MS) plus a small buffer.
        setTimeout(() => (wheelLockRef.current = false), isFirst ? 1800 : 700);
      }
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, [phase, sectionIndex, nextSection, prevSection, returnToGalaxy]);

  // Whole-stack opacity. Asymmetric by design:
  //   Entering (galaxy → shadowbox): the 3D galaxy owns the screen through
  //     the full shrink. Wrapper stays at 0 during "transition" phase, fades
  //     in to 1 once phase flips to "section". Result: galaxy fully minimizes
  //     into the paper-galaxy slot BEFORE the shadowbox appears.
  //   Exiting (shadowbox → galaxy): the shadowbox stays fully visible while
  //     the galaxy expands underneath it. Wrapper stays at 1 through the full
  //     "transition" phase (galaxy expanding), then fades to 0 once phase
  //     flips to "pre-exit". Result: galaxy fully unminimizes BEFORE the
  //     shadowbox disappears.
  // The actual fade is handled by a CSS opacity transition on the outer
  // wrapper below.
  const isGalaxyOnly = phase === "galaxy" || phase === "pre-enter" || phase === "pre-exit" || phase === "transition";
  const stackOpacity =
    phase === "section"
      ? 1
      : phase === "transition" && transitionDirRef.current === "out"
        ? 1
        : 0;
  // Layers stay mounted across all non-galaxy-only phases so the CSS opacity
  // fade on the wrapper has something to fade.
  const showLayers = phase === "section" || phase === "transition" || phase === "pre-exit";

  // Effective layer-reveal progress used by the per-layer `smoothstep` for
  // galaxy/moon/cluster staged-reveal animations.
  //   Entering: pinned to 1 once in "section" so layers don't re-stage on
  //     re-renders during normal use.
  //   Exiting: tracks the real `transition` value (1 → 0) so the tree, figure,
  //     telescope, paper galaxy, and moon animate OUT in reverse of their
  //     entry. That visible "drop" is what tells the user the exit is in
  //     motion — without it the opaque shadowbox would just sit there while
  //     the 3D galaxy silently expands behind it.
  const effectiveTransition =
    phase === "section" ? 1 : phase === "pre-exit" ? 0 : transition;

  // Camera zoom-in across sections: each step scales the whole composition up
  // slightly so it feels like pushing deeper into the scene.
  const sceneScale = phase === "section" ? 1 + sectionIndex * 0.015 : 1;

  return (
    <div
      className="fixed inset-0 z-10 pointer-events-none"
      aria-hidden={isGalaxyOnly}
      style={{
        opacity: stackOpacity,
        transition: "opacity 0.5s ease",
      }}
    >
      <style>{`
        @keyframes shadowbox-galaxy-spin {
          from { transform: scaleX(-1) rotate(0deg); }
          to   { transform: scaleX(-1) rotate(360deg); }
        }
      `}</style>
      {/* Sky paper: rendered OUTSIDE the Stage so it covers the full viewport
          including any letterbox area when the viewport aspect ratio differs
          from the stage's 16:9. */}
      {showLayers && (
        <img
          src="/shadowbox/sky.webp"
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 1, zIndex: 0, pointerEvents: "none" }}
          draggable={false}
        />
      )}

      {/* Twinkling stars render OUTSIDE the Stage so they span the full
          viewport (not clipped to the 1600x900 design canvas). They sit
          between the sky (z=0) and the galaxy/moon (z=12 inside Stage). */}
      {showLayers && <TwinkleStars opacity={1} />}

      {/* Decorative-cloud portal host. CloudLayer's decorative drifters
          render into here via createPortal so they live OUTSIDE the Stage's
          transform-induced stacking context. Sits at z=15: above galaxy +
          moon (z=12) and stars (z=11), but BEHIND hill-7 (z=40), the
          tree/figure/telescope cluster (z=45), and the foreground hills
          (z=50–60). Result: background clouds always appear deeper than
          every painted foreground silhouette. */}
      {showLayers && (
        <div
          id="shadowbox-bg-clouds"
          className="fixed inset-0 pointer-events-none"
          style={{ zIndex: 15, opacity: 1 }}
          aria-hidden
        />
      )}

      {/* Everything else lives inside the Stage (1600x900 design canvas that
          scales-to-fit). Inside the stage, percentages are percentages of the
          stage box — so a position tuned at fullscreen 1080p stays in the
          same relative spot regardless of viewport aspect ratio or zoom.

          Wrapper z=12 lifts Stage above the twinkling-star layer (z=11) so
          the galaxy and moon paint in front of the stars. Stage's own
          transform creates a stacking context, so per-image zIndex inside
          can't compete with the star layer outside — the ordering has to
          happen here, on a sibling of TwinkleStars. */}
      <div className="absolute inset-0" style={{ zIndex: 12, pointerEvents: "none" }}>
        <Stage style={{ pointerEvents: "none" }}>
          {/* Background paper layers (galaxy + moon) — these stay at a constant
          scale across sections. Foreground elements like the hills and
          cluster zoom via sceneScale separately. */}
          <div
            className="absolute inset-0"
            style={{ opacity: 1, zIndex: 1 }}
          >
            {showLayers && STATIC_LAYERS.map((layer) => {
              const tIn = smoothstep(layer.start, layer.end, effectiveTransition);
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
                      animation: "shadowbox-galaxy-spin 60s linear infinite",
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
                      scaleX: -1,
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

        </Stage>
      </div>

      {/* Hill stack — lives OUTSIDE the Stage and spans the full viewport
          width so the hill always covers the entire bottom of the screen at
          any aspect ratio. Anchored to viewport bottom (not stage bottom)
          so the landscape never floats. The whole stack zooms with sceneScale
          so the foreground pans inward alongside the rest of the scene. */}
      {/* Hill renderer — shared by the backdrop pass (hill-7 only, behind the
          cluster) and the foreground pass (hills 0..5, in front of the
          cluster). Splitting into two wrappers lets the figure/tree/telescope
          cluster slot between hill-6 and hill-7 in z-order. */}
      {(phase === "section" || (phase === "transition" && transitionDirRef.current === "out")) && (() => {
        const renderHill = (slot: HillSlot, i: number) => {
          const isPast = i < sectionIndex;
          const stackPos = i - sectionIndex;

          // Hill is sized at width: 100vw, so its rendered height in
          // viewport-width units is `100 / aspect` vw. Bottom offset is a
          // fraction of that same height — that's the trick that pins the
          // same point on the painted hill to the viewport bottom on
          // resize: both the size and the offset scale together with vw.
          const hillHeightVw = 100 / slot.aspect;
          // Past hills get an extra lift expressed in the same vw units so
          // they remain visually proportional too.
          const extraPastFrac = isPast ? -60 / (56.25 / slot.aspect) : 0;
          const bottomFrac = slot.bottomFrac + extraPastFrac;
          const targetBottomVw = bottomFrac * hillHeightVw;
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
              className="absolute left-1/2"
              initial={false}
              animate={{
                x: `calc(-50% + ${exitX}%)`,
                y: `${exitY}vh`,
                scale,
                bottom: `${targetBottomVw}vw`,
                opacity: 1,
              }}
              transition={{ type: "spring", stiffness: 110, damping: 22 }}
              style={{
                width: "100vw",
                minWidth: "1200px",
                height: "auto",
                zIndex: 60 - i, // closer-to-active hills render in front
                pointerEvents: "none",
                userSelect: "none",
                filter: `drop-shadow(0 -6px 12px rgba(0,0,0,${0.3 + Math.max(0, stackPos) * 0.04}))`,
                transformOrigin: "50% 100%",
              }}
              draggable={false}
            />
          );
        };

        // hill-7 is the backmost backdrop — render it in its own wrapper
        // BEHIND the cluster so the figure/tree/telescope appear in front
        // of hill-7 but behind hills 0..5.
        const backdropIndex = HILL_SLOTS.length - 1;
        const backdropSlot = HILL_SLOTS[backdropIndex];
        const foregroundSlots = HILL_SLOTS.slice(0, backdropIndex);

        return (
          <>
            {/* Backdrop hill (hill-7) — z=40, behind cluster */}
            <motion.div
              className="fixed inset-0 pointer-events-none"
              style={{ zIndex: 40, transformOrigin: "50% 100%" }}
              animate={{ scale: sceneScale }}
              transition={{ type: "spring", stiffness: 80, damping: 24 }}
            >
              {renderHill(backdropSlot, backdropIndex)}
            </motion.div>

            {/* Figure / tree / telescope cluster — z=45, between hill-7 (z=40)
                and the foreground hills (z=50). Lives OUTSIDE the Stage in
                viewport (`vw`) coordinates and receives hill-7's exact scale
                transform around viewport bottom-center, so each item's
                contact point with the painted hill silhouette stays fixed
                on the hill as the window resizes — they ride along with
                hill-7 instead of with the design canvas. */}
            <motion.div
              className="fixed inset-0 pointer-events-none"
              style={{ zIndex: 45, transformOrigin: "50% 100%" }}
              initial={false}
              animate={{ scale: backdropSlot.scale * sceneScale }}
              transition={{ type: "spring", stiffness: 80, damping: 24 }}
            >
              {HILL_CLUSTER_LAYERS.map((layer) => {
                const tIn = smoothstep(layer.start, layer.end, effectiveTransition);
                const rotate = layer.rotateDeg ?? 0;
                return (
                  <img
                    key={layer.src}
                    src={layer.src}
                    alt={layer.alt}
                    style={{
                      position: "absolute",
                      // Horizontal anchor: viewport center + signed offset.
                      left: `calc(50% + ${layer.leftFromCenterVw}vw)`,
                      bottom: `${layer.bottomVw}vw`,
                      width: `${layer.widthVw}vw`,
                      height: "auto",
                      filter: layer.dropShadow,
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

            {/* Foreground hills (0..5) — z=50, in front of the cluster */}
            <motion.div
              className="fixed inset-0 pointer-events-none"
              style={{ zIndex: 50, transformOrigin: "50% 100%" }}
              animate={{ scale: sceneScale }}
              transition={{ type: "spring", stiffness: 80, damping: 24 }}
            >
              {foregroundSlots.map((slot, i) => renderHill(slot, i))}
            </motion.div>
          </>
        );
      })()}

      {/* Stage resumes here for the section content (clouds, papers, book,
          contact card). These remain inside the design-canvas frame so they
          scale uniformly at any viewport size. */}
      <Stage style={{ pointerEvents: "none" }}>

        {/* Active section content. Sections that use the cloud/embedded-card
          presentation (currently just "about") render full-viewport — the
          cloud component already positions itself absolutely. Everything
          else still uses the bottom-card panel until those sections get
          migrated to the cloud system. */}
        {(phase === "section" || (phase === "transition" && transitionDirRef.current === "out")) && (() => {
          const id = SECTION_IDS[sectionIndex];
          const usesCloud = id === "about" || id === "projects" || id === "papers" || id === "posts" || id === "skills" || id === "resume" || id === "contact";
          if (usesCloud) {
            // Cross-section transitions stagger so the previous section's
            // clouds/content fully fade out BEFORE the next section's mount —
            // otherwise the new content clouds (which sit at z=150, above the
            // hills at z=50–60) briefly appear superimposed on hills that are
            // still mid-spring, producing the "clipping through the hill"
            // flash the user reported. `mode="wait"` already enforces serial
            // exit→enter, but we also delay the new section's fade-in so its
            // clouds don't start their CSS drift while hills are still moving.
            return (
              <AnimatePresence mode="wait">
                <motion.div
                  key={id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
                    // Snappier exit so the new section can start sooner.
                    // The new section's enter waits ~500ms (roughly matches
                    // the hill spring settle time at stiffness 110 / damping 22)
                    // before fading in, so content clouds and hills land in
                    // sync.
                    duration: 0.45,
                    ease: "easeInOut",
                    delay: 0.5,
                  }}
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

      </Stage>

      {/* Section dot navigator — lives OUTSIDE the Stage so it anchors to
          the viewport's right edge rather than the design canvas's right
          edge (which would inset into the letterbox bar). */}
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
