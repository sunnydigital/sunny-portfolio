"use client";

// Virtual-stage wrapper. Renders children inside a fixed-size design canvas
// (1600x900, the original "well positioned" full-screen target) and scales
// the whole canvas with CSS transform to fit the actual viewport. Everything
// inside lays out in design coordinates, so a position tuned at fullscreen
// stays in the same relative spot at any aspect ratio or zoom level.
//
// At non-16:9 viewports the canvas is centred and the surrounding letterbox
// area is transparent so the sky paper (rendered separately, full-bleed)
// fills it. Children opt into design-space coords by using STAGE_WIDTH /
// STAGE_HEIGHT as the reference frame (treat 1 stage-px === 1 design-px).
//
// Children that should stay full-bleed (sky paper, twinkling stars) render
// OUTSIDE the stage at the same z but cover 100vw/100vh.

import { ReactNode, useEffect, useState } from "react";

export const STAGE_WIDTH = 1600;
export const STAGE_HEIGHT = 900;
export const STAGE_ASPECT = STAGE_WIDTH / STAGE_HEIGHT;

// Returns the current scale factor that fits a STAGE_WIDTH x STAGE_HEIGHT
// rectangle into the viewport. Components that need to convert pointer
// pixels back into stage coordinates (e.g. draggable papers) divide by this.
export function useStageScale(): number {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const update = () => {
      const sx = window.innerWidth / STAGE_WIDTH;
      const sy = window.innerHeight / STAGE_HEIGHT;
      setScale(Math.min(sx, sy));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return scale;
}

interface StageProps {
  children: ReactNode;
  // Inline style merged onto the inner stage element (e.g. zIndex).
  style?: React.CSSProperties;
  // className merged onto the inner stage element.
  className?: string;
}

// Wraps children in a centred, fixed-aspect 1600x900 design canvas that
// scales to fit the viewport with CSS transform. Use this for any DOM that
// was originally tuned for fullscreen 16:9 layout.
export default function Stage({ children, style, className }: StageProps) {
  return (
    <div
      // Outer fills the viewport and centres the inner stage. pointer-events
      // none here so the letterbox bars don't intercept clicks aimed at
      // full-bleed siblings (sky, stars).
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <div
        className={className}
        style={{
          position: "relative",
          width: STAGE_WIDTH,
          height: STAGE_HEIGHT,
          // Uniform fit: never crops, never distorts. The minimum of the
          // two ratios keeps the design canvas fully visible.
          transform: `scale(min(100vw / ${STAGE_WIDTH}, 100vh / ${STAGE_HEIGHT}))`,
          transformOrigin: "50% 50%",
          // Inner stage re-enables pointer events so children behave normally.
          pointerEvents: "auto",
          ...style,
        }}
      >
        {children}
      </div>
    </div>
  );
}
