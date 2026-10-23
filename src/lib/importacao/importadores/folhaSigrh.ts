/**
 * IMPORTADOR: espelho da folha do SIGRH (PDF FPAG10, relatório analítico de conferência ou planilha analítica
 * por evento) → folha mensal fechada, com a ficha e as rubricas de cada servidor
 *
 * Para os meses pagos pelo SIGRH antes do uso do sistema: com a ficha de cada servidor, o contracheque e o informe
 * de rendimentos do ano saem do sistema. O leitor (folhaSigrhParser.ts) confere a soma com o total impresso; a RPC
 * `importar_folha_sigrh` acha o servidor pelo CPF, recusa a competência que já tem folha mensal, grava tudo ou
 * nada e fecha a folha (migração 20261022090000).
 */

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { lerLinhasPdf } from "../pdfTexto";
import { lerPrimeiraAba } from "../planilha";
import type { Importador, ResultadoBanco } from "../types";
import {
  COLUNAS_ANALITICA,
  ehPlanilhaAnalitica,
  formatarCentavos,
  interpretarAnaliticaSigrh,
  interpretarPdfSigrh,
  paraContratoFolhaSigrh,
  type LinhaFolhaSigrh,
} from "./folhaSigrhParser";

/** CPF na prévia só com os 3 primeiros e os 2 últimos dígitos */
const cpfMascarado = (cpf: string) => `${cpf.slice(0, 3)}.***.***-${cpf.slice(9)}`;

export const importadorFolhaSigrh: Importador<LinhaFolhaSigrh> = {
  id: "folha_sigrh",
  titulo: "Folha do SIGRH (espelho)",
  descricao: "Registra a folha mensal já paga pelo SIGRH, com a ficha e as rubricas de cada servidor, e a deixa fechada.",
  modulo: "rh",
  permissao: "financeiro.folha.processar",
  aceita: ".pdf,.xlsx,.xls",
  instrucoes:
    "Use o espelho definitivo do mês: o PDF FPAG10 (Folha Analítica por Funcionário), o relatório analítico de " +
    "conferência de folha ou a planilha analítica por evento (nesta, o mês e o ano vão no nome do arquivo). Um mês " +
    "por vez. O servidor é achado pelo CPF e precisa estar cadastrado; o mês que já tem folha no sistema não é " +
    "importado de novo.",
  colunas: [
    { id: "nome", rotulo: "Servidor", valor: (l) => l.nome },
    { id: "cpf", rotulo: "CPF", valor: (l) => cpfMascarado(l.cpf) },
    { id: "funcao", rotulo: "Cargo/função", valor: (l) => l.funcao },
    { id: "rubricas", rotulo: "Rubricas", valor: (l) => String(l.itens.length), alinhamento: "direita" },
    { id: "proventos", rotulo: "Proventos", valor: (l) => formatarCentavos(l.proventos), alinhamento: "direita" },
    { id: "descontos", rotulo: "Descontos", valor: (l) => formatarCentavos(l.descontos), alinhamento: "direita" },
    { id: "liquido", rotulo: "Líquido", valor: (l) => formatarCentavos(l.proventos - l.descontos), alinhamento: "direita" },
  ],
  identificarLinha: (l) => l.nome,

  async ler(arquivo) {
    if (/\.pdf$/i.test(arquivo.name) || arquivo.type === "application/pdf") {
      return interpretarPdfSigrh(await lerLinhasPdf(await arquivo.arrayBuffer()));
    }
    const planilha = await lerPrimeiraAba(arquivo);
    if (!ehPlanilhaAnalitica(planilha.cabecalhos)) {
      return {
        linhas: [],
        problemas: [
          {
            gravidade: "erro",
            mensagem: `Planilha não reconhecida: a analítica por evento do SIGRH tem as colunas ${COLUNAS_ANALITICA.join(", ")}.`,
          },
        ],
        cabecalho: {},
        parametros: {},
      };
    }
    return interpretarAnaliticaSigrh(
      planilha.linhas.map((l) => l.valores),
      arquivo.name,
      new Date().getFullYear(),
    );
  },

  async enviar(leitura, arquivo, simular) {
    const { data, error } = await supabase.rpc("importar_folha_sigrh", {
      p_competencia: { ano: Number(leitura.parametros.ano), mes: Number(leitura.parametros.mes) },
      p_fichas: leitura.linhas.map(paraContratoFolhaSigrh) as unknown as Json,
      p_arquivo: { nome: arquivo.nome, sha256: arquivo.sha256, tamanho: arquivo.tamanho },
      p_simular: simular,
    });
    if (error) throw error;
    return data as unknown as ResultadoBanco;
  },

  // Chaves de src/hooks/useFolhaPagamento.ts e src/hooks/useContracheque.ts
  invalidar: [["folhas-pagamento"], ["fichas-financeiras"], ["contracheques-rh"], ["meus-contracheques"]],
};
