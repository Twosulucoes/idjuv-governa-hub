import type { ContextoDocumento, Emissao, LogoImpressao } from '../tipos';
import { usarTexto, usarTraco } from './pintura';
import { FONTE, NEUTROS, PAGINA, corLegivel } from './tokens';
import { paraWinAnsi } from './texto';

export interface OpcoesMoldura {
  protocolo?: string;
  unidadeEmissora?: string[];
  linhaAutenticidade: boolean;
  emissao: Emissao;
}

const ALTURA_LOGO = 14;
const LARGURA_MAX_LOGO = 45;

const formatarData = (d: Date): string =>
  new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(d).replace(', ', ' às ');

function logo(ctx: ContextoDocumento, l: LogoImpressao | undefined, aDireita: boolean, y0: number): number {
  if (!l) return 0;
  const w = Math.min((ALTURA_LOGO * l.largura) / l.altura, LARGURA_MAX_LOGO);
  const x = aDireita ? ctx.esquerda + ctx.largura - w : ctx.esquerda;
  ctx.doc.addImage(l.dataUrl, l.formato, x, y0, w, ALTURA_LOGO);
  return w;
}

function protocoloNoCanto(ctx: ContextoDocumento, protocolo: string | undefined, y: number, tamanho: number): void {
  if (!protocolo) return;
  const { doc } = ctx;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(tamanho);
  usarTexto(doc, NEUTROS.texto);
  doc.text(paraWinAnsi(`Protocolo: ${protocolo}`), ctx.esquerda + ctx.largura, y, { align: 'right' });
}

function cabecalhoCompleto(ctx: ContextoDocumento, o: OpcoesMoldura): void {
  const { doc, marca, esquerda, largura } = ctx;
  const y0 = PAGINA.margemTopo;
  const reservado = Math.max(logo(ctx, marca.logoEntidadeSuperior, false, y0), logo(ctx, marca.logoOrgao, true, y0));
  const larguraTexto = largura - 2 * reservado - 6;
  const centro = esquerda + largura / 2;

  const linhas: { texto: string; negrito: boolean }[] = [
    ...(marca.entidadeSuperior ? [{ texto: marca.entidadeSuperior, negrito: true }] : []),
    { texto: marca.nomeOrgao, negrito: true },
    ...(o.unidadeEmissora ?? []).slice(0, 2).map((texto) => ({ texto, negrito: false })),
  ];
  usarTexto(doc, NEUTROS.texto);
  let y = y0 + 3.5;
  for (const { texto, negrito } of linhas) {
    doc.setFont('helvetica', negrito ? 'bold' : 'normal');
    doc.setFontSize(negrito ? 9 : 8);
    for (const parte of doc.splitTextToSize(paraWinAnsi(texto), larguraTexto) as string[]) {
      if (y > y0 + 19) break;
      doc.text(parte, centro, y, { align: 'center' });
      y += 3.8;
    }
  }
  usarTraco(doc, corLegivel(marca.corPrimaria));
  doc.setLineWidth(0.4);
  doc.line(esquerda, y0 + 22, esquerda + largura, y0 + 22);
  protocoloNoCanto(ctx, o.protocolo, y0 + 26.5, 8.5);
}

function cabecalhoCompacto(ctx: ContextoDocumento, o: OpcoesMoldura): void {
  const { doc, marca, esquerda, largura } = ctx;
  const y0 = PAGINA.margemTopo;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  usarTexto(doc, NEUTROS.textoSuave);
  doc.text(paraWinAnsi(marca.nomeOrgao), esquerda, y0 + 3);
  protocoloNoCanto(ctx, o.protocolo, y0 + 3, 8);
  usarTraco(doc, NEUTROS.linha);
  doc.setLineWidth(0.2);
  doc.line(esquerda, y0 + 5.5, esquerda + largura, y0 + 5.5);
}

function rodape(ctx: ContextoDocumento, o: OpcoesMoldura, pagina: number, total: number): void {
  const { doc, marca, esquerda, largura } = ctx;
  const yBase = ctx.alturaPagina - 16;
  usarTraco(doc, NEUTROS.linha);
  doc.setLineWidth(0.2);
  doc.line(esquerda, yBase, esquerda + largura, yBase);

  usarTexto(doc, NEUTROS.textoSuave);
  doc.setFontSize(FONTE.rodape);
  if (o.linhaAutenticidade) {
    doc.setFont('helvetica', 'italic');
    const prot = o.protocolo ? ` — protocolo ${o.protocolo}` : '';
    doc.text(paraWinAnsi(`Documento emitido eletronicamente${prot}.`), esquerda, yBase - 2);
  }
  doc.setFont('helvetica', 'normal');
  const quem = o.emissao.emitidoPor ? ` por ${o.emissao.emitidoPor}` : '';
  doc.text(paraWinAnsi(`Emitido${quem} em ${formatarData(o.emissao.emitidoEm)}`), esquerda, yBase + 4);
  doc.text(paraWinAnsi(marca.nomeSistema), esquerda, yBase + 8);
  doc.text(`Página ${pagina} de ${total}`, esquerda + largura, yBase + 4, { align: 'right' });
}

/** Desenha cabeçalho e rodapé em TODAS as páginas, ao final (só então se sabe o total). */
export function aplicarMoldura(ctx: ContextoDocumento, o: OpcoesMoldura): void {
  const total = ctx.doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    ctx.doc.setPage(i);
    if (i === 1) cabecalhoCompleto(ctx, o);
    else cabecalhoCompacto(ctx, o);
    rodape(ctx, o, i, total);
  }
}
