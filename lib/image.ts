export function isLikelyHttpsImage(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && !!parsed.hostname;
  } catch {
    return false;
  }
}
