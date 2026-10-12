import { describe, expect, it } from 'vitest';
import { renderizarDocumento } from '../core/renderizar';
import { requerimentoModelo, type DadosRequerimento } from '../modelos/requerimento';
import { emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf } from './lerPdf';

const dados: DadosRequerimento = {
  requerente: { nome: 'João da Silva', cpf: '000.000.000-00', matricula: '1234', cargo: 'Analista', unidade: 'Divisão de Teste' },
  destinatario: 'Ao Ilmo. Sr. Presidente do Instituto',
  assunto: 'Solicitação de férias',
  texto: 'Venho requerer o gozo de férias regulamentares referentes ao exercício de 2026.',
  local: 'Boa Vista',
  data: '12 de outubro de 2026',
  protocolo: 'RH-2026-000123',
  unidadeEmissora: ['DIVISÃO DE TESTE'],
};

const gerar = (d: DadosRequerimento) => renderizarDocumento(requerimentoModelo, d, marcaTeste, emissaoTeste);

describe('requerimento', () => {
  it('imprime título, requerente, assunto, texto, local/data, fecho, assinatura e protocolo', async () => {
    const { doc } = gerar(dados);
    const [p1] = await lerPdf(doc);
    for (const t of ['REQUERIMENTO', 'João da Silva', 'Solicitação de férias', 'gozo de férias', 'Boa Vista, 12 de outubro de 2026.', 'pede deferimento', 'Protocolo: RH-2026-000123', 'DIVISÃO DE TESTE']) {
      expect(p1.texto).toContain(t);
    }
  });

  it('campos opcionais ausentes não geram "undefined"; fundamentação e anexos só aparecem quando informados', async () => {
    const enxuto: DadosRequerimento = { ...dados, requerente: { nome: 'Maria' }, protocolo: undefined, unidadeEmissora: undefined };
    const [sem] = await lerPdf(gerar(enxuto).doc);
    expect(sem.texto).not.toMatch(/undefined|null/);
    expect(sem.texto).not.toContain('Fundamentação');
    expect(sem.texto).not.toContain('Anexos');
    expect(sem.texto).not.toContain('Protocolo');

    const [com] = await lerPdf(gerar({ ...dados, fundamentacao: 'Art. 1º da lei X.', anexos: ['Cópia do RG', 'Comprovante'] }).doc);
    expect(com.texto).toContain('Fundamentação');
    expect(com.texto).toContain('1. Cópia do RG');
    expect(com.texto).toContain('2. Comprovante');
  });

  it('nome do arquivo usa o protocolo, ou o requerente quando não há protocolo', () => {
    expect(gerar(dados).nomeArquivo).toBe('Requerimento_RH-2026-000123.pdf');
    expect(gerar({ ...dados, protocolo: undefined }).nomeArquivo).toBe('Requerimento_Joao-da-Silva.pdf');
  });

  it('texto muito longo atravessa páginas e a assinatura vai para o fim', async () => {
    const longo = 'Considerando o exposto, solicito providências. '.repeat(120);
    const p = await lerPdf(gerar({ ...dados, texto: longo }).doc);
    expect(p.length).toBeGreaterThanOrEqual(2);
    expect(p[p.length - 1].texto).toContain('João da Silva');
  });
});
