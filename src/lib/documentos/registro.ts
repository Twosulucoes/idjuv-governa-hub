import { amostraFicha, amostraRelatorio } from './modelos/amostras';
import { relatorioDinamico, relatorioDinamicoPaisagem } from './modelos/relatorios/colunasDinamicas';
import { estruturaOrganizacional } from './modelos/relatorios/estruturaOrganizacional';
import { folhaSimplificada } from './modelos/relatorios/folhaSimplificada';
import { pendenciasPreCadastros } from './modelos/rh/pendenciasPreCadastros';
import { pendenciasServidores } from './modelos/rh/pendenciasServidores';
import { fichaHistoricoFuncional } from './modelos/rh/historicoFuncional';
import { relatorioServidoresDiretoria } from './modelos/rh/servidoresDiretoria';
import { relatorioServidoresPortarias } from './modelos/rh/servidoresPortarias';
import { relatorioServidoresVinculo } from './modelos/rh/servidoresVinculo';
import { relatorioVagasCargo } from './modelos/rh/vagasCargo';
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
  'rh-pendencias-pre-cadastros': pendenciasPreCadastros,
  'rh-pendencias-servidores': pendenciasServidores,
  'relatorios-folha-simplificada': folhaSimplificada,
  'relatorios-colunas-dinamicas': relatorioDinamico,
  'relatorios-colunas-dinamicas-paisagem': relatorioDinamicoPaisagem,
  'relatorios-estrutura-organizacional': estruturaOrganizacional,
  // RH — RelatoriosRHPage
  'rh-servidores-diretoria': relatorioServidoresDiretoria,
  'rh-servidores-vinculo': relatorioServidoresVinculo,
  'rh-historico-funcional': fichaHistoricoFuncional,
  'rh-vagas-cargo': relatorioVagasCargo,
  'rh-servidores-portarias': relatorioServidoresPortarias,
} as const satisfies Record<string, DocumentoModelo<never>>;

export type TipoDocumento = keyof typeof REGISTRO;
export type DadosDe<T extends TipoDocumento> = (typeof REGISTRO)[T] extends DocumentoModelo<infer D> ? D : never;
