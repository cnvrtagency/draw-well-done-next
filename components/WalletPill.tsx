"use client";

import Link from "next/link";
import { Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { formatMoney } from "@/lib/format";

export function WalletPill() {
  const { user } = useAuth();
  const supabase = createSupabaseBrowserClient();
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!supabase || !user) {
      setBalance(null);
      return;
    }
    let cancelled = false;
    supabase
      .from("wallets")
      .select("balance")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: { data: { balance: number | string | null } | null }) => {
        if (!cancelled) setBalance(data ? Number(data.balance) : 0);
      });
    return () => { cancelled = true; };
  }, [supabase, user]);

  if (!user) return null;

  return (
    <Link
      href="/account/wallet"
      aria-label={`Wallet balance ${balance != null ? formatMoney(balance) : ""}`}
      className="td-wallet-pill td-header-control hidden h-10 items-center gap-1.5 rounded-xl px-3 sm:inline-flex"
    >
      <Wallet className="h-4 w-4 text-primary" />
      <span className="font-mono-num text-xs font-bold tracking-tight">
        {balance != null ? formatMoney(balance) : "-"}
      </span>
    </Link>
  );
}
