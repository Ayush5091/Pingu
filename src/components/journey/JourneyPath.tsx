"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Lock, X } from "lucide-react";
import type { LevelProgress, YearProgress } from "@/lib/journey";
import Pingu, { type PinguMood } from "@/components/pingu/Pingu";
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from "@/lib/motion";
import { LEVEL_ICONS, categoryStyle } from "./icons";
import YearScenery from "./YearScenery";

// Horizontal offsets that give the path its winding river shape.
const WIGGLE = [0, 52, 84, 52, 0, -52, -84, -52];

// Guide Pingu's box (the SVG renders at size x size*1.15).
const GUIDE = 86;
const GUIDE_H = GUIDE * 1.15;
const GUIDE_GAP = 16;

interface JourneyPathProps {
  years: YearProgress[];
  currentLevelId: string | null;
  currentYear: number;
  demo?: boolean;
}

interface NodePos {
  cx: number;
  cy: number;
  r: number;
}

interface PathLayout {
  w: number;
  h: number;
  nodes: Record<string, NodePos>;
}

export default function JourneyPath({ years, currentLevelId, currentYear, demo }: JourneyPathProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [layout, setLayout] = useState<PathLayout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrolled = useRef(false);

  const levels = useMemo(
    () => years.flatMap((y) => y.levels.map((l, i) => ({ level: l, year: y, offset: WIGGLE[i % WIGGLE.length] }))),
    [years]
  );

  // Measure every node's centre relative to the path container. Wrappers carry
  // only the wiggle translate, so the pop-in scale animation doesn't skew this.
  const measure = useCallback(() => {
    const c = containerRef.current;
    if (!c) return;
    const cr = c.getBoundingClientRect();
    const nodes: Record<string, NodePos> = {};
    for (const { level } of levels) {
      const el = wrapperRefs.current[level.id];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const size = level.checkpoint ? 84 : 72;
      nodes[level.id] = { cx: r.left + r.width / 2 - cr.left, cy: r.top - cr.top + (size - 6) / 2, r: size / 2 };
    }
    setLayout({ w: cr.width, h: cr.height, nodes });
  }, [levels]);

  useLayoutEffect(() => {
    measure();
    const c = containerRef.current;
    if (!c) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(c);
    document.fonts?.ready.then(() => measure());
    return () => ro.disconnect();
  }, [measure]);

  useEffect(() => {
    if (scrolled.current || !currentLevelId) return;
    // Flag inside the timeout: React dev mode runs effects twice and the first
    // timeout gets cleared, so flagging early would skip the scroll entirely.
    const t = setTimeout(() => {
      scrolled.current = true;
      wrapperRefs.current[currentLevelId]?.scrollIntoView({ block: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
    }, 350);
    return () => clearTimeout(t);
  }, [currentLevelId]);

  useEffect(() => {
    // Lets the floating "Ask Pingu" button step aside while a level is open.
    if (openId) document.body.dataset.levelOpen = "1";
    else delete document.body.dataset.levelOpen;
    return () => {
      delete document.body.dataset.levelOpen;
    };
  }, [openId]);

  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenId(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openId]);

  // Levels pop onto the path as they scroll into view.
  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const nodes = gsap.utils.toArray<HTMLElement>(".path-node-anim", containerRef.current);
      gsap.set(nodes, { autoAlpha: 0, scale: 0.4, y: 22 });
      ScrollTrigger.batch(nodes, {
        start: "top 94%",
        once: true,
        onEnter: (batch) =>
          gsap.to(batch, { autoAlpha: 1, scale: 1, y: 0, duration: 0.6, stagger: 0.07, ease: "back.out(2.4)", overwrite: true }),
      });
    },
    { scope: containerRef, dependencies: [levels.length] }
  );

  const onHover = useCallback((id: string | null) => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHoverId(id), id ? 90 : 600);
  }, []);

  const lastId = levels[levels.length - 1]?.level.id ?? null;
  const focusId = hoverId ?? openId ?? currentLevelId ?? lastId;
  const focus = levels.find((l) => l.level.id === focusId) ?? null;

  return (
    <div ref={containerRef} className="relative isolate flex flex-col gap-4 lg:gap-8">
      {layout && <Trail layout={layout} years={years} />}

      {years.map((year) => (
        <section key={year.year} aria-labelledby={`year-${year.year}`} className="relative">
          <YearScenery year={year} />
          <YearBanner year={year} currentYear={currentYear} />

          <ol className="relative mx-auto flex w-full max-w-[420px] flex-col items-center gap-[22px] pb-10 pt-10 lg:pb-16 lg:pt-12">
            {year.levels.map((level, i) => {
              const offset = WIGGLE[i % WIGGLE.length];
              const isCurrent = level.id === currentLevelId;
              return (
                <li
                  key={level.id}
                  className={`relative flex w-full justify-center ${isCurrent ? "pt-9" : ""}`}
                  style={{ zIndex: openId === level.id ? 30 : 1 }}
                >
                  <div
                    ref={(el) => {
                      wrapperRefs.current[level.id] = el;
                    }}
                    className="relative"
                    style={{ transform: `translateX(${offset}px)` }}
                    onPointerEnter={(e) => e.pointerType === "mouse" && onHover(level.id)}
                    onPointerLeave={(e) => e.pointerType === "mouse" && onHover(null)}
                  >
                    <LevelNode
                      level={level}
                      year={year}
                      isCurrent={isCurrent}
                      isOpen={openId === level.id}
                      onToggle={() => setOpenId((cur) => (cur === level.id ? null : level.id))}
                    />
                  </div>

                  <AnimatePresence>
                    {openId === level.id && (
                      <LevelPopover level={level} year={year} offset={offset} demo={demo} onClose={() => setOpenId(null)} />
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      {layout && focus && layout.nodes[focus.level.id] && layout.w >= 340 && (
        <PathGuide
          level={focus.level}
          year={focus.year}
          pos={layout.nodes[focus.level.id]}
          side={focus.offset >= 0 ? "left" : "right"}
          onOpen={() => setOpenId(focus.level.id)}
        />
      )}

      {openId && <button aria-label="Close level details" className="fixed inset-0 z-20 cursor-default" onClick={() => setOpenId(null)} />}
    </div>
  );
}

// Dotted trail linking the levels. It draws itself down the page as you
// scroll, and turns gold between levels that are both cleared.
function Trail({ layout, years }: { layout: PathLayout; years: YearProgress[] }) {
  const clipRef = useRef<SVGRectElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const clipId = useRef(`trail-${Math.random().toString(36).slice(2, 8)}`).current;

  useEffect(() => {
    const rect = clipRef.current;
    const svg = svgRef.current;
    if (!rect || !svg) return;
    if (prefersReducedMotion()) {
      rect.setAttribute("height", String(layout.h));
      return;
    }
    const proxy = { h: Number(rect.getAttribute("height")) || 0 };
    const update = () => {
      const top = svg.getBoundingClientRect().top;
      const target = Math.max(0, Math.min(layout.h, window.innerHeight * 0.82 - top));
      gsap.to(proxy, {
        h: target,
        duration: 0.7,
        ease: "power3.out",
        overwrite: true,
        onUpdate: () => rect.setAttribute("height", String(proxy.h)),
      });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      gsap.killTweensOf(proxy);
    };
  }, [layout.h]);

  const segments: { d: string; color: string; key: string }[] = [];
  for (const y of years) {
    for (let i = 0; i < y.levels.length - 1; i++) {
      const a = layout.nodes[y.levels[i].id];
      const b = layout.nodes[y.levels[i + 1].id];
      if (!a || !b) continue;
      const my = (b.cy - a.cy) / 2;
      const bothDone = y.levels[i].state === "completed" && y.levels[i + 1].state === "completed";
      segments.push({
        key: y.levels[i].id,
        d: `M${a.cx} ${a.cy} C${a.cx} ${a.cy + my} ${b.cx} ${b.cy - my} ${b.cx} ${b.cy}`,
        color: bothDone ? "#FFC23D" : y.unlocked ? `${y.color}55` : "#D5DFEA",
      });
    }
  }

  return (
    <svg ref={svgRef} className="pointer-events-none absolute left-0 top-0 z-0" width={layout.w} height={layout.h} aria-hidden>
      <defs>
        <clipPath id={clipId}>
          <rect ref={clipRef} x="0" y="0" width={layout.w} height="0" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`} fill="none" strokeLinecap="round" strokeWidth="9" strokeDasharray="0 17">
        {segments.map((s) => (
          <path key={s.key} d={s.d} stroke={s.color} />
        ))}
      </g>
    </svg>
  );
}

const GUIDE_LINES: Record<LevelProgress["state"], (l: LevelProgress) => string[]> = {
  completed: (l) => [`We cleared ${l.title}!`, "Gold looks good on us.", "Remember this one? Nice work."],
  current: (l) => [`Let's do ${l.title}!`, "This one's next. Tap me!", "I believe in you!"],
  open: (l) => [`${l.title} is open anytime.`, "Ooh, this one looks fun.", "We can do this one too."],
  locked: (l) => [`Zzz… wakes up in Year ${l.year}.`, "Shh, Pingu is napping.", "Doing it early still counts!"],
};

const GUIDE_MOOD: Record<LevelProgress["state"], PinguMood> = {
  completed: "happy",
  current: "wave",
  open: "think",
  locked: "sleep",
};

// One Pingu that waddles along the path to whichever level you hover or open.
function PathGuide({
  level, year, pos, side, onOpen,
}: {
  level: LevelProgress; year: YearProgress; pos: NodePos; side: "left" | "right"; onOpen: () => void;
}) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const placed = useRef(false);
  const cheerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [arrived, setArrived] = useState(true);
  const [cheer, setCheer] = useState(false);
  const [line, setLine] = useState(0);

  const x = side === "left" ? pos.cx - pos.r - GUIDE_GAP - GUIDE : pos.cx + pos.r + GUIDE_GAP;
  const y = pos.cy - GUIDE_H / 2 - 6;
  const completed = level.state === "completed";

  useLayoutEffect(() => {
    const el = outerRef.current;
    const inner = innerRef.current;
    if (!el || !inner) return;
    if (!placed.current || prefersReducedMotion()) {
      gsap.set(el, { x, y });
      placed.current = true;
      return;
    }
    const fromX = Number(gsap.getProperty(el, "x"));
    const fromY = Number(gsap.getProperty(el, "y"));
    const dist = Math.hypot(x - fromX, y - fromY);
    if (dist < 2) return;
    const duration = Math.min(1.3, Math.max(0.35, dist / 650));
    const steps = Math.max(2, Math.round(duration / 0.13));
    setArrived(false);
    const tl = gsap.timeline({
      onComplete: () => {
        setArrived(true);
        if (completed) {
          setCheer(true);
          if (cheerTimer.current) clearTimeout(cheerTimer.current);
          cheerTimer.current = setTimeout(() => setCheer(false), 900);
        }
      },
    });
    // Glide to the level while rocking side to side: a waddle.
    tl.to(el, { x, y, duration, ease: "power2.inOut" }, 0)
      .to(inner, { rotation: 8, y: -7, duration: duration / steps / 2, ease: "sine.out", yoyo: true, repeat: steps * 2 - 1 }, 0)
      .to(inner, { rotation: 0, y: 0, duration: 0.18, ease: "back.out(3)" });
    return () => {
      tl.kill();
      gsap.set(inner, { rotation: 0, y: 0 });
    };
  }, [x, y, completed]);

  useEffect(() => setLine(0), [level.id]);
  useEffect(() => () => {
    if (cheerTimer.current) clearTimeout(cheerTimer.current);
  }, []);

  const lines = GUIDE_LINES[level.state](level);
  const mood: PinguMood = cheer ? "cheer" : arrived ? GUIDE_MOOD[level.state] : "happy";

  return (
    <div ref={outerRef} className="pointer-events-none absolute left-0 top-0 z-[6]" style={{ width: GUIDE }}>
      <AnimatePresence mode="wait">
        {arrived && (
          <motion.div
            key={`${level.id}-${line}`}
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className={`absolute bottom-[calc(100%+2px)] w-max max-w-[140px] rounded-2xl border-2 border-line bg-white px-3 py-1.5 text-center font-display text-[13px] font-semibold leading-tight text-ink shadow-[0_8px_18px_-12px_rgba(16,33,58,0.45)] ${
              side === "left" ? "right-2" : "left-2"
            }`}
            aria-live="polite"
          >
            {lines[line % lines.length]}
            <span
              className={`absolute -bottom-[7px] h-3 w-3 rotate-45 border-b-2 border-r-2 border-line bg-white ${side === "left" ? "right-8" : "left-8"}`}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <div ref={innerRef} className="pointer-events-auto" style={{ transformOrigin: "50% 100%" }}>
        <Pingu
          mood={mood}
          size={GUIDE}
          scarf={year.color}
          scarfShade={year.shade}
          cap={level.id === "y4-summit"}
          interactive
          title={`Pingu. Open ${level.title}`}
          onPoke={() => {
            setLine((n) => n + 1);
            onOpen();
          }}
        />
      </div>
    </div>
  );
}

function YearBanner({ year, currentYear }: { year: YearProgress; currentYear: number }) {
  const locked = !year.unlocked;
  const pct = Math.round((year.completed / year.total) * 100);
  return (
    <header
      className="sticky top-[76px] z-10 flex items-center gap-4 overflow-hidden rounded-3xl px-5 py-4 lg:top-4"
      style={{
        background: locked ? "#E7EEF5" : year.deep,
        color: locked ? "#10213A" : "#fff",
        boxShadow: locked ? "0 4px 0 #CCD8E5" : `0 4px 0 ${year.shade}`,
      }}
    >
      <div className="min-w-0 flex-1">
        <h2 id={`year-${year.year}`} className="font-display text-[22px] font-semibold leading-tight">
          Year {year.year} · {year.name}
        </h2>
        <p className={`mt-0.5 text-sm font-bold ${locked ? "text-ink-soft" : "text-white/85"}`}>
          {locked
            ? `Unlocks in Year ${year.year}. Anything you finish early still counts.`
            : year.year === currentYear
              ? `${year.theme}. ${year.tagline}`
              : year.theme}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        {locked ? (
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/70">
            <Lock size={20} strokeWidth={2.75} className="text-ink-soft" />
          </span>
        ) : (
          <>
            <span className="font-display text-lg font-semibold tabular-nums">
              {year.completed}/{year.total}
            </span>
            <span className="h-2 w-16 overflow-hidden rounded-full bg-white/25">
              <span className="block h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
            </span>
          </>
        )}
      </div>
    </header>
  );
}

function LevelNode({
  level, year, isCurrent, isOpen, onToggle,
}: {
  level: LevelProgress; year: YearProgress; isCurrent: boolean; isOpen: boolean; onToggle: () => void;
}) {
  const reduce = useReducedMotion();
  const Icon = LEVEL_ICONS[level.icon];
  const { state } = level;
  const palette =
    state === "completed"
      ? { bg: "#FFC23D", shade: "#DB9A00", icon: "#fff" }
      : state === "current"
        ? { bg: year.color, shade: year.shade, icon: "#fff" }
        : state === "open"
          ? { bg: year.soft, shade: `${year.color}55`, icon: year.shade }
          : { bg: "#E5ECF3", shade: "#C9D5E3", icon: "#93A3B8" };

  const size = level.checkpoint ? 84 : 72;
  const label = `${level.title}: ${level.quest}. ${
    state === "completed" ? "Completed" : state === "locked" ? `Locked until year ${level.year}` : state === "current" ? "Next up" : "Available"
  }`;

  return (
    <div className="path-node-anim relative flex flex-col items-center">
      {isCurrent && !isOpen && (
        <motion.div
          className="absolute -top-12 z-10 whitespace-nowrap rounded-xl border-2 border-line bg-white px-3 py-1.5 font-display text-sm font-semibold uppercase tracking-wider"
          style={{ color: year.shade }}
          animate={reduce ? {} : { y: [0, -5, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          Start
          <span className="absolute -bottom-[7px] left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-line bg-white" />
        </motion.div>
      )}

      {isCurrent && (
        <span
          className={`path-node-pulse pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 ${level.checkpoint ? "rounded-[28px]" : "rounded-full"}`}
          style={{ width: size, height: size - 6, ["--pulse" as string]: `${year.color}66` }}
          aria-hidden
        />
      )}
      <motion.button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label={label}
        className={`group relative flex items-center justify-center focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-4 focus-visible:outline-beak ${
          level.checkpoint ? "rounded-[28px]" : "rounded-full"
        }`}
        style={{ width: size, height: size - 6, background: palette.bg }}
        initial={false}
        animate={{ y: 0, boxShadow: `0 7px 0 ${palette.shade}` }}
        whileHover={reduce ? undefined : { y: -3, boxShadow: `0 10px 0 ${palette.shade}` }}
        whileTap={{ y: 6, boxShadow: `0 1px 0 ${palette.shade}` }}
        transition={{ type: "spring", stiffness: 600, damping: 28 }}
      >
        <span className="absolute left-3 right-3 top-2 h-3 rounded-full bg-white/25" aria-hidden />
        {state === "locked" ? (
          <Lock size={26} strokeWidth={2.75} color={palette.icon} />
        ) : (
          <Icon size={level.checkpoint ? 34 : 30} strokeWidth={2.6} color={palette.icon} className="transition-transform duration-300 ease-out group-hover:-rotate-12 group-hover:scale-110" />
        )}
        {state === "completed" && (
          <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-[3px] border-white bg-moss">
            <Check size={14} strokeWidth={4} color="#fff" />
          </span>
        )}
      </motion.button>
      <span className="relative mt-2.5 max-w-[124px] rounded-lg bg-snow px-1.5 py-0.5 text-center font-display text-[13px] font-semibold leading-tight text-ink-soft">
        {level.title}
      </span>
    </div>
  );
}

function LevelPopover({
  level, year, offset, demo, onClose,
}: {
  level: LevelProgress; year: YearProgress; offset: number; demo?: boolean; onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = setTimeout(() => ref.current?.scrollIntoView({ block: "nearest", behavior: reduce ? "auto" : "smooth" }), 60);
    return () => clearTimeout(t);
  }, [reduce]);
  const done = level.state === "completed";
  const locked = level.state === "locked";
  const m = level.matcher;
  const isConducted = m.kind === "conducted";
  const isAggregate = m.kind === "points" || m.kind === "distinctCategories" || m.kind === "any";
  const showProgress = !done && level.target > 1;
  const pct = Math.round((level.progress / level.target) * 100);
  const cat = level.suggestCategory ? categoryStyle(level.suggestCategory) : null;

  const eventsHref = demo ? "/login" : `/events${level.suggestCategory ? `?category=${encodeURIComponent(level.suggestCategory)}` : ""}`;
  const logHref = demo ? "/login" : `/request-activity?level=${level.id}`;
  const hostHref = demo ? "/login" : "/events?new=1";

  return (
    <div className="absolute left-1/2 top-[calc(100%+6px)] z-30 w-[min(340px,calc(100vw-32px))] -translate-x-1/2">
    <motion.div
      ref={ref}
      role="dialog"
      aria-label={level.title}
      initial={reduce ? false : { opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.98 }}
      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
      className="relative"
    >
      <span
        className="absolute -top-[9px] h-4 w-4 rotate-45 rounded-[3px] border-l-2 border-t-2"
        style={{
          left: `calc(50% + ${offset}px - 8px)`,
          background: done ? "#FFF6DD" : locked ? "#F1F5F9" : "#fff",
          borderColor: done ? "#F3D58A" : "#E1E9F2",
        }}
        aria-hidden
      />
      <div
        className="rounded-3xl border-2 p-5 shadow-[0_18px_40px_-18px_rgba(16,33,58,0.35)]"
        style={{
          background: done ? "#FFF6DD" : locked ? "#F1F5F9" : "#fff",
          borderColor: done ? "#F3D58A" : "#E1E9F2",
        }}
      >
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="font-display text-xl font-semibold leading-tight text-ink">{level.title}</h3>
            <p className="mt-1 font-bold text-ink">{level.quest}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink-faint hover:bg-snow-deep hover:text-ink"
          >
            <X size={18} strokeWidth={3} />
          </button>
        </div>

        <p className="mt-2 text-[15px] font-semibold leading-snug text-ink-soft">{level.description}</p>

        <div className="mt-3 flex flex-wrap gap-2 text-[13px] font-extrabold">
          <span className="rounded-full px-2.5 py-1" style={{ background: year.soft, color: year.deep }}>
            Year {level.year}
          </span>
          <span className="rounded-full bg-gold-soft px-2.5 py-1 text-[#7A5200]">{level.rewardHint}</span>
          {cat && (
            <span className="rounded-full px-2.5 py-1" style={{ background: cat.soft, color: cat.color }}>
              {cat.label}
            </span>
          )}
        </div>

        {showProgress && (
          <div className="mt-4">
            <div className="flex justify-between text-[13px] font-extrabold text-ink-soft">
              <span>Progress</span>
              <span className="tabular-nums">
                {level.progress} / {level.target}
                {m.kind === "points" ? " pts" : ""}
              </span>
            </div>
            <div className="mt-1.5 h-3.5 overflow-hidden rounded-full bg-snow-deep">
              <div className="h-full rounded-full" style={{ width: `${pct}%`, background: year.color }} />
            </div>
          </div>
        )}

        {done ? (
          <div className="mt-4 rounded-2xl bg-white/70 px-4 py-3 text-sm font-bold text-ink">
            {level.completedBy.length > 0 ? (
              <>Cleared with <span className="text-[#7A5200]">{level.completedBy.map((i) => i.title).join(", ")}</span></>
            ) : (
              "Level cleared. Nice waddling!"
            )}
          </div>
        ) : (
          <div className="mt-4 flex items-start gap-2.5">
            <div className="-ml-1 shrink-0">
              <Pingu mood={locked ? "sleep" : "think"} size={42} scarf={year.color} scarfShade={year.shade} animate={false} />
            </div>
            <p className="rounded-2xl rounded-tl-md bg-snow px-3.5 py-2.5 text-sm font-bold leading-snug text-ink">
              {level.tip}
            </p>
          </div>
        )}

        {!done && !isAggregate && (
          <div className="mt-4 grid gap-2.5">
            {isConducted ? (
              <Link href={hostHref} className="btn-3d w-full" style={{ ["--btn-bg" as string]: year.deep, ["--btn-shade" as string]: year.shade }}>
                Start an event
              </Link>
            ) : (
              <Link href={eventsHref} className="btn-3d w-full" style={{ ["--btn-bg" as string]: year.deep, ["--btn-shade" as string]: year.shade }}>
                Find events
              </Link>
            )}
            <Link href={logHref} className="btn-3d btn-ghost w-full">
              I did this elsewhere
            </Link>
          </div>
        )}
        {!done && isAggregate && (
          <Link href={eventsHref} className="btn-3d mt-4 w-full" style={{ ["--btn-bg" as string]: year.deep, ["--btn-shade" as string]: year.shade }}>
            Find events
          </Link>
        )}
      </div>
    </motion.div>
    </div>
  );
}
