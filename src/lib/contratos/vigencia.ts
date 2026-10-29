/**
 * Regras puras da vigência do contrato: em que faixa de vencimento ele está (para o selo, os filtros e o painel).
 * Usa o fim da vigência atual (`data_fim_atual`, que a C2 recalcula pelos aditivos) e, sem ele, o fim original.
 * Spec: docs/superpowers/specs/2026-10-27-contratos-gestao-completa-design.md (C1 e C2: avisos em 120/90/60/30 dias).
 */

import type { TomStatus } from "@/components/design-system";

export type FaixaVigencia = "rascunho" | "encerrado" | "vencido" | "ate30" | "ate60" | "ate90" | "ate120" | "vigente";

export interface SituacaoVigencia {
  faixa: FaixaVigencia;
  /** Dias até o fim (0 = vence hoje; negativo = vencido). Nulo sem prazo (rascunho, encerrado, sem data). */
  dias: number | null;
}

interface ContratoVigencia {
  status: string | null;
  data_fim: string | null;
  data_fim_atual?: string | null;
}

/** Prazos de aviso, do mais urgente ao mais folgado (opções do filtro "vence em até"). */
export const FAIXAS_VENCIMENTO = [
  { faixa: "ate30", dias: 30 },
  { faixa: "ate60", dias: 60 },
  { faixa: "ate90", dias: 90 },
  { faixa: "ate120", dias: 120 },
] as const satisfies readonly { faixa: FaixaVigencia; dias: number }[];

const ENCERRADOS = new Set(["encerrado", "rescindido"]);
const DIA_MS = 86_400_000;

const isoLocal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
/** Hoje em AAAA-MM-DD pelo dia local (padrão dos campos de data dos formulários). */
export const hojeIso = () => isoLocal(new Date());
const diaUtc = (iso: string) => Date.UTC(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)) - 1, Number(iso.slice(8, 10)));

/** Dias corridos de `hoje` até `fim` (AAAA-MM-DD), sem efeito de fuso. `hoje` como Date vale pelo dia local. */
export function diasAte(fim: string, hoje: Date | string = new Date()): number {
  const h = typeof hoje === "string" ? hoje : isoLocal(hoje);
  return Math.round((diaUtc(fim) - diaUtc(h)) / DIA_MS);
}

export function situacaoVigencia(c: ContratoVigencia, hoje: Date | string = new Date()): SituacaoVigencia {
  if (c.status === "rascunho") return { faixa: "rascunho", dias: null };
  if (c.status && ENCERRADOS.has(c.status)) return { faixa: "encerrado", dias: null };
  const fim = c.data_fim_atual || c.data_fim;
  if (!fim) return { faixa: "vigente", dias: null };
  const dias = diasAte(fim, hoje);
  if (dias < 0) return { faixa: "vencido", dias };
  const faixa = FAIXAS_VENCIMENTO.find((f) => dias <= f.dias)?.faixa ?? "vigente";
  return { faixa, dias };
}

const plural = (n: number, um: string, varios: string) => `${n} ${n === 1 ? um : varios}`;

/** Texto do selo: "Vencido há 3 dias", "Vence hoje", "Vence em 45 dias", "Vigente"... */
export function descricaoVigencia(s: SituacaoVigencia): string {
  switch (s.faixa) {
    case "rascunho":
      return "Rascunho";
    case "encerrado":
      return "Encerrado";
    case "vigente":
      return "Vigente";
    case "vencido":
      return `Vencido há ${plural(Math.abs(s.dias ?? 0), "dia", "dias")}`;
    default:
      if (s.dias === 0) return "Vence hoje";
      if (s.dias === 1) return "Vence amanhã";
      return `Vence em ${s.dias} dias`;
  }
}

const TONS: Record<FaixaVigencia, TomStatus> = {
  vencido: "erro",
  ate30: "erro",
  ate60: "pendente",
  ate90: "pendente",
  ate120: "andamento",
  vigente: "sucesso",
  encerrado: "neutro",
  rascunho: "neutro",
};

export const tomFaixa = (f: FaixaVigencia): TomStatus => TONS[f];

/** Para o filtro "vence em até N dias": só contrato em vigor, de hoje até N dias (vencido fica de fora). */
export function dentroDoPrazo(s: SituacaoVigencia, limite: number): boolean {
  return s.dias !== null && s.dias >= 0 && s.dias <= limite && s.faixa !== "encerrado" && s.faixa !== "rascunho";
}

const TONS_SITUACAO: Record<string, TomStatus> = {
  rascunho: "neutro",
  vigente: "sucesso",
  aditado: "andamento",
  suspenso: "pendente",
  encerrado: "neutro",
  rescindido: "erro",
};

/** Tom do selo da situação cadastrada do contrato (rascunho, vigente, suspenso...). */
export const tomSituacaoContrato = (status: string | null | undefined): TomStatus => TONS_SITUACAO[status ?? ""] ?? "neutro";
