/**
 * Regras puras dos relatórios gerenciais de folha de pagamento (resumo do ano, por unidade
 * e por rubrica). Sem DOM e sem Supabase: agregação, totais, rótulos e conversão das linhas
 * para planilha. Testável em Node.
 *
 * LGPD: só agregados. Nenhuma linha identifica servidor (sem nome, CPF, matrícula, banco
 * ou PIS); as fichas chegam já sem essas colunas e saem somadas por unidade ou rubrica.
 */
import { STATUS_FOLHA_LABELS, TIPO_FOLHA_LABELS } from "@/types/folha";
import { SEM_UNIDADE, arredondar2, somar } from "@/lib/relatoriosRHRegras";

// ============================================
// TIPOS
// ============================================

/** Linha de `folhas_pagamento` como sai do select explícito do hook. */
export interface FolhaResumo {
  id: string;
  competencia_ano: number;
  competencia_mes: number;
  tipo_folha: string;
  status: string | null;
  quantidade_servidores: number | null;
  total_bruto: number | null;
  total_descontos: number | null;
  total_liquido: number | null;
  total_inss_servidor: number | null;
  total_inss_patronal: number | null;
  total_irrf: number | null;
  total_encargos_patronais: number | null;
}

/** Ficha financeira sem identificação do servidor (só o que entra na agregação por unidade). */
export interface FichaAgregavel {
  unidade_id: string | null;
  unidade_nome: string | null;
  total_proventos: number | null;
  total_descontos: number | null;
  valor_liquido: number | null;
  valor_inss: number | null;
  valor_irrf: number | null;
}

/** Item de ficha financeira (rubrica lançada) de uma folha. */
export interface ItemAgregavel {
  tipo: string;
  descricao: string;
  valor: number | null;
}

export interface AgregadoUnidade {
  unidade: string;
  servidores: number;
  proventos: number;
  descontos: number;
  liquido: number;
  inss: number;
  irrf: number;
}

export interface AgregadoRubrica {
  tipo: string;
  descricao: string;
  /** Quantidade de fichas (lançamentos) em que a rubrica aparece. */
  quantidade: number;
  valor: number;
}

/** Rubricas de um tipo (provento/desconto) com subtotal. */
export interface BlocoRubricas {
  tipo: string;
  rotulo: string;
  itens: AgregadoRubrica[];
  subtotal: number;
}

export interface TotaisFolhas {
  folhas: number;
  /** Soma de `quantidade_servidores` das folhas (fichas), não servidores distintos. */
  fichas: number;
  bruto: number;
  descontos: number;
  liquido: number;
  inssServidor: number;
  inssPatronal: number;
  irrf: number;
  encargos: number;
}

// ============================================
// RÓTULOS
// ============================================

/**
 * Tipos de folha do enum `tipo_folha` do banco. `TIPO_FOLHA_LABELS` (types/folha.ts) ainda
 * usa chaves antigas (`decimo_terceiro`, `ferias`); aqui entram também os valores reais do enum.
 */
export const TIPO_FOLHA_RELATORIO_LABELS: Record<string, string> = {
  ...TIPO_FOLHA_LABELS,
  "13_1a_parcela": "13º Salário - 1ª parcela",
  "13_2a_parcela": "13º Salário - 2ª parcela",
  retroativos: "Retroativos",
};

/** Ordem e rótulo dos blocos do relatório por rubrica (CHECK da tabela: provento, desconto). */
export const TIPOS_RUBRICA_ORDEM: Array<{ tipo: string; rotulo: string }> = [
  { tipo: "provento", rotulo: "Proventos" },
  { tipo: "desconto", rotulo: "Descontos" },
];

/**
 * Status em que a folha já tem fichas processadas e pode ser detalhada por unidade/rubrica.
 * No fluxo atual (`processar_folha`), o processamento devolve a folha a `aberta`; `fechada` e
 * `reaberta` vêm depois. `previa` e `processando` ficam de fora (sem fichas ou em andamento).
 */
const STATUS_COM_DETALHE = new Set(["aberta", "fechada", "reaberta"]);

export function folhaPermiteDetalhe(status: string | null | undefined, quantidadeServidores?: number | null): boolean {
  if (!status || !STATUS_COM_DETALHE.has(status)) return false;
  // `aberta` é o DEFAULT da coluna: uma folha criada por outro caminho pode estar sem fichas.
  return quantidadeServidores === undefined || (Number(quantidadeServidores) || 0) > 0;
}

/** "MM/AAAA". */
export function rotuloCompetencia(ano: number, mes: number): string {
  return `${String(mes).padStart(2, "0")}/${ano}`;
}

