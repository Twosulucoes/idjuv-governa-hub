/**
 * Regras puras da tela Vencimentos (C2): a faixa de cada contrato, a ação esperada (prorrogar, nova contratação,
 * regularizar), a garantia que vence antes do contrato, os cartões, o filtro e a planilha.
 * Prazos de aviso fixos em 120/90/60/30 dias (decisão do dono, 30/10/2026), os mesmos dos filtros da lista.
 */

import { formatDateBR } from "@/lib/formatters";
import { limiteProrrogacao } from "@/lib/contratos/alteracoes";
import { FAIXAS_VENCIMENTO, descricaoVigencia, diasAte, situacaoVigencia, type FaixaVigencia, type SituacaoVigencia } from "@/lib/contratos/vigencia";
import { nomeContratado, responsaveisAtivos, rotuloProvidencia, type Contrato, type ContratoLista } from "@/types/contratos";

/** Maior prazo de aviso (120 dias): o que vence depois disso não aparece em Vencimentos nem no sino. */
export const HORIZONTE_DIAS = FAIXAS_VENCIMENTO[FAIXAS_VENCIMENTO.length - 1].dias;

export type ContratoVencimento = Pick<
  Contrato,
  | "id"
  | "numero_contrato"
  | "ano"
  | "objeto"
  | "objeto_resumido"
  | "status"
  | "data_inicio"
  | "data_fim"
  | "data_fim_atual"
  | "prorrogavel"
  | "prazo_maximo_meses"
  | "garantia_tipo"
  | "garantia_vencimento"
  | "renovacao_providencia"
  | "renovacao_processo_sei"
  | "renovacao_observacao"
  | "renovacao_atualizada_em"
> &
  Pick<ContratoLista, "responsaveis"> & {
    /** Sem o CPF/CNPJ: a tela e a planilha não mostram o documento do contratado. */
    fornecedor: Omit<NonNullable<ContratoLista["fornecedor"]>, "cpf_cnpj"> | null;
  };

export type AcaoEsperada = "regularizar" | "suspenso" | "prorrogar" | "nova_contratacao";

const TEXTO_ACAO: Record<AcaoEsperada, string> = {
  regularizar: "Vencido: encerrar ou regularizar",
  suspenso: "Suspenso: na retomada, prorrogar pelo tempo parado",
  prorrogar: "Abrir a prorrogação no SEI",
  nova_contratacao: "Nova contratação ou encerrar",
};
export const textoAcao = (a: AcaoEsperada) => TEXTO_ACAO[a];

type ContratoAcao = Pick<ContratoVencimento, "status" | "data_inicio" | "data_fim" | "data_fim_atual" | "prorrogavel" | "prazo_maximo_meses">;

/** O que fazer com o vencimento: prorrogar se pode e ainda cabe no prazo máximo; senão, nova contratação ou encerrar. */
export function acaoEsperada(c: ContratoAcao, hoje: Date | string = new Date()): AcaoEsperada {
  if (situacaoVigencia(c, hoje).faixa === "vencido") return "regularizar";
  if (c.status === "suspenso") return "suspenso";
  const limite = limiteProrrogacao(c);
  const fim = c.data_fim_atual || c.data_fim;
  return c.prorrogavel && (!limite || limite > fim) ? "prorrogar" : "nova_contratacao";
}

/** Garantia que acaba antes do contrato e vence em até 120 dias (ou já venceu): precisa ser renovada. */
export function garantiaVencendo(
  c: Pick<ContratoVencimento, "garantia_vencimento" | "data_fim" | "data_fim_atual">,
  hoje: Date | string = new Date(),
): boolean {
  const g = c.garantia_vencimento;
  return !!g && g < (c.data_fim_atual || c.data_fim) && diasAte(g, hoje) <= HORIZONTE_DIAS;
}

export interface LinhaVencimento {
  contrato: ContratoVencimento;
  situacao: SituacaoVigencia;
  /** Vencido ou vence em até 120 dias (sem isso, a linha está só pela garantia). */
  noPrazo: boolean;
  acao: AcaoEsperada;
  limite: string | null;
  garantia: boolean;
  gestor: string | null;
}

export function linhaVencimento(c: ContratoVencimento, hoje: Date | string = new Date()): LinhaVencimento {
  const situacao = situacaoVigencia(c, hoje);
  return {
    contrato: c,
    situacao,
    noPrazo: situacao.dias !== null && situacao.dias <= HORIZONTE_DIAS && situacao.faixa !== "encerrado" && situacao.faixa !== "rascunho",
    acao: acaoEsperada(c, hoje),
    limite: limiteProrrogacao(c),
    garantia: garantiaVencendo(c, hoje),
    gestor: responsaveisAtivos(c.responsaveis).gestor?.nome ?? null,
  };
}

