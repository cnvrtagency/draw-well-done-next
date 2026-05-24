"use client";

import { useMounted } from "@/hooks/useMounted";
import { useCountdownTick } from "@/hooks/useCountdownTick";
import { cn } from "@/lib/utils";

function parts(target: string | null | undefined) {
  if (!target) return null;
  const ms = new Date(target).getTime() - Date.now();
  if (ms <= 0) return null;
  return {
    d: Math.floor(ms / 86400000),
    h: Math.floor((ms % 86400000) / 3600000),
    m: Math.floor((ms % 3600000) / 60000),
    s: Math.floor((ms % 60000) / 1000),
  };
}

export function CountdownStrip({ closesAt, target, label, className }: { closesAt?: string | null; target?: string | null; label: string; className?: string }) {
  const mounted = useMounted();
  useCountdownTick(1000);
  const p = mounted ? parts(target || closesAt) : null;
  if (mounted && !p) {
    return (
      <div className={cn("td-countdown-box w-full text-center text-[10px] font-extrabold uppercase tracking-wider py-1.5 rounded-md text-info", className)}>
        Closed
      </div>
    );
  }
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="text-left text-[10px] font-extrabold uppercase tracking-[0.18em] text-info/90">{label}</div>
      <div className="td-countdown-box grid grid-cols-4 gap-1 rounded-md p-1">
        {([
          ["d", "Days"],
          ["h", "Hrs"],
          ["m", "Min"],
          ["s", "Sec"],
        ] as const).map(([key, segmentLabel]) => (
          <div key={key} className="td-countdown-segment h-12 flex flex-col items-center justify-center gap-0.5 rounded-sm">
            <span className="font-mono-num font-extrabold text-[color:var(--td-text)] text-[18px] leading-none tabular-nums">
              {p ? String(p[key]).padStart(2, "0") : "--"}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-info leading-none">{segmentLabel}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
