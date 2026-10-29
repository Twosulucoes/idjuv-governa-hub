import {
  catalogoDoItem,
  dataBR,
  dataHoraConsulta,
  documentoNoRelatorio,
  fonteDaAmostra,
  moedaBR,
  pctBR,
  precoBR,
  quantidadeBR,
  SITUACAO_RELATORIO_LABEL,
  type ItemRelatorio,
} from '@/lib/compras/relatorioPesquisaPrecos';
import { METODO_LABEL, PARAMETROS, type ParametroPesquisa } from '@/lib/compras/pesquisaPrecos';
import { camposChaveValor, paragrafo, secao, tabela, type ColunaTabela } from '../../blocos';
import type { Bloco, DocumentoModelo } from '../../tipos';

/**
 * Relatório da pesquisa de preços (Anexo da Nota Técnica de Análise Crítica de Pesquisa de Preços): identificação,
 * a série de cada item com a fonte rastreável (órgão, UF, compra ou ata, data, fornecedor, link e data e hora da
 * consulta), o saneamento do art. 18 do Decreto 39.050-E/2025 e o resumo dos valores. A nota é ato do SEI; este
 * documento é o anexo que a acompanha.
 */

export interface DadosRelatorioPesquisaPrecos {
  numeroSei: string;
  objeto: string;
  finalidade: string;
  /** AAAA-MM-DD */
  dataReferencia: string;
  situacao: string;
  responsaveis?: string;
  itens: ItemRelatorio[];
}

const COLUNAS_AMOSTRAS: ColunaTabela[] = [
  { chave: 'n', titulo: 'Nº', peso: 1 },
  { chave: 'inciso', titulo: 'Inc.', peso: 1 },
  { chave: 'fonte', titulo: 'Órgão ou fonte', peso: 6 },
  { chave: 'compra', titulo: 'Compra, ata ou documento', peso: 5 },
  { chave: 'data', titulo: 'Data', peso: 2 },
  { chave: 'fornecedor', titulo: 'Fornecedor', peso: 4 },
  { chave: 'unidade', titulo: 'Unid.', peso: 2 },
  { chave: 'preco', titulo: 'Preço unit.', peso: 2, alinhamento: 'direita' },
  { chave: 'situacao', titulo: 'Situação', peso: 3 },
];

const COLUNAS_RESUMO: ColunaTabela[] = [
  { chave: 'numero', titulo: 'Item', peso: 1 },
  { chave: 'descricao', titulo: 'Descrição', peso: 8 },
  { chave: 'unidade', titulo: 'Unidade', peso: 2 },
  { chave: 'quantidade', titulo: 'Qtd.', peso: 2, alinhamento: 'direita' },
  { chave: 'metodo', titulo: 'Método', peso: 3 },
  { chave: 'unitario', titulo: 'Valor unitário', peso: 3, alinhamento: 'direita' },
  { chave: 'total', titulo: 'Valor total', peso: 3, alinhamento: 'direita' },
];

const inciso = (p: number) => PARAMETROS[p as ParametroPesquisa]?.inciso ?? String(p);

