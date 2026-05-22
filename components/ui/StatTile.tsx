import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "default" | "primary" | "success" | "info" | "gold";
const toneRing: Record<Tone, string> = {
  default: "from-white/10 to-white/0",
  primary: "from-primary/30 to-primary/0",
  success: "from-success/30 to-success/0",
  info: "from-info/30 to-info/0",
  gold: "from-gold/30 to-gold/0",
};

export function StatTile({ label, value, hint, icon, tone = "default", className }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; tone?: Tone; className?: string }) {
  return (
    <div className={cn("relative glass-panel overflow-hidden p-2.5 md:p-5", className)}>
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70", toneRing[tone])} />
      <div className="relative flex h-full min-h-[56px] items-center justify-between gap-2 md:min-h-[86px] md:items-start md:gap-3">
        <div className="flex min-w-0 flex-col gap-1 md:self-stretch">
          <div className="truncate text-[9px] font-extrabold uppercase tracking-[0.12em] text-white/60 md:text-[11px] md:tracking-[0.16em]">{label}</div>
          <div>
            <div className="font-mono-num text-lg font-extrabold leading-none text-white md:mt-2 md:text-3xl">{value}</div>
            {hint ? <div className="mt-0.5 text-[10px] text-white/60 md:mt-1.5 md:text-[11px]">{hint}</div> : null}
          </div>
        </div>
        {icon ? <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.07] text-primary md:h-10 md:w-10 md:rounded-xl">{icon}</div> : null}
      </div>
    </div>
  );
}
