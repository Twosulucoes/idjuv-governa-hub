/**
 * Tipos e utilitários comuns aos leitores de arquivos bancários (OBN600 e CNAB 240).
 *
 * Cada pagamento visto num arquivo vira uma `LinhaMovimentoBancario`, no contrato da RPC
 * `importar_arquivo_bancario` (tabela `fin_movimentos_bancarios`). Os leitores são funções puras:
 * recebem o texto do arquivo e devolvem linhas, cabeçalho, problemas e a conferência com o trailer.
 *
 * Dado pessoal (CPF/CNPJ, conta do favorecido): nunca vai para log nem para mensagem de problema.
 */

import type { ProblemaLeitura } from "@/lib/importacao/types";

export type OrigemArquivoBancario = "obn600" | "cnab240";
export type SentidoArquivoBancario = "remessa" | "retorno";
export type SituacaoMovimentoBancario = "enviado" | "pago" | "recusado";

/** Tipo do lançamento, deduzido do código de OB (OBN600) ou do serviço/forma do lote (CNAB 240). */
export type TipoLancamentoBancario =
  | "credito_bb"
  | "credito_outro_banco"
  | "fatura"
  | "salario"
  | "outro";

export const ROTULO_TIPO_LANCAMENTO: Record<TipoLancamentoBancario, string> = {
  credito_bb: "Crédito BB",
  credito_outro_banco: "Crédito outro banco",
  fatura: "Fatura/guia",
  salario: "Salário",
  outro: "Outro",
};

export interface LinhaMovimentoBancario {
  origem: OrigemArquivoBancario;
  sentido: SentidoArquivoBancario;
  tipo_lancamento: TipoLancamentoBancario;
  /** Nº da OB (OBN600) ou "seu número" (CNAB 240) */
  identificador: string;
  favorecido_nome: string;
  /** Só dígitos */
  favorecido_documento: string;
  banco: string;
  /** "0250-X" (agência com DV quando houver) */
  agencia: string;
  /** "22450-2" (conta sem zeros à esquerda, com DV quando houver) */
  conta: string;
  /** Em reais */
  valor: number;
  /** YYYY-MM-DD; null se o arquivo trouxe data inválida */
  data_pagamento: string | null;
  codigo_barras: string | null;
  autenticacao: string | null;
  situacao: SituacaoMovimentoBancario;
  codigo_retorno: string | null;
  motivo_recusa: string | null;
}

export interface CabecalhoArquivoBancario {
  /** YYYY-MM-DD */
  dataArquivo: string | null;
  /** Sequencial do arquivo (OBN: nº da remessa; CNAB: NSA) */
  sequencial: number | null;
  /** Convênio do pagador, quando o leiaute traz (CNAB 240) */
  convenio: string | null;
  /** Versão do leiaute do arquivo (CNAB 240) */
  layout: string | null;
}

export interface TotaisArquivoBancario {
  /** Quantidade de linhas de pagamento lidas */
  pagamentos: number;
  /** Soma dos valores lidos, em centavos */
  somaCentavos: number;
  /** Soma informada no(s) trailer(s), em centavos; null sem trailer */
  somaTrailerCentavos: number | null;
  /** Soma e contagens batem com o(s) trailer(s) */
  confere: boolean;
}

export interface ResultadoArquivoBancario {
  origem: OrigemArquivoBancario;
  sentido: SentidoArquivoBancario;
  cabecalho: CabecalhoArquivoBancario;
  linhas: LinhaMovimentoBancario[];
  problemas: ProblemaLeitura[];
  totais: TotaisArquivoBancario;
}

/**
 * Texto do arquivo. Os arquivos do banco vêm em Latin-1/Windows-1252 (ex.: "inválido" no retorno do OBN);
 * ler como UTF-8 trocaria os acentos por "�".
 */
export function decodificarArquivoBancario(bytes: ArrayBuffer | Uint8Array): string {
  return new TextDecoder("windows-1252").decode(bytes);
}

/** Linhas do arquivo sem CR/LF; ignora linhas vazias (o último CRLF, por exemplo). */
export function linhasDoArquivo(texto: string): string[] {
  return texto.split(/\r?\n|\r/).filter((l) => l.length > 0);
}

/** Recorte 1-based e inclusivo, como nos manuais (ex.: campo(l, 52, 53) = posições 052-053). */
export function campo(linha: string, inicio: number, fim: number): string {
  return linha.substring(inicio - 1, fim);
}

export const apenasDigitos = (s: string) => s.replace(/\D/g, "");

/** Inteiro de um campo numérico; null se vazio ou com letras. */
export function inteiro(s: string): number | null {
  const t = s.trim();
  return /^\d+$/.test(t) ? Number.parseInt(t, 10) : null;
}

/** DDMMAAAA → YYYY-MM-DD; null se zerada, em branco ou inexistente (ex.: 31/09). */
export function dataDDMMAAAA(s: string): string | null {
  if (!/^\d{8}$/.test(s) || s === "00000000") return null;
  const dia = Number(s.slice(0, 2));
  const mes = Number(s.slice(2, 4));
  const ano = Number(s.slice(4, 8));
  const d = new Date(Date.UTC(ano, mes - 1, dia));
  if (d.getUTCFullYear() !== ano || d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) return null;
  return `${ano}-${s.slice(2, 4)}-${s.slice(0, 2)}`;
}

/** Agência para exibição/gravação: sem zeros à esquerda além de 4 dígitos, com "-DV" se houver. */
export function formatarAgencia(numero: string, dv: string): string {
  const n = apenasDigitos(numero).replace(/^0+(?=\d{4})/, "") || "0";
  const d = dv.trim();
  return d ? `${n.padStart(4, "0")}-${d}` : n.padStart(4, "0");
}

/** Conta para exibição/gravação: sem zeros à esquerda, com "-DV" se houver. */
export function formatarConta(numero: string, dv: string): string {
  const n = apenasDigitos(numero).replace(/^0+(?=\d)/, "");
  const d = dv.trim();
  if (!n || /^0+$/.test(n)) return "";
  return d ? `${n}-${d}` : n;
}

/** CPF aparece só com os dígitos do meio (LGPD); CNPJ é de empresa e vai inteiro. */
export function mascararDocumento(doc: string | null | undefined): string {
  const d = (doc ?? "").replace(/\D/g, "");
  if (d.length === 11) return `***.${d.slice(3, 6)}.${d.slice(6, 9)}-**`;
  if (d.length === 14) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
  return d ? "***" : "—";
}

export const centavosParaReais = (c: number) => Math.round(c) / 100;
