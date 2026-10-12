import { usarPreenchimento, usarTexto, usarTraco } from '../core/pintura';
import { ouTraco, paraWinAnsi, quebrarEmLinhas } from '../core/texto';
import { ALTURA_CABECALHO, ESPACO, FONTE, NEUTROS, PAGINA, alturaLinha, corLegivel, ptParaMm } from '../core/tokens';
import type { Bloco } from '../tipos';

export interface ColunaTabela {
  chave: string;
  titulo: string;
  /** Largura relativa (padrão 1). */
  peso?: number;
  alinhamento?: 'esquerda' | 'centro' | 'direita';
}
export type Celula = string | number | null | undefined;

const PAD = 1.5;

export const tabela =
  (p: {
    colunas: ColunaTabela[];
    linhas: Record<string, Celula>[];
    totais?: Record<string, Celula>;
    /** Altura (mm) que deve caber DEPOIS da última linha (ex.: assinatura): senão a última linha vai para a página seguinte, com o cabeçalho. */
    reservaNoFim?: number;
  }): Bloco =>
  (ctx) => {
    const { doc } = ctx;
    const lh = alturaLinha(FONTE.tabela);
    const pesos = p.colunas.map((c) => c.peso ?? 1);
    // Largura mínima: a maior palavra do título (em negrito) cabe inteira — título nunca é partido no meio.
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(FONTE.tabela);
    const minimos = p.colunas.map((c) =>
      Math.max(...ouTraco(c.titulo).split(/\s+/).map((w) => doc.getTextWidth(w))) + 2 * PAD + 0.5,
    );
    const proporcionais = pesos.map((w) => (ctx.largura * w) / pesos.reduce((a, b) => a + b, 0));
    const repartir = (): number[] => {
      const fixas = new Set<number>();
      for (;;) {
        const livre = ctx.largura - [...fixas].reduce((s, i) => s + minimos[i], 0);
        const somaLivres = pesos.reduce((s, w, i) => (fixas.has(i) ? s : s + w), 0);
        const ls = pesos.map((w, i) => (fixas.has(i) ? minimos[i] : (livre * w) / somaLivres));
        const abaixo = ls.findIndex((l, i) => !fixas.has(i) && l < minimos[i]);
        if (abaixo < 0) return ls;
        fixas.add(abaixo);
      }
    };
    const larguras = minimos.reduce((a, b) => a + b, 0) <= ctx.largura ? repartir() : proporcionais;

    const quebrar = (valor: Celula, i: number, negrito: boolean, vazioComoTraco: boolean): string[] => {
      doc.setFont('helvetica', negrito ? 'bold' : 'normal');
      doc.setFontSize(FONTE.tabela);
      const texto = vazioComoTraco ? ouTraco(valor) : paraWinAnsi(valor);
      return quebrarEmLinhas(doc, texto, larguras[i] - 2 * PAD);
    };
    const alturaDe = (celulas: string[][]): number => Math.max(...celulas.map((c) => c.length)) * lh + 2 * PAD;
    const xDe = (i: number): number => ctx.esquerda + larguras.slice(0, i).reduce((s, w) => s + w, 0);
    const escrever = (celulas: string[][], negrito: boolean): void => {
      doc.setFont('helvetica', negrito ? 'bold' : 'normal');
      doc.setFontSize(FONTE.tabela);
      usarTexto(doc, NEUTROS.texto);
      celulas.forEach((linhas, i) => {
        const a = p.colunas[i].alinhamento ?? 'esquerda';
        const x0 = xDe(i);
        const x = a === 'direita' ? x0 + larguras[i] - PAD : a === 'centro' ? x0 + larguras[i] / 2 : x0 + PAD;
        linhas.forEach((l, k) =>
          doc.text(l, x, ctx.y + PAD + ptParaMm(FONTE.tabela) + k * lh, { align: a === 'esquerda' ? 'left' : a === 'centro' ? 'center' : 'right' }),
        );
      });
    };
    const regua = (y: number, forte: boolean): void => {
      usarTraco(doc, forte ? corLegivel(ctx.marca.corPrimaria) : NEUTROS.linha);
      doc.setLineWidth(forte ? 0.4 : 0.15);
      doc.line(ctx.esquerda, y, ctx.esquerda + ctx.largura, y);
    };

    const topoDemais = PAGINA.margemTopo + ALTURA_CABECALHO.demais;
    const hCabecalho = alturaDe(p.colunas.map((c, i) => quebrar(c.titulo, i, true, true)));
    /** Linhas de texto que cabem numa página cheia, já descontado o cabeçalho da tabela. */
    const capacidade = Math.max(1, Math.floor((ctx.limiteInferior - topoDemais - hCabecalho - 2 * PAD) / lh));
    const celulasDe = (valores: Record<string, Celula>, negrito: boolean, vazioComoTraco: boolean): string[][] =>
      p.colunas.map((c, i) => quebrar(valores[c.chave], i, negrito, vazioComoTraco));
    const linhasDe = (celulas: string[][]): number => Math.max(...celulas.map((c) => c.length));
    /** Altura que o cabeçalho precisa deixar livre para a 1ª linha (uma linha alta demais é fatiada: bastam 3 linhas). */
    const reservaPara = (celulas: string[][]): number =>
      linhasDe(celulas) > capacidade ? 3 * lh + 2 * PAD : alturaDe(celulas);

    const cabecalho = (reserva: number = lh + 2 * PAD): void => {
      const celulas = p.colunas.map((c, i) => quebrar(c.titulo, i, true, true));
      const h = alturaDe(celulas);
      ctx.garantirEspaco(h + reserva); // o cabeçalho nunca fica sozinho no fim da página
      usarPreenchimento(doc, NEUTROS.fundoCabecalhoTabela);
      doc.rect(ctx.esquerda, ctx.y, ctx.largura, h, 'F');
      escrever(celulas, true);
      regua(ctx.y + h, true);
      ctx.y += h;
    };

    const desenhar = (celulas: string[][], indice: number, negrito: boolean): void => {
      const h = alturaDe(celulas);
      if (indice % 2 === 1 && !negrito) {
        usarPreenchimento(doc, NEUTROS.zebra);
        // começa 0,1 mm abaixo para não cobrir a régua da linha anterior
        doc.rect(ctx.esquerda, ctx.y + 0.1, ctx.largura, h - 0.1, 'F');
      }
      escrever(celulas, negrito);
      regua(ctx.y + h, false);
      ctx.y += h;
    };

    const linha = (valores: Record<string, Celula>, indice: number, negrito = false, vazioComoTraco = true, ultima = false): void => {
      let celulas = celulasDe(valores, negrito, vazioComoTraco);
      if (linhasDe(celulas) <= capacidade) {
        const reserva = ultima ? (p.reservaNoFim ?? 0) : 0;
        if (ctx.y + alturaDe(celulas) + reserva > ctx.limiteInferior) {
          ctx.novaPagina();
          cabecalho();
        }
        desenhar(celulas, indice, negrito);
        return;
      }
      // Célula maior que uma página: fatia as linhas de texto entre páginas, repetindo o cabeçalho.
      while (celulas.some((c) => c.length > 0)) {
        let disponiveis = Math.floor((ctx.limiteInferior - ctx.y - 2 * PAD) / lh);
        if (disponiveis < 2) {
          ctx.novaPagina();
          cabecalho();
          disponiveis = Math.floor((ctx.limiteInferior - ctx.y - 2 * PAD) / lh);
        }
        const n = Math.min(disponiveis, linhasDe(celulas));
        desenhar(celulas.map((c) => c.slice(0, n)), indice, negrito);
        celulas = celulas.map((c) => c.slice(n));
        if (celulas.some((c) => c.length > 0)) {
          ctx.novaPagina();
          cabecalho();
        }
      }
    };

    const primeira = p.linhas[0] ? celulasDe(p.linhas[0], false, true) : undefined;
    cabecalho(primeira ? reservaPara(primeira) : lh + 2 * PAD);
    if (p.linhas.length === 0) {
      ctx.garantirEspaco(lh + 2 * PAD);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(FONTE.tabela);
      usarTexto(doc, NEUTROS.textoSuave);
      doc.text('Nenhum registro encontrado.', ctx.esquerda + PAD, ctx.y + PAD + ptParaMm(FONTE.tabela));
      ctx.y += lh + 2 * PAD;
      regua(ctx.y, false);
    } else {
      p.linhas.forEach((v, i) => linha(v, i, false, true, i === p.linhas.length - 1 && !p.totais));
    }
    if (p.totais) linha(p.totais, 0, true, false, true);
    ctx.y += ESPACO.sm;
  };
