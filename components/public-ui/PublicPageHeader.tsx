import type { ReactNode } from "react";

export function PublicPageHeader({ eyebrow, title, description, children, align = "left" }: { eyebrow: string; title: string; description?: string; children?: ReactNode; align?: "left" | "center" }) {
  const isCenter = align === "center";
  return (
    <header className={`mb-6 md:mb-8 ${isCenter ? "text-center" : ""}`}>
      <div className={`flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-primary ${isCenter ? "justify-center" : ""}`}>
        <span>{eyebrow}</span>
        <span aria-hidden className="h-px flex-1 max-w-[80px] bg-gradient-to-r from-primary/60 to-transparent" />
      </div>
      <h1 className="font-display text-3xl md:text-4xl font-bold td-text tracking-tight mt-3 uppercase">{title}</h1>
      {description ? <p className={`td-muted text-sm md:text-base leading-relaxed mt-3 max-w-2xl ${isCenter ? "mx-auto" : ""}`}>{description}</p> : null}
      {children ? <div className="mt-5 md:mt-6">{children}</div> : null}
    </header>
  );
}