/** Linhas da tela: o que está no prazo ou com a garantia vencendo, do mais urgente ao mais folgado. */
export function montarVencimentos(lista: ContratoVencimento[], hoje: Date | string = new Date()): LinhaVencimento[] {
  return lista
    .filter((c) => c.status !== "rascunho" && c.status !== "encerrado" && c.status !== "rescindido")
    .map((c) => linhaVencimento(c, hoje))
    .filter((l) => l.noPrazo || l.garantia)
    .sort((a, b) => (a.situacao.dias ?? Infinity) - (b.situacao.dias ?? Infinity));
}

export type FiltroVencimento = "todos" | "vencido" | Exclude<FaixaVigencia, "rascunho" | "encerrado" | "vencido" | "vigente"> | "garantia";

export const FILTROS_VENCIMENTO: readonly { value: FiltroVencimento; label: string }[] = [
  { value: "todos", label: "Todos os prazos" },
  { value: "vencido", label: "Vencidos" },
  { value: "ate30", label: "Em até 30 dias" },
  { value: "ate60", label: "De 31 a 60 dias" },
  { value: "ate90", label: "De 61 a 90 dias" },
  { value: "ate120", label: "De 91 a 120 dias" },
  { value: "garantia", label: "Garantia vencendo" },
];

export const ehFiltroVencimento = (v: string | null): v is FiltroVencimento => FILTROS_VENCIMENTO.some((f) => f.value === v);

export const semProvidencia = (l: LinhaVencimento) => l.noPrazo && !l.contrato.renovacao_providencia;

export function passaNoFiltroVencimento(l: LinhaVencimento, filtro: FiltroVencimento, soSemProvidencia = false): boolean {
  if (soSemProvidencia && !semProvidencia(l)) return false;
  if (filtro === "todos") return true;
  if (filtro === "garantia") return l.garantia;
  return l.noPrazo && l.situacao.faixa === filtro;
}

export type ResumoVencimentos = Record<Exclude<FiltroVencimento, "todos">, number> & { semProvidencia: number };

export function resumoVencimentos(linhas: LinhaVencimento[]): ResumoVencimentos {
  const r: ResumoVencimentos = { vencido: 0, ate30: 0, ate60: 0, ate90: 0, ate120: 0, garantia: 0, semProvidencia: 0 };
  for (const l of linhas) {
    if (l.noPrazo && l.situacao.faixa in r) r[l.situacao.faixa as keyof ResumoVencimentos] += 1;
    if (l.garantia) r.garantia += 1;
    if (semProvidencia(l)) r.semProvidencia += 1;
  }
  return r;
}

/** "Prorrogação em andamento · 00000.000000/2026.00": a providência como aparece na tabela e na planilha. */
export function textoProvidencia(c: Pick<ContratoVencimento, "renovacao_providencia" | "renovacao_processo_sei">): string {
  if (!c.renovacao_providencia) return "";
  return [rotuloProvidencia(c.renovacao_providencia), c.renovacao_processo_sei].filter(Boolean).join(" · ");
}

export function textoLimite(l: Pick<LinhaVencimento, "limite" | "contrato">): string {
  if (!l.contrato.prorrogavel) return "Não prorrogável";
  return l.limite ? `até ${formatDateBR(l.limite)}` : "Sem prazo máximo cadastrado";
}

/** Linhas da planilha "Vencimentos" (o que está filtrado na tela). */
export function linhasPlanilhaVencimentos(linhas: LinhaVencimento[]) {
  return linhas.map((l) => ({
    "Contrato": `${l.contrato.numero_contrato}/${l.contrato.ano}`,
    "Contratado": nomeContratado(l.contrato.fornecedor),
    "Objeto": l.contrato.objeto_resumido || l.contrato.objeto,
    "Gestor": l.gestor ?? "",
    "Fim (atual)": formatDateBR(l.contrato.data_fim_atual || l.contrato.data_fim),
    "Prazo": descricaoVigencia(l.situacao),
    "Pode prorrogar": textoLimite(l),
    "Ação esperada": textoAcao(l.acao),
    "Providência": textoProvidencia(l.contrato),
    "Observação da providência": l.contrato.renovacao_observacao ?? "",
    "Garantia vence em": l.contrato.garantia_vencimento ? formatDateBR(l.contrato.garantia_vencimento) : "",
  }));
}
