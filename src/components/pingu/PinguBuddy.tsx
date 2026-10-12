"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Pingu, { type PinguMood } from "./Pingu";

// Pingu with a speech bubble. Each tap makes Pingu hop and say the next line.
export default function PinguBuddy({
  lines,
  mood = "happy",
  size = 120,
  scarf,
  scarfShade,
  cap,
  bubble = "top",
  className,
  bubbleClassName = "",
}: {
  lines: string[];
  mood?: PinguMood;
  size?: number;
  scarf?: string;
  scarfShade?: string;
  cap?: boolean;
  bubble?: "top" | "top-right";
  className?: string;
  bubbleClassName?: string;
}) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const line = lines[i % lines.length];

  return (
    <div className={`relative inline-flex flex-col items-center ${className ?? ""}`}>
      <div
        className={`z-10 ${bubble === "top-right" ? "absolute -right-6 -top-8 sm:-right-28 sm:-top-4" : "relative mb-1"} ${bubbleClassName}`}
        aria-live="polite"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={i}
            initial={reduce ? false : { opacity: 0, y: 6, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="relative max-w-[240px] rounded-2xl border-2 border-line bg-white px-4 py-2 text-center font-display text-lg font-semibold leading-snug text-ink shadow-[0_10px_24px_-14px_rgba(16,33,58,0.4)]"
          >
            {line}
            <span
              className={`absolute -bottom-[8px] h-3.5 w-3.5 rotate-45 border-b-2 border-r-2 border-line bg-white ${
                bubble === "top-right" ? "left-6" : "left-1/2 -translate-x-1/2"
              }`}
            />
          </motion.div>
        </AnimatePresence>
      </div>
      <Pingu
        mood={mood}
        size={size}
        scarf={scarf}
        scarfShade={scarfShade}
        cap={cap}
        interactive
        onPoke={() => setI((n) => n + 1)}
        className="h-auto max-w-full"
      />
    </div>
  );
}
