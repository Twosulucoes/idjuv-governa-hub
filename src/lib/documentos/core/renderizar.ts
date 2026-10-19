import type jsPDF from 'jspdf';
import { titulo } from '../blocos/titulo';
import type { DocumentoModelo, Emissao, EstiloImpressao, MarcaImpressao } from '../tipos';
import { FAMILIAS } from './familias';
import { aplicarMoldura } from './moldura';
import { criarContexto } from './pagina';
import { ESTILO_PADRAO } from './tokens';

/** Núcleo puro: modelo + dados + marca + estilo → PDF. Não toca em tenant, rede nem DOM. */
export function renderizarDocumento<D>(
  modelo: DocumentoModelo<D>,
  dados: D,
  marca: MarcaImpressao,
  emissao: Emissao,
  estilo: EstiloImpressao = ESTILO_PADRAO,
): { doc: jsPDF; nomeArquivo: string } {
  const familia = FAMILIAS[modelo.familia];
  const orientacao = estilo.orientacao === 'automatica' ? (modelo.orientacao ?? familia.orientacaoPadrao) : estilo.orientacao;
  const ctx = criarContexto({ marca, orientacao, familia: modelo.familia, estilo });

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
