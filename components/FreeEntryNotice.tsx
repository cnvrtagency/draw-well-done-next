import Link from "next/link";

export function FreeEntryNotice({ compact }: { compact?: boolean }) {
  if (compact) {
    return (
      <p className="text-xs text-white/60">
        A free postal entry route is available, postal entries join the same draw pool.{" "}
        <Link href="/free-entry" className="underline text-white">Learn more</Link>.
      </p>
    );
  }
  return (
    <div className="rounded-xl border border-info/30 bg-info/10 p-5 text-white">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs font-bold uppercase tracking-wider bg-info text-info-foreground px-2 py-0.5 rounded">Free entry</span>
        <h3 className="font-bold">Free postal entry route</h3>
      </div>
      <p className="text-sm text-white/75 mt-2">
        Every competition includes a free postal entry route. Postal entries are processed into the
        same draw pool as paid online entries and have the same chance of winning.
      </p>
      <Link href="/free-entry" className="text-sm font-semibold text-white mt-3 inline-block underline">
        View free entry instructions →
      </Link>
    </div>
  );
}
