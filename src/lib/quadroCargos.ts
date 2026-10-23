/**
 * Resumo do quadro de cargos comissionados a partir das vagas públicas
 * (`transparencia_cargos_publicos`, uma linha por vaga). Substitui o antigo
 * `public/data/resumo.json`: total, ocupação, custo mensal e divisão por
 * diretoria saem do cadastro de cargos (`cargos`, `composicao_cargos`).
 */

/** Campos da vaga que o resumo usa (subconjunto de `VagaCargoPublico`). */
export interface VagaParaResumo {
  vencimento: number | null;
  diretoria: string | null;
  diretoria_tipo: string | null;
  ocupante: string | null;
  lei_criacao_numero: string | null;
  lei_criacao_data: string | null;
}

export interface ResumoDiretoria {
  /** Sigla (ou nome) da diretoria; `null` para vaga sem unidade. */
  diretoria: string | null;
  /** Tipo da unidade no organograma (`presidencia`, `diretoria`…). */
  tipo: string | null;
  quantidade: number;
  valorMensal: number;
}

export interface ResumoQuadroCargos {
  total: number;
  ocupados: number;
  vagos: number;
  /** 0 a 100, com duas casas. */
  percentualOcupacao: number;
  valorMensal: number;
  porDiretoria: ResumoDiretoria[];
  /** Leis de criação dos cargos, ex.: "Lei nº 2.301, de 29/12/2025". */
  leis: string[];
}

export function resumirQuadroCargos(vagas: VagaParaResumo[]): ResumoQuadroCargos {
  const porDiretoria = new Map<string, ResumoDiretoria>();
  const leis = new Set<string>();
  let ocupados = 0;
  let valorMensal = 0;

  for (const v of vagas) {
    const valor = Number(v.vencimento ?? 0);
    valorMensal += valor;
    if (v.ocupante) ocupados += 1;

    const chave = v.diretoria ?? '';
    const atual = porDiretoria.get(chave) ?? {
      diretoria: v.diretoria,
      tipo: v.diretoria_tipo,
      quantidade: 0,
      valorMensal: 0,
    };
    atual.quantidade += 1;
    atual.valorMensal += valor;
    porDiretoria.set(chave, atual);

    if (v.lei_criacao_numero) {
      const data = v.lei_criacao_data
        ? `, de ${new Date(`${v.lei_criacao_data}T00:00:00`).toLocaleDateString('pt-BR')}`
        : '';
      leis.add(`Lei nº ${v.lei_criacao_numero}${data}`);
    }
  }

  const total = vagas.length;
  return {
    total,
    ocupados,
    vagos: total - ocupados,
    percentualOcupacao: total ? Math.round((ocupados / total) * 10000) / 100 : 0,
    valorMensal: Math.round(valorMensal * 100) / 100,
    porDiretoria: [...porDiretoria.values()].sort((a, b) =>
      (a.diretoria ?? '￿').localeCompare(b.diretoria ?? '￿', 'pt-BR'),
    ),
    leis: [...leis].sort(),
  };
}

/** Soma as vagas das diretorias de um tipo do organograma (ex.: `presidencia`). */
export function vagasPorTipo(resumo: ResumoQuadroCargos, tipo: string): number {
  return resumo.porDiretoria
    .filter((d) => d.tipo === tipo)
    .reduce((soma, d) => soma + d.quantidade, 0);
}
