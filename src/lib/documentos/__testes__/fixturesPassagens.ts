import type { DadosFichaPedidoPassagem } from '../modelos/passagens/fichaPedido';
import type { DadosSaldoContratoPassagens } from '../modelos/passagens/saldoContrato';

export const dadosFichaPedido = (passageiros = 2): DadosFichaPedidoPassagem => ({
  numeroSei: '00000.000001/2026-01',
  dataPedido: '01/10/2026',
  origem: 'SEI',
  solicitante: 'Federação de Exemplo',
  evento: 'Campeonato de Exemplo',
  finalidade: 'Participação da delegação no campeonato.',
  destino: 'Cidade/UF',
  periodo: '03/11/2026 a 08/11/2026',
  contrato: '01/2026 · Agência de Exemplo',
  situacao: 'Emitido',
  aprovacao: 'Documento SEI 12345678, 05/10/2026',
  prestacaoContas: 'Individual (cada passageiro)',
  passageiros: Array.from({ length: passageiros }, (_, i) => ({
    nome: `Passageiro ${i + 1}`,
    tipo: i === 0 ? 'servidor' : 'beneficiário',
    prestacao: i === 0 ? 'cartão de embarque entregue em 10/11/2026' : undefined,
    trechos: [
      { trecho: 'AAA - BBB', dataVoo: '03/11/2026', voo: 'XX 1234', situacao: 'Emitido', localizador: `LOC${i}A`, valor: 1060.5, fatura: 'NF 123 · paga em 20/11/2026 (OB 2026OB00001)' },
      { trecho: 'BBB - AAA', dataVoo: '08/11/2026', situacao: 'Emitido', localizador: `LOC${i}B`, valor: 980, fatura: undefined },
    ],
  })),
  totalEmitido: 2040.5 * passageiros,
  totalFaturado: 1060.5 * passageiros,
  totalPago: 1060.5 * passageiros,
});

export const dadosSaldoContrato = (faturas = 3): DadosSaldoContratoPassagens => ({
  contrato: '01/2026',
  fornecedor: 'Agência de Exemplo',
  vigencia: '01/01/2026 a 31/12/2026',
  valor: 1_000_000,
  emitido: 250_000,
  faturado: 200_000,
  pago: 150_000,
  aFaturar: 50_000,
  aFaturarAtrasados: 4,
  saldo: 750_000,
  exercicios: [{ exercicio: 2026, empenhado: 300_000, emitido: 250_000, liquidado: 200_000, pago: 150_000, disponivel: 50_000 }],
  faturas: Array.from({ length: faturas }, (_, i) => ({
    numero: `NF-${i + 1}`,
    emissao: '10/10/2026',
    bilhetes: 3,
    valor: 1000 + i,
    situacao: i % 2 ? 'Paga' : 'Atestada',
    pagamento: i % 2 ? '20/10/2026 · OB 2026OB0000' + i : undefined,
  })),
  posicaoEm: '25/10/2026',
});
