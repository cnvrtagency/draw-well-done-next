import type { Metadata } from "next";
import { HeroCarousel } from "@/components/HeroCarousel";
import { ReviewsMarquee } from "@/components/ReviewsMarquee";
import { PrizeDrops } from "@/components/home/PrizeDrops";
import { BundleFAQSection } from "@/components/home/BundleFAQSection";
import { getFeaturedCompetitions } from "@/lib/public-data";
import { SITE_URL } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "UK Prize Competitions with Clear Ticket Caps",
  description: "Enter UK prize competitions with TopDraw. Browse live prizes, view ticket caps upfront, use the free postal entry route and see published winners.",
  alternates: { canonical: "/" },
};

export default async function Home() {
  const featured = await getFeaturedCompetitions(20);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "TopDraw",
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/assets/topdraw-logo.png`,
      description: "TopDraw is a UK prize competition platform with clear ticket caps, free postal entry routes and published winners.",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: "TopDraw",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ];
  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="home-bg relative isolate -mb-20 overflow-hidden pb-20">
        <div aria-hidden className="home-bg-layer pointer-events-none absolute inset-0 z-0" />
        <div aria-hidden className="pointer-events-none absolute inset-0 z-0 bg-noise opacity-[0.08] mix-blend-overlay" />
        <div className="relative z-10">
          <HeroCarousel items={featured} loading={false} />
          <ReviewsMarquee />
          <PrizeDrops />
          <BundleFAQSection />
        </div>
      </div>
    </>
  );
}
