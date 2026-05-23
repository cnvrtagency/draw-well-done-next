const PUBLIC_PREFIX = "/storage/v1/object/public/";

export function parseBucketPath(url: string | null | undefined): { bucket: string; path: string } | null {
  if (!url) return null;
  const idx = url.indexOf(PUBLIC_PREFIX);
  if (idx === -1) return null;
  const rest = url.slice(idx + PUBLIC_PREFIX.length);
  const slash = rest.indexOf("/");
  if (slash === -1) return null;
  const bucket = rest.slice(0, slash);
  const path = decodeURIComponent(rest.slice(slash + 1).split("?")[0]);
  if (!bucket || !path) return null;
  return { bucket, path };
}

export function isInBucket(url: string | null | undefined, bucket: string): boolean {
  const parsed = parseBucketPath(url);
  return !!parsed && parsed.bucket === bucket;
}

export function filenameFromPath(path: string): string {
  const parts = path.split("/");
  return parts[parts.length - 1] || path;
}

export function safeExt(name: string, mime?: string): string {
  const fromName = name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/avif") return "avif";
  return "bin";
}

export function safeSlug(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}
