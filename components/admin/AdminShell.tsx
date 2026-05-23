"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Award,
  BookOpen,
  CreditCard,
  ExternalLink,
  Gavel,
  Image as ImageIcon,
  LayoutDashboard,
  Library,
  LifeBuoy,
  LogOut,
  Mail,
  Search,
  Send,
  Star,
  Tag,
  Trophy,
  UserCircle,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const nav = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/competitions", label: "Competitions", icon: Trophy },
  { href: "/admin/content-library", label: "Content", icon: Library },
  { href: "/admin/guides", label: "Guides", icon: BookOpen },
  { href: "/admin/seo-centre", label: "SEO Centre", icon: Search },
  { href: "/admin/emails", label: "Emails", icon: Send },
  { href: "/admin/hero-banners", label: "Hero banners", icon: ImageIcon },
  { href: "/admin/entries", label: "Entries", icon: Users },
  { href: "/admin/postal-entries", label: "Postal entries", icon: Mail },
  { href: "/admin/draws", label: "Draws", icon: Gavel },
  { href: "/admin/winners", label: "Winners", icon: Award },
  { section: "Phase 2" },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/orders", label: "Orders", icon: CreditCard },
  { href: "/admin/customers", label: "Customers", icon: UserCircle },
  { href: "/admin/discount-codes", label: "Discount codes", icon: Tag },
  { href: "/admin/wallet-settings", label: "Wallet settings", icon: Wallet },
  { href: "/admin/faqs", label: "FAQs", icon: LifeBuoy },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
] as const;

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, router, user]);

  if (loading) return <div className="p-8 text-white/60">Loading...</div>;
  if (!user) return null;
  if (!isAdmin) {
    return (
      <div className="theme-dark min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-2xl font-semibold text-white">Admin only</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/65">
            Your account does not have the admin role. See <code className="rounded bg-white/10 px-1 py-0.5">db/FIRST_ADMIN.md</code> for the SQL snippet
            to grant yourself admin in your external Supabase project.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="theme-dark relative grid min-h-screen bg-background text-foreground md:grid-cols-[260px_1fr]">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-hero-mesh opacity-50" />
      <aside className="flex flex-col border-r border-white/10 bg-[hsl(222_38%_5%/0.85)] backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-2 border-b border-white/10 px-4 py-4">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-primary to-info text-sm font-extrabold text-white shadow-glow-soft">T</span>
          <div>
            <div className="font-display text-sm font-bold leading-tight text-white">TopDraw</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-primary">Admin console</div>
          </div>
        </Link>
        <nav className="flex-1 space-y-1 overflow-y-auto p-2" aria-label="Admin navigation">
          {nav.map((item, index) => {
            if ("section" in item) return <div key={`${item.section}-${index}`} className="eyebrow mt-3 border-t border-white/10 px-3 pt-3">{item.section}</div>;
            const exact = "exact" in item && item.exact;
            const active = exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition ${active ? "border-primary/30 bg-primary/15 font-semibold text-white shadow-glow-soft" : "border-transparent text-white/65 hover:bg-white/5 hover:text-white"}`}>
                <Icon className="h-4 w-4" /> {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex gap-2 border-t border-white/10 p-3">
          <Button asChild variant="outline" size="sm" className="flex-1"><Link href="/"><ExternalLink className="mr-1 h-3.5 w-3.5" /> Public</Link></Button>
          <Button variant="outline" size="sm" onClick={signOut}><LogOut className="h-3.5 w-3.5" /></Button>
        </div>
      </aside>
      <main className="min-w-0 px-4 py-6 sm:px-6 md:py-8 lg:px-8">
        <div className="mx-auto w-full max-w-[1600px]">{children}</div>
      </main>
    </div>
  );
}
