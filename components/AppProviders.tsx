"use client";

import { AuthProvider } from "@/hooks/useAuth";
import { BasketProvider } from "@/hooks/useBasket";
import { MiniCart } from "@/components/MiniCart";
import { ThemeProvider } from "@/hooks/useTheme";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BasketProvider>
          {children}
          <MiniCart />
        </BasketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