function blocosDoItem(i: ItemRelatorio): Bloco[] {
  const a = i.analise;
  const catalogo = catalogoDoItem(i);
  const blocos: Bloco[] = [
    secao({ texto: `Item ${i.numero} — ${i.descricao}` }),
    camposChaveValor({
      colunas: 3,
      campos: [
        { rotulo: 'Catálogo', valor: catalogo ? `${catalogo}${i.nome_catalogo ? ` · ${i.nome_catalogo}` : ''}` : 'não informado' },
        { rotulo: 'Unidade', valor: i.unidade },
        { rotulo: 'Quantidade', valor: quantidadeBR(Number(i.quantidade)) },
      ],
    }),
  ];
  if (!i.amostras.length) {
    blocos.push(paragrafo({ texto: 'Nenhum preço coletado.' }));
  } else {
    blocos.push(tabela({
      colunas: COLUNAS_AMOSTRAS,
      linhas: i.amostras.map((s, k) => ({
        n: String(k + 1),
        inciso: inciso(s.parametro),
        fonte: fonteDaAmostra(s),
        compra: [s.numero_compra, s.link].filter(Boolean).join(' · ') || '—',
        data: dataBR(s.data_referencia),
        fornecedor: [s.fornecedor_nome, documentoNoRelatorio(s.fornecedor_ni)].filter(Boolean).join(' · ') || '—',
        unidade: s.unidade ?? '—',
        preco: precoBR(Number(s.preco_unitario)),
        situacao: [SITUACAO_RELATORIO_LABEL[s.situacao], s.situacao === 'desconsiderada' ? s.motivo_desconsideracao : null, s.aviso]
          .filter(Boolean).join(': '),
      })),
    }));
    const consultas = [...new Set(i.amostras.map((s) => dataHoraConsulta(s.consultado_em)))].sort();
    blocos.push(paragrafo({ texto: `Consulta às fontes (data e hora, UTC−4): ${consultas.join('; ')}.` }));
  }
  blocos.push(camposChaveValor({
    colunas: 3,
    campos: [
      { rotulo: 'Preços considerados', valor: String(a.quantidade) },
      { rotulo: 'Média', valor: a.media === null ? '—' : precoBR(a.media) },
      { rotulo: 'Desvio padrão', valor: a.desvioPadrao === null ? '—' : precoBR(a.desvioPadrao) },
      { rotulo: 'Limites (±30%)', valor: a.media === null ? '—' : `${precoBR(a.limiteInferior!)} a ${precoBR(a.limiteSuperior!)}` },
      { rotulo: 'Preços válidos', valor: String(a.validos) },
      { rotulo: 'Média saneada', valor: a.mediaSaneada === null ? '—' : precoBR(a.mediaSaneada) },
      { rotulo: 'Coeficiente de variação', valor: a.coeficienteVariacao === null ? '—' : pctBR(a.coeficienteVariacao) },
      { rotulo: 'Mediana', valor: a.mediana === null ? '—' : precoBR(a.mediana) },
      { rotulo: 'Método adotado', valor: i.metodoAdotado ? METODO_LABEL[i.metodoAdotado] : '—' },
      { rotulo: 'Valor unitário estimado', valor: i.valorUnitario === null ? '—' : precoBR(i.valorUnitario) },
      { rotulo: 'Valor total do item', valor: i.valorTotal === null ? '—' : moedaBR(i.valorTotal) },
    ],
  }));
  if (i.justificativa?.trim()) blocos.push(paragrafo({ texto: `Justificativa: ${i.justificativa.trim()}` }));
  for (const p of i.pendencias) blocos.push(paragrafo({ texto: `Pendência: ${p}`, negrito: true }));
  return blocos;
}

export const relatorioPesquisaPrecos: DocumentoModelo<DadosRelatorioPesquisaPrecos> = {
  tipo: 'compras-pesquisa-precos',
  familia: 'relatorio',
  orientacao: 'paisagem',
  titulo: () => 'Relatório da pesquisa de preços',
  subtitulo: (d) => `Processo SEI ${d.numeroSei} · data de referência ${dataBR(d.dataReferencia)}`,
  nomeArquivo: (d) => `pesquisa-precos-${d.numeroSei.replace(/\W+/g, '-')}.pdf`,
  blocos: (d) => {
    const total = d.itens.reduce((s, i) => s + (i.valorTotal ?? 0), 0);
    return [
      camposChaveValor({
        colunas: 3,
        campos: [
          { rotulo: 'Processo SEI', valor: d.numeroSei },
          { rotulo: 'Finalidade', valor: d.finalidade },
          { rotulo: 'Situação', valor: d.situacao },
          { rotulo: 'Objeto', valor: d.objeto },
          ...(d.responsaveis?.trim() ? [{ rotulo: 'Responsáveis pela pesquisa', valor: d.responsaveis.trim() }] : []),
        ],
      }),
      paragrafo({
        texto: 'Parâmetros do art. 17 do Decreto nº 39.050-E/2025: I – sistema oficial (Pesquisa de Preços do Compras.gov.br); '
          + 'II – contratações similares (PNCP); III – mídia especializada, tabela oficial ou sites; IV – pesquisa direta com '
          + 'fornecedores; V – notas fiscais eletrônicas. Prazos: 12 meses nos incisos I, II e V e 6 meses nos III e IV, contados '
          + 'da data de referência. Saneamento (art. 2º, IX e X, e art. 18, § 1º): fora da série o preço mais de 30% acima da média '
          + 'ou 30% ou mais abaixo dela; coeficiente de variação até 30% = média saneada; acima de 30% = mediana.',
      }),
      ...d.itens.flatMap(blocosDoItem),
      secao({ texto: 'Resumo' }),
      d.itens.length === 0
        ? paragrafo({ texto: 'Nenhum item na pesquisa.' })
        : tabela({
            colunas: COLUNAS_RESUMO,
            linhas: d.itens.map((i) => ({
              numero: String(i.numero),
              descricao: i.descricao,
              unidade: i.unidade,
              quantidade: quantidadeBR(Number(i.quantidade)),
              metodo: i.metodoAdotado ? METODO_LABEL[i.metodoAdotado] : '—',
              unitario: i.valorUnitario === null ? '—' : precoBR(i.valorUnitario),
              total: i.valorTotal === null ? '—' : moedaBR(i.valorTotal),
            })),
            totais: { numero: 'TOTAL', total: moedaBR(total) },
          }),
    ];
  },
};
