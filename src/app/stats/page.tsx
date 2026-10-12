"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Medal, Route, Zap } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import { CountUp, Fill, staggerChild, staggerParent } from "@/lib/motion";
import Pingu from "@/components/pingu/Pingu";
import PageHeader from "@/components/PageHeader";
import { PinguLoader } from "@/components/ClientLayout";
import { categoryStyle } from "@/components/journey/icons";
import { EventsCard, GoalCard, LeagueCard, QuestsCard, type RailEvent } from "@/components/journey/JourneyRail";
import type { JourneyResult } from "@/lib/journey";

interface JourneyResponse {
    student: { name: string; usn: string };
    pending: number;
    journey: JourneyResult;
}

export default function StatsPage() {
    const { token } = useAuth();
    const [data, setData] = useState<JourneyResponse | null>(null);
    const [events, setEvents] = useState<RailEvent[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        const headers = { Authorization: `Bearer ${token}` };
        fetch("/api/journey", { headers })
            .then(async (r) => {
                const body = await r.json();
                if (!r.ok) throw new Error(body?.detail || "Couldn't load your stats");
                setData(body);
            })
            .catch((e) => setError(e.message));
        fetch("/api/events", { headers })
            .then((r) => (r.ok ? r.json() : []))
            .then((list) => setEvents(Array.isArray(list) ? list : []))
            .catch(() => {});
    }, [token]);

    if (error) {
        return (
            <div className="flex min-h-[70vh] flex-col items-center justify-center gap-2 px-6 text-center">
                <Pingu mood="sad" size={100} />
                <p className="font-bold text-ink-soft">{error}</p>
            </div>
        );
    }
    if (!data) return <PinguLoader label="Crunching your numbers..." />;

    const { journey, pending } = data;
    const maxCat = Math.max(1, ...journey.categories.map((c) => c.points));

    return (
        <div className="mx-auto w-full max-w-[1100px] px-4 pb-16 sm:px-6 lg:px-8">
            <PageHeader
                title="Stats"
                subtitle={pending > 0 ? `${pending} ${pending === 1 ? "activity is" : "activities are"} still in review and not counted yet.` : "Everything you've earned on the way to 100 points."}
            />

            <motion.dl variants={staggerParent} initial="hidden" animate="show" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <Stat icon={<Flame size={28} strokeWidth={2.6} color="#F26B1D" fill="#FFB020" />} value={<CountUp value={journey.streakWeeks} />} label="Week streak" />
                <Stat icon={<Zap size={28} strokeWidth={2.6} color="#D99100" fill="#FFC23D" />} value={<CountUp value={journey.totalPoints} />} label="AICTE points" />
                <Stat icon={<Route size={28} strokeWidth={2.6} color="#1877C9" />} value={`${journey.completedLevels}/${journey.totalLevels}`} label="Levels cleared" />
                <Stat icon={<Medal size={28} strokeWidth={2.6} color={journey.league.tier.color} />} value={journey.league.tier.name} label="League" />
            </motion.dl>

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="flex min-w-0 flex-col gap-6">
                    <GoalCard journey={journey} />

                    {/* Journey by year */}
                    <section aria-labelledby="years">
                        <h2 id="years" className="font-display text-[22px] font-semibold text-ink">Journey</h2>
                        <ul className="panel mt-3 divide-y-2 divide-snow-deep px-5">
                            {journey.years.map((y) => (
                                <li key={y.year} className="flex items-center gap-4 py-4">
                                    <span className="w-28 shrink-0 font-display text-[15px] font-semibold leading-tight text-ink sm:w-36">
                                        <span style={{ color: y.unlocked ? y.deep : "#7A8AA2" }}>Year {y.year}</span>
                                        <span className="block text-ink-soft">{y.name}</span>
                                    </span>
                                    <div className="h-4 flex-1 overflow-hidden rounded-full bg-snow-deep">
                                        <Fill pct={(y.completed / y.total) * 100} className="h-full rounded-full" style={{ background: y.color }} />
                                    </div>
                                    <span className="w-12 text-right font-display text-[15px] font-semibold tabular-nums text-ink-soft">
                                        {y.completed}/{y.total}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </section>

                    {/* Points by category */}
                    <section aria-labelledby="cats">
                        <h2 id="cats" className="font-display text-[22px] font-semibold text-ink">Where your points come from</h2>
                        {journey.categories.length === 0 ? (
                            <div className="panel mt-3 flex items-center gap-4 p-5">
                                <Pingu mood="think" size={60} animate={false} />
                                <p className="font-bold text-ink-soft">No verified points yet. Clear your first level and this fills up.</p>
                            </div>
                        ) : (
                            <ul className="panel mt-3 flex flex-col gap-4 p-5">
                                {journey.categories.map((c) => {
                                    const s = categoryStyle(c.name);
                                    const Icon = s.icon;
                                    return (
                                        <li key={c.name} className="flex items-center gap-3">
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: s.soft }}>
                                                <Icon size={20} strokeWidth={2.6} color={s.color} />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex justify-between text-[15px] font-extrabold text-ink">
                                                    <span>{s.label}</span>
                                                    <span className="tabular-nums">
                                                        {c.points} pts
                                                        <span className="ml-2 font-bold text-ink-faint">{c.count} {c.count === 1 ? "activity" : "activities"}</span>
                                                    </span>
                                                </div>
                                                <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-snow-deep">
                                                    <Fill pct={(c.points / maxCat) * 100} className="h-full rounded-full" style={{ background: s.color }} />
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>
                </div>

                <div className="flex min-w-0 flex-col gap-6">
                    <QuestsCard journey={journey} />
                    <LeagueCard journey={journey} />
                    <EventsCard events={events} />
                </div>
            </div>
        </div>
    );
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
    return (
        <motion.div variants={staggerChild} className="panel flex items-center gap-3 px-4 py-4">
            <span className="shrink-0" aria-hidden>{icon}</span>
            <div className="flex min-w-0 flex-col-reverse">
                <dt className="truncate text-[13px] font-bold text-ink-soft">{label}</dt>
                <dd className="truncate font-display text-[22px] font-semibold leading-tight tabular-nums text-ink">{value}</dd>
            </div>
        </motion.div>
    );
}
