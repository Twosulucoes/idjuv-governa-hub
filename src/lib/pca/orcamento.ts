// Orçamento do PCA: total planejado por ação orçamentária × fonte contra o teto (PLOA ou QDD).
// Somas em centavos inteiros; o banco devolve numeric como número ou texto.

export interface TetoOrcamento {
  acao_id: string;
  fonte_recurso_id: string;
  valor_previsto: number | string;
}

export interface ItemOrcamento {
  acao_id: string;
  fonte_recurso_id: string;
  valor_total: number | string | null;
  situacao: string;
}

export interface LinhaOrcamento {
  acaoId: string;
  fonteRecursoId: string;
  teto: number;
  planejado: number;
  /** teto − planejado: positivo sobra, negativo falta */
  diferenca: number;
  estourado: boolean;
}

const centavos = (v: number | string | null | undefined) => Math.round(Number(v ?? 0) * 100) || 0;
const reais = (c: number) => c / 100;

export function calcularOrcamento(tetos: TetoOrcamento[], itens: ItemOrcamento[]): LinhaOrcamento[] {
  const mapa = new Map<string, { acaoId: string; fonteRecursoId: string; teto: number; planejado: number }>();
  const linha = (acaoId: string, fonteRecursoId: string) => {
    const chave = `${acaoId}|${fonteRecursoId}`;
    let l = mapa.get(chave);
    if (!l) {
      l = { acaoId, fonteRecursoId, teto: 0, planejado: 0 };
      mapa.set(chave, l);
    }
    return l;
  };
  for (const t of tetos) linha(t.acao_id, t.fonte_recurso_id).teto += centavos(t.valor_previsto);
  for (const i of itens) {
    if (i.situacao !== 'ativo') continue;
    linha(i.acao_id, i.fonte_recurso_id).planejado += centavos(i.valor_total);
  }
  return [...mapa.values()]
    .map((l) => ({
      acaoId: l.acaoId,
      fonteRecursoId: l.fonteRecursoId,
      teto: reais(l.teto),
      planejado: reais(l.planejado),
      diferenca: reais(l.teto - l.planejado),
      estourado: l.teto - l.planejado < 0,
    }))
    .sort((a, b) => Number(b.estourado) - Number(a.estourado) || a.diferenca - b.diferenca);
}

export function totaisOrcamento(linhas: LinhaOrcamento[]): { teto: number; planejado: number; diferenca: number } {
  const t = linhas.reduce((s, l) => s + centavos(l.teto), 0);
  const p = linhas.reduce((s, l) => s + centavos(l.planejado), 0);
  return { teto: reais(t), planejado: reais(p), diferenca: reais(t - p) };
}
