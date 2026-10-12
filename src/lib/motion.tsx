"use client";

// Shared animation helpers. GSAP handles choreography (the path, the guide
// Pingu, counters); framer-motion handles component state transitions.
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { motion, useInView, useReducedMotion } from "framer-motion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export { gsap, ScrollTrigger, useGSAP };

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

// Counts up to `value` the first time it scrolls into view, then tweens on change.
export function CountUp({ value, duration = 1.1, className }: { value: number; duration?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(0);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });

  useEffect(() => {
    const el = ref.current;
    if (!el || !inView) return;
    if (prefersReducedMotion()) {
      el.textContent = String(value);
      shown.current = value;
      return;
    }
    const state = { n: shown.current };
    const tween = gsap.to(state, {
      n: value,
      duration,
      ease: "power3.out",
      onUpdate: () => {
        el.textContent = String(Math.round(state.n));
      },
      onComplete: () => {
        shown.current = value;
      },
    });
    return () => {
      tween.kill();
    };
  }, [value, inView, duration]);

  return (
    <span ref={ref} className={className}>
      {/* Server and no-JS render the real number; the tween takes over from there. */}
      {value}
    </span>
  );
}

// A progress fill that grows from empty the first time it's seen.
export function Fill({ pct, className, style }: { pct: number; className?: string; style?: React.CSSProperties }) {
  const reduce = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <motion.div
      className={className}
      style={style}
      initial={reduce ? false : { width: "0%" }}
      whileInView={{ width: `${clamped}%` }}
      animate={reduce ? { width: `${clamped}%` } : undefined}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.1 }}
    />
  );
}

// Staggered entrance for lists and card stacks. Children start visible for
// no-JS and reduced motion; only the transform and fade are animated.
export const staggerParent = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};
export const staggerChild = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } },
};
