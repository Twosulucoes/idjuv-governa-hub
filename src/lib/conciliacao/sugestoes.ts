/**
 * Sugestão de casamentos pela IA (Edge Function `conciliacao-ia-sugestoes`): o que vai para ela e a conferência do
 * que volta. Só as pendências saem do navegador, com ids curtos (`p0`, `p1`…) e CPF/CNPJ do histórico apagados.
 * Nada casa sozinho: cada sugestão válida aparece na tela e só entra no quadro se o usuário aceitar, pela mesma
 * regra do casamento manual (`casarManual`: débitos = créditos, com justificativa).
 */

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
