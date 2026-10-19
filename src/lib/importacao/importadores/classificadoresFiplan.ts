/**
 * IMPORTADOR: tabelas de classificação do FIPLAN (planilha "Consultar ...") → fin_classificadores_fiplan
 *
 * Aceita as consultas de Função, Programa, Elemento, Subelemento, Fonte de Recurso e Finalidade de Pagamento,
 * reconhecidas pelo título. A RPC `importar_classificadores_fiplan` confere a permissão `orcamento.importar`,
 * grava tudo numa transação e corrige os nomes de fontes, programas e naturezas que já existem. Nada é apagado.
 * Spec: docs/superpowers/specs/2026-10-19-classificadores-fiplan-design.md
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { lerLinhasDasAbas } from "../planilha";
import type { Importador, ResultadoBanco } from "../types";
import { interpretarClassificadoresFiplan, TABELAS_FIPLAN, type LinhaClassificador } from "./classificadoresFiplanParser";

const tabelas = Object.values(TABELAS_FIPLAN).map((t) => t.titulo).join(", ");

export const importadorClassificadoresFiplan: Importador<LinhaClassificador> = {
  id: "classificadores_fiplan",
  titulo: "Tabelas do FIPLAN",
  descricao: "Atualiza as tabelas de classificação da despesa (fontes, elementos, programas…) a partir das consultas do FIPLAN.",
  modulo: "financeiro",
  permissao: "orcamento.importar",
  aceita: ".xls,.xlsx",
  instrucoes:
    `No FIPLAN, abra a consulta (${tabelas}), filtre o exercício e exporte em Excel. Uma tabela por arquivo. ` +
    "Os nomes de fontes, programas e naturezas que já existem no sistema são corrigidos; nada é apagado.",
  colunas: [
    { id: "codigo", rotulo: "Código", valor: (l) => l.codigo },
    { id: "nome", rotulo: "Nome", valor: (l) => (l.nome.length > 70 ? `${l.nome.slice(0, 70)}…` : l.nome) },
    { id: "situacao", rotulo: "Situação", valor: (l) => (l.ativo ? "Ativo" : "Inativo") },
  ],
  rotulosCampos: {
    nome: "Nome",
    nome_resumido: "Nome resumido",
    ativo: "Ativo",
    atributos: "Outras colunas",
    cadastros: "Nome no cadastro do sistema",
  },
  identificarLinha: (l) => `Código ${l.codigo}`,

  async ler(arquivo) {
    return interpretarClassificadoresFiplan(await lerLinhasDasAbas(arquivo));
  },

  async enviar(leitura, arquivo, simular) {
    const { data, error } = await supabase.rpc("importar_classificadores_fiplan", {
      p_tipo: String(leitura.parametros.tipo),
      p_exercicio: Number(leitura.parametros.exercicio),
      p_linhas: leitura.linhas as unknown as Json,
      p_arquivo: { nome: arquivo.nome, sha256: arquivo.sha256, tamanho: arquivo.tamanho },
      p_simular: simular,
    });
    if (error) throw error;
    return data as unknown as ResultadoBanco;
  },

  // Chaves de src/hooks/useFinanceiro.ts (programas não têm consulta própria; aparecem nas dotações)
  invalidar: [["fin_fontes_recurso"], ["fin_naturezas_despesa"], ["fin_dotacoes"]],
};
