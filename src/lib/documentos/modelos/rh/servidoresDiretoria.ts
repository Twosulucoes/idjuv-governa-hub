import { camposChaveValor, paragrafo, secao, tabela } from '../../blocos';
import type { Bloco, DocumentoModelo } from '../../tipos';
import { dataNoArquivo, formatarCPF } from './formatos';

export interface ServidorDiretoriaItem {
  nome: string;
  cpf: string;
  matricula: string | null;
  cargo: string;
  vinculo: string;
  situacao: string;
}

export interface GrupoDiretoria {
  unidade_nome: string;
  unidade_sigla: string | null;
  unidade_tipo?: string;
  nivel?: number;
  caminho_hierarquico?: string;
  servidores: ServidorDiretoriaItem[];
}

export interface DadosServidoresDiretoria {
  grupos: GrupoDiretoria[];
  totalServidores: number;
  /** "dd/mm/aaaa" */
  dataGeracao: string;
  filtroUnidade: string | null;
}

const TIPO_UNIDADE: Record<string, string> = {
  presidencia: 'PRESIDÊNCIA',
  diretoria: 'DIRETORIA',
  coordenacao: 'ASSESSORIA/COORDENAÇÃO',
  divisao: 'DIVISÃO',
  nucleo: 'NÚCLEO',
  setor: 'SETOR',
};

/** "[DIVISÃO] SIGLA - Nome (n)". A unidade do topo (nível 1) sai sem o tipo, como no relatório original. */
function tituloDoGrupo(g: GrupoDiretoria): string {
  const nivel = g.nivel || 2;
  const tipo = TIPO_UNIDADE[g.unidade_tipo || 'diretoria'] || '';
  const unidade = g.unidade_sigla ? `${g.unidade_sigla} - ${g.unidade_nome}` : g.unidade_nome;
  const prefixo = nivel > 1 && tipo ? `[${tipo}] ` : '';
  return `${prefixo}${unidade} (${g.servidores.length})`;
}

export const relatorioServidoresDiretoria: DocumentoModelo<DadosServidoresDiretoria> = {
  tipo: 'rh-servidores-diretoria',
  familia: 'relatorio',
  titulo: () => 'Relatório de servidores por estrutura organizacional',
  subtitulo: (d) => (d.filtroUnidade ? `Filtro: ${d.filtroUnidade}` : 'Todas as Unidades Organizacionais'),
  nomeArquivo: (d) => `Relatorio_Servidores_Estrutura_${dataNoArquivo(d.dataGeracao)}.pdf`,
  blocos: (d) => [
    camposChaveValor({
      colunas: 3,
      campos: [
        { rotulo: 'Unidade', valor: d.filtroUnidade ?? 'Todas' },
        { rotulo: 'Total de servidores', valor: d.totalServidores },
        { rotulo: 'Data de geração', valor: d.dataGeracao },
      ],
    }),
    ...d.grupos.flatMap((g): Bloco[] => [
      secao({ texto: tituloDoGrupo(g) }),
      ...((g.nivel || 2) > 1 && g.caminho_hierarquico ? [paragrafo({ texto: `Hierarquia: ${g.caminho_hierarquico}` })] : []),
      tabela({
        colunas: [
          { chave: 'nome', titulo: 'Nome', peso: 3 },
          { chave: 'cpf', titulo: 'CPF', peso: 1.6 },
          { chave: 'cargo', titulo: 'Cargo', peso: 2.4 },
          { chave: 'vinculo', titulo: 'Vínculo', peso: 1.5 },
          { chave: 'situacao', titulo: 'Situação', peso: 1.3 },
        ],
        linhas: g.servidores.map((s) => ({ ...s, cpf: formatarCPF(s.cpf) })),
      }),
    ]),
  ],
};
