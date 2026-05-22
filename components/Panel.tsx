import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "glass" | "surface" | "raised" | "outline";
type Tone = "default" | "primary" | "info" | "success" | "warning" | "gold";

const variantCls: Record<Variant, string> = {
  glass: "glass-panel",
  surface: "surface-card",
  raised: "glass-panel-strong",
  outline: "rounded-xl border border-white/10 bg-transparent",
};

const toneCls: Record<Tone, string> = {
  default: "",
  primary: "border-primary/30",
  info: "border-info/30 bg-info/5",
  success: "border-success/30 bg-success/5",
  warning: "border-warning/40 bg-warning/10",
  gold: "border-gold/30 bg-gold/5",
};

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  tone?: Tone;
  as?: React.ElementType;
}

export const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  ({ className, variant = "surface", tone = "default", as: Tag = "div", ...rest }, ref) => (
    <Tag ref={ref} className={cn(variantCls[variant], toneCls[tone], className)} {...rest} />
  ),
);
Panel.displayName = "Panel";
