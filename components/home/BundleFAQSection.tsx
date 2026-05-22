"use client";

import Link from "next/link";
import { ArrowRight, ChevronRight, Layers, LifeBuoy, Lock, ShieldCheck, ShoppingBasket, Sparkles, Ticket } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQS = [
  ["What is TopDraw?", "TopDraw is a UK prize competition platform where you can enter online competitions for selected prizes. Each competition shows the ticket price, ticket cap, draw timing and any available cash alternative before you enter."],
  ["How do TopDraw competitions work?", "Choose a live competition, select your ticket quantity and complete checkout securely. Your ticket numbers are then shown in your account so you can keep track of your entries before the draw."],
  ["How are winners selected?", "Winners are selected through a recorded draw process after the competition closes. The winning ticket is reviewed before the result is published."],
  ["What does entry cap mean?", "Each competition displays its ticket cap upfront, so you can see the maximum number of tickets available for that prize before choosing whether to enter."],
  ["Is there a free postal entry route?", "Yes. Paid competitions include a free postal entry route. Valid postal entries are added to the same draw pool as paid tickets, provided the entry instructions and deadline are followed."],
  ["When are winners published?", "Confirmed winners are published on the TopDraw winners page shortly after each draw, using display-safe details such as a first name, initial or rough location."],
];

function BundleStackVisual() {
  const cards = ["left-4 top-10 rotate-[-7deg]", "left-14 top-4 rotate-[4deg]", "left-24 top-16 rotate-[10deg]"];
  return (
    <div aria-hidden className="relative mx-auto mt-5 h-[174px] w-full max-w-[270px] overflow-hidden rounded-2xl border border-primary/18 bg-[radial-gradient(80%_80%_at_50%_20%,hsl(204_100%_55%/0.16),transparent_68%),linear-gradient(145deg,hsl(0_0%_100%/0.055),hsl(204_100%_55%/0.025))] shadow-[0_24px_70px_-48px_hsl(var(--primary)/0.95),inset_0_1px_0_hsl(0_0%_100%/0.07)] md:mt-0 md:h-full md:min-h-[206px]">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-28 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-3xl" />
      {cards.map((cls, index) => (
        <div key={cls} className={`absolute h-[82px] w-[128px] rounded-2xl border border-primary/30 bg-[linear-gradient(145deg,hsl(222_34%_12%/0.98),hsl(222_40%_6%/0.94))] p-3 shadow-[0_18px_42px_-26px_hsl(204_100%_50%/0.9),inset_0_1px_0_hsl(0_0%_100%/0.09)] backdrop-blur-xl ${cls}`}>
          <div className="flex items-center justify-between"><span className="grid h-7 w-7 place-items-center rounded-lg border border-primary/30 bg-primary/14 text-primary">{index === 1 ? <Sparkles className="h-3.5 w-3.5" /> : <Ticket className="h-3.5 w-3.5" />}</span><span className="h-2 w-8 rounded-full bg-primary/25" /></div>
          <div className="mt-3 space-y-1.5"><span className="block h-1.5 w-20 rounded-full bg-white/18" /><span className="block h-1.5 w-14 rounded-full bg-white/10" /></div>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10"><span className={`block h-full rounded-full bg-gradient-to-r from-primary to-info ${index === 0 ? "w-2/5" : index === 1 ? "w-3/5" : "w-4/5"}`} /></div>
        </div>
      ))}
      <div className="absolute bottom-5 right-5 grid h-12 w-12 place-items-center rounded-2xl border border-primary/45 bg-primary/18 text-white shadow-[0_0_28px_-8px_hsl(204_100%_55%/0.95),inset_0_1px_0_hsl(0_0%_100%/0.10)]"><ShoppingBasket className="h-5 w-5 text-primary" /></div>
    </div>
  );
}

