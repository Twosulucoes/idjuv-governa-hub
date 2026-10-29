import { montarItemRelatorio, type AmostraBase } from '@/lib/compras/relatorioPesquisaPrecos';
import type { DadosRelatorioPesquisaPrecos } from '../modelos/compras/pesquisaPrecos';

const amostra = (i: number, preco: number, extra: Partial<AmostraBase> = {}): AmostraBase => ({
  id: `a${i}`, parametro: 1, origem: 'compras_gov', orgao: `Órgão de Exemplo ${i}`, uasg: `92500${i % 10}`, uf: 'RR', municipio: 'Boa Vista',
  numero_compra: `Pregão nº 9001${i % 10}/2026, UASG 92500${i % 10}`, data_referencia: '2026-04-02', fornecedor_nome: `Fornecedor ${i}`,
  fornecedor_ni: '12345678000190', marca: null, unidade: 'UN', preco_unitario: preco, link: 'https://pncp.gov.br/app/editais/12345678000190/2026/15',
  consultado_em: '2026-10-29T18:30:00Z', considerada: true, motivo_desconsideracao: null, ...extra,
});

/** Pesquisa com dois itens; `amostrasPorItem` alto força várias páginas. */
export const dadosPesquisaPrecos = (amostrasPorItem = 5): DadosRelatorioPesquisaPrecos => ({
  numeroSei: '00000.000001/2026-01',
  objeto: 'Aquisição de material esportivo',
  finalidade: 'Licitação',
  dataReferencia: '2026-10-29',
  situacao: 'Em andamento',
  responsaveis: 'Equipe de Planejamento e Contratação',
  itens: [
    montarItemRelatorio(
      { numero: 1, descricao: 'Bola de futebol de campo', tipo: 'material', catalogo_campo: 'codigoItemCatalogo', codigo_catalogo: 447001,
        nome_catalogo: 'BOLA ESPORTIVA', unidade: 'UN', quantidade: 50, metodo: null, justificativa: null },
      [
        ...Array.from({ length: amostrasPorItem }, (_, k) => amostra(k + 1, 95 + k)),
        amostra(90, 300),
        amostra(91, 10, { considerada: false, motivo_desconsideracao: 'Item usado' }),
      ],
      '2026-10-29',
    ),
    montarItemRelatorio(
      { numero: 2, descricao: 'Rede de gol oficial', tipo: 'material', catalogo_campo: null, codigo_catalogo: null, nome_catalogo: null,
        unidade: 'PAR', quantidade: 4, metodo: null, justificativa: null },
      [amostra(92, 300, { parametro: 4, origem: 'manual', orgao: null, uasg: null, link: null, numero_compra: 'Orçamento de 20/10/2026' })],
      '2026-10-29',
    ),
  ],
});
