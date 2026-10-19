import { amostraFicha, amostraRelatorio } from './modelos/amostras';
import { relatorioAgrupadoPortaria } from './modelos/rh/agrupadoPortaria';
import { relatorioContatosEstrategicos } from './modelos/rh/contatosEstrategicos';
import { relatorioSegundoVinculo } from './modelos/rh/segundoVinculo';
import { relatorioServidoresDiretoria } from './modelos/rh/servidoresDiretoria';
import { relatorioSituacaoPortaria } from './modelos/rh/situacaoPortaria';
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
  // RH
  'rh-servidores-diretoria': relatorioServidoresDiretoria,
  'rh-segundo-vinculo': relatorioSegundoVinculo,
  'rh-situacao-portaria': relatorioSituacaoPortaria,
  'rh-agrupado-portaria': relatorioAgrupadoPortaria,
  'rh-contatos-estrategicos': relatorioContatosEstrategicos,
} as const satisfies Record<string, DocumentoModelo<never>>;

export type TipoDocumento = keyof typeof REGISTRO;
export type DadosDe<T extends TipoDocumento> = (typeof REGISTRO)[T] extends DocumentoModelo<infer D> ? D : never;
