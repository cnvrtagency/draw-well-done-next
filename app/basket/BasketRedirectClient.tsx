"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBasket } from "@/hooks/useBasket";

export function BasketRedirectClient() {
  const { items, setDrawerOpen } = useBasket();
  const router = useRouter();
  const hasItems = items.length > 0;

  useEffect(() => {
    if (hasItems) setDrawerOpen(true);
    router.replace(hasItems ? "/checkout" : "/competitions");
  }, [hasItems, router, setDrawerOpen]);

  return null;
}
