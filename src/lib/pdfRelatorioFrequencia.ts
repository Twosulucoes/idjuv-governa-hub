/**
 * Relatórios de frequência em PDF: geral do mês (paisagem, opcionalmente por unidade com subtotal)
 * e individual do servidor. O desenho é do motor único (`@/lib/documentos`, modelos em
 * `documentos/modelos/rh/frequencia.ts`); aqui ficam só as funções usadas pelas telas.
 */
import { baixarDocumento, emitirDocumento } from '@/lib/documentos';
import type { DadosFrequenciaGeral, DadosFrequenciaIndividual } from '@/lib/documentos/modelos/rh/frequencia';

export type { FrequenciaServidor } from '@/lib/documentos/modelos/rh/frequencia';

/** Gera o relatório geral de frequência dos servidores na competência. */
export const generateRelatorioFrequenciaGeral = async (data: DadosFrequenciaGeral): Promise<void> => {
  baixarDocumento(await emitirDocumento('rh-frequencia-geral', data));
};

/** Gera a folha de frequência individual do servidor. */
export const generateRelatorioFrequenciaIndividual = async (data: DadosFrequenciaIndividual): Promise<void> => {
  baixarDocumento(await emitirDocumento('rh-frequencia-individual', data));
};
