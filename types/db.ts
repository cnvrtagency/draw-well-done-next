export type CompetitionStatus = "draft" | "live" | "sold_out" | "closed" | "drawn" | "archived";

export interface Competition {
  id: string;
  title: string;
  slug: string;
  short_description: string | null;
  description?: string | null;
  prize_value: number | null;
  ticket_price: number;
  max_entries: number;
  current_entries: number;
  per_user_entry_limit: number | null;
  status: CompetitionStatus;
  category: string | null;
  main_image_url: string | null;
  image_original_url?: string | null;
  image_card_url?: string | null;
  image_detail_url?: string | null;
  image_thumb_url?: string | null;
  gallery_image_urls?: string[] | null;
  opens_at: string | null;
  closes_at: string | null;
  draw_at: string | null;
  draw_method?: string | null;
  winner_entry_id?: string | null;
  cash_alternative: number | null;
  archived_at?: string | null;
  manual_reserved_entries?: number | null;
  created_at?: string | null;
}

export interface CompetitionDiscountTier {
  id: string;
  competition_id: string;
  min_quantity: number;
  discount_percentage: number;
  label: string | null;
  is_active: boolean;
  sort_order: number;
}
