/** Parses "18.500.000" / "18500000,5" into a number; empty → null; invalid → NaN. */
export function parseMoneyInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return Number(trimmed.replace(/\./g, "").replace(",", "."));
}
