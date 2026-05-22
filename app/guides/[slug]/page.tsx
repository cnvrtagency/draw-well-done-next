import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Clock } from "lucide-react";
import { createSupabaseClient, SITE_URL } from "@/lib/supabase";
import { guideCoverUrl, GUIDE_FALLBACK_GRADIENT, readingTimeMinutes } from "@/lib/guideCover";

type Guide = { id: string; title: string; slug: string; excerpt: string | null; category: string | null; featured_image_url: string | null; body_markdown: string | null; seo_title: string | null; seo_description: string | null; published_at: string | null; updated_at: string };

async function getGuide(slug: string) {
  const supabase = createSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.from("guides").select("*").eq("slug", slug).eq("status", "published").maybeSingle();
  return (data as Guide | null) ?? null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const guide = await getGuide(params.slug);
  if (!guide) return { title: "Guide not found" };
  const cover = guideCoverUrl(guide.featured_image_url, guide.slug);
  return { title: guide.seo_title || guide.title, description: guide.seo_description || guide.excerpt || undefined, openGraph: { images: cover ? [cover.startsWith("http") ? cover : `${SITE_URL}${cover}`] : undefined } };
}

function fmtDate(iso: string | null) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function GuideDetail({ params }: { params: { slug: string } }) {
  const guide = await getGuide(params.slug);
  if (!guide) notFound();
  const cover = guideCoverUrl(guide.featured_image_url, guide.slug);
  const paragraphs = (guide.body_markdown || guide.excerpt || "").split(/\n{2,}/).filter(Boolean);
  return (
    <section className="container mx-auto px-4 py-10">
      <nav aria-label="Breadcrumb" className="mb-6 text-xs text-white/55 flex items-center gap-1.5 flex-wrap"><Link href="/" className="hover:text-white">Home</Link><ChevronRight className="w-3 h-3" /><Link href="/guides" className="hover:text-white">Guides</Link><ChevronRight className="w-3 h-3" /><span className="text-white/80 truncate max-w-[60vw]">{guide.title}</span></nav>
      <header className="max-w-3xl mb-8">{guide.category && <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary mb-3">{guide.category}</div>}<h1 className="font-display text-3xl md:text-5xl font-bold text-white tracking-tight mb-4">{guide.title}</h1>{guide.excerpt && <p className="text-lg text-white/85 leading-relaxed mb-4">{guide.excerpt}</p>}<div className="text-xs text-white/55 flex items-center gap-3"><span>{fmtDate(guide.published_at)}</span><span aria-hidden>·</span><span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{readingTimeMinutes(guide.body_markdown ?? "")} min read</span></div></header>
      {cover ? <div className="rounded-2xl overflow-hidden mb-10 border border-white/10 aspect-[16/9] bg-white/5"><img src={cover} alt={guide.title} className="w-full h-full object-cover" width={1600} height={900} loading="lazy" /></div> : <div className="rounded-2xl overflow-hidden mb-10 border border-white/10 aspect-[16/9]" style={{ background: GUIDE_FALLBACK_GRADIENT }} />}
      <article className="glass-panel max-w-3xl p-6 md:p-8 text-white/82 leading-relaxed space-y-5">{paragraphs.map((p) => <p key={p} className="whitespace-pre-line">{p.replace(/^#+\s*/, "")}</p>)}</article>
    </section>
  );
}
