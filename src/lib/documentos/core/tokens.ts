import type { RGB } from '../tipos';

export const A4 = { largura: 210, altura: 297 } as const;
/** `margemRodape` inclui a faixa do rodapé (régua + 2 linhas). */
export const PAGINA = { margemLateral: 20, margemTopo: 18, margemRodape: 22 } as const;
export const ESPACO = { sm: 4, md: 8, lg: 12, xl: 16 } as const;
export const FONTE = { titulo: 14, secao: 11, corpo: 10.5, tabela: 9, rotulo: 8, rodape: 7.5 } as const;
export const ALTURA_CABECALHO = { primeira: 28, demais: 10 } as const;

export const NEUTROS = {
  texto: { r: 15, g: 23, b: 42 },
  textoSuave: { r: 71, g: 85, b: 105 },
  /** Traço fino: visível também em preto e branco. */
  linha: { r: 100, g: 116, b: 139 },
  fundoCabecalhoTabela: { r: 226, g: 232, b: 240 },
  zebra: { r: 241, g: 245, b: 249 },
  branco: { r: 255, g: 255, b: 255 },
} as const satisfies Record<string, RGB>;

const MM_POR_PT = 25.4 / 72;
export const ptParaMm = (pt: number): number => pt * MM_POR_PT;
/** Altura de uma linha de texto (mm) com entrelinha 1,35. */
export const alturaLinha = (pt: number): number => ptParaMm(pt) * 1.35;

const canal = (v: number): number => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminancia = ({ r, g, b }: RGB): number => 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);

/** Razão de contraste WCAG 2.x entre duas cores. */
export function contraste(a: RGB, b: RGB): number {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}

/** A própria cor se der >= 4,5:1 sobre o fundo; senão o texto neutro. */
export function corLegivel(cor: RGB, fundo: RGB = NEUTROS.branco): RGB {
  return contraste(cor, fundo) >= 4.5 ? cor : NEUTROS.texto;
}

export function hexParaRGB(hex: string): RGB {
  const limpo = hex.replace('#', '');
  const cheio = limpo.length === 3 ? limpo.split('').map((c) => c + c).join('') : limpo;
  return { r: parseInt(cheio.slice(0, 2), 16), g: parseInt(cheio.slice(2, 4), 16), b: parseInt(cheio.slice(4, 6), 16) };
}
