/**
 * Número digitado no formulário: "1.234,56" ou "1234.56" → 1234.56; "120.000" (só ponto de milhar, como se escreve
 * no Brasil) → 120000; vazio ou texto → NaN.
 */
export function lerNumeroBr(v: string): number {
  const t = v.trim();
  if (!t) return Number.NaN;
  if (t.includes(',')) return Number(t.replace(/\./g, '').replace(',', '.'));
  if (/^[1-9]\d{0,2}(\.\d{3})+$/.test(t)) return Number(t.replace(/\./g, ''));
  return Number(t);
}
