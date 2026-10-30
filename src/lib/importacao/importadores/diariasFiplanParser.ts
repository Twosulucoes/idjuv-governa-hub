/**
 * PARSER: FIP 002 – Demonstrativo de Diárias do FIPLAN → linhas da RPC `importar_diarias_fiplan`
 *
 * Função pura (sem arquivo nem banco), testada em diariasFiplanParser.test.ts. O xls do FIPLAN é uma tabela HTML sem
 * título nem critérios: duas linhas de cabeçalho (CREDOR | DOCUMENTO | PERÍODO VIAGEM | ORDEM SERVIÇO e, embaixo,
 * CÓDIGO, NOME, QTD, PROC, TIPO, DATA, NÚMERO, VALOR, LIQ, VALOR, NOB, DT NOB, SAÍDA, RETORNO, Nº OS, PC), uma linha por
 * diária e o rodapé "TOTAL UO:17302 - R$" com o total. O exercício sai do nº do empenho (17302 0001 26 001077).
 * Spec: docs/superpowers/specs/2026-10-30-diarias-fiplan-design.md
 */

import { normalizarCabecalho, paraDataIso, paraTexto } from "../planilha";
import type { ProblemaLeitura, ResultadoLeitura } from "../types";
import { paraValorBR } from "./pedsFiplanParser";

/** Linha no formato do contrato front ↔ RPC (mais a linha da planilha, para as mensagens). */
export interface LinhaDiariaFiplan {
  indice: number;
  empenho_numero: string;
  credor_codigo: string | null;
  credor_nome: string;
  quantidade: number;
  processo_fiplan: string | null;
  data_empenho: string | null;
  valor_empenhado: number;
  liquidacao_numero: string | null;
  valor_liquidado: number | null;
  nob_numero: string | null;
  data_pagamento: string | null;
  data_saida: string | null;
  data_retorno: string | null;
  ordem_servico: string | null;
  prestou_contas: boolean;
  linhaPlanilha: number;
}

/** Cabeçalho do FIP 002, na ordem das colunas (os dois "VALOR" são do empenho e da liquidação) */
const CABECALHO = [
  "codigo", "nome", "qtd", "proc", "tipo", "data", "numero", "valor",
  "liq", "valor", "nob", "dt_nob", "saida", "retorno", "n_os", "pc",
];
const RE_DOC = /^\d{17}$/;

const ouNulo = (texto: string) => (texto === "" ? null : texto);

