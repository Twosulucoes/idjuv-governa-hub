/**
 * Fontes do Financeiro no Gerador de relatórios: cada uma é uma lista que o sistema já tem, lida com o RLS do
 * usuário, com as colunas traduzidas (natureza com nome, situação por extenso) e os valores em número.
 * Spec: docs/superpowers/specs/2026-10-30-gerador-relatorios-design.md §4
 */

import { supabase } from "@/integrations/supabase/client";
import { STATUS_EMPENHO_LABELS, type StatusEmpenho } from "@/types/financeiro";
import { ROTULOS_GRUPO, formatarNatureza } from "@/lib/financeiro/painelExecucao";
import { rotuloOrigem } from "@/lib/financeiro/origemDotacao";
import { situacaoPrestacao, type SituacaoPrestacao } from "@/lib/financeiro/diariasFiplan";
import { diasAte } from "@/lib/financeiro/conveniosFederais";
import type { ColunaFonte, FonteRelatorio } from "@/lib/relatoriosDinamicos/tipos";
import { carregarPaginado, mesDe, num, partesDotacaoFiplan } from "./carregar";

const MODULO = "financeiro";

/** "33903900" + "Outros serviços…" → "3.3.90.39 – Outros serviços…". */
const natureza = (codigo: string | null | undefined, nome?: string | null): string | null => {
  if (!codigo) return null;
  return nome ? `${formatarNatureza(codigo)} – ${nome}` : formatarNatureza(codigo);
};

/** 2º dígito da natureza: 1 pessoal, 3 custeio, 4 investimento… */
const grupo = (codigo: string | null | undefined): string | null => {
  const d = (codigo ?? "").replace(/\D/g, "");
  return d.length >= 2 ? (ROTULOS_GRUPO[d[1]] ?? null) : null;
};

const fonteRotulo = (codigo: string | null | undefined, nome?: string | null): string | null =>
  codigo ? (nome ? `${codigo} – ${nome}` : codigo) : null;

const texto = <T>(id: string, rotulo: string, valor: (l: T) => string | null | undefined, extra: Partial<ColunaFonte<T>> = {}): ColunaFonte<T> => ({
  id,
  rotulo,
  tipo: "texto",
  valor: (l) => valor(l) ?? null,
  ...extra,
});
const moeda = <T>(id: string, rotulo: string, valor: (l: T) => number | null, extra: Partial<ColunaFonte<T>> = {}): ColunaFonte<T> => ({
  id,
  rotulo,
  tipo: "moeda",
  valor,
  filtro: "faixa",
  ...extra,
});
const data = <T>(id: string, rotulo: string, valor: (l: T) => string | null | undefined, extra: Partial<ColunaFonte<T>> = {}): ColunaFonte<T> => ({
  id,
  rotulo,
  tipo: "data",
  valor: (l) => valor(l) ?? null,
  filtro: "periodo",
  ...extra,
});
/** Mês (AAAA-MM) para agrupar e escolher na lista; ordena certo e aparece como 03/2026. */
const mes = <T>(id: string, rotulo: string, valor: (l: T) => string | null | undefined): ColunaFonte<T> => ({
  id,
  rotulo,
  tipo: "data",
  valor: (l) => mesDe(valor(l)),
  agrupavel: true,
  filtro: "lista",
});

// ---------------------------------------------------------------- QDD / dotações

interface LinhaDotacao {
  codigo_dotacao: string | null;
  idu: string | null;
  paoe: string | null;
  valor_inicial: number | null;
  valor_atual: number | null;
  valor_bloqueado: number | null;
  valor_reserva: number | null;
  valor_ped: number | null;
  valor_empenhado: number | null;
  valor_liquidado: number | null;
  valor_pago: number | null;
  programa: { codigo: string | null; nome: string | null } | null;
  acao: { codigo: string | null; nome: string | null } | null;
  natureza_despesa: { codigo: string | null; nome: string | null } | null;
  fonte_recurso: { codigo: string | null; nome: string | null } | null;
}

