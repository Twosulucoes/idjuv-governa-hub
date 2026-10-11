/**
 * Leitor de CNAB 240 de pagamentos (padrão FEBRABAN 240): remessas da folha geradas pelo sistema estadual de
 * pessoal (header 030 / lote 020), do BB Gestão MAX (header 050 / lote 031) e os retornos do banco.
 *
 * Registros (tipo na posição 008):
 *   0 header de arquivo · 1 header de lote · 3 detalhe (segmento na 014: A crédito, B favorecido) ·
 *   5 trailer de lote · 9 trailer de arquivo
 *
 * Uma `LinhaMovimentoBancario` por segmento A; o segmento B seguinte traz o CPF/CNPJ do favorecido.
 * Posições do padrão FEBRABAN, confirmadas nos arquivos reais; o que é específico do BB ou deduzido está
 * marcado "conferir no manual".
 */

import type { ProblemaLeitura } from "@/lib/importacao/types";
import {
  apenasDigitos,
  campo,
  centavosParaReais,
  dataDDMMAAAA,
  formatarAgencia,
  formatarConta,
  inteiro,
  linhasDoArquivo,
  type LinhaMovimentoBancario,
  type ResultadoArquivoBancario,
  type SentidoArquivoBancario,
  type TipoLancamentoBancario,
} from "./comum";

export const TAMANHO_LINHA_CNAB240 = 240;

/*
 * HEADER DE ARQUIVO (0)
 *   001-003 banco · 004-007 '0000' · 008 '0' · 009-017 brancos
 *   018 tipo de inscrição · 019-032 CNPJ do pagador
 *   033-052 convênio (BB: 033-041 convênio com 9 dígitos, 042-045 produto '0126', 046-052 brancos/'TS')
 *   053-057 agência · 058 DV · 059-070 conta · 071 DV · 072 DV agência/conta
 *   073-102 nome do pagador · 103-132 nome do banco · 133-142 brancos
 *   143 '1' remessa / '2' retorno · 144-151 data · 152-157 hora · 158-163 NSA · 164-166 versão do leiaute
 *
 * HEADER DE LOTE (1)
 *   009 operação 'C' · 010-011 serviço (30 salários, 98 diversos) · 012-013 forma (01 crédito em conta BB,
 *   03 DOC, 41 TED) · 014-016 versão do leiaute do lote
 *
 * SEGMENTO A (3/A)
 *   009-013 nº do registro no lote · 015 tipo de movimento · 016-017 instrução
 *   018-020 câmara (000 BB, 700 DOC, 018 TED) · 021-023 banco do favorecido
 *   024-028 agência · 029 DV · 030-041 conta · 042 DV · 043 DV agência/conta
 *   044-073 nome do favorecido · 074-093 seu número · 094-101 data do pagamento
 *   102-104 moeda · 120-134 valor (15, centavos)
 *   135-154 nosso número (retorno) · 155-162 data real (retorno) · 163-177 valor real (retorno)
 *   231-240 ocorrências (retorno: códigos de 2 posições)
 *
 * SEGMENTO B (3/B)
 *   018 tipo de inscrição (1 CPF, 2 CNPJ) · 019-032 CPF/CNPJ do favorecido
 *
 * TRAILER DE LOTE (5): 018-023 quantidade de registros do lote · 024-041 soma dos valores (18, centavos)
 * TRAILER DE ARQUIVO (9): 018-023 quantidade de lotes · 024-029 quantidade de registros do arquivo
 * As remessas do sistema de pessoal (leiaute 030/020) contam o par A+B como um registro só e repetem o nº do
 * registro no segmento B; as duas contagens são aceitas.
 */

