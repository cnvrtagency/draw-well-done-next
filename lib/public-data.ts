import { createSupabaseClient, COMPETITION_SELECT } from "@/lib/supabase";
import type { Competition, CompetitionDiscountTier } from "@/types/db";

export async function getFeaturedCompetitions(limit = 20): Promise<Competition[]> {
  const supabase = createSupabaseClient();
  if (!supabase) return [];
  const nowIso = new Date().toISOString();
  const { data } = await supabase
    .from("competitions")
    .select(COMPETITION_SELECT)
    .eq("status", "live")
    .is("archived_at", null)
    .or(`closes_at.is.null,closes_at.gt.${nowIso}`)
    .order("closes_at", { ascending: true, nullsFirst: false })
    .limit(limit);
  return ((data as unknown) as Competition[]) || [];
}

export async function getCompetitionBySlug(slug: string): Promise<Competition | null> {
  const supabase = createSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("competitions")
    .select(COMPETITION_SELECT)
    .eq("slug", slug)
    .is("archived_at", null)
    .maybeSingle();
  return ((data as unknown) as Competition) || null;
}

export async function getCompetitionDiscountTiers(competitionId: string): Promise<CompetitionDiscountTier[]> {
  const supabase = createSupabaseClient();
  if (!supabase) return [];
  const { data } = await supabase
    .from("competition_discount_tiers")
    .select("id,competition_id,min_quantity,discount_percentage,label,is_active,sort_order")
    .eq("competition_id", competitionId)
    .eq("is_active", true)
    .order("min_quantity", { ascending: true });
  return (((data ?? []) as unknown) as CompetitionDiscountTier[]).map((t) => ({
    ...t,
    discount_percentage: Number(t.discount_percentage),
  }));
}

export type PublicWinner = {
  display_name: string;
  display_location: string | null;
  prize_title: string;
  winning_ticket_number: number | string | null;
  draw_date: string;
  proof_url: string | null;
  image_url: string | null;
  testimonial?: string | null;
};

export async function getCompetitionWinner(competitionId: string): Promise<PublicWinner | null> {
  const supabase = createSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("winners")
    .select("display_name,display_location,prize_title,winning_ticket_number,draw_date,proof_url,image_url,testimonial")
    .eq("competition_id", competitionId)
    .order("draw_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  return ((data as unknown) as PublicWinner) ?? null;
}

export type DynamicContentSection = {
  id: string;
  page_type: string;
  competition_id: string | null;
  page_id: string | null;
  section_key: string;
  title: string | null;
  content_text: string;
  is_enabled: boolean;
  sort_order: number;
};

export async function getCompetitionDynamicContent(competitionId: string, sectionKey: string): Promise<DynamicContentSection | null> {
  const supabase = createSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("dynamic_content_sections")
    .select("id,page_type,competition_id,page_id,section_key,title,content_text,is_enabled,sort_order")
    .eq("page_type", "competition")
    .eq("competition_id", competitionId)
    .eq("section_key", sectionKey)
    .maybeSingle();
  return ((data as unknown) as DynamicContentSection) ?? null;
}

export async function getCompetitionsByTab(tab: string): Promise<Competition[]> {
  const supabase = createSupabaseClient();
  if (!supabase) return [];
  const nowIso = new Date().toISOString();
  const in7dIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  let query = supabase.from("competitions").select(COMPETITION_SELECT).is("archived_at", null);
  if (tab === "ended") {
    query = query
      .or(`status.in.(closed,drawn,sold_out),and(status.eq.live,closes_at.lt.${nowIso})`)
      .order("draw_at", { ascending: false, nullsFirst: false })
      .order("closes_at", { ascending: false });
  } else if (tab === "ending-soon") {
    query = query
      .eq("status", "live")
      .or(`opens_at.is.null,opens_at.lte.${nowIso}`)
      .gt("closes_at", nowIso)
      .lte("closes_at", in7dIso)
      .order("closes_at", { ascending: true });
  } else if (tab === "coming-soon") {
    query = query.eq("status", "live").gt("opens_at", nowIso).order("opens_at", { ascending: true });
  } else {
    query = query
      .eq("status", "live")
      .or(`opens_at.is.null,opens_at.lte.${nowIso}`)
      .or(`closes_at.is.null,closes_at.gt.${nowIso}`)
      .order("closes_at", { ascending: true, nullsFirst: false });
  }
  const { data } = await query;
  return ((data as unknown) as Competition[]) || [];
}
