import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface Props {
  text: string;
  enabled?: boolean;
  speed?: "slow" | "normal";
  className?: string;
}

export function CompetitionMarquee({ text, enabled = true, speed = "normal", className }: Props) {
  const value = (text ?? "").trim();
  if (!enabled || !value) return null;

  const items = value.split(/\s*[·|•]\s*/).map((s) => s.trim()).filter(Boolean);
  const display = items.length > 1 ? items : [value];
  const loops = Array.from({ length: 4 });
  const animClass = speed === "slow" ? "animate-marquee-slow" : "animate-marquee";
  const durationStyle: CSSProperties = { animationDuration: speed === "slow" ? "20s" : "10s" };

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-primary/30 backdrop-blur-xl",
        "td-marketing-card",
        "shadow-[0_0_0_1px_hsl(var(--primary)/0.12),0_18px_45px_-22px_hsl(var(--primary)/0.8)]",
        className,
      )}
      role="marquee"
      aria-label="Competition highlights"
    >
      <div className="td-edge-fade-left absolute inset-y-0 left-0 w-16 z-10 pointer-events-none" />
      <div className="td-edge-fade-right absolute inset-y-0 right-0 w-16 z-10 pointer-events-none" />
      <div className={cn("flex gap-0 whitespace-nowrap py-4 md:py-4", animClass, "group-hover:[animation-play-state:paused]")} style={durationStyle}>
        {loops.map((_, loopIdx) => (
          <div key={loopIdx} className="flex shrink-0 items-center" aria-hidden={loopIdx > 0}>
            {display.map((item, i) => (
              <span key={`${loopIdx}-${i}`} className="flex items-center">
                <span className="px-5 font-display text-base md:text-base font-black italic uppercase tracking-[0.08em] td-text">{item}</span>
                <span aria-hidden className="inline-block w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
