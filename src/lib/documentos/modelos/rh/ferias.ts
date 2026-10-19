import {
  agruparPor,
  descreverParcela,
  formatarDataISO,
  matriculaServidor,
  nomeArquivoRelatorio,
  nomeServidor,
  nomeUnidade,
  rotuloStatusFerias,
  somar,
  type FiltrosImpressao,
  type LinhaFeriasRelatorio,
} from '@/lib/relatoriosRHRegras';
import { camposChaveValor, secao, tabela, type ColunaTabela } from '../../blocos';
import type { Bloco, DocumentoModelo } from '../../tipos';
import { plural } from './comum';
import { blocosFiltros } from './filtros';

/**
 * Relatório de férias: servidores em férias no período, agrupados por unidade, com subtotal de dias.
 * LGPD: nome e matrícula; nada de CPF.
 */
export interface DadosRelatorioFerias {
  linhas: LinhaFeriasRelatorio[];
  filtros: FiltrosImpressao;
}

// Pesos em mm da largura útil em retrato (170): data dd/mm/aaaa pede ~20 mm na letra da tabela.
const COLUNAS: ColunaTabela[] = [
  { chave: 'servidor', titulo: 'Servidor', peso: 31 },
  { chave: 'matricula', titulo: 'Matrícula', peso: 19 },
  // Cabe "dd/mm/aaaa a" numa linha: o período sai em 2 linhas, não 3.
  { chave: 'aquisitivo', titulo: 'Per. aquisitivo', peso: 24 },
  { chave: 'inicio', titulo: 'Início', peso: 19.5, alinhamento: 'centro' },
  { chave: 'fim', titulo: 'Fim', peso: 19.5, alinhamento: 'centro' },
  { chave: 'dias', titulo: 'Dias', peso: 10, alinhamento: 'direita' },
  { chave: 'parcela', titulo: 'Parc.', peso: 11, alinhamento: 'centro' },
  { chave: 'status', titulo: 'Status', peso: 18 },
  { chave: 'portaria', titulo: 'Portaria', peso: 18 },
];

const dias = (l: LinhaFeriasRelatorio) => Number(l.dias_gozados) || 0;

const linha = (l: LinhaFeriasRelatorio) => ({
  servidor: nomeServidor(l.servidor),
  matricula: matriculaServidor(l.servidor),
  aquisitivo: `${formatarDataISO(l.periodo_aquisitivo_inicio)} a ${formatarDataISO(l.periodo_aquisitivo_fim)}`,
  inicio: formatarDataISO(l.data_inicio),
  fim: formatarDataISO(l.data_fim),
  dias: dias(l),
  parcela: descreverParcela(l.parcela, l.total_parcelas),
  status: rotuloStatusFerias(l.status),
  portaria: l.portaria_numero,
});

export const relatorioFerias: DocumentoModelo<DadosRelatorioFerias> = {
  tipo: 'rh-ferias',
  familia: 'relatorio',
  titulo: () => 'Relatório de férias',
  subtitulo: () => 'Servidores em férias no período, por unidade',
  nomeArquivo: () => `${nomeArquivoRelatorio('ferias')}.pdf`,
  blocos: (d) => {
    const grupos = agruparPor(d.linhas, (l) => nomeUnidade(l.servidor));
    const blocos: Bloco[] = [...blocosFiltros(d.filtros, plural(d.linhas.length, 'registro', 'registros'))];
    if (grupos.length === 0) blocos.push(secao({ texto: 'Resultado' }), tabela({ colunas: COLUNAS, linhas: [] }));
    for (const g of grupos) {
      blocos.push(
        secao({ texto: `${g.chave} (${plural(g.itens.length, 'registro', 'registros')})` }),
        tabela({ colunas: COLUNAS, linhas: g.itens.map(linha), totais: { servidor: 'Subtotal da unidade', dias: somar(g.itens, dias) } }),
      );
    }
    blocos.push(
      secao({ texto: 'Total geral' }),
      camposChaveValor({
        colunas: 2,
        campos: [
          { rotulo: 'Registros', valor: d.linhas.length },
          { rotulo: 'Dias de férias', valor: somar(d.linhas, dias) },
        ],
      }),
    );
    return blocos;
  },
};
