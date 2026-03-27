"use client";

import { motion } from "framer-motion";
import { useScroll } from "@/lib/scroll";
import { ChevronDown } from "lucide-react";

export default function ScrollIndicator() {
  const { mode } = useScroll();

  if (mode !== "galaxy") return null;
  if (typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed bottom-24 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
    >
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Scroll to explore</p>
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ repeat: Infinity, duration: 1.5 }}
      >
        <ChevronDown className="w-5 h-5" style={{ color: "var(--accent)", opacity: 0.6 }} />
      </motion.div>
    </motion.div>
  );
}
