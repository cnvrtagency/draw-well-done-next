import type { Metadata } from "next";
import Link from "next/link";
import { CompetitionCard } from "@/components/CompetitionCard";
import { PublicPageHeader } from "@/components/public-ui/PublicPageHeader";
import { getCompetitionsByTab } from "@/lib/public-data";
import { effectiveRemaining } from "@/lib/format";

export const metadata: Metadata = {
  title: "Live UK Prize Competitions",
  description: "Browse live TopDraw competitions in one place, compare ticket prices and ticket caps upfront, then choose the prizes you want to enter with confidence.",
  alternates: { canonical: "/competitions" },
};

const tabs = [
  ["live", "Live"],
  ["ending-soon", "Ending Soon"],
  ["coming-soon", "Coming Soon"],
  ["ended", "Ended"],
] as const;

export default async function Competitions({ searchParams }: { searchParams?: { tab?: string } }) {
  const active = searchParams?.tab || "live";
  let comps = await getCompetitionsByTab(active);
  if (active === "live" || active === "ending-soon") {
    comps = comps.filter((r) => effectiveRemaining(r.current_entries, r.manual_reserved_entries, r.max_entries) > 0);
  }
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PublicPageHeader align="left" eyebrow="Competitions" title="Competitions" description="Browse live TopDraw competitions, see what's ending soon or coming up next, and revisit past draws, all in one place." />
      <div className="mb-6">
        <div className="w-full">
          <div role="tablist" className="grid grid-cols-4 gap-1 md:inline-flex md:gap-2 p-1 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_1px_0_0_hsl(204_100%_55%/0.15)_inset]">
            {tabs.map(([key, label]) => {
              const isActive = active === key || (!searchParams?.tab && key === "live");
              return <Link key={key} href={`/competitions?tab=${key}`} role="tab" aria-selected={isActive} className={`relative inline-flex items-center justify-center gap-2 whitespace-nowrap px-2 md:px-4 h-10 rounded-xl font-display text-[11px] md:text-[12.5px] font-bold uppercase tracking-[0.04em] md:tracking-[0.06em] transition ${isActive ? "bg-primary/15 text-white border border-primary/40 shadow-[0_0_0_1px_hsl(204_100%_55%/0.2),0_0_24px_-6px_hsl(204_100%_55%/0.6)]" : "text-white/65 border border-transparent hover:text-white hover:bg-white/5"}`}>{label}</Link>;
            })}
          </div>
        </div>
      </div>
      {comps.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-card p-10 text-center text-white/60">
          {active === "ended" ? "No ended or drawn competitions yet." : active === "coming-soon" ? "No upcoming competitions scheduled yet." : active === "ending-soon" ? "Nothing is closing in the next 7 days." : "No live competitions right now."}
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 mt-4">
          {comps.map((c) => <CompetitionCard key={c.id} c={c} tone={active === "ended" ? "purple" : active === "coming-soon" ? "blue" : "red"} />)}
        </div>
      )}
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {["Ticket caps shown upfront", "Free postal entry route", "Winners published"].map((text) => (
          <div key={text} className="rounded-xl border border-white/10 bg-card p-4 text-sm font-bold uppercase tracking-wider text-white/75">{text}</div>
        ))}
      </div>
    </div>
  );
}
