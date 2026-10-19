import { amostraFicha, amostraRelatorio } from './modelos/amostras';
import { relatorioFerias } from './modelos/rh/ferias';
import { folhaPorRubrica, folhaPorUnidade, resumoFolhasAno } from './modelos/rh/folha';
import { frequenciaGeral, frequenciaIndividual } from './modelos/rh/frequencia';
import { relatorioLicencas } from './modelos/rh/licencas';
import { relatorioViagens } from './modelos/rh/viagens';
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
  // RH — relatórios gerenciais (afastamentos, folha, frequência)
  'rh-ferias': relatorioFerias,
  'rh-licencas': relatorioLicencas,
  'rh-viagens': relatorioViagens,
  'rh-folha-resumo-ano': resumoFolhasAno,
  'rh-folha-por-unidade': folhaPorUnidade,
  'rh-folha-por-rubrica': folhaPorRubrica,
  'rh-frequencia-geral': frequenciaGeral,
  'rh-frequencia-individual': frequenciaIndividual,
} as const satisfies Record<string, DocumentoModelo<never>>;

export type TipoDocumento = keyof typeof REGISTRO;
export type DadosDe<T extends TipoDocumento> = (typeof REGISTRO)[T] extends DocumentoModelo<infer D> ? D : never;
