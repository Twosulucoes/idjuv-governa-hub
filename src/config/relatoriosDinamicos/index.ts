/**
 * Catálogo do Gerador de relatórios: fontes por módulo e modelos prontos (vêm no código, não no banco; o
 * usuário abre, muda e salva como seu). Fonte nova de outro módulo entra aqui (R2 da spec).
 * Spec: docs/superpowers/specs/2026-10-30-gerador-relatorios-design.md
 */

import type { ConfigRelatorio, FonteRelatorio } from "@/lib/relatoriosDinamicos/tipos";
import { FONTES_FINANCEIRO } from "./financeiro";

export const FONTES_RELATORIO: FonteRelatorio<unknown>[] = [...FONTES_FINANCEIRO];

export function fontePorId(id: string | null | undefined): FonteRelatorio<unknown> | undefined {
  return FONTES_RELATORIO.find((f) => f.id === id);
}

export interface ModeloPronto {
  id: string;
  nome: string;
  descricao: string;
  config: ConfigRelatorio;
}

const modelo = (id: string, nome: string, descricao: string, config: Omit<ConfigRelatorio, "versao" | "titulo" | "orientacao"> & Partial<ConfigRelatorio>): ModeloPronto => ({
  id,
  nome,
  descricao,
  config: { versao: 1, titulo: nome, orientacao: "auto", ...config },
});

export const MODELOS_PRONTOS: ModeloPronto[] = [
  modelo("execucao-natureza", "Execução por natureza", "Autorizado, empenhado, pago e disponível de cada natureza, por grupo de despesa.", {
    fonte: "qdd",
    colunas: ["natureza", "fonte", "atual", "empenhado", "liquidado", "pago", "disponivel"],
    filtros: {},
    agrupamentos: ["grupo"],
    totais: { atual: "soma", empenhado: "soma", liquidado: "soma", pago: "soma", disponivel: "soma" },
    ordenacao: { coluna: "natureza", direcao: "asc" },
  }),
  modelo("empenhos-credor", "Empenhos por credor", "Cada empenho do exercício agrupado pelo credor, com subtotal.", {
    fonte: "empenhos",
    colunas: ["numero", "data", "natureza", "situacao", "empenhado", "liquidado", "pago"],
    filtros: {},
    agrupamentos: ["credor"],
    totais: { empenhado: "soma", liquidado: "soma", pago: "soma" },
    ordenacao: { coluna: "data", direcao: "asc" },
  }),
  modelo("saldo-pagar-credor", "Saldo a pagar por credor", "Empenhos com saldo a pagar: quanto falta liquidar e pagar a cada credor.", {
    fonte: "empenhos",
    colunas: ["numero", "data", "natureza", "saldo_liquidar", "saldo_pagar"],
    filtros: { com_saldo_pagar: { ativo: true } },
    agrupamentos: ["credor"],
    totais: { saldo_liquidar: "soma", saldo_pagar: "soma" },
    ordenacao: { coluna: "data", direcao: "asc" },
  }),
  modelo("diarias-servidor-mes", "Diárias por servidor no mês", "Diárias com saída no mês atual, por servidor, com a prestação de contas.", {
    fonte: "diarias",
    colunas: ["saida", "retorno", "quantidade", "empenhado", "prestacao"],
    filtros: { saida: { relativo: "mes_atual" } },
    agrupamentos: ["servidor"],
    totais: { quantidade: "soma", empenhado: "soma" },
    ordenacao: { coluna: "saida", direcao: "asc" },
  }),
  modelo("emendas-autor", "Emendas por autor", "Valor, empenhado e livre de cada emenda, agrupadas pelo autor.", {
    fonte: "emendas",
    colunas: ["numero", "tipo", "objeto", "valor", "empenhado", "livre"],
    filtros: {},
    agrupamentos: ["autor"],
    totais: { valor: "soma", empenhado: "soma", livre: "soma" },
    ordenacao: { coluna: "numero", direcao: "asc" },
  }),
  modelo("convenios-vencendo", "Convênios que vencem em 90 dias", "Convênios federais com fim da vigência nos próximos 90 dias.", {
    fonte: "convenios_federais",
    colunas: ["numero", "orgao", "situacao", "fim", "dias_fim", "repasse", "global"],
    filtros: { dias_fim: { min: 0, max: 90 } },
    agrupamentos: [],
    totais: { repasse: "soma", global: "soma" },
    ordenacao: { coluna: "fim", direcao: "asc" },
  }),
];
