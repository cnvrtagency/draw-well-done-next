import { createClient } from "@supabase/supabase-js";

export const serverSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
export const serverSupabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const serverSupabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const serverSupabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export function createServiceSupabaseClient() {
  if (!serverSupabaseUrl || !serverSupabaseServiceRoleKey) return null;
  return createClient(serverSupabaseUrl, serverSupabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireAdminFromRequest(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) return { ok: false, status: 401, error: "Missing bearer token" };
  if (!serverSupabaseUrl || !serverSupabaseAnonKey || !serverSupabaseServiceRoleKey) {
    return { ok: false, status: 503, error: "Supabase admin auth is not configured" };
  }

  const userClient = createClient(serverSupabaseUrl, serverSupabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) return { ok: false, status: 401, error: "Invalid bearer token" };

  const admin = createServiceSupabaseClient();
  if (!admin) return { ok: false, status: 503, error: "Supabase service role is not configured" };
  const { data: role } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!role) return { ok: false, status: 403, error: "Admin role required" };
  return { ok: true, userId: data.user.id, token };
}
