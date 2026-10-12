"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useId, useRef, useState } from "react";

export type PinguMood = "happy" | "wave" | "cheer" | "think" | "sleep" | "sad";

interface PinguProps {
  mood?: PinguMood;
  size?: number;
  scarf?: string;
  scarfShade?: string;
  cap?: boolean;
  animate?: boolean;
  // Eyes follow the pointer, hovering waves, clicking makes Pingu hop and cheer.
  interactive?: boolean;
  onPoke?: () => void;
  className?: string;
  title?: string;
}

const INK = "#14223B";
const BODY = "#1F2D4A";
const BODY_SHADE = "#16213A";
const BELLY = "#FFFFFF";
const BELLY_SHADE = "#E6F0FA";
const BEAK = "#FF9F1C";
const BEAK_SHADE = "#E07E00";
const CHEEK = "#FF9DB0";

// Flippers hang from the shoulders. Pivots are fractions of each flipper's own
// bounding box (framer-motion uses transform-box: fill-box on SVG), so the
// shoulder sits at the top inner corner.
const LEFT_WING = "M38 112 C18 128 12 160 22 180 C34 166 42 146 46 124Z";
const RIGHT_WING = "M162 112 C182 128 188 160 178 180 C166 166 158 146 154 124Z";
const LEFT_PIVOT = { originX: 0.85, originY: 0.04 };
const RIGHT_PIVOT = { originX: 0.15, originY: 0.04 };

