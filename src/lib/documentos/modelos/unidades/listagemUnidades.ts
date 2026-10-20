/**
 * Listagem geral de unidades locais (antigo `pdfListagemUnidades.ts`), tela RelatoriosCentralPage.
 * A mesma tabela serve à listagem geral e ao relatório de conformidade (unidades com pendência).
 */
import { STATUS_UNIDADE_LABELS, TIPO_UNIDADE_LABELS } from '@/types/unidadesLocais';
import { camposChaveValor, tabela, type Campo } from '../../blocos';
import type { DocumentoModelo } from '../../tipos';

export interface UnidadeResumo {
  codigo?: string;
  nome: string;
  tipo: string;
  municipio: string;
  status: string;
  /** Nome do responsável, ou um aviso já pronto (ex.: "SEM RESPONSÁVEL" no relatório de conformidade). */
  chefe?: string;
  capacidade?: number;
}

export interface ListagemUnidadesConfig {
  titulo?: string;
  subtitulo?: string;
  filtros?: {
    municipio?: string;
    tipo?: string;
    status?: string;
  };
}

export interface DadosListagemUnidades extends ListagemUnidadesConfig {
  unidades: UnidadeResumo[];
}

const TIPO_LABELS: Record<string, string> = TIPO_UNIDADE_LABELS;
const STATUS_LABELS: Record<string, string> = STATUS_UNIDADE_LABELS;
const rotulo = (valor: string | undefined, labels: Record<string, string>): string => (valor ? labels[valor] || valor : '');

function camposFiltros(f: ListagemUnidadesConfig['filtros'] = {}): Campo[] {
  const campos: Campo[] = [];
  if (f.municipio) campos.push({ rotulo: 'Município', valor: f.municipio });
  if (f.tipo) campos.push({ rotulo: 'Tipo', valor: rotulo(f.tipo, TIPO_LABELS) });
  if (f.status) campos.push({ rotulo: 'Status', valor: rotulo(f.status, STATUS_LABELS) });
  return campos;
}

export const listagemUnidades: DocumentoModelo<DadosListagemUnidades> = {
  tipo: 'unidades-listagem',
  familia: 'relatorio',
  orientacao: 'paisagem',
  titulo: (d) => d.titulo || 'Relatório de unidades locais',
  subtitulo: (d) => d.subtitulo || 'Listagem geral',
  nomeArquivo: () => `Listagem_Unidades_${new Date().toISOString().slice(0, 10)}.pdf`,
  blocos: (d) => [
    camposChaveValor({
      colunas: 3,
      campos: [{ rotulo: 'Total de unidades', valor: d.unidades.length.toLocaleString('pt-BR') }, ...camposFiltros(d.filtros)],
    }),
    tabela({
      colunas: [
        { chave: 'codigo', titulo: 'Código', peso: 20 },
        { chave: 'nome', titulo: 'Nome da unidade', peso: 66 },
        { chave: 'tipo', titulo: 'Tipo', peso: 35 },
        { chave: 'municipio', titulo: 'Município', peso: 35 },
        { chave: 'status', titulo: 'Status', peso: 29, alinhamento: 'centro' },
        { chave: 'responsavel', titulo: 'Responsável', peso: 55 },
        { chave: 'capacidade', titulo: 'Capacidade', peso: 25, alinhamento: 'direita' },
      ],
      linhas: d.unidades.map((u) => ({
        codigo: u.codigo,
        nome: u.nome,
        tipo: rotulo(u.tipo, TIPO_LABELS),
        municipio: u.municipio,
        status: rotulo(u.status, STATUS_LABELS),
        responsavel: u.chefe,
        // Como no antigo: capacidade 0 ou ausente sai como "—".
        capacidade: u.capacidade ? u.capacidade.toLocaleString('pt-BR') : '',
      })),
    }),
  ],
};
