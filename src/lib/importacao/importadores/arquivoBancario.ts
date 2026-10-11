/**
 * IMPORTADOR: arquivo do banco (OBN600 ou CNAB 240, remessa ou retorno) → fin_movimentos_bancarios
 *
 * Detecta o formato pela largura das linhas (350 = OBN600, 240 = CNAB 240) e o sentido pelo header.
 * A RPC `importar_arquivo_bancario` confere a permissão `pagamento.conciliar`, grava um movimento por
 * pagamento (idempotente pela chave origem + identificador + valor), atualiza a remessa quando chega o
 * retorno e concilia com `fin_pagamentos` (CPF/CNPJ + valor + data).
 */

import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/formatters";
import { lerCnab240, TAMANHO_LINHA_CNAB240 } from "@/lib/bancario/cnab240";
import {
  decodificarArquivoBancario,
  linhasDoArquivo,
  mascararDocumento,
  ROTULO_TIPO_LANCAMENTO,
  type LinhaMovimentoBancario,
  type ResultadoArquivoBancario,
} from "@/lib/bancario/comum";
import { dataBR, ROTULO_ORIGEM_ARQUIVO, ROTULO_SITUACAO_MOVIMENTO } from "@/lib/bancario/exibicao";
import { lerObn600, TAMANHO_LINHA_OBN600 } from "@/lib/bancario/obn600";
import type { Importador, ResultadoBanco, ResultadoLeitura } from "../types";


/** Lê o texto e decide o formato. Exportado para a tela e para conferência fora do importador. */
export function lerArquivoBancario(texto: string): ResultadoArquivoBancario | null {
  const primeira = linhasDoArquivo(texto)[0] ?? "";
  if (primeira.length === TAMANHO_LINHA_OBN600) return lerObn600(texto);
  if (primeira.length === TAMANHO_LINHA_CNAB240) return lerCnab240(texto);
  return null;
}

export const importadorArquivoBancario: Importador<LinhaMovimentoBancario> = {
  id: "arquivo_bancario",
  titulo: "Arquivo do banco (OBN600 / CNAB 240)",
  descricao:
    "Registra os pagamentos de remessas e retornos do banco e marca como pagos ou recusados os pagamentos do sistema.",
  modulo: "financeiro",
  permissao: "pagamento.conciliar",
  aceita: ".txt,.TXT,.ret,.RET,.rem,.REM",
  instrucoes:
    "Escolha a remessa ou o retorno de ordens bancárias (OBN600, 350 posições) ou um arquivo CNAB 240 " +
    "(folha ou Gestão MAX). O retorno atualiza a situação dos pagamentos da remessa; nada é apagado.",
  colunas: [
    { id: "tipo", rotulo: "Tipo", valor: (l) => ROTULO_TIPO_LANCAMENTO[l.tipo_lancamento] },
    { id: "identificador", rotulo: "OB / seu número", valor: (l) => l.identificador },
    { id: "favorecido", rotulo: "Favorecido", valor: (l) => l.favorecido_nome || "—" },
    { id: "documento", rotulo: "CPF/CNPJ", valor: (l) => mascararDocumento(l.favorecido_documento) },
    { id: "data", rotulo: "Data", valor: (l) => dataBR(l.data_pagamento) },
    { id: "valor", rotulo: "Valor", valor: (l) => formatCurrency(l.valor), alinhamento: "direita" },
    { id: "situacao", rotulo: "Situação", valor: (l) => ROTULO_SITUACAO_MOVIMENTO[l.situacao] },
    { id: "motivo", rotulo: "Motivo da recusa", valor: (l) => l.motivo_recusa ?? "" },
  ],
  rotulosCampos: {
    situacao: "Situação",
    codigo_retorno: "Código de retorno",
    motivo_recusa: "Motivo da recusa",
    pagamento_id: "Pagamento conciliado",
    data_pagamento: "Data",
    autenticacao: "Autenticação",
    codigo_barras: "Código de barras",
    banco: "Banco",
    agencia: "Agência",
    conta: "Conta",
  },

  async ler(arquivo): Promise<ResultadoLeitura<LinhaMovimentoBancario>> {
    const texto = decodificarArquivoBancario(await arquivo.arrayBuffer());
    const lido = lerArquivoBancario(texto);
    if (!lido) {
      return {
        linhas: [],
        problemas: [
          {
            gravidade: "erro",
            mensagem:
              "Formato não reconhecido: o arquivo precisa ter linhas de 350 posições (OBN600) ou 240 posições (CNAB 240).",
          },
        ],
        cabecalho: {},
        parametros: {},
      };
    }

    const problemas = [...lido.problemas];
    if (lido.linhas.length === 0 && !problemas.some((p) => p.gravidade === "erro")) {
      problemas.push({ gravidade: "aviso", mensagem: "O arquivo não traz pagamentos (só header e trailer)." });
    }

    const { cabecalho: c, totais } = lido;
    const rotulos: Record<string, string> = {
      Formato: lido.origem === "cnab240" && c.layout ? `${ROTULO_ORIGEM_ARQUIVO.cnab240} (leiaute ${c.layout})` : ROTULO_ORIGEM_ARQUIVO[lido.origem],
      Tipo: lido.sentido === "retorno" ? "Retorno" : "Remessa",
      Data: dataBR(c.dataArquivo),
      Pagamentos: String(totais.pagamentos),
      Total: formatCurrency(totais.somaCentavos / 100),
      "Confere com o trailer": totais.confere ? "sim" : "não",
    };
    if (c.sequencial !== null) rotulos["Sequencial"] = String(c.sequencial);

    return {
      linhas: lido.linhas,
      problemas,
      cabecalho: rotulos,
      parametros: {
        origem: lido.origem,
        sentido: lido.sentido,
        data_arquivo: c.dataArquivo,
        sequencial_arquivo: c.sequencial,
        convenio: c.convenio,
      },
    };
  },

  async enviar(leitura, arquivo, simular) {
    const { data, error } = await supabase.rpc("importar_arquivo_bancario" as never, {
      p_linhas: leitura.linhas,
      p_arquivo: { nome: arquivo.nome, sha256: arquivo.sha256, tamanho: arquivo.tamanho },
      p_parametros: leitura.parametros,
      p_simular: simular,
    } as never);
    if (error) throw error;
    return data as unknown as ResultadoBanco;
  },

  invalidar: [["fin_movimentos_bancarios"], ["fin_pagamentos"], ["fin_pagamentos_pendentes"]],
};
