/**
 * Regras puras da edição da ficha financeira (sem React, sem Supabase):
 * quem pode editar, recálculo de totais (ficha e folha), margem consignável,
 * vigência de dependente na competência e tradução de erro do banco.
 *
 * Espelham o que o banco faz hoje (`processar_folha_pagamento`,
 * `count_dependentes_irrf`, `folha_esta_bloqueada`) — ver
 * `docs/superpowers/specs/2026-10-09-folha-detalhe-edicao-design.md`.
 */

import type { StatusFolha } from "@/types/folha";
import { calcularMargemConsignavel } from "@/lib/folhaCalculos";

// ============== STATUS / PERMISSÃO ==============

/** Status em que o front permite incluir/editar/excluir itens, consignações e dependentes. */
export const STATUS_FOLHA_EDITAVEIS: readonly StatusFolha[] = ["previa", "aberta", "reaberta"];

/** Ordem padrão dos itens lançados manualmente (os automáticos da RPC ficam antes). */
export const ORDEM_ITEM_MANUAL = 900;

export function folhaEditavel(status: string | null | undefined): boolean {
  return !!status && (STATUS_FOLHA_EDITAVEIS as readonly string[]).includes(status);
}

/**
 * Pode editar a ficha = folha em status editável E usuário com `financeiro.folha.processar`
 * (ou super admin — `hasPermission` já trata isso).
 */
export function podeEditarFicha(status: string | null | undefined, temPermissao: boolean): boolean {
  return folhaEditavel(status) && temPermissao;
}

export function motivoBloqueioEdicao(status: string | null | undefined, temPermissao: boolean): string | null {
  if (!folhaEditavel(status)) {
    if (status === "fechada") return "Folha fechada: a ficha é somente leitura. Reabra a folha para alterar.";
    if (status === "processando") return "Folha em processamento: aguarde a conclusão para alterar.";
    return "A folha não está em um status que permita edição.";
  }
  if (!temPermissao) return "Você não tem a permissão financeiro.folha.processar para alterar fichas.";
  return null;
}

// ============== TOTAIS ==============

export interface ItemParaTotais {
  tipo: string;
  valor: number | string | null;
  descricao?: string | null;
  ordem?: number | null;
}

/** Campos da ficha que a RPC grava sem criar item (vencimento, INSS e IRRF). */
export interface BaseFichaParaTotais {
  cargo_vencimento: number | string | null;
  valor_inss: number | string | null;
  valor_irrf: number | string | null;
}

export interface TotaisFicha {
  total_proventos: number;
  total_descontos: number;
  valor_liquido: number;
}

const arredondar2 = (n: number) => Math.round(n * 100) / 100;

/**
 * A RPC antiga (migração 20260112175202) gravava vencimento/INSS/IRRF também como itens
 * (ordem 1/100/101). A RPC atual não cria item nenhum. Para não somar duas vezes numa ficha
 * herdada, esses itens automáticos são ignorados no recálculo (o valor já está na ficha).
 */
export function itemAutomaticoLegado(item: ItemParaTotais): boolean {
  const desc = (item.descricao ?? "").trim().toLowerCase();
  if (item.ordem === 1 && item.tipo === "provento" && desc.startsWith("vencimento base")) return true;
  if (item.ordem === 100 && item.tipo === "desconto" && desc === "inss") return true;
  if (item.ordem === 101 && item.tipo === "desconto" && desc === "irrf") return true;
  return false;
}

/**
 * Totais da ficha = o que a RPC gravou (vencimento como provento; INSS + IRRF como descontos)
 * mais os itens lançados; líquido = proventos − descontos (2 casas).
 */
export function calcularTotaisFicha(ficha: BaseFichaParaTotais, itens: ItemParaTotais[]): TotaisFicha {
  let proventos = Number(ficha.cargo_vencimento) || 0;
  let descontos = (Number(ficha.valor_inss) || 0) + (Number(ficha.valor_irrf) || 0);
  for (const item of itens) {
    if (itemAutomaticoLegado(item)) continue;
    const valor = Number(item.valor) || 0;
    if (item.tipo === "provento") proventos += valor;
    else if (item.tipo === "desconto") descontos += valor;
  }
  proventos = arredondar2(proventos);
  descontos = arredondar2(descontos);
  return { total_proventos: proventos, total_descontos: descontos, valor_liquido: arredondar2(proventos - descontos) };
}

export interface FichaParaTotais {
  total_proventos: number | null;
  total_descontos: number | null;
  valor_liquido: number | null;
  valor_inss: number | null;
  valor_irrf: number | null;
  inss_patronal: number | null;
  total_encargos: number | null;
}

