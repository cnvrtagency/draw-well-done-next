"use client";

import Link from "next/link";
import { memo } from "react";
import type { Competition } from "@/types/db";
import { effectiveRemaining, effectiveSoldCount, formatMoney, publicEntryPercent } from "@/lib/format";
import { SafePrizeImage } from "@/components/SafePrizeImage";
import { formatCashAlternative } from "@/lib/cashAlternative";
import { CountdownPill } from "@/components/ui/CountdownPill";
import { CountdownStrip } from "@/components/ui/CountdownStrip";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ChevronRight } from "lucide-react";
import { competitionCardImageUrl } from "@/lib/competitionImages";
import { useMounted } from "@/hooks/useMounted";

interface Props { c: Competition; badge?: string; tone?: "red" | "blue" | "purple" | "gold"; maxDiscountPct?: number; priority?: boolean; }

function CompetitionCardBase({ c, badge, tone = "red", maxDiscountPct, priority }: Props) {
  const mounted = useMounted();
  const effectiveSold = effectiveSoldCount(c.current_entries, c.manual_reserved_entries, c.max_entries);
  const remaining = effectiveRemaining(c.current_entries, c.manual_reserved_entries, c.max_entries);
  const sold = publicEntryPercent(effectiveSold, c.max_entries);
  const soldLabel = (() => {
    const max = Math.max(0, Number(c.max_entries) || 0);
    if (max <= 0 || effectiveSold <= 0) return "0%";
    const real = (effectiveSold / max) * 100;
    if (real < 1) return "<1%";
    return `${Math.min(100, Math.floor(real))}%`;
  })();
  const toneCls = {
    red: "bg-primary text-primary-foreground",
    blue: "bg-info text-info-foreground",
    purple: "bg-accent text-accent-foreground",
    gold: "gold-chip",
  }[tone];
  const now = mounted ? Date.now() : null;
  const opensInFuture = now != null && !!c.opens_at && new Date(c.opens_at).getTime() > now;
  const closesInPast = now != null && !!c.closes_at && new Date(c.closes_at).getTime() < now;
  const isDrawn = c.status === "drawn";
  const isSoldOut = c.status === "sold_out" || (c.status === "live" && remaining === 0);
  const isLiveEnterable = c.status === "live" && remaining > 0 && !opensInFuture && !closesInPast;
  const isComingSoon = opensInFuture;
  const isEnded = !isComingSoon && !isDrawn && (c.status === "closed" || c.status === "sold_out" || closesInPast);
  const showBanner = isComingSoon || isDrawn || isEnded;
  const bannerTitle = isComingSoon ? "Coming Soon" : isDrawn ? "Competition Drawn" : "Ended";
  const bannerSub = isComingSoon ? "Opens soon" : isDrawn ? (c.winner_entry_id ? "Winner published" : "Winner pending") : "Entries closed";
  const isFree = Number(c.ticket_price) === 0;
  const ctaLabel = isLiveEnterable ? (isFree ? "Enter free" : "Enter now") : isDrawn ? "View result" : isSoldOut ? "Sold out" : c.status === "closed" || closesInPast ? "Entries closed" : "View competition";
  const cashAlt = formatCashAlternative(c.cash_alternative);
  const lowStock = isLiveEnterable && sold >= 80;

  return (
    <>
      <Link
        href={`/competitions/${c.slug}`}
        className="group relative flex flex-col td-public-card rim-glow overflow-hidden rounded-xl md:hover:-translate-y-1 md:hover:shadow-deep transition-transform duration-300 will-change-transform"
      >
        <div className="relative overflow-hidden ring-1 ring-inset ring-[color:var(--td-border-subtle)]">
          <SafePrizeImage
            url={competitionCardImageUrl(c)}
            alt={c.title}
            aspect="aspect-square"
            priority={priority}
            width={360}
            height={360}
            imgClassName="transition-transform duration-500 ease-out [@media(hover:hover)]:md:group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:transform-none"
          />
          <div className="absolute top-2.5 right-2.5 flex flex-col items-end gap-1.5">
            {maxDiscountPct ? <span className="gold-chip">Save {maxDiscountPct}%</span> : null}
            {badge && !showBanner && (
              <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-md ${toneCls}`}>{badge}</span>
            )}
          </div>
          <div className="absolute left-2.5 bottom-2.5">
            {isFree ? <span className="free-chip">Free to play</span> : <span className="price-chip font-mono-num text-sm">{formatMoney(c.ticket_price)}</span>}
          </div>
          {isLiveEnterable && (
            <div className="absolute right-2.5 bottom-2.5">
              <CountdownPill closesAt={c.closes_at} tone={lowStock ? "warning" : "default"} prefix="" />
            </div>
          )}
          {showBanner && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-3">
              <div className="td-image-overlay absolute inset-0" />
              <div className={`relative w-[92%] rounded-lg border backdrop-blur-md px-3 py-2 text-center shadow-[0_8px_30px_-8px_rgba(0,0,0,0.6)] ${isComingSoon ? "bg-info/15 border-info/40 ring-1 ring-info/20" : isDrawn ? "bg-gold/10 border-gold/40 ring-1 ring-gold/15" : "bg-[color:var(--td-surface-hover)] border-[color:var(--td-border-strong)] ring-1 ring-[color:var(--td-border-muted)]"}`}>
                <div className={`font-display font-extrabold uppercase tracking-[0.18em] text-[12px] sm:text-sm leading-tight whitespace-nowrap ${isComingSoon ? "text-info" : isDrawn ? "text-gold" : "text-silver"}`}>{bannerTitle}</div>
                <div className="mt-0.5 text-[10px] sm:text-[11px] uppercase tracking-wider text-[color:var(--td-text-muted)] whitespace-nowrap">{bannerSub}</div>
              </div>
            </div>
          )}
        </div>
        <div className="td-public-card-section relative p-4 flex-1 flex flex-col gap-3">
          <div className="min-h-[1.1rem] text-[10px] font-extrabold uppercase tracking-[0.14em] text-gold/90 truncate">
            {cashAlt ? <>CASH ALT: <span className="font-mono-num text-[color:var(--td-text)]">{cashAlt}</span></> : <span className="text-[color:var(--td-text-faint)]">No cash alternative</span>}
          </div>
          <h3 className="font-display font-bold text-[color:var(--td-text)] text-[15px] leading-snug line-clamp-2 min-h-[2.6rem] tracking-tight">{c.title}</h3>
          {isDrawn ? (
            <div className="flex flex-col gap-1">
              <div className="text-left text-[10px] font-extrabold uppercase tracking-[0.18em] text-gold/90">Result</div>
              <div className="h-[56px] flex flex-col items-center justify-center gap-0.5 rounded-md border border-gold/40 bg-gradient-to-b from-black/50 to-black/30 backdrop-blur-md p-1 text-center shadow-[inset_0_0_0_1px_hsl(var(--gold)/0.15),0_4px_18px_-6px_hsl(var(--gold)/0.35)]">
                <span className="font-display font-extrabold text-white text-[16px] leading-none uppercase tracking-[0.14em]">Winner Chosen</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-gold leading-none">{c.winner_entry_id ? "Verifying" : "Pending"}</span>
              </div>
            </div>
          ) : isComingSoon ? <CountdownStrip target={c.opens_at} label="Opens in" /> : isEnded ? (
            <div className="flex flex-col gap-1">
              <div className="text-left text-[10px] font-extrabold uppercase tracking-[0.18em] text-silver/90">Status</div>
              <div className="h-[56px] flex items-center justify-center rounded-md border border-silver/30 bg-gradient-to-b from-black/50 to-black/30 backdrop-blur-md p-1 text-center shadow-[inset_0_0_0_1px_hsl(0_0%_100%/0.06),0_4px_18px_-6px_hsl(0_0%_100%/0.25)]">
                <span className="font-display font-extrabold text-white text-[16px] leading-none uppercase tracking-[0.14em]">{c.status === "sold_out" ? "Sold Out" : "Entries Closed"}</span>
              </div>
            </div>
          ) : <CountdownStrip closesAt={c.closes_at} label="Closes in" />}
          <div className="td-stat-panel rounded-lg shadow-[0_0_0_1px_hsl(var(--info)/0.08),0_0_12px_-4px_hsl(var(--info)/0.45)] px-2.5 sm:px-3 py-2.5 min-w-0 overflow-hidden flex flex-col gap-1 sm:gap-1.5">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <span className="font-bold uppercase tracking-wide sm:tracking-wider text-info/80 text-[10px] sm:text-[11px] truncate min-w-0"><span className="sm:hidden">Ticket</span><span className="hidden sm:inline">Ticket price</span></span>
              <span className="font-mono-num font-extrabold text-[color:var(--td-text)] text-[11px] sm:text-[12px] shrink-0 whitespace-nowrap">{isFree ? "Free" : formatMoney(c.ticket_price)}</span>
            </div>
            <div className="flex items-center justify-between gap-2 min-w-0">
              <span className={`font-bold uppercase tracking-wide sm:tracking-wider text-[10px] sm:text-[11px] truncate min-w-0 ${lowStock ? "text-warning/90" : "text-info/80"}`}>Tickets sold</span>
              <span className={`font-mono-num font-extrabold text-[11px] sm:text-[12px] shrink-0 whitespace-nowrap ${lowStock ? "text-warning" : "text-[color:var(--td-text)]"}`}>{soldLabel}</span>
            </div>
            <div className="flex items-center justify-between gap-2 min-w-0 pt-0.5">
              <span className="font-bold uppercase tracking-wide sm:tracking-wider text-info/70 text-[10px] sm:text-[11px] truncate min-w-0">Max tickets</span>
              <span className="font-mono-num font-extrabold text-[color:var(--td-text-muted)] text-[10px] sm:text-[11px] shrink-0 whitespace-nowrap">{Number(c.max_entries || 0).toLocaleString()}</span>
            </div>
            <ProgressBar value={sold} tone={lowStock ? "warning" : "primary"} thickness="sm" showShimmer={isLiveEnterable} className="mt-0.5" />
          </div>
          {isComingSoon ? (
            <div className="mt-auto w-full inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-info/40 bg-info/15 text-xs font-extrabold uppercase tracking-wider text-info shadow-[0_0_18px_-6px_hsl(var(--info)/0.6)]">
              Coming soon
            </div>
          ) : (
            <button className={`mt-auto w-full inline-flex items-center justify-center gap-1.5 font-extrabold uppercase tracking-wider text-xs h-10 rounded-lg transition ${isDrawn ? "btn-ghost-rim border-gold/40 text-gold" : isSoldOut ? "btn-ghost-rim text-silver" : c.status === "closed" || closesInPast ? "btn-ghost-rim td-muted" : isFree ? "btn-free-glow" : "btn-primary-glow"}`}>
              {ctaLabel}{isLiveEnterable && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </Link>
    </>
  );
}

export const CompetitionCard = memo(CompetitionCardBase);
