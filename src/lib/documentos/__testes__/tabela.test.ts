import { describe, expect, it } from 'vitest';
import { tabela, type ColunaTabela } from '../blocos/tabela';
import { renderizarDocumento } from '../core/renderizar';
import type { Bloco, DocumentoModelo, Orientacao } from '../tipos';
import { emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf, mmParaPt } from './lerPdf';

const colunas: ColunaTabela[] = [
  { chave: 'nome', titulo: 'Nome', peso: 3 },
  { chave: 'matricula', titulo: 'Matrícula', peso: 1, alinhamento: 'centro' },
  { chave: 'valor', titulo: 'Valor', peso: 1, alinhamento: 'direita' },
];

const gerar = (blocos: Bloco[], orientacao?: Orientacao) => {
  const modelo: DocumentoModelo<null> = { tipo: 't', familia: 'relatorio', orientacao, titulo: () => 'T', nomeArquivo: () => 't.pdf', blocos: () => blocos };
  return renderizarDocumento(modelo, null, marcaTeste, emissaoTeste).doc;
};

describe('tabela', () => {
  it('200 linhas: várias páginas, cabeçalho repetido em todas, nenhuma linha perdida', async () => {
    const linhas = Array.from({ length: 200 }, (_, i) => ({ nome: `Servidor ${i}`, matricula: `M${i}`, valor: `R$ ${i},00` }));
    const p = await lerPdf(gerar([tabela({ colunas, linhas })]));
    expect(p.length).toBeGreaterThanOrEqual(4);
    for (const pg of p) expect(pg.texto).toContain('Matrícula');
    const lidas = p.flatMap((pg) => pg.itens.map((i) => i.str)).filter((s) => /^Servidor \d+$/.test(s));
    expect(lidas).toEqual(linhas.map((l) => l.nome));
    for (const [n, pg] of p.entries()) expect(pg.texto).toContain(`Página ${n + 1} de ${p.length}`);
  });

  it('sem linhas mostra "Nenhum registro encontrado." junto do cabeçalho', async () => {
    const [p1] = await lerPdf(gerar([tabela({ colunas, linhas: [] })]));
    expect(p1.texto).toContain('Matrícula');
    expect(p1.texto).toContain('Nenhum registro encontrado.');
  });

  it('palavra sem espaço maior que a coluna não ultrapassa a margem direita', async () => {
    const uuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890-a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const p = await lerPdf(gerar([tabela({ colunas, linhas: [{ nome: uuid, matricula: 'x'.repeat(60), valor: '1' }] })]));
    const limite = p[0].largura - mmParaPt(20) + 1;
    for (const i of p[0].itens) expect(i.x + i.largura).toBeLessThanOrEqual(limite);
    expect(p[0].itens.map((i) => i.str).join('').replace(/\s/g, '')).toContain('a1b2c3d4');
  });

  it('null, undefined e vazio viram "—"', async () => {
    const [p1] = await lerPdf(gerar([tabela({ colunas, linhas: [{ nome: null, matricula: undefined, valor: '' }] })]));
    expect(p1.texto).not.toMatch(/null|undefined/);
    expect(p1.itens.filter((i) => i.str === '—')).toHaveLength(3);
  });

  it('linha de totais em negrito aparece depois das linhas, só com as colunas informadas', async () => {
    const [p1] = await lerPdf(gerar([tabela({ colunas, linhas: [{ nome: 'A', matricula: '1', valor: '10' }], totais: { nome: 'TOTAL', valor: '10' } })]));
    expect(p1.texto).toContain('TOTAL');
    expect(p1.itens.filter((i) => i.str === '—')).toHaveLength(0);
  });

  it('formulário: linhas mais baixas, uma linha por registro (corta com "…") e vazio em branco', async () => {
    const linhas = Array.from({ length: 31 }, (_, i) => ({ nome: i === 0 ? 'Nome muito comprido '.repeat(10) : `Dia ${i + 1}`, matricula: '', valor: '—' }));
    const [normal] = await lerPdf(gerar([tabela({ colunas, linhas })]));
    const [form] = await lerPdf(gerar([tabela({ colunas, linhas, formulario: true })]));
    const y = (pg: typeof form, s: string) => pg.itens.find((i) => i.str === s)!.y;
    // Mesmas 31 linhas ocupam bem menos altura no formulário (≈ 4,4 mm contra ≈ 7,3 mm por linha).
    const alturaForm = y(form, 'Dia 2') - y(form, 'Dia 20');
    const alturaNormal = y(normal, 'Dia 2') - y(normal, 'Dia 20');
    expect(alturaForm / 18).toBeLessThan(mmParaPt(4.6));
    expect(alturaForm).toBeLessThan(alturaNormal * 0.65);
    // Texto longo não quebra: uma linha cortada com reticências, dentro da coluna.
    const cortado = form.itens.filter((i) => i.str.startsWith('Nome muito comprido'));
    expect(cortado).toHaveLength(1);
    expect(cortado[0].str.endsWith('…')).toBe(true);
    expect(cortado[0].x + cortado[0].largura).toBeLessThan(mmParaPt(20 + (170 * 3) / 5));
    // Vazio fica em branco (espaço para preencher); "—" explícito continua.
    expect(form.itens.filter((i) => i.str === '—')).toHaveLength(31);
    expect(normal.itens.filter((i) => i.str === '—').length).toBeGreaterThan(31);
  });

  it('em paisagem a tabela usa a largura toda', async () => {
    const p = await lerPdf(gerar([tabela({ colunas, linhas: [{ nome: 'A', matricula: '1', valor: '10' }] })], 'paisagem'));
    const valor = p[0].itens.find((i) => i.str === '10')!;
    expect(valor.x + valor.largura).toBeGreaterThan(mmParaPt(250));
  });

  it('célula vazia sai como "—" por padrão e em branco na coluna emBranco', async () => {
    const linhas = [{ nome: 'A', matricula: '', valor: '10' }];
    const [padrao] = await lerPdf(gerar([tabela({ colunas, linhas })]));
    expect(padrao.texto).toContain('—');
    const emBranco = colunas.map((c) => (c.chave === 'matricula' ? { ...c, emBranco: true } : c));
    const [branco] = await lerPdf(gerar([tabela({ colunas: emBranco, linhas })]));
    expect(branco.texto).not.toContain('—');
    expect(branco.texto).toContain('10');
  });

  it('alturaMinimaLinha afasta as linhas de dados', async () => {
    const linhas = [{ nome: 'A', matricula: '1', valor: '1' }, { nome: 'B', matricula: '2', valor: '2' }];
    const distancia = async (alturaMinimaLinha?: number): Promise<number> => {
      const [p] = await lerPdf(gerar([tabela({ colunas, linhas, alturaMinimaLinha })]));
      const y = (s: string) => p.itens.find((i) => i.str === s)!.y;
      return Math.abs(y('B') - y('A'));
    };
    expect(await distancia(15)).toBeGreaterThan((await distancia()) + mmParaPt(5));
  });
});
