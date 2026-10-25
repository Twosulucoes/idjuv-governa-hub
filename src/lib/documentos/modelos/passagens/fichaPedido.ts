import { camposChaveValor, paragrafo, secao, tabela, type ColunaTabela } from '../../blocos';
import type { Bloco, DocumentoModelo } from '../../tipos';
import { moeda } from '../rh/comum';

/**
 * Ficha do pedido de passagem, para juntar ao processo no SEI quando quiser: dados do pedido, aprovação registrada,
 * passageiros com os trechos e os bilhetes, a fatura de cada bilhete e a prestação de contas. Não é ato: o pedido e a
 * aprovação são do SEI; a ficha só mostra o que foi registrado. Valores em reais; datas já formatadas (dd/mm/aaaa).
 */

export interface TrechoFicha {
  trecho: string;
  dataVoo: string;
  voo?: string;
  situacao: string;
  localizador?: string;
  valor?: number;
  /** Ex.: "NF 123 · paga em 10/11/2026 (OB 2026OB00001)". */
  fatura?: string;
}

export interface PassageiroFicha {
  nome: string;
  tipo: string;
  prestacao?: string;
  trechos: TrechoFicha[];
}

export interface DadosFichaPedidoPassagem {
  numeroSei: string;
  dataPedido: string;
  origem: string;
  solicitante: string;
  evento?: string;
  finalidade: string;
  destino?: string;
  periodo?: string;
  contrato?: string;
  situacao: string;
  aprovacao?: string;
  prestacaoContas: string;
  passageiros: PassageiroFicha[];
  totalEmitido: number;
  totalFaturado: number;
  totalPago: number;
  observacoes?: string;
}

const COLUNAS: ColunaTabela[] = [
  { chave: 'trecho', titulo: 'Trecho', peso: 3 },
  { chave: 'data', titulo: 'Voo', peso: 3 },
  { chave: 'situacao', titulo: 'Situação', peso: 2 },
  { chave: 'localizador', titulo: 'Localizador', peso: 3 },
  { chave: 'valor', titulo: 'Valor (R$)', peso: 2, alinhamento: 'direita' },
  { chave: 'fatura', titulo: 'Fatura / pago', peso: 4 },
];

const valor = (v: number | undefined) => (v === undefined ? '—' : moeda(v).replace(/^R\$\s*/, ''));

function passageiro(p: PassageiroFicha): Bloco[] {
  return [
    secao({ texto: `${p.nome} (${p.tipo})` }),
    ...(p.prestacao ? [paragrafo({ texto: `Prestação de contas: ${p.prestacao}` })] : []),
    p.trechos.length === 0
      ? paragrafo({ texto: 'Nenhum trecho.' })
      : tabela({
          colunas: COLUNAS,
          linhas: p.trechos.map((t) => ({
            trecho: t.trecho,
            data: t.voo ? `${t.dataVoo} · ${t.voo}` : t.dataVoo,
            situacao: t.situacao,
            localizador: t.localizador ?? '—',
            valor: valor(t.valor),
            fatura: t.fatura ?? '—',
          })),
        }),
  ];
}

export const fichaPedidoPassagem: DocumentoModelo<DadosFichaPedidoPassagem> = {
  tipo: 'contratos-passagem-ficha-pedido',
  familia: 'ficha',
  titulo: () => 'Ficha do pedido de passagem',
  subtitulo: (d) => `Processo SEI ${d.numeroSei}`,
  nomeArquivo: (d) => `pedido-passagem-${d.numeroSei.replace(/\W+/g, '-')}.pdf`,
  blocos: (d) => [
    secao({ texto: 'Pedido' }),
    camposChaveValor({
      campos: [
        { rotulo: 'Processo SEI', valor: d.numeroSei },
        { rotulo: 'Data do pedido', valor: `${d.dataPedido} · ${d.origem}` },
        { rotulo: 'Quem pediu', valor: d.solicitante },
        { rotulo: 'Situação', valor: d.situacao },
        { rotulo: 'Evento', valor: d.evento },
        { rotulo: 'Destino', valor: d.destino },
        { rotulo: 'Período', valor: d.periodo },
        { rotulo: 'Contrato', valor: d.contrato },
        { rotulo: 'Aprovação', valor: d.aprovacao ?? 'ainda não registrada' },
        { rotulo: 'Prestação de contas', valor: d.prestacaoContas },
      ],
    }),
    camposChaveValor({ colunas: 1, campos: [{ rotulo: 'Finalidade', valor: d.finalidade }] }),
    ...d.passageiros.flatMap(passageiro),
    secao({ texto: 'Valores' }),
    camposChaveValor({
      colunas: 3,
      campos: [
        { rotulo: 'Emitido', valor: moeda(d.totalEmitido) },
        { rotulo: 'Em fatura', valor: moeda(d.totalFaturado) },
        { rotulo: 'Pago', valor: moeda(d.totalPago) },
      ],
    }),
    ...(d.observacoes ? [camposChaveValor({ colunas: 1, campos: [{ rotulo: 'Observações', valor: d.observacoes }] })] : []),
  ],
};
