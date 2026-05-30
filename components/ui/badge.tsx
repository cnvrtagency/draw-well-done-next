import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-secondary/40 bg-secondary/10 text-secondary",
        destructive: "border-destructive/40 bg-destructive/10 text-destructive",
        outline: "border-border text-foreground",
        warning: "border-warning/40 bg-warning/10 text-warning",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant, ...props }, ref) => {
  return <span className={cn(badgeVariants({ variant }), className)} ref={ref} {...props} />;
});
Badge.displayName = "Badge";

export { Badge, badgeVariants };
