/**
 * Relatórios gerenciais de folha de pagamento em PDF: resumo do ano (paisagem), folha por unidade
 * e folha por rubrica. O desenho é do motor único (`@/lib/documentos`, modelos em
 * `documentos/modelos/rh/folha.ts`); aqui ficam só as funções usadas pelas telas.
 *
 * LGPD: só agregados — nenhum nome, CPF, matrícula ou dado bancário chega a estes relatórios.
 */
import { baixarDocumento, emitirDocumento } from '@/lib/documentos';
import type { AgregadoUnidade, BlocoRubricas, FolhaResumo } from './relatoriosFolhaRegras';

export const gerarResumoFolhasAno = async (folhas: FolhaResumo[], ano: number): Promise<void> => {
  baixarDocumento(await emitirDocumento('rh-folha-resumo-ano', { folhas, ano }));
};

export const gerarFolhaPorUnidade = async (agregados: AgregadoUnidade[], folha: FolhaResumo): Promise<void> => {
  baixarDocumento(await emitirDocumento('rh-folha-por-unidade', { agregados, folha }));
};

export const gerarFolhaPorRubrica = async (blocos: BlocoRubricas[], folha: FolhaResumo): Promise<void> => {
  baixarDocumento(await emitirDocumento('rh-folha-por-rubrica', { blocos, folha }));
};