export function BundleFAQSection() {
  return (
    <section className="relative overflow-hidden pt-4 pb-8 md:pt-6 md:pb-12">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[24px] md:rounded-[30px] border border-white/[0.075] p-3 sm:p-4 md:p-5" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.035), rgba(14,165,233,0.025) 42%, rgba(255,255,255,0.018))", boxShadow: "0 0 0 1px rgba(56,189,248,0.035), 0 24px 80px -58px rgba(14,165,233,0.40), inset 0 1px 0 rgba(255,255,255,0.05)" }}>
            <div className="relative grid grid-cols-1 gap-4 lg:grid-cols-[1.12fr_0.88fr] lg:gap-5 items-stretch">
              <div className="relative flex min-w-0 flex-col overflow-hidden rounded-[24px] border border-primary/35 bg-[radial-gradient(120%_90%_at_0%_0%,hsl(204_100%_55%/0.15),transparent_58%),linear-gradient(145deg,hsl(222_34%_10%/0.9),hsl(222_42%_5%/0.78))] p-5 shadow-[0_0_0_1px_hsl(204_100%_60%/0.08),0_32px_92px_-48px_hsl(var(--primary)/0.95),inset_0_1px_0_hsl(0_0%_100%/0.09)] sm:p-6 md:p-8">
                <div className="relative grid gap-5 md:grid-cols-[minmax(0,1fr)_270px] md:items-center">
                  <div><span className="inline-flex items-center gap-1.5 self-start rounded-full border border-primary/45 bg-primary/15 px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.2em] text-primary shadow-[0_0_24px_-8px_hsl(204_100%_55%/0.9)]"><Layers className="w-3 h-3" /> Bundle Builder</span><h2 className="font-display mt-4 max-w-[500px] text-[1.85rem] font-bold leading-[0.98] tracking-tight text-white sm:text-[2.1rem] md:text-[2.65rem]">Create your own <span className="grad-text">prize bundle</span></h2><p className="mt-3 max-w-[470px] text-sm leading-snug text-white/84 md:text-base">Choose entries across live competitions, review your total and checkout once.</p></div>
                  <BundleStackVisual />
                </div>
                <div className="relative mt-6 overflow-hidden rounded-2xl border border-primary/28 bg-[linear-gradient(145deg,hsl(0_0%_100%/0.065),hsl(204_100%_55%/0.04))] p-4 shadow-[0_26px_72px_-46px_hsl(var(--primary)/0.9),inset_0_1px_0_hsl(0_0%_100%/0.075)] backdrop-blur-xl md:p-5">
                  <div className="relative flex items-center gap-3 mb-3"><span className="text-[10.5px] font-extrabold uppercase tracking-[0.22em] text-primary">How it works</span><span aria-hidden className="h-px flex-1 bg-gradient-to-r from-primary/50 to-transparent" /></div>
                  <ul className="relative flex flex-col gap-2">{["Pick multiple prize drops", "Add entries in one go", "Checkout once"].map((label, index) => <li key={label}><div className="group flex items-center gap-3 rounded-xl border border-primary/16 bg-[linear-gradient(135deg,hsl(0_0%_100%/0.07),hsl(204_100%_55%/0.035))] px-3.5 py-3 shadow-[0_12px_30px_-26px_hsl(var(--primary)/0.8),inset_0_1px_0_hsl(0_0%_100%/0.06)]"><span className="grid h-9 w-9 place-items-center rounded-xl border border-primary/55 bg-primary/20 font-mono-num text-sm font-bold text-white">{index + 1}</span><span className="font-display text-sm font-bold tracking-tight text-white/95 md:text-[15px]">{label}</span></div></li>)}</ul>
                </div>
                <div className="mt-4 grid gap-1.5 sm:grid-cols-3">{[{ icon: Sparkles, label: "Live competitions only" }, { icon: ShieldCheck, label: "Ticket caps still apply" }, { icon: Lock, label: "Secure checkout" }].map(({ icon: Icon, label }) => <span key={label} className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-primary/14 bg-primary/[0.055] px-2.5 py-1 text-center text-[10px] font-bold uppercase tracking-wider text-white/86"><Icon className="w-3 h-3 text-primary" /> {label}</span>)}</div>
                <Link href="/build-a-bundle" className="btn-primary-glow mt-5 inline-flex h-12 w-full items-center justify-center gap-1.5 rounded-xl px-8 text-xs font-extrabold uppercase tracking-wider">Build bundle <ChevronRight className="w-4 h-4" /></Link>
              </div>
              <div className="relative flex min-w-0 flex-col rounded-[20px] border border-white/[0.075] bg-[linear-gradient(145deg,hsl(222_28%_9%/0.48),hsl(222_34%_6%/0.40))] p-5 shadow-[0_18px_58px_-56px_hsl(var(--primary)/0.38),inset_0_1px_0_hsl(0_0%_100%/0.04)] backdrop-blur-md sm:p-6 md:p-6">
                <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 text-[10.5px] font-extrabold uppercase tracking-[0.2em] text-primary"><LifeBuoy className="w-3 h-3" /> TopDraw FAQs</span>
                <h2 className="font-display mt-4 max-w-[400px] text-[1.45rem] font-bold leading-[1.05] tracking-tight text-white/94 md:text-[1.7rem]">Frequently asked questions</h2>
                <p className="mt-2.5 max-w-[430px] text-sm leading-snug text-white/68">Quick answers to the things people ask most about TopDraw competitions.</p>
                <div className="mt-5 rounded-2xl border border-white/[0.075] bg-white/[0.022] px-3 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.035)] backdrop-blur-xl sm:px-4">
                  <Accordion type="single" collapsible className="w-full">{FAQS.map((f, i) => <AccordionItem key={f[0]} value={`item-${i}`} className="border-b border-white/[0.06] last:border-b-0"><AccordionTrigger className="rounded-lg py-3.5 text-left font-display text-[14px] font-semibold text-white/88 transition-colors hover:bg-white/[0.025] hover:text-white hover:no-underline md:text-[15px] [&[data-state=open]]:bg-primary/[0.055] [&[data-state=open]]:text-primary">{f[0]}</AccordionTrigger><AccordionContent className="text-white/72 text-[13.5px] md:text-sm leading-relaxed pb-4">{f[1]}</AccordionContent></AccordionItem>)}</Accordion>
                </div>
                <div className="mt-5 grid gap-2.5 sm:grid-cols-2"><Link href="/faqs" className="btn-ghost-rim inline-flex h-10 items-center justify-center gap-1.5 rounded-xl px-5 text-[11px] font-extrabold uppercase tracking-wider">Visit Help Centre</Link><Link href="/contact" className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-primary/24 bg-primary/[0.09] px-5 text-[11px] font-extrabold uppercase tracking-wider text-white transition hover:border-primary/45 hover:bg-primary/[0.14]">Get in touch <ArrowRight className="h-3.5 w-3.5" /></Link></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
