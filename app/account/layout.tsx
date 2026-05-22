"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { ArrowLeftRight, LayoutDashboard, LifeBuoy, Receipt, ShieldCheck, Ticket, Trophy, UserCog, Wallet as WalletIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const nav = [
  { href: "/account", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/account/entries", label: "My tickets", icon: Ticket },
  { href: "/account/orders", label: "Orders", icon: Receipt },
  { href: "/account/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/account/wins", label: "My wins", icon: Trophy },
  { href: "/account/wallet", label: "Wallet", icon: WalletIcon },
  { href: "/account/profile", label: "Profile details", icon: UserCog },
  { href: "/account/security", label: "Login & security", icon: ShieldCheck },
  { href: "/account/responsible-play", label: "Responsible play", icon: LifeBuoy },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const firstLoad = useRef(true);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, router, user]);

  useEffect(() => {
    if (firstLoad.current) {
      firstLoad.current = false;
      return;
    }
    if (window.matchMedia("(max-width: 1023px)").matches) {
      document.getElementById("account-content")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [pathname]);

  if (loading) return <div className="p-8 text-white/60">Loading...</div>;
  if (!user) return null;

  return (
    <div className="container relative mx-auto grid flex-1 gap-5 px-4 py-6 md:grid-cols-[236px_1fr] md:gap-7 md:py-7">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[420px] bg-hero-mesh opacity-85" />
      <div className="pointer-events-none absolute inset-x-0 top-24 -z-0 h-[360px] bg-[radial-gradient(60%_45%_at_50%_0%,hsl(204_100%_55%/0.10),transparent_70%)]" />
      <aside className="relative h-fit self-start rounded-2xl border border-white/10 bg-[linear-gradient(180deg,hsl(222_28%_12%/0.88),hsl(222_34%_7%/0.82))] p-3 shadow-[0_20px_60px_-30px_hsl(204_100%_35%/0.55),inset_0_1px_0_hsl(0_0%_100%/0.08)] backdrop-blur-xl md:sticky md:top-20">
        <div className="px-3 pb-3 pt-1"><div className="eyebrow">My account</div></div>
        <nav className="space-y-1" aria-label="Account navigation">
          {nav.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link key={href} href={href} className={`group relative flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${active ? "border-primary/35 bg-primary/15 font-semibold text-white shadow-[0_10px_28px_-18px_hsl(var(--primary)/0.9),inset_0_1px_0_hsl(0_0%_100%/0.08)]" : "border-transparent text-white/70 hover:border-white/10 hover:bg-white/[0.055] hover:text-white"}`}>
                <Icon className="h-4 w-4 shrink-0 text-primary group-hover:text-primary" /> {label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div id="account-content" className="relative min-w-0 scroll-mt-24">{children}</div>
    </div>
  );
}
