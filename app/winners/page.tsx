import type { Metadata } from "next";
import { WinnerCard, type Winner } from "@/components/WinnerCard";
import { PublicPageHeader } from "@/components/public-ui/PublicPageHeader";
import { createSupabaseClient } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "TopDraw Winners & Completed Prize Draws",
  description: "View real TopDraw winners from completed prize draws, with display-safe names and rough locations only.",
};

export default async function Winners() {
  const supabase = createSupabaseClient();
  let rows: Winner[] = [];
  if (supabase) {
    const { data } = await supabase.from("winners").select("id,display_name,display_location,prize_title,winning_ticket_number,draw_date,proof_url,image_url,competition:competitions(main_image_url)").eq("is_published", true).order("draw_date", { ascending: false });
    rows = (((data as unknown) as Winner[]) || []).map((w) => ({ ...w, competition: Array.isArray(w.competition) ? (w.competition[0] ?? null) : w.competition }));
  }
  const latest = rows[0]?.draw_date;
  return (
    <div className="container mx-auto py-8 px-4">
      <PublicPageHeader align="left" eyebrow="Winners" title="TopDraw Winners" description="View real TopDraw winners from completed draws, with display-safe names and rough locations only, so results stay transparent without exposing personal details." />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[["Total winners", String(rows.length)], ["Latest draw", latest ? new Date(latest).toLocaleDateString() : "-"], ["Draw proof", "Published per draw"]].map(([k, v]) => <div key={k} className="td-public-card rounded-xl p-4"><div className="text-[11px] font-extrabold uppercase tracking-wider td-soft">{k}</div><div className="font-mono-num text-xl font-black td-text mt-1">{v}</div></div>)}
      </div>
      {rows.length === 0 ? <p className="mt-6 td-soft">No winners published yet.</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">{rows.map((w) => <WinnerCard key={w.id} w={w} />)}</div>}
    </div>
  );
}
