import { NextResponse } from "next/server";
import { createServiceSupabaseClient, requireAdminFromRequest, serverSiteUrl } from "@/lib/serverAdmin";

const resendApiKey = process.env.RESEND_API_KEY || "";
const resendFrom = process.env.RESEND_FROM_EMAIL || "TopDraw <noreply@topdrawcompetitions.co.uk>";
const resendReplyTo = process.env.RESEND_REPLY_TO || "";
const emailWebhookSecret = process.env.EMAIL_WEBHOOK_SECRET || "";
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type DbEmailTemplate = {
  template_key: string;
  label: string | null;
  subject: string;
  preheader: string | null;
  html_body: string;
  text_body: string | null;
  button_label: string | null;
  button_url: string | null;
  is_enabled: boolean;
  sample_payload: Record<string, unknown> | null;
};

function json(status: number, body: unknown) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, content-type, x-internal-secret",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
  });
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, content-type, x-internal-secret",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    },
  });
}

function interpolate(template: string | null | undefined, data: Record<string, unknown>) {
  return String(template || "").replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, (_match, key: string) => {
    const value = key.split(".").reduce<unknown>((acc, part) => {
      if (acc && typeof acc === "object" && part in acc) return (acc as Record<string, unknown>)[part];
      return undefined;
    }, data);
    if (Array.isArray(value)) return value.join(", ");
    if (value == null) return "";
    return String(value);
  });
}

function renderTemplate(template: DbEmailTemplate, data: Record<string, unknown>) {
  const subject = interpolate(template.subject, data);
  const preheader = interpolate(template.preheader, data);
  const body = interpolate(template.html_body, data);
  const text = interpolate(template.text_body || template.html_body.replace(/<[^>]+>/g, " "), data);
  const buttonLabel = interpolate(template.button_label, data);
  const buttonUrl = interpolate(template.button_url, data);
  const button = buttonLabel && buttonUrl ? `<p><a href="${buttonUrl}" style="display:inline-block;padding:12px 18px;border-radius:8px;background:#0ea5e9;color:#ffffff;text-decoration:none;font-weight:700">${buttonLabel}</a></p>` : "";
  const html = `<!doctype html><html><body style="margin:0;background:#08111f;color:#111827;font-family:Inter,Arial,sans-serif"><div style="display:none;max-height:0;overflow:hidden">${preheader}</div><main style="max-width:680px;margin:0 auto;padding:24px"><section style="background:#ffffff;border-radius:16px;padding:28px">${body}${button}<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/><p style="font-size:12px;color:#6b7280">TopDraw · <a href="${serverSiteUrl}">${serverSiteUrl}</a></p></section></main></body></html>`;
  return { subject, html, text };
}

async function authorize(request: Request) {
  const internalSecret = request.headers.get("x-internal-secret") || "";
  if (internalSecret && emailWebhookSecret && internalSecret === emailWebhookSecret) {
    return { ok: true, internal: true, userId: null as string | null };
  }
  const admin = await requireAdminFromRequest(request);
  if (!admin.ok) return { ok: false, status: admin.status, error: admin.error };
  return { ok: true, internal: false, userId: admin.userId || null };
}

export async function GET() {
  const supabase = createServiceSupabaseClient();
  const missingEnv = [
    !resendApiKey ? "RESEND_API_KEY" : null,
    !process.env.SUPABASE_SERVICE_ROLE_KEY ? "SUPABASE_SERVICE_ROLE_KEY" : null,
    !(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) ? "SUPABASE_URL" : null,
  ].filter(Boolean);
  let templates: Array<Record<string, unknown>> = [];
  if (supabase) {
    const { data } = await supabase.from("email_templates").select("template_key,label,sample_payload,is_enabled").order("label", { ascending: true });
    templates = ((data ?? []) as Array<{ template_key: string; label: string | null; sample_payload: Record<string, unknown> | null; is_enabled: boolean }>).map((template) => ({
      slug: template.template_key,
      label: template.label || template.template_key,
      sample: template.sample_payload || {},
      source: "db",
      enabled: template.is_enabled,
      editor_mode: "custom",
      can_use_premium_default: false,
    }));
  }
  return json(200, {
    ok: true,
    configured: missingEnv.length === 0,
    missingEnv,
    templates,
    presets: [],
    site_url: serverSiteUrl,
    from: resendFrom,
    reply_to: resendReplyTo || null,
    webhook_secret_set: Boolean(emailWebhookSecret),
  });
}

