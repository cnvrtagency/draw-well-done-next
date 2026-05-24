"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, CalendarClock, Clock, Flag, Sparkles } from "lucide-react";
import type { Competition } from "@/types/db";
import { CompetitionCard } from "@/components/CompetitionCard";
import { COMPETITION_SELECT } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

type TabKey = "live" | "ending" | "ended" | "soon";
const TABS: { key: TabKey; label: string }[] = [
  { key: "live", label: "Live" },
  { key: "ending", label: "Ending Soon" },
  { key: "soon", label: "Coming Soon" },
  { key: "ended", label: "Ended" },
];

function browserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  return createClient(url, anon);
}

export function PrizeDrops() {
  const [data, setData] = useState<Partial<Record<TabKey, Competition[]>>>({});
  const [loading, setLoading] = useState<Partial<Record<TabKey, boolean>>>({});
  const [active, setActive] = useState<TabKey>("live");

  const fetchBucket = useCallback(async (tab: TabKey) => {
    const supabase = browserSupabase();
    if (!supabase) {
      setData((current) => ({ ...current, [tab]: [] }));
      return;
    }
    const nowIso = new Date().toISOString();
    const in7d = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    setLoading((current) => ({ ...current, [tab]: true }));
    let query = supabase.from("competitions").select(COMPETITION_SELECT).is("archived_at", null);
    if (tab === "live") query = query.eq("status", "live").or(`opens_at.is.null,opens_at.lte.${nowIso}`).or(`closes_at.is.null,closes_at.gt.${nowIso}`).order("closes_at", { ascending: true, nullsFirst: false }).limit(8);
    else if (tab === "ending") query = query.eq("status", "live").or(`opens_at.is.null,opens_at.lte.${nowIso}`).gt("closes_at", nowIso).lte("closes_at", in7d).order("closes_at", { ascending: true }).limit(8);
    else if (tab === "ended") query = query.or(`status.in.(closed,drawn,sold_out),and(status.eq.live,closes_at.lt.${nowIso})`).order("draw_at", { ascending: false, nullsFirst: false }).order("closes_at", { ascending: false }).limit(8);
    else query = query.eq("status", "live").gt("opens_at", nowIso).order("opens_at", { ascending: true }).limit(8);
    const { data: rows } = await query;
    setData((current) => ({ ...current, [tab]: ((rows as unknown) as Competition[]) || [] }));
    setLoading((current) => ({ ...current, [tab]: false }));
  }, []);

  useEffect(() => {
    if (data[active] || loading[active]) return;
    fetchBucket(active);
  }, [active, data, fetchBucket, loading]);

  const items = data[active] ?? null;
  return (
    <section className="relative isolate overflow-hidden pt-6 pb-8 md:pt-8 md:pb-10">
      <div className="container mx-auto px-4 relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-6 md:mb-8">
            <div>
              <div className="flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary"><span>In it to win it</span><span aria-hidden className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-primary/60 to-transparent" /></div>
              <h2 className="font-display text-3xl md:text-4xl font-bold td-text tracking-tight mt-3">Play to win</h2>
            </div>
            <Link href="/competitions" className="hidden md:inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider td-muted hover:text-primary transition">View all <ArrowRight className="w-4 h-4" /></Link>
          </div>
          <div className="-mx-4 px-4 md:mx-0 md:px-0 overflow-x-auto mb-6 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div role="tablist" className="td-tab-list inline-flex gap-2 p-1 rounded-2xl backdrop-blur-xl">
              {TABS.map((t) => {
                const isActive = active === t.key;
                const count = data[t.key]?.length ?? 0;
                return <button key={t.key} role="tab" aria-selected={isActive} onClick={() => setActive(t.key)} className={`relative inline-flex items-center gap-2 whitespace-nowrap px-4 h-10 rounded-xl font-display text-[12.5px] font-bold uppercase tracking-[0.06em] transition snap-start ${isActive ? "td-tab-active" : "td-tab"}`}><span>{t.label}</span>{count > 0 && <span className={`text-[10px] font-mono-num font-bold px-1.5 py-0.5 rounded-md ${isActive ? "bg-primary/30 text-white" : "td-badge-muted"}`}>{count}</span>}</button>;
              })}
            </div>
          </div>
          {items === null ? (
            <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">{Array.from({ length: 10 }).map((_, i) => <div key={i} className="td-public-card aspect-[3/4] animate-pulse rounded-2xl" />)}</div>
          ) : items.length === 0 ? <EmptyTab tab={active} /> : (
            <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {items.map((c) => <CompetitionCard key={c.id} c={c} tone={active === "ended" ? "purple" : active === "soon" ? "blue" : "red"} />)}
            </div>
          )}
          <div className="mt-8 flex justify-center md:hidden"><Link href="/competitions" className="inline-flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider td-muted hover:text-primary transition">View all competitions <ArrowRight className="w-4 h-4" /></Link></div>
        </div>
      </div>
    </section>
  );
}

function EmptyTab({ tab }: { tab: TabKey }) {
  const map = {
    live: { icon: Sparkles, title: "No live competitions right now.", body: "New prize drops are being prepared. Check back shortly." },
    ending: { icon: Clock, title: "No competitions are closing soon.", body: "Nothing is closing in the next 7 days." },
    ended: { icon: Flag, title: "No completed competitions yet.", body: "Recently ended draws will appear here." },
    soon: { icon: CalendarClock, title: "Upcoming prize drops will appear here soon.", body: "Scheduled competitions will show up here as soon as they're announced." },
  }[tab];
  const Icon = map.icon;
  return (
    <div className="td-public-card rim-glow p-10 md:p-14 flex flex-col items-center text-center gap-4 rounded-2xl">
      <span className="w-12 h-12 grid place-items-center rounded-xl bg-primary/10 border border-primary/20 text-primary shadow-glow-soft"><Icon className="w-5 h-5" /></span>
      <h3 className="font-display text-lg md:text-xl font-bold td-text tracking-tight">{map.title}</h3>
      <p className="text-sm td-muted max-w-md">{map.body}</p>
    </div>
  );
}
