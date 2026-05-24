import type { ReactNode } from "react";

export function EmptyState({ title, body, action, icon }: { title: string; body?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="td-empty-state p-8 text-center md:p-10">
      <div className="td-empty-state-glow pointer-events-none absolute inset-x-0 -top-24 h-48" />
      <div className="relative">
        <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/35 bg-primary/15 text-primary shadow-[0_18px_38px_-20px_hsl(var(--primary)/0.9),inset_0_1px_0_hsl(0_0%_100%/0.08)]">
          {icon ?? <span className="text-xl font-bold">!</span>}
        </div>
        <h3 className="font-display text-xl font-bold tracking-tight text-[color:var(--td-text)]">{title}</h3>
        {body ? <p className="td-muted mx-auto mt-2 max-w-md text-sm leading-relaxed">{body}</p> : null}
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    </div>
  );
}
