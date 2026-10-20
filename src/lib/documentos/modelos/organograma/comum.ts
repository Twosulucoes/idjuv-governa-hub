/** Unidade do organograma como os documentos a imprimem (já sem os tipos do banco). */
export interface UnidadeOrganograma {
  id: string;
  /** Unidade a que esta se subordina; ausente (ou fora da lista) = topo da estrutura. */
  superiorId?: string | null;
  /** Nível cadastrado (desempate da ordem entre irmãs). */
  nivel: number;
  nome: string;
  sigla?: string | null;
  /** Rótulo do tipo (Diretoria, Divisão…). */
  tipo: string;
  /** Servidores lotados na própria unidade (sem as subordinadas). */
  quantidadeServidores: number;
}

export interface NoOrganograma<U extends UnidadeOrganograma> {
  unidade: U;
  filhos: NoOrganograma<U>[];
}

const ordem = (a: UnidadeOrganograma, b: UnidadeOrganograma): number => a.nivel - b.nivel || a.nome.localeCompare(b.nome, 'pt-BR');

/**
 * Árvore pela subordinação (`superiorId`), irmãs por nível e nome. Unidade cujo superior não está na lista
 * vira topo, e um ciclo no cadastro não trava nem some com unidade: toda unidade entra uma vez.
 */
export function arvoreOrganograma<U extends UnidadeOrganograma>(unidades: U[]): NoOrganograma<U>[] {
  const ids = new Set(unidades.map((u) => u.id));
  const filhosDe = new Map<string | null, U[]>();
  for (const u of unidades) {
    const pai = u.superiorId && u.superiorId !== u.id && ids.has(u.superiorId) ? u.superiorId : null;
    filhosDe.set(pai, [...(filhosDe.get(pai) ?? []), u]);
  }
  const visitadas = new Set<string>();
  const montar = (u: U): NoOrganograma<U> => {
    visitadas.add(u.id);
    const filhos: NoOrganograma<U>[] = [];
    for (const f of [...(filhosDe.get(u.id) ?? [])].sort(ordem)) if (!visitadas.has(f.id)) filhos.push(montar(f));
    return { unidade: u, filhos };
  };
  const raizes = [...(filhosDe.get(null) ?? [])].sort(ordem).map(montar);
  for (const u of unidades) if (!visitadas.has(u.id)) raizes.push(montar(u));
  return raizes;
}

/** Percurso em pré-ordem com a profundidade (0 = topo). */
export function emOrdemHierarquica<U extends UnidadeOrganograma>(nos: NoOrganograma<U>[], profundidade = 0): { unidade: U; profundidade: number }[] {
  return nos.flatMap((n) => [{ unidade: n.unidade, profundidade }, ...emOrdemHierarquica(n.filhos, profundidade + 1)]);
}

export const totalServidores = (unidades: UnidadeOrganograma[]): number => unidades.reduce((s, u) => s + u.quantidadeServidores, 0);

export const rotuloUnidade = (u: UnidadeOrganograma): string => u.sigla || u.nome;

export const dataDoArquivo = (): string => new Date().toISOString().slice(0, 10);
