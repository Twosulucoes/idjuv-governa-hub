/**
 * IMPORTADOR: FIP 002 – Demonstrativo de Diárias do FIPLAN → fin_diarias_fiplan
 *
 * Traz as diárias do exercício (empenho, liquidação, NOB, período da viagem e se o servidor prestou contas). A RPC
 * `importar_diarias_fiplan` confere o módulo `financeiro` e `financeiro.execucao.importar`, liga cada diária ao
 * servidor (pelo nome) e à viagem do RH (pela saída) e grava tudo numa transação; nada é apagado.
 * Spec: docs/superpowers/specs/2026-10-30-diarias-fiplan-design.md
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { formatCurrency } from "@/lib/formatters";
import { lerLinhasDasAbas } from "../planilha";
import { decodificarHtml, linhasDaTabelaHtml, pareceTabelaHtml } from "../tabelaHtml";
import type { Importador, ResultadoBanco } from "../types";
import { interpretarDiariasFiplan, paraContratoDiaria, type LinhaDiariaFiplan } from "./diariasFiplanParser";

const dataBR = (iso: string | null) => (iso ? iso.split("-").reverse().join("/") : "");

export const importadorDiariasFiplan: Importador<LinhaDiariaFiplan> = {
  id: "diarias_fiplan",
  titulo: "Diárias do FIPLAN (FIP 002)",
  descricao: "Traz as diárias pagas no exercício, com o período da viagem e se o servidor já prestou contas.",
  modulo: "financeiro",
  permissao: "financeiro.execucao.importar",
  local: { rota: "/financeiro/atualizar?importador=diarias_fiplan", caminho: "Financeiro → Atualizar dados" },
  aceita: ".xls,.xlsx",
  instrucoes:
    'No FIPLAN, abra o relatório "FIP 002 – Demonstrativo de Diárias" (Relatórios → Financeiro/Contábil → ' +
    'Operacionais → Despesa – Diárias/SDF, ou digite "FIP 002" na caixa Pesquise menu). Filtros: "Exercício igual a" ' +
    'o ano e "Código da Unidade Orçamentária igual a 17302.0001". Tipo de relatório: xls. Importe o arquivo do jeito ' +
    "que veio. Diária que já existe é atualizada (a prestação de contas muda de Não para Sim); nada é apagado.",
  colunas: [
    { id: "servidor", rotulo: "Servidor", valor: (l) => l.credor_nome },
    { id: "periodo", rotulo: "Viagem", valor: (l) => `${dataBR(l.data_saida)} a ${dataBR(l.data_retorno)}` },
    { id: "qtd", rotulo: "Diárias", valor: (l) => l.quantidade.toLocaleString("pt-BR"), alinhamento: "direita" },
    { id: "valor", rotulo: "Valor", valor: (l) => formatCurrency(l.valor_empenhado), alinhamento: "direita" },
    { id: "pagamento", rotulo: "Pago em", valor: (l) => dataBR(l.data_pagamento) },
    { id: "pc", rotulo: "Prestou contas", valor: (l) => (l.prestou_contas ? "Sim" : "Não") },
  ],
  rotulosCampos: {
    credor_codigo: "Código do credor",
    credor_nome: "Servidor (FIPLAN)",
    servidor_id: "Servidor no cadastro",
    viagem_id: "Viagem do RH",
    quantidade: "Quantidade de diárias",
    processo_fiplan: "Processo no FIPLAN",
    data_empenho: "Data do empenho",
    valor_empenhado: "Valor",
    liquidacao_numero: "Liquidação",
    valor_liquidado: "Valor liquidado",
    nob_numero: "NOB",
    data_pagamento: "Data do pagamento",
    data_saida: "Saída",
    data_retorno: "Retorno",
    ordem_servico: "Ordem de serviço",
    prestou_contas: "Prestou contas",
  },
  identificarLinha: (l) => `Linha ${l.linhaPlanilha} (${l.credor_nome}, empenho ${l.empenho_numero.slice(-6)})`,

  async ler(arquivo) {
    const dados = await arquivo.arrayBuffer();
    if (pareceTabelaHtml(dados)) {
      // O xls do FIPLAN é uma tabela HTML: monta as linhas pela coluna de cada célula
      const linhas = linhasDaTabelaHtml(decodificarHtml(dados)).map((celulas) => {
        const linha: string[] = [];
        for (const c of celulas) linha[c.coluna] = c.texto;
        return Array.from(linha, (t) => t ?? "");
      });
      return interpretarDiariasFiplan(linhas);
    }
    return interpretarDiariasFiplan(await lerLinhasDasAbas(new Blob([dados])));
  },

  async enviar(leitura, arquivo, simular) {
    const { data, error } = await supabase.rpc("importar_diarias_fiplan", {
      p_exercicio: Number(leitura.parametros.exercicio),
      p_linhas: leitura.linhas.map(paraContratoDiaria) as unknown as Json,
      p_arquivo: { nome: arquivo.nome, sha256: arquivo.sha256, tamanho: arquivo.tamanho },
      p_simular: simular,
    });
    if (error) throw error;
    return data as unknown as ResultadoBanco;
  },

  // Chaves de src/hooks/useDiariasFiplan.ts
  invalidar: [["diarias-fiplan"], ["diarias-fiplan-viagens"]],
};
