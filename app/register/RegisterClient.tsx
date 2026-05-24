"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, Lock, ShieldCheck, Trophy } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient, SITE_URL } from "@/lib/supabase";
import { submitKlaviyoSubscribe } from "@/lib/klaviyoSubscribe";
import { AuthField, authInputClass } from "@/app/login/LoginClient";

function normaliseUkMobile(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  const local = digits.startsWith("44") ? digits.slice(2) : digits.startsWith("0") ? digits.slice(1) : digits;
  if (!/^7\d{9}$/.test(local)) return null;
  return `+44${local}`;
}

function isAdult(date: string) {
  const dob = new Date(date);
  if (Number.isNaN(dob.getTime())) return false;
  const now = new Date();
  const eighteen = new Date(dob.getFullYear() + 18, dob.getMonth(), dob.getDate());
  return eighteen <= now;
}

export function RegisterClient() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    date_of_birth: "",
    phone: "",
    marketing_consent: false,
    terms: false,
    age_confirmed: false,
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    const email = form.email.trim().toLowerCase();
    const phone = normaliseUkMobile(form.phone);
    if (!email || !email.includes("@")) return setMessage("Enter a valid email address");
    if (form.password.length < 8) return setMessage("Password must be at least 8 characters");
    if (!form.full_name.trim()) return setMessage("Enter your full name");
    if (!isAdult(form.date_of_birth)) return setMessage("You must be 18 or older to register");
    if (!phone) return setMessage("Enter a valid UK mobile number");
    if (!form.terms) return setMessage("You must accept the terms");
    if (!form.age_confirmed) return setMessage("You must confirm you are 18 or older");
    setBusy(true);
    setMessage(null);
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: form.password,
      options: {
        emailRedirectTo: SITE_URL,
        data: {
          full_name: form.full_name.trim(),
          phone,
          date_of_birth: form.date_of_birth,
          marketing_consent: form.marketing_consent,
          terms_accepted_at: nowIso,
          age_confirmed_at: nowIso,
        },
      },
    });
    if (error) {
      setBusy(false);
      setMessage(error.message);
      return;
    }
    if (form.marketing_consent) {
      submitKlaviyoSubscribe({
        email,
        source: "register",
        consent_source: "register_checkbox",
        consent_status: "granted",
        consent_type: "opt_in",
        user_id: data.user?.id ?? null,
        properties: { full_name: form.full_name.trim() || undefined, phone, topdraw_customer: false },
      }).catch(() => {});
    }
    if (data.session && data.user?.id) {
      await (supabase as any).from("profiles").update({
        email,
        full_name: form.full_name.trim(),
        phone,
        date_of_birth: form.date_of_birth,
        marketing_consent: form.marketing_consent,
        terms_accepted_at: nowIso,
        age_confirmed_at: nowIso,
      }).eq("id", data.user.id);
      setBusy(false);
      router.push("/account");
      return;
    }
    setBusy(false);
    router.push("/login");
  }

  return (
    <div className="relative overflow-hidden px-4 py-9 sm:py-14">
      <div className="td-auth-page-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] opacity-85" />
      <div className="mx-auto max-w-[580px]">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.2em] text-primary">TopDraw account</div>
          <h1 className="font-display text-3xl font-black uppercase leading-tight tracking-[0.055em] td-text sm:text-4xl">Create your account</h1>
          <p className="mx-auto mt-3 max-w-[46ch] text-[15px] font-medium leading-relaxed td-muted">Join TopDraw to enter competitions, track your tickets, view your results and claim your prizes.</p>
        </div>
        <form onSubmit={submit} noValidate className="td-auth-card relative overflow-hidden rounded-2xl p-5 backdrop-blur-xl sm:p-6">
          <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/80 to-transparent" />
          <div className="relative space-y-4">
            <AuthField label="Full name"><Input required autoComplete="name" value={form.full_name} onChange={(e) => set("full_name", e.target.value)} className={authInputClass} /></AuthField>
            <AuthField label="Date of birth" hint="You must be 18 or over to enter TopDraw competitions."><Input type="date" required value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} className={authInputClass} /></AuthField>
            <AuthField label="Email"><Input type="email" required autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} className={authInputClass} /></AuthField>
            <AuthField label="Password" hint="Use at least 8 characters."><Input type="password" required autoComplete="new-password" value={form.password} onChange={(e) => set("password", e.target.value)} className={authInputClass} /></AuthField>
            <AuthField label="Mobile number" hint="Used for account contact and winner verification. Not SMS marketing consent.">
              <div className="flex h-12 overflow-hidden rounded-xl border td-border bg-[color:var(--td-surface-soft)] focus-within:border-primary/80 focus-within:ring-2 focus-within:ring-primary/60">
                <div className="td-phone-prefix font-mono-num grid min-w-[68px] place-items-center px-3 text-sm font-bold">+44</div>
                <Input type="tel" required inputMode="tel" autoComplete="tel" placeholder="Mobile number" value={form.phone} onChange={(e) => set("phone", e.target.value)} className="h-full rounded-none border-0 bg-transparent px-4 td-text shadow-none placeholder:text-[color:var(--td-text-faint)] focus-visible:ring-0 focus-visible:ring-offset-0" />
              </div>
            </AuthField>
            <div className="space-y-2.5 pt-1">
              <CheckRow checked={form.terms} onChange={(v) => set("terms", v)}>I have read and accept the <Link href="/terms" className="font-semibold td-text underline decoration-primary/70 underline-offset-4">Terms</Link> and <Link href="/privacy-policy" className="font-semibold td-text underline decoration-primary/70 underline-offset-4">Privacy Policy</Link>.</CheckRow>
              <CheckRow checked={form.age_confirmed} onChange={(v) => set("age_confirmed", v)}>I confirm I am 18 or older.</CheckRow>
              <CheckRow checked={form.marketing_consent} onChange={(v) => set("marketing_consent", v)}>Email and text me TopDraw offers, new competitions and winner updates. I can unsubscribe at any time.</CheckRow>
            </div>
            {message ? <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">{message}</div> : null}
            <Button disabled={busy} className="h-12 w-full rounded-xl border border-primary/50 bg-[linear-gradient(135deg,hsl(199_100%_53%)_0%,hsl(213_100%_50%)_55%,hsl(230_90%_62%)_100%)] font-bold uppercase tracking-[0.12em] text-white shadow-[0_18px_44px_-16px_hsl(var(--primary)/0.95)] hover:brightness-110">{busy ? "Creating..." : "Create account"}</Button>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] font-bold uppercase tracking-wider td-muted">
              <span className="inline-flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5 text-primary" />18+ UK only</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-primary" />Ticket caps shown upfront</span>
              <span className="inline-flex items-center gap-1.5"><Trophy className="h-3.5 w-3.5 text-primary" />Winners published</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-xs td-soft"><Lock className="h-3.5 w-3.5 text-primary" />Already have an account? <Link href="/login" className="font-semibold td-text underline decoration-primary/70 underline-offset-4">Log in</Link></div>
          </div>
        </form>
      </div>
    </div>
  );
}

function CheckRow({ checked, onChange, children }: { checked: boolean; onChange: (checked: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="td-auth-check-row group flex cursor-pointer items-start gap-3 rounded-xl p-3 text-sm leading-relaxed transition sm:p-3.5">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-[18px] w-[18px] rounded-md accent-primary" />
      <span className="min-w-0">{children}</span>
    </label>
  );
}
