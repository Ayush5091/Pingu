"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { staggerChild, staggerParent } from "@/lib/motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronDown, Clock, MapPin, Plus, Users, X } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";
import MapLocationPicker from "@/components/MapLocationPicker";
import PageHeader from "@/components/PageHeader";
import Pingu from "@/components/pingu/Pingu";
import { PinguLoader } from "@/components/ClientLayout";
import { CATEGORY_STYLE, categoryStyle } from "@/components/journey/icons";

interface CampusEvent {
  id: number;
  name: string;
  description: string;
  category: string;
  points: number;
  location_name: string;
  start_time: string;
  end_time: string;
  is_ongoing: boolean;
  is_upcoming: boolean;
  is_past: boolean;
  capacity_remaining?: number | null;
}

interface EventSubmission {
  id: number;
  event_id: number;
  event_name: string;
  event_points: number;
  points_awarded: number | null;
  status: "pending_review" | "verified" | "rejected";
  submitted_at: string;
  category: string;
  location_name: string;
}

const CATEGORIES = Object.keys(CATEGORY_STYLE);

const emptyForm = {
  name: "",
  description: "",
  category: "technical",
  start_time: "",
  end_time: "",
  location_name: "",
  latitude: "12.971598",
  longitude: "77.594566",
  location_radius_meters: "100",
};

const when = (start: string, end: string) => {
  const s = new Date(start);
  const e = new Date(end);
  const day = s.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  const t = (d: Date) => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return `${day} · ${t(s)} – ${t(e)}`;
};

