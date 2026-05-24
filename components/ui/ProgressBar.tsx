import { cn } from "@/lib/utils";

export function ProgressBar({
  value,
  tone = "primary",
  thickness = "md",
  showShimmer,
  className,
}: {
  value: number;
  tone?: "primary" | "warning";
  thickness?: "sm" | "md";
  showShimmer?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("td-progress-track overflow-hidden rounded-full", thickness === "sm" ? "h-1.5" : "h-2", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500",
          tone === "warning" ? "bg-warning shadow-[0_0_10px_hsl(var(--warning)/0.55)]" : "bg-primary shadow-[0_0_10px_hsl(var(--primary)/0.55)]",
          showShimmer && "shimmer",
        )}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
