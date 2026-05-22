"use client";

import { cn } from "@/lib/utils";
import { useMounted } from "@/hooks/useMounted";
import { useCountdownTick } from "@/hooks/useCountdownTick";

function timeRemaining(target: string | null | undefined) {
  if (!target) return "-";
  const ms = new Date(target).getTime() - Date.now();
  if (ms <= 0) return "Closed";
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${Math.max(0, m)}m`;
}

export function CountdownPill({ closesAt, target, tone = "default", prefix = "Closes" }: { closesAt?: string | null; target?: string | null; tone?: "default" | "warning"; prefix?: string }) {
  const mounted = useMounted();
  useCountdownTick(30000);
  const label = mounted ? timeRemaining(target || closesAt) : "--";
  return (
    <span className={cn("inline-flex items-center rounded-md border px-2 py-1 font-mono-num text-[10px] font-black uppercase tracking-wider backdrop-blur-md", tone === "warning" ? "border-warning/50 bg-warning/15 text-warning" : "border-primary/50 bg-primary/15 text-white")}>
      {prefix ? `${prefix} ` : ""}{label}
    </span>
  );
}