/** Mesma conta do painel e do QDD: atual − bloqueado − max(PED, empenhado + reserva). */
const disponivel = (d: LinhaDotacao): number =>
  Math.round(
    ((num(d.valor_atual) ?? 0) -
      (num(d.valor_bloqueado) ?? 0) -
      Math.max(num(d.valor_ped) ?? 0, (num(d.valor_empenhado) ?? 0) + (num(d.valor_reserva) ?? 0))) *
      100,
  ) / 100;

export const fonteQdd: FonteRelatorio<LinhaDotacao> = {
  id: "qdd",
  modulo: MODULO,
  rotulo: "QDD / Dotações",
  descricao: "Dotações do exercício importadas do QDD do FIPLAN: autorizado, comprometido, executado e disponível.",
  carregar: (exercicio) =>
    carregarPaginado<LinhaDotacao>((de, ate) =>
      supabase
        .from("fin_dotacoes")
        .select(
          `codigo_dotacao, idu, paoe, valor_inicial, valor_atual, valor_bloqueado, valor_reserva, valor_ped,
           valor_empenhado, valor_liquidado, valor_pago,
           programa:fin_programas_orcamentarios(codigo, nome),
           acao:fin_acoes_orcamentarias(codigo, nome),
           natureza_despesa:fin_naturezas_despesa(codigo, nome),
           fonte_recurso:fin_fontes_recurso(codigo, nome)`,
        )
        .eq("exercicio", exercicio)
        .eq("ativo", true)
        .order("codigo_dotacao")
        .range(de, ate) as unknown as PromiseLike<{ data: LinhaDotacao[] | null; error: { message: string } | null }>,
    ),
  colunas: [
    texto("natureza", "Natureza", (d) => natureza(d.natureza_despesa?.codigo, d.natureza_despesa?.nome), { padrao: true, agrupavel: true, filtro: "lista", peso: 2.5 }),
    texto("grupo", "Grupo de despesa", (d) => grupo(d.natureza_despesa?.codigo), { agrupavel: true, filtro: "lista" }),
    texto("fonte", "Fonte", (d) => fonteRotulo(d.fonte_recurso?.codigo, d.fonte_recurso?.nome), { padrao: true, agrupavel: true, filtro: "lista", peso: 1.5 }),
    texto("origem", "Origem", (d) => rotuloOrigem(d.idu), { agrupavel: true, filtro: "lista", peso: 1.5 }),
    texto("acao", "Ação / PAOE", (d) => (d.acao?.codigo ? `${d.acao.codigo} – ${d.acao.nome ?? ""}`.trim() : d.paoe), { agrupavel: true, filtro: "lista", peso: 2 }),
    texto("programa", "Programa", (d) => (d.programa?.codigo ? `${d.programa.codigo} – ${d.programa.nome ?? ""}`.trim() : null), { agrupavel: true, filtro: "lista", peso: 2 }),
    texto("dotacao", "Dotação", (d) => d.codigo_dotacao, { peso: 2.5 }),
    moeda("inicial", "Inicial", (d) => num(d.valor_inicial)),
    moeda("atual", "Autorizado", (d) => num(d.valor_atual), { padrao: true }),
    moeda("bloqueado", "Bloqueado", (d) => num(d.valor_bloqueado)),
    moeda("ped", "PED", (d) => num(d.valor_ped)),
    moeda("empenhado", "Empenhado", (d) => num(d.valor_empenhado), { padrao: true }),
    moeda("liquidado", "Liquidado", (d) => num(d.valor_liquidado)),
    moeda("pago", "Pago", (d) => num(d.valor_pago), { padrao: true }),
    moeda("disponivel", "Disponível", disponivel, { padrao: true }),
  ],
};

// ---------------------------------------------------------------- Empenhos (FIP 614)

