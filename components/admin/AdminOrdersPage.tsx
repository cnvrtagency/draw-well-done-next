import Link from "next/link";
import { AdminPageHeader, AdminPanel } from "@/components/admin/AdminKit";

export function AdminOrdersPage() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Finance"
        title="Orders"
        subtitle="Vite does not expose a dedicated /admin/orders route. This route is intentionally kept as a clarified compatibility alias."
      />

      <AdminPanel title="Orders route parity" description="Use /admin/payments for active transaction actions, refunds, and status operations.">
        <p className="text-sm text-white/75">
          This route exists in Next for operational compatibility and historical bookmarks. In Vite, orders and payments are not separate admin workflows.
        </p>
        <Link href="/admin/payments" className="inline-flex mt-4 rounded-md border border-white/10 px-3 py-2 text-sm font-medium text-primary hover:bg-white/5">
          Open /admin/payments
        </Link>
      </AdminPanel>
    </div>
  );
}
