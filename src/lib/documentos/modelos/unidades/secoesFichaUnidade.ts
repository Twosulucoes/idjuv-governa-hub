/**
 * Seções da ficha cadastral de unidade local (antigos blocos de `src/lib/pdf/unidades/`).
 * Cada função devolve os blocos de uma seção; valor vazio vira "—" pelos próprios blocos.
 */
import {
  ESTADO_CONSERVACAO_LABELS,
  STATUS_UNIDADE_LABELS,
  TIPO_ATO_LABELS,
  TIPO_UNIDADE_LABELS,
} from '@/types/unidadesLocais';
import { camposChaveValor, paragrafo, secao, tabela } from '../../blocos';
import type { Campo } from '../../blocos';
import type { Bloco } from '../../tipos';

export interface DadosIdentificacao {
  codigo?: string;
  nome: string;
  tipo: string;
  natureza?: string;
  status: string;
  diretoria?: string;
  capacidade?: number;
}

export interface DadosLocalizacao {
  municipio: string;
  /** Sigla da UF impressa após o município ("Cidade/UF"). Sem ela, só o município. */
  uf?: string;
  endereco?: string;
  complemento?: string;
  referencia?: string;
}

export interface DadosEstrutura {
  areas: string[];
  estrutura?: string;
  horarioFuncionamento?: string;
  regrasUso?: string;
}

export interface DadosResponsavel {
  nome: string;
  cargo: string;
  tipoAto?: string;
  numeroAto?: string;
  dataPublicacao?: string;
  dataInicio?: string;
  status?: string;
}

export interface DadosCedencias {
  totalSolicitadas: number;
  aprovadas: number;
  rejeitadas: number;
  canceladas: number;
  pendentes: number;
  publicoTotal?: number;
  ultimaCedencia?: {
    titulo: string;
    solicitante: string;
    dataInicio: string;
    dataFim: string;
  };
}

export interface DadosPatrimonio {
  totalItens: number;
  valorEstimado?: number;
  porEstado: {
    otimo?: number;
    bom?: number;
    regular?: number;
    ruim?: number;
    inservivel?: number;
  };
  itensRecentes?: Array<{
    tombo: string;
    descricao: string;
    estado: string;
  }>;
}

/** Rótulo do código, ou o próprio código se a lista não o conhece. */
const rotulo = (labels: Record<string, string>, codigo?: string): string => (codigo ? labels[codigo] || codigo : '');

/** Número em pt-BR; ausente ou inválido volta '' (o bloco imprime "—"). */
const numero = (n?: number | null): string => (typeof n === 'number' && Number.isFinite(n) ? n.toLocaleString('pt-BR') : '');

const moeda = (n: number): string => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function secaoIdentificacao(d: DadosIdentificacao): Bloco[] {
  const campos: Campo[] = [
    { rotulo: 'Tipo', valor: rotulo(TIPO_UNIDADE_LABELS, d.tipo) },
    { rotulo: 'Status', valor: rotulo(STATUS_UNIDADE_LABELS, d.status) },
  ];
  // Como no original: diretoria e capacidade só aparecem quando informadas.
  if (d.diretoria) campos.push({ rotulo: 'Diretoria vinculada', valor: d.diretoria });
  if (d.capacidade) campos.push({ rotulo: 'Capacidade', valor: `${numero(d.capacidade)} pessoas` });
  return [
    secao({ texto: 'Identificação da unidade' }),
    d.codigo
      ? camposChaveValor({
          campos: [
            { rotulo: 'Código', valor: d.codigo },
            { rotulo: 'Nome da unidade', valor: d.nome },
          ],
        })
      : camposChaveValor({ colunas: 1, campos: [{ rotulo: 'Nome da unidade', valor: d.nome }] }),
    camposChaveValor({ campos }),
  ];
}

export function secaoLocalizacao(d: DadosLocalizacao): Bloco[] {
  const campos: Campo[] = [{ rotulo: 'Município', valor: d.uf ? `${d.municipio}/${d.uf}` : d.municipio }];
  if (d.endereco) campos.push({ rotulo: 'Endereço', valor: d.endereco });
  if (d.complemento) campos.push({ rotulo: 'Complemento', valor: d.complemento });
  if (d.referencia) campos.push({ rotulo: 'Ponto de referência', valor: d.referencia });
  return [secao({ texto: 'Localização' }), camposChaveValor({ colunas: 1, campos })];
}

export function secaoEstrutura(d: DadosEstrutura): Bloco[] {
  const campos: Campo[] = [];
  if (d.estrutura) campos.push({ rotulo: 'Estrutura', valor: d.estrutura });
  if (d.areas.length > 0) campos.push({ rotulo: 'Áreas disponíveis', valor: d.areas.join(' • ') });
  if (d.horarioFuncionamento) campos.push({ rotulo: 'Horário de funcionamento', valor: d.horarioFuncionamento });
  return [
    secao({ texto: 'Estrutura e áreas disponíveis' }),
    campos.length > 0
      ? camposChaveValor({ colunas: 1, campos })
      : paragrafo({ texto: 'Nenhuma estrutura ou área informada.' }),
  ];
}

