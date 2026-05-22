import { brand } from "@/config/brand";

export function formatMoney(n: number | null | undefined): string {
  if (n == null || Number.isNaN(Number(n))) return `${brand.currencySymbol}0.00`;
  return `${brand.currencySymbol}${Number(n).toFixed(2)}`;
}

export function publicEntryPercent(current: number | null | undefined, max: number | null | undefined): number {
  const c = Number(current) || 0;
  const m = Number(max) || 0;
  if (m <= 0 || c <= 0) return 0;
  const real = (c / m) * 100;
  if (real < 1) return 1;
  return Math.min(100, Math.floor(real));
}

export function effectiveSoldCount(
  current: number | null | undefined,
  reserved: number | null | undefined,
  max: number | null | undefined,
): number {
  const cur = Math.max(0, Number(current) || 0);
  const res = Math.max(0, Number(reserved) || 0);
  const m = Math.max(0, Number(max) || 0);
  const sum = cur + res;
  return m > 0 ? Math.min(m, sum) : sum;
}

export function effectiveRemaining(
  current: number | null | undefined,
  reserved: number | null | undefined,
  max: number | null | undefined,
): number {
  const m = Math.max(0, Number(max) || 0);
  return Math.max(0, m - effectiveSoldCount(current, reserved, m));
}