interface LinhaEmpenho {
  numero: string;
  data_empenho: string | null;
  credor_nome: string | null;
  status: string | null;
  origem: string | null;
  tipo: string | null;
  processo_sei: string | null;
  processo_fiplan: string | null;
  objeto: string | null;
  valor_empenhado: number | null;
  valor_anulado: number | null;
  valor_liquidado: number | null;
  valor_pago: number | null;
  saldo_liquidar: number | null;
  saldo_pagar: number | null;
  fornecedor: { razao_social: string | null } | null;
  natureza_despesa: { codigo: string | null; nome: string | null } | null;
  fonte_recurso: { codigo: string | null; nome: string | null } | null;
  emenda: { numero: string | null; autor: string | null } | null;
}

export const fonteEmpenhos: FonteRelatorio<LinhaEmpenho> = {
  id: "empenhos",
  modulo: MODULO,
  rotulo: "Empenhos (FIP 614)",
  descricao: "Empenhos do exercício (FIPLAN e contingência): credor, natureza, fonte, situação e saldos.",
  carregar: (exercicio) =>
    carregarPaginado<LinhaEmpenho>((de, ate) =>
      supabase
        .from("fin_empenhos")
        .select(
          `numero, data_empenho, credor_nome, status, origem, tipo, processo_sei, processo_fiplan, objeto,
           valor_empenhado, valor_anulado, valor_liquidado, valor_pago, saldo_liquidar, saldo_pagar,
           fornecedor:fornecedores(razao_social),
           natureza_despesa:fin_naturezas_despesa(codigo, nome),
           fonte_recurso:fin_fontes_recurso(codigo, nome),
           emenda:fin_emendas(numero, autor)`,
        )
        .eq("exercicio", exercicio)
        .order("data_empenho", { ascending: false })
        .order("numero")
        .range(de, ate) as unknown as PromiseLike<{ data: LinhaEmpenho[] | null; error: { message: string } | null }>,
    ),
  colunas: [
    texto("numero", "Número", (e) => e.numero, { padrao: true, peso: 1.4 }),
    data("data", "Data", (e) => e.data_empenho, { padrao: true }),
    mes("mes", "Mês", (e) => e.data_empenho),
    texto("credor", "Credor", (e) => e.credor_nome ?? e.fornecedor?.razao_social, { padrao: true, agrupavel: true, filtro: "lista", peso: 2.5 }),
    texto("natureza", "Natureza", (e) => natureza(e.natureza_despesa?.codigo, e.natureza_despesa?.nome), { agrupavel: true, filtro: "lista", peso: 2.5 }),
    texto("grupo", "Grupo de despesa", (e) => grupo(e.natureza_despesa?.codigo), { agrupavel: true, filtro: "lista" }),
    texto("fonte", "Fonte", (e) => fonteRotulo(e.fonte_recurso?.codigo, e.fonte_recurso?.nome), { agrupavel: true, filtro: "lista", peso: 1.5 }),
    texto("situacao", "Situação", (e) => (e.status ? (STATUS_EMPENHO_LABELS[e.status as StatusEmpenho] ?? e.status) : null), { padrao: true, agrupavel: true, filtro: "lista" }),
    texto("origem", "Origem", (e) => (e.origem === "fiplan" ? "FIPLAN" : e.origem === "sistema" ? "Contingência" : e.origem), { agrupavel: true, filtro: "lista" }),
    texto("emenda", "Emenda", (e) => (e.emenda?.numero ? [e.emenda.numero, e.emenda.autor].filter(Boolean).join(" – ") : null), { agrupavel: true, filtro: "lista", peso: 1.5 }),
    texto("processo_sei", "Processo SEI", (e) => e.processo_sei, { filtro: "lista", peso: 1.5 }),
    texto("processo_fiplan", "Processo FIPLAN", (e) => e.processo_fiplan),
    texto("objeto", "Objeto", (e) => e.objeto, { peso: 3 }),
    moeda("empenhado", "Empenhado", (e) => num(e.valor_empenhado), { padrao: true }),
    moeda("anulado", "Anulado", (e) => num(e.valor_anulado)),
    moeda("liquidado", "Liquidado", (e) => num(e.valor_liquidado), { padrao: true }),
    moeda("pago", "Pago", (e) => num(e.valor_pago), { padrao: true }),
    moeda("saldo_liquidar", "Saldo a liquidar", (e) => num(e.saldo_liquidar)),
    moeda("saldo_pagar", "Saldo a pagar", (e) => num(e.saldo_pagar)),
    { id: "com_saldo_pagar", rotulo: "Com saldo a pagar", tipo: "booleano", valor: (e) => (num(e.saldo_pagar) ?? 0) > 0, agrupavel: true, filtro: "booleano" },
  ],
};

