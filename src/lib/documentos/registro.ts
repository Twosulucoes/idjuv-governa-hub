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
import { relatorioFerias } from './modelos/rh/ferias';
import { folhaPorRubrica, folhaPorUnidade, resumoFolhasAno } from './modelos/rh/folha';
import { frequenciaGeral, frequenciaIndividual } from './modelos/rh/frequencia';
import { relatorioLicencas } from './modelos/rh/licencas';
import { relatorioViagens } from './modelos/rh/viagens';
import { relatorioAgrupadoPortaria } from './modelos/rh/agrupadoPortaria';
import { relatorioContatosEstrategicos } from './modelos/rh/contatosEstrategicos';
import { relatorioSegundoVinculo } from './modelos/rh/segundoVinculo';
import { relatorioDiretoriaHierarquia } from './modelos/rh/diretoriaHierarquia';
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
  // RH — relatórios gerenciais (afastamentos, folha, frequência)
  'rh-ferias': relatorioFerias,
  'rh-licencas': relatorioLicencas,
  'rh-viagens': relatorioViagens,
  'rh-folha-resumo-ano': resumoFolhasAno,
  'rh-folha-por-unidade': folhaPorUnidade,
  'rh-folha-por-rubrica': folhaPorRubrica,
  'rh-frequencia-geral': frequenciaGeral,
  'rh-frequencia-individual': frequenciaIndividual,
  // RH — diretoria, segundo vínculo, portarias e contatos
  'rh-diretoria-hierarquia': relatorioDiretoriaHierarquia,
  'rh-segundo-vinculo': relatorioSegundoVinculo,
  'rh-situacao-portaria': relatorioSituacaoPortaria,
  'rh-agrupado-portaria': relatorioAgrupadoPortaria,
  'rh-contatos-estrategicos': relatorioContatosEstrategicos,
} as const satisfies Record<string, DocumentoModelo<never>>;

export type TipoDocumento = keyof typeof REGISTRO;
export type DadosDe<T extends TipoDocumento> = (typeof REGISTRO)[T] extends DocumentoModelo<infer D> ? D : never;
