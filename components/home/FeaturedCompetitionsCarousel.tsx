"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Competition } from "@/types/db";
import { CompetitionCard } from "@/components/CompetitionCard";
import { SafePrizeImage } from "@/components/SafePrizeImage";
import { Carousel, CarouselApi, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { competitionThumbImageUrl } from "@/lib/competitionImages";

interface Props {
  items: Competition[];
  loading?: boolean;
}

export function FeaturedCompetitionsCarousel({ items, loading }: Props) {
  const [api, setApi] = useState<CarouselApi | null>(null);
  const [index, setIndex] = useState(0);
  const [count, setCount] = useState(0);
  const isMobile = useIsMobile();
  const [reducedMotion, setReducedMotion] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const resumeTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!api) return;
    setCount(api.scrollSnapList().length);
    const onSelect = () => setIndex(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  useEffect(() => {
    if (!api) return;
    const autoEligible = !isMobile && !reducedMotion;
    const clearAuto = () => {
      if (intervalRef.current != null) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    const startAuto = () => {
      clearAuto();
      if (!autoEligible || document.hidden) return;
      intervalRef.current = window.setInterval(() => api.scrollNext(), 7000);
    };
    const pauseThenResume = () => {
      clearAuto();
      if (resumeTimeoutRef.current != null) window.clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = window.setTimeout(startAuto, 10000);
    };
    const onVisibility = () => {
      document.hidden ? clearAuto() : startAuto();
    };
    startAuto();
    api.on("pointerDown", pauseThenResume);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearAuto();
      if (resumeTimeoutRef.current != null) window.clearTimeout(resumeTimeoutRef.current);
      api.off("pointerDown", pauseThenResume);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [api, isMobile, reducedMotion]);

  const thumbs = useMemo(() => items.map((c) => ({ id: c.id, url: competitionThumbImageUrl(c), title: c.title })), [items]);

  return (
    <div className="relative container mx-auto px-4 pb-8 pt-8 md:pb-10 md:pt-10 md:animate-fade-up md:[animation-delay:120ms]">
      {items.length === 0 && loading ? (
        <div className="mx-auto max-w-7xl">
          <div className="mb-4 flex items-end justify-between">
            <div className="text-left">
              <div className="flex items-center gap-3">
                <span className="eyebrow">Featured prizes</span>
                <span aria-hidden className="h-px max-w-[80px] flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
              </div>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight td-text md:text-4xl">
                Live right now
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="td-public-card aspect-[3/4] animate-pulse rounded-2xl" />)}
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="td-public-card mx-auto max-w-2xl rounded-2xl p-10 text-center td-soft backdrop-blur">
          Featured competitions coming soon.
        </div>
      ) : (
        <>
          <div className="mx-auto mb-4 flex max-w-7xl items-end justify-between">
            <div className="text-left">
              <div className="flex items-center gap-3">
                <span className="eyebrow">Featured prizes</span>
                <span aria-hidden className="h-px max-w-[80px] flex-1 bg-gradient-to-r from-primary/60 to-transparent" />
              </div>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight td-text md:text-4xl">
                Live right now
              </h2>
            </div>
            <Link href="/competitions" className="hidden items-center gap-1 text-xs font-bold uppercase tracking-wider td-muted hover:text-[color:var(--td-text)] sm:inline-flex">
              View all <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mx-auto max-w-7xl">
            <Carousel setApi={setApi} opts={{ loop: true, align: "start", duration: 18 }}>
              <CarouselContent className="-ml-3 md:-ml-4">
                {items.map((c) => (
                  <CarouselItem key={c.id} className="basis-[85%] pl-3 sm:basis-1/2 md:basis-1/3 md:pl-4 lg:basis-1/4 2xl:basis-1/5">
                    <CompetitionCard c={c} />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
            {isMobile && thumbs.length > 1 ? (
              <>
                <div className="mt-3 flex snap-x gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {thumbs.map((t, i) => (
                    <button
                      key={t.id}
                      type="button"
                      aria-label={`Show ${t.title}`}
                      onClick={() => api?.scrollTo(i)}
                      style={{ flex: "0 0 calc((100% - 24px) / 4)" }}
                      className={cn("aspect-square snap-start overflow-hidden rounded-md border-2 transition", i === index ? "border-primary opacity-100 ring-2 ring-primary/40" : "td-border opacity-60")}
                    >
                      <SafePrizeImage url={t.url} alt="" aspect="aspect-square" width={96} height={96} />
                    </button>
                  ))}
                </div>
                {count > 1 ? (
                  <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(((index + 1) / count) * 100)} aria-label="Carousel position" className="td-progress-track mt-3 h-1 w-full overflow-hidden rounded-full">
                    <div className="h-full rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)] transition-[width] duration-300 ease-out" style={{ width: `${Math.max(8, ((index + 1) / count) * 100)}%` }} />
                  </div>
                ) : null}
              </>
            ) : null}
            {!isMobile && count > 1 ? (
              <div className="mt-5 flex justify-center gap-2">
                {Array.from({ length: count }).map((_, i) => (
                  <button key={i} aria-label={`Go to slide ${i + 1}`} onClick={() => api?.scrollTo(i)} className={`h-1.5 rounded-full transition-all ${i === index ? "w-10 bg-primary shadow-glow-soft" : "w-4 bg-[color:var(--td-surface-hover)] hover:bg-[color:var(--td-border-strong)]"}`} />
                ))}
              </div>
            ) : null}
          </div>
        </>
      )}
    </div>
  );
}
