"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/contexts/AuthContext";
import AdminDashboard from "@/components/AdminDashboard";
import Landing from "@/components/Landing";
import JourneyView from "@/components/journey/JourneyView";
import type { RailEvent, RailNotification } from "@/components/journey/JourneyRail";
import { PinguLoader } from "@/components/ClientLayout";
import Pingu from "@/components/pingu/Pingu";
import type { JourneyResult } from "@/lib/journey";

interface JourneyResponse {
  student: { name: string; usn: string; department?: string; semester?: number | null };
  pending: number;
  journey: JourneyResult;
}

export default function Home() {
  const { user, token, isLoading, isInitializing } = useAuth();

  if (isLoading || isInitializing) return <PinguLoader />;
  if (!user) return <Landing />;
  if (user.role === "admin") return <AdminDashboard />;
  return <StudentHome token={token} />;
}

function StudentHome({ token }: { token: string | null }) {
  const [data, setData] = useState<JourneyResponse | null>(null);
  const [events, setEvents] = useState<RailEvent[]>([]);
  const [notifications, setNotifications] = useState<RailNotification[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [journeyRes, eventsRes, notifRes] = await Promise.all([
        fetch("/api/journey", { headers }),
        fetch("/api/events", { headers }),
        fetch("/api/notifications", { headers }),
      ]);
      if (!journeyRes.ok) throw new Error((await journeyRes.json().catch(() => null))?.detail || "Couldn't load your journey");
      setData(await journeyRes.json());
      if (eventsRes.ok) {
        const list = await eventsRes.json();
        setEvents(Array.isArray(list) ? list : []);
      }
      if (notifRes.ok) {
        const list = await notifRes.json();
        setNotifications(Array.isArray(list) ? list : []);
      }
    } catch (e: any) {
      setError(e?.message || "Couldn't load your journey");
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = useCallback(async () => {
    if (!token || !notifications.some((n) => !n.is_read)) return;
    try {
      await fetch("/api/notifications", { method: "PUT", headers: { Authorization: `Bearer ${token}` } });
      setNotifications((list) => list.map((n) => ({ ...n, is_read: true })));
    } catch {
      /* non-critical */
    }
  }, [token, notifications]);

  if (error) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <Pingu mood="sad" size={110} />
        <h1 className="font-display text-2xl font-semibold text-ink">Pingu slipped on the ice</h1>
        <p className="max-w-sm font-bold text-ink-soft">{error}. Check your connection and try again.</p>
        <button type="button" onClick={load} className="btn-3d mt-2">Try again</button>
      </div>
    );
  }

  if (!data) return <PinguLoader label="Loading your journey..." />;

  return (
    <JourneyView
      student={data.student}
      journey={data.journey}
      pending={data.pending}
      events={events}
      notifications={notifications}
      onOpenNotifications={markRead}
    />
  );
}
