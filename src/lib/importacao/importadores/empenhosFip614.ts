/**
 * IMPORTADOR: FIP 614 – Situação de Empenho (PDF do FIPLAN) → fin_empenhos (origem FIPLAN)
 *
 * Lê o PDF do FIP 614 e cria ou atualiza os empenhos do exercício pela RPC `importar_empenhos_fip614`,
 * que confere a permissão `orcamento.importar` e grava tudo numa transação: o empenho com os totais do
 * relatório e o histórico de LIQ, NOB, GCV e estornos. Não mexe na dotação (os valores dela vêm do QDD).
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { formatCurrency } from "@/lib/formatters";
import { lerLinhasPdf } from "../pdfTexto";
import type { Importador, ResultadoBanco } from "../types";
import { interpretarEmpenhosFip614, type LinhaEmpenhoFip614 } from "./empenhosFip614Parser";

const moeda = (v: number) => formatCurrency(v);
/** "17302.0001.26.00051-8" → "26.00051-8" (a UG se repete em todos) */
const curto = (numero: string) => numero.split(".").slice(2).join(".");

export const importadorEmpenhosFip614: Importador<LinhaEmpenhoFip614> = {
  id: "empenhos_fip614",
  titulo: "Empenhos do FIPLAN (FIP 614)",
  descricao: "Traz os empenhos do exercício, com liquidações, NOBs e estornos, do relatório FIP 614 – Situação de Empenho.",
  modulo: "financeiro",
  permissao: "orcamento.importar",
  aceita: "application/pdf,.pdf",
  instrucoes:
    "No FIPLAN, gere o relatório \"FIP 614 - Situação de Empenho\" do exercício e salve em PDF. Importe o QDD do " +
    "mesmo exercício antes, para os empenhos ligarem à dotação. Empenhos que já existem são atualizados; nada é apagado.",
  colunas: [
    { id: "emp", rotulo: "Empenho", valor: (l) => curto(l.numero) },
    { id: "processo", rotulo: "Processo", valor: (l) => l.processo_sei },
    { id: "credor", rotulo: "Credor", valor: (l) => l.credor_nome },
    { id: "empenhado", rotulo: "Empenhado", valor: (l) => moeda(l.totais.emp), alinhamento: "direita" },
    { id: "liquidado", rotulo: "Liquidado", valor: (l) => moeda(l.totais.liq), alinhamento: "direita" },
    { id: "pago", rotulo: "Pago", valor: (l) => moeda(l.totais.nob), alinhamento: "direita" },
    { id: "saldo", rotulo: "Saldo a liquidar", valor: (l) => moeda(l.totais.saldo_liquidar), alinhamento: "direita" },
  ],
  rotulosCampos: {
    data_empenho: "Data",
    dotacao_id: "Dotação",
    fornecedor_id: "Favorecido",
    natureza_despesa_id: "Natureza",
    fonte_recurso_id: "Fonte",
    valor_empenhado: "Empenhado",
    valor_anulado: "Estornado",
    valor_liquidado: "Liquidado",
    valor_pago: "Pago",
    status: "Situação",
    objeto: "Objeto",
    processo_sei: "Processo SEI",
    processo_fiplan: "Processo no FIPLAN",
    observacoes: "Convênio",
    credor_codigo_fiplan: "Código do credor",
    credor_nome: "Credor",
    ped_numero: "PED",
    ped_data: "Data do PED",
    dotacao_fiplan: "Dotação no FIPLAN",
    documentos: "Documentos (antes → depois)",
  },
  identificarLinha: (l) => `EMP ${curto(l.numero)}`,

  async ler(arquivo) {
    const linhas = await lerLinhasPdf(await arquivo.arrayBuffer());
    return interpretarEmpenhosFip614(linhas);
  },

  async enviar(leitura, arquivo, simular) {
    const { data, error } = await supabase.rpc("importar_empenhos_fip614", {
      p_exercicio: Number(leitura.parametros.exercicio),
      p_linhas: leitura.linhas as unknown as Json,
      p_arquivo: { nome: arquivo.nome, sha256: arquivo.sha256, tamanho: arquivo.tamanho },
      p_data_referencia: (leitura.parametros.data_referencia as string | null) ?? undefined,
      p_simular: simular,
    });
    if (error) throw error;
    return data as unknown as ResultadoBanco;
  },

  invalidar: [["fin_empenhos"], ["fin_empenho"], ["fin_empenho_documentos_fiplan"]],
};
