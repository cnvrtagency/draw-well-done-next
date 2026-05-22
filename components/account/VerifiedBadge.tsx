import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function VerifiedBadge({ size = "md", className, label = "Verified" }: { size?: "sm" | "md"; className?: string; label?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border border-info/40 bg-info/15 font-bold uppercase tracking-wider text-info", size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs", className)}>
      <BadgeCheck className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {label}
    </span>
  );
}
