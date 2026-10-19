import { amostraFicha, amostraRelatorio } from './modelos/amostras';
import type { DocumentoModelo } from './tipos';

/**
 * ÚNICA lista de documentos do sistema. Documento novo = modelo novo + uma linha aqui.
 * Só relatório, ficha e comprovante: ato formal do órgão (portaria, memorando, termo,
 * requerimento, DFD/ETP/TR) é feito no SEI — o sistema só registra processo, número e DOE.
 */
export const REGISTRO = {
  /** Pré-visualização da tela de configuração de impressão. */
  'amostra-relatorio': amostraRelatorio,
  'amostra-ficha': amostraFicha,
} as const satisfies Record<string, DocumentoModelo<never>>;

export type TipoDocumento = keyof typeof REGISTRO;
export type DadosDe<T extends TipoDocumento> = (typeof REGISTRO)[T] extends DocumentoModelo<infer D> ? D : never;
