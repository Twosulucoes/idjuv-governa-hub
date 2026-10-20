/**
 * Retorno do banco de uma remessa da folha (CNAB 240 lido por `lerCnab240`): casa cada crédito do retorno com o
 * crédito da remessa e diz a situação de cada um. Quem grava é a RPC `registrar_retorno_remessa` (migração
 * 20261021090000), que confere que cada ficha é da folha da remessa.
 *
 * Casamento, nesta ordem:
 *  1. pelo seu número (074-093): a remessa do sistema grava o início do id da ficha (servidores) ou do item de pensão;
 *  2. sem ele (arquivo de outro sistema, ou seu número que não achou), pelo CPF e o valor, um crédito para um.
 *
 * Situação: ocorrência 00 = pago; só BD = agendado (aceito, crédito na data); outra ocorrência = recusado.
 */

import { apenasDigitos, campo, linhasDoArquivo, type LinhaMovimentoBancario, type ResultadoArquivoBancario } from "./comum";
import { OCORRENCIAS_CNAB240 } from "./cnab240";

export type SituacaoRetorno = "agendado" | "pago" | "rejeitado";

export const ROTULO_SITUACAO_RETORNO: Record<SituacaoRetorno, string> = {
  agendado: "Agendado",
  pago: "Pago",
  rejeitado: "Recusado",
};

/** Um crédito da remessa, como a tela o remonta a partir das fichas (ou dos descontos de pensão) da folha. */
export interface CreditoDaRemessa {
  /** O que a remessa gravou no seu número (início do id da ficha ou do item de pensão) */
  identificador: string;
  ficha_id: string;
  nome: string;
  cpf: string | null;
  valor: number;
}

export interface ItemRetornoCasado {
  linha: LinhaMovimentoBancario;
  credito: CreditoDaRemessa | null;
  situacao: SituacaoRetorno;
  /** Ocorrências com o texto (recusado), ex.: "AT: Tipo/número de inscrição do favorecido inválido" */
  motivo: string | null;
}

export interface RetornoCasado {
  itens: ItemRetornoCasado[];
  /** Créditos da remessa que o retorno não traz */
  naoRetornados: CreditoDaRemessa[];
  resumo: Record<SituacaoRetorno, { quantidade: number; valor: number }>;
  /** Créditos do retorno que não acharam a remessa */
  semCredito: number;
}

/** O BB marca a prévia (créditos aceitos, antes da data do crédito) no header de arquivo. Conferir no manual. */
export function ehRetornoPrevia(texto: string): boolean {
  const header = linhasDoArquivo(texto)[0] ?? "";
  return /PREVIA/i.test(campo(header, 144, 240));
}

export function situacaoDoRetorno(linha: Pick<LinhaMovimentoBancario, "situacao">): SituacaoRetorno {
  if (linha.situacao === "pago") return "pago";
  if (linha.situacao === "recusado") return "rejeitado";
  return "agendado";
}

function motivoDaLinha(linha: LinhaMovimentoBancario): string | null {
  if (linha.situacao !== "recusado" || !linha.codigo_retorno) return null;
  return linha.codigo_retorno
    .split(" ")
    .filter(Boolean)
    .map((c) => `${c}: ${OCORRENCIAS_CNAB240[c] ?? "ocorrência sem descrição"}`)
    .join("; ");
}

const centavos = (v: number) => Math.round(v * 100);
const chaveCpfValor = (cpf: string | null, valor: number) => `${apenasDigitos(cpf ?? "").padStart(11, "0")}|${centavos(valor)}`;

export function casarRetorno(lido: ResultadoArquivoBancario, creditos: CreditoDaRemessa[]): RetornoCasado {
  const livres = new Set(creditos.map((_, i) => i));
  const porIdentificador = new Map<string, number>();
  creditos.forEach((c, i) => {
    if (c.identificador) porIdentificador.set(c.identificador, i);
  });

  const casados: (number | null)[] = lido.linhas.map((l) => {
    const i = porIdentificador.get(l.identificador);
    if (i === undefined || !livres.has(i)) return null;
    livres.delete(i);
    return i;
  });

  // segunda passada: CPF + valor entre os que sobraram
  lido.linhas.forEach((l, k) => {
    if (casados[k] !== null) return;
    const chave = chaveCpfValor(l.favorecido_documento, l.valor);
    for (const i of livres) {
      if (chaveCpfValor(creditos[i].cpf, creditos[i].valor) === chave) {
        livres.delete(i);
        casados[k] = i;
        return;
      }
    }
  });

  const resumo: RetornoCasado["resumo"] = {
    agendado: { quantidade: 0, valor: 0 },
    pago: { quantidade: 0, valor: 0 },
    rejeitado: { quantidade: 0, valor: 0 },
  };
  const itens = lido.linhas.map((linha, k): ItemRetornoCasado => {
    const situacao = situacaoDoRetorno(linha);
    resumo[situacao].quantidade += 1;
    resumo[situacao].valor = (centavos(resumo[situacao].valor) + centavos(linha.valor)) / 100;
    const i = casados[k];
    return { linha, credito: i === null ? null : creditos[i], situacao, motivo: motivoDaLinha(linha) };
  });

  return {
    itens,
    naoRetornados: [...livres].sort((a, b) => a - b).map((i) => creditos[i]),
    resumo,
    semCredito: itens.filter((i) => !i.credito).length,
  };
}

/**
 * O que impede registrar o retorno nesta remessa (vazio = pode registrar): arquivo que não é retorno CNAB 240,
 * totais que não batem, convênio de outra conta ou nenhum crédito da remessa no arquivo.
 */
export function problemasRetorno(
  lido: ResultadoArquivoBancario,
  casado: RetornoCasado,
  convenioDaConta: string | null | undefined,
): string[] {
  const p: string[] = [];
  if (lido.origem !== "cnab240" || lido.sentido !== "retorno") {
    p.push("O arquivo não é um retorno CNAB 240 do banco (escolha o .ret que o banco devolveu).");
    return p;
  }
  for (const e of lido.problemas) if (e.gravidade === "erro") p.push(e.mensagem);
  if (!lido.totais.confere) p.push("Os totais do arquivo não conferem com os créditos: o arquivo pode estar incompleto.");
  const doArquivo = (lido.cabecalho.convenio ?? "").replace(/^0+/, "");
  const daConta = apenasDigitos(convenioDaConta ?? "").replace(/^0+/, "");
  if (doArquivo && daConta && doArquivo !== daConta) {
    p.push(`O retorno é do convênio ${doArquivo}; a conta desta remessa usa o convênio ${daConta}.`);
  }
  if (!lido.linhas.length) p.push("O retorno não traz créditos.");
  else if (casado.semCredito === lido.linhas.length) {
    p.push("Nenhum crédito do retorno é desta remessa: confira se escolheu o arquivo e a remessa certos.");
  }
  return p;
}
