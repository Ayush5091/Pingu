"use client";
import React, { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import PageHeader from '@/components/PageHeader';
import Pingu from '@/components/pingu/Pingu';
import { PinguLoader } from '@/components/ClientLayout';
import { LEVEL_ICONS, categoryStyle } from '@/components/journey/icons';
import { LEVELS, YEARS, activityFitsLevel } from '@/lib/journey';

interface Activity {
    id: number;
    name: string;
    category: string;
    points: number;
}

function RequestActivityContent() {
    const { token } = useAuth();
    const router = useRouter();
    const params = useSearchParams();
    const level = LEVELS.find((l) => l.id === params.get('level')) ?? null;
    const year = level ? YEARS[level.year - 1] : null;

    const [activities, setActivities] = useState<Activity[]>([]);
    const [loadingList, setLoadingList] = useState(true);
    const [selectedActivity, setSelectedActivity] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (!token) return;
        fetch('/api/activities', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => res.json())
            .then(data => setActivities(Array.isArray(data) ? data : []))
            .catch(() => setError("Couldn't load the activity list"))
            .finally(() => setLoadingList(false));
    }, [token]);

    // Activities that would clear the level the student came from go first.
    const { fitting, others } = useMemo(() => {
        if (!level) return { fitting: [] as Activity[], others: activities };
        const fit = activities.filter((a) => activityFitsLevel(level, a.name, a.category));
        return { fitting: fit, others: activities.filter((a) => !fit.includes(a)) };
    }, [activities, level]);

    useEffect(() => {
        if (!selectedActivity && fitting.length > 0) setSelectedActivity(String(fitting[0].id));
    }, [fitting, selectedActivity]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await fetch('/api/activity-requests', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    activity_id: parseInt(selectedActivity),
                    description,
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Failed to submit request");
            setDone(true);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        return (
            <div className="mx-auto flex min-h-[80vh] w-full max-w-md flex-col items-center justify-center px-4 text-center">
                <Pingu mood="cheer" size={140} scarf={year?.color} scarfShade={year?.shade} />
                <h1 className="mt-2 font-display text-[28px] font-semibold text-ink">Request sent!</h1>
                <p className="mt-2 font-bold text-ink-soft">
                    Your coordinator will review it. Once it&apos;s approved, upload your certificate or photos to earn the points.
                </p>
                <div className="mt-6 grid w-full gap-3">
                    <Link href="/submissions-history" className="btn-3d w-full">See my activity log</Link>
                    <button type="button" onClick={() => router.push('/')} className="btn-3d btn-ghost w-full">Back to journey</button>
                </div>
            </div>
        );
    }

    const LevelIcon = level ? LEVEL_ICONS[level.icon] : null;
    const optionLabel = (a: Activity) => `${a.name} · ${categoryStyle(a.category).label} · ${a.points} pts`;

    return (
        <div className="mx-auto w-full max-w-xl px-4 pb-16 sm:px-6">
            <PageHeader
                back
                title="Log an activity"
                subtitle="Did something outside a SPARK event? Tell your coordinator what you did. Once approved, you'll upload proof."
            />

            {level && year && LevelIcon && (
                <div className="mb-6 flex items-center gap-4 rounded-3xl p-4" style={{ background: year.soft }}>
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full" style={{ background: year.color, boxShadow: `0 5px 0 ${year.shade}` }}>
                        <LevelIcon size={26} strokeWidth={2.6} color="#fff" />
                    </span>
                    <div className="min-w-0">
                        <p className="font-display text-lg font-semibold leading-tight text-ink">{level.title}</p>
                        <p className="text-sm font-bold text-ink-soft">{level.quest}</p>
                    </div>
                </div>
            )}

            <form className="panel flex flex-col gap-5 p-5 sm:p-6" onSubmit={handleSubmit}>
                <div>
                    <label className="field-label" htmlFor="activity">What did you do?</label>
                    <div className="relative">
                    <select
                        id="activity"
                        required
                        value={selectedActivity}
                        onChange={(e) => setSelectedActivity(e.target.value)}
                        className="field cursor-pointer appearance-none pr-11"
                        disabled={loadingList}
                    >
                        <option disabled value="">{loadingList ? "Loading activities..." : "Choose an activity"}</option>
                        {fitting.length > 0 && (
                            <optgroup label={`Clears ${level?.title}`}>
                                {fitting.map((a) => <option key={a.id} value={a.id}>{optionLabel(a)}</option>)}
                            </optgroup>
                        )}
                        <optgroup label={fitting.length > 0 ? "Other activities" : "All activities"}>
                            {others.map((a) => <option key={a.id} value={a.id}>{optionLabel(a)}</option>)}
                        </optgroup>
                    </select>
                    <ChevronDown size={20} strokeWidth={3} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-soft" />
                    </div>
                    {level && !loadingList && fitting.length === 0 && (
                        <p className="mt-2 text-sm font-bold text-ink-soft">
                            Nothing in the catalogue matches this level exactly. Pick the closest one and explain in the description.
                        </p>
                    )}
                </div>

                <div>
                    <label className="field-label" htmlFor="description">Tell us about it</label>
                    <textarea
                        id="description"
                        required
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        className="field resize-none"
                        placeholder="Where was it, what was your role, and who organised it?"
                        rows={4}
                    />
                </div>

                {error && (
                    <p role="alert" className="rounded-2xl bg-berry-soft px-4 py-3 text-sm font-bold text-berry-shade">{error}</p>
                )}

                <button disabled={loading || !selectedActivity} className="btn-3d w-full" type="submit">
                    {loading ? "Sending..." : "Send to coordinator"}
                </button>
            </form>
        </div>
    );
}

export default function RequestActivityScreen() {
    return (
        <Suspense fallback={<PinguLoader />}>
            <RequestActivityContent />
        </Suspense>
    );
}
