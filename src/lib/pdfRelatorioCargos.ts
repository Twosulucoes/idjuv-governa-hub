/**
 * Quadro de cargos com ocupantes (OrganogramaPage) — pelo motor único (`cargos-quadro-cargos`).
 */
import { baixarDocumento, emitirDocumento } from '@/lib/documentos';
import type { VagaQuadroCargos } from '@/lib/documentos/modelos/cargos/quadroCargos';

interface RelatorioConfig {
  titulo?: string;
  subtitulo?: string;
  agruparPorUnidade?: boolean;
}

export async function gerarRelatorioCargos98PDF(
  dados: VagaQuadroCargos[],
  config: RelatorioConfig = {}
): Promise<void> {
  const {
    titulo = 'QUADRO DE CARGOS COMISSIONADOS',
    subtitulo = 'Lei nº 2.301/2025 - 98 Cargos',
    agruparPorUnidade = true
  } = config;

  const d = await emitirDocumento('cargos-quadro-cargos', {
    titulo,
    subtitulo,
    agruparPorUnidade,
    vagas: dados,
    dataGeracao: new Date().toISOString().split('T')[0],
  });
  baixarDocumento(d);
}
