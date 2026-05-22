import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCompetitionBySlug,
  getCompetitionDiscountTiers,
  getCompetitionDynamicContent,
  getCompetitionWinner,
} from "@/lib/public-data";
import { competitionDetailImageUrl } from "@/lib/competitionImages";
import { SITE_URL } from "@/lib/supabase";
import { CompetitionDetailClient } from "@/components/CompetitionDetailClient";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const c = await getCompetitionBySlug(params.slug);
  if (!c) return { title: "Competition not found" };
  const cleanTitle = /^(win\b|free to play)/i.test(c.title.trim()) ? c.title.trim() : `Win ${c.title.trim()}`;
  const image = competitionDetailImageUrl(c) || undefined;
  return {
    title: cleanTitle,
    description: `Enter ${cleanTitle} with TopDraw. View the ticket price, ticket cap, draw timing, free postal entry route and winner information before you enter.`,
    openGraph: { title: cleanTitle, images: image ? [image] : undefined },
    alternates: { canonical: `/competitions/${c.slug}` },
  };
}

export default async function CompetitionDetail({ params }: { params: { slug: string } }) {
  const c = await getCompetitionBySlug(params.slug);
  if (!c) notFound();
  const [tiers, winner, marquee] = await Promise.all([
    getCompetitionDiscountTiers(c.id),
    c.status === "drawn" ? getCompetitionWinner(c.id) : Promise.resolve(null),
    getCompetitionDynamicContent(c.id, "competition_marquee"),
  ]);
  const detailImageUrl = competitionDetailImageUrl(c);
  const cleanTitle = /^(win\b|free to play)/i.test(c.title.trim()) ? c.title.trim() : `Win ${c.title.trim()}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${SITE_URL}/competitions/${c.slug}#webpage`,
      url: `${SITE_URL}/competitions/${c.slug}`,
      name: cleanTitle,
      image: detailImageUrl || c.main_image_url || undefined,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "Competitions", item: `${SITE_URL}/competitions` },
        { "@type": "ListItem", position: 3, name: cleanTitle, item: `${SITE_URL}/competitions/${c.slug}` },
      ],
    },
  ];
  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CompetitionDetailClient competition={c} tiers={tiers} winner={winner} marquee={marquee} />
    </>
  );
}
