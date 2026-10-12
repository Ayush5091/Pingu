"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BarChart3, Hourglass, Lock } from "lucide-react";
import { YEARS, type JourneyResult, type LevelProgress } from "@/lib/journey";
import { Fill } from "@/lib/motion";
import Pingu from "@/components/pingu/Pingu";
import PinguBuddy from "@/components/pingu/PinguBuddy";
import { staggerChild, staggerParent } from "@/lib/motion";
import JourneyPath from "./JourneyPath";
import Celebration from "./Celebration";
import { EventsCard, GoalCard, LeagueCard, QuestsCard, StatChips, type RailEvent, type RailNotification } from "./JourneyRail";

export interface JourneyViewProps {
  student: { name: string; usn?: string; semester?: number | null };
  journey: JourneyResult;
  pending: number;
  events: RailEvent[];
  notifications?: RailNotification[];
  onOpenNotifications?: () => void;
  demo?: boolean;
}

const SEEN_KEY = "spark.seenLevels.v1";

export default function JourneyView({ student, journey, pending, events, notifications, onOpenNotifications, demo }: JourneyViewProps) {
  const year = YEARS[journey.currentYear - 1];
  const firstName = (student.name || "there").split(" ")[0];
  const [celebrate, setCelebrate] = useState<LevelProgress[]>([]);

  // Celebrate levels cleared since the last visit. The first visit only records
  // what's already done, so nobody gets 12 confetti showers at once.
  useEffect(() => {
    if (demo) return;
    const done = journey.years.flatMap((y) => y.levels).filter((l) => l.state === "completed");
    const key = `${SEEN_KEY}:${student.usn ?? "me"}`;
    try {
      const raw = localStorage.getItem(key);
      const seen: string[] | null = raw ? JSON.parse(raw) : null;
      if (seen) {
        const fresh = done.filter((l) => !seen.includes(l.id));
        if (fresh.length) setCelebrate(fresh);
      }
      localStorage.setItem(key, JSON.stringify(done.map((l) => l.id)));
    } catch {
      /* storage unavailable: skip celebrations */
    }
  }, [journey, student.usn, demo]);

  const closeCelebration = useCallback(() => setCelebrate([]), []);

  const current = journey.years.flatMap((y) => y.levels).find((l) => l.id === journey.currentLevelId);

  const rail = [
    <GoalCard key="goal" journey={journey} />,
    <LeagueCard key="league" journey={journey} demo={demo} />,
    <QuestsCard key="quests" journey={journey} />,
    <EventsCard key="events" events={events} demo={demo} />,
  ].map((card) => (
    <motion.div key={card.key} variants={staggerChild}>
      {card}
    </motion.div>
  ));

  return (
    <div className="mx-auto flex w-full max-w-[1100px] gap-10 px-4 sm:px-6 lg:px-8 xl:max-w-[1260px] xl:gap-12">
      <div className="min-w-0 flex-1">
        {/* Mobile HUD */}
        <div className="sticky top-0 z-20 -mx-4 border-b-2 border-line bg-snow/95 px-3 py-3 backdrop-blur-sm sm:-mx-6 sm:px-5 lg:hidden">
          <StatChips journey={journey} year={year} notifications={notifications} onOpenNotifications={onOpenNotifications} />
        </div>

        <DashboardGreeting
          firstName={firstName}
          journey={journey}
          current={current}
          pending={pending}
          demo={demo}
        />

        <YearStrip journey={journey} />

        <div className="mx-auto max-w-[560px] pt-4 lg:max-w-[680px] lg:pt-6">
          <JourneyPath years={journey.years} currentLevelId={journey.currentLevelId} currentYear={journey.currentYear} demo={demo} />

          <div className="flex flex-col items-center pb-10 pt-2 text-center">
            <PinguBuddy
              mood="happy"
              size={110}
              scarf="#FF8A00"
              scarfShade="#D16F00"
              cap
              lines={["See you at graduation!", "I already bought the cap.", "100 points. You can do it.", "Wait, did you check today's events?"]}
            />
            <Link
              href={demo ? "/login" : "/stats"}
              className="btn-3d btn-ghost mt-6 lg:hidden"
            >
              <BarChart3 size={18} strokeWidth={2.8} /> See your stats
            </Link>
          </div>

        </div>
      </div>

      <motion.aside
        className="sticky top-0 hidden h-screen w-[340px] shrink-0 xl:w-[360px] flex-col gap-4 overflow-y-auto py-8 lg:flex no-scrollbar"
        variants={staggerParent}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={staggerChild}>
          <StatChips journey={journey} year={year} notifications={notifications} onOpenNotifications={onOpenNotifications} />
        </motion.div>
        {rail}
      </motion.aside>

      <Celebration levels={celebrate} year={year} onClose={closeCelebration} />
    </div>
  );
}

