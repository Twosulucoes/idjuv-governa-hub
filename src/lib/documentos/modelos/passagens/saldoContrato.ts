import { camposChaveValor, paragrafo, secao, tabela, type ColunaTabela } from '../../blocos';
import type { DocumentoModelo } from '../../tipos';
import { moeda } from '../rh/comum';

/**
 * Saldo do contrato da agência de passagens: valor, emitido, faturado, pago, a faturar e saldo; o empenho de cada
 * exercício × emitido no ano; e a lista das faturas. O FIPLAN é o oficial: o liquidado e o pago dos empenhos vêm da
 * última importação do FIP 614. Valores em reais; datas já formatadas (dd/mm/aaaa).
 */

export interface ExercicioSaldo {
  exercicio: number;
  empenhado: number;
  emitido: number;
  liquidado: number;
  pago: number;
  disponivel: number;
}

export interface FaturaSaldo {
  numero: string;
  emissao: string;
  bilhetes: number;
  valor: number;
  situacao: string;
  /** Ex.: "10/11/2026 · OB 2026OB00001". */
  pagamento?: string;
}

export interface DadosSaldoContratoPassagens {
  contrato: string;
  fornecedor: string;
  vigencia: string;
  valor: number;
  emitido: number;
  faturado: number;
  pago: number;
  aFaturar: number;
  /** Bilhetes sem nota há mais de 30 dias. */
  aFaturarAtrasados: number;
  saldo: number;
  exercicios: ExercicioSaldo[];
  faturas: FaturaSaldo[];
  /** dd/mm/aaaa */
  posicaoEm: string;
}

const v = (n: number) => moeda(n).replace(/^R\$\s*/, '');

const COLUNAS_EXERCICIO: ColunaTabela[] = [
  { chave: 'exercicio', titulo: 'Exercício', peso: 2 },
  { chave: 'empenhado', titulo: 'Empenhado (R$)', peso: 3, alinhamento: 'direita' },
  { chave: 'emitido', titulo: 'Emitido (R$)', peso: 3, alinhamento: 'direita' },
  { chave: 'disponivel', titulo: 'Sobra do empenho (R$)', peso: 3, alinhamento: 'direita' },
  { chave: 'liquidado', titulo: 'Liquidado (R$)', peso: 3, alinhamento: 'direita' },
  { chave: 'pago', titulo: 'Pago (R$)', peso: 3, alinhamento: 'direita' },
];

const COLUNAS_FATURA: ColunaTabela[] = [
  { chave: 'numero', titulo: 'Nota', peso: 2 },
  { chave: 'emissao', titulo: 'Emissão', peso: 2 },
  { chave: 'bilhetes', titulo: 'Bilhetes', peso: 2, alinhamento: 'direita' },
  { chave: 'valor', titulo: 'Valor (R$)', peso: 2, alinhamento: 'direita' },
  { chave: 'situacao', titulo: 'Situação', peso: 2 },
  { chave: 'pagamento', titulo: 'Pagamento', peso: 4 },
];

export const saldoContratoPassagens: DocumentoModelo<DadosSaldoContratoPassagens> = {
  tipo: 'contratos-passagens-saldo-contrato',
  familia: 'relatorio',
  orientacao: 'retrato',
  titulo: () => 'Saldo do contrato de passagens aéreas',
  subtitulo: (d) => `Contrato ${d.contrato} · posição em ${d.posicaoEm}`,
  nomeArquivo: (d) => `saldo-passagens-${d.contrato.replace(/\W+/g, '-')}.pdf`,
  blocos: (d) => [
    camposChaveValor({
      colunas: 3,
      campos: [
        { rotulo: 'Contrato', valor: d.contrato },
        { rotulo: 'Agência', valor: d.fornecedor },
        { rotulo: 'Vigência', valor: d.vigencia },
      ],
    }),
    secao({ texto: 'Contrato' }),
    camposChaveValor({
      colunas: 3,
      campos: [
        { rotulo: 'Valor do contrato', valor: moeda(d.valor) },
        { rotulo: 'Emitido (bilhetes)', valor: moeda(d.emitido) },
        { rotulo: 'Faturado (notas)', valor: moeda(d.faturado) },
        { rotulo: 'Pago', valor: moeda(d.pago) },
        { rotulo: 'A faturar', valor: `${moeda(d.aFaturar)}${d.aFaturarAtrasados ? ` (${d.aFaturarAtrasados} há mais de 30 dias)` : ''}` },
        { rotulo: 'Saldo', valor: moeda(d.saldo) },
      ],
    }),
    paragrafo({ texto: 'Saldo = valor do contrato menos o faturado e o a faturar.' }),
    secao({ texto: 'Empenho por exercício' }),
    d.exercicios.length === 0
      ? paragrafo({ texto: 'Nenhum empenho ligado ao contrato.' })
      : tabela({
          colunas: COLUNAS_EXERCICIO,
          linhas: d.exercicios.map((e) => ({
            exercicio: String(e.exercicio),
            empenhado: v(e.empenhado),
            emitido: v(e.emitido),
            disponivel: v(e.disponivel),
            liquidado: v(e.liquidado),
            pago: v(e.pago),
          })),
        }),
    secao({ texto: `Faturas (${d.faturas.length})` }),
    d.faturas.length === 0
      ? paragrafo({ texto: 'Nenhuma fatura lançada.' })
      : tabela({
          colunas: COLUNAS_FATURA,
          linhas: d.faturas.map((f) => ({
            numero: f.numero,
            emissao: f.emissao,
            bilhetes: String(f.bilhetes),
            valor: v(f.valor),
            situacao: f.situacao,
            pagamento: f.pagamento ?? '—',
          })),
          totais: { numero: 'TOTAL', valor: v(d.faturas.reduce((s, f) => s + f.valor, 0)) },
        }),
  ],
};
