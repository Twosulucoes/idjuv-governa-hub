import { format, isValid, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { baixarDocumento, emitirDocumento, type Celula } from '@/lib/documentos';
import type { DadosRelatorioPortarias } from '@/lib/documentos/modelos/portarias/relatorioPortarias';
import { CATEGORIAS_PORTARIA } from '@/lib/importacao/importadores/portariasPlanilhaParser';
import { STATUS_PORTARIA_LABELS, type CategoriaPortaria, type Portaria, type StatusPortaria } from '@/types/portaria';

/**
 * Relatório de portarias da Central de Portarias: a tela escolhe as opções; aqui elas viram os dados do
 * modelo `portarias-relatorio` (motor único, `src/lib/documentos/`).
 */
export type AgrupamentoPortarias = 'nenhum' | 'status' | 'categoria' | 'unidade' | 'mes' | 'servidor';
export type OrdenacaoPortarias = 'numero' | 'data' | 'status' | 'categoria';

export const AGRUPAMENTO_ROTULOS: Record<AgrupamentoPortarias, string> = {
  nenhum: 'Sem Agrupamento',
  status: 'Por Status',
  categoria: 'Por Categoria',
  unidade: 'Por Unidade',
  mes: 'Por Mês',
  servidor: 'Por Servidor',
};

const ORDENACAO_ROTULOS: Record<OrdenacaoPortarias, string> = {
  data: 'Data',
  numero: 'Número',
  status: 'Status',
  categoria: 'Categoria',
};

export const COLUNAS_RELATORIO_PORTARIAS = [
  { id: 'numero', label: 'Número', obrigatoria: true },
  { id: 'titulo', label: 'Título', obrigatoria: false },
  { id: 'categoria', label: 'Categoria', obrigatoria: false },
  { id: 'status', label: 'Status', obrigatoria: false },
  { id: 'data_documento', label: 'Data', obrigatoria: false },
  { id: 'ementa', label: 'Ementa', obrigatoria: false },
  { id: 'servidores', label: 'Servidores', obrigatoria: false },
  { id: 'unidade', label: 'Unidade', obrigatoria: false },
  { id: 'cargo', label: 'Cargo', obrigatoria: false },
  { id: 'doe_numero', label: 'DOE', obrigatoria: false },
  { id: 'doe_data', label: 'Data DOE', obrigatoria: false },
];

export interface ConfiguracaoRelatorioPortarias {
  titulo: string;
  subtitulo: string;
  agrupamento: AgrupamentoPortarias;
  colunasSelecionadas: string[];
  mostrarTotais: boolean;
  mostrarResumo: boolean;
  ordenacao: OrdenacaoPortarias;
  ordenacaoDir: 'asc' | 'desc';
  filtroStatus?: StatusPortaria;
  filtroCategoria?: CategoriaPortaria;
  periodoInicio?: string;
  periodoFim?: string;
}

/** "2026-10-20" é data local (não meia-noite UTC, que no fuso do Brasil vira o dia anterior). */
const data = (v?: string | null): Date | null => {
  if (!v) return null;
  const d = parseISO(v);
  return isValid(d) ? d : null;
};
const dataBr = (v?: string | null): string => {
  const d = data(v);
  return d ? format(d, 'dd/MM/yyyy') : '-';
};

const rotuloCategoria = (c?: string | null): string =>
  CATEGORIAS_PORTARIA.find((x) => x.value === c)?.label ?? (c ? c.charAt(0).toUpperCase() + c.slice(1).replace(/_/g, ' ') : '-');
const rotuloStatus = (s: string): string => STATUS_PORTARIA_LABELS[s as StatusPortaria] || s;
const maiuscula = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

export function filtrarPortarias(portarias: Portaria[], c: ConfiguracaoRelatorioPortarias): Portaria[] {
  return portarias.filter((p) => {
    if (c.filtroStatus && p.status !== c.filtroStatus) return false;
    if (c.filtroCategoria && p.categoria !== c.filtroCategoria) return false;
    if (c.periodoInicio && new Date(p.data_documento) < new Date(c.periodoInicio)) return false;
    if (c.periodoFim && new Date(p.data_documento) > new Date(c.periodoFim)) return false;
    return true;
  });
}

function ordenar(portarias: Portaria[], c: ConfiguracaoRelatorioPortarias): Portaria[] {
  const chave = (p: Portaria): string | number => {
    switch (c.ordenacao) {
      case 'numero':
        return p.numero;
      case 'status':
        return p.status;
      case 'categoria':
        return p.categoria || '';
      default:
        return data(p.data_documento)?.getTime() ?? 0;
    }
  };
  return [...portarias].sort((a, b) => {
    const va = chave(a);
    const vb = chave(b);
    const comp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'pt-BR', { numeric: true });
    return c.ordenacaoDir === 'asc' ? comp : -comp;
  });
}