// Pingu greets the student and talks through where they stand. Tapping Pingu
// (or the bubble) moves on to the next thing Pingu wants to say.
function DashboardGreeting({
  firstName, journey, current, pending, demo,
}: {
  firstName: string;
  journey: JourneyResult;
  current?: LevelProgress;
  pending: number;
  demo?: boolean;
}) {
  const reduce = useReducedMotion();
  const year = YEARS[journey.currentYear - 1];
  const [i, setI] = useState(0);

  const lines = useMemo(() => {
    const out: string[] = [];
    out.push(current ? `Next up: ${current.title}. ${current.quest}.` : "Every level you can reach is cleared. You're a legend!");
    out.push(
      journey.streakWeeks > 0
        ? `You're on a ${journey.streakWeeks}-week streak. Don't let it melt!`
        : "Log one activity this week to start a streak."
    );
    const left = journey.goal - journey.totalPoints;
    out.push(left > 0 ? `${left} points to the summit. We've got this.` : "100 points! You've met the AICTE requirement.");
    const next = journey.league.next;
    if (next) out.push(`${next.min - journey.totalPoints} more points and we're in ${next.name} League.`);
    if (pending > 0) out.push(`${pending} ${pending === 1 ? "activity is" : "activities are"} waiting for review. Fingers crossed!`);
    return out;
  }, [current, journey, pending]);

  const next = () => setI((n) => n + 1);

  return (
    <header className="mx-auto flex max-w-[560px] items-end lg:max-w-[680px] gap-2 pb-2 pt-6 sm:gap-3 lg:pt-10">
      <div className="-mb-1 shrink-0">
        <Pingu
          mood="wave"
          size={92}
          scarf={year.color}
          scarfShade={year.shade}
          interactive
          onPoke={next}
          title="Pingu"
        />
      </div>
      <div className="relative mb-6 min-w-0 flex-1">
        <button
          type="button"
          onClick={next}
          className="block w-full rounded-3xl border-2 border-line bg-white px-4 py-3.5 text-left transition-colors hover:border-line-strong focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-beak sm:px-5"
          aria-label="Hear what Pingu says next"
        >
          <h1 className="font-display text-[22px] font-semibold leading-tight text-ink sm:text-[26px]">
            Hey {firstName}, keep waddling!
          </h1>
          <div className="relative mt-1 min-h-[2.75rem] overflow-hidden sm:min-h-[1.5rem]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={i}
                initial={reduce ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                className="text-[15px] font-bold leading-snug text-ink-soft"
                aria-live="polite"
              >
                {lines[i % lines.length]}
              </motion.p>
            </AnimatePresence>
          </div>
        </button>
        <span className="absolute -left-[7px] bottom-5 h-3.5 w-3.5 rotate-45 border-b-2 border-l-2 border-line bg-white" aria-hidden />
        {pending > 0 && (
          <Link
            href={demo ? "/login" : "/submissions-history"}
            className="absolute -bottom-6 left-3 inline-flex translate-y-1/2 items-center gap-1.5 rounded-full bg-beak-soft px-3 py-1 text-[13px] font-extrabold text-[#8A4B00] hover:bg-[#FFE6C2]"
          >
            <Hourglass size={13} strokeWidth={3} />
            {pending} in review
          </Link>
        )}
      </div>
    </header>
  );
}

// Desktop overview of all four years. Each tile jumps to that stretch of the path.
function YearStrip({ journey }: { journey: JourneyResult }) {
  const jump = (n: number) =>
    document.getElementById(`year-${n}`)?.closest("section")?.scrollIntoView({ behavior: "smooth", block: "start" });

  return (
    <nav aria-label="Years" className="mx-auto mt-8 hidden max-w-[680px] grid-cols-4 gap-3 lg:grid">
      {journey.years.map((y) => {
        const current = y.year === journey.currentYear;
        return (
          <button
            key={y.year}
            type="button"
            onClick={() => jump(y.year)}
            aria-current={current ? "step" : undefined}
            className="group rounded-2xl border-2 bg-white px-3.5 pb-3 pt-2.5 text-left transition-[transform,border-color] duration-200 hover:-translate-y-0.5"
            style={{ borderColor: current ? y.color : "#E1E9F2" }}
          >
            <span className="flex items-center justify-between font-display text-[13px] font-semibold uppercase tracking-wide" style={{ color: y.unlocked ? y.deep : "#7A8AA2" }}>
              Year {y.year}
              {!y.unlocked && <Lock size={13} strokeWidth={3} />}
            </span>
            <span className="mt-0.5 block truncate font-display text-[15px] font-semibold text-ink">{y.name}</span>
            <span className="mt-2 flex items-center gap-2">
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-snow-deep">
                <Fill pct={(y.completed / y.total) * 100} className="h-full rounded-full" style={{ background: y.unlocked ? y.color : "#C9D5E3" }} />
              </span>
              <span className="text-xs font-extrabold tabular-nums text-ink-soft">{y.completed}/{y.total}</span>
            </span>
          </button>
        );
      })}
    </nav>
  );
}
