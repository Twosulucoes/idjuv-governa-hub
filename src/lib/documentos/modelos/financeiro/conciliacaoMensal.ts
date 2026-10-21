import { assinaturas, camposChaveValor, localData, paragrafo, quebraPagina, secao, tabela, type ColunaTabela } from '../../blocos';
import type { Bloco, DocumentoModelo } from '../../tipos';
import { moeda } from '../rh/comum';

/**
 * Quadro da conciliação bancária mensal, no formato que a SEFAZ pede: saldo do razão, as quatro listas de
 * pendências, saldo ajustado e saldo do extrato, com local, data e quem fez. Depois, em anexo, o detalhe de cada
 * lista. Valores em reais.
 */

export interface PendenciaQuadro {
  /** dd/mm/aaaa */
  data: string;
  documento: string;
  historico: string;
  valor: number;
}

export interface DadosConciliacaoMensal {
  /** Ex.: "Julho/2026". */
  competencia: string;
  banco: string;
  agencia: string;
  conta: string;
  saldoRazao: number;
  saldoConta: number;
  saldoFundo: number;
  saldoAjustado: number;
  saldoExtrato: number;
  debitosContabeis: PendenciaQuadro[];
  creditosContabeis: PendenciaQuadro[];
  debitosBancarios: PendenciaQuadro[];
  creditosBancarios: PendenciaQuadro[];
  /** Mês ainda em rascunho: o PDF avisa. */
  rascunho: boolean;
  local?: string;
  /** Data por extenso ou dd/mm/aaaa. */
  data: string;
  feitoPor?: string;
}

const valor = (v: number) => moeda(v).replace(/^R\$\s*/, '');
const soma = (l: PendenciaQuadro[]) => l.reduce((s, p) => s + p.valor, 0);

const COLUNAS_QUADRO: ColunaTabela[] = [
  { chave: 'descricao', titulo: 'Conciliação', peso: 5 },
  { chave: 'valor', titulo: 'Valor (R$)', peso: 2, alinhamento: 'direita' },
];

const COLUNAS_LISTA: ColunaTabela[] = [
  { chave: 'data', titulo: 'Data', peso: 2 },
  { chave: 'documento', titulo: 'Documento', peso: 4 },
  { chave: 'historico', titulo: 'Histórico', peso: 7 },
  { chave: 'valor', titulo: 'Valor (R$)', peso: 3, alinhamento: 'direita' },
];

function lista(titulo: string, itens: PendenciaQuadro[]): Bloco[] {
  if (itens.length === 0) return [secao({ texto: titulo }), paragrafo({ texto: 'Nenhuma pendência.' })];
  return [
    secao({ texto: `${titulo} (${itens.length})` }),
    tabela({
      colunas: COLUNAS_LISTA,
      linhas: itens.map((p) => ({ data: p.data, documento: p.documento || '—', historico: p.historico || '—', valor: valor(p.valor) })),
      totais: { data: 'TOTAL', valor: valor(soma(itens)) },
    }),
  ];
}

export const conciliacaoMensal: DocumentoModelo<DadosConciliacaoMensal> = {
  tipo: 'financeiro-conciliacao-mensal',
  familia: 'relatorio',
  orientacao: 'retrato',
  titulo: () => 'Conciliação bancária',
  subtitulo: (d) => `Referente ao mês de ${d.competencia}`,
  nomeArquivo: (d) => `conciliacao-${d.conta.replace(/\W/g, '')}-${d.competencia.replace(/\W+/g, '-').toLowerCase()}.pdf`,
  blocos: (d) => {
    const diferenca = Math.round((d.saldoAjustado - d.saldoExtrato) * 100) / 100;
    return [
      ...(d.rascunho ? [paragrafo({ texto: 'RASCUNHO: o mês ainda não foi fechado no sistema.', negrito: true })] : []),
      camposChaveValor({
        colunas: 3,
        campos: [
          { rotulo: 'Banco', valor: d.banco },
          { rotulo: 'Agência', valor: d.agencia },
          { rotulo: 'C/Corrente e Aplicação', valor: d.conta },
        ],
      }),
      secao({ texto: 'Quadro' }),
      tabela({
        colunas: COLUNAS_QUADRO,
        linhas: [
          { descricao: 'SALDO DO RAZÃO', valor: valor(d.saldoRazao) },
          { descricao: 'DÉBITOS CONTÁBEIS NÃO CORRESPONDIDOS NO BANCO (-)', valor: valor(soma(d.debitosContabeis)) },
          { descricao: 'CRÉDITOS CONTÁBEIS NÃO CORRESPONDIDOS NO BANCO (+)', valor: valor(soma(d.creditosContabeis)) },
          { descricao: 'DÉBITOS BANCÁRIOS NÃO CORRESPONDIDOS NO RAZÃO (-)', valor: valor(soma(d.debitosBancarios)) },
          { descricao: 'CRÉDITOS BANCÁRIOS NÃO CORRESPONDIDOS NO RAZÃO (+)', valor: valor(soma(d.creditosBancarios)) },
          { descricao: 'SALDO DO RAZÃO AJUSTADO', valor: valor(d.saldoAjustado) },
          { descricao: 'SALDO DO EXTRATO', valor: valor(d.saldoExtrato) },
          { descricao: 'DIFERENÇA', valor: valor(diferenca) },
        ],
      }),
      camposChaveValor({
        colunas: 2,
        campos: [
          { rotulo: 'Saldo da conta corrente', valor: moeda(d.saldoConta) },
          { rotulo: 'Saldo do fundo de aplicação', valor: moeda(d.saldoFundo) },
        ],
      }),
      d.local ? localData({ local: d.local, data: d.data }) : paragrafo({ texto: `${d.data}.` }),
      ...(d.feitoPor ? [assinaturas({ assinantes: [{ nome: d.feitoPor, cargo: 'Feito por' }] })] : []),
      // Anexo, em página nova: o detalhe de cada lista do quadro
      quebraPagina(),
      ...lista('Anexo 1: débitos contábeis não correspondidos no banco', d.debitosContabeis),
      ...lista('Anexo 2: créditos contábeis não correspondidos no banco', d.creditosContabeis),
      ...lista('Anexo 3: débitos bancários não correspondidos no razão', d.debitosBancarios),
      ...lista('Anexo 4: créditos bancários não correspondidos no razão', d.creditosBancarios),
    ];
  },
};
