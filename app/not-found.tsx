import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container mx-auto max-w-2xl px-4 py-20 text-center">
      <div className="eyebrow mb-3">Not found</div>
      <h1 className="font-display text-4xl font-bold text-white">Page not found</h1>
      <p className="mt-3 text-white/65">The page may have moved or the route is not part of this Phase 1 rebuild.</p>
      <Link href="/competitions" className="btn-primary-glow mt-6 inline-flex h-11 items-center justify-center rounded-xl px-5 text-xs font-extrabold uppercase tracking-wider">View competitions</Link>
    </div>
  );
}
