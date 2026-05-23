import { NextResponse } from "next/server";
import { requireAdminFromRequest, serverSiteUrl } from "@/lib/serverAdmin";

const siteUrl = serverSiteUrl.replace(/\/$/, "");
const siteHost = new URL(siteUrl).host;
const indexNowKey = process.env.INDEXNOW_KEY || "27c2bacec30a4cb6b20065d2bcfcf12c";
const forbiddenPrefixes = [
  "/admin",
  "/account",
  "/basket",
  "/checkout",
  "/auth",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

function json(status: number, body: unknown) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, content-type",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}

function sanitizeUrls(input: unknown) {
  const ok: string[] = [];
  const rejected: string[] = [];
  const seen = new Set<string>();
  if (!Array.isArray(input)) return { ok, rejected };

  for (const raw of input) {
    if (typeof raw !== "string") continue;
    let url: URL;
    try {
      url = new URL(raw);
    } catch {
      rejected.push(raw);
      continue;
    }
    if (url.protocol !== "https:" || url.host !== siteHost) {
      rejected.push(raw);
      continue;
    }
    if (forbiddenPrefixes.some((prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`))) {
      rejected.push(raw);
      continue;
    }
    const normalized = `${siteUrl}${url.pathname}`;
    if (!seen.has(normalized)) {
      seen.add(normalized);
      ok.push(normalized);
    }
  }
  return { ok, rejected };
}

export async function POST(request: Request) {
  if (!indexNowKey) return json(500, { error: "IndexNow key not configured" });

  const admin = await requireAdminFromRequest(request);
  if (!admin.ok) return json(admin.status || 401, { error: admin.error || "Unauthorized" });

  let payload: { urls?: unknown };
  try {
    payload = await request.json();
  } catch {
    return json(400, { error: "Invalid JSON body" });
  }

  const { ok: urls, rejected } = sanitizeUrls(payload.urls);
  if (!urls.length) return json(400, { error: "No valid URLs to submit", rejected });
  if (urls.length > 100) return json(400, { error: "Maximum 100 URLs per request", count: urls.length });

  try {
    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        host: siteHost,
        key: indexNowKey,
        keyLocation: `${siteUrl}/${indexNowKey}.txt`,
        urlList: urls,
      }),
    });
    return json(200, {
      submitted: urls.length,
      urls,
      rejected,
      indexnowStatus: response.status,
      indexnowOk: response.ok,
    });
  } catch (error) {
    return json(502, { error: "IndexNow request failed", detail: String(error) });
  }
}
