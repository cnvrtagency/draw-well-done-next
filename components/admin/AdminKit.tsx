import { cn } from "@/lib/utils";
import { Panel, type PanelProps } from "@/components/Panel";

export function AdminPageHeader({ eyebrow, title, subtitle, actions, icon, className }: { eyebrow?: string; title: string; subtitle?: string; actions?: React.ReactNode; icon?: React.ReactNode; className?: string }) {
  return (
    <header className={cn("mb-5 flex flex-col gap-3 md:mb-6 md:flex-row md:items-end md:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow ? <div className="eyebrow mb-1">{eyebrow}</div> : null}
        <h1 className="font-display flex items-center gap-2 text-2xl font-bold tracking-tight admin-value md:text-3xl">
          {icon ? <span className="inline-flex text-primary">{icon}</span> : null}
          <span className="truncate">{title}</span>
        </h1>
        {subtitle ? <p className="mt-1.5 max-w-3xl text-sm admin-muted">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function AdminPanel({
  title,
  description,
  actions,
  children,
  className,
  bodyClassName,
  flush,
  variant = "glass",
  ...rest
}: Omit<PanelProps, "title"> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  bodyClassName?: string;
  flush?: boolean;
}) {
  const hasHeader = Boolean(title || description || actions);
  return (
    <Panel variant={variant} className={cn("overflow-hidden", className)} {...rest}>
      {hasHeader ? (
        <div className="flex flex-col gap-2 px-5 pt-5 sm:flex-row sm:items-start sm:justify-between md:px-6 md:pt-6">
          <div className="min-w-0">
            {title ? <h2 className="font-display text-base font-bold tracking-tight admin-section-title md:text-lg">{title}</h2> : null}
            {description ? <p className="admin-helper-text mt-1 text-xs md:text-sm">{description}</p> : null}
          </div>
          {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
        </div>
      ) : null}
      <div className={cn(flush ? "" : "p-5 md:p-6", hasHeader && !flush && "pt-4 md:pt-5", bodyClassName)}>{children}</div>
    </Panel>
  );
}

export function AdminTable({ children, minWidth = 920 }: { children: React.ReactNode; minWidth?: number }) {
  return (
    <Panel variant="glass" className="overflow-hidden p-0">
      <div className="w-full overflow-x-auto">
        <table className="admin-table" style={{ minWidth }}>{children}</table>
      </div>
    </Panel>
  );
}

export function AdminTH({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" | "center" }) {
  return <th className={cn("admin-table-head p-3 font-semibold", align === "right" && "text-right", align === "center" && "text-center", align === "left" && "text-left")}>{children}</th>;
}

export function AdminTD({ children, align = "left", className }: { children: React.ReactNode; align?: "left" | "right" | "center"; className?: string }) {
  return <td className={cn("admin-table-cell p-3 align-top", align === "right" && "text-right", align === "center" && "text-center", className)}>{children}</td>;
}

export function AdminTR({ children }: { children: React.ReactNode }) {
  return <tr className="admin-table-row">{children}</tr>;
}
