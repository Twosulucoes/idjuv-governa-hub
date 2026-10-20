import {
  agruparPor,
  descreverDestino,
  formatarDataISO,
  matriculaServidor,
  nomeArquivoRelatorio,
  nomeServidor,
  nomeUnidade,
  rotuloOnus,
  rotuloStatusViagem,
  somar,
  valorTotalViagem,
  type FiltrosImpressao,
  type LinhaViagemRelatorio,
} from '@/lib/relatoriosRHRegras';
import { camposChaveValor, secao, tabela, type ColunaTabela } from '../../blocos';
import type { Bloco, DocumentoModelo } from '../../tipos';
import { moeda, plural } from './comum';
import { blocosFiltros } from './filtros';

/** Relatório de viagens e diárias no período, por unidade, com totais de diárias e valor. Paisagem. */
export interface DadosRelatorioViagens {
  linhas: LinhaViagemRelatorio[];
  filtros: FiltrosImpressao;
}

// Pesos em mm da largura útil em paisagem (257).
const COLUNAS: ColunaTabela[] = [
  { chave: 'servidor', titulo: 'Servidor', peso: 55 },
  { chave: 'matricula', titulo: 'Matrícula', peso: 19 },
  { chave: 'destino', titulo: 'Destino', peso: 42 },
  { chave: 'saida', titulo: 'Saída', peso: 19.5, alinhamento: 'centro' },
  { chave: 'retorno', titulo: 'Retorno', peso: 19.5, alinhamento: 'centro' },
  { chave: 'onus', titulo: 'Ônus', peso: 21 },
  { chave: 'diarias', titulo: 'Diárias', peso: 15, alinhamento: 'direita' },
  { chave: 'valor', titulo: 'Valor', peso: 26, alinhamento: 'direita' },
  { chave: 'status', titulo: 'Status', peso: 22 },
  { chave: 'relatorio', titulo: 'Relatório', peso: 18, alinhamento: 'centro' },
];

/** Viagem sem ônus não gera diária. */
const diarias = (v: LinhaViagemRelatorio) => (v.tipo_onus === 'sem_onus' ? 0 : Number(v.quantidade_diarias) || 0);
const viagens = (n: number) => plural(n, 'viagem', 'viagens');

const linha = (v: LinhaViagemRelatorio) => {
  const semOnus = v.tipo_onus === 'sem_onus';
  return {
    servidor: nomeServidor(v.servidor),
    matricula: matriculaServidor(v.servidor),
    destino: descreverDestino(v),
    saida: formatarDataISO(v.data_saida),
    retorno: formatarDataISO(v.data_retorno),
    onus: rotuloOnus(v.tipo_onus),
    diarias: semOnus ? '-' : diarias(v),
    valor: semOnus ? '-' : moeda(valorTotalViagem(v)),
    status: rotuloStatusViagem(v.status),
    relatorio: v.relatorio_apresentado ? 'Sim' : 'Não',
  };
};

export const relatorioViagens: DocumentoModelo<DadosRelatorioViagens> = {
  tipo: 'rh-viagens',
  familia: 'relatorio',
  orientacao: 'paisagem',
  titulo: () => 'Relatório de viagens e diárias',
  subtitulo: () => 'Viagens no período, por unidade, com totais de diárias e valores',
  nomeArquivo: () => `${nomeArquivoRelatorio('viagens')}.pdf`,
  blocos: (d) => {
    const grupos = agruparPor(d.linhas, (v) => nomeUnidade(v.servidor));
    const blocos: Bloco[] = [...blocosFiltros(d.filtros, viagens(d.linhas.length))];
    if (grupos.length === 0) blocos.push(secao({ texto: 'Resultado' }), tabela({ colunas: COLUNAS, linhas: [] }));
    for (const g of grupos) {
      blocos.push(
        secao({ texto: `${g.chave} (${viagens(g.itens.length)})` }),
        tabela({
          colunas: COLUNAS,
          linhas: g.itens.map(linha),
          totais: { servidor: 'Subtotal da unidade', diarias: somar(g.itens, diarias), valor: moeda(somar(g.itens, valorTotalViagem)) },
        }),
      );
    }
    blocos.push(
      secao({ texto: 'Total geral' }),
      camposChaveValor({
        colunas: 3,
        campos: [
          { rotulo: 'Viagens', valor: d.linhas.length },
          { rotulo: 'Diárias', valor: somar(d.linhas, diarias) },
          { rotulo: 'Valor total', valor: moeda(somar(d.linhas, valorTotalViagem)) },
        ],
      }),
    );
    return blocos;
  },
};