export default function Pingu({
  mood = "happy",
  size = 120,
  scarf = "#2B9FE6",
  scarfShade = "#1A7BC0",
  cap = false,
  animate = true,
  interactive = false,
  onPoke,
  className,
  title = "Pingu the penguin",
}: PinguProps) {
  const reduce = useReducedMotion();
  const live = animate && !reduce;
  const uid = useId().replace(/:/g, "");
  const svgRef = useRef<SVGSVGElement>(null);

  const [hover, setHover] = useState(false);
  const [poked, setPoked] = useState(0);
  const [look, setLook] = useState({ x: 0, y: 0 });
  const pokeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pupils track the pointer anywhere on the page.
  useEffect(() => {
    if (!interactive) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = svgRef.current?.getBoundingClientRect();
        if (!r) return;
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height * 0.37;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy) || 1;
        const reach = Math.min(1, dist / 260);
        setLook({ x: (dx / dist) * 4 * reach, y: (dy / dist) * 3.5 * reach });
      });
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
    };
  }, [interactive]);

  useEffect(() => () => {
    if (pokeTimer.current) clearTimeout(pokeTimer.current);
  }, []);

  const poke = useCallback(() => {
    setPoked((n) => n + 1);
    if (pokeTimer.current) clearTimeout(pokeTimer.current);
    pokeTimer.current = setTimeout(() => setPoked(0), 1100);
    onPoke?.();
  }, [onPoke]);

  const celebrating = poked > 0;
  const shown: PinguMood = celebrating ? "cheer" : interactive && hover && mood !== "sleep" ? "wave" : mood;

  const eyesClosed = shown === "cheer" || shown === "sleep";
  const wingsUp = shown === "cheer";

  const body = live
    ? celebrating
      ? { y: [0, -26, 0, -10, 0], scaleY: [1, 1.04, 0.94, 1.02, 1], transition: { duration: 0.8, ease: "easeOut" as const } }
      : shown === "cheer"
        ? { y: [0, -14, 0], transition: { duration: 0.7, repeat: Infinity, ease: "easeOut" as const } }
        : shown === "sleep"
          ? { scaleY: [1, 1.025, 1], transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" as const } }
          : { y: [0, -4, 0], transition: { duration: 2.6, repeat: Infinity, ease: "easeInOut" as const } }
    : {};

  // Rotation in degrees around the shoulder. Negative swings the right flipper
  // outward and up; positive does the same for the left one.
  const spring = { type: "spring" as const, stiffness: 260, damping: 14 };
  const rightWing = wingsUp
    ? live
      ? { rotate: [-140, -115, -140], transition: { duration: 0.32, repeat: Infinity, ease: "easeInOut" as const } }
      : { rotate: -128 }
    : shown === "wave"
      ? live
        ? { rotate: [-20, -135, -105, -140, -105, -20], transition: { duration: 1.8, repeat: Infinity, repeatDelay: hover ? 0 : 1.4, ease: "easeInOut" as const } }
        : { rotate: -120 }
      : shown === "sad"
        ? { rotate: 6, transition: spring }
        : { rotate: 0, transition: spring };
  const leftWing = wingsUp
    ? live
      ? { rotate: [140, 115, 140], transition: { duration: 0.32, repeat: Infinity, ease: "easeInOut" as const } }
      : { rotate: 128 }
    : shown === "think"
      ? { rotate: 18, transition: spring }
      : shown === "sad"
        ? { rotate: -6, transition: spring }
        : { rotate: 0, transition: spring };

  const dx = shown === "think" ? 3 : look.x;
  const dy = shown === "think" ? -4 : look.y;

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 200 230"
      width={size}
      height={size * 1.15}
      className={`${className ?? ""} ${interactive ? "cursor-pointer select-none touch-manipulation rounded-3xl outline-none focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-beak" : ""}`}
      role={interactive ? "button" : "img"}
      aria-label={interactive ? `${title}. Tap to say hi` : title}
      tabIndex={interactive ? 0 : undefined}
      onClick={interactive ? poke : undefined}
      onKeyDown={interactive ? (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), poke()) : undefined}
      onPointerEnter={interactive ? () => setHover(true) : undefined}
      onPointerLeave={interactive ? () => setHover(false) : undefined}
      style={{ overflow: "visible" }}
    >
      <defs>
        <clipPath id={`belly-${uid}`}>
          <path d="M100 20 C152 20 172 72 172 124 C172 184 140 212 100 212 C60 212 28 184 28 124 C28 72 48 20 100 20Z" />
        </clipPath>
      </defs>

      {/* ground shadow shrinks as Pingu hops */}
      <motion.ellipse
        cx="100" cy="222" rx="58" ry="6" fill={INK} opacity="0.12"
        style={{ originX: 0.5, originY: 0.5 }}
        animate={live && celebrating ? { scaleX: [1, 0.7, 1, 0.9, 1], transition: { duration: 0.8 } } : { scaleX: 1 }}
      />

      <motion.g key={celebrating ? `hop-${poked}` : "idle"} style={{ originX: 0.5, originY: 1 }} animate={body}>
        {/* feet */}
        <ellipse cx="78" cy="210" rx="18" ry="8" fill={BEAK} />
        <ellipse cx="122" cy="210" rx="18" ry="8" fill={BEAK} />
        <ellipse cx="78" cy="213" rx="14" ry="4" fill={BEAK_SHADE} opacity="0.6" />
        <ellipse cx="122" cy="213" rx="14" ry="4" fill={BEAK_SHADE} opacity="0.6" />

        {/* body */}
        <path d="M100 20 C152 20 172 72 172 124 C172 184 140 212 100 212 C60 212 28 184 28 124 C28 72 48 20 100 20Z" fill={BODY} />

        {/* face + belly */}
        <g clipPath={`url(#belly-${uid})`}>
          <ellipse cx="100" cy="166" rx="56" ry="58" fill={BELLY_SHADE} />
          <ellipse cx="100" cy="162" rx="52" ry="54" fill={BELLY} />
        </g>
        <path d="M100 64 C88 44 50 46 48 82 C46 110 70 126 100 126 C130 126 154 110 152 82 C150 46 112 44 100 64Z" fill={BELLY} />

        {/* flippers, drawn over the body edge so a raised flipper stays visible */}
        <motion.path d={LEFT_WING} fill={BODY_SHADE} style={LEFT_PIVOT} animate={leftWing} />
        <motion.path d={RIGHT_WING} fill={BODY_SHADE} style={RIGHT_PIVOT} animate={rightWing} />

        {/* eyes */}
        {eyesClosed ? (
          shown === "sleep" ? (
            <g stroke={INK} strokeWidth="4.5" strokeLinecap="round" fill="none">
              <path d="M71 86 Q80 92 89 86" />
              <path d="M111 86 Q120 92 129 86" />
            </g>
          ) : (
            <g stroke={INK} strokeWidth="5" strokeLinecap="round" fill="none">
              <path d="M70 89 Q80 76 90 89" />
              <path d="M110 89 Q120 76 130 89" />
            </g>
          )
        ) : (
          <motion.g
            style={{ originX: 0.5, originY: 0.5 }}
            animate={live ? { scaleY: [1, 1, 0.1, 1, 1] } : {}}
            transition={live ? { duration: 4.2, repeat: Infinity, times: [0, 0.9, 0.93, 0.96, 1] } : undefined}
          >
            <circle cx="80" cy="84" r="11" fill={INK} opacity="0" />
            <circle cx="120" cy="84" r="11" fill={INK} opacity="0" />
            <g style={{ transform: `translate(${dx}px, ${dy}px)`, transition: "transform 120ms ease-out" }}>
              <circle cx="80" cy="84" r="10" fill={INK} />
              <circle cx="120" cy="84" r="10" fill={INK} />
              <circle cx="83" cy="80" r="3.6" fill="#fff" />
              <circle cx="123" cy="80" r="3.6" fill="#fff" />
              <circle cx="77" cy="88" r="1.6" fill="#fff" opacity="0.8" />
              <circle cx="117" cy="88" r="1.6" fill="#fff" opacity="0.8" />
            </g>
          </motion.g>
        )}

        {shown === "sad" && (
          <g stroke={INK} strokeWidth="3.5" strokeLinecap="round">
            <path d="M68 68 L88 72" />
            <path d="M132 68 L112 72" />
          </g>
        )}

        {/* cheeks glow when poked */}
        <ellipse cx="64" cy="104" rx="8" ry="5" fill={CHEEK} opacity={celebrating ? 1 : 0.75} />
        <ellipse cx="136" cy="104" rx="8" ry="5" fill={CHEEK} opacity={celebrating ? 1 : 0.75} />

        {/* beak */}
        {shown === "cheer" ? (
          <>
            <path d="M88 99 Q100 92 112 99 L100 106Z" fill={BEAK} />
            <path d="M90 106 Q100 104 110 106 Q100 120 90 106Z" fill={BEAK_SHADE} />
          </>
        ) : (
          <>
            <path d="M88 99 Q100 92 112 99 Q100 114 88 99Z" fill={BEAK} />
            <path d="M92 103 Q100 106 108 103 Q100 112 92 103Z" fill={BEAK_SHADE} opacity="0.55" />
          </>
        )}

        {/* scarf */}
        <path d="M40 124 Q100 148 160 124 L162 140 Q100 166 38 140Z" fill={scarf} />
        <path d="M44 132 Q100 156 156 132" stroke={scarfShade} strokeWidth="3" fill="none" opacity="0.7" />
        <motion.g
          style={{ originX: 0.2, originY: 0 }}
          animate={live && celebrating ? { rotate: [0, -16, 10, -6, 0], transition: { duration: 0.8 } } : { rotate: 0 }}
        >
          <path d="M124 146 L146 140 L150 178 L130 182Z" fill={scarf} />
          <path d="M131 166 L149 162 M132 174 L150 170" stroke={scarfShade} strokeWidth="3" />
        </motion.g>

        {/* graduation cap */}
        {cap && (
          <g>
            <path d="M100 4 L150 22 L100 40 L50 22Z" fill={INK} />
            <path d="M74 30 L74 44 Q100 54 126 44 L126 30 L100 40Z" fill="#0B1527" />
            <path d="M150 22 L150 46" stroke={BEAK} strokeWidth="3" strokeLinecap="round" />
            <circle cx="150" cy="48" r="4" fill={BEAK} />
          </g>
        )}
      </motion.g>

      {/* little hearts float up when poked */}
      {live && celebrating && (
        <g key={`hearts-${poked}`} fill="#FF6B8B">
          {[-38, 0, 40].map((x, i) => (
            <motion.path
              key={i}
              d="M0 4 C-6 -4 -14 2 0 12 C14 2 6 -4 0 4Z"
              initial={{ x: 100 + x, y: 40, opacity: 0, scale: 0.6 }}
              animate={{ y: -10 - i * 6, opacity: [0, 1, 0], scale: 1 }}
              transition={{ duration: 0.9, delay: i * 0.08, ease: "easeOut" }}
            />
          ))}
        </g>
      )}

      {shown === "sleep" && live && (
        <motion.g
          fill={INK}
          fontFamily="var(--font-display), sans-serif"
          fontWeight="700"
          animate={{ opacity: [0, 1, 0], y: [0, -10, -20] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        >
          <text x="158" y="40" fontSize="20">z</text>
          <text x="172" y="24" fontSize="14">z</text>
        </motion.g>
      )}
    </svg>
  );
}
