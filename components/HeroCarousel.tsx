"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Ticket } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import type { Competition } from "@/types/db";
import { effectiveRemaining } from "@/lib/format";
import { cn } from "@/lib/utils";
import { FeaturedCompetitionsCarousel } from "@/components/home/FeaturedCompetitionsCarousel";
import { useMounted } from "@/hooks/useMounted";

interface Props { items: Competition[]; loading?: boolean; }

type HeroBanner = {
  eyebrow: string | null;
  headline_before_accent: string | null;
  headline_accent: string | null;
  headline_after_accent: string | null;
  body: string | null;
  promo_badge_text: string | null;
  primary_cta_label: string | null;
  primary_cta_url: string | null;
  secondary_cta_label?: string | null;
  secondary_cta_url?: string | null;
  trust_chips?: string[] | null;
  desktop_image_url: string | null;
  mobile_image_url: string | null;
  image_alt: string | null;
  image_position_desktop: "left" | "center" | "right" | null;
  image_position_mobile: "left" | "center" | "right" | null;
  overlay_strength: "light" | "medium" | "strong" | null;
};

const fallbackHeroBanner: HeroBanner = {
  eyebrow: "FEATURED COMPETITION",
  headline_before_accent: "WIN THE",
  headline_accent: "PLAYSTATION 5 SLIM",
  headline_after_accent: "FOR JUST £1.99",
  body: null,
  promo_badge_text: "ONLY 500 TICKETS",
  primary_cta_label: "ENTER NOW",
  primary_cta_url: null,
  secondary_cta_label: "VIEW ALL COMPETITIONS",
  secondary_cta_url: "/competitions",
  trust_chips: ["18+ UK ONLY", "FREE POSTAL ENTRY", "WINNERS PUBLISHED"],
  desktop_image_url: "/media/playstation-comp-1600.webp",
  mobile_image_url: "/media/playstation-comp-mobile-900.webp",
  image_alt: "PlayStation 5 Slim bundle",
  image_position_desktop: "right",
  image_position_mobile: "center",
  overlay_strength: "medium",
};

function imagePositionClass(position: HeroBanner["image_position_desktop"], mobile?: boolean) {
  if (position === "left") return "object-left";
  if (position === "center") return "object-center";
  if (mobile) return "object-[68%_center]";
  return "object-[72%_center]";
}

function responsiveImagePositionClass(hero: HeroBanner) {
  const desktop = hero.image_position_desktop === "left" ? "md:object-left" : hero.image_position_desktop === "center" ? "md:object-center" : "md:object-[72%_center]";
  return cn(imagePositionClass(hero.image_position_mobile, true), desktop);
}

function overlayClass(strength: HeroBanner["overlay_strength"]) {
  if (strength === "light") return "bg-[linear-gradient(90deg,hsl(222_54%_3%/0.93)_0%,hsl(222_46%_4%/0.86)_34%,hsl(222_38%_6%/0.38)_58%,hsl(222_35%_8%/0.08)_82%,hsl(222_35%_8%/0.02)_100%)]";
  if (strength === "strong") return "bg-[linear-gradient(90deg,hsl(222_58%_2%/1)_0%,hsl(222_50%_3%/0.98)_39%,hsl(222_42%_5%/0.58)_62%,hsl(222_35%_8%/0.16)_84%,hsl(222_35%_8%/0.04)_100%)]";
  return "bg-[linear-gradient(90deg,hsl(222_56%_2%/0.99)_0%,hsl(222_48%_3%/0.94)_36%,hsl(222_40%_5%/0.48)_60%,hsl(222_35%_8%/0.12)_84%,hsl(222_35%_8%/0.03)_100%)]";
}

function mobileOverlayClass() {
  return "bg-[radial-gradient(110%_80%_at_0%_0%,hsl(222_58%_2%/0.98)_0%,hsl(222_50%_3%/0.82)_44%,transparent_76%),linear-gradient(180deg,hsl(222_50%_2%/0.9)_0%,hsl(222_42%_4%/0.56)_36%,hsl(222_35%_8%/0.15)_72%,hsl(222_35%_8%/0.03)_100%)]";
}

function renderHeadlineAfter(text: string) {
  const price = "£1.99";
  if (!text.includes(price)) return text;
  const [before, after] = text.split(price);
  return (
    <>
      {before}
      <span className="relative inline-block whitespace-nowrap text-white">
        {price}
        <span aria-hidden className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-gradient-to-r from-primary via-info to-primary shadow-[0_0_16px_hsl(var(--primary)/0.7)]" />
      </span>
      {after}
    </>
  );
}

