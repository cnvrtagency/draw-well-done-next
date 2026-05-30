import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminPageHeader, AdminPanel } from "@/components/admin/AdminKit";

export function AdminUsersPage() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="People"
        title="Users"
        subtitle="Dedicated users workflow is intentionally aligned with the Vite stub implementation while keeping customer tools separate."
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge className="border border-warning/40 bg-warning/10 text-warning">Vite placeholder</Badge>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/customers">Go to customers</Link>
            </Button>
          </div>
        }
      />

      <AdminPanel
        title="User-management parity note"
        description="Vite exposes a users route, but currently presents a placeholder workflow. Next now mirrors that behavior as a dedicated route so it no longer aliases the customer workspace."
      >
        <div className="space-y-2 text-sm text-white/75">
          <p>Use /admin/customers for account wallet and profile search/actions in this release.</p>
          <p>Keep this route for Vite parity visibility and future implementation of a separate role/account admin flow.</p>
        </div>
      </AdminPanel>
    </div>
  );
}