export function rotuloTipoFolha(tipo: string | null | undefined): string {
  return (tipo && TIPO_FOLHA_RELATORIO_LABELS[tipo]) || tipo || "-";
}

export function rotuloStatusFolha(status: string | null | undefined): string {
  return (status && STATUS_FOLHA_LABELS[status as keyof typeof STATUS_FOLHA_LABELS]) || status || "-";
}

/** "MM/AAAA - Tipo (Status)", usado no select da folha e no subtítulo do PDF. */
export function descreverFolha(f: Pick<FolhaResumo, "competencia_ano" | "competencia_mes" | "tipo_folha" | "status">): string {
  return `${rotuloCompetencia(f.competencia_ano, f.competencia_mes)} - ${rotuloTipoFolha(f.tipo_folha)} (${rotuloStatusFolha(f.status)})`;
}

// ============================================
// AGREGAÇÃO
// ============================================

/**
 * Nome da unidade gravado na ficha. `processar_folha_pagamento` grava
 * `COALESCE(sigla,'') || ' - ' || COALESCE(nome,'')`, então servidor sem lotação vira " - " e sigla
 * nula vira "- Nome": o separador solto é removido e, sem `unidade_id` nem nome, é "Sem unidade".
 */
export function nomeUnidadeFicha(f: Pick<FichaAgregavel, "unidade_id" | "unidade_nome">): string {
  const nome = (f.unidade_nome ?? "").replace(/^\s*-\s*/, "").replace(/\s*-\s*$/, "").trim();
  if (!nome) return SEM_UNIDADE;
  return f.unidade_id == null && nome === "-" ? SEM_UNIDADE : nome;
}

/**
 * Fichas somadas por unidade (servidores = fichas da unidade). Ordem alfabética
 * (pt-BR), com "Sem unidade" por último.
 */
export function agregarFichasPorUnidade(fichas: FichaAgregavel[]): AgregadoUnidade[] {
  const mapa = new Map<string, AgregadoUnidade>();
  for (const f of fichas) {
    const unidade = nomeUnidadeFicha(f);
    let a = mapa.get(unidade);
    if (!a) {
      a = { unidade, servidores: 0, proventos: 0, descontos: 0, liquido: 0, inss: 0, irrf: 0 };
      mapa.set(unidade, a);
    }
    a.servidores += 1;
    a.proventos += Number(f.total_proventos) || 0;
    a.descontos += Number(f.total_descontos) || 0;
    a.liquido += Number(f.valor_liquido) || 0;
    a.inss += Number(f.valor_inss) || 0;
    a.irrf += Number(f.valor_irrf) || 0;
  }
  return [...mapa.values()]
    .map((a) => ({
      ...a,
      proventos: arredondar2(a.proventos),
      descontos: arredondar2(a.descontos),
      liquido: arredondar2(a.liquido),
      inss: arredondar2(a.inss),
      irrf: arredondar2(a.irrf),
    }))
    .sort((a, b) => {
      const semA = a.unidade === SEM_UNIDADE;
      const semB = b.unidade === SEM_UNIDADE;
      if (semA !== semB) return semA ? 1 : -1;
      return a.unidade.localeCompare(b.unidade, "pt-BR");
    });
}

/**
 * Itens somados por `tipo` + `descricao`, em blocos por tipo (proventos, depois descontos; o
 * CHECK da tabela só admite esses dois). Dentro do bloco, maior valor primeiro.
 * Só devolve blocos com itens.
 */
export function agregarItensPorRubrica(itens: ItemAgregavel[]): BlocoRubricas[] {
  const mapa = new Map<string, AgregadoRubrica>();
  for (const i of itens) {
    const tipo = i.tipo;
    const descricao = i.descricao?.trim() || "(sem descrição)";
    const k = `${tipo}\u0000${descricao}`;
    let a = mapa.get(k);
    if (!a) {
      a = { tipo, descricao, quantidade: 0, valor: 0 };
      mapa.set(k, a);
    }
    a.quantidade += 1;
    a.valor += Number(i.valor) || 0;
  }
  const todos = [...mapa.values()].map((a) => ({ ...a, valor: arredondar2(a.valor) }));

  return TIPOS_RUBRICA_ORDEM
    .map(({ tipo, rotulo }) => {
      const doTipo = todos
        .filter((a) => a.tipo === tipo)
        .sort((a, b) => b.valor - a.valor || a.descricao.localeCompare(b.descricao, "pt-BR"));
      return { tipo, rotulo, itens: doTipo, subtotal: arredondar2(somar(doTipo, (a) => a.valor)) };
    })
    .filter((b) => b.itens.length > 0);
}

