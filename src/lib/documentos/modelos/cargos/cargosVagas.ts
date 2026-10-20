import { camposChaveValor, secao, tabela } from '../../blocos';
import type { DocumentoModelo } from '../../tipos';

/** Unidade em que o cargo tem vagas (composição). */
export interface ComposicaoCargoRelatorio {
  unidade_nome: string;
  unidade_sigla: string | null;
  quantidade_vagas: number;
}

export interface CargoRelatorioVagas {
  nome: string;
  sigla: string | null;
  categoria: string;
  nivel_hierarquico: number | null;
  quantidade_vagas: number;
  ocupadas: number;
  composicao: ComposicaoCargoRelatorio[];
}

export interface DadosRelatorioCargosVagas {
  cargos: CargoRelatorioVagas[];
  totalCargos: number;
  totalVagas: number;
  totalOcupadas: number;
  totalVacancia: number;
  /** "dd/mm/aaaa" ou "dd/mm/aaaa, hh:mm" (como a tela formata). */
  dataGeracao: string;
}

const CATEGORIAS: Record<string, string> = {
  comissionado: 'Comissionado',
  efetivo: 'Efetivo',
  funcao_gratificada: 'Função Gratificada',
  temporario: 'Temporário',
  estagiario: 'Estagiário',
};
/** Ordem da distribuição por categoria (a mesma do relatório original). */
const ORDEM_CATEGORIAS = ['comissionado', 'efetivo', 'funcao_gratificada', 'temporario', 'estagiario'];

/** "dd/mm/aaaa…" → "aaaa-mm-dd" para o nome do arquivo. */
function dataNoArquivo(data: string): string {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})/.exec(data);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : data.replace(/[^\d-]/g, '');
}

const vagasPorUnidade = (c: CargoRelatorioVagas): string =>
  c.composicao.map((u) => `${u.unidade_sigla || u.unidade_nome}: ${u.quantidade_vagas}`).join('; ');

export const relatorioCargosVagas: DocumentoModelo<DadosRelatorioCargosVagas> = {
  tipo: 'cargos-relatorio-cargos-vagas',
  familia: 'relatorio',
  titulo: () => 'Relatório de cargos e vagas',
  subtitulo: (d) => `Data de geração: ${d.dataGeracao}`,
  nomeArquivo: (d) => `Relatorio_Cargos_${dataNoArquivo(d.dataGeracao)}.pdf`,
  blocos: (d) => {
    const ocupacao = d.totalVagas > 0 ? ((d.totalOcupadas / d.totalVagas) * 100).toFixed(1) : '0';
    const categorias = ORDEM_CATEGORIAS.map((cat) => {
      const lista = d.cargos.filter((c) => c.categoria === cat);
      const vagas = lista.reduce((s, c) => s + c.quantidade_vagas, 0);
      const ocupadas = lista.reduce((s, c) => s + c.ocupadas, 0);
      return { categoria: CATEGORIAS[cat], cargos: lista.length, vagas, ocupadas, vacancia: vagas - ocupadas };
    }).filter((l) => l.cargos > 0);
    // Por nível hierárquico; cargo sem nível vai para o fim (como no original).
    const ordenados = [...d.cargos].sort((a, b) => (a.nivel_hierarquico || 99) - (b.nivel_hierarquico || 99));

    return [
      secao({ texto: 'Resumo geral' }),
      camposChaveValor({
        colunas: 3,
        campos: [
          { rotulo: 'Total de cargos', valor: d.totalCargos },
          { rotulo: 'Total de vagas', valor: d.totalVagas },
          { rotulo: 'Vagas ocupadas', valor: d.totalOcupadas },
          { rotulo: 'Vacância', valor: d.totalVacancia },
          { rotulo: 'Taxa de ocupação', valor: `${ocupacao.replace('.', ',')}%` },
        ],
      }),
      secao({ texto: 'Distribuição por categoria' }),
      tabela({
        colunas: [
          { chave: 'categoria', titulo: 'Categoria', peso: 3 },
          { chave: 'cargos', titulo: 'Cargos', alinhamento: 'direita' },
          { chave: 'vagas', titulo: 'Vagas', alinhamento: 'direita' },
          { chave: 'ocupadas', titulo: 'Ocupadas', alinhamento: 'direita' },
          { chave: 'vacancia', titulo: 'Vacância', alinhamento: 'direita' },
        ],
        linhas: categorias,
      }),
      secao({ texto: 'Detalhamento por cargo' }),
      tabela({
        colunas: [
          { chave: 'cargo', titulo: 'Cargo', peso: 3 },
          { chave: 'categoria', titulo: 'Categoria', peso: 1.7 },
          { chave: 'nivel', titulo: 'Nível', peso: 0.9, alinhamento: 'centro' },
          { chave: 'vagas', titulo: 'Vagas', peso: 1, alinhamento: 'direita' },
          { chave: 'ocupadas', titulo: 'Ocup.', peso: 1, alinhamento: 'direita' },
          { chave: 'vacancia', titulo: 'Vac.', peso: 0.9, alinhamento: 'direita' },
          { chave: 'unidades', titulo: 'Unid.', peso: 0.9, alinhamento: 'direita' },
          { chave: 'porUnidade', titulo: 'Vagas por unidade', peso: 2.6 },
        ],
        linhas: ordenados.map((c) => ({
          cargo: c.sigla ? `${c.nome} (${c.sigla})` : c.nome,
          categoria: CATEGORIAS[c.categoria] || c.categoria,
          nivel: c.nivel_hierarquico,
          vagas: c.quantidade_vagas,
          ocupadas: c.ocupadas,
          vacancia: c.quantidade_vagas - c.ocupadas,
          unidades: c.composicao.length,
          porUnidade: vagasPorUnidade(c),
        })),
        totais: {
          cargo: 'TOTAL',
          categoria: `${d.totalCargos} cargos`,
          vagas: d.totalVagas,
          ocupadas: d.totalOcupadas,
          vacancia: d.totalVacancia,
        },
      }),
    ];
  },
};