export interface TotaisFolha {
  total_bruto: number;
  total_descontos: number;
  total_liquido: number;
  total_inss_servidor: number;
  total_irrf: number;
  total_inss_patronal: number;
  total_encargos_patronais: number;
  quantidade_servidores: number;
}

/** Totais da folha = somas das fichas (mesmos campos que a RPC preenche). */
export function calcularTotaisFolha(fichas: FichaParaTotais[]): TotaisFolha {
  const soma = (f: (x: FichaParaTotais) => number | null) =>
    arredondar2(fichas.reduce((acc, x) => acc + (Number(f(x)) || 0), 0));
  return {
    total_bruto: soma((f) => f.total_proventos),
    total_descontos: soma((f) => f.total_descontos),
    total_liquido: soma((f) => f.valor_liquido),
    total_inss_servidor: soma((f) => f.valor_inss),
    total_irrf: soma((f) => f.valor_irrf),
    total_inss_patronal: soma((f) => f.inss_patronal),
    total_encargos_patronais: soma((f) => f.total_encargos),
    quantidade_servidores: fichas.length,
  };
}

// ============== ITENS × CONSIGNAÇÕES ==============

export interface ItemParaReferencia {
  tipo: string;
  referencia: string | null;
  valor?: number | string | null;
}

const normalizarReferencia = (ref: string | null | undefined) => (ref ?? "").trim().toLowerCase();

/** Já existe desconto na ficha com essa referência (ex.: número do contrato da consignação)? */
export function itemJaLancado(itens: ItemParaReferencia[], referencia: string | null | undefined): boolean {
  const alvo = normalizarReferencia(referencia);
  if (!alvo) return false;
  return itens.some((i) => i.tipo === "desconto" && normalizarReferencia(i.referencia) === alvo);
}

// ============== CONSIGNAÇÕES / MARGEM ==============

export interface ConsignacaoParaMargem {
  id?: string;
  numero_contrato?: string | null;
  valor_parcela: number | string | null;
  ativo: boolean | null;
  suspenso: boolean | null;
  quitado: boolean | null;
}

export type SituacaoConsignacao = "ativa" | "suspensa" | "quitada" | "inativa";

export function situacaoConsignacao(c: ConsignacaoParaMargem): SituacaoConsignacao {
  if (c.quitado) return "quitada";
  if (c.ativo === false) return "inativa";
  if (c.suspenso) return "suspensa";
  return "ativa";
}

/** Margem usada = soma das parcelas das consignações ativas, não suspensas e não quitadas. */
export function calcularMargemUsada(consignacoes: ConsignacaoParaMargem[], ignorarId?: string): number {
  return arredondar2(
    consignacoes
      .filter((c) => situacaoConsignacao(c) === "ativa" && (!ignorarId || c.id !== ignorarId))
      .reduce((acc, c) => acc + (Number(c.valor_parcela) || 0), 0),
  );
}

/**
 * Base da margem = líquido da ficha **antes** das consignações: o `valor_liquido` já desconta as
 * parcelas lançadas na ficha ("Lançar na ficha"), então elas são devolvidas à base para não
 * contarem duas vezes (uma no líquido, outra em "usada").
 */
export function baseMargemConsignavel(
  valorLiquido: number | null | undefined,
  itens: ItemParaReferencia[],
  consignacoes: ConsignacaoParaMargem[],
): number {
  const contratos = new Set(consignacoes.map((c) => normalizarReferencia(c.numero_contrato)).filter(Boolean));
  const devolvido = itens
    .filter((i) => i.tipo === "desconto" && contratos.has(normalizarReferencia(i.referencia)))
    .reduce((acc, i) => acc + (Number(i.valor) || 0), 0);
  return arredondar2((Number(valorLiquido) || 0) + devolvido);
}

export interface AvaliacaoMargem {
  /** Base (líquido da ficha antes das consignações). */
  base: number;
  /** Margem total = base × percentual. */
  margem: number;
  usada: number;
  disponivel: number;
  /** Não há parâmetro `margem_consignavel` vigente: margem não avaliada, nada excede. */
  semParametro: boolean;
  /** A parcela nova (se informada) ultrapassa a margem disponível? */
  excede: boolean;
}

/**
 * Avalia a margem consignável. `base` já deve vir de `baseMargemConsignavel`; `novaParcela` é a
 * parcela que se quer incluir/alterar; `ignorarId` tira da soma a própria consignação em edição.
 * Sem percentual (parâmetro ausente), `excede` é sempre falso — não dá para avaliar.
 */
