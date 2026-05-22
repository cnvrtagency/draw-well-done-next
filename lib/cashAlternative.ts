import { formatMoney } from "@/lib/format";

export function formatCashAlternative(value: number | null | undefined): string | null {
  if (value == null || Number(value) <= 0) return null;
  return formatMoney(Number(value));
}
