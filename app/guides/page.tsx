import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, LifeBuoy } from "lucide-react";
import { createSupabaseClient } from "@/lib/supabase";
import { PublicPageHeader } from "@/components/public-ui/PublicPageHeader";
import { guideCoverUrl, GUIDE_FALLBACK_GRADIENT, readingTimeMinutes } from "@/lib/guideCover";

export const metadata: Metadata = {
  title: "Prize Competition Guides",
  description: "Read TopDraw guides about UK prize competitions, ticket caps, free postal entry, ticket numbers, winners and how the draw process works.",
};

type Guide = { id: string; title: string; slug: string; excerpt: string | null; category: string | null; featured_image_url: string | null; body_markdown: string | null; is_featured: boolean; published_at: string | null; updated_at: string };

function fmtDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function Guides() {
  const supabase = createSupabaseClient();
  let items: Guide[] = [];
  if (supabase) {
    const { data } = await supabase.from("guides").select("id,title,slug,excerpt,category,featured_image_url,body_markdown,is_featured,published_at,updated_at").eq("status", "published").order("is_featured", { ascending: false }).order("published_at", { ascending: false });
    items = (data ?? []) as Guide[];
  }
  const featured = items.find((g) => g.is_featured) ?? null;
  const rest = items.filter((g) => !featured || g.id !== featured.id);
  return (
    <section className="container mx-auto px-4 py-10">
      <PublicPageHeader eyebrow="TopDraw Guides" title="Prize Competition Guides" description="Learn how TopDraw competitions work, including ticket caps, free postal entry, winner publishing, ticket numbers and the draw process." />
      {featured && (
        <div className="glass-panel overflow-hidden mb-10">
          <div className="grid md:grid-cols-[1.1fr_1fr] gap-0">
            <div className="aspect-[16/10] md:aspect-auto md:min-h-[280px] bg-white/5">{guideCoverUrl(featured.featured_image_url, featured.slug) ? <img src={guideCoverUrl(featured.featured_image_url, featured.slug)!} alt={featured.title} loading="lazy" className="w-full h-full object-cover" /> : <div className="h-full" style={{ background: GUIDE_FALLBACK_GRADIENT }} />}</div>
            <div className="p-6 md:p-8 flex flex-col">
              <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary mb-2">Featured · {featured.category ?? "Guide"}</div>
              <h2 className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight mb-3">{featured.title}</h2>
              {featured.excerpt && <p className="text-white/80 leading-relaxed mb-5">{featured.excerpt}</p>}
              <div className="text-xs text-white/55 flex items-center gap-3 mb-5"><span>{fmtDate(featured.published_at)}</span><span aria-hidden>·</span><span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{readingTimeMinutes(featured.body_markdown ?? "")} min read</span></div>
              <div className="mt-auto"><Link href={`/guides/${featured.slug}`} className="btn-primary-glow inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-bold">Read guide <ArrowRight className="w-4 h-4 ml-1" /></Link></div>
            </div>
          </div>
        </div>
      )}
      {rest.length === 0 ? <div className="glass-panel p-6 text-center text-white/70">No guides published yet.</div> : <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{rest.map((g) => <Link key={g.id} href={`/guides/${g.slug}`} className="group focus:outline-none focus:ring-2 focus:ring-primary/50 rounded-2xl"><div className="glass-panel overflow-hidden h-full flex flex-col transition group-hover:border-primary/40">{guideCoverUrl(g.featured_image_url, g.slug) ? <div className="aspect-[16/9] bg-white/5 overflow-hidden"><img src={guideCoverUrl(g.featured_image_url, g.slug)!} alt={g.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.02] transition" /></div> : <div className="aspect-[16/9]" style={{ background: GUIDE_FALLBACK_GRADIENT }} />}<div className="p-5 flex flex-col flex-1">{g.category && <div className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary mb-2">{g.category}</div>}<h3 className="font-display text-lg font-bold text-white tracking-tight mb-2 group-hover:text-primary transition">{g.title}</h3>{g.excerpt && <p className="text-sm text-white/70 leading-relaxed line-clamp-3">{g.excerpt}</p>}<div className="text-[11px] text-white/50 flex items-center gap-3 mt-4 pt-4 border-t border-white/5"><span>{fmtDate(g.published_at)}</span><span aria-hidden>·</span><span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" />{readingTimeMinutes(g.body_markdown ?? "")} min read</span></div></div></div></Link>)}</div>}
      <div className="glass-panel mt-12 p-6 md:p-8"><div className="grid md:grid-cols-[1.4fr_1fr] gap-6 items-center"><div><div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary mb-2">Ready to enter?</div><h2 className="font-display text-2xl md:text-3xl font-bold text-white tracking-tight mb-3">Browse live TopDraw competitions</h2><p className="text-white/80 leading-relaxed mb-2">Compare ticket prices and ticket caps upfront, and pick the prizes you want to enter.</p><p className="text-xs text-white/55">Ticket caps shown upfront · Free postal entry route · Winners published · 18+ UK only</p></div><div className="flex flex-col sm:flex-row md:flex-col gap-2 md:items-end"><Link href="/competitions" className="btn-primary-glow inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-bold">View live competitions</Link><Link href="/build-a-bundle" className="btn-ghost-rim inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-bold">Build a prize bundle</Link></div></div><div className="mt-5 pt-5 border-t border-white/10 text-sm text-white/65 inline-flex items-center gap-2"><LifeBuoy className="w-4 h-4 text-primary" />Need a quick answer? <Link href="/faqs" className="text-primary font-semibold hover:underline ml-1">Visit the Help Centre</Link></div></div>
    </section>
  );
}
