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

  if (loading) return <div className="p-8 td-soft">Loading...</div>;
  if (!user) return null;

  return (
    <div className="container relative mx-auto grid flex-1 gap-5 px-4 py-6 md:grid-cols-[236px_1fr] md:gap-7 md:py-7">
      <div className="account-bg-mesh pointer-events-none absolute inset-x-0 top-0 -z-0 h-[420px]" />
      <div className="account-bg-glow pointer-events-none absolute inset-x-0 top-24 -z-0 h-[360px]" />
      <aside className="account-panel relative h-fit self-start p-3 backdrop-blur-xl md:sticky md:top-20">
        <div className="px-3 pb-3 pt-1"><div className="eyebrow">My account</div></div>
        <nav className="space-y-1" aria-label="Account navigation">
          {nav.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link key={href} href={href} className={`group relative flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition ${active ? "border-primary/35 bg-primary/15 font-semibold text-[color:var(--td-text)] shadow-[0_10px_28px_-18px_hsl(var(--primary)/0.65),inset_0_1px_0_hsl(var(--primary)/0.08)]" : "border-transparent td-muted hover:border-[color:var(--td-border-muted)] hover:bg-[color:var(--td-surface-hover)] hover:text-[color:var(--td-text)]"}`}>
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
