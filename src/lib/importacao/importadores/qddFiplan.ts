/**
 * IMPORTADOR: QDD do FIPLAN (PDF) → fin_dotacoes
 *
 * Lê o PDF "Quadro de Detalhamento da Despesa - QDD" exportado do FIPLAN e
 * atualiza as dotações do exercício pela RPC `importar_qdd_fiplan`, que confere
 * a permissão `orcamento.importar` e grava tudo numa transação.
 */

import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/formatters";
import { lerLinhasPdf } from "../pdfTexto";
import type { Importador, ResultadoBanco } from "../types";
import { interpretarQddFiplan, type LinhaQdd } from "./qddFiplanParser";

const moeda = (v: number) => (v ? formatCurrency(v) : "—");

export const importadorQddFiplan: Importador<LinhaQdd> = {
  id: "qdd_fiplan",
  titulo: "QDD do FIPLAN",
  descricao: "Atualiza as dotações orçamentárias a partir do Quadro de Detalhamento da Despesa exportado do FIPLAN.",
  modulo: "financeiro",
  permissao: "orcamento.importar",
  aceita: "application/pdf,.pdf",
  instrucoes:
    "No FIPLAN, gere o relatório \"Quadro de Detalhamento da Despesa - QDD\" do exercício e salve em PDF. " +
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
    const linhas = await lerLinhasPdf(await arquivo.arrayBuffer());
    return interpretarQddFiplan(linhas);
  },

  async enviar(leitura, arquivo, simular) {
    // Atual e Disponível são colunas calculadas em fin_dotacoes: não vão para o banco.
    const linhas = leitura.linhas.map(({ valores, ...resto }) => {
      const { atual: _atual, disponivel: _disponivel, ...gravaveis } = valores;
      return { ...resto, valores: gravaveis };
    });
    const { data, error } = await supabase.rpc("importar_qdd_fiplan" as never, {
      p_exercicio: leitura.parametros.exercicio,
      p_linhas: linhas,
      p_arquivo: { nome: arquivo.nome, sha256: arquivo.sha256, tamanho: arquivo.tamanho },
      p_simular: simular,
    } as never);
    if (error) throw error;
    return data as unknown as ResultadoBanco;
  },

  invalidar: [["fin_dotacoes"], ["fin_resumo_orcamentario"]],
};
