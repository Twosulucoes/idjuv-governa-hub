import { paragrafo, secao, tabela } from '../../blocos';
import type { Bloco, DocumentoModelo } from '../../tipos';

export interface IndicadorGovernanca {
  titulo: string;
  /** Já formatado (ex.: "87%", "24"). */
  valor: string;
  meta: string;
}

export interface DadosRelatorioGovernanca {
  /** Ano do exercício (ex.: "2025"). */
  exercicio: string;
  indicadores: IndicadorGovernanca[];
  /** Conformidade (%) por mês, na ordem do ano. */
  conformidadeMensal: { mes: string; valor: number }[];
  processosPorArea: { area: string; quantidade: number }[];
  riscos: { nivel: string; quantidade: number }[];
  acoes: { titulo: string; situacao: string }[];
  resumoExecutivo: string[];
  /** Ano das metas (ex.: "2026"). */
  anoMetas: string;
  metas: string[];
}

const lista = (itens: string[]): Bloco[] =>
  itens.length > 0 ? itens.map((t) => paragrafo({ texto: `• ${t}` })) : [paragrafo({ texto: 'Nenhum item informado.' })];

export const relatorioGovernanca: DocumentoModelo<DadosRelatorioGovernanca> = {
  tipo: 'governanca-relatorio-anual',
  familia: 'relatorio',
  titulo: () => 'Relatório anual de governança e integridade',
  subtitulo: (d) => `Exercício ${d.exercicio}`,
  nomeArquivo: (d) => `Relatorio_Governanca_Integridade_${d.exercicio}.pdf`,
  blocos: (d) => [
    secao({ texto: 'Indicadores principais' }),
    tabela({
      colunas: [
        { chave: 'titulo', titulo: 'Indicador', peso: 3 },
        { chave: 'valor', titulo: 'Resultado', alinhamento: 'direita' },
        { chave: 'meta', titulo: 'Meta', alinhamento: 'direita' },
      ],
      linhas: d.indicadores.map((i) => ({ ...i })),
    }),
    secao({ texto: 'Evolução da conformidade (%)' }),
    tabela({
      colunas: [
        { chave: 'rotulo', titulo: 'Mês', peso: 2.8 },
        ...d.conformidadeMensal.map((m, k) => ({ chave: `m${k}`, titulo: m.mes, alinhamento: 'direita' as const })),
      ],
      linhas:
        d.conformidadeMensal.length > 0
          ? [Object.fromEntries([['rotulo', 'Conformidade (%)'], ...d.conformidadeMensal.map((m, k) => [`m${k}`, m.valor])])]
          : [],
    }),
    secao({ texto: 'Processos por área' }),
    tabela({
      colunas: [
        { chave: 'area', titulo: 'Área', peso: 3 },
        { chave: 'quantidade', titulo: 'Processos', alinhamento: 'direita' },
      ],
      linhas: d.processosPorArea.map((p) => ({ ...p })),
    }),
    secao({ texto: 'Matriz de riscos' }),
    tabela({
      colunas: [
        { chave: 'nivel', titulo: 'Nível de risco', peso: 3 },
        { chave: 'quantidade', titulo: 'Quantidade', alinhamento: 'direita' },
      ],
      linhas: d.riscos.map((r) => ({ ...r })),
    }),
    secao({ texto: 'Plano de ação de integridade' }),
    tabela({
      colunas: [
        { chave: 'titulo', titulo: 'Ação', peso: 3 },
        { chave: 'situacao', titulo: 'Situação', peso: 1.5 },
      ],
      linhas: d.acoes.map((a) => ({ ...a })),
    }),
    secao({ texto: 'Resumo executivo' }),
    ...lista(d.resumoExecutivo),
    secao({ texto: `Metas para ${d.anoMetas}` }),
    ...lista(d.metas),
  ],
};
