import { SafePrizeImage } from "@/components/SafePrizeImage";
import { ExternalLink, Trophy } from "lucide-react";

export type Winner = {
  id: string;
  display_name: string;
  display_location: string | null;
  prize_title: string;
  winning_ticket_number: number;
  draw_date: string;
  proof_url: string | null;
  image_url: string | null;
  competition?: { main_image_url: string | null } | { main_image_url: string | null }[] | null;
};

export function WinnerCard({ w }: { w: Winner }) {
  const comp = Array.isArray(w.competition) ? w.competition[0] : w.competition;
  const imageUrl = comp?.main_image_url ?? w.image_url ?? null;
  return (
    <div className="td-public-card rim-glow overflow-hidden group transition-transform duration-300 hover:-translate-y-1">
      <div className="relative">
        <SafePrizeImage url={imageUrl} alt={w.prize_title} aspect="aspect-square" width={560} height={560} imgClassName="transition-transform duration-500 ease-out [@media(hover:hover)]:md:group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:transform-none" />
        <span className="absolute top-2.5 left-2.5 gold-chip inline-flex items-center gap-1">
          <Trophy className="w-3 h-3" /> Winner
        </span>
        <span className="td-overlay-chip absolute top-2.5 right-2.5 font-mono-num text-[11px] font-extrabold px-2 py-1 rounded-md border td-border backdrop-blur-md">
          #{w.winning_ticket_number}
        </span>
      </div>
      <div className="p-4 relative">
        <div className="font-display font-bold td-text text-base leading-snug line-clamp-2 tracking-tight">{w.prize_title}</div>
        <div className="text-sm td-muted mt-1.5">
          {w.display_name}{w.display_location ? <span className="td-soft">, {w.display_location}</span> : null}
        </div>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-[11px] td-soft font-mono-num">Drawn {new Date(w.draw_date).toLocaleDateString()}</div>
          {w.proof_url ? (
            <a href={w.proof_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-primary font-bold uppercase tracking-wider hover:text-info transition">
              Proof <ExternalLink className="w-3 h-3" />
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
