import type { MetadataRoute } from "next";
import { createSupabaseClient, SITE_URL } from "@/lib/supabase";

const baseUrl = SITE_URL.replace(/\/$/, "");

function entry(path: string, priority = 0.7): MetadataRoute.Sitemap[number] {
  return {
    url: path === "/" ? `${baseUrl}/` : `${baseUrl}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [
    entry("/", 1),
    entry("/competitions", 0.9),
    entry("/build-a-bundle", 0.8),
    entry("/winners", 0.7),
    entry("/faqs", 0.7),
    entry("/guides", 0.7),
    entry("/free-entry", 0.7),
    entry("/contact", 0.5),
    entry("/terms-and-conditions", 0.4),
    entry("/privacy-policy", 0.4),
    entry("/cookie-policy", 0.4),
    entry("/responsible-play", 0.5),
  ];

  const supabase = createSupabaseClient();
  if (!supabase) return routes;

  try {
    const [{ data: competitions }, { data: guides }] = await Promise.all([
      supabase
        .from("competitions")
        .select("slug,updated_at")
        .not("slug", "is", null)
        .is("archived_at", null)
        .in("status", ["live", "sold_out", "closed", "drawn"])
        .limit(1000),
      supabase
        .from("guides")
        .select("slug,updated_at,published_at")
        .not("slug", "is", null)
        .eq("status", "published")
        .limit(1000),
    ]);

    for (const competition of (competitions ?? []) as Array<{ slug: string; updated_at?: string | null }>) {
      routes.push({
        url: `${baseUrl}/competitions/${competition.slug}`,
        lastModified: competition.updated_at ? new Date(competition.updated_at) : new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      });
    }

    for (const guide of (guides ?? []) as Array<{ slug: string; updated_at?: string | null; published_at?: string | null }>) {
      routes.push({
        url: `${baseUrl}/guides/${guide.slug}`,
        lastModified: guide.updated_at || guide.published_at ? new Date(guide.updated_at || guide.published_at!) : new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  } catch {
    return routes;
  }

  return routes;
}