function getCountdownParts(target: string | null | undefined) {
  if (!target) return null;
  const ms = new Date(target).getTime() - Date.now();
  if (!Number.isFinite(ms) || ms <= 0) return null;
  return {
    days: Math.floor(ms / 86400000),
    hours: Math.floor((ms % 86400000) / 3600000),
    minutes: Math.floor((ms % 3600000) / 60000),
    seconds: Math.floor((ms % 60000) / 1000),
  };
}

function HeroFloatingTimer({ competition }: { competition?: Competition }) {
  const [, setTick] = useState(0);
  const mounted = useMounted();
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, []);
  const parts = mounted ? getCountdownParts(competition?.status === "live" ? competition.closes_at : null) : null;
  if (mounted && !parts) return null;
  const items = [
    { value: parts?.days, label: "DAYS" },
    { value: parts?.hours, label: "HRS" },
    { value: parts?.minutes, label: "MIN" },
    { value: parts?.seconds, label: "SEC" },
  ];
  return (
    <div className="absolute inset-x-0 bottom-4 z-20 px-5 sm:px-7 md:inset-x-auto md:bottom-6 md:right-6 md:px-0">
      <div className="td-marketing-card mx-auto w-full max-w-[23rem] rounded-xl px-3 py-2 backdrop-blur-md sm:max-w-[27rem] md:mx-0 md:w-fit md:max-w-none md:px-4 md:py-3">
        <div className="flex items-end justify-center gap-1.5 sm:gap-2 md:gap-3">
          {items.map((item, index) => (
            <div key={item.label} className="flex items-end gap-1.5 md:gap-2">
              {index > 0 ? <span className="pb-[18px] text-xs font-black text-info/70 md:pb-[22px] md:text-sm">:</span> : null}
              <div className="min-w-[38px] text-center md:min-w-[50px]">
                <div className="font-mono-num text-base font-black leading-none td-text sm:text-lg md:text-2xl">{item.value == null ? "--" : String(item.value).padStart(2, "0")}</div>
                <div className="mt-1 text-[7px] font-extrabold uppercase tracking-[0.14em] text-info/80 md:text-[8px]">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ticketBadgeText(competition?: Competition, hero: HeroBanner = fallbackHeroBanner) {
  if (competition?.status === "live") {
    const remaining = effectiveRemaining(competition.current_entries, competition.manual_reserved_entries, competition.max_entries);
    const noun = remaining === 1 ? "TICKET" : "TICKETS";
    return `ONLY ${remaining.toLocaleString()} ${noun} LEFT`;
  }
  return hero.promo_badge_text || fallbackHeroBanner.promo_badge_text;
}

export function HeroCarousel({ items, loading }: Props) {
  const [heroBanner, setHeroBanner] = useState<HeroBanner | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadHeroBanner() {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !anon) return;
      const supabase = createClient(url, anon);
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("hero_banners")
        .select("id,eyebrow,headline_before_accent,headline_accent,headline_after_accent,body,promo_badge_text,promo_badge_variant,cash_alternative_text,primary_cta_label,primary_cta_url,secondary_cta_label,secondary_cta_url,trust_chips,desktop_image_url,mobile_image_url,image_alt,image_position_desktop,image_position_mobile,overlay_strength")
        .eq("page_key", "homepage")
        .eq("is_active", true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gt.${now}`)
        .order("sort_order", { ascending: true })
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (cancelled || !data) return;
      const banner = data as Partial<HeroBanner>;
      setHeroBanner({
        ...fallbackHeroBanner,
        ...banner,
        trust_chips: Array.isArray(banner.trust_chips) ? banner.trust_chips.filter((chip): chip is string => typeof chip === "string") : fallbackHeroBanner.trust_chips,
      });
    }
    loadHeroBanner();
    return () => {
      cancelled = true;
    };
  }, []);

  const hero = heroBanner ?? fallbackHeroBanner;
  const heroCompetition = useMemo(() => {
    const match = hero.primary_cta_url?.match(/\/competitions\/([^/?#]+)/);
    const slug = match?.[1] ?? null;
    return (slug ? items.find((item) => item.slug === slug) : null) ?? items[0];
  }, [hero.primary_cta_url, items]);
  const primaryHref = hero.primary_cta_url || (heroCompetition?.slug ? `/competitions/${heroCompetition.slug}` : "/competitions");
  const desktopSrc = hero.desktop_image_url || fallbackHeroBanner.desktop_image_url || "/media/playstation-comp-1600.webp";
  const mobileSrc = hero.mobile_image_url || desktopSrc;
  const isDefaultHero = desktopSrc.includes("playstation-comp");
  const isDefaultMobile = mobileSrc.includes("playstation-comp");
  return (
    <section className="relative overflow-hidden">
      <div className="relative container mx-auto px-4 pt-5 md:pt-8">
        <div className="relative mx-auto max-w-7xl min-h-[620px] overflow-hidden rounded-[26px] border border-primary/20 bg-[hsl(222_40%_5%/0.78)] shadow-[0_34px_110px_-58px_hsl(var(--primary)/0.70),inset_0_1px_0_hsl(0_0%_100%/0.08)] sm:min-h-[660px] md:min-h-0 md:rounded-[34px]">
          <picture className="pointer-events-none absolute inset-0 block h-full w-full">
            <source media="(max-width: 767px)" srcSet={isDefaultMobile ? "/media/playstation-comp-mobile-900.webp 900w" : mobileSrc} sizes="100vw" />
            <source media="(min-width: 768px)" type={isDefaultHero ? "image/webp" : undefined} srcSet={isDefaultHero ? "/media/playstation-comp-1600.webp 1600w, /media/playstation-comp-2200.webp 2200w" : desktopSrc} sizes="(min-width: 1280px) 1280px, calc(100vw - 32px)" />
            <img src={isDefaultHero ? "/media/playstation-comp-1600.webp" : desktopSrc} alt={hero.image_alt || ""} loading="eager" decoding="async" width={2200} height={917} fetchPriority="high" className={cn("absolute inset-0 h-full w-full object-cover", responsiveImagePositionClass(hero))} />
          </picture>
          <div className={cn("pointer-events-none absolute inset-0 hidden md:block", overlayClass(hero.overlay_strength))} />
          <div className={cn("pointer-events-none absolute inset-0 md:hidden", mobileOverlayClass())} />
          <div className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(180deg,hsl(222_48%_3%/0.16)_0%,transparent_46%,hsl(222_48%_3%/0.18)_100%)] md:block" />
          <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/25 blur-3xl md:h-80 md:w-80" />
          <div className="pointer-events-none absolute left-0 top-0 h-28 w-full bg-gradient-to-b from-primary/10 to-transparent md:hidden" />
          <HeroFloatingTimer competition={heroCompetition} />
          <div className="relative grid min-h-[620px] items-center px-5 py-8 sm:min-h-[660px] sm:px-7 md:h-auto md:min-h-[500px] md:grid-cols-[1fr_1fr] md:px-10 md:py-7 lg:min-h-[550px] lg:grid-cols-[1.04fr_0.96fr] lg:px-12">
            <div className="mx-auto w-full max-w-[23rem] text-left sm:max-w-[27rem] md:mx-0 md:max-w-[35rem] lg:max-w-[36rem]">
              <div className="mb-4 text-[10.5px] font-extrabold uppercase tracking-[0.24em] text-white/90">{hero.eyebrow}</div>
              <h1 className="font-display max-w-[39rem] text-[2.42rem] font-bold uppercase leading-[1.03] tracking-tight text-white sm:text-[2.7rem] md:max-w-[34rem] md:text-[3.15rem] md:leading-[1.06] lg:max-w-[35rem] lg:text-[3.85rem]">
                {hero.headline_before_accent} <span className="grad-text shimmer">{hero.headline_accent}</span> {renderHeadlineAfter(hero.headline_after_accent || "")}
              </h1>
              <div className="mt-6 flex flex-col items-start gap-2.5 sm:flex-row sm:items-center">
                <Link href={primaryHref} className="btn-primary-glow inline-flex h-12 items-center justify-center gap-2 rounded-xl px-7 text-xs font-extrabold uppercase tracking-wider">{hero.primary_cta_label} <Ticket className="h-4 w-4" /></Link>
                <span className="inline-flex h-12 items-center gap-2 rounded-xl border border-info/55 bg-[linear-gradient(135deg,hsl(204_100%_50%/0.18),hsl(222_34%_8%/0.78))] px-4 text-[11px] font-black uppercase tracking-[0.14em] text-white shadow-[0_0_0_1px_hsl(204_100%_70%/0.14),0_16px_34px_-22px_hsl(var(--primary)/0.95),inset_0_1px_0_hsl(0_0%_100%/0.16)] backdrop-blur-xl sm:px-5"><span className="h-2 w-2 shrink-0 rounded-full bg-info shadow-[0_0_14px_hsl(var(--info))]" />{ticketBadgeText(heroCompetition, hero)}</span>
              </div>
            </div>
            <div className="hidden md:block" />
          </div>
        </div>
      </div>
      <FeaturedCompetitionsCarousel items={items} loading={loading} />
    </section>
  );
}