export function secaoResponsavel(d: DadosResponsavel | null): Bloco[] {
  const titulo = secao({ texto: 'Responsável pela unidade' });
  if (!d) return [titulo, paragrafo({ texto: 'Unidade sem responsável designado.', negrito: true })];
  const campos: Campo[] = [
    { rotulo: 'Nome', valor: d.nome },
    { rotulo: 'Cargo', valor: d.cargo },
  ];
  // Como no original: o ato só sai com tipo e número.
  if (d.tipoAto && d.numeroAto) {
    campos.push({ rotulo: 'Ato de nomeação', valor: `${rotulo(TIPO_ATO_LABELS, d.tipoAto)} nº ${d.numeroAto}` });
    if (d.dataPublicacao) campos.push({ rotulo: 'Data de publicação', valor: d.dataPublicacao });
  }
  if (d.dataInicio) campos.push({ rotulo: 'Início da gestão', valor: d.dataInicio });
  return [titulo, camposChaveValor({ campos })];
}

export function secaoCedencias(d: DadosCedencias): Bloco[] {
  const blocos: Bloco[] = [
    secao({ texto: 'Resumo de cedências' }),
    tabela({
      colunas: [
        { chave: 'solicitadas', titulo: 'Solicitadas', alinhamento: 'centro' },
        { chave: 'aprovadas', titulo: 'Aprovadas', alinhamento: 'centro' },
        { chave: 'pendentes', titulo: 'Pendentes', alinhamento: 'centro' },
        { chave: 'rejeitadas', titulo: 'Rejeitadas', alinhamento: 'centro' },
        { chave: 'canceladas', titulo: 'Canceladas', alinhamento: 'centro' },
      ],
      linhas: [
        {
          solicitadas: numero(d.totalSolicitadas),
          aprovadas: numero(d.aprovadas),
          pendentes: numero(d.pendentes),
          rejeitadas: numero(d.rejeitadas),
          canceladas: numero(d.canceladas),
        },
      ],
    }),
  ];
  const campos: Campo[] = [];
  if (d.publicoTotal && d.publicoTotal > 0) {
    campos.push({ rotulo: 'Público total atendido', valor: `${numero(d.publicoTotal)} pessoas` });
  }
  if (d.ultimaCedencia) {
    const u = d.ultimaCedencia;
    campos.push({ rotulo: 'Última cedência', valor: `${u.titulo} - ${u.solicitante} (${u.dataInicio} a ${u.dataFim})` });
  }
  if (campos.length > 0) blocos.push(camposChaveValor({ colunas: 1, campos }));
  return blocos;
}

const ESTADOS = ['otimo', 'bom', 'regular', 'ruim', 'inservivel'] as const;

export function secaoPatrimonio(d: DadosPatrimonio): Bloco[] {
  const campos: Campo[] = [{ rotulo: 'Total de itens', valor: numero(d.totalItens) }];
  // Como no original: o valor só sai quando positivo.
  if (d.valorEstimado && d.valorEstimado > 0) campos.push({ rotulo: 'Valor estimado', valor: moeda(d.valorEstimado) });
  const blocos: Bloco[] = [secao({ texto: 'Patrimônio' }), camposChaveValor({ campos })];

  if (d.totalItens > 0) {
    const linha: Record<string, string> = {};
    for (const e of ESTADOS) linha[e] = numero(d.porEstado[e] ?? 0);
    blocos.push(
      paragrafo({ texto: 'Distribuição por estado de conservação', negrito: true }),
      tabela({
        colunas: ESTADOS.map((e) => ({ chave: e, titulo: ESTADO_CONSERVACAO_LABELS[e], alinhamento: 'centro' as const })),
        linhas: [linha],
      }),
    );
  }
  if (d.itensRecentes && d.itensRecentes.length > 0) {
    blocos.push(
      paragrafo({ texto: 'Itens recentes', negrito: true }),
      tabela({
        colunas: [
          { chave: 'tombo', titulo: 'Tombo', peso: 1.2 },
          { chave: 'descricao', titulo: 'Descrição', peso: 4 },
          { chave: 'estado', titulo: 'Estado de conservação', peso: 1.6 },
        ],
        linhas: d.itensRecentes.map((i) => ({
          tombo: i.tombo,
          descricao: i.descricao,
          estado: rotulo(ESTADO_CONSERVACAO_LABELS, i.estado),
        })),
      }),
    );
  }
  return blocos;
}