function rotuloDoGrupo(p: Portaria, agrupamento: AgrupamentoPortarias): string {
  switch (agrupamento) {
    case 'status':
      return rotuloStatus(p.status);
    case 'categoria':
      return p.categoria ? rotuloCategoria(p.categoria) : 'Sem categoria';
    case 'unidade':
      return p.unidade?.nome || 'Sem Unidade';
    case 'mes': {
      const d = data(p.data_documento);
      return d ? maiuscula(format(d, 'MMMM yyyy', { locale: ptBR })) : 'Sem data';
    }
    case 'servidor':
      return `${p.servidores_ids?.length || 0} servidor(es)`;
    default:
      return 'Todas as Portarias';
  }
}

function celula(p: Portaria, coluna: string): Celula {
  switch (coluna) {
    case 'numero':
      return p.numero;
    case 'titulo':
      return p.titulo || '-';
    case 'categoria':
      return rotuloCategoria(p.categoria);
    case 'status':
      return rotuloStatus(p.status);
    case 'data_documento':
      return dataBr(p.data_documento);
    case 'ementa':
      return p.ementa || '-';
    case 'servidores':
      return p.servidores_ids?.length || 0;
    case 'unidade':
      return p.unidade?.sigla || p.unidade?.nome || '-';
    case 'cargo':
      return p.cargo?.sigla || p.cargo?.nome || '-';
    case 'doe_numero':
      return p.doe_numero || '-';
    case 'doe_data':
      return dataBr(p.doe_data);
    default:
      return null;
  }
}

/** Opções da tela → dados do modelo. `portarias` é a lista completa; o filtro é aplicado aqui. */
export function montarDadosRelatorioPortarias(
  portarias: Portaria[],
  c: ConfiguracaoRelatorioPortarias,
  agora: Date = new Date(),
): DadosRelatorioPortarias {
  const filtradas = ordenar(filtrarPortarias(portarias, c), c);
  // Ordem das colunas é a da lista de colunas disponíveis, não a ordem em que foram marcadas (como no antigo).
  const colunas = COLUNAS_RELATORIO_PORTARIAS.filter((col) => c.colunasSelecionadas.includes(col.id)).map((col) => ({
    chave: col.id,
    rotulo: col.label,
  }));
  const linha = (p: Portaria): Record<string, Celula> => Object.fromEntries(colunas.map((col) => [col.chave, celula(p, col.chave)]));

  const grupos = new Map<string, Record<string, Celula>[]>();
  for (const p of filtradas) {
    const rotulo = rotuloDoGrupo(p, c.agrupamento);
    grupos.set(rotulo, [...(grupos.get(rotulo) ?? []), linha(p)]);
  }

  const filtros = [
    c.filtroStatus && `Status: ${rotuloStatus(c.filtroStatus)}`,
    c.filtroCategoria && `Categoria: ${rotuloCategoria(c.filtroCategoria)}`,
    (c.periodoInicio || c.periodoFim) && `Período: ${c.periodoInicio ? dataBr(c.periodoInicio) : '...'} a ${c.periodoFim ? dataBr(c.periodoFim) : '...'}`,
  ].filter(Boolean);

  const contagem = new Map<string, number>();
  for (const p of filtradas) contagem.set(p.status, (contagem.get(p.status) ?? 0) + 1);

  return {
    titulo: c.titulo.trim() || undefined,
    subtitulo: c.subtitulo.trim() || undefined,
    colunas,
    grupos: [...grupos].map(([rotulo, linhas]) => ({ rotulo, linhas })),
    criterios: [
      `Agrupamento: ${AGRUPAMENTO_ROTULOS[c.agrupamento]} · Ordenação: ${ORDENACAO_ROTULOS[c.ordenacao]} (${c.ordenacaoDir === 'asc' ? 'crescente' : 'decrescente'})`,
      ...(filtros.length ? [`Filtros: ${filtros.join(' · ')}`] : []),
    ],
    resumo: c.mostrarResumo ? [...contagem].map(([s, quantidade]) => ({ rotulo: rotuloStatus(s), quantidade })) : undefined,
    mostrarTotais: c.mostrarTotais,
    carimboArquivo: format(agora, 'yyyy-MM-dd-HHmm'),
  };
}

/** Acima deste número de colunas o relatório sai em paisagem (em retrato as palavras quebrariam no meio). */
const MAX_COLUNAS_RETRATO = 6;

export function tipoRelatorioPortarias(c: ConfiguracaoRelatorioPortarias): 'portarias-relatorio' | 'portarias-relatorio-paisagem' {
  return c.colunasSelecionadas.length > MAX_COLUNAS_RETRATO ? 'portarias-relatorio-paisagem' : 'portarias-relatorio';
}

export async function gerarRelatorioPortariasPDF(portarias: Portaria[], c: ConfiguracaoRelatorioPortarias): Promise<void> {
  baixarDocumento(await emitirDocumento(tipoRelatorioPortarias(c), montarDadosRelatorioPortarias(portarias, c)));
}
