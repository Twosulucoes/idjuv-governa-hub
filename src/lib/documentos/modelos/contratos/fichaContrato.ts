import { camposChaveValor, paragrafo, secao, tabela, type ColunaTabela } from '../../blocos';
import type { DocumentoModelo } from '../../tipos';
import { moeda } from '../rh/comum';

/**
 * Ficha do contrato (Contratos, entregas C1 e C2), para consulta e para juntar ao processo no SEI quando quiser: dados
 * do contrato, vigência, alterações (aditivos, apostilamentos, suspensão, rescisão), publicação, responsáveis
 * designados (com a portaria) e itens. Não é ato: contrato, aditivo e designação são do SEI; a ficha só mostra o que
 * foi registrado. Valores em reais; datas já formatadas (dd/mm/aaaa).
 */

export interface ResponsavelFicha {
  nome: string;
  papel: string;
  /** Ex.: "Portaria 10/2026, de 05/01/2026 (SEI 12345678)". */
  portaria?: string;
  /** Ex.: "desde 05/01/2026" ou "05/01/2026 a 30/06/2026 · exonerado". */
  periodo: string;
}

export interface AlteracaoFicha {
  /** Data do ato (assinatura ou início); vazio na situação anterior ao sistema. */
  data: string;
  /** Ex.: "2º termo aditivo". */
  alteracao: string;
  /** Ex.: "prorroga até 31/12/2027; acrescenta R$ 12.000,00". */
  efeito: string;
  /** Ex.: "Processo 00000.000123/2025.11 · documento 12345678 · DOE 10/01/2027". */
  documento: string;
}

export interface ItemFicha {
  numero: number;
  descricao: string;
  unidade: string;
  quantidade: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface DadosFichaContrato {
  numero: string;
  situacao: string;
  vigenciaSituacao: string;
  contratado: string;
  documentoContratado?: string;
  objeto: string;
  tipo?: string;
  fundamento?: string;
  processoSei?: string;
  processoContratacao?: string;
  numeroPncp?: string;
  setor?: string;
  natureza?: string;
  dotacao?: string;
  valorInicial: number;
  valorAtual: number;
  assinatura: string;
  vigencia: string;
  prorrogacao: string;
  publicacaoDoe?: string;
  garantia?: string;
  alteracoes: AlteracaoFicha[];
  /** Avisos dos limites da Lei 14.133 (acréscimo, supressão, prazo máximo). */
  avisosAlteracoes: string[];
  responsaveis: ResponsavelFicha[];
  responsaveisAnteriores: ResponsavelFicha[];
  itens: ItemFicha[];
  observacoes?: string;
}

const COLUNAS_RESP: ColunaTabela[] = [
  { chave: 'papel', titulo: 'Papel', peso: 3 },
  { chave: 'nome', titulo: 'Servidor', peso: 5 },
  { chave: 'portaria', titulo: 'Portaria', peso: 5 },
  { chave: 'periodo', titulo: 'Período', peso: 4 },
];

const COLUNAS_ALTERACOES: ColunaTabela[] = [
  { chave: 'data', titulo: 'Data', peso: 2 },
  { chave: 'alteracao', titulo: 'Alteração', peso: 3 },
  { chave: 'efeito', titulo: 'O que muda', peso: 6 },
  { chave: 'documento', titulo: 'Documento no SEI', peso: 5 },
];

const COLUNAS_ITENS: ColunaTabela[] = [
  { chave: 'numero', titulo: 'Nº', peso: 1, alinhamento: 'direita' },
  { chave: 'descricao', titulo: 'Descrição', peso: 6 },
  { chave: 'unidade', titulo: 'Unid.', peso: 3 },
  { chave: 'quantidade', titulo: 'Qtd.', peso: 2, alinhamento: 'direita' },
  { chave: 'unitario', titulo: 'Unitário (R$)', peso: 3, alinhamento: 'direita' },
  { chave: 'total', titulo: 'Total (R$)', peso: 3, alinhamento: 'direita' },
];

const semRS = (v: number) => moeda(v).replace(/^R\$\s*/, '');
const QTD = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 });

