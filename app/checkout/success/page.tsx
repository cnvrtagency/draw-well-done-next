import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutSuccessClient } from "./CheckoutSuccessClient";

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Your TopDraw order has been confirmed and your ticket information is available in your account.",
  robots: { index: false, follow: false },
};

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-3xl px-4 py-12 text-center td-muted">Loading order confirmation...</div>}>
      <CheckoutSuccessClient />
    </Suspense>
  );
}
