"use client";

export const COMPETITION_TABS = ["Live", "Ending Soon", "Coming Soon", "Ended"] as const;
export type CompetitionTab = typeof COMPETITION_TABS[number];

export function CategoryTabs({ value, onChange }: { value: CompetitionTab; onChange: (tab: CompetitionTab) => void }) {
  return (
    <div className="w-full">
      <div role="tablist" className="grid grid-cols-4 gap-1 md:inline-flex md:gap-2 p-1 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[0_1px_0_0_hsl(204_100%_55%/0.15)_inset]">
        {COMPETITION_TABS.map((t) => {
          const isActive = value === t;
          return (
            <button key={t} role="tab" aria-selected={isActive} onClick={() => onChange(t)} className={`relative inline-flex items-center justify-center gap-2 whitespace-nowrap px-2 md:px-4 h-10 rounded-xl font-display text-[11px] md:text-[12.5px] font-bold uppercase tracking-[0.04em] md:tracking-[0.06em] transition ${isActive ? "bg-primary/15 text-white border border-primary/40 shadow-[0_0_0_1px_hsl(204_100%_55%/0.2),0_0_24px_-6px_hsl(204_100%_55%/0.6)]" : "text-white/65 border border-transparent hover:text-white hover:bg-white/5"}`}>{t}</button>
          );
        })}
      </div>
    </div>
  );
}
