import jsPDF from 'jspdf';
import type { ContextoDocumento, Familia, MarcaImpressao, Orientacao } from '../tipos';
import { FAMILIAS } from './familias';
import { A4, ALTURA_CABECALHO, PAGINA } from './tokens';

export function criarContexto(o: { marca: MarcaImpressao; orientacao: Orientacao; familia: Familia }): ContextoDocumento {
  const paisagem = o.orientacao === 'paisagem';
  const larguraPagina = paisagem ? A4.altura : A4.largura;
  const alturaPagina = paisagem ? A4.largura : A4.altura;
  const doc = new jsPDF({ orientation: paisagem ? 'landscape' : 'portrait', unit: 'mm', format: 'a4', compress: true });

  const ctx: ContextoDocumento = {
    doc,
    marca: o.marca,
    orientacao: o.orientacao,
    familia: o.familia,
    fonteCorpo: FAMILIAS[o.familia].fonteCorpo,
    esquerda: PAGINA.margemLateral,
    largura: larguraPagina - 2 * PAGINA.margemLateral,
    larguraPagina,
    alturaPagina,
    limiteInferior: alturaPagina - PAGINA.margemRodape,
    y: PAGINA.margemTopo + ALTURA_CABECALHO.primeira,
    novaPagina() {
      doc.addPage();
      ctx.y = PAGINA.margemTopo + ALTURA_CABECALHO.demais;
    },
    garantirEspaco(altura) {
      if (ctx.y + altura > ctx.limiteInferior) ctx.novaPagina();
    },
  };
  doc.setFont(ctx.fonteCorpo, 'normal');
  return ctx;
}
