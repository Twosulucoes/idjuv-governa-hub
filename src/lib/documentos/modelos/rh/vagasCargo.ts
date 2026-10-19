import { camposChaveValor, secao, tabela } from '../../blocos';
import type { Bloco, DocumentoModelo } from '../../tipos';
import { dataNoArquivo } from './formatos';

export interface CargoVagaItem {
  id: string;
  nome: string;
  sigla: string | null;
  natureza: string;
  quantidade_vagas: number;
  vagas_ocupadas: number;
  vagas_disponiveis: number;
  percentual_ocupacao: number;
  vencimento_base: number | null;
}

export interface GrupoNatureza {
  natureza: string;
  natureza_label: string;
  cargos: CargoVagaItem[];
  total_previstas: number;
  total_ocupadas: number;
  total_disponiveis: number;
}

export interface DadosVagasCargo {
  grupos: GrupoNatureza[];
  totalCargos: number;
  totalPrevistas: number;
  totalOcupadas: number;
  totalDisponiveis: number;
  percentualGeral: number;
  /** "dd/mm/aaaa" */
  dataGeracao: string;
  /** Código da natureza (`comissionado`, `efetivo`…) ou null para todas. */
  filtroNatureza: string | null;
}

const NATUREZA: Record<string, string> = {
  comissionado: 'Cargos Comissionados',
  efetivo: 'Cargos Efetivos',
  funcao_gratificada: 'Funções Gratificadas',
  temporario: 'Cargos Temporários',
  estagiario: 'Estagiários',
};

const pct = (n: number, casas = 0): string => `${n.toFixed(casas).replace('.', ',')}%`;

const COLUNAS = [
  { chave: 'nome', titulo: 'Cargo', peso: 4 },
  { chave: 'sigla', titulo: 'Símbolo', peso: 1.3 },
  { chave: 'previstas', titulo: 'Previstas', peso: 1.1, alinhamento: 'direita' as const },
  { chave: 'ocupadas', titulo: 'Ocupadas', peso: 1.1, alinhamento: 'direita' as const },
  { chave: 'disponiveis', titulo: 'Disponíveis', peso: 1.2, alinhamento: 'direita' as const },
  { chave: 'ocupacao', titulo: 'Ocupação', peso: 1.1, alinhamento: 'direita' as const },
];

export const relatorioVagasCargo: DocumentoModelo<DadosVagasCargo> = {
  tipo: 'rh-vagas-cargo',
  familia: 'relatorio',
  titulo: () => 'Relatório de vagas disponíveis por cargo',
  subtitulo: (d) =>
    d.filtroNatureza ? `Filtro: ${NATUREZA[d.filtroNatureza] || d.filtroNatureza}` : 'Todas as Naturezas de Cargo',
  nomeArquivo: (d) => `Relatorio_Vagas_Cargo_${dataNoArquivo(d.dataGeracao)}.pdf`,
  blocos: (d) => [
    camposChaveValor({
      colunas: 3,
      campos: [
        { rotulo: 'Natureza', valor: d.filtroNatureza ? NATUREZA[d.filtroNatureza] || d.filtroNatureza : 'Todas' },
        { rotulo: 'Total de cargos', valor: d.totalCargos },
        { rotulo: 'Data de geração', valor: d.dataGeracao },
      ],
    }),
    // Natureza sem cargo não é impressa (como no relatório original).
    ...d.grupos
      .filter((g) => g.cargos.length > 0)
      .flatMap((g): Bloco[] => [
        secao({ texto: `${g.natureza_label} (${g.cargos.length} cargos)` }),
        tabela({
          colunas: COLUNAS,
          linhas: g.cargos.map((c) => ({
            nome: c.nome,
            sigla: c.sigla,
            previstas: c.quantidade_vagas,
            ocupadas: c.vagas_ocupadas,
            disponiveis: c.vagas_disponiveis,
            ocupacao: pct(c.percentual_ocupacao),
          })),
          totais: {
            nome: `Subtotal ${g.natureza_label}`,
            previstas: g.total_previstas,
            ocupadas: g.total_ocupadas,
            disponiveis: g.total_disponiveis,
            ocupacao: pct(g.total_previstas > 0 ? (g.total_ocupadas / g.total_previstas) * 100 : 0),
          },
        }),
      ]),
    secao({ texto: 'Resumo geral' }),
    camposChaveValor({
      colunas: 3,
      campos: [
        { rotulo: 'Total de cargos', valor: d.totalCargos },
        { rotulo: 'Vagas previstas', valor: d.totalPrevistas },
        { rotulo: 'Vagas ocupadas', valor: d.totalOcupadas },
        { rotulo: 'Vagas disponíveis', valor: d.totalDisponiveis },
        { rotulo: 'Taxa de ocupação', valor: pct(d.percentualGeral, 1) },
      ],
    }),
  ],
};
