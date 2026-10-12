"use client";

import Link from "next/link";
import Pingu, { type PinguMood } from "@/components/pingu/Pingu";
import PinguBuddy from "@/components/pingu/PinguBuddy";

export default function AuthShell({
  mood = "wave",
  bubble,
  children,
}: {
  mood?: PinguMood;
  bubble: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col bg-snow">
      <header className="mx-auto flex w-full max-w-6xl items-center px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Pingu size={36} animate={false} title="SPARK home" />
          <span className="font-display text-[26px] font-bold tracking-tight text-glacier">spark</span>
        </Link>
      </header>
      <main className="flex flex-1 flex-col items-center justify-center px-4 pb-16">
        <PinguBuddy
          key={bubble}
          mood={mood}
          size={130}
          lines={[bubble, "Psst, your coordinator approves every point.", "Tap me all you like. I don't bite.", bubble]}
        />
        <div className="panel mt-2 w-full max-w-[400px] p-6 sm:p-8">{children}</div>
      </main>
    </div>
  );
}
