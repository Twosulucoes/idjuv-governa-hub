import type { DadosConciliacaoMensal, PendenciaQuadro } from '../modelos/financeiro/conciliacaoMensal';

// Dados fictícios.
const pend = (n: number, valor: number): PendenciaQuadro => ({
  data: '24/07/2026',
  documento: `00001.0001.26.${String(n).padStart(5, '0')}-1`,
  historico: `Pagamento do EMP Nº ${n}`,
  valor,
});

export const dadosConciliacao = (creditos = 2): DadosConciliacaoMensal => ({
  competencia: 'Julho/2026',
  banco: '001',
  agencia: '0000-0',
  conta: '00000-0',
  saldoRazao: 3400,
  saldoConta: 4304.34,
  saldoFundo: 0,
  saldoAjustado: 4304.34,
  saldoExtrato: 4304.34,
  debitosContabeis: [],
  creditosContabeis: Array.from({ length: creditos }, (_, i) => pend(i + 1, creditos === 2 ? 400 : 1)),
  debitosBancarios: [{ data: '31/07/2026', documento: '', historico: 'TARIFA PAGAMENTOS', valor: 8 }],
  creditosBancarios: [
    { data: '06/07/2026', documento: '4260001010000', historico: 'ORDEM BANC CANCELADA', valor: 100 },
    { data: '31/07/2026', documento: '', historico: 'RENDIMENTOS APLICAÇÃO FINANCEIRA', valor: 12.34 },
  ],
  rascunho: false,
  local: 'Cidade/UF',
  data: '06/08/2026',
  feitoPor: 'Fulano de Teste',
});
