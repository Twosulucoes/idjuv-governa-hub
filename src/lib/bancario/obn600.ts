/**
 * Leitor do arquivo OBN600 (ordens bancárias do sistema estadual de finanças, remessa e retorno do banco).
 *
 * Linhas de 350 posições, uma por registro; o tipo está na posição 001:
 *   '0' header · '2' ordem bancária (OB) · '4' detalhe de fatura/guia (código de barras) · '9' trailer
 *
 * As posições abaixo foram confirmadas nos arquivos reais (remessas e retornos, somas conferidas contra o
 * trailer). Não temos o manual do leiaute: significados marcados "conferir no manual" foram deduzidos.
 *
 * Uma `LinhaMovimentoBancario` por registro '2'; os registros '4' seguintes da mesma OB completam código de
 * barras, autenticação e o motivo da recusa.
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

export const TAMANHO_LINHA_OBN600 = 350;

/** Código do tipo de OB (posições 052-053). Deduzido dos arquivos — conferir no manual. */
const TIPO_OB: Record<string, TipoLancamentoBancario> = {
  "31": "credito_outro_banco",
  "32": "credito_bb",
  "38": "fatura",
};

/** Código de retorno (posições 342-343). '01' processado; '09' recusado. Deduzido — conferir no manual. */
const RETORNO_OK = "01";

/*
 * HEADER (tipo 0)
 *   001       '0'
 *   002-035   zeros
 *   036-043   data de geração (DDMMAAAA); no retorno, usada como data de efetivação das OBs pagas
 *             (o registro da OB não traz a data do débito)                — conferir no manual
 *   044-047   hora (HHMM)
 *   048-052   sequencial do arquivo (nº da remessa)                       — conferir no manual
 *   053-054   '10' remessa / '20' retorno                                 — deduzido, conferir no manual
 *   055       'B'
 *   056-067   identificação do órgão no banco (fixa nos arquivos vistos)  — conferir no manual
 *   068-072   (só no retorno) nº da remessa a que o retorno se refere     — deduzido, conferir no manual
 *   344-350   sequencial do registro (0000001)
 *
 * ORDEM BANCÁRIA (tipo 2)
 *   001       '2'
 *   002-006   agência da conta pagadora (com DV)
 *   007-017   unidade gestora / gestão emitente                           — conferir no manual
 *   018-028   nº da relação (agrupa OBs do mesmo tipo)                    — conferir no manual
 *   029-039   nº da OB  → identificador
 *   040-047   data da OB (DDMMAAAA)
 *   048-051   brancos
 *   052-053   tipo de OB (31 crédito outro banco, 32 crédito BB, 38 fatura/guia)
 *   054-080   valor (27 dígitos, centavos)
 *   081-083   banco do favorecido
 *   084-087   agência do favorecido · 088 DV
 *   089-097   conta do favorecido · 098 DV
 *   099-143   nome do favorecido (45)
 *   144-208   endereço (65)
 *   209-236   município (28)
 *   237-253   uso do sistema (zeros em fatura)                            — conferir no manual
 *   254-261   CEP · 262-263 UF
 *   264-303   observação; no retorno, texto da recusa ("RECUSADO ROTINA …")
 *   304-305   tipo de inscrição ('01' CNPJ, '02' CPF)
 *   306-319   CPF/CNPJ do favorecido (alinhado à esquerda)
 *   320-334   agência + conta pagadora                                    — conferir no manual
 *   335-341   brancos (zeros no retorno)
 *   342-343   código de retorno (só no retorno)
 *   344-350   sequencial do registro
 *
 * DETALHE DE FATURA/GUIA (tipo 4) — mesmo prefixo 002-047 da OB a que pertence
 *   052-053   tipo de OB · 055-060 nº do documento dentro da OB · 064-080 valor (17, centavos)
 *   096       indicador do código (2 = código de barras)                  — conferir no manual
 *   097-140   código de barras (44)
 *   264-303   motivo da recusa (no retorno)
 *   304-319   autenticação bancária (no retorno)
 *   342-343   código de retorno · 344-350 sequencial
 *
 * TRAILER (tipo 9)
 *   001-035   noves
 *   321-337   soma dos valores das OBs (17, centavos)
 *   338-350   soma dos sequenciais de todos os registros anteriores (13) — confirmado nos arquivos
 */