/** Ocorrências do retorno (FEBRABAN, nota G059). Lista parcial dos códigos mais comuns — conferir no manual. */
export const OCORRENCIAS_CNAB240: Record<string, string> = {
  "00": "Crédito ou débito efetivado",
  "01": "Insuficiência de fundos",
  "02": "Crédito ou débito cancelado pelo pagador/credor",
  "03": "Débito autorizado pela agência - efetuado",
  AA: "Controle inválido",
  AB: "Tipo de operação inválido",
  AC: "Tipo de serviço inválido",
  AD: "Forma de lançamento inválida",
  AE: "Tipo/número de inscrição inválido",
  AF: "Código de convênio inválido",
  AG: "Agência/conta corrente/DV inválido",
  AH: "Nº sequencial do registro no lote inválido",
  AI: "Código de segmento de detalhe inválido",
  AJ: "Tipo de movimento inválido",
  AK: "Código da câmara de compensação do favorecido inválido",
  AL: "Código do banco do favorecido inválido",
  AM: "Agência mantenedora da conta do favorecido inválida",
  AN: "Conta corrente/DV do favorecido inválido",
  AO: "Nome do favorecido não informado",
  AP: "Data do lançamento inválida",
  AR: "Valor do lançamento inválido",
  AS: "Aviso ao favorecido: identificação inválida",
  AT: "Tipo/número de inscrição do favorecido inválido",
  BD: "Inclusão efetuada com sucesso (pagamento agendado)",
  HA: "Lote não aceito",
  HB: "Inscrição da empresa inválida para o contrato",
  HC: "Convênio com a empresa inexistente/inválido para o contrato",
  HD: "Agência/conta corrente da empresa inexistente/inválido para o contrato",
  HE: "Tipo de serviço inválido para o contrato",
  HF: "Conta corrente da empresa com saldo insuficiente",
  HG: "Lote de serviço fora de sequência",
  HH: "Lote de serviço inválido",
  TA: "Lote não aceito - totais do lote com diferença",
  ZA: "Agência/conta do favorecido substituída",
  ZI: "Beneficiário divergente",
};

/** Ocorrências que não são recusa: o pagamento foi aceito e ainda não foi efetivado. Conferir no manual. */
const OCORRENCIAS_PENDENTES = new Set(["BD"]);

function tipoLancamento(servico: string, forma: string, banco: string): TipoLancamentoBancario {
  if (servico === "30") return "salario";
  if (forma === "01" || banco === "001") return "credito_bb";
  if (forma === "03" || forma === "41" || forma === "43") return "credito_outro_banco";
  return "outro";
}

/** Convênio BB a partir de 033-052: "000" + convênio(6) + "0126" vira o convênio sem zeros à esquerda. */
function convenioDoHeader(bruto: string): string | null {
  if (/^\d{9}0126/.test(bruto)) return bruto.slice(0, 9).replace(/^0+/, "") || null;
  return apenasDigitos(bruto).replace(/^0+/, "") || null;
}

interface LoteEmLeitura {
  servico: string;
  forma: string;
  registros: number;
  /** Segmentos B do lote: o sistema de pessoal conta o par A+B como um registro só nos trailers */
  segmentosB: number;
  somaCentavos: number;
}

