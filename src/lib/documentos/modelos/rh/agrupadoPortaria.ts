import { formatCPF } from '@/lib/formatters';
import { camposChaveValor, secao, tabela } from '../../blocos';
import type { Bloco, DocumentoModelo } from '../../tipos';
import { percentual } from './situacaoPortaria';

/** Servidores ativos agrupados pelo número da portaria de nomeação, mais os que não têm portaria. */
export interface ServidorParaPortaria {
  ord: number;
  nome: string;
  cpf: string;
  cargo: string;
  unidade: string;
  codigo: string;
}

export interface GrupoPortaria {
  numero: string;
  servidores: ServidorParaPortaria[];
}

export interface RelatorioAgrupadoPortariaData {
  grupos: GrupoPortaria[];
  servidoresSemPortaria: ServidorParaPortaria[];
  /** dd/MM/aaaa; vai só no nome do arquivo (a data de emissão sai no rodapé). */
  dataGeracao: string;
}

const tabelaServidores = (lista: ServidorParaPortaria[]): Bloco =>
  tabela({
    colunas: [
      { chave: 'ord', titulo: 'Ord.', peso: 10, alinhamento: 'centro' },
      { chave: 'nome', titulo: 'Nome do servidor', peso: 55 },
      { chave: 'cpf', titulo: 'CPF', peso: 28 },
      { chave: 'cargo', titulo: 'Cargo', peso: 40 },
      { chave: 'unidade', titulo: 'Unidade', peso: 20 },
      { chave: 'codigo', titulo: 'Cód.', peso: 17 },
    ],
    linhas: lista.map((s) => ({
      ord: s.ord,
      nome: s.nome,
      cpf: s.cpf ? formatCPF(s.cpf) : null,
      cargo: s.cargo,
      unidade: s.unidade,
      codigo: s.codigo,
    })),
    totais: { nome: `Subtotal: ${lista.length} servidor(es)` },
  });

export const relatorioAgrupadoPortaria: DocumentoModelo<RelatorioAgrupadoPortariaData> = {
  tipo: 'rh-agrupado-portaria',
  familia: 'relatorio',
  orientacao: 'retrato',
  titulo: () => 'Relatório de servidores por portaria',
  subtitulo: () => 'Agrupamento por número de portaria de nomeação',
  nomeArquivo: (d) => `Relatorio_Servidores_Por_Portaria_${d.dataGeracao.replace(/\//g, '-')}.pdf`,
  blocos: (d) => {
    const com = d.grupos.reduce((s, g) => s + g.servidores.length, 0);
    const sem = d.servidoresSemPortaria.length;
    const total = com + sem;
    return [
      camposChaveValor({
        colunas: 2,
        campos: [
          { rotulo: 'Total de servidores', valor: total },
          { rotulo: 'Portarias', valor: d.grupos.length },
        ],
      }),
      // Portaria sem servidor sai só com o título (como no relatório antigo).
      ...d.grupos.flatMap((g) => [
        secao({ texto: `Portaria nº ${g.numero} (${g.servidores.length} servidores)` }),
        ...(g.servidores.length > 0 ? [tabelaServidores(g.servidores)] : []),
      ]),
      ...(sem > 0
        ? [secao({ texto: `Servidores sem portaria de nomeação (${sem})` }), tabelaServidores(d.servidoresSemPortaria)]
        : []),
      secao({ texto: 'Resumo geral' }),
      tabela({
        colunas: [
          { chave: 'portaria', titulo: 'Portaria', peso: 3 },
          { chave: 'qtd', titulo: 'Servidores', peso: 1, alinhamento: 'direita' },
        ],
        linhas: d.grupos.map((g) => ({ portaria: `Portaria ${g.numero}`, qtd: g.servidores.length })),
        totais: { portaria: 'Total com portaria', qtd: com },
      }),
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
