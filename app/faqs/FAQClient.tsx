"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Inbox, LifeBuoy, Search } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

type FaqItem = { id: string; category: string; question: string; answer: string; sort_order: number };
const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "getting_started", label: "Getting started" },
  { key: "entries_tickets", label: "Entries & tickets" },
  { key: "payments_wallet", label: "Payments & wallet" },
  { key: "free_postal_entry", label: "Free postal entry" },
  { key: "draws_winners", label: "Draws & winners" },
  { key: "prize_claims", label: "Prize claims" },
  { key: "account_responsible_play", label: "Account & responsible play" },
];
const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(CATEGORIES.filter((c) => c.key !== "all").map((c) => [c.key, c.label]));

export function FAQClient({ items }: { items: FaqItem[] }) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((it) => (activeCategory === "all" || it.category === activeCategory) && (!q || it.question.toLowerCase().includes(q) || it.answer.toLowerCase().includes(q)));
  }, [items, search, activeCategory]);
  const grouped = useMemo(() => {
    const map = new Map<string, FaqItem[]>();
    for (const it of filtered) {
      if (!map.has(it.category)) map.set(it.category, []);
      map.get(it.category)!.push(it);
    }
    return CATEGORIES.filter((c) => c.key !== "all").flatMap((c) => {
      const arr = map.get(c.key);
      return arr?.length ? [{ category: c.key, items: arr }] : [];
    });
  }, [filtered]);
  return (
    <section className="container mx-auto px-4 pb-16 md:pb-20">
      <div className="max-w-xl relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 td-soft" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search questions and answers" aria-label="Search the help centre" className="td-input w-full rounded-md border td-border pl-9 pr-3 h-11 placeholder:text-[color:var(--td-text-faint)]" />
      </div>
      <div className="-mx-4 px-4 overflow-x-auto no-scrollbar mb-6">
        <div className="flex gap-2 min-w-max">
          {CATEGORIES.map((c) => <button key={c.key} onClick={() => setActiveCategory(c.key)} className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-wider transition ${activeCategory === c.key ? "td-tab-active" : "td-tab"}`}>{c.label}</button>)}
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="td-public-card p-10 text-center rounded-2xl"><Inbox className="w-6 h-6 mx-auto td-faint mb-3" /><div className="font-display text-lg font-bold td-text">No matching answers</div><p className="text-sm td-soft mt-1">Try a different search or category.</p></div>
      ) : (
        <div className="space-y-8">
          {grouped.map(({ category, items }) => (
            <div key={category}>
              {activeCategory === "all" && <div className="text-[11px] font-extrabold uppercase tracking-[0.22em] text-primary/90 mb-3 px-1">{CATEGORY_LABEL[category]}</div>}
              <div className="td-public-card rim-glow rounded-2xl overflow-hidden">
                <Accordion type="single" collapsible className="flex flex-col divide-y divide-[color:var(--td-border-muted)]">
                  {items.map((it) => <AccordionItem key={it.id} value={it.id} className="border-0 data-[state=open]:bg-primary/[0.04] transition-colors"><AccordionTrigger className="group px-5 md:px-7 py-5 md:py-6 text-left td-text hover:no-underline [&>svg]:text-primary [&>svg]:w-5 [&>svg]:h-5"><span className="flex items-center gap-3.5 min-w-0"><span aria-hidden className="w-1 h-7 rounded-full bg-primary/40 group-data-[state=open]:bg-primary group-data-[state=open]:shadow-[0_0_10px_hsl(var(--primary)/0.7)] transition" /><span className="font-display text-[15.5px] md:text-[17px] font-bold tracking-tight leading-snug">{it.question}</span></span></AccordionTrigger><AccordionContent className="px-5 md:px-7 pb-6 md:pb-7 pt-0 text-[14.5px] md:text-[15.5px] td-muted leading-[1.7]"><div className="pl-4 ml-0.5 border-l-2 border-primary/30 max-w-[68ch] whitespace-pre-line">{it.answer}</div></AccordionContent></AccordionItem>)}
                </Accordion>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="td-public-card mt-10 p-6 md:p-8 text-center rounded-2xl">
        <span className="inline-grid place-items-center w-11 h-11 rounded-xl bg-primary/15 border border-primary/30 text-primary mb-3"><LifeBuoy className="w-5 h-5" /></span>
        <h2 className="font-display text-xl md:text-2xl font-bold td-text">Still need help?</h2>
        <p className="text-sm td-muted mt-2 max-w-md mx-auto">Our support team can help with account, entry and prize claim questions.</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2"><Button asChild className="btn-primary-glow font-bold uppercase tracking-wider"><Link href="/contact">Contact support</Link></Button><Button asChild variant="outline" className="border-[color:var(--td-border-strong)] text-[color:var(--td-text)] bg-transparent hover:bg-[color:var(--td-surface-hover)]"><Link href="/account/responsible-play">Responsible play</Link></Button></div>
      </div>
    </section>
  );
}
