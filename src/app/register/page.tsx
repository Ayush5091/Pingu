"use client";

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import AuthShell from '@/components/AuthShell';
import { PinguLoader } from '@/components/ClientLayout';

function RegisterContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();
    const [usn, setUsn] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const token = searchParams.get('token');

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) {
            setError("Registration token missing. Try logging in again.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, usn })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.detail || "Registration failed");
            }

            login(data.access_token);
            router.push('/');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthShell mood="happy" bubble="One last thing before we start!">
            <h1 className="text-center font-display text-[26px] font-semibold text-ink">What&apos;s your USN?</h1>
            <p className="mt-2 text-center text-[15px] font-bold text-ink-soft">
                Pingu uses it to work out your academic year and unlock the right part of your journey.
            </p>

            <form onSubmit={handleRegister} className="mt-6 flex flex-col gap-4">
                <div>
                    <label htmlFor="usn" className="field-label">University Seat Number</label>
                    <input
                        id="usn"
                        required
                        value={usn}
                        onChange={(e) => setUsn(e.target.value)}
                        className="field uppercase tracking-wide"
                        placeholder="e.g. 1MS24CS001"
                        autoComplete="off"
                    />
                </div>
                {error && (
                    <p role="alert" className="rounded-2xl bg-berry-soft px-4 py-3 text-sm font-bold text-berry-shade">{error}</p>
                )}
                <button type="submit" disabled={loading} className="btn-3d mt-1 w-full">
                    {loading ? "Setting up..." : "Start my journey"}
                </button>
            </form>
        </AuthShell>
    );
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<PinguLoader />}>
            <RegisterContent />
        </Suspense>
    );
}