// ---------------------------------------------------------------- PEDs (Consultar PED)

interface LinhaPed {
  numero: string;
  numero_estorno: string | null;
  empenho_numero: string | null;
  data_solicitacao: string | null;
  data_autorizacao: string | null;
  credor_nome: string | null;
  situacao: string | null;
  tipo_empenho: string | null;
  processo_sei: string | null;
  processo_fiplan: string | null;
  dotacao_fiplan: string | null;
  estorno: boolean | null;
  historico: string | null;
  valor: number | null;
}

export const fontePeds: FonteRelatorio<LinhaPed> = {
  id: "peds",
  modulo: MODULO,
  rotulo: "PEDs (pedidos de empenho)",
  descricao: "Pedidos de empenho do FIPLAN (Consultar PED): situação, processo, credor, dotação e valor.",
  carregar: (exercicio) =>
    carregarPaginado<LinhaPed>((de, ate) =>
      supabase
        .from("fin_peds")
        .select(
          "numero, numero_estorno, empenho_numero, data_solicitacao, data_autorizacao, credor_nome, situacao, tipo_empenho, processo_sei, processo_fiplan, dotacao_fiplan, estorno, historico, valor",
        )
        .eq("exercicio", exercicio)
        .order("numero")
        .range(de, ate),
    ),
  colunas: [
    texto("numero", "Nº PED", (p) => p.numero, { padrao: true, peso: 1.4 }),
    data("data_solicitacao", "Solicitação", (p) => p.data_solicitacao, { padrao: true }),
    mes("mes", "Mês da solicitação", (p) => p.data_solicitacao),
    data("data_autorizacao", "Autorização", (p) => p.data_autorizacao),
    texto("situacao", "Situação", (p) => p.situacao, { padrao: true, agrupavel: true, filtro: "lista", peso: 2 }),
    texto("credor", "Credor", (p) => p.credor_nome, { padrao: true, agrupavel: true, filtro: "lista", peso: 2.5 }),
    texto("natureza", "Natureza", (p) => natureza(partesDotacaoFiplan(p.dotacao_fiplan).natureza), { agrupavel: true, filtro: "lista" }),
    texto("fonte", "Fonte", (p) => partesDotacaoFiplan(p.dotacao_fiplan).fonte, { agrupavel: true, filtro: "lista" }),
    texto("tipo_empenho", "Tipo de empenho", (p) => p.tipo_empenho, { agrupavel: true, filtro: "lista" }),
    texto("processo_sei", "Processo SEI", (p) => p.processo_sei, { filtro: "lista", peso: 1.5 }),
    texto("processo_fiplan", "Processo FIPLAN", (p) => p.processo_fiplan),
    texto("empenho", "Nº EMP", (p) => p.empenho_numero, { peso: 1.4 }),
    texto("dotacao", "Dotação", (p) => p.dotacao_fiplan, { peso: 3 }),
    texto("historico", "Histórico", (p) => p.historico, { peso: 3 }),
    { id: "estorno", rotulo: "Documento de estorno", tipo: "booleano", valor: (p) => p.estorno === true, agrupavel: true, filtro: "lista" },
    moeda("valor", "Valor", (p) => num(p.valor), { padrao: true }),
  ],
};

// ---------------------------------------------------------------- Documentos do empenho (histórico do FIP 614)

