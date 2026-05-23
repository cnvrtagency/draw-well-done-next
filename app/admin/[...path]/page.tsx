import type { Metadata } from "next";
import { AdminRoute } from "../AdminPages";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminSubroutePage({ params }: { params: { path?: string[] } }) {
  return <AdminRoute path={params.path} />;
}
