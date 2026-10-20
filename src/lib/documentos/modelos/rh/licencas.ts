import {
  agruparPor,
  diasLicenca,
  formatarDataISO,
  matriculaServidor,
  nomeArquivoRelatorio,
  nomeServidor,
  nomeUnidade,
  rotuloStatusLicenca,
  rotuloTipoAfastamento,
  somar,
  type FiltrosImpressao,
  type LinhaLicencaRelatorio,
} from '@/lib/relatoriosRHRegras';
import { camposChaveValor, secao, tabela, type ColunaTabela } from '../../blocos';
import type { Bloco, DocumentoModelo } from '../../tipos';
import { plural } from './comum';
import { blocosFiltros } from './filtros';

/**
 * Relatório de licenças e afastamentos vigentes no período, agrupados por tipo, com subtotal de dias.
 * LGPD: nome, matrícula e unidade; nunca CID, médico ou observações.
 */
export interface DadosRelatorioLicencas {
  linhas: LinhaLicencaRelatorio[];
  filtros: FiltrosImpressao;
}

// Pesos em mm da largura útil em retrato (170).
const COLUNAS: ColunaTabela[] = [
  { chave: 'servidor', titulo: 'Servidor', peso: 34 },
  { chave: 'matricula', titulo: 'Matrícula', peso: 19 },
  { chave: 'unidade', titulo: 'Unidade', peso: 31.5 },
  { chave: 'inicio', titulo: 'Início', peso: 19.5, alinhamento: 'centro' },
  { chave: 'fim', titulo: 'Fim', peso: 19.5, alinhamento: 'centro' },
  { chave: 'dias', titulo: 'Dias', peso: 10, alinhamento: 'direita' },
  { chave: 'status', titulo: 'Status', peso: 18 },
  { chave: 'portaria', titulo: 'Portaria', peso: 18.5 },
];

export const relatorioLicencas: DocumentoModelo<DadosRelatorioLicencas> = {
  tipo: 'rh-licencas',
  familia: 'relatorio',
  titulo: () => 'Relatório de licenças e afastamentos',
  subtitulo: () => 'Afastamentos vigentes no período, por tipo',
  nomeArquivo: () => `${nomeArquivoRelatorio('licencas')}.pdf`,
  blocos: (d) => {
    // Licença em aberto conta até o fim do período filtrado (ver `diasLicenca`).
    const dias = (l: LinhaLicencaRelatorio) => diasLicenca(l, d.filtros.fim);
    const linha = (l: LinhaLicencaRelatorio) => ({
      servidor: nomeServidor(l.servidor),
      matricula: matriculaServidor(l.servidor),
      unidade: nomeUnidade(l.servidor),
      inicio: formatarDataISO(l.data_inicio),
      fim: l.data_fim ? formatarDataISO(l.data_fim) : 'Em aberto',
      dias: dias(l),
      status: rotuloStatusLicenca(l.status),
      portaria: l.portaria_numero,
    });
    const grupos = agruparPor(d.linhas, (l) => rotuloTipoAfastamento(l));
    const blocos: Bloco[] = [...blocosFiltros(d.filtros, plural(d.linhas.length, 'registro', 'registros'))];
    if (grupos.length === 0) blocos.push(secao({ texto: 'Resultado' }), tabela({ colunas: COLUNAS, linhas: [] }));
    for (const g of grupos) {
      blocos.push(
        secao({ texto: `${g.chave} (${plural(g.itens.length, 'registro', 'registros')})` }),
        tabela({ colunas: COLUNAS, linhas: g.itens.map(linha), totais: { servidor: 'Subtotal do tipo', dias: somar(g.itens, dias) } }),
      );
    }
    blocos.push(
      secao({ texto: 'Total geral' }),
      camposChaveValor({
        colunas: 2,
        campos: [
          { rotulo: 'Registros', valor: d.linhas.length },
          { rotulo: 'Dias de afastamento', valor: somar(d.linhas, dias) },
        ],
      }),
    );
    return blocos;
  },
};
