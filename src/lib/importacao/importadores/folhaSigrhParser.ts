/**
 * INTERPRETADOR DOS ESPELHOS DA FOLHA DO SIGRH (folha histórica)
 *
 * Três formatos que o SIGRH emite para a mesma folha mensal, todos com o valor de cada servidor:
 *   - "fpag10":      PDF "Folha Analítica por Funcionário - FPAG10". Por servidor, uma linha de cabeçalho
 *                    (nomeação, CPF e nome, função, banco/agência/conta, "Dep IR n"), as rubricas em duas
 *                    colunas (proventos à esquerda, descontos à direita do título "Desconto") e a linha
 *                    "Total Liquido =" (líquido, proventos, descontos). No fim, o total do órgão.
 *   - "conferencia": PDF "Relatório analítico de conferência de folha" (SIGRH novo). Por servidor, a linha
 *                    com matrícula, nome, N/Ref, CPF e banco, as rubricas com código (01-xxxx provento,
 *                    05-xxxx desconto) e a linha "Provento: … Desconto: … Líquido: …". No fim, os totais gerais.
 *   - "analitica":   planilha "analítica por evento" (uma linha por servidor e rubrica: CdNomeacao, CPF,
 *                    NmEvento, TpEvento P/D, Qtde, Valor, AnoMesReferencia). Não traz total impresso nem a
 *                    competência: o mês sai do nome do arquivo.
 *
 * O total de cada servidor e o total do órgão impressos conferem a leitura: diferença de um centavo é erro.
 * Os vínculos do mesmo CPF no mês (troca de cargo) viram uma ficha só, porque o sistema guarda uma ficha
 * por servidor em cada folha. Valores em centavos (inteiros) para a soma não acumular erro de ponto flutuante.
 *
 * Funções puras (sem pdf.js nem xlsx) para poderem ser conferidas isoladamente.
 */

import type { LinhaPdf, TrechoPdf } from "../pdfTexto";
import type { ProblemaLeitura, ResultadoLeitura } from "../types";

export type FormatoEspelhoSigrh = "fpag10" | "conferencia" | "analitica";

export const ROTULO_FORMATO: Record<FormatoEspelhoSigrh, string> = {
  fpag10: "Espelho FPAG10 (PDF)",
  conferencia: "Relatório analítico de conferência (PDF)",
  analitica: "Planilha analítica por evento",
};

export interface ItemFolhaSigrh {
  /** Código da rubrica no SIGRH, quando o espelho traz */
  codigo: string | null;
  descricao: string;
  tipo: "provento" | "desconto";
  /** Quantidade/referência como impressa (dias, alíquota, parcela) */
  quantidade: string | null;
  /** Competência a que o valor se refere, quando é de outro mês (AAAA-MM) */
  competencia: string | null;
  centavos: number;
}

export interface LinhaFolhaSigrh {
  cpf: string;
  /** Nomeações/matrículas do SIGRH somadas nesta ficha (mais de uma quando houve troca de cargo no mês) */
  matriculas: string[];
  nome: string;
  funcao: string;
  bancoCodigo: string | null;
  bancoAgencia: string | null;
  bancoConta: string | null;
  dependentesIr: number | null;
  itens: ItemFolhaSigrh[];
  proventos: number;
  descontos: number;
}

export interface CompetenciaFolha {
  ano: number;
  mes: number;
}

type Leitura = ResultadoLeitura<LinhaFolhaSigrh>;

/** Vínculo como lido do espelho, antes de juntar por CPF. */
interface VinculoLido {
  matricula: string;
  cpf: string;
  nome: string;
  funcao: string;
  bancoCodigo: string | null;
  bancoAgencia: string | null;
  bancoConta: string | null;
  dependentesIr: number | null;
  itens: ItemFolhaSigrh[];
  /** Totais impressos do vínculo (proventos, descontos), quando o espelho traz */
  impresso: { proventos: number; descontos: number } | null;
}

// ---------------------------------------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------------------------------------

const NUMERO_BR = /^-?[\d.]*\d(,\d+)?$/;

