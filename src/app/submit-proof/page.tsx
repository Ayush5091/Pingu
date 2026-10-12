"use client";
import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import PageHeader from '@/components/PageHeader';
import Pingu from '@/components/pingu/Pingu';
import { PinguLoader } from '@/components/ClientLayout';

interface ApprovedRequest {
    request_id: number;
    activity: string;
    points: number;
    category: string;
}

function SubmitProofContent() {
    const { token } = useAuth();
    const router = useRouter();
    const params = useSearchParams();

    const [approved, setApproved] = useState<ApprovedRequest[] | null>(null);
    const [requestId, setRequestId] = useState("");
    const [proofUrl, setProofUrl] = useState("");
    const [notes, setNotes] = useState("");
    const [hours, setHours] = useState("");
    const [date, setDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (!token) return;
        const headers = { 'Authorization': `Bearer ${token}` };
        Promise.all([
            fetch('/api/activity-requests/me', { headers }).then(r => r.json()),
            fetch('/api/submissions/me', { headers }).then(r => r.json()),
        ])
            .then(([requests, submissions]) => {
                // Only approved requests that don't have proof yet can take a submission.
                const submitted = new Set((Array.isArray(submissions) ? submissions : []).map((s: any) => s.request_id));
                const list = (Array.isArray(requests) ? requests : []).filter((r: any) => r.status === 'approved' && !submitted.has(r.request_id));
                setApproved(list);
                const wanted = params.get('request');
                const pick = list.find((r: ApprovedRequest) => String(r.request_id) === wanted) ?? list[0];
                if (pick) setRequestId(String(pick.request_id));
            })
            .catch(() => {
                setApproved([]);
                setError("Couldn't load your approved activities");
            });
    }, [token, params]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
            const res = await fetch('/api/submissions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    request_id: Number(requestId),
                    proof: proofUrl,
                    description: notes || "",
                    hours_spent: hours ? Number(hours) : null,
                    activity_date: date || null,
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Failed to submit proof");
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
                <Pingu mood="cheer" size={140} />
                <h1 className="mt-2 font-display text-[28px] font-semibold text-ink">Proof submitted!</h1>
                <p className="mt-2 font-bold text-ink-soft">Once your coordinator verifies it, the points land and the matching level on your path lights up.</p>
                <div className="mt-6 grid w-full gap-3">
                    <Link href="/submissions-history" className="btn-3d w-full">See my activity log</Link>
                    <button type="button" onClick={() => router.push('/')} className="btn-3d btn-ghost w-full">Back to journey</button>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto w-full max-w-xl px-4 pb-16 sm:px-6">
            <PageHeader back title="Upload proof" subtitle="Add your certificate or photos for an approved activity to claim its points." />

            {approved === null ? (
                <div className="h-72 animate-pulse rounded-3xl bg-snow-deep" />
            ) : approved.length === 0 ? (
                <div className="panel flex flex-col items-center p-8 text-center">
                    <Pingu mood="think" size={100} />
                    <p className="mt-2 font-display text-xl font-semibold text-ink">Nothing waiting for proof</p>
                    <p className="mt-1 font-bold text-ink-soft">Log an activity first. Once your coordinator approves it, you can upload proof here.</p>
                    <Link href="/request-activity" className="btn-3d mt-5">Log an activity</Link>
                </div>
            ) : (
                <form className="panel flex flex-col gap-5 p-5 sm:p-6" onSubmit={handleSubmit}>
                    <div>
                        <label className="field-label" htmlFor="request">Approved activity</label>
                        <div className="relative">
                            <select id="request" required value={requestId} onChange={(e) => setRequestId(e.target.value)} className="field cursor-pointer appearance-none pr-11">
                                {approved.map((r) => (
                                    <option key={r.request_id} value={r.request_id}>{r.activity} · {r.points} pts</option>
                                ))}
                            </select>
                            <ChevronDown size={20} strokeWidth={3} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-soft" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="field-label" htmlFor="date">Date</label>
                            <input id="date" required type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field [color-scheme:light]" />
                        </div>
                        <div>
                            <label className="field-label" htmlFor="hours">Hours spent</label>
                            <input id="hours" required type="number" min={1} inputMode="numeric" value={hours} onChange={(e) => setHours(e.target.value)} className="field" placeholder="4" />
                        </div>
                    </div>

                    <div>
                        <label className="field-label" htmlFor="proof">Link to proof</label>
                        <input id="proof" required type="url" value={proofUrl} onChange={(e) => setProofUrl(e.target.value)} className="field" placeholder="https://drive.google.com/..." />
                        <p className="mt-2 text-sm font-bold text-ink-soft">A Google Drive link to your certificate or photos. Make sure it&apos;s shared with your college account.</p>
                    </div>

                    <div>
                        <label className="field-label" htmlFor="notes">Notes <span className="font-body text-sm font-bold text-ink-faint">(optional)</span></label>
                        <textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="field resize-none" rows={3} placeholder="Anything your coordinator should know?" />
                    </div>

                    {error && <p role="alert" className="rounded-2xl bg-berry-soft px-4 py-3 text-sm font-bold text-berry-shade">{error}</p>}

                    <button disabled={loading} className="btn-3d w-full" type="submit">{loading ? "Uploading..." : "Submit proof"}</button>
                </form>
            )}
        </div>
    );
}

export default function SubmitProofScreen() {
    return (
        <Suspense fallback={<PinguLoader />}>
            <SubmitProofContent />
        </Suspense>
    );
}
