"use client";

import { useEffect, useMemo, useState } from "react";
import { SafePrizeImage } from "@/components/SafePrizeImage";
import { cn } from "@/lib/utils";

interface Props {
  mainImageUrl: string | null;
  galleryImageUrls: string[] | null | undefined;
  title: string;
  priority?: boolean;
  className?: string;
}

export function CompetitionImageGallery({ mainImageUrl, galleryImageUrls, title, priority, className }: Props) {
  const images = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const raw of [mainImageUrl, ...(galleryImageUrls ?? [])]) {
      const u = (raw ?? "").trim();
      if (!u || seen.has(u)) continue;
      seen.add(u);
      out.push(u);
      if (out.length >= 5) break;
    }
    return out;
  }, [mainImageUrl, galleryImageUrls]);

  const [active, setActive] = useState(0);
  const [imgKey, setImgKey] = useState(0);

  useEffect(() => {
    setActive(0);
    setImgKey((k) => k + 1);
  }, [mainImageUrl]);

  const activeUrl = images[active] ?? mainImageUrl ?? null;
  const others = images.map((u, i) => ({ u, i })).filter(({ i }) => i !== active);
  const visibleThumbs = others.slice(0, 4);
  const extraCount = Math.max(0, others.length - visibleThumbs.length);

  return (
    <div className={cn("w-full max-w-[620px]", className)}>
      <div className="td-gallery-frame relative overflow-hidden rounded-2xl border shadow-deep">
        <div key={imgKey} className="animate-fade-in-img">
          <SafePrizeImage url={activeUrl} alt={title} aspect="aspect-square" priority={priority} width={1200} height={1200} />
        </div>
      </div>

      {visibleThumbs.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-3 w-full sm:overflow-visible overflow-x-auto">
          {visibleThumbs.map(({ u, i }, pos) => {
            const showMore = pos === visibleThumbs.length - 1 && extraCount > 0;
            return (
              <button
                key={u}
                type="button"
                onClick={() => { setActive(i); setImgKey((k) => k + 1); }}
                aria-label={`View image ${i + 1} of ${images.length}`}
                className="td-gallery-thumb relative aspect-square w-full overflow-hidden rounded-lg border opacity-80 transition hover:opacity-100"
              >
                <SafePrizeImage url={u} alt="" aspect="aspect-square" width={160} height={160} />
                {showMore && <span className="absolute inset-0 grid place-items-center bg-black/55 text-white text-sm font-extrabold">+{extraCount}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
