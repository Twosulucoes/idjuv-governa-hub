import { camposChaveValor, secao, tabela } from '../../blocos';
import type { Bloco, DocumentoModelo } from '../../tipos';
import { dataNoArquivo, formatarCPF } from './formatos';

export interface ServidorVinculoItem {
  nome: string;
  cpf: string;
  matricula: string | null;
  cargo: string;
  unidade: string;
  situacao: string;
  possui_vinculo_externo?: boolean;
  vinculo_externo_orgao?: string | null;
}

export interface GrupoVinculo {
  vinculo: string;
  servidores: ServidorVinculoItem[];
}

export interface DadosServidoresVinculo {
  grupos: GrupoVinculo[];
  totalServidores: number;
  /** "dd/mm/aaaa" */
  dataGeracao: string;
  filtroVinculo: string | null;
}

export const relatorioServidoresVinculo: DocumentoModelo<DadosServidoresVinculo> = {
  tipo: 'rh-servidores-vinculo',
  familia: 'relatorio',
  titulo: () => 'Relatório de servidores por vínculo funcional',
  subtitulo: (d) => (d.filtroVinculo ? `Filtro: ${d.filtroVinculo}` : 'Todos os Vínculos Funcionais'),
  nomeArquivo: (d) => `Relatorio_Servidores_Vinculo_${dataNoArquivo(d.dataGeracao)}.pdf`,
  blocos: (d) => [
    camposChaveValor({
      colunas: 3,
      campos: [
        { rotulo: 'Vínculo', valor: d.filtroVinculo ?? 'Todos' },
        { rotulo: 'Total de servidores', valor: d.totalServidores },
        { rotulo: 'Data de geração', valor: d.dataGeracao },
      ],
    }),
    ...d.grupos.flatMap((g): Bloco[] => [
      secao({ texto: `${g.vinculo} (${g.servidores.length} servidores)` }),
      tabela({
        colunas: [
          { chave: 'nome', titulo: 'Nome', peso: 2.8 },
          { chave: 'cpf', titulo: 'CPF', peso: 1.7 },
          { chave: 'cargo', titulo: 'Cargo', peso: 2.4 },
          { chave: 'unidade', titulo: 'Unidade', peso: 1.2 },
          { chave: 'situacao', titulo: 'Situação', peso: 1.1 },
          // O antigo marcava o 2º vínculo no lugar da situação; aqui ganha coluna própria e nada se perde.
          { chave: 'segundoVinculo', titulo: '2º vínculo', peso: 1.6 },
        ],
        linhas: g.servidores.map((s) => ({
          nome: s.nome,
          cpf: formatarCPF(s.cpf),
          cargo: s.cargo,
          unidade: s.unidade,
          situacao: s.situacao,
          segundoVinculo: s.possui_vinculo_externo ? s.vinculo_externo_orgao || 'Sim' : '',
        })),
      }),
    ]),
  ],
};
