"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { useShadowbox } from "@/lib/shadowbox";

// Bridges the original GalaxyVisualization's mode/pastVisualization model to
// the new shadowbox phase/section model so the legacy galaxy keeps working.
//   - mode in {galaxy, reduction, timeline} is preserved verbatim for the
//     galaxy's internal visualization modes
//   - pastVisualization=true  → enter the shadowbox
//   - pastVisualization=false → return to galaxy view

type Mode = "galaxy" | "reduction" | "timeline";
const MODES: Mode[] = ["galaxy", "reduction", "timeline"];

interface ScrollContextType {
  scrollY: number;
  scrollProgress: number;
  mode: Mode;
  setMode: (m: Mode) => void;
  nextMode: () => boolean;
  prevMode: () => boolean;
  pastVisualization: boolean;
  setPastVisualization: (v: boolean) => void;
}

const ScrollContext = createContext<ScrollContextType>({
  scrollY: 0,
  scrollProgress: 0,
  mode: "galaxy",
  setMode: () => {},
  nextMode: () => false,
  prevMode: () => false,
  pastVisualization: false,
  setPastVisualization: () => {},
});

export function ScrollProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>("galaxy");
  const { phase, enterShadowbox, returnToGalaxy } = useShadowbox();
  // pre-enter and pre-exit are camera-only stages where the 3D galaxy is
  // still fullscreen — treat them as galaxy view (overlays stay visible).
  const pastVisualization =
    phase !== "galaxy" && phase !== "pre-enter" && phase !== "pre-exit";
  // Remember which visualization mode the user was in when they entered the
  // shadowbox. The 3D galaxy is force-snapped to "galaxy" mode on entry so
  // its shape matches the paper-galaxy artwork, and on return we restore
  // the mode they were exploring so they don't lose context.
  const preEntryModeRef = useRef<Mode>("galaxy");

  const scrollProgress = mode === "galaxy" ? 0 : mode === "reduction" ? 0.5 : 1;

  const setMode = useCallback((m: Mode) => {
    setModeState(m);
  }, []);

  const nextMode = useCallback((): boolean => {
    let changed = false;
    setModeState((prev) => {
      const idx = MODES.indexOf(prev);
      if (idx < MODES.length - 1) {
        changed = true;
        return MODES[idx + 1];
      }
      return prev;
    });
    return changed;
  }, []);

  const prevMode = useCallback((): boolean => {
    let changed = false;
    setModeState((prev) => {
      const idx = MODES.indexOf(prev);
      if (idx > 0) {
        changed = true;
        return MODES[idx - 1];
      }
      return prev;
    });
    return changed;
  }, []);

  const setPastVisualization = useCallback((v: boolean) => {
    // We only honor `true` here. The old DOM-scroll model called
    // setPastVisualization(false) to snap back to the galaxy when the user
    // scrolled up past it, but in the new shadowbox model that's not the
    // intended UX — return-to-galaxy is reserved for explicit user action.
    if (!v) return;
    // Remember the current viz mode so we can restore it on return.
    preEntryModeRef.current = mode;
    if (mode !== "galaxy") {
      // Snap to galaxy first and wait for the dot/line rearrangement
      // animation (~1.5s) to settle before kicking off the camera reorient +
      // shrink sequence. This produces the requested ordering: viz morphs
      // back to galaxy, THEN slides into the paper-galaxy slot.
      setModeState("galaxy");
      const DOT_SETTLE_MS = 1500;
      setTimeout(() => enterShadowbox(), DOT_SETTLE_MS);
    } else {
      enterShadowbox();
    }
  }, [enterShadowbox, mode]);
  // returnToGalaxy is reserved for explicit user action elsewhere
  void returnToGalaxy;

  // When the shadowbox lands back in the galaxy phase (camera reorient lerp
  // has just completed), restore whichever viz mode the user was in before
  // they entered. The user explicitly asked for the galaxy to read as the
  // galaxy view FIRST, then morph back into clusters/timeline — so we hold
  // off on the mode swap until the camera has finished returning to
  // perspective.
  const prevPhaseRef = useRef(phase);
  useEffect(() => {
    if (prevPhaseRef.current !== "galaxy" && phase === "galaxy") {
      if (preEntryModeRef.current !== "galaxy") {
        setModeState(preEntryModeRef.current);
      }
    }
    prevPhaseRef.current = phase;
  }, [phase]);

  return (
    <ScrollContext.Provider
      value={{ scrollY: 0, scrollProgress, mode, setMode, nextMode, prevMode, pastVisualization, setPastVisualization }}
    >
      {children}
    </ScrollContext.Provider>
  );
}

export const useScroll = () => useContext(ScrollContext);
