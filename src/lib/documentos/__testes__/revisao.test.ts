import { describe, expect, it } from 'vitest';
import { camposChaveValor } from '../blocos/camposChaveValor';
import { paragrafo } from '../blocos/paragrafo';
import { tabela } from '../blocos/tabela';
import { renderizarDocumento } from '../core/renderizar';
import type { Bloco, DocumentoModelo, MarcaImpressao } from '../tipos';
import { PNG_1X1, emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf, mmParaPt, type PaginaLida } from './lerPdf';

const gerar = (blocos: Bloco[], marca: MarcaImpressao = marcaTeste, familia: 'ficha' | 'relatorio' = 'ficha') => {
  const modelo: DocumentoModelo<null> = { tipo: 't', familia, titulo: () => 'T', nomeArquivo: () => 't.pdf', blocos: () => blocos };
  return renderizarDocumento(modelo, null, marca, emissaoTeste).doc;
};

/** Agrupa os itens de uma página em linhas (mesmo y), da de cima para a de baixo. */
const linhasDe = (p: PaginaLida, filtro: (s: string) => boolean) => {
  const porY = new Map<number, { x: number; fim: number }[]>();
  for (const i of p.itens.filter((it) => filtro(it.str))) {
    const y = Math.round(i.y);
    porY.set(y, [...(porY.get(y) ?? []), { x: i.x, fim: i.x + i.largura }]);
  }
  return [...porY.entries()].sort((a, b) => b[0] - a[0]).map(([y, it]) => ({ y, ini: Math.min(...it.map((v) => v.x)), fim: Math.max(...it.map((v) => v.fim)) }));
};

describe('parágrafo: justificado de verdade, recuo e quebras Windows', () => {
  const margemDireita = (p: PaginaLida) => p.largura - mmParaPt(20);
  const texto = Array.from({ length: 150 }, () => 'palavra').join(' ');

  it('justificado: toda linha, menos a última, termina na margem direita', async () => {
    const [p1] = await lerPdf(gerar([paragrafo({ texto, alinhamento: 'justificado' })]));
    const linhas = linhasDe(p1, (s) => s.startsWith('palavra'));
    expect(linhas.length).toBeGreaterThan(3);
    for (const l of linhas.slice(0, -1)) expect(Math.abs(l.fim - margemDireita(p1))).toBeLessThan(1);
  });

  it('justificado com recuo: a 1ª linha começa recuada e também termina na margem', async () => {
    const [p1] = await lerPdf(gerar([paragrafo({ texto, alinhamento: 'justificado', recuoPrimeiraLinha: 12 })]));
    const linhas = linhasDe(p1, (s) => s.startsWith('palavra'));
    expect(linhas[0].ini).toBeGreaterThan(linhas[1].ini + mmParaPt(11));
    for (const l of linhas.slice(0, -1)) expect(Math.abs(l.fim - margemDireita(p1))).toBeLessThan(1);
  });

  it('recuo só afeta a 1ª linha: as seguintes usam a largura toda', async () => {
    const [p1] = await lerPdf(gerar([paragrafo({ texto, recuoPrimeiraLinha: 12 })]));
    const linhas = linhasDe(p1, (s) => s.startsWith('palavra'));
    const maisLarga = Math.max(...linhas.slice(1, -1).map((l) => l.fim));
    expect(maisLarga).toBeGreaterThan(margemDireita(p1) - mmParaPt(8));
  });

  it('quebra de linha do Windows (\\r\\n) tem a mesma entrelinha que \\n', async () => {
    const dist = async (t: string) => {
      const [p] = await lerPdf(gerar([paragrafo({ texto: t })]));
      const ys = p.itens.filter((i) => ['a', 'b', 'c'].includes(i.str)).map((i) => i.y).sort((x, y) => y - x);
      return ys[0] - ys[1];
    };
    expect(await dist('a\r\nb\r\nc')).toBeCloseTo(await dist('a\nb\nc'), 1);
  });
});

describe('conteúdo maior que a página nunca invade o rodapé', () => {
  const rodapeY = mmParaPt(22) - 0.5;
  const todosAcimaDoRodape = (paginas: PaginaLida[]) => {
    for (const p of paginas) for (const i of p.itens.filter((it) => it.str.startsWith('palavra'))) expect(i.y).toBeGreaterThanOrEqual(rodapeY);
  };
  const contar = (paginas: PaginaLida[]) => paginas.flatMap((p) => p.itens).reduce((n, i) => n + (i.str.match(/palavra/g)?.length ?? 0), 0);
  const longo = 'palavra '.repeat(400).trim();

  it('tabela: célula que não cabe numa página é fatiada entre páginas, sem perder texto e com cabeçalho repetido', async () => {
    const colunas = [{ chave: 'a', titulo: 'ColA', peso: 0.2 }, { chave: 'b', titulo: 'ColB', peso: 1 }];
    const p = await lerPdf(gerar([tabela({ colunas, linhas: [{ a: longo, b: 'x' }] })], marcaTeste, 'relatorio'));
    todosAcimaDoRodape(p);
    expect(contar(p)).toBe(400);
    for (const pg of p) expect(pg.texto).toContain('ColA');
  });

  it('tabela: o cabeçalho nunca fica sozinho no pé da página quando a 1ª linha é alta', async () => {
    const colunas = [{ chave: 'a', titulo: 'ColA', peso: 0.2 }, { chave: 'b', titulo: 'ColB', peso: 1 }];
    const [p1] = await lerPdf(gerar([tabela({ colunas, linhas: [{ a: longo, b: 'x' }] })], marcaTeste, 'relatorio'));
    expect(p1.itens.some((i) => i.str.startsWith('palavra'))).toBe(true);
  });

  it('campo chave-valor com valor maior que a página continua nas páginas seguintes, acima do rodapé', async () => {
    const p = await lerPdf(gerar([camposChaveValor({ colunas: 1, campos: [{ rotulo: 'Obs', valor: 'palavra '.repeat(1200).trim() }] })]));
    todosAcimaDoRodape(p);
    expect(contar(p)).toBe(1200);
    expect(p[0].itens.some((i) => i.str.startsWith('palavra'))).toBe(true);
  });
});

describe('logo inválido não derruba o documento', () => {
  it('logo com largura e altura 0 sai sem logo, com o resto do cabeçalho', async () => {
    const marca: MarcaImpressao = { ...marcaTeste, logoOrgao: { dataUrl: 'data:,', largura: 0, altura: 0, formato: 'PNG' }, logoEntidadeSuperior: { dataUrl: PNG_1X1, largura: 4, altura: 1, formato: 'PNG' } };
    const [p1] = await lerPdf(gerar([paragrafo({ texto: 'corpo' })], marca));
    expect(p1.texto).toContain('INSTITUTO DE TESTE');
    expect(p1.texto).toContain('corpo');
  });
});