/** "2.5" (o FIPLAN usa ponto na quantidade) ou "2,5" → 2,5 */
function paraQuantidade(texto: string): number {
  const limpo = texto.replace(/\s/g, "");
  return /^\d+([.,]\d+)?$/.test(limpo) ? Number(limpo.replace(",", ".")) : Number.NaN;
}

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function interpretarDiariasFiplan(linhas: unknown[][]): ResultadoLeitura<LinhaDiariaFiplan> {
  const problemas: ProblemaLeitura[] = [];
  const saida: LinhaDiariaFiplan[] = [];
  const vazio = (mensagem: string): ResultadoLeitura<LinhaDiariaFiplan> => ({
    linhas: [],
    problemas: [{ gravidade: "erro", mensagem }],
    cabecalho: {},
    parametros: {},
  });

  const inicio = linhas.findIndex((l) => {
    const n = l.map((c) => normalizarCabecalho(paraTexto(c)));
    return CABECALHO.every((c, j) => n[j] === c);
  });
  if (inicio < 0) {
    return vazio(
      'Este arquivo não é o FIP 002 – Demonstrativo de Diárias do FIPLAN (não achei o cabeçalho "CÓDIGO, NOME, QTD... PC").',
    );
  }

  let exercicio: number | null = null;
  let totalRodape: number | null = null;
  for (let i = inicio + 1; i < linhas.length; i++) {
    const t = linhas[i].map(paraTexto);
    const linhaPlanilha = i + 1;
    if (/^total uo/i.test(t[0] ?? "")) {
      const valor = paraValorBR(t.slice(1).find((c) => c !== "") ?? "");
      if (Number.isFinite(valor)) totalRodape = valor;
      continue;
    }
    if (!t[6]) continue;  // linha sem nº do documento (separadores do relatório)

    const empenho = t[6].replace(/\D/g, "");
    if (!RE_DOC.test(empenho)) {
      problemas.push({ gravidade: "erro", mensagem: `Linha ${linhaPlanilha}: nº do empenho "${t[6]}" fora do padrão.` });
      continue;
    }
    const ano = 2000 + Number(empenho.slice(9, 11));
    if (exercicio === null) exercicio = ano;
    else if (ano !== exercicio) {
      problemas.push({
        gravidade: "erro",
        mensagem: `Linha ${linhaPlanilha} (empenho ${empenho}): é de ${ano}, e o arquivo é de ${exercicio}. Exporte um exercício por vez.`,
      });
      continue;
    }
    const nome = t[1] ?? "";
    if (!nome) {
      problemas.push({ gravidade: "erro", mensagem: `Linha ${linhaPlanilha} (empenho ${empenho}): sem nome do credor.` });
      continue;
    }
    const valor = paraValorBR(t[7]);
    if (!Number.isFinite(valor) || valor < 0) {
      problemas.push({ gravidade: "erro", mensagem: `Linha ${linhaPlanilha} (empenho ${empenho}): valor "${t[7] ?? ""}" inválido.` });
      continue;
    }
    const quantidade = paraQuantidade(t[2] ?? "");
    if (!Number.isFinite(quantidade)) {
      problemas.push({ gravidade: "erro", mensagem: `Linha ${linhaPlanilha} (empenho ${empenho}): quantidade "${t[2] ?? ""}" inválida.` });
      continue;
    }
    const pc = normalizarCabecalho(t[15] ?? "");
    if (pc !== "sim" && pc !== "nao") {
      problemas.push({ gravidade: "aviso", mensagem: `Linha ${linhaPlanilha} (empenho ${empenho}): prestação de contas "${t[15] ?? ""}" lida como "Não".` });
    }
    const data = (j: number) => {
      const d = paraDataIso(t[j]);
      if (d === undefined) {
        problemas.push({ gravidade: "aviso", mensagem: `Linha ${linhaPlanilha} (empenho ${empenho}): data "${t[j]}" ignorada.` });
        return null;
      }
      return d;
    };
    const documento = (j: number) => {
      const d = (t[j] ?? "").replace(/\D/g, "");
      return RE_DOC.test(d) ? d : null;
    };
    const liquidado = paraValorBR(t[9]);
    saida.push({
      indice: saida.length,
      empenho_numero: empenho,
      credor_codigo: ouNulo(t[0] ?? ""),
      credor_nome: nome,
      quantidade,
      processo_fiplan: ouNulo(t[3] ?? ""),
      data_empenho: data(5),
      valor_empenhado: valor,
      liquidacao_numero: documento(8),
      valor_liquidado: Number.isFinite(liquidado) ? liquidado : null,
      nob_numero: documento(10),
      data_pagamento: data(11),
      data_saida: data(12),
      data_retorno: data(13),
      ordem_servico: ouNulo(t[14] ?? ""),
      prestou_contas: pc === "sim",
      linhaPlanilha,
    });
  }

  if (saida.length === 0 && problemas.length === 0) return vazio("O relatório não tem nenhuma diária.");

  const total = saida.reduce((s, l) => s + l.valor_empenhado, 0);
  if (totalRodape !== null && Math.abs(totalRodape - total) > 0.005) {
    problemas.push({
      gravidade: "aviso",
      mensagem: `O total do rodapé (${brl(totalRodape)}) não bate com a soma das linhas lidas (${brl(total)}).`,
    });
  }
  const pendentes = saida.filter((l) => !l.prestou_contas);
  return {
    linhas: saida,
    problemas,
    cabecalho: {
      Exercício: exercicio === null ? "" : String(exercicio),
      Diárias: `${saida.length} (${brl(total)})`,
      Servidores: String(new Set(saida.map((l) => l.credor_codigo ?? l.credor_nome)).size),
      "Sem prestação de contas": `${pendentes.length} (${brl(pendentes.reduce((s, l) => s + l.valor_empenhado, 0))})`,
    },
    parametros: { exercicio },
  };
}

/** Linha no formato que a RPC recebe (sem a linha da planilha). */
export function paraContratoDiaria({ linhaPlanilha: _linha, ...resto }: LinhaDiariaFiplan) {
  return resto;
}
