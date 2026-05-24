"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, BellRing, ChevronLeft, ListOrdered, ShieldCheck, Sparkles, Target, Timer } from "lucide-react";
import type { Competition, CompetitionDiscountTier } from "@/types/db";
import type { DynamicContentSection, PublicWinner } from "@/lib/public-data";
import { CompetitionImageGallery } from "@/components/CompetitionImageGallery";
import { CompetitionMarquee } from "@/components/CompetitionMarquee";
import { EntryQuantitySelector, computePricing } from "@/components/EntryQuantitySelector";
import { FreeEntryNotice } from "@/components/FreeEntryNotice";
import { Panel } from "@/components/Panel";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { CountdownPill } from "@/components/ui/CountdownPill";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { competitionDetailImageUrl } from "@/lib/competitionImages";
import { effectiveRemaining, effectiveSoldCount, formatMoney, publicEntryPercent } from "@/lib/format";
import { formatCashAlternative } from "@/lib/cashAlternative";
import { useBasket } from "@/hooks/useBasket";
import { useMounted } from "@/hooks/useMounted";

function drawCountdownLabel(sourceIso: string | null | undefined) {
  if (!sourceIso) return null;
  const ms = new Date(sourceIso).getTime() - Date.now();
  if (ms <= 0) return null;
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${d}D ${String(h).padStart(2, "0")}H ${String(m).padStart(2, "0")}M ${String(s).padStart(2, "0")}S`;
}

export function CompetitionDetailClient({
  competition: c,
  tiers,
  winner,
  marquee,
}: {
  competition: Competition;
  tiers: CompetitionDiscountTier[];
  winner: PublicWinner | null;
  marquee: DynamicContentSection | null;
}) {
  const [qty, setQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [added, setAdded] = useState(false);
  const [drawCountdown, setDrawCountdown] = useState<string | null>(null);
  const [drawExpired, setDrawExpired] = useState(false);
  const { add, openDrawer } = useBasket();
  const mounted = useMounted();

  const opensSoonTarget = mounted && c.opens_at && new Date(c.opens_at).getTime() > Date.now() ? c.opens_at : null;
  useEffect(() => {
    const sourceIso = opensSoonTarget ?? c.draw_at;
    if (!sourceIso) {
      setDrawCountdown(null);
      setDrawExpired(false);
      return;
    }
    const target = new Date(sourceIso).getTime();
    function tick() {
      const label = drawCountdownLabel(sourceIso);
      setDrawCountdown(label);
      setDrawExpired(target - Date.now() <= 0);
    }
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [c.draw_at, opensSoonTarget]);

  const reserved = Math.max(0, Number(c.manual_reserved_entries) || 0);
  const effectiveSold = effectiveSoldCount(c.current_entries, reserved, c.max_entries);
  const remaining = effectiveRemaining(c.current_entries, reserved, c.max_entries);
  const sold = publicEntryPercent(effectiveSold, c.max_entries);
  const opensInFuture = mounted && !!c.opens_at && new Date(c.opens_at).getTime() > Date.now();
  const closesInPast = mounted && !!c.closes_at && new Date(c.closes_at).getTime() <= Date.now();
  const isComingSoon = opensInFuture && c.status !== "drawn" && c.status !== "archived";
  const sortedTiers = useMemo(() => [...tiers].sort((a, b) => a.min_quantity - b.min_quantity), [tiers]);
  const closed = c.status !== "live" || remaining === 0 || isComingSoon || closesInPast;
  const isLive = c.status === "live" && remaining > 0 && !isComingSoon && !closesInPast;
  const cashAlt = formatCashAlternative(c.cash_alternative);
  const detailImageUrl = competitionDetailImageUrl(c);
  const ticketPriceLabel = Number(c.ticket_price) > 0 ? `${formatMoney(Number(c.ticket_price))} per ticket` : "Free to enter";
  const maxTicketsLabel = Number(c.max_entries) > 0 ? `Max ${Number(c.max_entries).toLocaleString()} tickets` : null;
  const ctaLabel = c.status === "drawn" ? "View result"
    : c.status === "sold_out" ? "Sold out"
    : c.status === "closed" || closesInPast ? "Entries closed"
    : remaining === 0 ? "Sold out" : "Add to basket";
  const allocatedPctLabel = (() => {
    const max = Math.max(0, Number(c.max_entries) || 0);
    if (max <= 0 || effectiveSold <= 0) return "0%";
    const real = (effectiveSold / max) * 100;
    if (real < 1) return "<1%";
    return `${Math.min(100, Math.floor(real))}%`;
  })();
  const cleanDescription = c.description ?? "";
  const pillBase = "inline-flex items-center gap-1.5 font-mono-num text-[10px] md:text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-md backdrop-blur-md border";
  const pricePill = "bg-gold/15 text-gold border-gold/40 shadow-[0_4px_18px_-6px_hsl(var(--gold)/0.5)]";
  const maxPill = "bg-primary/15 text-primary border-primary/40 shadow-[0_4px_18px_-6px_hsl(var(--primary)/0.5)]";
  const dotBase = "w-1.5 h-1.5 rounded-full animate-glow-pulse";

  function enter() {
    if (!isLive) return;
    setSubmitting(true);
    try {
      add(c.id, qty);
      openDrawer();
      setAdded(true);
      window.setTimeout(() => setAdded(false), 2500);
    } finally {
      setSubmitting(false);
    }
  }

  const notifyPanel = (
    <div className="flex flex-col gap-3 glass-panel-strong p-5 min-w-0">
      <div className="relative overflow-hidden rounded-xl border border-info/40 bg-gradient-to-br from-info/15 via-info/5 to-transparent p-5 shadow-[0_0_30px_-12px_hsl(var(--info)/0.6)]">
        <div className="font-display text-xl sm:text-2xl font-extrabold td-text leading-tight uppercase tracking-wide">
          Entries open soon
        </div>
        <p className="mt-3 text-[14px] td-text leading-[1.6]">
          This competition isn&apos;t open yet. Add your email and we&apos;ll send you one notification the moment it goes live.
        </p>
        {c.opens_at && <div className="mt-4 text-[12px] font-extrabold uppercase tracking-[0.14em] text-info">Opens {new Date(c.opens_at).toLocaleString()}</div>}
      </div>
      <Button type="button" className="w-full h-11 text-[13px] uppercase tracking-wider font-extrabold bg-primary hover:bg-primary/90 shadow-glow-soft">
        <BellRing className="w-4 h-4" /> Tell me when it&apos;s live
      </Button>
    </div>
  );

  const entryPanel = (
    <div className="flex flex-col gap-3 glass-panel-strong p-5 min-w-0">
      {c.status !== "live" && (
        <div className="text-xs rounded-md border td-border bg-[color:var(--td-surface-muted)] td-muted p-2">
          {c.status === "drawn" ? "This competition has been drawn. Entries are closed." : c.status === "sold_out" ? "All entries have been sold. Entries are closed." : "Entries are closed for this competition."}
        </div>
      )}
      <div className="relative overflow-hidden rounded-xl border border-primary/40 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-3.5 shadow-[0_0_30px_-12px_hsl(var(--primary)/0.6)]">
        <div className="absolute inset-0 pointer-events-none opacity-40 [background:radial-gradient(circle_at_top_right,hsl(var(--primary)/0.25),transparent_60%)]" />
        <div className="relative">
          <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-info flex items-center gap-1.5">
            <ShieldCheck className="w-3 h-3" /> Capped ticket pool
          </div>
          <div className="mt-1.5 font-display text-xl sm:text-2xl font-extrabold td-text leading-tight flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
            <span>ONLY</span>
            <span className="font-mono-num text-info">{Number(c.max_entries).toLocaleString()}</span>
            <span>TICKETS</span>
            <span className="flex items-center gap-2">
              <span>AVAILABLE</span>
              <span className="hidden sm:inline-block h-px w-10 bg-gradient-to-r from-info/70 to-transparent" />
            </span>
          </div>
          <div className="mt-3 space-y-1.5">
            <ProgressBar value={sold} thickness="sm" showShimmer={c.status === "live"} />
            <div className="flex items-center justify-between gap-3 text-[13px] font-black uppercase tracking-[0.06em] td-text leading-tight">
              <span><span className="font-mono-num">{effectiveSold.toLocaleString()}</span> sold from <span className="font-mono-num">{Number(c.max_entries).toLocaleString()}</span> ticket cap</span>
              <span className="font-mono-num text-info">{allocatedPctLabel}</span>
            </div>
          </div>
        </div>
      </div>

      <EntryQuantitySelector
        ticketPrice={Number(c.ticket_price)}
        remaining={remaining}
        maxEntries={c.max_entries}
        perUserLimit={c.per_user_entry_limit}
        tiers={sortedTiers}
        disabled={closed}
        submitting={submitting}
        ctaLabel={ctaLabel}
        isLive={isLive}
        value={qty}
        onChange={setQty}
        onSubmit={enter}
      />
      {added ? <div className="rounded-md border border-success/40 bg-success/10 p-2 text-xs font-bold text-success">Added to basket. Basket data is stored in the Vite-compatible localStorage format.</div> : null}
      <FreeEntryNotice compact />

      <div className="mt-5 rounded-2xl border border-primary/20 bg-[color:var(--td-surface-soft)]">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="cap" className="td-border">
            <AccordionTrigger className="px-4 py-4 text-sm font-bold td-text hover:no-underline">
              <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-info" />Why ticket caps matter</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-5 pt-3 td-text">
              <div className="space-y-3">
                <p className="text-[13px] leading-relaxed td-muted">Every TopDraw competition shows the maximum ticket cap upfront, so you can see the size of the draw before you enter.</p>
                <div className="rounded-lg border border-info/25 bg-info/[0.06] px-3 py-2.5 flex items-center justify-between gap-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-info">This competition</span>
                  <span className="flex items-baseline gap-1.5"><span className="font-mono-num font-extrabold td-text text-sm">{Number(c.max_entries).toLocaleString()}</span><span className="text-[12px] td-soft">ticket cap</span></span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="how-to-play" className="td-border">
            <AccordionTrigger className="px-4 py-4 text-sm font-bold td-text hover:no-underline">
              <span className="flex items-center gap-2"><ListOrdered className="w-4 h-4 text-info" />How to play</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-5 pt-3 td-text">
              <div className="space-y-3">
                <p className="text-[13px] leading-relaxed td-muted">Choose how many tickets you want, add them to your basket and complete checkout securely. Your ticket numbers are issued after payment and saved to your account.</p>
                <ol className="rounded-lg border border-info/25 bg-info/[0.06] divide-y divide-white/5 overflow-hidden">
                  {["Pick your tickets", "Complete checkout", "Ticket numbers issued"].map((step, i) => (
                    <li key={step} className="flex items-center gap-3 px-3 py-2.5">
                      <span className="grid place-items-center w-5 h-5 rounded-full bg-info/20 border border-info/40 text-[10px] font-extrabold text-info shrink-0">{i + 1}</span>
                      <span className="text-[13px] td-muted">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="chance" className="td-border">
            <AccordionTrigger className="px-4 py-4 text-sm font-bold td-text hover:no-underline">
              <span className="flex items-center gap-2"><Target className="w-4 h-4 text-info" />How estimated chance works</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-5 pt-3 td-text">
              <div className="space-y-3">
                <p className="text-[13px] leading-relaxed td-muted">Estimated chance is based on your selected tickets and the maximum ticket cap. Final chances may vary depending on valid paid and free postal entries.</p>
                {qty > 0 && c.max_entries > 0 && (
                  <div className="rounded-lg border td-border bg-[color:var(--td-surface-soft)] px-3 py-2.5 flex items-center justify-between">
                    <span className="text-[12px] td-muted">Your current estimate</span>
                    <span className="font-mono-num font-extrabold td-text text-sm">1 in {Math.ceil(c.max_entries / qty).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="promise" className="border-b-0">
            <AccordionTrigger className="px-4 py-4 text-sm font-bold td-text hover:no-underline">
              <span className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-info" />The TopDraw Promise</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-5 pt-3 td-text">
              <ul className="rounded-lg border td-border bg-[color:var(--td-surface-soft)] divide-y divide-[color:var(--td-border-muted)] overflow-hidden">
                {["Ticket caps shown upfront", "Free postal entry route", "Secure checkout", "Winners published", "18+ UK only"].map((label) => (
                  <li key={label} className="flex items-center gap-3 px-3 py-2.5">
                    <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-[13px] td-muted">{label}</span>
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );

  const winnerCard = c.status === "drawn" ? (
    <Panel variant="glass" tone="gold" as="section" className="p-5">
      <div className="eyebrow mb-1">Draw result</div>
      <h2 className="text-xl font-bold td-text">Winner</h2>
      {winner ? (
        <div className="mt-3 flex items-start gap-4">
          {winner.image_url && <img src={winner.image_url} alt="" decoding="async" className="w-20 h-20 rounded-lg object-cover border td-border" loading="lazy" />}
          <div className="text-sm td-muted space-y-1">
            <div className="font-bold td-text">{winner.display_name}</div>
            {winner.display_location && <div className="td-soft">{winner.display_location}</div>}
            {winner.winning_ticket_number && <div className="td-muted">Winning ticket #{winner.winning_ticket_number}</div>}
            <div className="td-soft">Drawn {new Date(winner.draw_date).toLocaleString()}</div>
            {winner.testimonial && <p className="td-muted italic mt-2">“{winner.testimonial}”</p>}
            {winner.proof_url && <a href={winner.proof_url} target="_blank" rel="noreferrer" className="text-primary font-semibold inline-block mt-1">View draw proof →</a>}
          </div>
        </div>
      ) : (
        <p className="text-sm td-muted mt-2">Draw completed. Winner under review.</p>
      )}
    </Panel>
  ) : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-10">
      <div className="flex items-center gap-3 flex-wrap text-xs mb-4">
        <Link href="/competitions" className="inline-flex items-center gap-1 td-soft hover:text-[color:var(--td-text)] font-bold uppercase tracking-wider">
          <ChevronLeft className="w-3.5 h-3.5" /> Competitions
        </Link>
        <span className="td-faint">·</span>
        <div className="eyebrow !mb-0">{c.category ?? "Prize competition"}</div>
      </div>

      <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(380px,0.85fr)] gap-6 xl:gap-8 items-start">
        <div className="xl:hidden order-first min-w-0">
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold td-text tracking-tight text-balance leading-tight break-words max-w-full mb-4">{c.title}</h1>
          {c.short_description && (
            <>
              <div className="h-px bg-gradient-to-r from-primary/40 via-white/10 to-transparent" />
              <p className="td-muted py-4 text-sm leading-relaxed text-balance">{c.short_description}</p>
              <div className="h-px bg-gradient-to-r from-primary/40 via-white/10 to-transparent" />
            </>
          )}
          {isLive && (
            <div className="mt-4 flex flex-wrap items-center gap-2 min-w-0">
              <CountdownPill closesAt={c.closes_at} />
              <span className={`${pillBase} ${pricePill}`}><span className={`${dotBase} bg-gold`} />{ticketPriceLabel}</span>
              {maxTicketsLabel && <span className={`${pillBase} ${maxPill}`}><span className={`${dotBase} bg-primary`} />{maxTicketsLabel}</span>}
            </div>
          )}
        </div>

        <div className="min-w-0 self-start flex flex-col gap-4 xl:gap-5">
          <CompetitionImageGallery mainImageUrl={detailImageUrl} galleryImageUrls={c.gallery_image_urls} title={c.title} priority />
          {marquee?.is_enabled && marquee.content_text?.trim() && (
            <div className="xl:hidden">
              <CompetitionMarquee text={marquee.content_text} enabled={marquee.is_enabled} />
            </div>
          )}
          {cleanDescription && (
            <Panel variant="glass" className="hidden xl:block p-5 mt-1">
              <div className="eyebrow mb-2 flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> About this prize</div>
              <p className="whitespace-pre-line text-sm leading-relaxed td-muted">{cleanDescription}</p>
            </Panel>
          )}
        </div>

        <aside className="self-start min-w-0 flex flex-col gap-5">
          <div className="hidden xl:block">
            <h1 className="font-display text-4xl 2xl:text-5xl font-bold td-text tracking-tight text-balance leading-tight break-words max-w-full mb-4">{c.title}</h1>
            {c.short_description && (
              <>
                <div className="h-px bg-gradient-to-r from-primary/40 via-white/10 to-transparent" />
                <p className="td-muted py-4 text-sm leading-relaxed">{c.short_description}</p>
                <div className="h-px bg-gradient-to-r from-primary/40 via-white/10 to-transparent" />
              </>
            )}
            {isLive && (
              <div className="mt-4 flex flex-wrap items-center gap-2 min-w-0">
                <CountdownPill closesAt={c.closes_at} />
                <span className={`${pillBase} ${pricePill}`}><span className={`${dotBase} bg-gold`} />{ticketPriceLabel}</span>
                {maxTicketsLabel && <span className={`${pillBase} ${maxPill}`}><span className={`${dotBase} bg-primary`} />{maxTicketsLabel}</span>}
              </div>
            )}
          </div>

          <div className="rounded-2xl border td-border bg-[color:var(--td-surface-soft)] backdrop-blur-sm overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-3 sm:divide-x divide-y sm:divide-y-0 divide-[color:var(--td-border-muted)]">
              <div className="p-3 sm:p-4"><div className="text-[10px] font-extrabold uppercase tracking-wider td-soft">Prize value</div><div className="font-mono-num font-extrabold text-base sm:text-lg td-text mt-1 leading-none">{formatMoney(c.prize_value)}</div></div>
              <div className="p-3 sm:p-4"><div className="text-[10px] font-extrabold uppercase tracking-wider td-soft">Ticket price</div><div className="font-mono-num font-extrabold text-base sm:text-lg td-text mt-1 leading-none">{formatMoney(c.ticket_price)}</div></div>
              <div className="p-3 sm:p-4"><div className="text-[10px] font-extrabold uppercase tracking-wider td-soft">Cash alternative</div><div className="font-mono-num font-extrabold text-base sm:text-lg td-text mt-1 leading-none">{cashAlt ?? <span className="td-soft font-bold text-sm">Not available</span>}</div></div>
            </div>
            <div className="relative border-t td-border p-3 sm:p-4 overflow-hidden bg-gradient-to-r from-info/[0.08] via-transparent to-transparent">
              <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-info/60 via-info/20 to-transparent" />
              <div className="flex items-center gap-1.5 mb-2">
                <Timer className="w-3.5 h-3.5 text-info" />
                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-info">{isComingSoon ? "Opens in" : "Draw countdown"}</span>
              </div>
              {drawCountdown && !drawExpired ? (
                <div className="flex items-stretch gap-2">
                  {drawCountdown.split(" ").map((p, i) => (
                    <div key={i} className="flex-1 rounded-md border border-info/30 bg-info/[0.08] px-1 py-2 text-center shadow-[inset_0_1px_0_hsl(var(--info)/0.15)]">
                      <div className="font-mono-num font-extrabold text-[18px] sm:text-[22px] td-text leading-none glow-text">{p}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="font-mono-num font-extrabold text-[24px] td-text leading-none">{drawExpired ? "COMPETITION DRAWN" : "TBA"}</div>
              )}
            </div>
          </div>

          {marquee?.is_enabled && marquee.content_text?.trim() && (
            <div className="hidden xl:block">
              <CompetitionMarquee text={marquee.content_text} enabled={marquee.is_enabled} />
            </div>
          )}

          {isComingSoon ? notifyPanel : entryPanel}
          {cleanDescription && (
            <Panel variant="glass" className="xl:hidden p-5">
              <div className="eyebrow mb-2 flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> About this prize</div>
              <p className="whitespace-pre-line text-sm leading-relaxed td-muted">{cleanDescription}</p>
            </Panel>
          )}
        </aside>
      </section>

      <section className="mt-10 lg:mt-12 space-y-6">
        {winnerCard}
        {c.status !== "live" && (
          <Panel variant="outline" tone={c.status === "sold_out" ? "warning" : c.status === "drawn" ? "info" : "default"} className="p-3 text-sm td-muted">
            {c.status === "drawn" && "This competition has been drawn, see the result below."}
            {c.status === "sold_out" && "All entries for this competition have been sold."}
            {c.status === "closed" && "Entries are closed for this competition. The draw will be recorded shortly."}
            {c.status === "archived" && "This competition has been archived."}
          </Panel>
        )}
      </section>
    </div>
  );
}
