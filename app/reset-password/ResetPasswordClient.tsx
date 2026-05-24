"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { AuthField, authInputClass } from "@/app/login/LoginClient";

export function ResetPasswordClient() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) setMessage(error.message);
    else router.push("/account");
  }

  return (
    <div className="container mx-auto max-w-md px-4 py-12">
      <h1 className="font-display text-2xl font-semibold td-text">Set a new password</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <AuthField label="New password"><Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={authInputClass} /></AuthField>
        {message ? <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">{message}</div> : null}
        <Button disabled={busy} className="btn-primary-glow w-full font-bold uppercase tracking-wider">{busy ? "Updating..." : "Update password"}</Button>
      </form>
    </div>
  );
}
