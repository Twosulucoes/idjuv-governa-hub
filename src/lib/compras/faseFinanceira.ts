/**
 * Fase financeira do processo de contratação a partir dos valores do FIPLAN ligados a ele (PEDs e empenhos) e das
 * reservas do sistema. Calculada, nunca gravada: muda a cada importação do QDD, do FIP 614 e do "Consultar PED".
 * Spec: docs/superpowers/specs/2026-10-23-compras-processos-reserva-natureza-design.md (§10)
 */

import type { TomStatus } from "@/components/design-system";

export interface ValoresFinanceiros {
  reservado: number;
  pendente: number;
  ped_autorizado: number;
  empenhado: number;
  liquidado: number;
  pago: number;
}

export type CodigoFase = "pago" | "pago_parcial" | "liquidado" | "empenhado" | "ped" | "reservado" | "sem_movimento";

export interface FaseFinanceira {
  codigo: CodigoFase;
  rotulo: string;
  tom: TomStatus;
}

export const FASES_FINANCEIRAS: FaseFinanceira[] = [
  { codigo: "pago", rotulo: "Pago", tom: "sucesso" },
  { codigo: "pago_parcial", rotulo: "Pago em parte", tom: "andamento" },
  { codigo: "liquidado", rotulo: "Liquidado", tom: "andamento" },
  { codigo: "empenhado", rotulo: "Empenhado", tom: "andamento" },
  { codigo: "ped", rotulo: "PED autorizado", tom: "pendente" },
  { codigo: "reservado", rotulo: "Reservado", tom: "destaque" },
  { codigo: "sem_movimento", rotulo: "Sem movimento", tom: "neutro" },
];

const fase = (codigo: CodigoFase) => FASES_FINANCEIRAS.find((f) => f.codigo === codigo) as FaseFinanceira;
const n = (v: number | null | undefined) => Number(v ?? 0);
// Centavos: evita "Pago em parte" por arredondamento
const maiorOuIgual = (a: number, b: number) => Math.round(a * 100) >= Math.round(b * 100);

/** O estágio mais avançado que o processo alcançou (o pagamento conta mais que o PED aberto de outra parcela). */
export function faseFinanceira(v: Partial<ValoresFinanceiros> | null | undefined): FaseFinanceira {
  const empenhado = n(v?.empenhado);
  const pago = n(v?.pago);
  if (pago > 0) return fase(empenhado > 0 && maiorOuIgual(pago, empenhado) && n(v?.ped_autorizado) === 0 ? "pago" : "pago_parcial");
  if (n(v?.liquidado) > 0) return fase("liquidado");
  if (empenhado > 0) return fase("empenhado");
  if (n(v?.ped_autorizado) > 0) return fase("ped");
  if (n(v?.reservado) > 0) return fase("reservado");
  return fase("sem_movimento");
}

/** Quanto falta no saldo livre para a reserva (0 quando cabe); `null` quando não há dotação no QDD. */
export function faltaNoSaldo(valor: number, saldoLivre: number | null | undefined): number | null {
  if (saldoLivre === null || saldoLivre === undefined) return null;
  return Math.max(0, Math.round((valor - saldoLivre) * 100) / 100);
}
