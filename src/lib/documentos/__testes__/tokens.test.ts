import { describe, expect, it } from 'vitest';
import { contraste, corLegivel, hexParaRGB, NEUTROS, alturaLinha, ptParaMm } from '../core/tokens';

describe('tokens', () => {
  it('textos neutros têm contraste >= 4,5:1 sobre o branco e traços >= 3:1', () => {
    expect(contraste(NEUTROS.texto, NEUTROS.branco)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(NEUTROS.textoSuave, NEUTROS.branco)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(NEUTROS.linha, NEUTROS.branco)).toBeGreaterThanOrEqual(3);
  });

  it('texto escuro também é legível sobre o fundo de cabeçalho de tabela e a zebra', () => {
    expect(contraste(NEUTROS.texto, NEUTROS.fundoCabecalhoTabela)).toBeGreaterThanOrEqual(4.5);
    expect(contraste(NEUTROS.textoSuave, NEUTROS.zebra)).toBeGreaterThanOrEqual(4.5);
  });

  it('corLegivel mantém cor escura e troca cor clara demais por texto neutro', () => {
    const escura = hexParaRGB('#164069');
    expect(corLegivel(escura)).toEqual(escura);
    expect(corLegivel(hexParaRGB('#ffee00'))).toEqual(NEUTROS.texto);
  });

  it('hexParaRGB aceita 3 e 6 dígitos, com ou sem #', () => {
    expect(hexParaRGB('#164069')).toEqual({ r: 22, g: 64, b: 105 });
    expect(hexParaRGB('fff')).toEqual({ r: 255, g: 255, b: 255 });
  });

  it('converte pontos em milímetros', () => {
    expect(ptParaMm(72)).toBeCloseTo(25.4, 5);
    expect(alturaLinha(10)).toBeGreaterThan(ptParaMm(10));
  });
});
