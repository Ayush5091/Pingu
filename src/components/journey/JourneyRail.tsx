"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, ChevronRight, Flag, Flame, MapPin, Medal, Star, Zap } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { CountUp, Fill } from "@/lib/motion";
import type { JourneyResult, YearDef } from "@/lib/journey";
import { categoryStyle } from "./icons";

export interface RailEvent {
  id: number;
  name: string;
  category: string;
  points: number;
  location_name: string;
  start_time: string;
  end_time: string;
  is_ongoing: boolean;
  is_upcoming: boolean;
  is_past?: boolean;
}

export interface RailNotification {
  id: number;
  message: string;
  is_read: boolean;
  created_at: string;
}

export function StatChips({
  journey, year, notifications, onOpenNotifications,
}: {
  journey: JourneyResult;
  year: YearDef;
  notifications?: RailNotification[];
  onOpenNotifications?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const unread = notifications?.filter((n) => !n.is_read).length ?? 0;
  const { tier } = journey.league;

  return (
    <div className="relative flex items-center justify-between gap-1">
      <span
        className="flex h-10 items-center rounded-xl px-2.5 font-display text-[15px] font-semibold"
        style={{ background: year.soft, color: year.deep }}
        title={`Year ${year.year} · ${year.name}`}
      >
        Y{year.year}
      </span>
      <Chip title={`${journey.streakWeeks}-week streak`} color={journey.streakWeeks > 0 ? "#F26B1D" : "#93A3B8"}>
        <motion.span
          className="inline-flex"
          style={{ originY: 1 }}
          animate={journey.streakWeeks > 0 && !reduce ? { scaleY: [1, 1.12, 0.96, 1.08, 1], rotate: [0, -4, 3, -2, 0] } : {}}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Flame size={22} strokeWidth={2.6} fill={journey.streakWeeks > 0 ? "#FFB020" : "none"} />
        </motion.span>
        <CountUp value={journey.streakWeeks} />
      </Chip>
      <Chip title={`${journey.totalPoints} AICTE activity points`} color="#D99100">
        <Zap size={22} strokeWidth={2.6} fill="#FFC23D" />
        <CountUp value={journey.totalPoints} />
      </Chip>
      <Chip title={`${tier.name} league`} color={tier.color}>
        <Medal size={22} strokeWidth={2.6} />
        <span className="hidden sm:inline lg:hidden xl:inline">{tier.name}</span>
      </Chip>
      {notifications && (
        <>
          <button
            type="button"
            onClick={() => {
              setOpen((o) => !o);
              if (!open) onOpenNotifications?.();
            }}
            aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-ink-soft hover:bg-snow-deep"
          >
            <motion.span
              className="inline-flex"
              style={{ originY: 0 }}
              animate={unread > 0 && !reduce ? { rotate: [0, 16, -14, 10, -6, 0] } : {}}
              transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 3.2 }}
            >
              <Bell size={22} strokeWidth={2.6} />
            </motion.span>
            {unread > 0 && <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-berry" />}
          </button>
          {open && (
            <>
              <button aria-label="Close notifications" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)} />
              <motion.div
                initial={reduce ? false : { opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 30 }}
                style={{ originX: 1, originY: 0 }}
                className="absolute right-0 top-12 z-50 max-h-96 w-[min(320px,calc(100vw-32px))] overflow-y-auto rounded-3xl border-2 border-line bg-white p-2 shadow-[0_18px_40px_-18px_rgba(16,33,58,0.35)]"
              >
                <h3 className="px-3 pb-1 pt-2 font-display text-lg font-semibold text-ink">Notifications</h3>
                {notifications.length === 0 ? (
                  <p className="px-3 pb-3 text-sm font-bold text-ink-soft">Nothing yet. Pingu will shout when something happens.</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={`rounded-2xl px-3 py-2.5 ${n.is_read ? "" : "bg-glacier-soft"}`}>
                      <p className="text-sm font-bold leading-snug text-ink">{n.message}</p>
                      <p className="mt-1 text-xs font-bold text-ink-faint">
                        {new Date(n.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                  ))
                )}
              </motion.div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function Chip({ children, color, title }: { children: React.ReactNode; color: string; title: string }) {
  return (
    <span title={title} className="flex h-10 items-center gap-1.5 rounded-xl px-2 font-display text-[17px] font-semibold tabular-nums" style={{ color }}>
      <span className="sr-only">{title}</span>
      <span aria-hidden className="flex items-center gap-1.5">{children}</span>
    </span>
  );
}

export function GoalCard({ journey }: { journey: JourneyResult }) {
  const pct = Math.min(100, Math.round((journey.totalPoints / journey.goal) * 100));
  const yearTarget = journey.currentYear * 25;
  const need = Math.max(0, yearTarget - journey.totalPoints);
  return (
    <section className="panel p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">AICTE points</h2>
        <span className="font-display text-lg font-semibold tabular-nums text-ink">
          <CountUp value={journey.totalPoints} />
          <span className="text-ink-faint"> / {journey.goal}</span>
        </span>
      </div>
      <div className="relative mt-3 h-4 overflow-hidden rounded-full bg-snow-deep">
        <Fill pct={pct} className="h-full rounded-full bg-gold" />
        {[25, 50, 75].map((m) => (
          <span key={m} className="absolute top-0 h-full w-[2px] bg-white" style={{ left: `${m}%` }} aria-hidden />
        ))}
      </div>
      <p className="mt-3 text-sm font-bold text-ink-soft">
        {journey.totalPoints >= journey.goal
          ? "Requirement complete. You reached the summit!"
          : need === 0
            ? `Ahead of pace for Year ${journey.currentYear}. Keep it up!`
            : `${need} more to stay on pace for the end of Year ${journey.currentYear}.`}
      </p>
    </section>
  );
}

export function LeagueCard({ journey, demo }: { journey: JourneyResult; demo?: boolean }) {
  const { tier, next } = journey.league;
  return (
    <Link href={demo ? "/login" : "/leaderboard"} className="panel group flex items-center gap-4 p-5 transition-colors hover:border-line-strong">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-110" style={{ background: `${tier.color}1F` }}>
        <Medal size={30} strokeWidth={2.5} color={tier.color} />
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="font-display text-lg font-semibold text-ink">{tier.name} League</h2>
        <p className="text-sm font-bold text-ink-soft">
          {next ? `${next.min - journey.totalPoints} pts to ${next.name}` : "Top league. Legendary penguin."}
        </p>
      </div>
      <ChevronRight size={22} strokeWidth={3} className="text-ink-faint transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

const QUEST_ICONS = { zap: Zap, flag: Flag, star: Star };

export function QuestsCard({ journey }: { journey: JourneyResult }) {
  return (
    <section className="panel p-5">
      <h2 className="font-display text-lg font-semibold text-ink">Quests</h2>
      <ul className="mt-3 flex flex-col gap-4">
        {journey.weeklyQuests.map((q) => {
          const Icon = QUEST_ICONS[q.icon];
          const done = q.progress >= q.target;
          return (
            <li key={q.id} className="flex items-center gap-3">
              <Icon size={28} strokeWidth={2.5} color={done ? "#DB9A00" : "#1877C9"} fill={done ? "#FFC23D" : "none"} />
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-extrabold text-ink">{q.title}</p>
                <div className="relative mt-1.5 h-4 overflow-hidden rounded-full bg-snow-deep">
                  <Fill pct={(q.progress / q.target) * 100} className={`h-full rounded-full ${done ? "bg-gold" : "bg-glacier-bright"}`} />
                  <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black tabular-nums text-ink">
                    {q.progress} / {q.target}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

const fmt = (v: string) =>
  new Date(v).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

export function EventsCard({ events, demo }: { events: RailEvent[]; demo?: boolean }) {
  const list = events.filter((e) => !e.is_past).sort((a, b) => Number(b.is_ongoing) - Number(a.is_ongoing)).slice(0, 4);
  return (
    <section className="panel p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">Happening on campus</h2>
        <Link href={demo ? "/login" : "/events"} className="text-sm font-extrabold uppercase tracking-wide text-glacier hover:text-glacier-shade">
          All
        </Link>
      </div>
      {list.length === 0 ? (
        <p className="mt-2 text-sm font-bold text-ink-soft">No live events right now. You can start your own from Events.</p>
      ) : (
        <ul className="mt-3 flex flex-col divide-y-2 divide-snow-deep">
          {list.map((e) => {
            const c = categoryStyle(e.category);
            const Icon = c.icon;
            return (
              <li key={e.id} className="flex items-center gap-3 py-3 first:pt-1 last:pb-0">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl" style={{ background: c.soft }}>
                  <Icon size={22} strokeWidth={2.5} color={c.color} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-extrabold text-ink">{e.name}</p>
                  <p className="flex items-center gap-1 truncate text-[13px] font-bold text-ink-soft">
                    {e.is_ongoing ? <span className="text-moss-shade">Live now</span> : fmt(e.start_time)}
                    <span aria-hidden>·</span>
                    <MapPin size={12} strokeWidth={3} className="shrink-0" />
                    <span className="truncate">{e.location_name}</span>
                  </p>
                </div>
                {e.is_ongoing ? (
                  <Link href={demo ? "/login" : `/events/${e.id}/camera`} className="btn-3d btn-moss !min-h-[2.5rem] !px-3 !text-[13px]">
                    Check in
                  </Link>
                ) : (
                  <span className="rounded-full bg-gold-soft px-2.5 py-1 text-[13px] font-black text-[#7A5200]">+{e.points}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
