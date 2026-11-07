/**
 * "HOJE" NO FUSO DA SEDE
 *
 * Contagem de prazo ("vence em N dias") é por data de calendário, no fuso da instituição. Usar o relógio do
 * navegador quebra quando ele está em outro fuso: às 21h de Boa Vista já é o dia seguinte em UTC, e o prazo
 * aparece com um dia a menos. O fuso vem do perfil do tenant (`fusoHorario`); sem ele, vale o do navegador.
 */

import { getTenantSnapshotOuNulo } from "@/core/tenant/snapshot";

/** Fuso da sede (IANA) ou `undefined` (fuso do navegador). */
export function fusoDaSede(): string | undefined {
  return getTenantSnapshotOuNulo()?.fusoHorario || undefined;
}

/** Data (AAAA-MM-DD) de `agora` no fuso informado; padrão: o fuso da sede. */
export function hojeISO(agora: Date = new Date(), fuso: string | undefined = fusoDaSede()): string {
  // en-CA formata como AAAA-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: fuso, year: "numeric", month: "2-digit", day: "2-digit" }).format(agora);
}

/** Dias corridos de `de` até `ate` (AAAA-MM-DD); negativo quando `ate` já passou. `null` se alguma data for inválida. */
export function diasEntreDatas(de: string, ate: string): number | null {
  const paraUtc = (s: string) => {
    const [a, m, d] = s.slice(0, 10).split("-").map(Number);
    return a && m && d ? Date.UTC(a, m - 1, d) : null;
  };
  const x = paraUtc(de);
  const y = paraUtc(ate);
  if (x === null || y === null) return null;
  return Math.round((y - x) / 86_400_000);
}