interface LinhaDocumento {
  tipo: string;
  numero: string | null;
  data: string | null;
  historico: string | null;
  valor_emp: number | null;
  valor_liq: number | null;
  valor_nob: number | null;
  valor_gcv: number | null;
  empenho: { numero: string | null; credor_nome: string | null; exercicio: number | null; natureza_despesa: { codigo: string | null; nome: string | null } | null } | null;
}

const ROTULO_DOCUMENTO: Record<string, string> = {
  EMP: "Empenho (EMP)",
  EST: "Estorno (EST)",
  LIQ: "Liquidação (LIQ)",
  NOB: "Ordem bancária (NOB)",
  GCV: "Guia de consignação (GCV)",
};

export const fonteDocumentosEmpenho: FonteRelatorio<LinhaDocumento> = {
  id: "documentos_empenho",
  modulo: MODULO,
  rotulo: "Documentos do empenho (LIQ, NOB…)",
  descricao: "Histórico de cada empenho que o FIP 614 traz: empenho, estornos, liquidações, ordens bancárias e guias.",
  carregar: (exercicio) =>
    carregarPaginado<LinhaDocumento>((de, ate) =>
      supabase
        .from("fin_empenho_documentos_fiplan")
        .select(
          `tipo, numero, data, historico, valor_emp, valor_liq, valor_nob, valor_gcv,
           empenho:fin_empenhos!inner(numero, credor_nome, exercicio, natureza_despesa:fin_naturezas_despesa(codigo, nome))`,
        )
        .eq("empenho.exercicio", exercicio)
        .order("data", { ascending: false })
        .order("id")
        .range(de, ate) as unknown as PromiseLike<{ data: LinhaDocumento[] | null; error: { message: string } | null }>,
    ),
  colunas: [
    texto("tipo", "Documento", (d) => ROTULO_DOCUMENTO[d.tipo] ?? d.tipo, { padrao: true, agrupavel: true, filtro: "lista", peso: 1.5 }),
    texto("numero", "Número", (d) => d.numero, { padrao: true, peso: 1.4 }),
    data("data", "Data", (d) => d.data, { padrao: true }),
    mes("mes", "Mês", (d) => d.data),
    texto("empenho", "Empenho", (d) => d.empenho?.numero, { padrao: true, peso: 1.4 }),
    texto("credor", "Credor", (d) => d.empenho?.credor_nome, { padrao: true, agrupavel: true, filtro: "lista", peso: 2.5 }),
    texto("natureza", "Natureza", (d) => natureza(d.empenho?.natureza_despesa?.codigo, d.empenho?.natureza_despesa?.nome), { agrupavel: true, filtro: "lista", peso: 2.5 }),
    texto("historico", "Histórico", (d) => d.historico, { peso: 3 }),
    moeda("valor_emp", "Valor EMP", (d) => num(d.valor_emp)),
    moeda("valor_liq", "Valor LIQ", (d) => num(d.valor_liq), { padrao: true }),
    moeda("valor_nob", "Valor NOB", (d) => num(d.valor_nob), { padrao: true }),
    moeda("valor_gcv", "Valor GCV", (d) => num(d.valor_gcv)),
  ],
};

// ---------------------------------------------------------------- Diárias (FIP 002)

interface LinhaDiaria {
  credor_nome: string;
  empenho_numero: string;
  data_saida: string | null;
  data_retorno: string | null;
  data_pagamento: string | null;
  quantidade: number | null;
  valor_empenhado: number;
  valor_liquidado: number | null;
  prestou_contas: boolean;
  servidor_id: string | null;
}

const ROTULO_PRESTACAO: Record<SituacaoPrestacao, string> = {
  prestou: "Prestou contas",
  no_prazo: "No prazo",
  atrasada: "Atrasada",
  sem_retorno: "Sem data de retorno",
};

