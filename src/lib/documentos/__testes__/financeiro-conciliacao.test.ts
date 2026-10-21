import { describe, expect, it } from 'vitest';
import { renderizarDocumento } from '../core/renderizar';
import { conciliacaoMensal, type DadosConciliacaoMensal } from '../modelos/financeiro/conciliacaoMensal';
import { REGISTRO } from '../registro';
import { emissaoTeste, marcaTeste } from './fixtures';
import { dadosConciliacao } from './fixturesConciliacao';
import { lerPdf } from './lerPdf';

const texto = async (d: DadosConciliacaoMensal) =>
  (await lerPdf(renderizarDocumento(conciliacaoMensal, d, marcaTeste, emissaoTeste).doc)).map((p) => p.texto).join(' ').replace(/\s+/g, ' ');

describe('financeiro-conciliacao-mensal', () => {
  it('está no REGISTRO como relatório', () => {
    expect(REGISTRO['financeiro-conciliacao-mensal']).toBe(conciliacaoMensal);
    expect(conciliacaoMensal.familia).toBe('relatorio');
  });

  it('imprime o quadro, as listas e quem fez', async () => {
    const t = await texto(dadosConciliacao());
    for (const s of ['CONCILIAÇÃO BANCÁRIA', 'Julho/2026', 'C/Corrente e Aplicação', '00000-0', 'SALDO DO RAZÃO', '3.400,00',
      'CRÉDITOS CONTÁBEIS NÃO CORRESPONDIDOS NO BANCO (+)', '800,00', 'SALDO DO RAZÃO AJUSTADO', '4.304,34', 'SALDO DO EXTRATO',
      'TARIFA PAGAMENTOS', 'ORDEM BANC CANCELADA', 'Nenhuma pendência.', 'Cidade/UF, 06/08/2026.', 'Fulano de Teste', 'Feito por', 'Anexo 4']) {
      expect(t).toContain(s);
    }
    expect(t).not.toContain('RASCUNHO');
    expect(t).not.toMatch(/undefined|null|NaN/);
  });

  it('avisa o rascunho e aguenta lista longa em várias páginas', async () => {
    const d = { ...dadosConciliacao(120), rascunho: true, feitoPor: undefined, local: undefined };
    const paginas = await lerPdf(renderizarDocumento(conciliacaoMensal, d, marcaTeste, emissaoTeste).doc);
    expect(paginas.length).toBeGreaterThan(2);
    const t = paginas.map((p) => p.texto).join(' ');
    expect(t).toContain('RASCUNHO');
    expect(t).toContain('00001.0001.26.00120-1');
    expect(t).not.toContain('Feito por');
  });
});
