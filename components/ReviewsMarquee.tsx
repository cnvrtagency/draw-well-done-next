import { createSupabaseClient } from "@/lib/supabase";

type Review = { id: string; reviewer_name: string; rating: number; review_text: string; location?: string | null };

function truncate(s: string, n = 140) {
  if (s.length <= n) return s;
  return s.slice(0, n).replace(/\s+\S*$/, "") + "...";
}

export async function ReviewsMarquee() {
  const supabase = createSupabaseClient();
  let reviews: Review[] = [];
  if (supabase) {
    const { data } = await supabase.from("reviews").select("id,reviewer_name,rating,review_text,location").eq("is_active", true).order("display_order", { ascending: true }).order("created_at", { ascending: false }).limit(20);
    reviews = ((data ?? []) as unknown) as Review[];
  }
  if (reviews.length === 0) return null;
  const repeats = Math.max(2, Math.ceil(12 / reviews.length));
  const loop = Array.from({ length: repeats }, () => reviews).flat();
  return (
    <section className="container mx-auto px-4 pt-2 pb-6 sm:px-6 md:pt-3 md:pb-8 lg:px-8" aria-label="Customer reviews">
      <div className="relative mx-auto max-w-7xl overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-[hsl(222_46%_4%/0.72)] via-[hsl(222_42%_5%/0.34)] to-transparent z-10 pointer-events-none sm:w-14" />
        <div className="absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-[hsl(222_46%_4%/0.72)] via-[hsl(222_42%_5%/0.34)] to-transparent z-10 pointer-events-none sm:w-14" />
        <div className="animate-marquee-slow flex gap-3 whitespace-nowrap">
          {loop.map((r, i) => (
            <article key={`${r.id}-${i}`} className="shrink-0 w-[260px] sm:w-[280px] rounded-lg border border-primary/20 bg-card-2/80 px-3.5 py-3 whitespace-normal shadow-[0_0_0_1px_hsl(var(--primary)/0.06)]">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[12.5px] font-bold text-white truncate min-w-0">{r.reviewer_name}{r.location ? <span className="text-white/55 font-medium"> · {r.location}</span> : null}</span>
                <span className="text-[11px] font-bold tracking-wider text-primary" aria-label={`${r.rating} out of 5 stars`}>{"★".repeat(r.rating)}<span className="text-white/20">{"★".repeat(5 - r.rating)}</span></span>
              </div>
              <p className="text-[12.5px] text-white/75 leading-snug line-clamp-3">&quot;{truncate(r.review_text, 140)}&quot;</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
