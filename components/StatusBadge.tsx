import { cn } from "@/lib/utils";

const map: Record<string, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "td-badge-muted" },
  scheduled: { label: "Scheduled", cls: "bg-info/20 text-info border border-info/40" },
  live: { label: "Live", cls: "bg-success text-success-foreground" },
  sold_out: { label: "Sold out", cls: "bg-warning text-warning-foreground" },
  closed: { label: "Closed", cls: "td-badge-neutral" },
  drawn: { label: "Drawn", cls: "bg-primary text-primary-foreground" },
  archived: { label: "Archived", cls: "td-badge-muted" },
  pending: { label: "Pending", cls: "td-badge-muted" },
  published: { label: "Published", cls: "bg-success text-success-foreground" },
  under_review: { label: "Under review", cls: "bg-warning text-warning-foreground" },
  succeeded: { label: "Succeeded", cls: "bg-success text-success-foreground" },
  failed: { label: "Failed", cls: "bg-destructive text-destructive-foreground" },
  refunded: { label: "Refunded", cls: "bg-secondary text-secondary-foreground" },
  cancelled: { label: "Cancelled", cls: "bg-destructive/15 text-destructive border border-destructive/40" },
  allocation_failed: { label: "Allocation failed", cls: "bg-warning text-warning-foreground" },
  paid: { label: "Paid", cls: "bg-primary text-primary-foreground" },
  postal: { label: "Postal", cls: "bg-accent text-accent-foreground" },
  free: { label: "Free", cls: "bg-info/20 text-info border border-info/40" },
  unclaimed: { label: "Awaiting claim", cls: "bg-warning text-warning-foreground" },
  claim_started: { label: "Claim started", cls: "bg-warning text-warning-foreground" },
  claim_submitted: { label: "Claim submitted", cls: "bg-info text-info-foreground" },
  claim_verified: { label: "Claim verified", cls: "bg-info text-info-foreground" },
  verified: { label: "Verified", cls: "bg-info/20 text-info border border-info/40" },
  dispatched: { label: "Prize dispatched", cls: "bg-primary text-primary-foreground" },
  delivered: { label: "Delivered", cls: "bg-success text-success-foreground" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const meta = map[status] ?? { label: status, cls: "bg-secondary text-secondary-foreground" };
  return <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", meta.cls, className)}>{meta.label}</span>;
}
