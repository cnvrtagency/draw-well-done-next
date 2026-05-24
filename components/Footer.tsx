import Link from "next/link";
import { Mail } from "lucide-react";
import { brand } from "@/config/brand";

const trustItems = ["18+ UK only", "Free postal entry route", "Winners published", "Secure checkout", "Entry caps shown upfront"];
const playLinks = [
  { to: "/competitions", label: "Live competitions" },
  { to: "/winners", label: "Winners" },
  { to: "/past-competitions", label: "Past competitions" },
  { to: "/free-entry", label: "Free postal entry route" },
];
const helpLinks = [
  { to: "/faqs", label: "Help Centre" },
  { to: "/guides", label: "Guides" },
  { to: "/contact", label: "Contact" },
  { to: "/responsible-play", label: "Responsible play" },
];
const legalLinks = [
  { to: "/terms-and-conditions", label: "Terms and Conditions" },
  { to: "/privacy-policy", label: "Privacy Policy" },
  { to: "/cookie-policy", label: "Cookie Policy" },
  { to: "/free-entry", label: "Free Entry Method" },
];

function LinkColumn({ title, links }: { title: string; links: { to: string; label: string }[] }) {
  return (
    <div>
      <div className="font-extrabold mb-3 text-[color:var(--td-text)] uppercase text-[11px] tracking-wider">{title}</div>
      <ul className="space-y-2">
        {links.map((l) => (
          <li key={l.to + l.label}>
            <Link href={l.to} className="font-extrabold uppercase text-[11px] tracking-wider td-soft hover:text-[color:var(--td-text)] transition-colors">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="td-footer relative mt-20 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
      <div className="absolute inset-x-0 -top-24 h-24 bg-gradient-to-b from-transparent to-background pointer-events-none" />
      <div className="border-b td-border bg-[color:var(--td-surface-soft)] relative">
        <div className="container mx-auto px-4 py-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] font-extrabold uppercase tracking-wider td-muted">
          {trustItems.map((t) => <span key={t} className="inline-flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]" />{t}</span>)}
        </div>
      </div>
      <div className="container mx-auto px-4 py-12 grid gap-10 md:grid-cols-[1fr_2fr] text-sm relative">
        <div>
          <img src="/assets/topdraw-logo.png" alt={`${brand.name} logo`} width={470} height={95} className="td-logo-dark h-9 w-auto mb-3" />
          <img src="/assets/topdraw-logo-light-mode.png" alt={`${brand.name} logo`} width={470} height={95} className="td-logo-light h-9 w-auto mb-3" />
          <p className="td-muted text-sm leading-relaxed">UK prize competitions, drawn fairly.</p>
          <p className="td-soft text-xs leading-relaxed mt-3">Independent UK prize competitions with published winners, transparent entry caps and a genuine free postal entry route.</p>
          <a href={`mailto:${brand.supportEmail}`} className="inline-flex items-center gap-2 td-muted hover:text-[color:var(--td-text)] text-xs mt-4"><Mail className="w-3.5 h-3.5" /> {brand.supportEmail}</a>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
          <LinkColumn title="Play" links={playLinks} />
          <LinkColumn title="Help" links={helpLinks} />
          <LinkColumn title="Legal" links={legalLinks} />
        </div>
      </div>
      <div className="border-t td-border py-4 text-center text-xs td-soft space-y-1 px-4">
        <div>© {new Date().getFullYear()} {brand.name}. Promoter details to be confirmed before launch.</div>
        <div>18+ only. UK residents only. Please enter responsibly.</div>
      </div>
    </footer>
  );
}
