"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { motion } from "framer-motion";
import { staggerChild, staggerParent } from "@/lib/motion";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, ExternalLink, MapPin } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import PageHeader from '@/components/PageHeader';
import Pingu from '@/components/pingu/Pingu';
import { categoryStyle } from '@/components/journey/icons';

type Stage = 'request_pending' | 'needs_proof' | 'proof_pending' | 'event_pending' | 'earned' | 'rejected';

interface LogItem {
    key: string;
    kind: 'activity' | 'event';
    title: string;
    category: string;
    points: number;
    date: string;
    stage: Stage;
    requestId?: number;
    description?: string;
    proof?: string;
    hours?: number | null;
    location?: string;
    notes?: string | null;
}

const STAGE: Record<Stage, { label: string; bg: string; fg: string }> = {
    request_pending: { label: 'Waiting for approval', bg: '#FFF1DC', fg: '#8A4B00' },
    needs_proof: { label: 'Approved · upload proof', bg: '#E3F1FD', fg: '#0F5A9C' },
    proof_pending: { label: 'Proof in review', bg: '#FFF1DC', fg: '#8A4B00' },
    event_pending: { label: 'Check-in in review', bg: '#FFF1DC', fg: '#8A4B00' },
    earned: { label: 'Points earned', bg: '#E2F6EA', fg: '#17803F' },
    rejected: { label: 'Not approved', bg: '#FDE8E8', fg: '#B9282D' },
};

export default function SubmissionsHistoryScreen() {
    const { token, user } = useAuth();
    const router = useRouter();
    const [tab, setTab] = useState<'active' | 'done'>('active');
    const [items, setItems] = useState<LogItem[] | null>(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user?.role === 'admin') {
            router.replace('/');
            return;
        }
        if (!token) return;

        const headers = { 'Authorization': `Bearer ${token}` };
        Promise.all([
            fetch('/api/activity-requests/me', { headers }).then(r => r.json()),
            fetch('/api/submissions/me', { headers }).then(r => r.json()),
            fetch('/api/event-submissions', { headers }).then(r => r.json()),
        ])
            .then(([requests, submissions, eventSubs]) => {
                const subByRequest = new Map<number, any>();
                (Array.isArray(submissions) ? submissions : []).forEach((s: any) => subByRequest.set(s.request_id, s));

                const list: LogItem[] = [];
                (Array.isArray(requests) ? requests : []).forEach((r: any) => {
                    const sub = subByRequest.get(r.request_id);
                    let stage: Stage;
                    if (sub) {
                        stage = sub.status === 'approved' || sub.status === 'verified' ? 'earned' : sub.status === 'rejected' ? 'rejected' : 'proof_pending';
                    } else {
                        stage = r.status === 'approved' ? 'needs_proof' : r.status === 'rejected' ? 'rejected' : 'request_pending';
                    }
                    list.push({
                        key: `a-${r.request_id}`,
                        kind: 'activity',
                        title: r.activity,
                        category: r.category,
                        points: Number(r.points) || 0,
                        date: sub?.activity_date || sub?.submitted_at || r.requested_at,
                        stage,
                        requestId: r.request_id,
                        description: sub?.description || r.description,
                        proof: sub?.proof,
                        hours: sub?.hours_spent,
                    });
                });
                (Array.isArray(eventSubs) ? eventSubs : []).forEach((e: any) => {
                    list.push({
                        key: `e-${e.id}`,
                        kind: 'event',
                        title: e.event_name,
                        category: e.category,
                        points: Number(e.points_awarded ?? e.event_points) || 0,
                        date: e.submitted_at,
                        stage: e.status === 'verified' ? 'earned' : e.status === 'rejected' ? 'rejected' : 'event_pending',
                        location: e.location_name,
                        notes: e.review_notes,
                    });
                });
                list.sort((a, b) => +new Date(b.date) - +new Date(a.date));
                setItems(list);
            })
            .catch(() => {
                setItems([]);
                setError("Couldn't load your activity log");
            });
    }, [token, user, router]);

    const { active, done } = useMemo(() => {
        const all = items ?? [];
        return {
            active: all.filter((i) => i.stage !== 'earned' && i.stage !== 'rejected'),
            done: all.filter((i) => i.stage === 'earned' || i.stage === 'rejected'),
        };
    }, [items]);

    if (user?.role === 'admin') return null;

    const list = tab === 'active' ? active : done;
    const earnedPoints = done.filter((i) => i.stage === 'earned').reduce((s, i) => s + i.points, 0);

    return (
        <div className="mx-auto w-full max-w-[720px] px-4 pb-16 sm:px-6">
            <PageHeader
                title="Activity log"
                subtitle={items ? `${earnedPoints} points earned so far. Everything you've logged, checked in to or are waiting on.` : 'Everything you have logged, checked in to or are waiting on.'}
                action={<Link href="/request-activity" className="btn-3d !min-h-[2.75rem] !px-4 !text-[14px]">Log activity</Link>}
            />

            <div role="tablist" aria-label="Filter" className="grid max-w-sm grid-cols-2 gap-1 rounded-2xl border-2 border-line bg-white p-1">
                {([['active', `In progress · ${active.length}`], ['done', `Finished · ${done.length}`]] as const).map(([key, label]) => (
                    <button
                        key={key}
                        type="button"
                        role="tab"
                        aria-selected={tab === key}
                        onClick={() => setTab(key)}
                        className={`rounded-xl py-2 font-display text-[15px] font-semibold tracking-wide transition-colors ${tab === key ? 'bg-glacier-soft text-glacier' : 'text-ink-faint hover:text-ink-soft'}`}
                    >
                        {items ? label : key === 'active' ? 'In progress' : 'Finished'}
                    </button>
                ))}
            </div>

            <section className="mt-5" aria-live="polite">
                {items === null ? (
                    <ul className="flex flex-col gap-2.5">
                        {Array.from({ length: 4 }).map((_, i) => <li key={i} className="h-[76px] animate-pulse rounded-3xl bg-snow-deep" />)}
                    </ul>
                ) : error ? (
                    <Empty mood="sad" title="Pingu slipped on the ice" body={`${error}. Refresh the page to try again.`} />
                ) : list.length === 0 ? (
                    tab === 'active'
                        ? <Empty mood="sleep" title="Nothing in progress" body="Check in at an event or log something you did, and it shows up here while it's reviewed." cta />
                        : <Empty mood="think" title="No finished activities yet" body="Verified activities land here, and each one lights up a level on your path." cta />
                ) : (
                    <motion.ul key={tab} className="flex flex-col gap-2.5" variants={staggerParent} initial="hidden" animate="show">
                        {list.map((item) => <LogRow key={item.key} item={item} />)}
                    </motion.ul>
                )}
            </section>
        </div>
    );
}

