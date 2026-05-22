"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient, SITE_URL } from "@/lib/supabase";
import { AuthField, authInputClass } from "@/app/login/LoginClient";

export function ForgotPasswordClient() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${SITE_URL}/reset-password` });
    setBusy(false);
    setMessage(error ? error.message : "If that email exists, a reset link has been sent.");
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-12">
      <h1 className="font-display text-2xl font-semibold text-white">Reset your password</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <AuthField label="Email"><Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={authInputClass} /></AuthField>
        {message ? <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white/80">{message}</div> : null}
        <Button disabled={busy} className="btn-primary-glow w-full font-bold uppercase tracking-wider">{busy ? "Sending..." : "Send reset link"}</Button>
      </form>
    </div>
  );
}
