"use client";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import PageHeader from "@/components/PageHeader";
import { PinguLoader } from "@/components/ClientLayout";

export default function SettingsScreen() {
    const { token, logout, user, profile, profileLoading, refreshProfile } = useAuth();
    const [editData, setEditData] = useState({ phone_number: '', department: '', name: '' });
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        if (profile) {
            setEditData({
                phone_number: profile.phone_number || '',
                department: profile.department || '',
                name: profile.name || ''
            });
        }
    }, [profile]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;
        setSaving(true);
        setStatus(null);
        try {
            const endpoint = isAdmin ? '/api/admins/me' : '/api/students/me';
            const payload = isAdmin ? { name: editData.name } : { phone_number: editData.phone_number, department: editData.department };
            const res = await fetch(endpoint, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error();
            await refreshProfile();
            setStatus({ ok: true, text: "Saved. Pingu updated your profile." });
        } catch {
            setStatus({ ok: false, text: "Couldn't save your changes. Check your connection and try again." });
        } finally {
            setSaving(false);
        }
    };

    if (profileLoading) return <PinguLoader />;

    return (
        <div className="mx-auto w-full max-w-xl px-4 pb-16 sm:px-6">
            <PageHeader back title="Settings" subtitle="Keep your details up to date so coordinators can reach you." />

            <form onSubmit={handleSave} className="panel flex flex-col gap-5 p-5 sm:p-6">
                <ReadOnly label="Email" value={profile?.email || "Not set"} />
                {!isAdmin && <ReadOnly label="USN" value={profile?.usn || "Not set"} />}

                {isAdmin ? (
                    <div>
                        <label htmlFor="name" className="field-label">Name</label>
                        <input id="name" className="field" value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
                    </div>
                ) : (
                    <>
                        <div>
                            <label htmlFor="phone" className="field-label">Phone number</label>
                            <input id="phone" type="tel" autoComplete="tel" className="field" value={editData.phone_number} onChange={(e) => setEditData({ ...editData, phone_number: e.target.value })} placeholder="10-digit mobile number" />
                        </div>
                        <div>
                            <label htmlFor="dept" className="field-label">Department</label>
                            <input id="dept" className="field" value={editData.department} onChange={(e) => setEditData({ ...editData, department: e.target.value })} placeholder="e.g. Computer Science" />
                        </div>
                    </>
                )}

                {status && (
                    <p role="status" className={`rounded-2xl px-4 py-3 text-sm font-bold ${status.ok ? 'bg-moss-soft text-moss-shade' : 'bg-berry-soft text-berry-shade'}`}>
                        {status.text}
                    </p>
                )}

                <button type="submit" disabled={saving} className="btn-3d w-full">{saving ? "Saving..." : "Save changes"}</button>
            </form>

            <button type="button" onClick={logout} className="btn-3d btn-ghost mt-4 w-full !text-berry-shade">
                <LogOut size={18} strokeWidth={2.8} /> Log out
            </button>
        </div>
    );
}

function ReadOnly({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <span className="field-label">{label}</span>
            <p className="rounded-2xl bg-snow-deep px-4 py-3.5 font-semibold text-ink-soft">{value}</p>
        </div>
    );
}
