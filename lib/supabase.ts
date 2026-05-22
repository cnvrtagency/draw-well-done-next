import { createClient } from "@supabase/supabase-js";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
let browserClient: ReturnType<typeof createClient> | null = null;

export function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

export function createSupabaseBrowserClient(): any {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  if (!browserClient) {
    browserClient = createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return browserClient;
}

export const COMPETITION_SELECT =
  "id,title,slug,short_description,description,prize_value,ticket_price,cash_alternative,max_entries,current_entries,manual_reserved_entries,per_user_entry_limit,status,category,main_image_url,image_original_url,image_card_url,image_detail_url,image_thumb_url,gallery_image_urls,opens_at,closes_at,draw_at,draw_method,winner_entry_id,created_at";
