import { amostraFicha, amostraRelatorio } from './modelos/amostras';
import { relatorioDinamico, relatorioDinamicoPaisagem } from './modelos/relatorios/colunasDinamicas';
import { estruturaOrganizacional } from './modelos/relatorios/estruturaOrganizacional';
import { folhaSimplificada } from './modelos/relatorios/folhaSimplificada';
import { pendenciasPreCadastros } from './modelos/rh/pendenciasPreCadastros';
import { pendenciasServidores } from './modelos/rh/pendenciasServidores';
import { fichaHistoricoFuncional } from './modelos/rh/historicoFuncional';
import { fichaCadastral } from './modelos/rh/fichaCadastral';
import { relatorioServidoresDiretoria } from './modelos/rh/servidoresDiretoria';
import { relatorioServidoresPortarias } from './modelos/rh/servidoresPortarias';
import { relatorioServidoresVinculo } from './modelos/rh/servidoresVinculo';
import { relatorioVagasCargo } from './modelos/rh/vagasCargo';
import { relatorioFerias } from './modelos/rh/ferias';
import { folhaPorRubrica, folhaPorUnidade, resumoFolhasAno } from './modelos/rh/folha';
import { frequenciaGeral, frequenciaIndividual } from './modelos/rh/frequencia';
import { folhaFrequencia } from './modelos/rh/folhaFrequencia';
import { relatorioLicencas } from './modelos/rh/licencas';
import { relatorioViagens } from './modelos/rh/viagens';
import { relatorioAgrupadoPortaria } from './modelos/rh/agrupadoPortaria';
import { relatorioContatosEstrategicos } from './modelos/rh/contatosEstrategicos';
import { relatorioSegundoVinculo } from './modelos/rh/segundoVinculo';
import { relatorioDiretoriaHierarquia } from './modelos/rh/diretoriaHierarquia';
import { relatorioSituacaoPortaria } from './modelos/rh/situacaoPortaria';
import { fichaUnidadeLocal } from './modelos/unidades/fichaUnidadeLocal';
import { fichaMiniCurriculo } from './modelos/curriculo/miniCurriculo';
import { listaConvocados, listaPresenca, relatorioReuniao } from './modelos/reunioes/reunioes';
import { contracheque } from './modelos/folha/contracheque';
import { relatorioCargosVagas } from './modelos/cargos/cargosVagas';
import { quadroCargos } from './modelos/cargos/quadroCargos';
import { relatorioGovernanca } from './modelos/governanca/relatorioAnual';
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
  // RH — folha individual de presença (avulsa e lote da unidade)
  'rh-folha-frequencia': folhaFrequencia,
  // RH — diretoria, segundo vínculo, portarias e contatos
  'rh-diretoria-hierarquia': relatorioDiretoriaHierarquia,
  'rh-segundo-vinculo': relatorioSegundoVinculo,
  'rh-situacao-portaria': relatorioSituacaoPortaria,
  'rh-agrupado-portaria': relatorioAgrupadoPortaria,
  'rh-contatos-estrategicos': relatorioContatosEstrategicos,
  // Unidades locais — RelatoriosCentralPage
  'unidades-ficha-unidade-local': fichaUnidadeLocal,
  // RH — ficha cadastral do servidor (preenchida e em branco)
  'rh-ficha-cadastral': fichaCadastral,
  // Currículo — pré-cadastro do candidato (também no site institucional, em /curriculo)
  'curriculo-mini-curriculo': fichaMiniCurriculo,
  // Reuniões — RelatoriosReuniaoDialog
  'reunioes-lista-convocados': listaConvocados,
  'reunioes-lista-presenca': listaPresenca,
  'reunioes-relatorio': relatorioReuniao,
  // Folha — contracheque do servidor (um ou lote, uma página por servidor)
  'folha-contracheque': contracheque,
  // Cargos — GestaoCargosPage (cargos e vagas) e OrganogramaPage (quadro de cargos com ocupantes)
  'cargos-relatorio-cargos-vagas': relatorioCargosVagas,
  'cargos-quadro-cargos': quadroCargos,
  // Governança — RelatorioGovernancaPage
  'governanca-relatorio-anual': relatorioGovernanca,
} as const satisfies Record<string, DocumentoModelo<never>>;

export type TipoDocumento = keyof typeof REGISTRO;
export type DadosDe<T extends TipoDocumento> = (typeof REGISTRO)[T] extends DocumentoModelo<infer D> ? D : never;
