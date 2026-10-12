"use client";

import Link from "next/link";
import { Fragment, useRef } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/motion";
import { Camera, Check, Lock, MapPin, Medal, ShieldCheck } from "lucide-react";
import Pingu from "@/components/pingu/Pingu";
import PinguBuddy from "@/components/pingu/PinguBuddy";
import { LEVELS, YEARS } from "@/lib/journey";
import { LEVEL_ICONS } from "@/components/journey/icons";

const HEADLINE = "Four years. 100 points. One very determined penguin.";

export default function Landing() {
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      // Headline rises word by word, then the copy and buttons follow.
      gsap.timeline({ defaults: { ease: "power4.out" } })
        .from(".hero-word", { yPercent: 110, opacity: 0, duration: 0.9, stagger: 0.06 })
        .from(".hero-sub", { y: 16, opacity: 0, duration: 0.7 }, "-=0.55")
        .from(".hero-cta", { y: 16, opacity: 0, duration: 0.6, stagger: 0.08 }, "-=0.5");

      // Each world's levels pop in as the section scrolls into view.
      gsap.utils.toArray<HTMLElement>(".world").forEach((world, i) => {
        gsap.from(world.querySelectorAll(".world-node"), {
          scale: 0.3,
          opacity: 0,
          y: 18,
          duration: 0.55,
          stagger: 0.09,
          delay: i * 0.12,
          ease: "back.out(2.6)",
          scrollTrigger: { trigger: world, start: "top 85%", once: true },
        });
      });

      gsap.from(".step", {
        x: -28,
        opacity: 0,
        duration: 0.7,
        stagger: 0.14,
        ease: "power3.out",
        scrollTrigger: { trigger: ".steps", start: "top 80%", once: true },
      });

      // The celebration card drifts a little slower than the page.
      gsap.fromTo(".parallax-card", { y: 40 }, {
        y: -30,
        ease: "none",
        scrollTrigger: { trigger: ".parallax-card", start: "top bottom", end: "bottom top", scrub: 0.6 },
      });
      gsap.fromTo(".parallax-card .fill-bar", { width: "0%" }, {
        width: "46%",
        duration: 1.2,
        ease: "power3.out",
        scrollTrigger: { trigger: ".parallax-card", start: "top 75%", once: true },
      });
    },
    { scope: root }
  );
  const rise = (delay = 0) =>
    reduce ? {} : { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const } };

  return (
    <div ref={root} className="min-h-screen bg-snow text-ink">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Pingu size={40} animate={false} title="SPARK" />
          <span className="font-display text-[28px] font-bold tracking-tight text-glacier">spark</span>
        </Link>
        <Link href="/login" className="btn-3d btn-ghost !min-h-[2.75rem] !text-[14px]">Log in</Link>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <Snowdrift />
        <div className="relative mx-auto grid max-w-6xl items-center gap-6 px-4 pb-20 pt-6 sm:px-6 md:grid-cols-[1fr_1.1fr] md:pt-12">
          <motion.div className="order-2 flex justify-center md:order-1" {...rise(0.1)}>
            <PinguBuddy
              mood="wave"
              size={300}
              bubble="top-right"
              className="w-[220px] sm:w-[300px]"
              lines={[
                "Hi! I'm Pingu. Tap me!",
                "100 points and you've got your degree.",
                "Hackathons are my favourite level.",
                "Every campus event gets you closer.",
                "Hehe, that tickles!",
                "Okay, ready to start your journey?",
              ]}
            />
          </motion.div>
          <div className="order-1 text-center md:order-2 md:text-left">
            <h1 className="font-display text-[clamp(2.4rem,6vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.02em] text-balance" aria-label={HEADLINE}>
              {HEADLINE.split(" ").map((w, i) => (
                <Fragment key={i}>
                  <span className="inline-block overflow-hidden pb-[0.08em] align-bottom" aria-hidden>
                    <span className="hero-word inline-block">{w}</span>
                  </span>{" "}
                </Fragment>
              ))}
            </h1>
            <p className="hero-sub mx-auto mt-5 max-w-[34rem] text-lg font-bold leading-relaxed text-ink-soft md:mx-0">
              SPARK turns your AICTE activity points into a journey. Join events, clear levels and waddle all the way to graduation with Pingu.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center md:justify-start">
              <Link href="/login" className="hero-cta btn-3d px-8 sm:min-w-[220px]">Start my journey</Link>
              <Link href="/demo" className="hero-cta btn-3d btn-ghost px-8 sm:min-w-[220px]">See a sample path</Link>
            </div>
          </div>
        </div>
      </section>

      {/* The four worlds */}
      <section className="border-y-2 border-line bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="max-w-2xl font-display text-[clamp(1.9rem,4vw,2.75rem)] font-semibold leading-tight tracking-[-0.015em] text-balance">
            Your degree, mapped as four worlds of levels.
          </h2>
          <p className="mt-3 max-w-xl text-lg font-bold text-ink-soft">
            Each academic year unlocks a new world. Clear its levels by doing the real things that earn AICTE points.
          </p>

          <ol className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {YEARS.map((y, yi) => {
              const sample = LEVELS.filter((l) => l.year === y.year && !l.checkpoint).slice(0, 4);
              return (
                <li key={y.year} className="world relative">
                  <h3 className="font-display text-2xl font-semibold">
                    <span style={{ color: y.deep }}>Year {y.year}</span> · {y.name}
                  </h3>
                  <p className="mt-1 min-h-[3rem] font-bold text-ink-soft">{y.tagline}</p>
                  <ul className="mt-6 flex flex-col gap-4">
                    {sample.map((l, i) => {
                      const Icon = LEVEL_ICONS[l.icon];
                      const state = yi === 0 && i < 2 ? "done" : yi === 0 && i === 2 ? "current" : yi === 0 ? "open" : "locked";
                      return (
                        <li key={l.id} className="world-node flex items-center gap-3" style={{ paddingLeft: [0, 22, 36, 22][i] }}>
                          <span
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full"
                            style={{
                              background: state === "done" ? "#FFC23D" : state === "current" ? y.color : state === "open" ? y.soft : "#E5ECF3",
                              boxShadow: `0 5px 0 ${state === "done" ? "#DB9A00" : state === "current" ? y.shade : state === "open" ? `${y.color}55` : "#C9D5E3"}`,
                            }}
                          >
                            {state === "locked" ? (
                              <Lock size={18} strokeWidth={2.8} color="#93A3B8" />
                            ) : state === "done" ? (
                              <Check size={22} strokeWidth={3.5} color="#fff" />
                            ) : (
                              <Icon size={22} strokeWidth={2.6} color={state === "current" ? "#fff" : y.shade} />
                            )}
                          </span>
                          <span className="font-display text-[15px] font-semibold leading-tight">{l.title}</span>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* How a level gets cleared */}
      <section className="py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 md:grid-cols-2">
          <div>
            <h2 className="font-display text-[clamp(1.9rem,4vw,2.75rem)] font-semibold leading-tight tracking-[-0.015em] text-balance">
              No paperwork. Just show up and snap.
            </h2>
            <ul className="steps mt-8 flex flex-col gap-7">
              <Step icon={<MapPin size={24} strokeWidth={2.6} color="#0B7268" />} bg="#DDF7F3" title="Find an event on campus">
                Live and upcoming events show up on your path, right next to the level they help you clear.
              </Step>
              <Step icon={<Camera size={24} strokeWidth={2.6} color="#1877C9" />} bg="#E3F1FD" title="Check in with a geo-tagged photo">
                SPARK checks the time, place and photo metadata for you. Off-campus activities go to your coordinator for review.
              </Step>
              <Step icon={<Medal size={24} strokeWidth={2.6} color="#B35500" />} bg="#FFF1DE" title="Level up and climb your league">
                Verified points clear levels, keep your weekly streak alive and move you up your batch&apos;s league.
              </Step>
            </ul>
          </div>
          <div className="relative mx-auto mt-16 w-full max-w-md md:mt-0">
            <div className="parallax-card panel relative p-6 pt-24 shadow-[0_30px_60px_-40px_rgba(16,33,58,0.5)]">
              <div className="absolute -top-20 left-1/2 -translate-x-1/2">
                <Pingu mood="cheer" size={150} scarf="#14B8A6" scarfShade="#0E8C7F" interactive />
              </div>
              <p className="text-center font-display text-2xl font-semibold">Level cleared!</p>
              <p className="mt-1 text-center font-bold text-ink-soft">Code Sprint · Smart India Hackathon</p>
              <p className="mt-4 text-center font-display text-xl font-semibold text-[#B37A00]">+10 activity points</p>
              <div className="mt-5 h-4 overflow-hidden rounded-full bg-snow-deep">
                <div className="fill-bar h-full w-[46%] rounded-full bg-gold" />
              </div>
              <p className="mt-2 text-center text-sm font-extrabold text-ink-soft">46 of 100 AICTE points</p>
            </div>
          </div>
        </div>
      </section>

      {/* Coordinators */}
      <section className="bg-ink py-16 text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 sm:px-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <ShieldCheck size={36} strokeWidth={2.4} className="mt-1 shrink-0 text-gold" />
            <div>
              <h2 className="font-display text-2xl font-semibold sm:text-3xl">Coordinators keep the final say.</h2>
              <p className="mt-2 max-w-xl font-bold text-white/75">
                Create geo-fenced events, review proof in one queue and award points. Every level on the path is backed by a verified record.
              </p>
            </div>
          </div>
          <Link href="/login" className="btn-3d btn-gold shrink-0 px-8">Coordinator login</Link>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-8 text-sm font-bold text-ink-faint sm:flex-row sm:px-6">
        <span>SPARK · Student Performance, Activity &amp; Recognition Framework</span>
        <span>Points rules follow AICTE and VTU guidelines. Your coordinator confirms every award.</span>
      </footer>
    </div>
  );
}

function Step({ icon, bg, title, children }: { icon: React.ReactNode; bg: string; title: string; children: React.ReactNode }) {
  return (
    <li className="step flex gap-4">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: bg }}>{icon}</span>
      <div>
        <h3 className="font-display text-xl font-semibold">{title}</h3>
        <p className="mt-1 max-w-md font-bold leading-relaxed text-ink-soft">{children}</p>
      </div>
    </li>
  );
}

// Soft snowbanks behind the hero.
function Snowdrift() {
  return (
    <svg className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full" viewBox="0 0 1440 160" preserveAspectRatio="none" aria-hidden>
      <path d="M0 90 C240 40 420 120 720 80 C1000 44 1200 110 1440 70 L1440 160 L0 160Z" fill="#E3F1FD" />
      <path d="M0 130 C300 96 520 150 820 120 C1080 96 1260 140 1440 118 L1440 160 L0 160Z" fill="#fff" />
    </svg>
  );
}
