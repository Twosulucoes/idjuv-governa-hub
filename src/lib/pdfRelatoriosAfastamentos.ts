/**
 * Relatórios gerenciais de RH em PDF: férias (por unidade), licenças/afastamentos (por tipo)
 * e viagens/diárias (por unidade, paisagem). O desenho é do motor único (`@/lib/documentos`,
 * modelos em `documentos/modelos/rh/`); aqui ficam só as funções usadas pelas telas.
 *
 * LGPD: imprime nome e matrícula; nenhum CPF ou dado de saúde chega a estes relatórios.
 */
import { baixarDocumento, emitirDocumento } from '@/lib/documentos';
import type { FiltrosImpressao, LinhaFeriasRelatorio, LinhaLicencaRelatorio, LinhaViagemRelatorio } from './relatoriosRHRegras';

export const gerarRelatorioFerias = async (linhas: LinhaFeriasRelatorio[], filtros: FiltrosImpressao): Promise<void> => {
  baixarDocumento(await emitirDocumento('rh-ferias', { linhas, filtros }));
};

export const gerarRelatorioLicencas = async (linhas: LinhaLicencaRelatorio[], filtros: FiltrosImpressao): Promise<void> => {
  baixarDocumento(await emitirDocumento('rh-licencas', { linhas, filtros }));
};

export const gerarRelatorioViagens = async (linhas: LinhaViagemRelatorio[], filtros: FiltrosImpressao): Promise<void> => {
  baixarDocumento(await emitirDocumento('rh-viagens', { linhas, filtros }));
};
