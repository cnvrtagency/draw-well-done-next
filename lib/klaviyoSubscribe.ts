export type KlaviyoSubscribePayload = {
  email: string;
  source: string;
  consent_source: string;
  consent_status?: "granted" | "declined";
  consent_type?: "opt_in" | "soft_opt_in" | "opt_out";
  competition_id?: string | null;
  competition_title?: string | null;
  user_id?: string | null;
  properties?: Record<string, unknown>;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function requestKlaviyoSubscribe(payload: KlaviyoSubscribePayload): void {
  try {
    if (!payload?.email || !EMAIL_RE.test(payload.email.trim().toLowerCase())) return;
    fetch("/.netlify/functions/klaviyo-subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        email: payload.email.trim().toLowerCase(),
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

export async function submitKlaviyoSubscribe(payload: KlaviyoSubscribePayload): Promise<{ ok: boolean; reason?: string }> {
  try {
    if (!payload?.email || !EMAIL_RE.test(payload.email.trim().toLowerCase())) return { ok: false, reason: "invalid_email" };
    const response = await fetch("/.netlify/functions/klaviyo-subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...payload,
        email: payload.email.trim().toLowerCase(),
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      }),
    });
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.includes("application/json")) return { ok: false, reason: "endpoint_unavailable" };
    const data = await response.json() as { subscribed?: boolean; reason?: string };
    return data.subscribed ? { ok: true } : { ok: false, reason: data.reason || "not_subscribed" };
  } catch {
    return { ok: false, reason: "network_error" };
  }
}
