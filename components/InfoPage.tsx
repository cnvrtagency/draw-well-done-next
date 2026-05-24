import Link from "next/link";
import { PublicPageHeader } from "@/components/public-ui/PublicPageHeader";

export function InfoPage({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <div className="container mx-auto px-4 py-8 td-text">
      <PublicPageHeader eyebrow={eyebrow} title={title} />
      <div className="space-y-4 td-static-body leading-relaxed text-[15px]">{children}</div>
    </div>
  );
}

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <InfoPage eyebrow="TopDraw" title={title}>
      <p>This page is available for staging navigation checks. Use the live operational routes for entries, account management and checkout testing.</p>
      <Link href="/competitions" className="btn-primary-glow mt-3 inline-flex h-11 items-center justify-center rounded-xl px-5 text-xs font-extrabold uppercase tracking-wider">Back to competitions</Link>
    </InfoPage>
  );
}
