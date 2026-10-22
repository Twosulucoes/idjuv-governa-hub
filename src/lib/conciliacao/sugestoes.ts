/**
 * Sugestões de casamento para as pendências: a busca de somas, feita aqui no navegador (`sugestoesPorSoma`), e a IA.
 *
 * Sugestão de casamentos pela IA (Edge Function `conciliacao-ia-sugestoes`): o que vai para ela e a conferência do
 * que volta. Só as pendências saem do navegador, com ids curtos (`p0`, `p1`…) e CPF/CNPJ do histórico apagados.
 * Nada casa sozinho: cada sugestão válida aparece na tela e só entra no quadro se o usuário aceitar, pela mesma
 * regra do casamento manual (`casarManual`: débitos = créditos, com justificativa).
 */

import { perto } from "./casamento";
import { saldoDoGrupo } from "./registro";
import type { ItemConciliacao, LadoConciliacao, NaturezaConciliacao } from "./tipos";

/** Pendência como a função recebe. */
export interface PendenciaParaIa {
  id: string;
  lado: LadoConciliacao;
  natureza: NaturezaConciliacao;
  data: string;
  documento: string;
  tipo: string;
  historico: string;
  valorCentavos: number;
}

/** Sugestão como a função devolve (ids da tela, depois de `sugestoesValidas`). */
export interface SugestaoCasamento {
  ids: string[];
  motivo: string;
  /** Quem sugeriu: a busca de somas do sistema ou a IA (padrão). */
  fonte?: "soma" | "ia";
}

/** Máximo de pendências num pedido (o resto fica de fora da sugestão). */
export const LIMITE_PENDENCIAS_IA = 400;

/** Troca por *** o que parece CPF ou CNPJ, com ou sem pontuação. */
export function mascararDocumentosPessoais(texto: string): string {
  return texto
    .replace(/\b\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}\b/g, "***")
    .replace(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/g, "***");
}

/** Pedido da função a partir das pendências da tela, e o caminho de volta do id curto para o id da tela. */
export function pedidoDeSugestoes(
  pendentes: ItemConciliacao[],
  comHistorico: boolean,
): { pendencias: PendenciaParaIa[]; idDaTela: Map<string, string> } {
  const idDaTela = new Map<string, string>();
  const pendencias = pendentes.slice(0, LIMITE_PENDENCIAS_IA).map((p, i) => {
    const id = `p${i}`;
    idDaTela.set(id, p.id);
    return {
      id,
      lado: p.lado,
      natureza: p.natureza,
      data: p.data,
      documento: p.documento.slice(0, 40),
      tipo: p.tipo.slice(0, 10),
      historico: comHistorico ? mascararDocumentosPessoais(p.historico).slice(0, 200) : "",
      valorCentavos: p.valorCentavos,
    };
  });
  return { pendencias, idDaTela };
}

/**
 * Sugestões que podem ir para a tela: ids conhecidos e ainda pendentes, dois ou mais por grupo, cada item numa
 * sugestão só, débitos = créditos e motivo dito. O resto é descartado em silêncio (a IA pode errar).
 */
export function sugestoesValidas(
  pendentes: ItemConciliacao[],
  resposta: { ids: unknown; motivo: unknown }[],
  idDaTela: Map<string, string>,
): SugestaoCasamento[] {
  const porId = new Map(pendentes.map((p) => [p.id, p]));
  const usados = new Set<string>();
  const validas: SugestaoCasamento[] = [];
  for (const s of resposta) {
    if (!Array.isArray(s.ids) || typeof s.motivo !== "string" || !s.motivo.trim()) continue;
    const ids = [...new Set(s.ids.map((id) => (typeof id === "string" ? idDaTela.get(id) : undefined)))];
    if (ids.length < 2 || ids.some((id) => !id || !porId.has(id) || usados.has(id))) continue;
    const grupo = ids.map((id) => porId.get(id!)!);
    if (saldoDoGrupo(grupo) !== 0) continue;
    ids.forEach((id) => usados.add(id!));
    validas.push({ ids: ids as string[], motivo: s.motivo.trim().slice(0, 300) });
  }
  return validas;
}

/** Janela da busca de somas, em dias entre o item e cada parte (pendência antiga só olha para a frente). */
export const JANELA_SOMA_DIAS = 31;
/** Candidatos mais próximos na data que entram na busca de cada item (limita o tempo da busca). */
const MAXIMO_CANDIDATOS = 300;

