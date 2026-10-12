import { requerimentoModelo } from './modelos/requerimento';
import type { DocumentoModelo } from './tipos';

/** ÚNICA lista de documentos do sistema. Documento novo = modelo novo + uma linha aqui. */
export const REGISTRO = {
  requerimento: requerimentoModelo,
} as const;

export type TipoDocumento = keyof typeof REGISTRO;
export type DadosDe<T extends TipoDocumento> = (typeof REGISTRO)[T] extends DocumentoModelo<infer D> ? D : never;
