/**
 * Organograma em PDF — pelo motor único: desenho (`organograma-desenho`) e lista hierárquica (`organograma-lista`).
 */
import { UnidadeOrganizacional, LABELS_UNIDADE } from '@/types/organograma';
import { baixarDocumento, emitirDocumento } from '@/lib/documentos';
import type { UnidadeOrganograma } from '@/lib/documentos/modelos/organograma/comum';
import type { ServidorOrganograma } from '@/lib/documentos/modelos/organograma/lista';

export interface OrganogramaConfig {
  exibirNomesServidores?: boolean;
  exibirQuantidadeServidores?: boolean;
  exibirLegenda?: boolean;
  exibirTodosServidores?: boolean; // Exibir todos os lotados, não apenas o primeiro
}

interface LotacaoSimples {
  servidor?: {
    id: string;
    full_name: string;
  };
  cargo?: {
    nome: string;
    sigla?: string;
  };
}

interface OrganogramaData {
  unidades: UnidadeOrganizacional[];
  contarServidores: (unidadeId: string, incluirSub?: boolean) => number;
  getLotacoesByUnidade?: (unidadeId: string) => LotacaoSimples[];
  getServidoresByUnidadeCargo?: (unidadeId: string) => { nome: string; cargo: string }[];
  titulo?: string;
  subtitulo?: string;
  /** Ignorado: os logos seguem a configuração de impressão. */
  incluirLogos?: boolean;
  config?: OrganogramaConfig;
}

const unidadeBase = (u: UnidadeOrganizacional, data: OrganogramaData): UnidadeOrganograma => ({
  id: u.id,
  superiorId: u.superior_id ?? null,
  nivel: u.nivel,
  nome: u.nome,
  sigla: u.sigla,
  tipo: LABELS_UNIDADE[u.tipo] ?? u.tipo,
  quantidadeServidores: data.contarServidores(u.id, false),
});

/** Responsável oficial, depois os lotados por cargo vinculado à unidade (ou, sem eles, pela lotação), sem repetir nome. */
function servidoresLotados(u: UnidadeOrganizacional, data: OrganogramaData): ServidorOrganograma[] {
  const servidores: ServidorOrganograma[] = [];
  const incluir = (nome: string, cargo: string) => {
    if (!servidores.some((s) => s.nome.toUpperCase() === nome.toUpperCase())) servidores.push({ nome, cargo });
  };
  if (u.servidor_responsavel?.full_name) incluir(u.servidor_responsavel.full_name, 'Responsável');
  if (data.getServidoresByUnidadeCargo) {
    for (const s of data.getServidoresByUnidadeCargo(u.id)) incluir(s.nome, s.cargo);
  } else if (data.getLotacoesByUnidade) {
    for (const l of data.getLotacoesByUnidade(u.id)) {
      if (l.servidor?.full_name) incluir(l.servidor.full_name, l.cargo?.nome || l.cargo?.sigla || '-');
    }
  }
  return servidores;
}

/** Nome da caixa do desenho: o responsável; sem ele, o primeiro lotado com "+N". */
function responsavelDoDesenho(u: UnidadeOrganizacional, data: OrganogramaData): string | undefined {
  if (u.servidor_responsavel?.full_name) return u.servidor_responsavel.full_name;
  const nomes = data.getServidoresByUnidadeCargo
    ? data.getServidoresByUnidadeCargo(u.id).map((s) => s.nome)
    : (data.getLotacoesByUnidade?.(u.id) ?? []).map((l) => l.servidor?.full_name ?? '');
  if (!nomes[0]) return undefined;
  return nomes.length > 1 ? `${nomes[0]} +${nomes.length - 1}` : nomes[0];
}

/** Organograma desenhado (caixas e ligações), A4 paisagem. */
export async function gerarOrganogramaPDF(data: OrganogramaData): Promise<void> {
  const { exibirNomesServidores = true, exibirQuantidadeServidores = true, exibirLegenda = true } = data.config ?? {};
  const d = await emitirDocumento('organograma-desenho', {
    titulo: data.titulo,
    subtitulo: data.subtitulo,
    exibirNomesServidores,
    exibirQuantidadeServidores,
    exibirLegenda,
    unidades: data.unidades.map((u) => ({
      ...unidadeBase(u, data),
      responsavel: exibirNomesServidores ? responsavelDoDesenho(u, data) : undefined,
    })),
  });
  baixarDocumento(d);
}

/** Estrutura organizacional em lista hierárquica, A4 retrato. */
export async function gerarOrganogramaListaPDF(data: OrganogramaData): Promise<void> {
  const { exibirNomesServidores = true, exibirQuantidadeServidores = true, exibirTodosServidores = false } = data.config ?? {};
  const d = await emitirDocumento('organograma-lista', {
    titulo: data.titulo,
    subtitulo: data.subtitulo,
    exibirNomesServidores,
    exibirQuantidadeServidores,
    exibirTodosServidores,
    unidades: data.unidades.map((u) => ({
      ...unidadeBase(u, data),
      servidores: exibirNomesServidores ? servidoresLotados(u, data) : [],
    })),
  });
  baixarDocumento(d);
}
