import Link from "next/link";
import { PublicPageHeader } from "@/components/public-ui/PublicPageHeader";

export function InfoPage({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <div className="container mx-auto px-4 py-8 text-white">
      <PublicPageHeader eyebrow={eyebrow} title={title} />
      <div className="space-y-4 text-white/80 leading-relaxed text-[15px]">{children}</div>
    </div>
  );
}

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <InfoPage eyebrow="Phase 1 placeholder" title={title}>
      <p>This route is preserved for compatibility in the parallel Next.js rebuild. The production Vite app remains the source of truth for this workflow during Phase 1.</p>
      <Link href="/competitions" className="btn-primary-glow mt-3 inline-flex h-11 items-center justify-center rounded-xl px-5 text-xs font-extrabold uppercase tracking-wider">Back to competitions</Link>
    </InfoPage>
  );
}
