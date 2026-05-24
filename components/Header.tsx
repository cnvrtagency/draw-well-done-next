"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu, Moon, Sun, User, X } from "lucide-react";
import { brand } from "@/config/brand";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { MiniCartTrigger } from "@/components/MiniCart";
import { useAuth } from "@/hooks/useAuth";
import { WalletPill } from "@/components/WalletPill";
import { useTheme } from "@/hooks/useTheme";

const navItems = [
  { to: "/competitions", label: "Competitions" },
  { to: "/build-a-bundle", label: "Bundle Builder" },
  { to: "/winners", label: "Winners" },
  { to: "/faqs", label: "Help Centre" },
];

function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-1.5 group" aria-label={`${brand.name} home`}>
      <img src="/assets/topdraw-logo.png" alt={`${brand.name} logo`} width={470} height={95} className="td-logo-dark h-9 md:h-8 w-auto select-none group-hover:opacity-90 transition" draggable={false} />
      <img src="/assets/topdraw-logo-light-mode.png" alt={`${brand.name} logo`} width={470} height={95} className="td-logo-light h-9 md:h-8 w-auto select-none group-hover:opacity-90 transition" draggable={false} />
    </Link>
  );
}

function ThemeToggle({ mobile = false }: { mobile?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLight = mounted && resolvedTheme === "light";
  const nextTheme = isLight ? "dark" : "light";
  const label = mounted ? `Switch to ${nextTheme} mode` : "Toggle colour theme";
  const Icon = isLight ? Moon : Sun;

  if (mobile) {
    return (
      <button
        type="button"
        aria-label={label}
        aria-pressed={isLight}
        onClick={() => setTheme(nextTheme)}
        className="td-header-control td-icon-button flex min-h-11 w-full items-center justify-between rounded-lg px-4 py-3 text-left font-display text-[13px] font-bold uppercase tracking-[0.06em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
      >
        <span>{isLight ? "Dark mode" : "Light mode"}</span>
        <span className="td-header-control grid h-8 w-8 place-items-center rounded-full text-[color:var(--td-text)]">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isLight}
      title={label}
      onClick={() => setTheme(nextTheme)}
      className="td-header-control td-icon-button hidden h-10 w-10 place-items-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 lg:grid"
    >
      <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
    </button>
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
        ? "td-nav-link-active"
        : "td-nav-link"
    }`;
  const closeAndSignOut = async () => {
    setOpen(false);
    await signOut();
  };

  return (
    <header className={`td-header sticky top-0 z-40 transition-colors duration-300 ${scrolled ? "is-scrolled" : ""}`}>
      <div className="container mx-auto px-4 pt-2 md:pt-3">
        <div className="td-header-shell mx-auto max-w-7xl grid grid-cols-[auto_1fr_auto] items-center gap-4 px-3 py-2 lg:flex lg:h-[68px] lg:justify-between lg:px-4 xl:px-5">
          <div className="flex items-center gap-3 lg:hidden">
            <button aria-label="Open menu" onClick={() => setOpen(true)} className="td-header-control td-icon-button grid h-10 w-10 place-items-center rounded-xl focus-visible:ring-2 focus-visible:ring-primary/60">
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <div className="hidden lg:block"><Wordmark /></div>
          <div className="lg:hidden justify-self-center"><Wordmark /></div>
          <nav className="td-header-nav hidden lg:flex items-center gap-1.5 xl:gap-2" aria-label="Primary navigation">
            {navItems.map((n) => <Link key={n.to} href={n.to} className={`${linkCls(n.to)} td-header-nav-link`}>{n.label}</Link>)}
          </nav>
          <div className="flex items-center justify-end gap-2">
            <WalletPill />
            <MiniCartTrigger />
            <ThemeToggle />
            {!loading && user ? (
              <>
                {isAdmin ? (
                  <Button asChild variant="outline" size="sm" className="td-header-control hidden h-10 rounded-xl border-0 bg-transparent px-3.5 text-xs uppercase tracking-[0.06em] text-[color:var(--td-text)] lg:inline-flex">
                    <Link href="/admin">Admin</Link>
                  </Button>
                ) : null}
                <Button asChild variant="ghost" size="sm" className="td-header-control hidden h-10 rounded-xl px-3.5 text-xs uppercase tracking-[0.06em] text-[color:var(--td-text)] lg:inline-flex">
                  <Link href="/account">Account</Link>
                </Button>
              </>
            ) : !loading ? (
              <Button asChild variant="ghost" size="sm" className="td-header-control hidden h-10 rounded-xl px-3.5 text-xs uppercase tracking-[0.06em] text-[color:var(--td-text)] lg:inline-flex">
                <Link href="/login">Log in</Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="td-modal-backdrop absolute inset-0" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="td-mobile-menu td-header-mobile-menu relative h-dvh w-[88%] max-w-sm overflow-hidden p-0">
            <div className="relative flex items-center justify-between border-b td-border px-4 py-4">
              <Wordmark />
              <button aria-label="Close menu" onClick={() => setOpen(false)} className="td-header-control td-icon-button grid h-9 w-9 place-items-center rounded-xl focus-visible:ring-2 focus-visible:ring-primary/60"><X className="w-5 h-5" /></button>
            </div>
            <nav className="relative flex flex-col px-3 py-3">
              {navItems.map((n) => (
                <Link key={n.to} href={n.to} onClick={() => setOpen(false)} className={`td-header-mobile-link flex items-center justify-between px-3.5 py-3.5 font-display text-[14px] font-bold uppercase tracking-[0.06em] ${pathname === n.to ? "is-active text-[color:var(--td-text)]" : "td-muted hover:text-[color:var(--td-text)]"}`}>
                  <span>{n.label}</span><ChevronRight className="w-4 h-4 text-[color:var(--td-text-soft)]" />
                </Link>
              ))}
            </nav>
            <div className="px-4 pt-4">
              <Link href="/free-entry" onClick={() => setOpen(false)} className="td-header-control block rounded-xl px-4 py-3 font-display text-[13px] font-bold uppercase tracking-[0.06em] text-info">Free postal entry route →</Link>
            </div>
            <div className="relative mt-3 space-y-2 border-t td-border p-4">
              <ThemeToggle mobile />
              {!loading && user ? (
                <>
                  <div className="flex items-center gap-3 px-1 pb-3">
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-electric text-white">
                      <User className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="td-soft text-xs font-bold uppercase tracking-wider">Signed in</div>
                      <div className="truncate text-sm text-[color:var(--td-text)]">{user.email}</div>
                    </div>
                  </div>
                  {isAdmin ? <Button asChild variant="outline" className="td-header-control w-full border-0 bg-transparent font-display text-xs uppercase tracking-[0.06em] text-[color:var(--td-text)]"><Link href="/admin" onClick={() => setOpen(false)}>Admin</Link></Button> : null}
                  <Button asChild variant="outline" className="td-header-control w-full border-0 bg-transparent font-display text-xs uppercase tracking-[0.06em] text-[color:var(--td-text)]"><Link href="/account" onClick={() => setOpen(false)}>My account</Link></Button>
                  <Button className="w-full btn-primary-glow font-display font-bold uppercase tracking-[0.06em] text-xs" onClick={closeAndSignOut}>Sign out</Button>
                </>
              ) : !loading ? (
                <>
                  <Button asChild variant="outline" className="td-header-control w-full border-0 bg-transparent font-display text-xs uppercase tracking-[0.06em] text-[color:var(--td-text)]"><Link href="/login" onClick={() => setOpen(false)}>Log in</Link></Button>
                  <Button asChild className="w-full btn-primary-glow font-display font-bold uppercase tracking-[0.06em] text-xs"><Link href="/register" onClick={() => setOpen(false)}>Create account</Link></Button>
                </>
              ) : (
                <div className="td-minicart-card rounded-lg px-4 py-3 text-xs font-bold uppercase tracking-[0.06em] td-soft">Checking session...</div>
              )}
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}
