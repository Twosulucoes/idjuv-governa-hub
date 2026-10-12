import type jsPDF from 'jspdf';
import { titulo } from '../blocos/titulo';
import type { DocumentoModelo, Emissao, MarcaImpressao } from '../tipos';
import { FAMILIAS } from './familias';
import { aplicarMoldura } from './moldura';
import { criarContexto } from './pagina';

/** Núcleo puro: modelo + dados + marca → PDF. Não toca em tenant, rede nem DOM. */
export function renderizarDocumento<D>(
  modelo: DocumentoModelo<D>,
  dados: D,
  marca: MarcaImpressao,
  emissao: Emissao,
): { doc: jsPDF; nomeArquivo: string } {
  const familia = FAMILIAS[modelo.familia];
  const ctx = criarContexto({ marca, orientacao: modelo.orientacao ?? familia.orientacaoPadrao, familia: modelo.familia });

  titulo({ texto: modelo.titulo(dados), subtitulo: modelo.subtitulo?.(dados) })(ctx);
  for (const bloco of modelo.blocos(dados)) bloco(ctx);

  aplicarMoldura(ctx, {
    protocolo: modelo.protocolo?.(dados),
    unidadeEmissora: modelo.unidadeEmissora?.(dados),
    linhaAutenticidade: familia.linhaAutenticidade,
    emissao,
  });
  return { doc: ctx.doc, nomeArquivo: modelo.nomeArquivo(dados) };
}
