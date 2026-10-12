import { describe, expect, it } from 'vitest';
import { camposChaveValor } from '../blocos/camposChaveValor';
import { renderizarDocumento } from '../core/renderizar';
import type { Bloco, DocumentoModelo } from '../tipos';
import { emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf, mmParaPt } from './lerPdf';

const gerar = (blocos: Bloco[]) => {
  const modelo: DocumentoModelo<null> = { tipo: 't', familia: 'ficha', titulo: () => 'T', nomeArquivo: () => 't.pdf', blocos: () => blocos };
  return renderizarDocumento(modelo, null, marcaTeste, emissaoTeste).doc;
};

describe('camposChaveValor', () => {
  it('valor null, undefined e vazio imprime "—", nunca "null"/"undefined"', async () => {
    const [p1] = await lerPdf(gerar([camposChaveValor({ campos: [
      { rotulo: 'A', valor: null }, { rotulo: 'B', valor: undefined }, { rotulo: 'C', valor: '' }, { rotulo: 'D', valor: 0 },
    ] })]));
    expect(p1.texto).not.toMatch(/null|undefined/);
    expect(p1.itens.filter((i) => i.str === '—')).toHaveLength(3);
    expect(p1.itens.some((i) => i.str === '0')).toBe(true);
  });

  it('duas colunas põem campos vizinhos lado a lado (mesmo y, x diferente)', async () => {
    const [p1] = await lerPdf(gerar([camposChaveValor({ colunas: 2, campos: [
      { rotulo: 'Nome', valor: 'Ana' }, { rotulo: 'Cargo', valor: 'Analista' },
    ] })]));
    const nome = p1.itens.find((i) => i.str === 'Ana')!;
    const cargo = p1.itens.find((i) => i.str === 'Analista')!;
    expect(Math.abs(nome.y - cargo.y)).toBeLessThan(1);
    expect(cargo.x).toBeGreaterThan(nome.x + mmParaPt(40));
  });

  it('valor longo quebra dentro da coluna e não invade a vizinha', async () => {
    const longo = 'palavra '.repeat(40).trim();
    const [p1] = await lerPdf(gerar([camposChaveValor({ colunas: 2, campos: [
      { rotulo: 'Descrição', valor: longo }, { rotulo: 'Outro', valor: 'x' },
    ] })]));
    const limiteColuna1 = mmParaPt(20) + mmParaPt((170 - 6) / 2) + 1;
    for (const i of p1.itens.filter((it) => it.str.startsWith('palavra'))) expect(i.x + i.largura).toBeLessThanOrEqual(limiteColuna1);
  });

  it('muitos campos atravessam a página sem cortar um campo ao meio', async () => {
    const campos = Array.from({ length: 80 }, (_, i) => ({ rotulo: `Rótulo ${i}`, valor: `Valor ${i}` }));
    const p = await lerPdf(gerar([camposChaveValor({ campos, colunas: 1 })]));
    expect(p.length).toBeGreaterThanOrEqual(2);
    for (const pg of p) {
      for (let i = 0; i < 80; i++) {
        expect(pg.texto.includes(`Rótulo ${i}`)).toBe(pg.texto.includes(`Valor ${i}`));
      }
    }
  });
});
