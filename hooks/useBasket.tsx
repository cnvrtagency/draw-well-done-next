"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export type BasketItem = {
  competition_id: string;
  quantity: number;
  added_at: string;
};

type BasketContextValue = {
  items: BasketItem[];
  count: number;
  add: (competitionId: string, quantity?: number) => void;
  update: (competitionId: string, quantity: number) => void;
  remove: (competitionId: string) => void;
  clear: () => void;
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  setDrawerOpen: (open: boolean) => void;
};

export const BASKET_KEY = "topdraw_basket_v1";
const BasketContext = createContext<BasketContextValue | null>(null);

function readLocal(): BasketItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(BASKET_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((i) => i && typeof i.competition_id === "string" && Number(i.quantity) > 0);
  } catch {
    return [];
  }
}

function writeLocal(items: BasketItem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BASKET_KEY, JSON.stringify(items));
  } catch {}
}

function sameBasketItems(a: BasketItem[], b: BasketItem[]) {
  if (a.length !== b.length) return false;
  return a.every((item, index) => {
    const other = b[index];
    return other && item.competition_id === other.competition_id && item.quantity === other.quantity && item.added_at === other.added_at;
  });
}

export function BasketProvider({ children }: { children: React.ReactNode }) {
  const supabase = createSupabaseBrowserClient();
  const { user } = useAuth();
  const [items, setItems] = useState<BasketItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const syncedUserId = useRef<string | null>(null);

  useEffect(() => {
    setItems((current) => {
      const next = readLocal();
      return sameBasketItems(current, next) ? current : next;
    });
    const sync = () => {
      setItems((current) => {
        const next = readLocal();
        return sameBasketItems(current, next) ? current : next;
      });
    };
    window.addEventListener("storage", sync);
    window.addEventListener("topdraw:basket-updated", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("topdraw:basket-updated", sync);
    };
  }, []);

  useEffect(() => {
    writeLocal(items);
  }, [items]);

  useEffect(() => {
    if (!supabase || !user) {
      syncedUserId.current = null;
      return;
    }
    if (syncedUserId.current === user.id) return;
    syncedUserId.current = user.id;
    (async () => {
      try {
        const { data: basket } = await supabase.from("baskets").select("id").eq("user_id", user.id).maybeSingle();
        let basketId = basket?.id as string | undefined;
        if (!basketId) {
          const { data: created } = await supabase.from("baskets").insert({ user_id: user.id }).select("id").single();
          basketId = created?.id;
        }
        if (!basketId) return;
        const { data: rows } = await supabase.from("basket_items").select("competition_id,quantity,added_at").eq("basket_id", basketId);
        const dbItems: BasketItem[] = (rows ?? []).map((r: any) => ({
          competition_id: r.competition_id,
          quantity: Number(r.quantity),
          added_at: r.added_at,
        }));
        setItems((local) => {
          const map = new Map<string, BasketItem>();
          for (const i of dbItems) map.set(i.competition_id, i);
          for (const i of local) {
            const existing = map.get(i.competition_id);
            map.set(i.competition_id, existing ? { ...existing, quantity: Math.max(existing.quantity, i.quantity) } : i);
          }
          return Array.from(map.values());
        });
      } catch (error) {
        console.warn("[basket] sync failed", error);
      }
    })();
  }, [supabase, user]);

  useEffect(() => {
    if (!supabase || !user) return;
    const t = window.setTimeout(async () => {
      try {
        const { data: basket } = await supabase.from("baskets").select("id").eq("user_id", user.id).maybeSingle();
        let basketId = basket?.id as string | undefined;
        if (!basketId) {
          const { data: created } = await supabase.from("baskets").insert({ user_id: user.id }).select("id").single();
          basketId = created?.id;
        }
        if (!basketId) return;
        await supabase.from("basket_items").delete().eq("basket_id", basketId);
        if (items.length) {
          await supabase.from("basket_items").insert(items.map((i) => ({ basket_id: basketId, competition_id: i.competition_id, quantity: i.quantity })));
        }
        await supabase.from("baskets").update({ updated_at: new Date().toISOString() }).eq("id", basketId);
      } catch (error) {
        console.warn("[basket] persist failed", error);
      }
    }, 600);
    return () => window.clearTimeout(t);
  }, [items, supabase, user]);

  const add = useCallback((competitionId: string, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.competition_id === competitionId);
      if (existing) return prev.map((i) => i.competition_id === competitionId ? { ...i, quantity: i.quantity + quantity } : i);
      return [...prev, { competition_id: competitionId, quantity, added_at: new Date().toISOString() }];
    });
  }, []);

  const update = useCallback((competitionId: string, quantity: number) => {
    setItems((prev) => quantity <= 0 ? prev.filter((i) => i.competition_id !== competitionId) : prev.map((i) => i.competition_id === competitionId ? { ...i, quantity } : i));
  }, []);

  const remove = useCallback((competitionId: string) => {
    setItems((prev) => prev.filter((i) => i.competition_id !== competitionId));
  }, []);

  const clear = useCallback(() => setItems([]), []);
  const openDrawer = useCallback(() => setIsOpen(true), []);
  const closeDrawer = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => ({
    items,
    count: items.reduce((n, i) => n + i.quantity, 0),
    add,
    update,
    remove,
    clear,
    isOpen,
    openDrawer,
    closeDrawer,
    setDrawerOpen: setIsOpen,
  }), [add, clear, closeDrawer, isOpen, items, openDrawer, remove, update]);

  return <BasketContext.Provider value={value}>{children}</BasketContext.Provider>;
}

export function useBasket() {
  const ctx = useContext(BasketContext);
  if (!ctx) throw new Error("useBasket must be used within BasketProvider");
  return ctx;
}