function LogRow({ item }: { item: LogItem }) {
    const c = categoryStyle(item.category);
    const Icon = c.icon;
    const s = STAGE[item.stage];
    const hasDetails = item.description || item.proof || item.location || item.notes || item.hours;

    return (
        <motion.li variants={staggerChild} className="panel overflow-hidden">
            <details className="group">
                <summary className={`flex list-none items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-5 [&::-webkit-details-marker]:hidden ${hasDetails ? 'cursor-pointer' : 'pointer-events-none'}`}>
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: c.soft }}>
                        <Icon size={24} strokeWidth={2.5} color={c.color} />
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-[16px] font-extrabold leading-snug text-ink">{item.title}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-bold text-ink-soft">
                            <span className="rounded-full px-2 py-0.5 font-extrabold" style={{ background: s.bg, color: s.fg }}>{s.label}</span>
                            <span>{new Date(item.date).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                            <span>{item.kind === 'event' ? 'Event check-in' : 'Logged activity'}</span>
                        </p>
                    </div>
                    <span className={`font-display text-lg font-semibold tabular-nums ${item.stage === 'earned' ? 'text-[#B37A00]' : 'text-ink-faint'}`}>
                        +{item.points}
                    </span>
                    {hasDetails && <ChevronDown size={20} strokeWidth={3} className="shrink-0 text-ink-faint transition-transform group-open:rotate-180" aria-hidden />}
                </summary>
                {hasDetails && (
                    <div className="border-t-2 border-snow-deep px-5 py-4 text-[15px] font-semibold text-ink-soft">
                        {item.description && <p className="whitespace-pre-line">{item.description}</p>}
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-bold">
                            {item.location && <span className="flex items-center gap-1"><MapPin size={14} strokeWidth={3} />{item.location}</span>}
                            {item.hours ? <span>{item.hours} hours</span> : null}
                            {item.proof && (
                                <a href={item.proof} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-glacier hover:text-glacier-shade">
                                    View proof <ExternalLink size={14} strokeWidth={3} />
                                </a>
                            )}
                        </div>
                        {item.notes && <p className="mt-2 rounded-2xl bg-snow px-3 py-2 text-sm font-bold">Coordinator note: {item.notes}</p>}
                    </div>
                )}
            </details>
            {item.stage === 'needs_proof' && (
                <div className="flex items-center justify-between gap-3 border-t-2 border-snow-deep bg-glacier-soft/60 px-5 py-3">
                    <p className="text-sm font-bold text-[#0F5A9C]">Approved! Upload your proof to claim the points.</p>
                    <Link href={`/submit-proof?request=${item.requestId}`} className="btn-3d !min-h-[2.5rem] shrink-0 !px-4 !text-[13px]">Upload proof</Link>
                </div>
            )}
        </motion.li>
    );
}

function Empty({ mood, title, body, cta }: { mood: 'sleep' | 'think' | 'sad'; title: string; body: string; cta?: boolean }) {
    return (
        <div className="panel flex flex-col items-center px-6 py-10 text-center">
            <Pingu mood={mood} size={100} />
            <p className="mt-2 font-display text-xl font-semibold text-ink">{title}</p>
            <p className="mt-1 max-w-sm font-bold text-ink-soft">{body}</p>
            {cta && (
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                    <Link href="/events" className="btn-3d">Find events</Link>
                    <Link href="/request-activity" className="btn-3d btn-ghost">Log activity</Link>
                </div>
            )}
        </div>
    );
}