interface ObEmLeitura {
  linha: LinhaMovimentoBancario;
  /** Prefixo 002-047 (agência, UG, relação, OB, data): liga os registros '4' à OB */
  chave: string;
  textoRecusa: string;
  codigoRetorno: string;
}

export function lerObn600(texto: string): ResultadoArquivoBancario {
  const linhas = linhasDoArquivo(texto);
  const problemas: ProblemaLeitura[] = [];
  const obs: ObEmLeitura[] = [];

  const header = linhas[0];
  if (!header || header[0] !== "0") {
    problemas.push({ gravidade: "erro", mensagem: "O arquivo não começa com o header OBN600 (registro 0)." });
  }

  const tamanhosErrados = linhas.filter((l) => l.length !== TAMANHO_LINHA_OBN600).length;
  if (tamanhosErrados) {
    problemas.push({
      gravidade: "erro",
      mensagem: `${tamanhosErrados} linha(s) com tamanho diferente de ${TAMANHO_LINHA_OBN600} posições.`,
    });
  }

  const marcaSentido = header ? campo(header, 53, 54) : "";
  const temRetorno = linhas.some((l) => (l[0] === "2" || l[0] === "4") && /^\d{2}$/.test(campo(l, 342, 343)));
  const sentido: SentidoArquivoBancario =
    marcaSentido === "20" ? "retorno" : marcaSentido === "10" ? "remessa" : temRetorno ? "retorno" : "remessa";
  if (marcaSentido !== "10" && marcaSentido !== "20" && header) {
    problemas.push({
      gravidade: "aviso",
      mensagem: `Header sem a marca de remessa/retorno conhecida; tratado como ${sentido}.`,
    });
  }

  const dataArquivo = header ? dataDDMMAAAA(campo(header, 36, 43)) : null;
  const sequencial = header ? inteiro(campo(header, 48, 52)) : null;

  let trailer: string | null = null;
  let somaSequenciais = 0;
  let atual: ObEmLeitura | null = null;
  const desconhecidos = new Set<string>();

  linhas.forEach((l, i) => {
    const tipo = l[0];
    if (tipo === "9") {
      trailer = l;
      return;
    }
    somaSequenciais += inteiro(campo(l, 344, 350)) ?? 0;
    if (tipo === "0") return;

    if (tipo === "2") {
      const codigoOb = campo(l, 52, 53);
      const tipoLancamento = TIPO_OB[codigoOb] ?? "outro";
      if (!TIPO_OB[codigoOb]) desconhecidos.add(codigoOb);
      const valorCentavos = inteiro(campo(l, 54, 80));
      const data = dataDDMMAAAA(campo(l, 40, 47));
      const inscricao = campo(l, 304, 305);
      const documento = apenasDigitos(campo(l, 306, 319));
      const codigoRetorno = sentido === "retorno" ? campo(l, 342, 343).trim() : "";
      const ehFatura = tipoLancamento === "fatura";

      if (valorCentavos === null) {
        problemas.push({ gravidade: "erro", mensagem: `Registro ${i + 1}: valor inválido.`, linha: obs.length });
      }
      if (!data) {
        problemas.push({ gravidade: "aviso", mensagem: `Registro ${i + 1}: data da OB inválida.`, linha: obs.length });
      }

      atual = {
        chave: campo(l, 2, 47),
        textoRecusa: campo(l, 264, 303).trim(),
        codigoRetorno,
        linha: {
          origem: "obn600",
          sentido,
          tipo_lancamento: tipoLancamento,
          identificador: campo(l, 29, 39).trim(),
          favorecido_nome: campo(l, 99, 143).trim(),
          // '01' CNPJ (14), '02' CPF (11) — o campo vem alinhado à esquerda
          favorecido_documento:
            inscricao === "02" ? documento.slice(0, 11) : inscricao === "01" ? documento.slice(0, 14) : documento,
          banco: ehFatura ? "" : campo(l, 81, 83),
          agencia: ehFatura ? "" : formatarAgencia(campo(l, 84, 87), campo(l, 88, 88)),
          conta: ehFatura ? "" : formatarConta(campo(l, 89, 97), campo(l, 98, 98)),
          valor: centavosParaReais(valorCentavos ?? 0),
          data_pagamento: data,
          data_efetivacao: null,
          codigo_barras: null,
          autenticacao: null,
          situacao: "enviado",
          codigo_retorno: codigoRetorno || null,
          motivo_recusa: null,
        },
      };
      obs.push(atual);
      return;
    }

    if (tipo === "4") {
      const ob = atual as ObEmLeitura | null;
      if (!ob || ob.chave !== campo(l, 2, 47)) {
        problemas.push({ gravidade: "aviso", mensagem: `Registro ${i + 1}: detalhe de fatura sem a OB correspondente.` });
        return;
      }
      const codigo = campo(l, 97, 140).trim();
      if (codigo && !ob.linha.codigo_barras) ob.linha.codigo_barras = codigo;
      const autenticacao = campo(l, 304, 319).trim();
      if (autenticacao && !ob.linha.autenticacao) ob.linha.autenticacao = autenticacao;
      if (sentido === "retorno") {
        const cod = campo(l, 342, 343).trim();
        if (cod && cod !== RETORNO_OK) {
          ob.codigoRetorno = cod;
          ob.linha.codigo_retorno = cod;
          const motivo = campo(l, 264, 303).trim();
          if (motivo) ob.textoRecusa = motivo;
        }
      }
      return;
    }

    desconhecidos.add(`registro ${tipo}`);
  });

  // Situação: remessa = enviado; retorno = pago, salvo código ≠ 01 ou texto de recusa
  for (const ob of obs) {
    if (sentido !== "retorno") continue;
    const recusado =
      (ob.codigoRetorno && ob.codigoRetorno !== RETORNO_OK) || /^RECUSAD/i.test(ob.textoRecusa);
    ob.linha.situacao = recusado ? "recusado" : "pago";
    // O registro da OB não traz a data do débito: usa a data do header do retorno. Conferir no manual.
    if (!recusado) ob.linha.data_efetivacao = dataArquivo;
    if (recusado) {
      ob.linha.motivo_recusa = ob.textoRecusa || "Recusado pelo banco (sem motivo no arquivo)";
      if (!ob.linha.codigo_retorno || ob.linha.codigo_retorno === RETORNO_OK) {
        ob.linha.codigo_retorno = ob.codigoRetorno && ob.codigoRetorno !== RETORNO_OK ? ob.codigoRetorno : "09";
      }
    }
  }

  if (desconhecidos.size) {
    problemas.push({
      gravidade: "aviso",
      mensagem: `Códigos não reconhecidos (lidos como "outro"): ${[...desconhecidos].join(", ")}.`,
    });
  }

  const somaCentavos = obs.reduce((s, o) => s + Math.round(o.linha.valor * 100), 0);
  let somaTrailerCentavos: number | null = null;
  let confere = false;
  const t = trailer as string | null;
  if (!t) {
    problemas.push({ gravidade: "erro", mensagem: "Arquivo sem trailer (registro 9): pode estar incompleto." });
  } else {
    somaTrailerCentavos = inteiro(campo(t, 321, 337));
    const somaSeqTrailer = inteiro(campo(t, 338, 350));
    const somaOk = somaTrailerCentavos === somaCentavos;
    const seqOk = somaSeqTrailer === somaSequenciais;
    confere = somaOk && seqOk;
    if (!somaOk) {
      problemas.push({
        gravidade: "erro",
        mensagem: "A soma dos valores das OBs não confere com o total do trailer.",
      });
    }
    if (!seqOk) {
      problemas.push({
        gravidade: "erro",
        mensagem: "A conferência de registros do trailer não bate: o arquivo pode estar incompleto ou alterado.",
      });
    }
  }

  return {
    origem: "obn600",
    sentido,
    cabecalho: { dataArquivo, sequencial, convenio: null, layout: "OBN600" },
    linhas: obs.map((o) => o.linha),
    problemas,
    totais: { pagamentos: obs.length, somaCentavos, somaTrailerCentavos, confere },
  };
}
