import type jsPDF from 'jspdf';

// O que as fontes nativas do PDF (WinAnsi) desenham: ASCII, Latin-1 e os símbolos do cp1252.
const PERMITIDO =
  /[ -~ -ÿ€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ\n]/;

/** Texto seguro para as fontes nativas: o que elas não têm vira "?" (nunca some calado nem quebra o PDF). */
export function paraWinAnsi(entrada: unknown): string {
  if (entrada === null || entrada === undefined) return '';
  const s = String(entrada).normalize('NFC').replace(/\r\n?/g, '\n').replace(/\t/g, ' ');
  let saida = '';
  for (const ch of s) saida += PERMITIDO.test(ch) ? ch : '?';
  return saida;
}

/** Valor para exibir em campo/célula: vazio vira "—" (documento impresso nunca mostra "null"). */
export function ouTraco(valor: unknown): string {
  const s = paraWinAnsi(valor).trim();
  return s === '' ? '—' : s;
}

export function paraNomeArquivo(texto: string): string {
  const s = texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return s || 'documento';
}

/**
 * Uma linha só que cabe em `largura` (mm), com a fonte e o corpo JÁ definidos no `doc`:
 * o que passar é cortado e termina em "…" (formulário de linha fixa, onde quebrar empurraria a página).
 */
export function cortarEmUmaLinha(doc: jsPDF, texto: string, largura: number): string {
  const s = paraWinAnsi(texto).replace(/\n/g, ' ');
  if (doc.getTextWidth(s) <= largura) return s;
  let atual = s;
  while (atual.length > 0 && doc.getTextWidth(`${atual}…`) > largura) atual = atual.slice(0, -1);
  return `${atual.trimEnd()}…`;
}

/**
 * Quebra em linhas que cabem em `largura` (mm), com a fonte e o corpo JÁ definidos no `doc`.
 * Palavra maior que a largura é cortada por caractere em vez de estourar a margem.
 */
export function quebrarEmLinhas(doc: jsPDF, texto: string, largura: number): string[] {
  const saida: string[] = [];
  for (const linha of doc.splitTextToSize(paraWinAnsi(texto), largura) as string[]) {
    if (doc.getTextWidth(linha) <= largura) {
      saida.push(linha);
      continue;
    }
    let atual = '';
    for (const ch of linha) {
      if (atual && doc.getTextWidth(atual + ch) > largura) {
        saida.push(atual);
        atual = ch;
      } else {
        atual += ch;
      }
    }
    saida.push(atual);
  }
  return saida.length ? saida : [''];
}
