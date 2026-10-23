/** Número digitado no formulário: "1.234,56" ou "1234.56" → 1234.56; vazio ou texto → NaN. */
export function lerNumeroBr(v: string): number {
  const t = v.trim();
  if (!t) return Number.NaN;
  return Number(t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t);
}
