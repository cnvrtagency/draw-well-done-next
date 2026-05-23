import type { Metadata } from "next";
import { BundleBuilder } from "@/components/home/BundleBuilder";
import { PublicPageHeader } from "@/components/public-ui/PublicPageHeader";
import { SITE_URL } from "@/lib/supabase";

const description = "Build one basket across multiple live TopDraw competitions, choose tickets for each prize, review your total and unlock available multi-ticket savings.";

export const metadata: Metadata = {
  title: "Build a Prize Competition Bundle",
  description,
  alternates: { canonical: "/build-a-bundle" },
};

export default function BuildBundle() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${SITE_URL}/build-a-bundle#webpage`,
    url: `${SITE_URL}/build-a-bundle`,
    name: "Build a Prize Competition Bundle | TopDraw",
    description,
  };

  return (
    <>
      <script type="application/ld+json" suppressHydrationWarning dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container mx-auto px-4 py-8">
        <PublicPageHeader
          align="left"
          eyebrow="Bundle Builder"
          title="Build Your Prize Bundle"
          description="Build one basket across multiple live competitions, choose how many tickets you want for each prize, review your total, then check out in one go."
        />
        <BundleBuilder />
      </div>
    </>
  );
}
