import type { Metadata } from "next";
import { AdminRoute } from "./AdminPages";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminRoute />;
}
