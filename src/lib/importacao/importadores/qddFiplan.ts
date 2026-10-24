/**
 * IMPORTADOR: QDD do FIPLAN (PDF ou Excel) → fin_dotacoes
 *
 * Lê o "Quadro de Detalhamento da Despesa - QDD" exportado do FIPLAN (PDF ou o .xls em HTML) e
 * atualiza as dotações do exercício pela RPC `importar_qdd_fiplan`, que confere
 * a permissão `orcamento.importar` e grava tudo numa transação.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { formatCurrency } from "@/lib/formatters";
import { lerLinhasPdf } from "../pdfTexto";
import { decodificarHtml, linhasDaTabelaHtml, pareceTabelaHtml } from "../tabelaHtml";
import type { Importador, ResultadoBanco } from "../types";
import { interpretarQddFiplan, linhasQddDoExcel, type LinhaQdd } from "./qddFiplanParser";

const moeda = (v: number) => (v ? formatCurrency(v) : "—");

export const importadorQddFiplan: Importador<LinhaQdd> = {
  id: "qdd_fiplan",
  titulo: "QDD do FIPLAN",
  descricao: "Atualiza as dotações orçamentárias a partir do Quadro de Detalhamento da Despesa exportado do FIPLAN.",
  modulo: "financeiro",
  permissao: "orcamento.importar",
  aceita: "application/pdf,.pdf,.xls",
  instrucoes:
    "No FIPLAN, gere o relatório \"Quadro de Detalhamento da Despesa - QDD\" do exercício e salve em PDF ou em Excel. " +
    "Dotações que já existem são atualizadas; as novas são criadas. Nada é apagado.",
  colunas: [
    { id: "paoe", rotulo: "PAOE", valor: (l) => l.paoe_codigo },
    { id: "natureza", rotulo: "Natureza", valor: (l) => l.natureza },
    { id: "fonte", rotulo: "Fonte", valor: (l) => l.fonte },
    { id: "idu", rotulo: "IDU", valor: (l) => l.idu },
    { id: "inicial", rotulo: "Inicial", valor: (l) => moeda(l.valores.inicial), alinhamento: "direita" },
    { id: "atual", rotulo: "Atual", valor: (l) => moeda(l.valores.atual), alinhamento: "direita" },
    { id: "empenhado", rotulo: "Empenhado", valor: (l) => moeda(l.valores.empenhado), alinhamento: "direita" },
    { id: "pago", rotulo: "Pago", valor: (l) => moeda(l.valores.pago), alinhamento: "direita" },
  ],
  rotulosCampos: {
    valor_inicial: "Inicial",
    valor_suplementado: "Suplementado",
    valor_reduzido: "Anulado",
    valor_bloqueado: "Bloqueado",
    valor_reserva: "Reserva",
    valor_ped: "PED",
    valor_empenhado: "Empenhado",
    valor_liquidado: "Liquidado",
    valor_em_liquidacao: "Em liquidação",
    valor_pago: "Pago",
    valor_restos_pagar: "Restos a pagar",
    tro: "TRO",
    ativo: "Reativada",
    codigo_dotacao: "Código da dotação",
  },

  async ler(arquivo) {
    const dados = await arquivo.arrayBuffer();
    if (pareceTabelaHtml(dados)) {
      return interpretarQddFiplan(linhasQddDoExcel(linhasDaTabelaHtml(decodificarHtml(dados))));
    }
    if (/\.xlsx?$/i.test(arquivo.name)) {
      return {
        linhas: [],
        problemas: [
          { gravidade: "erro", mensagem: "Este Excel não é o que o FIPLAN exporta. Gere o QDD de novo no FIPLAN, em Excel ou em PDF." },
        ],
        cabecalho: {},
        parametros: {},
      };
    }
    return interpretarQddFiplan(await lerLinhasPdf(dados));
  },

  async enviar(leitura, arquivo, simular) {
    // Atual e Disponível são colunas calculadas em fin_dotacoes: não vão para o banco.
    const linhas = leitura.linhas.map(({ valores, ...resto }) => {
      const { atual: _atual, disponivel: _disponivel, ...gravaveis } = valores;
      return { ...resto, valores: gravaveis };
    });
    const { data, error } = await supabase.rpc("importar_qdd_fiplan", {
      p_exercicio: Number(leitura.parametros.exercicio),
      p_linhas: linhas as unknown as Json,
      p_arquivo: { nome: arquivo.nome, sha256: arquivo.sha256, tamanho: arquivo.tamanho },
      p_simular: simular,
    });
    if (error) throw error;
    return data as unknown as ResultadoBanco;
  },

  invalidar: [
    ["fin_dotacoes"],
    ["fin_resumo_orcamentario"],
    ["fin_fontes_recurso"],
    ["fin_naturezas_despesa"],
  ],
};