const DIA = 86_400_000;
const distancia = (a: ItemConciliacao, b: ItemConciliacao) => Math.abs(Date.parse(a.data) - Date.parse(b.data)) / DIA;
const dataCurta = (iso: string) => iso.slice(8, 10) + "/" + iso.slice(5, 7);
const valorBR = (centavos: number) =>
  (centavos / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Busca de somas: para cada pendência (a maior primeiro), um, dois ou três lançamentos do outro lado e da natureza
 * oposta, de datas próximas, que somam o mesmo valor no centavo. É o caso que a regra automática não casa sozinha
 * (datas diferentes, ou mais de uma combinação possível): aqui vira sugestão, com a combinação de datas mais
 * próximas, e o usuário aceita ou recusa. Cada pendência entra numa sugestão só.
 */
export function sugestoesPorSoma(pendentes: ItemConciliacao[]): SugestaoCasamento[] {
  const usados = new Set<string>();
  const sugestoes: SugestaoCasamento[] = [];
  const ordem = [...pendentes].sort((a, b) => b.valorCentavos - a.valorCentavos);
  for (const a of ordem) {
    if (usados.has(a.id)) continue;
    const candidatos = pendentes
      .filter(
        (b) =>
          !usados.has(b.id) &&
          b.lado !== a.lado &&
          b.natureza !== a.natureza &&
          b.valorCentavos <= a.valorCentavos &&
          perto(a, b, JANELA_SOMA_DIAS),
      )
      .sort((x, y) => distancia(a, x) - distancia(a, y))
      .slice(0, MAXIMO_CANDIDATOS);
    let melhor: ItemConciliacao[] | null = null;
    let custoMelhor = Infinity;
    let combinacoes = 0;
    const considerar = (grupo: ItemConciliacao[]) => {
      combinacoes += 1;
      // Menos partes primeiro; entre iguais, as datas mais próximas
      const custo = grupo.length * 1000 + grupo.reduce((s, b) => s + distancia(a, b), 0);
      if (custo < custoMelhor) {
        custoMelhor = custo;
        melhor = grupo;
      }
    };
    // Índice por valor para achar a última parte sem percorrer a lista de novo
    const porValor = new Map<number, number[]>();
    candidatos.forEach((b, i) => porValor.set(b.valorCentavos, [...(porValor.get(b.valorCentavos) ?? []), i]));
    const comValor = (valor: number, depoisDe: number) => (porValor.get(valor) ?? []).filter((k) => k > depoisDe);
    for (const k of comValor(a.valorCentavos, -1)) considerar([candidatos[k]]);
    // Duas ou três partes (mais que isso a combinação deixa de ser evidência)
    for (let i = 0; i < candidatos.length; i++) {
      const resto = a.valorCentavos - candidatos[i].valorCentavos;
      for (const k of comValor(resto, i)) considerar([candidatos[i], candidatos[k]]);
      for (let j = i + 1; j < candidatos.length; j++) {
        const resto2 = resto - candidatos[j].valorCentavos;
        if (resto2 <= 0) continue;
        for (const k of comValor(resto2, j)) considerar([candidatos[i], candidatos[j], candidatos[k]]);
      }
    }
    if (!melhor) continue;
    const partes: ItemConciliacao[] = melhor;
    const ids = [a.id, ...partes.map((b) => b.id)];
    ids.forEach((id) => usados.add(id));
    const lado = (i: ItemConciliacao) => (i.lado === "contabil" ? "do razão" : "do banco");
    const descricao =
      partes.length === 1
        ? `mesmo valor (R$ ${valorBR(a.valorCentavos)}) ${lado(partes[0])} em ${dataCurta(partes[0].data)}`
        : `R$ ${valorBR(a.valorCentavos)} = soma de ${partes.length} lançamentos ${lado(partes[0])} (${partes
            .map((b) => `${valorBR(b.valorCentavos)} em ${dataCurta(b.data)}`)
            .join(" + ")})`;
    const outras = combinacoes > 1 ? `; há ${combinacoes - 1} outra(s) combinação(ões) com o mesmo valor` : "";
    sugestoes.push({ ids, motivo: `Busca de somas: ${descricao}${outras}.`, fonte: "soma" });
  }
  return sugestoes;
}
