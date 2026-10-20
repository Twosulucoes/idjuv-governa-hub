/**
 * Relatório de Estrutura Organizacional — pelo motor único (`relatorios-estrutura-organizacional`).
 * Colunas: Órgão (sigla), Nome da Unidade, Sigla da Unidade, Sigla da Unidade Vinculada, E-mail
 */
import { getTenantSnapshot } from '@/core/tenant';
import { baixarDocumento, emitirDocumento } from '@/lib/documentos';

export interface UnidadeEstruturaData {
  id: string;
  nome: string;
  sigla: string | null;
  email: string | null;
  superior_id: string | null;
  tipo: string;
  nivel: number;
  ativo: boolean;
  superior_sigla?: string | null;
  superior_nome?: string | null;
}

export interface ConfigRelatorioEstrutura {
  titulo?: string;
  subtitulo?: string;
  /** Sem ela, a sigla da instituição (perfil do tenant). */
  orgaoSigla?: string;
}

/** Gera e baixa o relatório de estrutura organizacional em PDF. */
export const generateRelatorioEstruturaPDF = async (
  unidades: UnidadeEstruturaData[],
  config: ConfigRelatorioEstrutura = {}
): Promise<void> => {
  const d = await emitirDocumento('relatorios-estrutura-organizacional', {
    titulo: config.titulo,
    subtitulo: config.subtitulo,
    orgaoSigla: config.orgaoSigla || getTenantSnapshot().identidade.sigla,
    unidades: unidades.map((u) => ({
      nome: u.nome,
      sigla: u.sigla,
      siglaSuperior: u.superior_sigla,
      email: u.email,
    })),
  });
  baixarDocumento(d);
};