export const fonteDiarias: FonteRelatorio<LinhaDiaria> = {
  id: "diarias",
  modulo: MODULO,
  rotulo: "Diárias (FIP 002)",
  descricao: "Diárias pagas no FIPLAN: quem viajou, quando, quantas diárias, valores e prestação de contas.",
  permissao: "financeiro.diarias.visualizar",
  carregar: (exercicio) =>
    carregarPaginado<LinhaDiaria>((de, ate) =>
      supabase
        .from("fin_diarias_fiplan")
        .select("credor_nome, empenho_numero, data_saida, data_retorno, data_pagamento, quantidade, valor_empenhado, valor_liquidado, prestou_contas, servidor_id")
        .eq("exercicio", exercicio)
        .order("data_saida", { ascending: false, nullsFirst: false })
        .order("empenho_numero")
        .range(de, ate),
    ),
  colunas: [
    texto("servidor", "Servidor", (d) => d.credor_nome, { padrao: true, agrupavel: true, filtro: "lista", peso: 2.5 }),
    data("saida", "Saída", (d) => d.data_saida, { padrao: true }),
    data("retorno", "Retorno", (d) => d.data_retorno, { padrao: true }),
    mes("mes", "Mês da viagem", (d) => d.data_saida),
    { id: "quantidade", rotulo: "Diárias", tipo: "numero", valor: (d) => num(d.quantidade), padrao: true, filtro: "faixa" },
    texto("empenho", "Empenho", (d) => d.empenho_numero, { peso: 1.4 }),
    moeda("empenhado", "Empenhado", (d) => num(d.valor_empenhado), { padrao: true }),
    moeda("liquidado", "Liquidado", (d) => num(d.valor_liquidado)),
    data("pagamento", "Pagamento", (d) => d.data_pagamento),
    texto("prestacao", "Prestação de contas", (d) => ROTULO_PRESTACAO[situacaoPrestacao(d, new Date())], { padrao: true, agrupavel: true, filtro: "lista" }),
    { id: "com_cadastro", rotulo: "Servidor cadastrado", tipo: "booleano", valor: (d) => d.servidor_id !== null, agrupavel: true, filtro: "lista" },
  ],
};

// ---------------------------------------------------------------- Emendas parlamentares

interface LinhaEmenda {
  id: string;
  numero: string;
  idu: string | null;
  autor: string | null;
  objeto: string | null;
  beneficiario: string | null;
  processo_sei: string | null;
  valor: number;
  valor_reservado: number | null;
  empenhado: number;
}

export const fonteEmendas: FonteRelatorio<LinhaEmenda> = {
  id: "emendas",
  modulo: MODULO,
  rotulo: "Emendas parlamentares",
  descricao: "Emendas cadastradas no exercício: autor, objeto, beneficiário, valor, reservado, empenhado e livre.",
  carregar: async (exercicio) => {
    const emendas = await carregarPaginado<Omit<LinhaEmenda, "empenhado">>((de, ate) =>
      supabase
        .from("fin_emendas")
        .select("id, numero, idu, autor, objeto, beneficiario, processo_sei, valor, valor_reservado")
        .eq("exercicio", exercicio)
        .eq("ativo", true)
        .order("numero")
        .range(de, ate),
    );
    const empenhos = await carregarPaginado<{ emenda_id: string | null; valor_empenhado: number | null; valor_anulado: number | null }>((de, ate) =>
      supabase.from("fin_empenhos").select("emenda_id, valor_empenhado, valor_anulado").eq("exercicio", exercicio).not("emenda_id", "is", null).order("id").range(de, ate),
    );
    const porEmenda = new Map<string, number>();
    for (const e of empenhos) {
      if (!e.emenda_id) continue;
      porEmenda.set(e.emenda_id, (porEmenda.get(e.emenda_id) ?? 0) + (num(e.valor_empenhado) ?? 0) - (num(e.valor_anulado) ?? 0));
    }
    return emendas.map((e) => ({ ...e, empenhado: Math.round((porEmenda.get(e.id) ?? 0) * 100) / 100 }));
  },
  colunas: [
    texto("numero", "Número", (e) => e.numero, { padrao: true }),
    texto("tipo", "Tipo", (e) => rotuloOrigem(e.idu), { padrao: true, agrupavel: true, filtro: "lista", peso: 2 }),
    texto("autor", "Autor", (e) => e.autor, { padrao: true, agrupavel: true, filtro: "lista", peso: 2 }),
    texto("objeto", "Objeto", (e) => e.objeto, { peso: 3 }),
    texto("beneficiario", "Beneficiário", (e) => e.beneficiario, { agrupavel: true, filtro: "lista", peso: 2 }),
    texto("processo_sei", "Processo SEI", (e) => e.processo_sei, { peso: 1.5 }),
    moeda("valor", "Valor", (e) => num(e.valor), { padrao: true }),
    moeda("reservado", "Reservado", (e) => num(e.valor_reservado)),
    moeda("empenhado", "Empenhado", (e) => e.empenhado, { padrao: true }),
    moeda("livre", "Livre", (e) => Math.round(((num(e.valor) ?? 0) - (num(e.valor_reservado) ?? 0) - e.empenhado) * 100) / 100, { padrao: true }),
  ],
};

