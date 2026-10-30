import { describe, expect, it } from 'vitest';
import { renderizarDocumento } from '../core/renderizar';
import { fichaContrato } from '../modelos/contratos/fichaContrato';
import { REGISTRO } from '../registro';
import { emissaoTeste, marcaTeste } from './fixtures';
import { dadosFichaContrato } from './fixturesContratos';
import { lerPdf } from './lerPdf';

const ler = async (doc: Parameters<typeof lerPdf>[0]) => (await lerPdf(doc)).map((p) => p.texto).join(' ').replace(/\s+/g, ' ');

describe('contratos-ficha-contrato', () => {
  it('está no REGISTRO como ficha', () => {
    expect(REGISTRO['contratos-ficha-contrato']).toBe(fichaContrato);
    expect(fichaContrato.familia).toBe('ficha');
    expect(fichaContrato.nomeArquivo!(dadosFichaContrato())).toBe('contrato-01-2026.pdf');
  });

  it('imprime contrato, vigência, alterações, responsáveis com a portaria, designações encerradas e itens com total', async () => {
    const d = { ...dadosFichaContrato(), avisosAlteracoes: ['Os acréscimos somam 30% do valor inicial atualizado; o limite é 25%.'] };
    const t = await ler(renderizarDocumento(fichaContrato, d, marcaTeste, emissaoTeste).doc);
    for (const s of ['FICHA DO CONTRATO', 'Empresa de Exemplo Ltda', '00.000.000/0001-91', 'Vigente · Vence em 45 dias',
      '00000.000123/2025.11', 'R$ 120.000,00', 'R$ 132.500,50', '02/01/2026 a 01/01/2027', '1º termo aditivo', 'prorroga até 01/01/2028',
      'Situação anterior ao sistema', 'Atenção: Os acréscimos somam 30%', 'Servidor Gestor',
      'Portaria 10/2026', 'Servidor Antigo', 'Exonerado', 'Posto de serviço 3', '1.000,50', 'TOTAL', '36.018,00']) {
      expect(t).toContain(s);
    }
    expect(t).not.toMatch(/undefined|null|NaN/);
  });

  it('sem responsáveis nem itens, e muitos itens em várias páginas', async () => {
    const d = { ...dadosFichaContrato(0), alteracoes: [], responsaveis: [], responsaveisAnteriores: [], publicacaoDoe: undefined };
    const t = await ler(renderizarDocumento(fichaContrato, d, marcaTeste, emissaoTeste).doc);
    for (const s of ['Nenhuma alteração registrada.', 'Nenhum responsável designado.', 'Contrato sem itens cadastrados.', 'não registrada']) expect(t).toContain(s);
    expect(t).not.toContain('Designações encerradas');
    expect(t).not.toMatch(/undefined|null|NaN/);
    const paginas = await lerPdf(renderizarDocumento(fichaContrato, dadosFichaContrato(120), marcaTeste, emissaoTeste).doc);
    expect(paginas.length).toBeGreaterThan(2);
  });
});