export async function POST(request: Request) {
  const auth = await authorize(request);
  if (!auth.ok) return json(auth.status || 401, { error: auth.error || "Unauthorized" });
  if (!resendApiKey || !process.env.SUPABASE_SERVICE_ROLE_KEY) return json(503, { error: "Email service not configured" });

  const supabase = createServiceSupabaseClient();
  if (!supabase) return json(503, { error: "Supabase service role is not configured" });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "Invalid JSON" });
  }

  const templateKey = String(body.template || "").trim();
  const recipient = String(body.recipient || body.to || "").trim().toLowerCase();
  const data = body.data && typeof body.data === "object" ? body.data as Record<string, unknown> : {};
  const idempotencyKey = body.idempotency_key ? String(body.idempotency_key) : null;
  const isTest = Boolean(body.test);
  if (!templateKey) return json(400, { error: "Template is required" });
  if (!emailRe.test(recipient)) return json(400, { error: "Invalid recipient" });
  if (JSON.stringify(data).length > 32_000) return json(413, { error: "Payload too large" });

  const { data: template, error: templateError } = await supabase
    .from("email_templates")
    .select("template_key,label,subject,preheader,html_body,text_body,button_label,button_url,is_enabled,sample_payload")
    .eq("template_key", templateKey)
    .maybeSingle();
  if (templateError) return json(500, { error: `Template lookup failed: ${templateError.message}` });
  if (!template || !(template as DbEmailTemplate).is_enabled) return json(400, { error: `Unknown template: ${templateKey}` });

  if (idempotencyKey) {
    const { data: existing } = await supabase
      .from("email_logs")
      .select("id,status,provider_message_id,subject")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();
    if (existing?.status === "sent") return json(200, { ok: true, deduped: true, log_id: existing.id, message_id: existing.provider_message_id });
  }

  const { data: suppression } = await supabase.from("email_suppressions").select("email,reason").eq("email", recipient).maybeSingle();
  if (suppression) {
    const { data: row } = await supabase.from("email_logs").insert({
      template: templateKey,
      recipient,
      subject: null,
      status: "suppressed",
      error: `Recipient suppressed: ${suppression.reason || "no reason"}`,
      idempotency_key: idempotencyKey,
      payload: data,
      sent_by: auth.userId,
    }).select("id").maybeSingle();
    return json(200, { ok: false, suppressed: true, log_id: row?.id });
  }

  let rendered: { subject: string; html: string; text: string };
  try {
    rendered = renderTemplate(template as DbEmailTemplate, data);
  } catch (error) {
    return json(500, { error: `Template render failed: ${error instanceof Error ? error.message : String(error)}` });
  }
  const subject = `${isTest ? "[Test] " : ""}${rendered.subject}`;

  const { data: logRow, error: logError } = await supabase.from("email_logs").insert({
    template: templateKey,
    recipient,
    subject,
    status: "pending",
    idempotency_key: idempotencyKey,
    payload: data,
    sent_by: auth.userId,
  }).select("id").maybeSingle();
  if (logError) {
    if ((logError as { code?: string }).code === "23505" && idempotencyKey) return json(200, { ok: true, deduped: true });
    return json(500, { error: `Log insert failed: ${logError.message}` });
  }

  try {
    const resendBody: Record<string, unknown> = {
      from: resendFrom,
      to: [recipient],
      subject,
      html: rendered.html,
      text: rendered.text,
    };
    if (resendReplyTo) resendBody.reply_to = resendReplyTo;
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(resendBody),
    });
    const responseJson = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = responseJson?.message || responseJson?.error || `Resend HTTP ${response.status}`;
      await supabase.from("email_logs").update({ status: "failed", error: String(error).slice(0, 1000), updated_at: new Date().toISOString() }).eq("id", logRow!.id);
      return json(502, { ok: false, error, log_id: logRow!.id });
    }
    const messageId = responseJson?.id || null;
    await supabase.from("email_logs").update({ status: "sent", provider_message_id: messageId, sent_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", logRow!.id);
    return json(200, { ok: true, log_id: logRow!.id, message_id: messageId, internal: auth.internal });
  } catch (error) {
    await supabase.from("email_logs").update({ status: "failed", error: String(error instanceof Error ? error.message : error).slice(0, 1000), updated_at: new Date().toISOString() }).eq("id", logRow!.id);
    return json(500, { ok: false, error: String(error instanceof Error ? error.message : error), log_id: logRow!.id });
  }
}
