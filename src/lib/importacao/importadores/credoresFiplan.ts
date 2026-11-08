/**
 * IMPORTADOR: "Consultar Credor" do FIPLAN → fin_credores_servidores (código do credor → servidor)
 *
 * O FIP 002 (diárias) traz o código do credor de cada servidor, mas o cadastro do RH não guarda esse código; a ligação
 * era só pelo nome. Este relatório traz o código e o CPF de cada credor do Estado. Na leitura, a tela pergunta ao banco
 * (`fin_credores_cpfs_de_servidores`, em lotes) quais CPFs são de servidor e fica só com eles: a conferência mostra os
 * servidores do órgão, não o cadastro estadual inteiro, e nenhum CPF de terceiro vai para o banco. A RPC
 * `importar_credores_fiplan` grava a ligação e liga ao servidor as diárias que estavam sem ele.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { lerLinhasDasAbas } from "../planilha";
import { decodificarHtml, linhasDaTabelaHtml, pareceTabelaHtml } from "../tabelaHtml";
import type { Importador, ResultadoBanco, ResultadoLeitura } from "../types";
import {
  interpretarCredoresFiplan,
  mascararCpf,
  paraContratoCredor,
  type LinhaCredorFiplan,
} from "./credoresFiplanParser";

/** CPFs por chamada ao banco (a RPC aceita até 10000) */
const LOTE_CPFS = 5000;

/** Fica só com os credores que são servidores (o banco diz quais CPFs estão no cadastro). */
async function soServidores(leitura: ResultadoLeitura<LinhaCredorFiplan>): Promise<ResultadoLeitura<LinhaCredorFiplan>> {
  if (leitura.linhas.length === 0) return leitura;
  const encontrados = new Set<string>();
  for (let i = 0; i < leitura.linhas.length; i += LOTE_CPFS) {
    const lote = leitura.linhas.slice(i, i + LOTE_CPFS).map((l) => l.cpf);
    const { data, error } = await supabase.rpc("fin_credores_cpfs_de_servidores", { p_cpfs: lote });
    if (error) throw error;
    for (const cpf of (data as string[] | null) ?? []) encontrados.add(cpf);
  }
  const linhas = leitura.linhas.filter((l) => encontrados.has(l.cpf)).map((l, indice) => ({ ...l, indice }));
  return {
    ...leitura,
    linhas,
    problemas:
      linhas.length === 0
        ? [...leitura.problemas, { gravidade: "erro", mensagem: "Nenhum CPF do relatório é de servidor cadastrado no RH." }]
        : leitura.problemas,
    cabecalho: { ...leitura.cabecalho, "Servidores do órgão": String(linhas.length) },
  };
}

export const importadorCredoresFiplan: Importador<LinhaCredorFiplan> = {
  id: "credores_fiplan",
  titulo: "Credores do FIPLAN (Consultar Credor)",
  descricao: "Liga o código do credor de cada servidor ao cadastro do RH pelo CPF, para as diárias acharem o servidor.",
  modulo: "financeiro",
  permissao: "financeiro.execucao.importar",
  local: { rota: "/financeiro/atualizar?importador=credores_fiplan", caminho: "Financeiro → Atualizar dados" },
  aceita: ".xls,.xlsx",
  instrucoes:
    'No FIPLAN, digite "Consultar Credor" na caixa Pesquise menu. Se a consulta deixar, filtre "Tipo de cadastro" igual ' +
    "a Pessoa Física (sem filtro também funciona, só demora mais). Exporte em xls e importe o arquivo do jeito que " +
    "veio, com todas as abas. Só os servidores do cadastro do RH " +
    "entram; empresas e outras pessoas ficam de fora. Importe de novo quando entrar servidor novo.",
  colunas: [
    { id: "codigo", rotulo: "Código do credor", valor: (l) => l.credor_codigo },
    { id: "nome", rotulo: "Nome no FIPLAN", valor: (l) => l.credor_nome },
    { id: "cpf", rotulo: "CPF", valor: (l) => mascararCpf(l.cpf) },
  ],
  rotulosCampos: {
    servidor_id: "Servidor no cadastro",
    credor_nome: "Nome no FIPLAN",
  },
  identificarLinha: (l) => `Linha ${l.linhaPlanilha} (credor ${l.credor_codigo})`,

  async ler(arquivo) {
    const dados = await arquivo.arrayBuffer();
    let linhas: unknown[][];
    if (pareceTabelaHtml(dados)) {
      // O xls do FIPLAN pode vir como tabela HTML: monta as linhas pela coluna de cada célula
      linhas = linhasDaTabelaHtml(decodificarHtml(dados)).map((celulas) => {
        const linha: string[] = [];
        for (const c of celulas) linha[c.coluna] = c.texto;
        return Array.from(linha, (t) => t ?? "");
      });
    } else {
      linhas = await lerLinhasDasAbas(new Blob([dados]));
    }
    return soServidores(interpretarCredoresFiplan(linhas));
  },

  async enviar(leitura, arquivo, simular) {
    const { data, error } = await supabase.rpc("importar_credores_fiplan", {
      p_linhas: leitura.linhas.map(paraContratoCredor) as unknown as Json,
      p_arquivo: { nome: arquivo.nome, sha256: arquivo.sha256, tamanho: arquivo.tamanho },
      p_simular: simular,
    });
    if (error) throw error;
    return data as unknown as ResultadoBanco;
  },

  // Chaves de src/hooks/useDiariasFiplan.ts: as diárias ligadas ao servidor aparecem na hora
  invalidar: [["diarias-fiplan"], ["diarias-fiplan-viagens"]],
};
