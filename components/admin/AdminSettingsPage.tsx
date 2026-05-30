import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminPageHeader, AdminPanel } from "@/components/admin/AdminKit";

export function AdminSettingsPage() {
  return (
    <div>
      <AdminPageHeader
        eyebrow="Configuration"
        title="Settings"
        subtitle="This area is not fully implemented in Vite and therefore remains a safe parity placeholder in Next."
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge className="border border-info/40 bg-info/10 text-info">Coming soon</Badge>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/wallet-settings">Wallet settings</Link>
            </Button>
          </div>
        }
      />

      <AdminPanel title="Settings parity" description="Wallet settings remain available under /admin/wallet-settings.">
        <p className="text-sm text-white/75">
          Vite documents this route as a placeholder/stub area. Keep this as a visible route for parity review, while avoiding fake state or schema changes until the source implementation lands.
        </p>
      </AdminPanel>
    </div>
  );
}
