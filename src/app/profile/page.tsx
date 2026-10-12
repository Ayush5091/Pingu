"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { staggerChild, staggerParent } from "@/lib/motion";
import { useEffect, useState } from "react";
import { LogOut, Settings } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import Pingu from "@/components/pingu/Pingu";
import { PinguLoader } from "@/components/ClientLayout";
import { LEVEL_ICONS } from "@/components/journey/icons";
import { YEARS, type JourneyResult } from "@/lib/journey";

export default function ProfileScreen() {
    const { user, profile, profileLoading, isLoading, isInitializing } = useAuth();

    if (isLoading || isInitializing || !user || profileLoading) return <PinguLoader label="Loading profile..." />;
    if (user.role === "admin") return <AdminProfile name={profile?.name || user?.name} email={profile?.email} />;
    return <StudentProfile />;
}

function AdminProfile({ name, email }: { name?: string; email?: string }) {
    const { logout } = useAuth();
    return (
        <div className="mx-auto w-full max-w-lg px-4 pb-16 pt-10 sm:px-6">
            <div className="panel flex flex-col items-center p-8 text-center">
                <Pingu mood="happy" size={110} scarf="#6236C9" scarfShade="#4B26A6" />
                <h1 className="mt-3 font-display text-[28px] font-semibold text-ink">{name || "Coordinator"}</h1>
                <p className="mt-1 font-bold text-ink-soft">{email || "No email on file"}</p>
                <span className="mt-3 rounded-full bg-[#EFE8FE] px-3 py-1 text-sm font-extrabold text-[#6236C9]">Activity points coordinator</span>
            </div>
            <div className="mt-4 grid gap-3">
                <Link href="/settings" className="btn-3d btn-ghost w-full"><Settings size={18} strokeWidth={2.8} /> Settings</Link>
                <button type="button" onClick={logout} className="btn-3d btn-ghost w-full !text-berry-shade"><LogOut size={18} strokeWidth={2.8} /> Log out</button>
            </div>
        </div>
    );
}

interface JourneyResponse {
    student: { name: string; usn: string; department?: string; semester?: number | null };
    journey: JourneyResult;
}

function StudentProfile() {
    const { token, profile, logout } = useAuth();
    const [data, setData] = useState<JourneyResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        fetch("/api/journey", { headers: { Authorization: `Bearer ${token}` } })
            .then(async (r) => {
                const body = await r.json();
                if (!r.ok) throw new Error(body?.detail || "Couldn't load your profile");
                setData(body);
            })
            .catch((e) => setError(e.message));
    }, [token]);

    if (error) {
        return (
            <div className="flex min-h-[70vh] flex-col items-center justify-center gap-2 px-6 text-center">
                <Pingu mood="sad" size={100} />
                <p className="font-bold text-ink-soft">{error}</p>
            </div>
        );
    }
    if (!data) return <PinguLoader label="Loading profile..." />;

    const { journey, student } = data;
    const year = YEARS[journey.currentYear - 1];
    const earned = journey.badges.filter((b) => b.earned).length;

    return (
        <div className="mx-auto w-full max-w-[720px] px-4 pb-16 pt-6 sm:px-6 lg:pt-10">
            {/* Identity */}
            <section className="relative overflow-hidden rounded-[32px] px-6 pb-6 pt-6 text-white sm:px-8" style={{ background: year.deep }}>
                <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-16 w-full" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden>
                    <path d="M0 40 C80 20 160 50 240 32 C310 18 360 40 400 30 L400 60 L0 60Z" fill="#fff" opacity="0.12" />
                </svg>
                <div className="relative flex items-center gap-5">
                    <div className="shrink-0 rounded-[28px] bg-white/15 p-2">
                        <Pingu interactive mood="happy" size={80} scarf={year.color} scarfShade={year.shade} cap={journey.totalPoints >= journey.goal} />
                    </div>
                    <div className="min-w-0 flex-1 pr-10">
                        <h1 className="truncate font-display text-[26px] font-semibold leading-tight sm:text-[28px]">{student.name}</h1>
                        <p className="mt-0.5 truncate font-bold text-white/85">
                            {student.usn}
                            {student.department ? ` · ${student.department}` : ""}
                        </p>
                        <p className="mt-2 inline-flex max-w-full whitespace-nowrap rounded-full bg-white/20 px-3 py-1 text-[13px] font-extrabold sm:text-sm">
                            Year {year.year} · {year.name}
                            {student.semester ? ` · Sem ${student.semester}` : ""}
                        </p>
                    </div>
                    <Link href="/settings" aria-label="Settings" className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 hover:bg-white/25">
                        <Settings size={20} strokeWidth={2.6} />
                    </Link>
                </div>
            </section>

            {/* Achievements */}
            <section className="mt-8" aria-labelledby="badges">
                <div className="flex items-baseline justify-between">
                    <h2 id="badges" className="font-display text-[22px] font-semibold text-ink">Achievements</h2>
                    <span className="text-sm font-extrabold text-ink-soft">{earned} of {journey.badges.length}</span>
                </div>
                <motion.ul variants={staggerParent} initial="hidden" whileInView="show" viewport={{ once: true, margin: "0px 0px -10% 0px" }} className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {journey.badges.map((b) => {
                        const Icon = LEVEL_ICONS[b.icon];
                        return (
                            <motion.li
                                variants={staggerChild}
                                whileHover={b.earned ? { rotate: [0, -4, 4, -2, 0], y: -4, transition: { duration: 0.5 } } : { y: -2 }}
                                key={b.id}
                                className={`flex flex-col items-center rounded-3xl border-2 px-3 pb-4 pt-5 text-center ${b.earned ? "border-[#F3D58A] bg-gold-soft" : "border-line bg-white"}`}
                            >
                                <span
                                    className="flex h-14 w-14 items-center justify-center rounded-full"
                                    style={{ background: b.earned ? "#FFC23D" : "#E5ECF3", boxShadow: `0 5px 0 ${b.earned ? "#DB9A00" : "#C9D5E3"}` }}
                                >
                                    <Icon size={26} strokeWidth={2.6} color={b.earned ? "#fff" : "#93A3B8"} />
                                </span>
                                <span className={`mt-3 font-display text-[15px] font-semibold leading-tight ${b.earned ? "text-ink" : "text-ink-soft"}`}>{b.title}</span>
                                <span className="mt-1 text-[13px] font-bold leading-snug text-ink-soft">{b.description}</span>
                            </motion.li>
                        );
                    })}
                </motion.ul>
            </section>

            {/* Account */}
            <section className="mt-8" aria-labelledby="account">
                <h2 id="account" className="font-display text-[22px] font-semibold text-ink">Account</h2>
                <dl className="panel mt-3 divide-y-2 divide-snow-deep px-5">
                    <Row label="Email" value={profile?.email || "Not set"} />
                    <Row label="Phone" value={profile?.phone_number || "Not set"} />
                    <Row label="Department" value={student.department || "Not set"} />
                </dl>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <Link href="/settings" className="btn-3d btn-ghost w-full"><Settings size={18} strokeWidth={2.8} /> Edit details</Link>
                    <button type="button" onClick={logout} className="btn-3d btn-ghost w-full !text-berry-shade"><LogOut size={18} strokeWidth={2.8} /> Log out</button>
                </div>
            </section>
        </div>
    );
}

function Row({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-center justify-between gap-4 py-3.5">
            <dt className="font-bold text-ink-soft">{label}</dt>
            <dd className="truncate text-right font-extrabold text-ink">{value}</dd>
        </div>
    );
}
