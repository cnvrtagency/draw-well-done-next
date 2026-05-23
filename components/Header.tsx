"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu, User, X } from "lucide-react";
import { brand } from "@/config/brand";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { MiniCartTrigger } from "@/components/MiniCart";
import { useAuth } from "@/hooks/useAuth";
import { WalletPill } from "@/components/WalletPill";

const promo = ["Live competitions open now", "18+ only", "Free postal entry route", "Winners published", "Entry caps shown upfront", "UK prize competitions"];
const navItems = [
  { to: "/competitions", label: "Competitions" },
  { to: "/build-a-bundle", label: "Bundle Builder" },
  { to: "/winners", label: "Winners" },
  { to: "/faqs", label: "Help Centre" },
];

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-1.5 group" aria-label={`${brand.name} home`}>
      <img src="/assets/topdraw-logo.png" alt={`${brand.name} logo`} width={470} height={95} className="h-9 md:h-8 w-auto select-none group-hover:opacity-90 transition" draggable={false} />
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const { user, isAdmin, loading, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const linkCls = (to: string) =>
    `relative font-display text-[13px] font-bold tracking-[0.06em] uppercase transition py-1 ${
      pathname === to || pathname.startsWith(`${to}/`)
        ? "text-white after:absolute after:left-0 after:right-0 after:-bottom-0.5 after:h-px after:bg-primary after:shadow-[0_0_8px_hsl(204_100%_55%/.9)]"
        : "text-white hover:text-transparent hover:bg-clip-text hover:bg-gradient-to-r hover:from-white hover:to-primary"
    }`;
  const closeAndSignOut = async () => {
    setOpen(false);
    await signOut();
  };

  return (
    <header className={`sticky top-0 z-40 backdrop-blur-xl border-b border-white/10 transition-colors duration-300 ${scrolled ? "bg-background/85 shadow-[0_1px_0_0_hsl(204_100%_55%/0.25),0_8px_24px_-12px_hsl(204_100%_30%/0.4)]" : "bg-background/60 shadow-[0_1px_0_0_hsl(204_100%_55%/0.12)]"}`}>
      <div className="container mx-auto px-4 grid grid-cols-[auto_1fr_auto] lg:flex h-16 lg:h-[72px] items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3 lg:hidden">
          <button aria-label="Open menu" onClick={() => setOpen(true)} className="w-10 h-10 grid place-items-center rounded-md text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-primary/60">
            <Menu className="w-5 h-5" />
          </button>
        </div>
        <div className="hidden lg:block"><Wordmark /></div>
        <div className="lg:hidden justify-self-center"><Wordmark /></div>
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
          {navItems.map((n) => <Link key={n.to} href={n.to} className={linkCls(n.to)}>{n.label}</Link>)}
        </nav>
        <div className="flex items-center gap-2">
          <WalletPill />
          <MiniCartTrigger />
          {!loading && user ? (
            <>
              {isAdmin ? (
                <Button asChild variant="outline" size="sm" className="hidden lg:inline-flex border-white/20 bg-transparent text-white hover:bg-white/10 font-display uppercase tracking-[0.06em] text-xs">
                  <Link href="/admin">Admin</Link>
                </Button>
              ) : null}
              <Button asChild variant="ghost" size="sm" className="hidden lg:inline-flex text-white hover:bg-white/10 font-display uppercase tracking-[0.06em] text-xs">
                <Link href="/account">Account</Link>
              </Button>
            </>
          ) : !loading ? (
            <Button asChild variant="ghost" size="sm" className="hidden lg:inline-flex text-white hover:bg-white/10 font-display uppercase tracking-[0.06em] text-xs">
              <Link href="/login">Log in</Link>
            </Button>
          ) : null}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-black/60" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="relative h-dvh w-[88%] max-w-sm !bg-[hsl(222_45%_4%)] border-r border-white/10 p-0 text-white shadow-[0_0_0_1px_hsl(204_100%_55%/0.08),0_30px_80px_-20px_hsl(0_0%_0%/0.8)]">
            <div className="relative flex items-center justify-between p-4 border-b border-white/10">
              <Wordmark />
              <button aria-label="Close menu" onClick={() => setOpen(false)} className="w-9 h-9 grid place-items-center rounded-md hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-primary/60"><X className="w-5 h-5" /></button>
            </div>
            <nav className="relative flex flex-col px-2 py-1 divide-y divide-white/10">
              {navItems.map((n) => (
                <Link key={n.to} href={n.to} onClick={() => setOpen(false)} className={`flex items-center justify-between px-3 py-4 font-display text-[14px] font-bold uppercase tracking-[0.06em] ${pathname === n.to ? "text-white" : "text-white/85 hover:text-white"}`}>
                  <span>{n.label}</span><ChevronRight className="w-4 h-4 text-white/50" />
                </Link>
              ))}
            </nav>
            <div className="px-4 pt-4">
              <Link href="/free-entry" onClick={() => setOpen(false)} className="block rounded-lg border border-info/40 bg-info/10 px-4 py-3 font-display text-[13px] font-bold uppercase tracking-[0.06em] text-info">Free postal entry route →</Link>
            </div>
            <div className="relative p-4 border-t border-white/10 mt-2 space-y-2">
              {!loading && user ? (
                <>
                  <div className="flex items-center gap-3 px-1 pb-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-electric text-white">
                      <User className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold uppercase tracking-wider text-white/55">Signed in</div>
                      <div className="truncate text-sm text-white">{user.email}</div>
                    </div>
                  </div>
                  {isAdmin ? <Button asChild variant="outline" className="w-full border-white/20 bg-transparent text-white hover:bg-white/10 font-display uppercase tracking-[0.06em] text-xs"><Link href="/admin" onClick={() => setOpen(false)}>Admin</Link></Button> : null}
                  <Button asChild variant="outline" className="w-full border-white/20 bg-transparent text-white hover:bg-white/10 font-display uppercase tracking-[0.06em] text-xs"><Link href="/account" onClick={() => setOpen(false)}>My account</Link></Button>
                  <Button className="w-full btn-primary-glow font-display font-bold uppercase tracking-[0.06em] text-xs" onClick={closeAndSignOut}>Sign out</Button>
                </>
              ) : !loading ? (
                <>
                  <Button asChild variant="outline" className="w-full border-white/20 bg-transparent text-white hover:bg-white/10 font-display uppercase tracking-[0.06em] text-xs"><Link href="/login" onClick={() => setOpen(false)}>Log in</Link></Button>
                  <Button asChild className="w-full btn-primary-glow font-display font-bold uppercase tracking-[0.06em] text-xs"><Link href="/register" onClick={() => setOpen(false)}>Create account</Link></Button>
                </>
              ) : (
                <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-bold uppercase tracking-[0.06em] text-white/55">Checking session...</div>
              )}
            </div>
          </aside>
        </div>
      )}

      <div className="relative border-t border-white/5 bg-gradient-to-r from-primary/15 via-info/10 to-accent/15 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent z-10" />
        <div className="animate-marquee flex whitespace-nowrap py-2 text-[11px] font-bold uppercase tracking-[0.18em] text-white/85">
          {[...promo, ...promo, ...promo].map((p, i) => (
            <span key={i} className="px-6 inline-flex items-center gap-2"><span className="text-primary">◆</span>{p}</span>
          ))}
        </div>
      </div>
    </header>
  );
}
