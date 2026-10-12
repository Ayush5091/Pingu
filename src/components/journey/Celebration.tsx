"use client";

import { useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { LevelProgress, YearDef } from "@/lib/journey";
import Pingu from "@/components/pingu/Pingu";

const CONFETTI = ["#FFC23D", "#2B9FE6", "#FF9F1C", "#14B8A6", "#8B5CF6", "#E5484D"];

export default function Celebration({
  levels, year, onClose,
}: {
  levels: LevelProgress[];
  year: YearDef;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const open = levels.length > 0;
  const summit = levels.some((l) => l.id === "y4-summit");

  const pieces = useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => ({
        id: i,
        x: (i * 37) % 100,
        delay: (i % 11) * 0.06,
        rotate: (i * 53) % 360,
        color: CONFETTI[i % CONFETTI.length],
        w: 8 + (i % 3) * 3,
        drift: ((i % 7) - 3) * 18,
      })),
    []
  );

  useEffect(() => {
    if (!open) return;
    buttonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const earned = levels.reduce((s, l) => s + l.completedBy.reduce((a, i) => a + (Number(i.points) || 0), 0), 0);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/55 px-4 backdrop-blur-[3px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="celebrate-title"
        >
          {!reduce && (
            <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
              {pieces.map((p) => (
                <motion.span
                  key={p.id}
                  className="absolute top-0 block rounded-[3px]"
                  style={{ left: `${p.x}%`, width: p.w, height: p.w * 0.45, background: p.color }}
                  initial={{ y: -40, rotate: p.rotate, opacity: 1 }}
                  animate={{ y: "105vh", x: p.drift, rotate: p.rotate + 540, opacity: [1, 1, 0.8] }}
                  transition={{ duration: 2.6 + (p.id % 5) * 0.25, delay: p.delay, ease: [0.2, 0.6, 0.4, 1] }}
                />
              ))}
            </div>
          )}

          <motion.div
            className="relative w-full max-w-sm rounded-[32px] bg-white px-6 pb-6 pt-4 text-center shadow-[0_30px_80px_-30px_rgba(16,33,58,0.6)]"
            initial={reduce ? false : { scale: 0.85, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
          >
            <div className="-mt-20 flex justify-center">
              <Pingu mood="cheer" size={150} scarf={year.color} scarfShade={year.shade} cap={summit} />
            </div>
            <h2 id="celebrate-title" className="mt-1 font-display text-[28px] font-semibold leading-tight text-ink">
              {summit ? "You reached the summit!" : levels.length > 1 ? `${levels.length} levels cleared!` : "Level cleared!"}
            </h2>
            <ul className="mt-3 flex flex-wrap justify-center gap-2">
              {levels.map((l) => (
                <li key={l.id} className="rounded-full bg-gold-soft px-3 py-1.5 text-sm font-extrabold text-[#7A5200]">
                  {l.title}
                </li>
              ))}
            </ul>
            {earned > 0 && (
              <p className="mt-4 font-display text-xl font-semibold text-[#B37A00]">+{earned} activity points</p>
            )}
            <p className="mt-2 text-[15px] font-bold text-ink-soft">
              {summit ? "100 AICTE points. Pingu might actually cry with pride." : "Pingu is doing a happy dance. Ready for the next one?"}
            </p>
            <button ref={buttonRef} type="button" onClick={onClose} className="btn-3d btn-gold mt-6 w-full">
              Keep waddling
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