export function avaliarMargem(
  base: number | null | undefined,
  percentual: number | null | undefined,
  consignacoes: ConsignacaoParaMargem[],
  novaParcela = 0,
  ignorarId?: string,
): AvaliacaoMargem {
  const semParametro = percentual == null || !Number.isFinite(Number(percentual));
  const baseNum = arredondar2(Number(base) || 0);
  const margem = semParametro ? 0 : calcularMargemConsignavel(baseNum, Number(percentual)).margem;
  const usada = calcularMargemUsada(consignacoes, ignorarId);
  const disponivel = arredondar2(margem - usada);
  const parcela = Number(novaParcela) || 0;
  return {
    base: baseNum,
    margem,
    usada,
    disponivel,
    semParametro,
    excede: !semParametro && parcela > 0 && parcela > disponivel + 0.000001,
  };
}

/** Percentual para exibição ("7" e não "7.000000000000001"). */
export function formatarPercentual(p: number | null | undefined): string {
  return (Number(p) || 0).toLocaleString("pt-BR", { maximumFractionDigits: 2 });
}

// ============== COMPETÊNCIA / DEPENDENTES ==============

const pad2 = (n: number) => String(n).padStart(2, "0");

/** "YYYY-MM" (formato de `consignacoes.competencia_inicio/fim`). */
export function competenciaISO(ano: number, mes: number): string {
  return `${ano}-${pad2(mes)}`;
}

/** Primeiro dia da competência em ISO ("YYYY-MM-01"). */
export function primeiroDiaCompetencia(ano: number, mes: number): string {
  return `${ano}-${pad2(mes)}-01`;
}

/** Último dia da competência em ISO — mesma referência que `processar_folha_pagamento` usa. */
export function ultimoDiaCompetencia(ano: number, mes: number): string {
  // Date.UTC(ano, mes, 0) = dia 0 do mês seguinte = último dia do mês (sem fuso).
  const dia = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  return `${ano}-${pad2(mes)}-${pad2(dia)}`;
}

export interface DependenteParaVigencia {
  ativo: boolean | null;
  deduz_irrf: boolean | null;
  data_inicio_deducao: string;
  data_fim_deducao: string | null;
}

/**
 * Dependente conta no IRRF da competência? Replica `count_dependentes_irrf` com a data de
 * referência da RPC (último dia do mês): ativo = true, deduz_irrf = true (NULL não conta, como
 * no SQL), início ≤ ref e (fim nulo ou fim ≥ ref). Compara strings ISO (sem `new Date`, sem fuso).
 */
export function dependenteVigenteNaCompetencia(dep: DependenteParaVigencia, ano: number, mes: number): boolean {
  if (dep.ativo !== true || dep.deduz_irrf !== true) return false;
  const ref = ultimoDiaCompetencia(ano, mes);
  const inicio = (dep.data_inicio_deducao ?? "").slice(0, 10);
  const fim = dep.data_fim_deducao ? dep.data_fim_deducao.slice(0, 10) : null;
  if (!inicio || inicio > ref) return false;
  if (fim && fim < ref) return false;
  return true;
}

export function contarDependentesVigentes(deps: DependenteParaVigencia[], ano: number, mes: number): number {
  return deps.filter((d) => dependenteVigenteNaCompetencia(d, ano, mes)).length;
}

// ============== ERROS DO BANCO ==============

interface ErroBancoLike {
  code?: string;
  message?: string;
}

/**
 * Converte erro do PostgREST/Postgres em mensagem legível para toast, sem repassar o texto cru
 * do banco (nome de tabela/constraint, "Failing row contains (...)" com dados pessoais).
 * Só `P0001` (RAISE dos triggers, texto escrito pelo time) e `Error` lançado pelo próprio
 * front chegam com a mensagem original.
 */
export function descreverErroBanco(erro: unknown): string {
  if (!erro) return "Erro desconhecido ao acessar o banco.";
  if (erro instanceof Error && !("code" in erro)) return erro.message || "Erro ao acessar o banco.";
  const e = (typeof erro === "object" ? erro : { message: String(erro) }) as ErroBancoLike;
  switch (e.code) {
    case "42501":
      return "O banco recusou a operação (RLS): seu usuário não tem acesso de escrita a este registro.";
    case "P0001":
      return e.message || "Operação bloqueada por regra do banco.";
    case "23514":
      return "Valor rejeitado por regra do banco (restrição de verificação). Revise os campos informados.";
    case "23505":
      return "Registro duplicado: já existe um cadastro com esses dados.";
    case "23502":
      return "Campo obrigatório ausente. Preencha todos os campos marcados.";
    case "23503":
      return "Registro vinculado a outro cadastro (chave estrangeira). Verifique a rubrica/servidor informado.";
    case "PGRST116":
      return "Nenhum registro foi alterado: ele não existe ou a política de acesso (RLS) não permite.";
    default:
      return e.code ? `Erro ao acessar o banco (código ${e.code}).` : "Erro ao acessar o banco.";
  }
}
