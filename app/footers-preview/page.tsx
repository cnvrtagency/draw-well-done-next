import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Lock, Mail, ShieldCheck, Sparkles, Users } from "lucide-react";
import { brand } from "@/config/brand";

export const metadata: Metadata = {
  title: "Footer concepts",
  robots: { index: false, follow: false },
};

const trustItems = [
  "18+ UK only",
  "Free postal entry route",
  "Winners published",
  "Secure checkout",
  "Entry caps shown upfront",
];

const playLinks = [
  { href: "/competitions", label: "Live competitions" },
  { href: "/winners", label: "Winners" },
  { href: "/past-competitions", label: "Past competitions" },
  { href: "/free-entry", label: "Free postal entry route" },
];

const helpLinks = [
  { href: "/faqs", label: "Help Centre" },
  { href: "/contact", label: "Contact" },
  { href: "/responsible-play", label: "Responsible play" },
];

const legalLinks = [
  { href: "/terms-and-conditions", label: "Terms and Conditions" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/cookie-policy", label: "Cookie Policy" },
  { href: "/free-entry", label: "Free Entry Method" },
];

const trustBadges = ["18+ UK only", "Secure checkout", "Winners published"];

function LinkColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <div className="font-extrabold mb-3 text-white uppercase text-[11px] tracking-wider">{title}</div>
      <ul className="space-y-2 text-white/65">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <Link href={link.href} className="hover:text-white transition-colors">{link.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function DashPanel({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="font-extrabold mb-3 text-white uppercase text-[11px] tracking-wider flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary))]" />
        {title}
      </div>
      <ul className="space-y-2 text-white/65 text-sm">
        {links.map((link) => (
          <li key={`${link.href}-${link.label}`}>
            <Link href={link.href} className="hover:text-white transition-colors">{link.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConceptOne() {
  return (
    <footer className="relative border-t border-white/10 bg-gradient-to-b from-background to-[hsl(222_50%_2%)] overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
      <div className="border-b border-white/10 bg-white/[0.02]">
        <div className="container mx-auto px-4 py-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] font-extrabold uppercase tracking-wider text-white/70">
          {trustItems.map((trust) => (
            <span key={trust} className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />
              {trust}
            </span>
          ))}
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 grid gap-10 lg:grid-cols-[1.2fr_2.4fr_1.2fr] text-sm">
        <div>
          <img src="/assets/topdraw-logo.png" alt={`${brand.name} logo`} className="h-9 w-auto mb-3" />
          <p className="text-white/85 text-sm leading-relaxed">UK prize competitions, drawn fairly.</p>
          <p className="text-white/55 text-xs leading-relaxed mt-3">
            Independent UK prize competitions with published winners, transparent entry caps and a genuine free postal entry route.
          </p>
          <a href={`mailto:${brand.supportEmail}`} className="inline-flex items-center gap-2 text-white/70 hover:text-white text-xs mt-4">
            <Mail className="w-3.5 h-3.5" /> {brand.supportEmail}
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          <LinkColumn title="Play" links={playLinks} />
          <LinkColumn title="Help" links={helpLinks} />
          <LinkColumn title="Legal" links={legalLinks} />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm p-5 shadow-[0_0_40px_-20px_hsl(var(--primary)/0.6)]">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-primary mb-2">Before you enter</div>
          <p className="text-white/75 text-xs leading-relaxed">
            Open to UK residents 18+. Every paid competition has a free postal entry route. Please play responsibly.
          </p>
          <div className="mt-4 flex flex-col gap-2">
            <Link href="/competitions" className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md bg-primary text-primary-foreground text-xs font-extrabold uppercase tracking-wider hover:bg-primary/90">
              View live competitions <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link href="/free-entry" className="inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md border border-white/15 bg-white/5 text-white text-xs font-extrabold uppercase tracking-wider hover:bg-white/10">
              Free entry route
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-white/55 space-y-1 px-4">
        <div>© {new Date().getFullYear()} {brand.name}. Promoter details to be confirmed before launch.</div>
        <div>18+ only. UK residents only. Please enter responsibly.</div>
      </div>
    </footer>
  );
}

function ConceptTwo() {
  const stats = [
    { key: "Live prize drops", value: "Updated weekly", Icon: Sparkles },
    { key: "Ticket caps", value: "Shown upfront", Icon: ShieldCheck },
    { key: "Winners", value: "Published per draw", Icon: Users },
    { key: "Free postal entry", value: "Always available", Icon: Mail },
  ];

  return (
    <footer className="relative border-t border-white/10 bg-[hsl(222_50%_3%)] overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />

      <div className="container mx-auto px-4 pt-12 pb-6 relative">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-2 grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
          {stats.map(({ key, value, Icon }) => (
            <div key={key} className="p-4 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-white/55">{key}</div>
                <div className="text-sm font-bold text-white mt-0.5 truncate">{value}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1.9fr]">
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-primary/10 via-white/[0.02] to-transparent p-6">
            <img src="/assets/topdraw-logo.png" alt={`${brand.name} logo`} className="h-9 w-auto mb-4" />
            <p className="text-white text-base font-bold">Premium UK prize competitions.</p>
            <p className="text-white/65 text-sm mt-2 leading-relaxed">
              Built around transparent draws, published winners and a real free postal entry route.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {trustBadges.map((badge) => (
                <span key={badge} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-white/10 bg-white/5 text-[11px] font-extrabold uppercase tracking-wider text-white/75">
                  <Lock className="w-3 h-3 text-primary" /> {badge}
                </span>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <DashPanel title="Play" links={playLinks} />
            <DashPanel title="Support" links={helpLinks} />
            <DashPanel title="Legal" links={legalLinks} />
          </div>
        </div>
      </div>

      <div className="relative border-t border-white/10 mt-4">
        <div className="container mx-auto px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono-num text-white/55">
          <div>© {new Date().getFullYear()} {brand.name} · Promoter details to be confirmed before launch.</div>
          <div className="flex items-center gap-4">
            <Link href="/terms-and-conditions" className="hover:text-white">Terms</Link>
            <Link href="/privacy-policy" className="hover:text-white">Privacy</Link>
            <Link href="/responsible-play" className="hover:text-white">Responsible Play</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

function ConceptThree() {
  const flatLinks = [
    { href: "/competitions", label: "Competitions" },
    { href: "/winners", label: "Winners" },
    { href: "/free-entry", label: "Free Entry" },
    { href: "/faqs", label: "Help Centre" },
    { href: "/contact", label: "Contact" },
    { href: "/terms-and-conditions", label: "Terms" },
  ];

  return (
    <footer className="relative">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <div className="bg-gradient-to-b from-background to-[hsl(222_50%_2%)]">
        <div className="container mx-auto px-4 py-16 text-center">
          <img src="/assets/topdraw-logo.png" alt={`${brand.name} logo`} className="h-10 w-auto mx-auto mb-5" />
          <p className="font-display text-xl md:text-2xl text-white tracking-tight">
            UK prize competitions, drawn fairly.
          </p>

          <nav className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-white/70">
            {flatLinks.map((link, index) => (
              <span key={`${link.href}-${link.label}`} className="inline-flex items-center gap-x-6">
                <Link href={link.href} className="hover:text-white transition-colors">{link.label}</Link>
                {index < flatLinks.length - 1 && (
                  <span aria-hidden className="hidden sm:inline w-px h-3 bg-white/15" />
                )}
              </span>
            ))}
          </nav>

          <div className="mt-10 inline-flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.03] text-[11px] font-extrabold uppercase tracking-wider text-white/70">
            {trustItems.map((trust, index) => (
              <span key={trust} className="inline-flex items-center gap-3">
                {trust}
                {index < trustItems.length - 1 && <span aria-hidden className="w-1 h-1 rounded-full bg-primary/70" />}
              </span>
            ))}
          </div>

          <p className="text-xs text-white/45 mt-10">
            © {new Date().getFullYear()} {brand.name}. Promoter details to be confirmed before launch.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function FootersPreviewPage() {
  const concepts = [
    { id: 1, name: "Premium Trust Footer", desc: "Trust strip + four-column grid + before-you-enter CTA panel.", node: <ConceptOne /> },
    { id: 2, name: "Futuristic Dashboard Footer", desc: "Stat tiles, bordered link panels and a thin technical bottom bar.", node: <ConceptTwo /> },
    { id: 3, name: "Minimal Luxury Footer", desc: "Centred logo, single line, horizontal nav and compact trust pill.", node: <ConceptThree /> },
  ];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-10">
        <div className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary">Internal preview</div>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-white tracking-tight mt-2">Footer concepts</h1>
        <p className="text-white/85 text-sm leading-relaxed mt-3 max-w-2xl">
          Three footer directions for review. Pick one and wire it into the live footer.
        </p>
      </div>

      <div className="space-y-16 pb-20">
        {concepts.map((concept) => (
          <section key={concept.id}>
            <div className="container mx-auto px-4 mb-4">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-primary/15 border border-primary/40 text-primary text-xs font-extrabold">
                  {concept.id}
                </span>
                <h2 className="font-display text-xl md:text-2xl font-bold text-white tracking-tight">
                  Concept {concept.id}: {concept.name}
                </h2>
              </div>
              <p className="text-white/65 text-sm mt-1.5">{concept.desc}</p>
            </div>
            <div className="rounded-2xl border border-white/10 mx-4 overflow-hidden">{concept.node}</div>
          </section>
        ))}
      </div>
    </div>
  );
}
