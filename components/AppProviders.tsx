"use client";

import { AuthProvider } from "@/hooks/useAuth";
import { BasketProvider } from "@/hooks/useBasket";
import { MiniCart } from "@/components/MiniCart";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <BasketProvider>
        {children}
        <MiniCart />
      </BasketProvider>
    </AuthProvider>
  );
}