export function lerCnab240(texto: string): ResultadoArquivoBancario {
  const linhas = linhasDoArquivo(texto);
  const problemas: ProblemaLeitura[] = [];
  const saida: LinhaMovimentoBancario[] = [];

  const header = linhas[0];
  if (!header || campo(header, 8, 8) !== "0") {
    problemas.push({ gravidade: "erro", mensagem: "O arquivo não começa com o header CNAB 240 (registro 0)." });
  }
  const tamanhosErrados = linhas.filter((l) => l.length !== TAMANHO_LINHA_CNAB240).length;
  if (tamanhosErrados) {
    problemas.push({
      gravidade: "erro",
      mensagem: `${tamanhosErrados} linha(s) com tamanho diferente de ${TAMANHO_LINHA_CNAB240} posições.`,
    });
  }

  const codigoArquivo = header ? campo(header, 143, 143) : "";
  const sentido: SentidoArquivoBancario = codigoArquivo === "2" ? "retorno" : "remessa";
  const dataArquivo = header ? dataDDMMAAAA(campo(header, 144, 151)) : null;
  const sequencial = header ? inteiro(campo(header, 158, 163)) : null;
  const layout = header ? campo(header, 164, 166).trim() || null : null;
  const convenio = header ? convenioDoHeader(campo(header, 33, 52)) : null;

  let lote: LoteEmLeitura | null = null;
  let ultimoA: LinhaMovimentoBancario | null = null;
  let somaArquivo = 0;
  let somaTrailers = 0;
  let temTrailerLote = false;
  let trailerArquivo: string | null = null;
  let qtdLotes = 0;
  let totalSegmentosB = 0;
  let datasInvalidas = 0;
  let totaisOk = true;

  linhas.forEach((l, i) => {
    const tipo = campo(l, 8, 8);
    if (tipo === "0") return;
    if (tipo === "9") {
      trailerArquivo = l;
      return;
    }
    if (tipo === "1") {
      qtdLotes += 1;
      lote = { servico: campo(l, 10, 11), forma: campo(l, 12, 13), registros: 1, segmentosB: 0, somaCentavos: 0 };
      ultimoA = null;
      return;
    }
    const lt = lote as LoteEmLeitura | null;
    if (!lt) {
      problemas.push({ gravidade: "erro", mensagem: `Registro ${i + 1} fora de um lote.` });
      return;
    }
    if (tipo === "5") {
      lt.registros += 1;
      temTrailerLote = true;
      const qtd = inteiro(campo(l, 18, 23));
      const soma = inteiro(campo(l, 24, 41));
      somaTrailers += soma ?? 0;
      totalSegmentosB += lt.segmentosB;
      const qtdOk = qtd === lt.registros || qtd === lt.registros - lt.segmentosB;
      if (!qtdOk || soma !== lt.somaCentavos) {
        totaisOk = false;
        problemas.push({
          gravidade: "erro",
          mensagem: `Lote ${campo(l, 4, 7)}: quantidade ou soma do trailer não confere com os registros.`,
        });
      }
      lote = null;
      return;
    }
    if (tipo !== "3") {
      problemas.push({ gravidade: "aviso", mensagem: `Registro ${i + 1}: tipo "${tipo}" ignorado.` });
      return;
    }

    lt.registros += 1;
    const segmento = campo(l, 14, 14);
    if (segmento === "A") {
      const valorCentavos = inteiro(campo(l, 120, 134));
      lt.somaCentavos += valorCentavos ?? 0;
      somaArquivo += valorCentavos ?? 0;
      const banco = campo(l, 21, 23);
      const dataPrevista = dataDDMMAAAA(campo(l, 94, 101));
      const dataReal = sentido === "retorno" ? dataDDMMAAAA(campo(l, 155, 162)) : null;
      if (!dataPrevista && !dataReal) datasInvalidas += 1;
      if (valorCentavos === null) {
        problemas.push({ gravidade: "erro", mensagem: `Registro ${i + 1}: valor inválido.`, linha: saida.length });
      }

      let situacao: LinhaMovimentoBancario["situacao"] = "enviado";
      let codigoRetorno: string | null = null;
      let motivo: string | null = null;
      if (sentido === "retorno") {
        const ocorrencias = (campo(l, 231, 240).match(/.{1,2}/g) ?? []).map((c) => c.trim()).filter(Boolean);
        codigoRetorno = ocorrencias.join(" ") || null;
        if (ocorrencias.includes("00")) situacao = "pago";
        else if (ocorrencias.length && !ocorrencias.every((c) => OCORRENCIAS_PENDENTES.has(c))) {
          situacao = "recusado";
          motivo = ocorrencias.map((c) => OCORRENCIAS_CNAB240[c] ?? `Ocorrência ${c}`).join("; ");
        }
      }

      const seuNumero = campo(l, 74, 93).trim();
      ultimoA = {
        origem: "cnab240",
        sentido,
        tipo_lancamento: tipoLancamento(lt.servico, lt.forma, banco),
        identificador: /^\d+$/.test(seuNumero) ? seuNumero.replace(/^0+(?=\d)/, "") : seuNumero,
        favorecido_nome: campo(l, 44, 73).trim(),
        favorecido_documento: "",
        banco,
        agencia: formatarAgencia(campo(l, 24, 28), campo(l, 29, 29)),
        conta: formatarConta(campo(l, 30, 41), campo(l, 42, 42)),
        valor: centavosParaReais(valorCentavos ?? 0),
        // Data prevista primeiro: a chave do movimento (RPC) inclui a data e precisa bater entre remessa e retorno
        data_pagamento: dataPrevista ?? dataReal,
        codigo_barras: null,
        autenticacao: sentido === "retorno" ? campo(l, 135, 154).trim() || null : null,
        situacao,
        codigo_retorno: codigoRetorno,
        motivo_recusa: motivo,
      };
      saida.push(ultimoA);
      return;
    }
    if (segmento === "B") {
      lt.segmentosB += 1;
      const a = ultimoA as LinhaMovimentoBancario | null;
      if (!a) {
        problemas.push({ gravidade: "aviso", mensagem: `Registro ${i + 1}: segmento B sem segmento A antes.` });
        return;
      }
      const tipoInscricao = campo(l, 18, 18);
      const doc = apenasDigitos(campo(l, 19, 32));
      a.favorecido_documento = tipoInscricao === "1" ? doc.slice(-11) : tipoInscricao === "2" ? doc.slice(-14) : doc;
      ultimoA = null;
      return;
    }
    // Outros segmentos (J, O, N, C…) não são lidos por este importador
    problemas.push({ gravidade: "aviso", mensagem: `Registro ${i + 1}: segmento "${segmento}" ignorado.` });
  });

  // Sem seu número (remessas da folha vêm em branco): CPF/CNPJ + data identificam o crédito
  for (const linha of saida) {
    if (!linha.identificador) {
      const data = (linha.data_pagamento ?? dataArquivo ?? "").replace(/-/g, "");
      linha.identificador = `doc:${linha.favorecido_documento}:${data}`;
    }
  }

  if (datasInvalidas) {
    problemas.push({
      gravidade: "aviso",
      mensagem: `${datasInvalidas} crédito(s) com data de pagamento inválida no arquivo; ficam sem data.`,
    });
  }
  if (lote) {
    totaisOk = false;
    problemas.push({ gravidade: "erro", mensagem: "Lote sem trailer (registro 5): o arquivo pode estar incompleto." });
  }

  const ta = trailerArquivo as string | null;
  if (!ta) {
    totaisOk = false;
    problemas.push({ gravidade: "erro", mensagem: "Arquivo sem trailer (registro 9): pode estar incompleto." });
  } else {
    const lotesTrailer = inteiro(campo(ta, 18, 23));
    const registrosTrailer = inteiro(campo(ta, 24, 29));
    const registrosOk = registrosTrailer === linhas.length || registrosTrailer === linhas.length - totalSegmentosB;
    if (lotesTrailer !== qtdLotes || !registrosOk) {
      totaisOk = false;
      problemas.push({
        gravidade: "erro",
        mensagem: "A quantidade de lotes ou de registros do trailer não confere com o arquivo.",
      });
    }
  }

  return {
    origem: "cnab240",
    sentido,
    cabecalho: { dataArquivo, sequencial, convenio, layout },
    linhas: saida,
    problemas,
    totais: {
      pagamentos: saida.length,
      somaCentavos: somaArquivo,
      somaTrailerCentavos: temTrailerLote ? somaTrailers : null,
      confere: totaisOk && temTrailerLote,
    },
  };
}
