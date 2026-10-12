"use client";

import Link from "next/link";
import { useMemo } from "react";
import JourneyView from "@/components/journey/JourneyView";
import { buildDemo } from "@/lib/journey-demo";
import { MobileTabBar, STUDENT_NAV } from "@/components/Navigation";

export default function JourneyDemo() {
  const demo = useMemo(() => buildDemo(), []);
  return (
    <div className="min-h-screen bg-snow pb-24 md:pb-0">
      <div className="flex items-center justify-center gap-3 bg-ink px-4 py-2.5 text-center text-sm font-bold text-white">
        <span>You're previewing a sample student's journey.</span>
        <Link href="/login" className="rounded-full bg-gold px-3 py-1 font-extrabold text-[#4A3100] hover:brightness-105">
          Start yours
        </Link>
      </div>
      <JourneyView {...demo} demo />
      <MobileTabBar items={STUDENT_NAV} isActive={(href) => href === "/"} demo />
    </div>
  );
}
