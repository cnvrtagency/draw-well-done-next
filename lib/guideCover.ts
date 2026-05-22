const map: Record<string, string> = {
  "are-uk-prize-competitions-legal": "/guide-covers/are-uk-prize-competitions-legal.jpg",
  "how-free-postal-entry-works": "/guide-covers/how-free-postal-entry-works.jpg",
  "how-ticket-numbers-are-issued": "/guide-covers/how-ticket-numbers-are-issued.jpg",
  "how-to-enter-topdraw-competitions-online": "/guide-covers/how-to-enter-topdraw-competitions-online.jpg",
  "how-topdraw-competitions-work": "/guide-covers/how-topdraw-competitions-work.jpg",
  "how-winners-are-chosen": "/guide-covers/how-winners-are-chosen.jpg",
  "what-are-ticket-caps": "/guide-covers/what-are-ticket-caps.jpg",
  "why-topdraw-shows-ticket-caps-upfront": "/guide-covers/why-topdraw-shows-ticket-caps-upfront.jpg",
};

export const GUIDE_FALLBACK_GRADIENT = "linear-gradient(135deg, hsl(222 34% 10%), hsl(204 100% 18%))";

export function guideCoverUrl(url: string | null | undefined, slug: string) {
  return url || map[slug] || null;
}

export function readingTimeMinutes(markdown: string) {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 220));
}
