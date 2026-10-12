"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CountUp, staggerChild, staggerParent } from "@/lib/motion";
import { Medal } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import Pingu from "@/components/pingu/Pingu";
import { LEAGUES, leagueFor } from "@/lib/journey";

interface Entry {
  rank: number;
  name: string;
  department?: string | null;
  points: number;
  isMe: boolean;
}

interface Board {
  scope: "batch" | "department";
  batch: string | null;
  total: number;
  entries: Entry[];
  me: Entry | null;
}

const AVATAR = ["#1877C9", "#0B7268", "#6236C9", "#B35500", "#D43D6F", "#17803F"];
const PODIUM = ["#FFC23D", "#B8C4D3", "#E39A5B"];

export default function LeaderboardPage() {
  const { token } = useAuth();
  const [scope, setScope] = useState<"batch" | "department">("batch");
  const [board, setBoard] = useState<Board | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setBoard(null);
    setError(null);
    fetch(`/api/leaderboard?scope=${scope}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async (r) => {
        const body = await r.json();
        if (!r.ok) throw new Error(body?.detail || "Couldn't load the leaderboard");
        if (!cancelled) setBoard(body);
      })
      .catch((e) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, [token, scope]);

  const myPoints = board?.me?.points ?? 0;
  const { tier, next } = leagueFor(myPoints);

  return (
    <div className="mx-auto w-full max-w-[640px] px-4 pb-16 pt-8 sm:px-6 lg:pt-12">
      <header className="flex flex-col items-center text-center">
        <ol className="flex items-end gap-2 sm:gap-3" aria-label="Leagues">
          {LEAGUES.map((l) => {
            const reached = myPoints >= l.min;
            const isMine = l.name === tier.name;
            return (
              <li key={l.name} className="flex flex-col items-center" title={`${l.name}: ${l.min}+ pts`}>
                <motion.span
                  initial={{ opacity: 0, y: 12, scale: 0.6 }}
                  animate={isMine ? { opacity: 1, y: [0, -6, 0], scale: 1 } : { opacity: 1, y: 0, scale: 1 }}
                  transition={isMine
                    ? { opacity: { duration: 0.3 }, scale: { type: "spring", stiffness: 420, damping: 16 }, y: { duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.6 } }
                    : { type: "spring", stiffness: 420, damping: 18, delay: LEAGUES.indexOf(l) * 0.06 }}
                  className={`flex items-center justify-center rounded-2xl ${isMine ? "h-16 w-16" : "h-11 w-11"}`}
                  style={{ background: reached ? `${l.color}22` : "#E5ECF3", boxShadow: isMine ? `0 5px 0 ${l.color}66` : undefined }}
                >
                  <Medal size={isMine ? 34 : 22} strokeWidth={2.5} color={reached ? l.color : "#A3B1C2"} />
                </motion.span>
              </li>
            );
          })}
        </ol>
        <h1 className="mt-5 font-display text-[30px] font-semibold leading-tight text-ink">{tier.name} League</h1>
        <p className="mt-1 font-bold text-ink-soft">
          {next ? `Earn ${next.min - myPoints} more points to reach ${next.name}.` : "You're in the top league. Take a bow."}
        </p>
      </header>

      <div role="tablist" aria-label="Leaderboard scope" className="mx-auto mt-6 grid max-w-xs grid-cols-2 gap-1 rounded-2xl border-2 border-line bg-white p-1">
        {(["batch", "department"] as const).map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={scope === s}
            onClick={() => setScope(s)}
            className={`rounded-xl py-2 font-display text-[15px] font-semibold uppercase tracking-wide transition-colors ${
              scope === s ? "bg-glacier-soft text-glacier" : "text-ink-faint hover:text-ink-soft"
            }`}
          >
            {s === "batch" ? "My batch" : "Department"}
          </button>
        ))}
      </div>

      <section className="mt-6" aria-live="polite">
        {error ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Pingu mood="sad" size={90} />
            <p className="font-bold text-ink-soft">{error}</p>
          </div>
        ) : !board ? (
          <ul className="flex flex-col gap-2" aria-label="Loading">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="h-[68px] animate-pulse rounded-2xl bg-snow-deep" />
            ))}
          </ul>
        ) : board.entries.length <= 1 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <Pingu mood="think" size={100} />
            <p className="font-display text-xl font-semibold text-ink">It&apos;s quiet on the ice</p>
            <p className="max-w-xs font-bold text-ink-soft">Nobody else from your {scope === "batch" ? "batch" : "department"} is on SPARK yet. Invite your friends!</p>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm font-extrabold text-ink-soft">
              {board.scope === "batch" && board.batch ? `Batch of ${board.batch}` : "Your department"} · {board.total} students
            </p>
            <motion.ol variants={staggerParent} initial="hidden" animate="show" className="flex flex-col gap-1.5">
              {board.entries.map((e, i) => {
                const gap = i > 0 && e.rank > board.entries[i - 1].rank + 1 && e.isMe;
                return (
                  <motion.li variants={staggerChild} key={`${e.rank}-${e.name}-${i}`}>
                    {gap && <div className="my-2 text-center font-display text-ink-faint" aria-hidden>• • •</div>}
                    <div
                      className={`flex items-center gap-3 rounded-2xl border-2 px-3 py-2.5 sm:gap-4 sm:px-4 ${
                        e.isMe ? "border-glacier-bright bg-glacier-soft" : "border-transparent bg-white"
                      }`}
                    >
                      <span className="w-8 text-center font-display text-lg font-semibold tabular-nums text-ink-soft">
                        {e.rank <= 3 ? (
                          <Medal size={26} strokeWidth={2.6} color={PODIUM[e.rank - 1]} fill={`${PODIUM[e.rank - 1]}55`} className="mx-auto" aria-label={`Rank ${e.rank}`} />
                        ) : (
                          e.rank
                        )}
                      </span>
                      <span
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-lg font-semibold text-white"
                        style={{ background: AVATAR[e.name.charCodeAt(0) % AVATAR.length] }}
                        aria-hidden
                      >
                        {e.name.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[16px] font-extrabold text-ink">
                          {e.name}
                          {e.isMe && <span className="ml-2 text-sm text-glacier">(you)</span>}
                        </p>
                        {e.department && <p className="truncate text-[13px] font-bold text-ink-soft">{e.department}</p>}
                      </div>
                      <span className="font-display text-lg font-semibold tabular-nums text-ink">
                        <CountUp value={e.points} />
                        <span className="ml-1 text-sm text-ink-faint">pts</span>
                      </span>
                    </div>
                  </motion.li>
                );
              })}
            </motion.ol>
          </>
        )}
      </section>
    </div>
  );
}
