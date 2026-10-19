import { formatCPF } from '@/lib/formatters';
import { camposChaveValor, paragrafo, secao, tabela } from '../../blocos';
import type { Bloco, DocumentoModelo } from '../../tipos';

/** Servidores ativos separados em "com" e "sem" portaria de nomeação registrada. */
export interface ServidorPortariaItem {
  ord: number;
  nome: string;
  cpf: string;
  cargo: string;
  unidade: string;
  codigo: string;
  portaria?: string;
}

export interface RelatorioSituacaoPortariaData {
  servidoresComPortaria: ServidorPortariaItem[];
  servidoresSemPortaria: ServidorPortariaItem[];
  /** dd/MM/aaaa; vai só no nome do arquivo (a data de emissão sai no rodapé). */
  dataGeracao: string;
}

/** "12,5%" — percentual de `parte` em `total`, uma casa decimal. */
export const percentual = (parte: number, total: number): string =>
  `${(total > 0 ? (parte / total) * 100 : 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;

const tabelaServidores = (lista: ServidorPortariaItem[]): Bloco =>
  tabela({
    colunas: [
      { chave: 'ord', titulo: 'Ord.', peso: 10, alinhamento: 'centro' },
      { chave: 'nome', titulo: 'Nome', peso: 40 },
      { chave: 'cpf', titulo: 'CPF', peso: 26 },
      { chave: 'cargo', titulo: 'Cargo', peso: 30 },
      { chave: 'unidade', titulo: 'Unidade', peso: 18 },
      { chave: 'codigo', titulo: 'Cód.', peso: 14 },
      { chave: 'portaria', titulo: 'Portaria', peso: 32 },
    ],
    linhas: lista.map((s) => ({
      ord: s.ord,
      nome: s.nome,
      cpf: s.cpf ? formatCPF(s.cpf) : null,
      cargo: s.cargo,
      unidade: s.unidade,
      codigo: s.codigo,
      // A tela manda "-" para quem não tem portaria; o motor imprime vazio como "—".
      portaria: s.portaria === '-' ? null : s.portaria,
    })),
    totais: { nome: `Subtotal: ${lista.length} servidor(es)` },
  });

export const relatorioSituacaoPortaria: DocumentoModelo<RelatorioSituacaoPortariaData> = {
  tipo: 'rh-situacao-portaria',
  familia: 'relatorio',
  orientacao: 'retrato',
  titulo: () => 'Relatório de servidores - situação de portaria',
  subtitulo: () => 'Servidores com e sem portaria de nomeação',
  nomeArquivo: (d) => `Relatorio_Situacao_Portaria_${d.dataGeracao.replace(/\//g, '-')}.pdf`,
  blocos: (d) => {
    const com = d.servidoresComPortaria.length;
    const sem = d.servidoresSemPortaria.length;
    const total = com + sem;
    return [
      camposChaveValor({ colunas: 2, campos: [{ rotulo: 'Total de servidores', valor: total }] }),
      secao({ texto: `Servidores com portaria de nomeação (${com})` }),
      com > 0
        ? tabelaServidores(d.servidoresComPortaria)
        : paragrafo({ texto: 'Nenhum servidor com portaria de nomeação registrada.' }),
      secao({ texto: `Servidores sem portaria de nomeação (${sem})` }),
      sem > 0
        ? tabelaServidores(d.servidoresSemPortaria)
        : paragrafo({ texto: 'Todos os servidores possuem portaria de nomeação registrada.' }),
      secao({ texto: 'Resumo geral' }),
      camposChaveValor({
        colunas: 3,
        campos: [
          { rotulo: 'Total geral', valor: total },
          { rotulo: 'Com portaria', valor: `${com} (${percentual(com, total)} regularizados)` },
          { rotulo: 'Sem portaria', valor: `${sem} (${percentual(sem, total)} pendentes)` },
        ],
      }),
    ];
  },
};
