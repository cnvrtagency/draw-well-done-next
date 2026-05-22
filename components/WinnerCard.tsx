import { Trophy } from "lucide-react";

export type Winner = {
  id: string;
  display_name: string;
  display_location: string | null;
  prize_title: string;
  winning_ticket_number: number;
  draw_date: string;
  proof_url: string | null;
  image_url: string | null;
  competition?: { main_image_url: string | null } | null;
};

export function WinnerCard({ w }: { w: Winner }) {
  const image = w.image_url || w.competition?.main_image_url || "/placeholder.svg";
  return (
    <article className="glass-panel rim-glow overflow-hidden rounded-xl border border-white/[0.06]">
      <div className="aspect-[16/10] bg-white/[0.04] overflow-hidden">
        <img src={image} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
      </div>
      <div className="p-5">
        <div className="eyebrow flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5" /> Winner</div>
        <h2 className="font-display mt-2 text-xl font-bold text-white">{w.prize_title}</h2>
        <div className="mt-3 text-sm text-white/75">
          <div className="font-bold text-white">{w.display_name}</div>
          {w.display_location ? <div>{w.display_location}</div> : null}
          <div className="mt-2 font-mono-num text-primary">Ticket #{w.winning_ticket_number}</div>
          <div className="text-white/55">{new Date(w.draw_date).toLocaleDateString("en-GB")}</div>
        </div>
        {w.proof_url ? <a href={w.proof_url} target="_blank" rel="noreferrer" className="mt-4 inline-flex text-xs font-bold uppercase tracking-wider text-primary hover:text-white">View draw proof →</a> : null}
      </div>
    </article>
  );
}
