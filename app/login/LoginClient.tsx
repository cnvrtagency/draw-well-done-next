"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase";

export const authInputClass = "h-12 rounded-xl border-white/12 bg-white/[0.075] px-4 text-white placeholder:text-white/40 focus-visible:border-primary/80 focus-visible:bg-white/[0.09] focus-visible:ring-primary/60 focus-visible:ring-offset-0";

export function AuthField({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-white/78">{label}</label>
      {children}
      {hint ? <p className="text-[11px] leading-relaxed text-white/56">{hint}</p> : null}
    </div>
  );
}

export function LoginClient() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) setMessage(error.message);
    else router.push("/account");
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-12">
      <h1 className="font-display text-2xl font-semibold text-white">Log in</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <AuthField label="Email"><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={authInputClass} /></AuthField>
        <AuthField label="Password"><Input id="pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={authInputClass} /></AuthField>
        {message ? <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">{message}</div> : null}
        <Button disabled={busy} className="btn-primary-glow w-full font-bold uppercase tracking-wider">{busy ? "Logging in..." : "Log in"}</Button>
      </form>
      <div className="mt-4 flex justify-between text-sm text-white/65">
        <Link href="/forgot-password" className="underline">Forgot password?</Link>
        <Link href="/register" className="underline">Create account</Link>
      </div>
    </div>
  );
}
