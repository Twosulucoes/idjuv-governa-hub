/**
 * IMPORTADOR: relatório "Consultar Pedido de Empenho da Despesa (PED)" do FIPLAN → fin_peds
 *
 * Traz os PEDs do exercício (autorizados, empenhados e estornados). A RPC `importar_peds_fiplan` confere o módulo
 * `financeiro` e a permissão `orcamento.importar`, liga cada PED à dotação do QDD pelo IDU e grava tudo numa
 * transação; nada é apagado. Os processos de contratação usam os PEDs para a fase financeira e o saldo livre.
 * Spec: docs/superpowers/specs/2026-10-23-compras-processos-reserva-natureza-design.md (§10)
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { formatCurrency } from "@/lib/formatters";
import { lerLinhasDasAbas } from "../planilha";
import { decodificarHtml, linhasDaTabelaHtml, pareceTabelaHtml } from "../tabelaHtml";
import type { Importador, ResultadoBanco } from "../types";
import { interpretarPedsFiplan, paraContratoPed, type LinhaPedFiplan } from "./pedsFiplanParser";

/** "17302.0001.26.00132-8" → "26.00132-8" (a UG se repete em todos) */
const curto = (numero: string | null) => (numero ? numero.split(".").slice(2).join(".") : "");

export const importadorPedsFiplan: Importador<LinhaPedFiplan> = {
  id: "peds_fiplan",
  titulo: "PEDs do FIPLAN (Consultar PED)",
  descricao: "Traz os pedidos de empenho do exercício, com processo, dotação e situação, para ligar cada PED ao processo de contratação.",
  modulo: "financeiro",
  permissao: "financeiro.execucao.importar",
  local: { rota: "/financeiro/atualizar?importador=peds_fiplan", caminho: "Financeiro → Atualizar dados" },
  aceita: ".xls,.xlsx",
  instrucoes:
    'No FIPLAN, abra "Consultar Pedido de Empenho da Despesa (PED)", filtre pelo exercício e pela unidade ' +
    "orçamentária, e exporte em Excel. Importe o QDD do mesmo exercício antes, para os PEDs ligarem à dotação. " +
    "PED que já existe é atualizado (a situação muda quando ele é empenhado ou estornado); nada é apagado.",
  colunas: [
    { id: "ped", rotulo: "PED", valor: (l) => curto(l.numero) },
    { id: "processo", rotulo: "Processo", valor: (l) => l.processo_sei ?? "" },
    { id: "situacao", rotulo: "Situação", valor: (l) => l.situacao.replace(/^Pedido \(PED\) /, "") },
    { id: "empenho", rotulo: "Empenho", valor: (l) => curto(l.empenho_numero) },
    { id: "valor", rotulo: "Valor", valor: (l) => formatCurrency(l.valor), alinhamento: "direita" },
  ],
  rotulosCampos: {
    empenho_numero: "Empenho",
    processo_fiplan: "Processo no FIPLAN",
    processo_sei: "Processo SEI",
    valor: "Valor",
    situacao: "Situação",
    estorno: "Documento de estorno",
    data_solicitacao: "Data da solicitação",
    data_criacao: "Data de criação",
    data_autorizacao: "Data da autorização",
    tipo_empenho: "Tipo de empenho",
    dotacao_fiplan: "Dotação no FIPLAN",
    dotacao_id: "Dotação do QDD",
    licitacao: "Licitação",
    historico: "Histórico",
    credor_codigo: "Código do credor",
    credor_nome: "Credor",
  },
  identificarLinha: (l) => `Linha ${l.linhaPlanilha} (PED ${curto(l.numero)})`,

  async ler(arquivo) {
    const dados = await arquivo.arrayBuffer();
    if (pareceTabelaHtml(dados)) {
      // Algumas consultas do FIPLAN saem como tabela HTML: monta as linhas pela coluna de cada célula
      const linhas = linhasDaTabelaHtml(decodificarHtml(dados)).map((celulas) => {
        const linha: string[] = [];
        for (const c of celulas) linha[c.coluna] = c.texto;
        return Array.from(linha, (t) => t ?? "");
      });
      return interpretarPedsFiplan(linhas);
    }
    return interpretarPedsFiplan(await lerLinhasDasAbas(new Blob([dados])));
  },

  async enviar(leitura, arquivo, simular) {
    const { data, error } = await supabase.rpc("importar_peds_fiplan", {
      p_exercicio: Number(leitura.parametros.exercicio),
      p_linhas: leitura.linhas.map(paraContratoPed) as unknown as Json,
      p_arquivo: { nome: arquivo.nome, sha256: arquivo.sha256, tamanho: arquivo.tamanho },
      p_simular: simular,
    });
    if (error) throw error;
    return data as unknown as ResultadoBanco;
  },

  // Chaves de src/hooks/useProcessosContratacao.ts (fase financeira e saldo dependem dos PEDs)
  invalidar: [["processos-financeiro"], ["processo-peds"], ["processo-reservas"], ["programacao-natureza"]],
};
