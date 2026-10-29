/**
 * Textos da designação de gestor e fiscais (tela e ficha em PDF): a portaria do SEI e o período.
 */

import { formatDateBR } from "@/lib/formatters";
import { PAPEIS_RESPONSAVEL, type ContratoResponsavel } from "@/types/contratos";

/** "Portaria 10/2026, de 05/01/2026 (SEI 12345678)" ou só o que houver; nulo sem portaria. */
export function descricaoPortaria(r: Pick<ContratoResponsavel, "portaria_numero" | "portaria_data" | "portaria_documento_sei">): string | null {
  const ato = r.portaria_numero ? `${r.portaria_numero}${r.portaria_data ? `, de ${formatDateBR(r.portaria_data)}` : ""}` : null;
  const sei = r.portaria_documento_sei ? `SEI ${r.portaria_documento_sei}` : null;
  if (ato && sei) return `${ato} (${sei})`;
  return ato ?? sei;
}

/** "desde 05/01/2026" ou "05/01/2026 a 30/06/2026 · motivo". */
export function periodoDesignacao(r: Pick<ContratoResponsavel, "data_inicio" | "data_fim" | "motivo_saida">): string {
  if (!r.data_fim) return `desde ${formatDateBR(r.data_inicio)}`;
  return `${formatDateBR(r.data_inicio)} a ${formatDateBR(r.data_fim)}${r.motivo_saida ? ` · ${r.motivo_saida}` : ""}`;
}

const ORDEM_PAPEL = PAPEIS_RESPONSAVEL.map((p) => p.value as string);

/** Gestor primeiro, depois substituto e fiscais (ordem de PAPEIS_RESPONSAVEL); no mesmo papel, o mais recente antes. */
export function ordenarPorPapel<T extends Pick<ContratoResponsavel, "papel" | "data_inicio">>(lista: T[]): T[] {
  const pos = (p: string) => {
    const i = ORDEM_PAPEL.indexOf(p);
    return i < 0 ? ORDEM_PAPEL.length : i;
  };
  return [...lista].sort((a, b) => pos(a.papel) - pos(b.papel) || b.data_inicio.localeCompare(a.data_inicio));
}
