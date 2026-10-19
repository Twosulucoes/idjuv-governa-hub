import { tabela } from '../../blocos';
import type { DocumentoModelo } from '../../tipos';

export interface LinhaFolhaSimplificada {
  nome?: string | null;
  cpf?: string | null;
  cargo?: string | null;
  /** Sigla do cargo ou matrícula. */
  codigo?: string | null;
  valor: number;
}

export interface DadosFolhaSimplificada {
  /** Título escolhido na tela; sem ele, o padrão. */
  titulo?: string;
  subtitulo?: string;
  /** Mês de referência ("09/2026"). */
  mesReferencia?: string;
  linhas: LinhaFolhaSimplificada[];
}

const moeda = (v: number): string => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const folhaSimplificada: DocumentoModelo<DadosFolhaSimplificada> = {
  tipo: 'relatorios-folha-simplificada',
  familia: 'relatorio',
  orientacao: 'paisagem',
  titulo: (d) => d.titulo || 'Relatório simplificado de folha',
  subtitulo: (d) =>
    [d.subtitulo, d.mesReferencia && `Referência: ${d.mesReferencia}`, `Total de registros: ${d.linhas.length}`]
      .filter(Boolean)
      .join(' · '),
  nomeArquivo: () => `relatorio_folha_simplificado_${new Date().toISOString().slice(0, 10)}.pdf`,
  blocos: (d) => {
    const total = d.linhas.reduce((s, l) => s + (l.valor || 0), 0);
    return [
      tabela({
        colunas: [
          { chave: 'numero', titulo: 'Nº', peso: 0.5, alinhamento: 'centro' },
          { chave: 'nome', titulo: 'Nome completo', peso: 3.2 },
          { chave: 'cpf', titulo: 'CPF', peso: 1.4, alinhamento: 'centro' },
          { chave: 'cargo', titulo: 'Cargo', peso: 2.5 },
          { chave: 'codigo', titulo: 'Código', peso: 0.9, alinhamento: 'centro' },
          { chave: 'valor', titulo: 'Valores', peso: 1.3, alinhamento: 'direita' },
        ],
        linhas: d.linhas.map((l, i) => ({ ...l, numero: i + 1, valor: moeda(l.valor || 0) })),
        totais: d.linhas.length > 0 ? { cargo: 'TOTAL GERAL', valor: moeda(total) } : undefined,
      }),
    ];
  },
};