/** Líquido do relatório por rubrica: subtotal de proventos menos o de descontos. */
export function liquidoBlocos(blocos: BlocoRubricas[]): number {
  const proventos = blocos.find((b) => b.tipo === "provento")?.subtotal ?? 0;
  const descontos = blocos.find((b) => b.tipo === "desconto")?.subtotal ?? 0;
  return arredondar2(proventos - descontos);
}

/**
 * Totais do conjunto de folhas (resumo do ano). `fichas` soma `quantidade_servidores` das folhas
 * (um servidor conta em cada folha do ano), por isso não é "servidores".
 */
export function totalizarFolhas(folhas: FolhaResumo[]): TotaisFolhas {
  return {
    folhas: folhas.length,
    fichas: somar(folhas, (f) => f.quantidade_servidores),
    bruto: arredondar2(somar(folhas, (f) => f.total_bruto)),
    descontos: arredondar2(somar(folhas, (f) => f.total_descontos)),
    liquido: arredondar2(somar(folhas, (f) => f.total_liquido)),
    inssServidor: arredondar2(somar(folhas, (f) => f.total_inss_servidor)),
    inssPatronal: arredondar2(somar(folhas, (f) => f.total_inss_patronal)),
    irrf: arredondar2(somar(folhas, (f) => f.total_irrf)),
    encargos: arredondar2(somar(folhas, (f) => f.total_encargos_patronais)),
  };
}

/** Totais dos agregados por unidade (rodapé do relatório). */
export function totalizarUnidades(agregados: AgregadoUnidade[]): Omit<AgregadoUnidade, "unidade"> {
  return {
    servidores: somar(agregados, (a) => a.servidores),
    proventos: arredondar2(somar(agregados, (a) => a.proventos)),
    descontos: arredondar2(somar(agregados, (a) => a.descontos)),
    liquido: arredondar2(somar(agregados, (a) => a.liquido)),
    inss: arredondar2(somar(agregados, (a) => a.inss)),
    irrf: arredondar2(somar(agregados, (a) => a.irrf)),
  };
}

/** Total de rubricas distintas (para a pré-visualização). */
export function contarRubricas(blocos: BlocoRubricas[]): number {
  return somar(blocos, (b) => b.itens.length);
}

// ============================================
// LINHAS PARA PLANILHA (rótulos em português)
// ============================================

export function linhaFolhaParaPlanilha(f: FolhaResumo): Record<string, unknown> {
  return {
    Competência: rotuloCompetencia(f.competencia_ano, f.competencia_mes),
    Tipo: rotuloTipoFolha(f.tipo_folha),
    Status: rotuloStatusFolha(f.status),
    Servidores: Number(f.quantidade_servidores) || 0,
    "Bruto (R$)": Number(f.total_bruto) || 0,
    "Descontos (R$)": Number(f.total_descontos) || 0,
    "Líquido (R$)": Number(f.total_liquido) || 0,
    "INSS servidor (R$)": Number(f.total_inss_servidor) || 0,
    "INSS patronal (R$)": Number(f.total_inss_patronal) || 0,
    "IRRF (R$)": Number(f.total_irrf) || 0,
    "Encargos patronais (R$)": Number(f.total_encargos_patronais) || 0,
  };
}

export function linhaUnidadeParaPlanilha(a: AgregadoUnidade): Record<string, unknown> {
  return {
    Unidade: a.unidade,
    Servidores: a.servidores,
    "Proventos (R$)": a.proventos,
    "Descontos (R$)": a.descontos,
    "Líquido (R$)": a.liquido,
    "INSS (R$)": a.inss,
    "IRRF (R$)": a.irrf,
  };
}

export function linhaRubricaParaPlanilha(a: AgregadoRubrica): Record<string, unknown> {
  const rotulo = TIPOS_RUBRICA_ORDEM.find((t) => t.tipo === a.tipo)?.rotulo ?? a.tipo;
  return {
    Tipo: rotulo,
    Rubrica: a.descricao,
    "Qtde. fichas": a.quantidade,
    "Valor (R$)": a.valor,
  };
}

/** Blocos achatados para a planilha (uma linha por rubrica, na ordem dos blocos). */
export function linhasRubricasParaPlanilha(blocos: BlocoRubricas[]): Record<string, unknown>[] {
  return blocos.flatMap((b) => b.itens.map(linhaRubricaParaPlanilha));
}