function EventsContent() {
  const { token, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"discover" | "mine">("discover");
  const [category, setCategory] = useState<string | null>(searchParams.get("category"));
  const [events, setEvents] = useState<CampusEvent[] | null>(null);
  const [submissions, setSubmissions] = useState<EventSubmission[] | null>(null);
  const [loadError, setLoadError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [mapTouched, setMapTouched] = useState(false);
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    if (user?.role === "admin") {
      router.replace("/");
      return;
    }
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch("/api/events", { headers }).then((r) => (r.ok ? r.json() : [])),
      fetch("/api/event-submissions", { headers }).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([ev, subs]) => {
        setEvents(Array.isArray(ev) ? ev : []);
        setSubmissions(Array.isArray(subs) ? subs : []);
      })
      .catch(() => {
        setEvents([]);
        setSubmissions([]);
        setLoadError("Couldn't load events");
      });
  }, [token, user?.role, router]);

  useEffect(() => {
    if (searchParams.get("new") === "1") setShowCreate(true);
  }, [searchParams]);

  useEffect(() => {
    if (!showCreate) return;
    const now = new Date();
    const end = new Date(now.getTime() + 60 * 60 * 1000);
    const format = (value: Date) => new Date(value.getTime() - value.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    setFormData((prev) => ({ ...prev, start_time: prev.start_time || format(now), end_time: prev.end_time || format(end) }));
    setMapTouched(false);
    setCreateError("");
  }, [showCreate]);

  const checkedIn = useMemo(() => new Set((submissions ?? []).map((s) => s.event_id)), [submissions]);

  const discover = useMemo(() => {
    return (events ?? [])
      .filter((e) => !e.is_past)
      .filter((e) => !category || e.category?.toLowerCase() === category)
      .sort((a, b) => Number(b.is_ongoing) - Number(a.is_ongoing) || +new Date(a.start_time) - +new Date(b.start_time));
  }, [events, category]);

  const closeCreate = () => {
    setShowCreate(false);
    if (searchParams.get("new")) router.replace("/events");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!mapTouched) {
      setCreateError("Tap the map to choose where your event happens.");
      return;
    }
    setIsCreating(true);
    setCreateError("");
    try {
      const response = await fetch("/api/events/personal", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          start_time: new Date(formData.start_time).toISOString(),
          end_time: new Date(formData.end_time).toISOString(),
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          location_radius_meters: parseInt(formData.location_radius_meters, 10),
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || "Failed to create event");
      }
      setFormData(emptyForm);
      closeCreate();
      const ev = await fetch("/api/events", { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json());
      if (Array.isArray(ev)) setEvents(ev);
    } catch (err: any) {
      setCreateError(err.message || "Failed to create event");
    } finally {
      setIsCreating(false);
    }
  };

  if (user?.role === "admin") return null;

  return (
    <div className="mx-auto w-full max-w-[860px] px-4 pb-16 sm:px-6 lg:max-w-[1180px] lg:px-8">
      <PageHeader
        title="Events"
        subtitle="Check in at an event with a geo-tagged photo, or start your own to clear Host Mode."
        action={
          <button type="button" onClick={() => setShowCreate(true)} className="btn-3d btn-beak !min-h-[2.75rem] !px-4 !text-[14px]">
            <Plus size={18} strokeWidth={3} /> <span className="hidden sm:inline">Start event</span><span className="sm:hidden">Start</span>
          </button>
        }
      />

      <div role="tablist" aria-label="Events view" className="grid max-w-sm grid-cols-2 gap-1 rounded-2xl border-2 border-line bg-white p-1">
        {([["discover", "Discover"], ["mine", "My check-ins"]] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`rounded-xl py-2 font-display text-[15px] font-semibold tracking-wide transition-colors ${tab === key ? "bg-glacier-soft text-glacier" : "text-ink-faint hover:text-ink-soft"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "discover" ? (
        <>
          <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            <FilterChip active={!category} onClick={() => setCategory(null)} label="All" color="#1877C9" />
            {CATEGORIES.map((c) => {
              const s = categoryStyle(c);
              return <FilterChip key={c} active={category === c} onClick={() => setCategory(category === c ? null : c)} label={s.label} color={s.color} />;
            })}
          </div>

          <section className="mt-5" aria-live="polite">
            {events === null ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 animate-pulse rounded-3xl bg-snow-deep" />)}
              </div>
            ) : loadError ? (
              <EmptyState mood="sad" title="Pingu slipped on the ice" body={`${loadError}. Refresh to try again.`} />
            ) : discover.length === 0 ? (
              <EmptyState
                mood="sleep"
                title={category ? `No ${categoryStyle(category).label.toLowerCase()} events right now` : "No events right now"}
                body="Campus is quiet. Start your own event, or log something you did elsewhere."
                actions={
                  <>
                    <button type="button" onClick={() => setShowCreate(true)} className="btn-3d btn-beak">Start event</button>
                    <Link href="/request-activity" className="btn-3d btn-ghost">Log activity</Link>
                  </>
                }
              />
            ) : (
              <motion.ul variants={staggerParent} initial="hidden" animate="show" className="grid gap-3 sm:grid-cols-2 lg:gap-4 xl:grid-cols-3">
                {discover.map((e) => <EventCard key={e.id} event={e} checkedIn={checkedIn.has(e.id)} />)}
              </motion.ul>
            )}
          </section>
        </>
      ) : (
        <section className="mt-5">
          {submissions === null ? (
            <div className="h-40 animate-pulse rounded-3xl bg-snow-deep" />
          ) : submissions.length === 0 ? (
            <EmptyState mood="think" title="No check-ins yet" body="When you check in at an event, it shows up here while it's being verified." />
          ) : (
            <motion.ul variants={staggerParent} initial="hidden" animate="show" className="flex flex-col gap-2.5">
              {submissions.map((s) => {
                const c = categoryStyle(s.category);
                const Icon = c.icon;
                const status =
                  s.status === "verified"
                    ? { label: `+${s.points_awarded ?? s.event_points} pts`, bg: "#E2F6EA", fg: "#17803F" }
                    : s.status === "rejected"
                      ? { label: "Not approved", bg: "#FDE8E8", fg: "#B9282D" }
                      : { label: "In review", bg: "#FFF1DC", fg: "#8A4B00" };
                return (
                  <motion.li variants={staggerChild} key={s.id} className="panel flex items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-5">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: c.soft }}>
                      <Icon size={24} strokeWidth={2.5} color={c.color} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[16px] font-extrabold text-ink">{s.event_name}</p>
                      <p className="flex items-center gap-1 truncate text-[13px] font-bold text-ink-soft">
                        <MapPin size={13} strokeWidth={3} className="shrink-0" /> {s.location_name} · {new Date(s.submitted_at).toLocaleDateString([], { day: "numeric", month: "short" })}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full px-2.5 py-1 text-[13px] font-extrabold" style={{ background: status.bg, color: status.fg }}>{status.label}</span>
                  </motion.li>
                );
              })}
            </motion.ul>
          )}
        </section>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/50 backdrop-blur-[2px] sm:items-center sm:px-4 sm:py-8" role="dialog" aria-modal="true" aria-labelledby="create-title">
          <button className="absolute inset-0 cursor-default" aria-label="Close" onClick={closeCreate} />
          <div className="relative z-10 max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[32px] bg-white p-5 sm:rounded-[32px] sm:p-6">
            <div className="flex items-start gap-3">
              <Pingu mood="happy" size={56} scarf="#FF9F1C" scarfShade="#D97800" animate={false} />
              <div className="min-w-0 flex-1">
                <h2 id="create-title" className="font-display text-2xl font-semibold text-ink">Start an event</h2>
                <p className="text-sm font-bold text-ink-soft">Host a study circle, drive or session. Attendees check in with a photo at your location.</p>
              </div>
              <button type="button" onClick={closeCreate} aria-label="Close" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-ink-faint hover:bg-snow-deep hover:text-ink">
                <X size={20} strokeWidth={3} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-5 flex flex-col gap-4">
              <div>
                <label className="field-label" htmlFor="ev-name">Event name</label>
                <input id="ev-name" name="name" value={formData.name} onChange={handleInputChange} className="field" placeholder="e.g. DSA study circle" required />
              </div>
              <div>
                <label className="field-label" htmlFor="ev-cat">Category</label>
                <div className="relative">
                  <select id="ev-cat" name="category" value={formData.category} onChange={handleInputChange} className="field cursor-pointer appearance-none pr-11">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{categoryStyle(c).label}</option>)}
                  </select>
                  <ChevronDown size={20} strokeWidth={3} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-soft" />
                </div>
              </div>
              <div>
                <label className="field-label" htmlFor="ev-desc">Description</label>
                <textarea id="ev-desc" name="description" value={formData.description} onChange={handleInputChange} className="field resize-none" rows={3} placeholder="What will people do?" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label" htmlFor="ev-start">Starts</label>
                  <input id="ev-start" type="datetime-local" name="start_time" value={formData.start_time} onChange={handleInputChange} className="field [color-scheme:light]" required />
                </div>
                <div>
                  <label className="field-label" htmlFor="ev-end">Ends</label>
                  <input id="ev-end" type="datetime-local" name="end_time" value={formData.end_time} onChange={handleInputChange} className="field [color-scheme:light]" required />
                </div>
              </div>

              <div>
                <span className="field-label">Where is it?</span>
                <div className="overflow-hidden rounded-2xl border-2 border-line">
                  <MapLocationPicker
                    initialLat={parseFloat(formData.latitude)}
                    initialLng={parseFloat(formData.longitude)}
                    initialRadius={parseInt(formData.location_radius_meters, 10)}
                    onLocationSelect={(lat, lng, name) => {
                      setMapTouched(true);
                      setFormData((prev) => ({ ...prev, latitude: lat.toString(), longitude: lng.toString(), location_name: name }));
                    }}
                    onRadiusChange={(radius) => setFormData((prev) => ({ ...prev, location_radius_meters: radius.toString() }))}
                  />
                </div>
                <p className={`mt-2 text-sm font-bold ${mapTouched ? "text-moss-shade" : "text-ink-soft"}`}>
                  {mapTouched ? "Location set." : "Tap the map to drop a pin."}
                </p>
              </div>
              <div>
                <label className="field-label" htmlFor="ev-loc">Location label</label>
                <input id="ev-loc" name="location_name" value={formData.location_name} onChange={handleInputChange} className="field" placeholder="e.g. Library, 2nd floor" required />
              </div>

              {createError && <p role="alert" className="rounded-2xl bg-berry-soft px-4 py-3 text-sm font-bold text-berry-shade">{createError}</p>}

              <div className="grid grid-cols-2 gap-3 pt-1">
                <button type="button" onClick={closeCreate} className="btn-3d btn-ghost">Cancel</button>
                <button type="submit" disabled={isCreating} className="btn-3d btn-beak">{isCreating ? "Creating..." : "Create event"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function EventCard({ event: e, checkedIn }: { event: CampusEvent; checkedIn: boolean }) {
  const c = categoryStyle(e.category);
  const Icon = c.icon;
  return (
    <motion.li variants={staggerChild} whileHover={{ y: -4 }} transition={{ type: "spring", stiffness: 400, damping: 26 }} className="panel flex flex-col p-5 transition-[border-color] hover:border-line-strong">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: c.soft }}>
          <Icon size={24} strokeWidth={2.5} color={c.color} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-semibold leading-tight text-ink">{e.name}</h3>
          <p className="mt-0.5 text-[13px] font-extrabold" style={{ color: c.color }}>{c.label}</p>
        </div>
        <span className="shrink-0 rounded-full bg-gold-soft px-2.5 py-1 font-display text-[15px] font-semibold text-[#7A5200]">+{e.points}</span>
      </div>
      {e.description && <p className="mt-3 line-clamp-2 text-[15px] font-semibold text-ink-soft">{e.description}</p>}
      <ul className="mt-3 flex flex-col gap-1 text-[13px] font-bold text-ink-soft">
        <li className="flex items-center gap-1.5">
          {e.is_ongoing ? <Clock size={14} strokeWidth={3} className="text-moss-shade" /> : <CalendarDays size={14} strokeWidth={3} />}
          {e.is_ongoing ? <span className="text-moss-shade">Live now · ends {new Date(e.end_time).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span> : when(e.start_time, e.end_time)}
        </li>
        <li className="flex min-w-0 items-center gap-1.5"><MapPin size={14} strokeWidth={3} className="shrink-0" /> <span className="truncate">{e.location_name}</span></li>
        {e.capacity_remaining != null && <li className="flex items-center gap-1.5"><Users size={14} strokeWidth={3} /> {e.capacity_remaining} spots left</li>}
      </ul>
      <div className="mt-auto pt-4">
        {checkedIn ? (
          <span className="flex min-h-[2.75rem] items-center justify-center rounded-2xl bg-moss-soft font-display text-[14px] font-semibold uppercase tracking-wide text-moss-shade">Checked in</span>
        ) : e.is_ongoing ? (
          <Link href={`/events/${e.id}/camera`} className="btn-3d btn-moss w-full !min-h-[2.75rem] !text-[14px]">Check in with photo</Link>
        ) : (
          <span className="flex min-h-[2.75rem] items-center justify-center rounded-2xl bg-snow font-display text-[14px] font-semibold uppercase tracking-wide text-ink-faint">Check-in opens at start</span>
        )}
      </div>
    </motion.li>
  );
}

function FilterChip({ active, onClick, label, color }: { active: boolean; onClick: () => void; label: string; color: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 rounded-full border-2 px-3.5 py-1.5 text-sm font-extrabold transition-colors ${active ? "" : "border-line bg-white text-ink-soft hover:border-line-strong"}`}
      style={active ? { borderColor: color, background: `${color}14`, color } : undefined}
    >
      {label}
    </button>
  );
}

function EmptyState({ mood, title, body, actions }: { mood: "sleep" | "think" | "sad"; title: string; body: string; actions?: React.ReactNode }) {
  return (
    <div className="panel flex flex-col items-center px-6 py-10 text-center">
      <Pingu mood={mood} size={100} />
      <p className="mt-2 font-display text-xl font-semibold text-ink">{title}</p>
      <p className="mt-1 max-w-sm font-bold text-ink-soft">{body}</p>
      {actions && <div className="mt-5 flex flex-wrap justify-center gap-3">{actions}</div>}
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<PinguLoader />}>
      <EventsContent />
    </Suspense>
  );
}
