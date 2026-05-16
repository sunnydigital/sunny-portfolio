"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
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
  const pastVisualization = phase !== "galaxy";

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
    if (v) enterShadowbox();
  }, [enterShadowbox]);
  // returnToGalaxy is reserved for explicit user action elsewhere
  void returnToGalaxy;

  return (
    <ScrollContext.Provider
      value={{ scrollY: 0, scrollProgress, mode, setMode, nextMode, prevMode, pastVisualization, setPastVisualization }}
    >
      {children}
    </ScrollContext.Provider>
  );
}

export const useScroll = () => useContext(ScrollContext);
