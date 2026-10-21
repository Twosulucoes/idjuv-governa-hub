/**
 * Quadro de cargos com ocupantes (OrganogramaPage) — pelo motor único (`cargos-quadro-cargos`).
 */
import { baixarDocumento, emitirDocumento } from '@/lib/documentos';
import { getTenantSnapshot } from '@/core/tenant';
import type { VagaQuadroCargos } from '@/lib/documentos/modelos/cargos/quadroCargos';

interface RelatorioConfig {
  titulo?: string;
  subtitulo?: string;
  agruparPorUnidade?: boolean;
}

/**
 * Sem `subtitulo`, monta "<lei de criação> - <N> cargos" com a lei do cadastro da
 * instituição (omitida se não houver) e o total de vagas recebido.
 */
export async function gerarRelatorioCargosPDF(
  dados: VagaQuadroCargos[],
  config: RelatorioConfig = {}
): Promise<void> {
  const {
    titulo = 'QUADRO DE CARGOS COMISSIONADOS',
    subtitulo = subtituloQuadroCargos(dados.length),
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

/** "<lei de criação> - <N> cargos"; sem lei cadastrada, só o total. */
function subtituloQuadroCargos(totalCargos: number): string {
  const lei = getTenantSnapshot().legal?.leiCriacao?.trim();
  const total = `${totalCargos} ${totalCargos === 1 ? 'cargo' : 'cargos'}`;
  return lei ? `${lei} - ${total}` : total;
}
