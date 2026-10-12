import { describe, expect, it } from 'vitest';
import { renderizarDocumento } from '../core/renderizar';
import { emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf } from './lerPdf';
import { comprovanteReferencia, dadosComprovante, dadosFicha, dadosRelatorio, fichaReferencia, relatorioReferencia } from './modelosReferencia';

describe('uma amostra de cada família', () => {
  it('relatório: paisagem, várias páginas, totais e filtros', async () => {
    const p = await lerPdf(renderizarDocumento(relatorioReferencia, dadosRelatorio, marcaTeste, emissaoTeste).doc);
    expect(p[0].largura).toBeGreaterThan(p[0].altura);
    expect(p.length).toBeGreaterThanOrEqual(2);
    expect(p.map((x) => x.texto).join(' ')).toContain('TOTAL');
    expect(p[0].texto).toContain('Setembro/2026');
  });

  it('ficha: campo ausente vira "—"', async () => {
    const [p1] = await lerPdf(renderizarDocumento(fichaReferencia, dadosFicha, marcaTeste, emissaoTeste).doc);
    expect(p1.texto).toContain('Maria de Souza');
    expect(p1.itens.some((i) => i.str === '—')).toBe(true);
  });

  it('comprovante: protocolo no cabeçalho e linha de autenticidade no rodapé', async () => {
    const [p1] = await lerPdf(renderizarDocumento(comprovanteReferencia, dadosComprovante, marcaTeste, emissaoTeste).doc);
    expect(p1.texto).toContain('Protocolo: FP-2026-000045');
    expect(p1.texto).toContain('Documento emitido eletronicamente — protocolo FP-2026-000045.');
  });
});
