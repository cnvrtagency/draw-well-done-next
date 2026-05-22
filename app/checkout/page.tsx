import type { Metadata } from "next";
import { CheckoutClient } from "./CheckoutClient";

export const metadata: Metadata = {
  title: "Secure Checkout",
  description: "Review your TopDraw order and complete your secure checkout.",
  robots: { index: false, follow: false },
};

export default function Checkout() {
  return <CheckoutClient />;
}
