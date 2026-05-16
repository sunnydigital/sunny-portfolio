"use client";

import { motion } from "framer-motion";
import { useShadowbox } from "@/lib/shadowbox";
import { ChevronDown } from "lucide-react";

// Visual "scroll to explore" hint, shown only while the galaxy is up. The
// galaxy itself handles the wheel-to-transition logic via its bridged useScroll
// hook (which calls setPastVisualization → enterShadowbox).
export default function ScrollIndicator() {
  const { phase } = useShadowbox();

  if (phase !== "galaxy") return null;
  if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none"
    >
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Scroll to explore</p>
      <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
        <ChevronDown className="w-5 h-5" style={{ color: "var(--accent)", opacity: 0.6 }} />
      </motion.div>
    </motion.div>
  );
}
