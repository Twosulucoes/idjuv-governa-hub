/**
 * Relatórios de RH (tela Relatórios do RH). Desenho e identidade ficam no motor único de documentos
 * (`@/lib/documentos`, modelos em `src/lib/documentos/modelos/rh/`); aqui só a entrada que as telas chamam.
 */
import { baixarDocumento, emitirDocumento } from '@/lib/documentos';
import type { DadosHistoricoFuncional } from '@/lib/documentos/modelos/rh/historicoFuncional';
import type { DadosServidoresDiretoria } from '@/lib/documentos/modelos/rh/servidoresDiretoria';
import type { DadosServidoresPortarias } from '@/lib/documentos/modelos/rh/servidoresPortarias';
import type { DadosServidoresVinculo } from '@/lib/documentos/modelos/rh/servidoresVinculo';
import type { DadosVagasCargo } from '@/lib/documentos/modelos/rh/vagasCargo';

export const generateRelatorioServidoresDiretoria = async (data: DadosServidoresDiretoria): Promise<void> => {
  baixarDocumento(await emitirDocumento('rh-servidores-diretoria', data));
};

export const generateRelatorioServidoresVinculo = async (data: DadosServidoresVinculo): Promise<void> => {
  baixarDocumento(await emitirDocumento('rh-servidores-vinculo', data));
};

export const generateRelatorioHistoricoFuncional = async (data: DadosHistoricoFuncional): Promise<void> => {
  baixarDocumento(await emitirDocumento('rh-historico-funcional', data));
};

export const generateRelatorioVagasCargo = async (data: DadosVagasCargo): Promise<void> => {
  baixarDocumento(await emitirDocumento('rh-vagas-cargo', data));
};

export const generateRelatorioServidoresPortarias = async (data: DadosServidoresPortarias): Promise<void> => {
  baixarDocumento(await emitirDocumento('rh-servidores-portarias', data));
};
