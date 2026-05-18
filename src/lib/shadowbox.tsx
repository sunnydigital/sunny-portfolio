"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";

// Phase progression:
//   Entering shadowbox:
//     galaxy → pre-enter (camera reorients to top-down while still fullscreen)
//            → transition (galaxy shrinks/translates to upper-right)
//            → section
//   Returning to galaxy:
//     section → transition (galaxy unshrinks back to fullscreen, still top-down)
//             → pre-exit (camera reorients from top-down back to the user's
//                         preferred perspective view)
//             → galaxy
export type Phase = "galaxy" | "pre-enter" | "transition" | "section" | "pre-exit";

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

// Asymmetric transition timing. Entry is slow + ceremonial (galaxy shrinks
// into the paper-galaxy slot, layers stage in). Exit is snappier because the
// shadowbox is opaque during the whole expand — long durations there just
// look like the page is frozen.
const ENTER_TRANSITION_MS = 2400;
const EXIT_TRANSITION_MS = 1100;
// Time the camera spends lerping toward / away from the top-down "paper galaxy"
// pose before the shrink/expand DOM transition kicks in. Tuned so the camera
// move feels intentional but not slow — the actual lerp inside
// GalaxyReturnAnimator settles in ~600ms with k=0.06, so this gives a small
// buffer for the final approach.
const PRE_ENTER_MS = 700;
const PRE_EXIT_MS = 500;

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
    const duration = target === 1 ? ENTER_TRANSITION_MS : EXIT_TRANSITION_MS;
    const start = performance.now();
    const from = transition;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
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

  // Two-stage entry: camera first lerps to top-down (pre-enter), THEN the
  // outer DOM shrinks the galaxy into the upper-right paper-galaxy slot
  // (transition). This makes the swap from 3D galaxy → paper galaxy feel like
  // a continuous slide.
  const beginEntry = useCallback(() => {
    setPhase("pre-enter");
    setTimeout(() => {
      setPhase("transition");
      animateTransitionTo(1, () => setPhase("section"));
    }, PRE_ENTER_MS);
  }, [animateTransitionTo]);

  const enterShadowbox = useCallback(() => {
    if (phase !== "galaxy") return;
    beginEntry();
  }, [phase, beginEntry]);

  // Two-stage exit: the galaxy first unshrinks back to fullscreen while still
  // at the top-down "paper galaxy" pose (transition), THEN the camera lerps
  // back to a normal perspective view (pre-exit). This mirrors the entry so
  // the paper→3D galaxy swap reads as a continuous slide.
  const returnToGalaxy = useCallback(() => {
    if (phase !== "section") return;
    setPhase("transition");
    animateTransitionTo(0, () => {
      setPhase("pre-exit");
      setTimeout(() => setPhase("galaxy"), PRE_EXIT_MS);
    });
  }, [phase, animateTransitionTo]);

  const goToSection = useCallback((i: number) => {
    const clamped = Math.max(0, Math.min(SECTION_COUNT - 1, i));
    setSectionIndex(clamped);
    if (phase === "galaxy") {
      beginEntry();
    }
  }, [phase, beginEntry]);

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