/** "3.578,08" → 357808; "1073,42" → 107342; 2010 → 201000. `null` se não for número. */
export function paraCentavos(valor: unknown): number | null {
  if (typeof valor === "number") return Number.isFinite(valor) ? Math.round(valor * 100) : null;
  const texto = String(valor ?? "").trim().replace(/^R\$\s*/, "");
  if (!texto || !NUMERO_BR.test(texto)) return null;
  const n = Number(texto.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n * 100) : null;
}

/** 357808 → "3.578,08" */
export function formatarCentavos(centavos: number): string {
  const sinal = centavos < 0 ? "-" : "";
  const abs = Math.abs(centavos);
  const reais = Math.floor(abs / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${sinal}${reais},${String(abs % 100).padStart(2, "0")}`;
}

const somar = (itens: ItemFolhaSigrh[], tipo: ItemFolhaSigrh["tipo"]) =>
  itens.reduce((s, i) => (i.tipo === tipo ? s + i.centavos : s), 0);

const soDigitos = (texto: string) => texto.replace(/\D/g, "");

/** "202602" → "2026-02"; inválido → null */
function competenciaDeAnoMes(texto: string | null | undefined): string | null {
  const m = String(texto ?? "").trim().match(/^(20\d{2})(0[1-9]|1[0-2])$/);
  return m ? `${m[1]}-${m[2]}` : null;
}

const textoLinha = (l: LinhaPdf) => l.trechos.map((t) => t.texto).join(" ");

const MESES: Record<string, number> = {
  janeiro: 1, fevereiro: 2, marco: 3, abril: 4, maio: 5, junho: 6,
  julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12,
};

/**
 * Competência pelo nome do arquivo: "…_ABRIL.xlsx", "…-SETEMBRO-26-…", "espelho 04-2026.xlsx".
 * Sem ano no nome, usa `anoPadrao` e devolve `anoDeduzido`.
 */
export function competenciaDoNomeArquivo(
  nome: string,
  anoPadrao: number,
): (CompetenciaFolha & { anoDeduzido: boolean }) | null {
  const base = nome.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const numerica = base.match(/(?:^|[^\d])(0[1-9]|1[0-2])[-_/.](20\d{2})(?:[^\d]|$)/);
  if (numerica) return { mes: Number(numerica[1]), ano: Number(numerica[2]), anoDeduzido: false };
  const palavras = base.split(/[^a-z0-9]+/);
  const idx = palavras.findIndex((p) => p in MESES);
  if (idx < 0) return null;
  const mes = MESES[palavras[idx]];
  const anoCompleto = base.match(/(?:^|[^\d])(20\d{2})(?:[^\d]|$)/);
  if (anoCompleto) return { mes, ano: Number(anoCompleto[1]), anoDeduzido: false };
  const curto = palavras[idx + 1];
  if (curto && /^\d{2}$/.test(curto)) return { mes, ano: 2000 + Number(curto), anoDeduzido: false };
  return { mes, ano: anoPadrao, anoDeduzido: true };
}

// ---------------------------------------------------------------------------------------------------------
// Montagem do resultado (comum aos três formatos)
// ---------------------------------------------------------------------------------------------------------

function montarResultado(
  formato: FormatoEspelhoSigrh,
  competencia: CompetenciaFolha | null,
  vinculos: VinculoLido[],
  totalImpresso: { proventos: number; descontos: number } | null,
  problemas: ProblemaLeitura[],
): Leitura {
  if (!competencia) problemas.push({ gravidade: "erro", mensagem: "Não achei a competência (mês e ano) da folha." });
  if (!vinculos.length) problemas.push({ gravidade: "erro", mensagem: "Nenhum servidor encontrado no arquivo." });

  // Conferência por vínculo: soma das rubricas x total impresso
  for (const v of vinculos) {
    if (!v.impresso) continue;
    const p = somar(v.itens, "provento");
    const d = somar(v.itens, "desconto");
    if (p !== v.impresso.proventos || d !== v.impresso.descontos) {
      problemas.push({
        gravidade: "erro",
        mensagem:
          `${v.nome}: a soma das rubricas (proventos ${formatarCentavos(p)}, descontos ${formatarCentavos(d)}) ` +
          `não bate com o total impresso (${formatarCentavos(v.impresso.proventos)} e ` +
          `${formatarCentavos(v.impresso.descontos)}). O arquivo não foi lido por inteiro.`,
      });
    }
    if (!v.itens.length) problemas.push({ gravidade: "erro", mensagem: `${v.nome}: nenhuma rubrica lida.` });
  }

  // Um CPF, uma ficha
  const porCpf = new Map<string, LinhaFolhaSigrh>();
  for (const v of vinculos) {
    const atual = porCpf.get(v.cpf);
    if (!atual) {
      porCpf.set(v.cpf, {
        cpf: v.cpf,
        matriculas: [v.matricula],
        nome: v.nome,
        funcao: v.funcao,
        bancoCodigo: v.bancoCodigo,
        bancoAgencia: v.bancoAgencia,
        bancoConta: v.bancoConta,
        dependentesIr: v.dependentesIr,
        itens: [...v.itens],
        proventos: 0,
        descontos: 0,
      });
      continue;
    }
    if (!atual.matriculas.includes(v.matricula)) atual.matriculas.push(v.matricula);
    if (v.funcao && !atual.funcao.split(" / ").includes(v.funcao)) atual.funcao = `${atual.funcao} / ${v.funcao}`;
    // o banco e os dependentes valem os do último vínculo do mês
    atual.bancoCodigo = v.bancoCodigo ?? atual.bancoCodigo;
    atual.bancoAgencia = v.bancoAgencia ?? atual.bancoAgencia;
    atual.bancoConta = v.bancoConta ?? atual.bancoConta;
    atual.dependentesIr = v.dependentesIr ?? atual.dependentesIr;
    atual.itens.push(...v.itens);
  }
  const linhas = [...porCpf.values()].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  for (const l of linhas) {
    l.proventos = somar(l.itens, "provento");
    l.descontos = somar(l.itens, "desconto");
    if (l.matriculas.length > 1) {
      problemas.push({
        gravidade: "aviso",
        mensagem: `${l.nome}: ${l.matriculas.length} vínculos no mês somados numa ficha só (${l.funcao}).`,
        linha: linhas.indexOf(l),
      });
    }
  }

  const proventos = linhas.reduce((s, l) => s + l.proventos, 0);
  const descontos = linhas.reduce((s, l) => s + l.descontos, 0);
  if (totalImpresso) {
    if (proventos !== totalImpresso.proventos || descontos !== totalImpresso.descontos) {
      problemas.push({
        gravidade: "erro",
        mensagem:
          `A soma dos servidores (proventos ${formatarCentavos(proventos)}, descontos ${formatarCentavos(descontos)}) ` +
          `não bate com o total do órgão impresso (${formatarCentavos(totalImpresso.proventos)} e ` +
          `${formatarCentavos(totalImpresso.descontos)}).`,
      });
    }
  } else if (linhas.length) {
    problemas.push({
      gravidade: "aviso",
      mensagem: "Este arquivo não traz o total do órgão impresso: confira os totais abaixo com o espelho do mês.",
    });
  }

  const comp = competencia ? `${String(competencia.mes).padStart(2, "0")}/${competencia.ano}` : "—";
  return {
    linhas,
    problemas,
    cabecalho: {
      Competência: comp,
      Formato: ROTULO_FORMATO[formato],
      Servidores: String(linhas.length),
      Proventos: formatarCentavos(proventos),
      Descontos: formatarCentavos(descontos),
      Líquido: formatarCentavos(proventos - descontos),
      ...(totalImpresso ? { Conferência: problemas.some((p) => p.gravidade === "erro") ? "não bate" : "bate com o total impresso" } : {}),
    },
    parametros: competencia ? { ano: competencia.ano, mes: competencia.mes, formato } : { formato },
  };
}

// ---------------------------------------------------------------------------------------------------------
// FPAG10 (PDF)
// ---------------------------------------------------------------------------------------------------------

const IGNORAR_FPAG10 = /^(INSTITUTO|Folha|Provento|=+|-+|Emiss|Página|\d{2}\.\d{2}$)/;

/** Borda direita dos títulos "Qtde" e "Valor" de uma das metades (proventos ou descontos). */
interface ColunasMetade {
  qtdeFim: number;
  valorFim: number;
}

/**
 * Item de uma metade da linha (provento ou desconto): nome, quantidade, valor. Cada número vai para a coluna cujo
 * título termina mais perto da borda direita dele: o IRRF de quem fica isento sai só com a alíquota (22,50) na
 * coluna Qtde e sem valor, e não vira um desconto de R$ 22,50.
 */
function itemDeTrechos(
  trechos: TrechoPdf[],
  tipo: ItemFolhaSigrh["tipo"],
  colunas: ColunasMetade | null,
): ItemFolhaSigrh | null {
  const nome = trechos.find((t) => paraCentavos(t.texto) === null);
  const numeros = trechos.filter((t) => paraCentavos(t.texto) !== null);
  if (!nome || !numeros.length) return null;
  const ehValor = (t: TrechoPdf) =>
    colunas ? Math.abs(t.xFim - colunas.valorFim) <= Math.abs(t.xFim - colunas.qtdeFim) : t === numeros[numeros.length - 1];
  const valor = numeros.filter(ehValor).pop();
  const qtde = numeros.find((t) => !ehValor(t));
  if (!valor) return null; // rubrica impressa sem valor (ex.: IRRF isento): nada a lançar
  const ref = nome.texto.match(/^(.*?)\s*\((\d{6})\)$/);
  return {
    codigo: null,
    descricao: (ref ? ref[1] : nome.texto).trim(),
    tipo,
    quantidade: qtde?.texto ?? null,
    competencia: ref ? competenciaDeAnoMes(ref[2]) : null,
    centavos: paraCentavos(valor.texto) ?? 0,
  };
}

export function interpretarFpag10(linhas: LinhaPdf[]): Leitura {
  const problemas: ProblemaLeitura[] = [];
  const vinculos: VinculoLido[] = [];
  let competencia: CompetenciaFolha | null = null;
  let xDesconto = 300;
  let colProv: ColunasMetade | null = null;
  let colDesc: ColunasMetade | null = null;
  let atual: VinculoLido | null = null;
  let noTotalOrgao = false;
  let totalOrgao: { proventos: number; descontos: number } | null = null;

  for (const linha of linhas) {
    const texto = textoLinha(linha);
    const ref = texto.match(/Referencia\s*:\s*(\d{2})\/(\d{4})/i);
    if (ref) {
      competencia ??= { mes: Number(ref[1]), ano: Number(ref[2]) };
      continue;
    }
    const tituloDesconto = linha.trechos.find((t) => t.texto === "Desconto");
    if (tituloDesconto && linha.trechos[0]?.texto === "Provento") {
      xDesconto = tituloDesconto.x - 2;
      const colunas = (qtde?: TrechoPdf, valor?: TrechoPdf) =>
        qtde && valor ? { qtdeFim: qtde.xFim, valorFim: valor.xFim } : null;
      const titulos = (texto: string, desconto: boolean) =>
        linha.trechos.find((t) => t.texto === texto && t.x >= xDesconto === desconto);
      colProv = colunas(titulos("Qtde", false), titulos("Valor", false));
      colDesc = colunas(titulos("Qtde", true), titulos("Valor", true));
      continue;
    }
    if (/^Resumo/i.test(texto)) break;
    if (/^Total\s+(?!Liquido)/i.test(texto)) {
      atual = null;
      noTotalOrgao = true;
      continue;
    }

    const [t0, t1] = linha.trechos;
    const cpfNome = t1?.texto.match(/^(\d{11})\s+(.+)$/);
    if (t0 && /^\d{9}$/.test(t0.texto) && cpfNome) {
      const conta = linha.trechos.map((t) => t.texto.match(/^(\d{3})\/(\d+)\/([\dX]+)$/i)).find(Boolean);
      const dep = texto.match(/Dep IR\s*(\d+)/i);
      const funcao = linha.trechos.slice(2).find((t) => !/^\d{3}\//.test(t.texto) && !/^Dep IR/i.test(t.texto));
      atual = {
        matricula: t0.texto,
        cpf: cpfNome[1],
        nome: cpfNome[2].trim(),
        funcao: funcao?.texto.trim() ?? "",
        bancoCodigo: conta?.[1] ?? null,
        bancoAgencia: conta?.[2] ?? null,
        bancoConta: conta?.[3] ?? null,
        dependentesIr: dep ? Number(dep[1]) : null,
        itens: [],
        impresso: null,
      };
      vinculos.push(atual);
      continue;
    }

    if (/^Total Liquido/i.test(texto)) {
      const valores = linha.trechos.filter((t) => paraCentavos(t.texto) !== null);
      const esquerda = valores.filter((t) => t.x < xDesconto);
      const direita = valores.filter((t) => t.x >= xDesconto);
      const totais = {
        proventos: paraCentavos(esquerda[1]?.texto) ?? 0,
        descontos: paraCentavos(direita[direita.length - 1]?.texto) ?? 0,
      };
      if (noTotalOrgao) {
        totalOrgao = totais;
        noTotalOrgao = false;
      } else if (atual) {
        atual.impresso = totais;
      }
      continue;
    }

    if (!atual || IGNORAR_FPAG10.test(linha.trechos[0]?.texto ?? "")) continue;
    const prov = itemDeTrechos(linha.trechos.filter((t) => t.x < xDesconto), "provento", colProv);
    const desc = itemDeTrechos(linha.trechos.filter((t) => t.x >= xDesconto), "desconto", colDesc);
    if (prov) atual.itens.push(prov);
    if (desc) atual.itens.push(desc);
  }

  if (!totalOrgao && vinculos.length) {
    problemas.push({ gravidade: "erro", mensagem: "Não achei o total do órgão no fim do espelho: o arquivo está incompleto?" });
  }
  return montarResultado("fpag10", competencia, vinculos, totalOrgao, problemas);
}

// ---------------------------------------------------------------------------------------------------------
// Relatório analítico de conferência (PDF, SIGRH novo)
// ---------------------------------------------------------------------------------------------------------

export function interpretarConferenciaSigrh(linhas: LinhaPdf[]): Leitura {
  const problemas: ProblemaLeitura[] = [];
  const vinculos: VinculoLido[] = [];
  let competencia: CompetenciaFolha | null = null;
  let atual: VinculoLido | null = null;
  const geral: { proventos?: number; descontos?: number } = {};
  const informativos = new Set<string>();

  for (const linha of linhas) {
    const texto = textoLinha(linha);
    const comp = texto.match(/Compet[eê]ncia:\s*(\d{2})\/(\d{4})/i);
    if (comp) {
      competencia ??= { mes: Number(comp[1]), ano: Number(comp[2]) };
      continue;
    }
    const totalGeral = texto.match(/Total de (proventos|descontos) geral:\s*(?:R\$\s*)?([\d.]+,\d{2})/i);
    if (totalGeral) {
      geral[totalGeral[1].toLowerCase() === "proventos" ? "proventos" : "descontos"] = paraCentavos(totalGeral[2]) ?? 0;
      atual = null;
      continue;
    }
    if (/^Total de servidores geral/i.test(texto)) {
      atual = null;
      continue;
    }

    const [t0, t1] = linha.trechos;
    const cpf = linha.trechos.find((t) => /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(t.texto));
    if (t0 && /^\d{7}-\d-\d{2}$/.test(t0.texto) && cpf && t1) {
      const depois = linha.trechos.slice(linha.trechos.indexOf(cpf) + 1);
      const banco = depois.find((t) => /^\d{3}$/.test(t.texto));
      const posBanco = banco ? depois.indexOf(banco) : -1;
      const nref = linha.trechos.find((t) => /^[A-Z]{2,6}\/\d{1,3}$/.test(t.texto));
      atual = {
        matricula: t0.texto,
        cpf: soDigitos(cpf.texto),
        nome: t1.texto.trim(),
        funcao: nref?.texto ?? "",
        bancoCodigo: banco?.texto ?? null,
        bancoAgencia: posBanco >= 0 ? depois[posBanco + 1]?.texto ?? null : null,
        bancoConta: posBanco >= 0 ? depois[depois.length - 1]?.texto ?? null : null,
        dependentesIr: null,
        itens: [],
        impresso: null,
      };
      vinculos.push(atual);
      continue;
    }

    const totais = texto.match(/Provento:\s*([\d.]+,\d{2}).*Desconto:\s*([\d.]+,\d{2})/i);
    if (totais) {
      if (atual) atual.impresso = { proventos: paraCentavos(totais[1]) ?? 0, descontos: paraCentavos(totais[2]) ?? 0 };
      continue;
    }

    const codigo = t0?.texto.match(/^(\d{2})-(\d{4})-(\d{2})$/);
    if (!atual || !codigo || !t1) continue;
    const valor = paraCentavos(linha.trechos[linha.trechos.length - 1].texto);
    if (valor === null || linha.trechos.length < 3) continue;
    if (codigo[1] !== "01" && codigo[1] !== "05") {
      informativos.add(`${t0.texto} ${t1.texto}`);
      continue;
    }
    const meio = linha.trechos.slice(2, -1).map((t) => t.texto);
    atual.itens.push({
      codigo: `${codigo[1]}-${codigo[2]}`,
      descricao: t1.texto.trim(),
      tipo: codigo[1] === "01" ? "provento" : "desconto",
      quantidade: meio.length ? meio.join(" ") : null,
      competencia: null,
      centavos: valor,
    });
  }

  if (informativos.size) {
    problemas.push({
      gravidade: "aviso",
      mensagem: `Rubricas informativas (nem provento nem desconto) ficaram de fora: ${[...informativos].join("; ")}.`,
    });
  }
  const totalOrgao =
    geral.proventos !== undefined && geral.descontos !== undefined
      ? { proventos: geral.proventos, descontos: geral.descontos }
      : null;
  if (!totalOrgao && vinculos.length) {
    problemas.push({ gravidade: "erro", mensagem: "Não achei os totais gerais no fim do relatório: o arquivo está incompleto?" });
  }
  return montarResultado("conferencia", competencia, vinculos, totalOrgao, problemas);
}

// ---------------------------------------------------------------------------------------------------------
// Planilha analítica por evento
// ---------------------------------------------------------------------------------------------------------

/** Cabeçalhos que identificam a planilha analítica do SIGRH. */
export const COLUNAS_ANALITICA = ["CdNomeacao", "CPF", "NmFuncionario", "NmEvento", "TpEvento", "Valor"] as const;

export function ehPlanilhaAnalitica(cabecalhos: string[]): boolean {
  return COLUNAS_ANALITICA.every((c) => cabecalhos.includes(c));
}

export function interpretarAnaliticaSigrh(
  linhas: Record<string, unknown>[],
  nomeArquivo: string,
  anoPadrao: number,
): Leitura {
  const problemas: ProblemaLeitura[] = [];
  const porVinculo = new Map<string, VinculoLido>();
  const tiposIgnorados = new Set<string>();
  let maiorRetro: string | null = null;

  for (const [i, r] of linhas.entries()) {
    const texto = (c: string) => String(r[c] ?? "").trim();
    const matricula = soDigitos(texto("CdNomeacao"));
    const cpf = soDigitos(texto("CPF")).padStart(11, "0");
    if (!matricula && !soDigitos(texto("CPF"))) continue;
    const tp = texto("TpEvento").toUpperCase();
    if (tp !== "P" && tp !== "D") {
      tiposIgnorados.add(tp || "(vazio)");
      continue;
    }
    const centavos = paraCentavos(r["Valor"]);
    if (centavos === null) {
      problemas.push({ gravidade: "erro", mensagem: `Linha ${i + 2} da planilha: valor "${texto("Valor")}" inválido.` });
      continue;
    }
    const chave = `${matricula}|${cpf}`;
    let v = porVinculo.get(chave);
    if (!v) {
      const dep = Number(texto("DependenteIR"));
      v = {
        matricula: matricula.padStart(9, "0"),
        cpf,
        nome: texto("NmFuncionario"),
        funcao: texto("NmFuncao"),
        bancoCodigo: texto("CdBanco") ? texto("CdBanco").padStart(3, "0") : null,
        bancoAgencia: texto("CdAgencia") || null,
        bancoConta: texto("CdConta") || null,
        dependentesIr: Number.isFinite(dep) ? dep : null,
        itens: [],
        impresso: null,
      };
      porVinculo.set(chave, v);
    }
    const competencia = competenciaDeAnoMes(texto("AnoMesReferencia"));
    if (competencia && (!maiorRetro || competencia > maiorRetro)) maiorRetro = competencia;
    const qtde = texto("Qtde");
    v.itens.push({
      codigo: texto("CdEvento") ? texto("CdEvento").padStart(4, "0") : null,
      descricao: texto("NmEvento"),
      tipo: tp === "P" ? "provento" : "desconto",
      quantidade: qtde || null,
      competencia,
      centavos,
    });
  }

  if (tiposIgnorados.size) {
    problemas.push({ gravidade: "aviso", mensagem: `Linhas de tipo ${[...tiposIgnorados].join(", ")} (nem P nem D) ficaram de fora.` });
  }

  const doNome = competenciaDoNomeArquivo(nomeArquivo, maiorRetro ? Number(maiorRetro.slice(0, 4)) : anoPadrao);
  if (doNome?.anoDeduzido) {
    problemas.push({
      gravidade: "aviso",
      mensagem: `O nome do arquivo não traz o ano: usei ${doNome.ano}. Se não for, renomeie o arquivo com o mês e o ano (ex.: ABRIL-2026).`,
    });
  }
  if (!doNome) {
    problemas.push({
      gravidade: "erro",
      mensagem: "A planilha não traz a competência: coloque o mês no nome do arquivo (ex.: ESPELHO ABRIL 2026.xlsx).",
    });
  }
  return montarResultado(
    "analitica",
    doNome ? { ano: doNome.ano, mes: doNome.mes } : null,
    [...porVinculo.values()],
    null,
    problemas,
  );
}

// ---------------------------------------------------------------------------------------------------------
// PDF: qual dos dois formatos
// ---------------------------------------------------------------------------------------------------------

export function interpretarPdfSigrh(linhas: LinhaPdf[]): Leitura {
  const inicio = linhas.slice(0, 15).map(textoLinha).join("\n");
  if (/FPAG10/i.test(inicio)) return interpretarFpag10(linhas);
  if (/conferência de folha|conferencia de folha/i.test(inicio)) return interpretarConferenciaSigrh(linhas);
  return {
    linhas: [],
    problemas: [
      {
        gravidade: "erro",
        mensagem:
          "PDF não reconhecido. Use o espelho FPAG10 (Folha Analítica por Funcionário) ou o relatório analítico " +
          "de conferência de folha do SIGRH.",
      },
    ],
    cabecalho: {},
    parametros: {},
  };
}

/** Linha no formato que a RPC `importar_folha_sigrh` recebe (valores em reais, com centavos). */
export function paraContratoFolhaSigrh(l: LinhaFolhaSigrh, indice: number) {
  return {
    indice,
    cpf: l.cpf,
    matriculas: l.matriculas,
    nome: l.nome,
    funcao: l.funcao,
    banco_codigo: l.bancoCodigo,
    banco_agencia: l.bancoAgencia,
    banco_conta: l.bancoConta,
    dependentes_ir: l.dependentesIr,
    itens: l.itens.map((i) => ({
      codigo: i.codigo,
      descricao: i.descricao,
      tipo: i.tipo,
      quantidade: i.quantidade,
      competencia: i.competencia,
      valor: (i.centavos / 100).toFixed(2),
    })),
  };
}
