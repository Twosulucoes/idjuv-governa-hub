/**
 * Contracheque (holerite) em PDF, individual ou em lote (uma página por servidor). O desenho é do
 * motor único (`@/lib/documentos`, modelo em `documentos/modelos/folha/contracheque.ts`); aqui ficam
 * só as funções usadas pelas telas, com as mesmas assinaturas de antes.
 */
import { baixarDocumento, emitirDocumento } from '@/lib/documentos';
import type { FichaContracheque } from '@/lib/documentos/modelos/folha/contracheque';

interface DadosContracheque {
  ficha: FichaContracheque;
  competencia: string;
  competenciaAno: number;
  competenciaMes: number;
}

/** Gera o contracheque individual de um servidor. */
export const generateContracheque = async (dados: DadosContracheque): Promise<void> => {
  baixarDocumento(await emitirDocumento('folha-contracheque', { competencia: dados.competencia, fichas: [dados.ficha] }));
};

/**
 * Gera contracheques em lote (todos os servidores da folha), um por página.
 * O PIS/PASEP fica fora do lote, como no gerador antigo (o individual o imprime).
 */
export const generateContrachequeEmLote = async (
  fichas: FichaContracheque[],
  competencia: string,
  _competenciaAno: number,
  _competenciaMes: number,
): Promise<void> => {
  const semPis = fichas.map((f) => (f.servidor ? { ...f, servidor: { ...f.servidor, pis_pasep: null } } : f));
  baixarDocumento(await emitirDocumento('folha-contracheque', { competencia, fichas: semPis }));
};
