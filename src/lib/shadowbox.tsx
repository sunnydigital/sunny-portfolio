"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";

export type Phase = "galaxy" | "transition" | "section";

export const SECTION_IDS = [
  "about",
  "projects",
  "papers",
  "posts",
  "skills",
  "resume",
  "contact",
] as const;
export type SectionId = (typeof SECTION_IDS)[number];

export const SECTION_COUNT = SECTION_IDS.length;
export const HILL_COUNT = SECTION_COUNT;

interface ShadowboxContext {
  phase: Phase;
  transition: number;
  sectionIndex: number;
  goToSection: (i: number) => void;
  goToSectionId: (id: SectionId) => void;
  nextSection: () => boolean;
  prevSection: () => boolean;
  enterShadowbox: () => void;
  returnToGalaxy: () => void;
}

const noop = () => {};
const Ctx = createContext<ShadowboxContext>({
  phase: "galaxy",
  transition: 0,
  sectionIndex: 0,
  goToSection: noop,
  goToSectionId: noop,
  nextSection: () => false,
  prevSection: () => false,
  enterShadowbox: noop,
  returnToGalaxy: noop,
});

const TRANSITION_MS = 1400;

export function ShadowboxProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("galaxy");
  const [transition, setTransition] = useState(0);
  const [sectionIndex, setSectionIndex] = useState(0);
  const rafRef = useRef<number | null>(null);

  const cancelAnim = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const animateTransitionTo = useCallback((target: 0 | 1, onDone: () => void) => {
    cancelAnim();
    const start = performance.now();
    const from = transition;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / TRANSITION_MS);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      const value = from + (target - from) * eased;
      setTransition(value);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
        onDone();
      }
    };
    rafRef.current = requestAnimationFrame(step);
  }, [transition]);

  const enterShadowbox = useCallback(() => {
    if (phase !== "galaxy") return;
    setPhase("transition");
    animateTransitionTo(1, () => setPhase("section"));
  }, [phase, animateTransitionTo]);

  const returnToGalaxy = useCallback(() => {
    if (phase !== "section") return;
    setPhase("transition");
    animateTransitionTo(0, () => setPhase("galaxy"));
  }, [phase, animateTransitionTo]);

  const goToSection = useCallback((i: number) => {
    const clamped = Math.max(0, Math.min(SECTION_COUNT - 1, i));
    setSectionIndex(clamped);
    if (phase === "galaxy") {
      setPhase("transition");
      animateTransitionTo(1, () => setPhase("section"));
    }
  }, [phase, animateTransitionTo]);

  const goToSectionId = useCallback((id: SectionId) => {
    const idx = SECTION_IDS.indexOf(id);
    if (idx >= 0) goToSection(idx);
  }, [goToSection]);

  const nextSection = useCallback((): boolean => {
    if (sectionIndex >= SECTION_COUNT - 1) return false;
    setSectionIndex(sectionIndex + 1);
    return true;
  }, [sectionIndex]);

  const prevSection = useCallback((): boolean => {
    if (sectionIndex <= 0) return false;
    setSectionIndex(sectionIndex - 1);
    return true;
  }, [sectionIndex]);

  useEffect(() => () => cancelAnim(), []);

  return (
    <Ctx.Provider
      value={{
        phase,
        transition,
        sectionIndex,
        goToSection,
        goToSectionId,
        nextSection,
        prevSection,
        enterShadowbox,
        returnToGalaxy,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useShadowbox = () => useContext(Ctx);