const linhasResp = (lista: ResponsavelFicha[]) =>
  lista.map((r) => ({ papel: r.papel, nome: r.nome, portaria: r.portaria ?? '—', periodo: r.periodo }));

export const fichaContrato: DocumentoModelo<DadosFichaContrato> = {
  tipo: 'contratos-ficha-contrato',
  familia: 'ficha',
  titulo: () => 'Ficha do contrato',
  subtitulo: (d) => `Contrato ${d.numero} · ${d.contratado}`,
  nomeArquivo: (d) => `contrato-${d.numero.replace(/\W+/g, '-')}.pdf`,
  blocos: (d) => {
    const totalItens = d.itens.reduce((s, i) => s + i.valorTotal, 0);
    return [
      secao({ texto: 'Contrato' }),
      camposChaveValor({
        campos: [
          { rotulo: 'Contrato', valor: d.numero },
          { rotulo: 'Situação', valor: `${d.situacao} · ${d.vigenciaSituacao}` },
          { rotulo: 'Contratado', valor: d.documentoContratado ? `${d.contratado} (${d.documentoContratado})` : d.contratado },
          { rotulo: 'Tipo', valor: d.tipo },
          { rotulo: 'Processo SEI', valor: d.processoSei },
          { rotulo: 'Processo de contratação', valor: d.processoContratacao },
          { rotulo: 'Modalidade e fundamento', valor: d.fundamento },
          { rotulo: 'Nº no PNCP', valor: d.numeroPncp },
          { rotulo: 'Setor que pediu', valor: d.setor },
          { rotulo: 'Natureza da despesa', valor: d.natureza },
          { rotulo: 'Dotação', valor: d.dotacao },
        ],
      }),
      camposChaveValor({ colunas: 1, campos: [{ rotulo: 'Objeto', valor: d.objeto }] }),
      secao({ texto: 'Valores e vigência' }),
      camposChaveValor({
        campos: [
          { rotulo: 'Valor inicial', valor: moeda(d.valorInicial) },
          { rotulo: 'Valor atual', valor: moeda(d.valorAtual) },
          { rotulo: 'Assinatura', valor: d.assinatura },
          { rotulo: 'Vigência', valor: d.vigencia },
          { rotulo: 'Prorrogação', valor: d.prorrogacao },
          { rotulo: 'Publicação no DOE', valor: d.publicacaoDoe ?? 'não registrada' },
          { rotulo: 'Garantia', valor: d.garantia },
        ],
      }),
      secao({ texto: 'Alterações' }),
      d.alteracoes.length === 0
        ? paragrafo({ texto: 'Nenhuma alteração registrada.' })
        : tabela({ colunas: COLUNAS_ALTERACOES, linhas: d.alteracoes.map((a) => ({ ...a, data: a.data || '—', documento: a.documento || '—' })) }),
      ...d.avisosAlteracoes.map((t) => paragrafo({ texto: `Atenção: ${t}` })),
      secao({ texto: 'Gestor e fiscais' }),
      d.responsaveis.length === 0
        ? paragrafo({ texto: 'Nenhum responsável designado.' })
        : tabela({ colunas: COLUNAS_RESP, linhas: linhasResp(d.responsaveis) }),
      ...(d.responsaveisAnteriores.length
        ? [secao({ texto: 'Designações encerradas' }), tabela({ colunas: COLUNAS_RESP, linhas: linhasResp(d.responsaveisAnteriores) })]
        : []),
      secao({ texto: 'Itens' }),
      d.itens.length === 0
        ? paragrafo({ texto: 'Contrato sem itens cadastrados.' })
        : tabela({
            colunas: COLUNAS_ITENS,
            linhas: [
              ...d.itens.map((i) => ({
                numero: String(i.numero),
                descricao: i.descricao,
                unidade: i.unidade,
                quantidade: QTD.format(i.quantidade),
                unitario: semRS(i.valorUnitario),
                total: semRS(i.valorTotal),
              })),
              { numero: '', descricao: 'TOTAL', unidade: '', quantidade: '', unitario: '', total: semRS(totalItens) },
            ],
          }),
      ...(d.observacoes ? [camposChaveValor({ colunas: 1, campos: [{ rotulo: 'Observações', valor: d.observacoes }] })] : []),
    ];
  },
};
