"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function PageHeader({
  title,
  subtitle,
  back = false,
  action,
}: {
  title: string;
  subtitle?: React.ReactNode;
  back?: boolean;
  action?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <header className="flex items-start gap-3 pb-6 pt-6 lg:pt-10">
      {back && (
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="-ml-1 mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-ink-soft hover:bg-snow-deep hover:text-ink"
        >
          <ArrowLeft size={24} strokeWidth={2.8} />
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-[28px] font-semibold leading-tight text-ink sm:text-[32px]">{title}</h1>
        {subtitle && <p className="mt-1 max-w-xl text-[15px] font-bold text-ink-soft">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
