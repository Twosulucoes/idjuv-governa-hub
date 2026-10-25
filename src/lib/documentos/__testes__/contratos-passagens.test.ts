import { describe, expect, it } from 'vitest';
import { renderizarDocumento } from '../core/renderizar';
import { fichaPedidoPassagem } from '../modelos/passagens/fichaPedido';
import { saldoContratoPassagens } from '../modelos/passagens/saldoContrato';
import { REGISTRO } from '../registro';
import { emissaoTeste, marcaTeste } from './fixtures';
import { dadosFichaPedido, dadosSaldoContrato } from './fixturesPassagens';
import { lerPdf } from './lerPdf';

const ler = async (doc: Parameters<typeof lerPdf>[0]) => (await lerPdf(doc)).map((p) => p.texto).join(' ').replace(/\s+/g, ' ');

describe('contratos-passagem-ficha-pedido', () => {
  it('está no REGISTRO como ficha', () => {
    expect(REGISTRO['contratos-passagem-ficha-pedido']).toBe(fichaPedidoPassagem);
    expect(fichaPedidoPassagem.familia).toBe('ficha');
  });

  it('imprime o pedido, os passageiros, os bilhetes, a fatura e os totais', async () => {
    const t = await ler(renderizarDocumento(fichaPedidoPassagem, dadosFichaPedido(), marcaTeste, emissaoTeste).doc);
    for (const s of ['FICHA DO PEDIDO DE PASSAGEM', '00000.000001/2026-01', 'Federação de Exemplo', 'Campeonato de Exemplo',
      'Documento SEI 12345678', 'Passageiro 2 (beneficiário)', 'LOC0A', '1.060,50', 'NF 123', 'cartão de embarque entregue',
      'R$ 4.081,00', 'R$ 2.121,00']) {
      expect(t).toContain(s);
    }
    expect(t).not.toMatch(/undefined|null|NaN/);
  });

  it('sem aprovação nem passageiros, e muitos passageiros em várias páginas', async () => {
    const d = { ...dadosFichaPedido(0), aprovacao: undefined, evento: undefined };
    const t = await ler(renderizarDocumento(fichaPedidoPassagem, d, marcaTeste, emissaoTeste).doc);
    expect(t).toContain('ainda não registrada');
    expect(t).not.toMatch(/undefined|null|NaN/);
    const paginas = await lerPdf(renderizarDocumento(fichaPedidoPassagem, dadosFichaPedido(30), marcaTeste, emissaoTeste).doc);
    expect(paginas.length).toBeGreaterThan(2);
  });
});

describe('contratos-passagens-saldo-contrato', () => {
  it('está no REGISTRO como relatório', () => {
    expect(REGISTRO['contratos-passagens-saldo-contrato']).toBe(saldoContratoPassagens);
    expect(saldoContratoPassagens.familia).toBe('relatorio');
  });

  it('imprime o saldo, o empenho do exercício e as faturas', async () => {
    const t = await ler(renderizarDocumento(saldoContratoPassagens, dadosSaldoContrato(), marcaTeste, emissaoTeste).doc);
    for (const s of ['SALDO DO CONTRATO DE PASSAGENS AÉREAS', 'posição em 25/10/2026', 'Agência de Exemplo', 'R$ 1.000.000,00',
      '(4 há mais de 30 dias)', 'R$ 750.000,00', '2026', '300.000,00', 'NF-2', 'OB 2026OB00001', 'TOTAL', '3.003,00']) {
      expect(t).toContain(s);
    }
    expect(t).not.toMatch(/undefined|null|NaN/);
  });

  it('sem empenho nem fatura, e muitas faturas em várias páginas', async () => {
    const d = { ...dadosSaldoContrato(0), exercicios: [], aFaturarAtrasados: 0 };
    const t = await ler(renderizarDocumento(saldoContratoPassagens, d, marcaTeste, emissaoTeste).doc);
    expect(t).toContain('Nenhum empenho ligado ao contrato.');
    expect(t).toContain('Nenhuma fatura lançada.');
    expect(t).not.toContain('há mais de 30 dias');
    const paginas = await lerPdf(renderizarDocumento(saldoContratoPassagens, dadosSaldoContrato(120), marcaTeste, emissaoTeste).doc);
    expect(paginas.length).toBeGreaterThan(2);
  });
});