// ---------------------------------------------------------------- Convênios federais (Transferegov)

interface LinhaConvenio {
  numero: string | null;
  ano: number | null;
  orgao: string | null;
  orgao_superior: string | null;
  modalidade: string | null;
  situacao: string | null;
  objeto: string | null;
  inicio_vigencia: string | null;
  fim_vigencia: string | null;
  valor_repasse: number | null;
  valor_contrapartida: number | null;
  valor_global: number | null;
}

export const fonteConvenios: FonteRelatorio<LinhaConvenio> = {
  id: "convenios_federais",
  modulo: MODULO,
  rotulo: "Convênios federais (Transferegov)",
  descricao: "Propostas e convênios do Transferegov (todos os anos): órgão, situação, vigência e valores.",
  permissao: "financeiro.convenios.visualizar",
  carregar: () =>
    carregarPaginado<LinhaConvenio>((de, ate) =>
      supabase
        .from("fin_tg_propostas")
        .select("numero, ano, orgao, orgao_superior, modalidade, situacao, objeto, inicio_vigencia, fim_vigencia, valor_repasse, valor_contrapartida, valor_global")
        .order("id_proposta")
        .range(de, ate),
    ),
  colunas: [
    texto("numero", "Número", (c) => c.numero, { padrao: true }),
    texto("ano", "Ano", (c) => (c.ano ? String(c.ano) : null), { agrupavel: true, filtro: "lista" }),
    texto("orgao", "Órgão", (c) => c.orgao, { padrao: true, agrupavel: true, filtro: "lista", peso: 2.5 }),
    texto("orgao_superior", "Órgão superior", (c) => c.orgao_superior, { agrupavel: true, filtro: "lista", peso: 2 }),
    texto("modalidade", "Modalidade", (c) => c.modalidade, { agrupavel: true, filtro: "lista" }),
    texto("situacao", "Situação", (c) => c.situacao, { padrao: true, agrupavel: true, filtro: "lista", peso: 1.5 }),
    texto("objeto", "Objeto", (c) => c.objeto, { peso: 3 }),
    data("inicio", "Início da vigência", (c) => c.inicio_vigencia),
    data("fim", "Fim da vigência", (c) => c.fim_vigencia, { padrao: true }),
    { id: "dias_fim", rotulo: "Dias até o fim", tipo: "numero", valor: (c) => diasAte(c.fim_vigencia, new Date()), filtro: "faixa" },
    moeda("repasse", "Repasse", (c) => num(c.valor_repasse), { padrao: true }),
    moeda("contrapartida", "Contrapartida", (c) => num(c.valor_contrapartida)),
    moeda("global", "Global", (c) => num(c.valor_global), { padrao: true }),
  ],
};

export const FONTES_FINANCEIRO = [
  fonteQdd,
  fonteEmpenhos,
  fontePeds,
  fonteDocumentosEmpenho,
  fonteDiarias,
  fonteEmendas,
  fonteConvenios,
] as FonteRelatorio<unknown>[];
