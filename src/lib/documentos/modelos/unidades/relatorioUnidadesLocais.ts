/**
 * Relatório de unidades locais (antigo `pdfRelatorioUnidades.ts`), tela RelatoriosUnidadesLocaisPage.
 * Três modos: lista (tabela com as colunas escolhidas), detalhado (uma ficha por unidade, cada uma em
 * página própria) e resumo (estatísticas e distribuição por tipo e município). Filtros aplicados e
 * totalizadores opcionais valem para os três.
 */
import { NATUREZA_USO_LABELS, STATUS_UNIDADE_LABELS, TIPO_UNIDADE_LABELS } from '@/types/unidadesLocais';
import { camposChaveValor, paragrafo, quebraPagina, secao, tabela, type Campo, type ColunaTabela } from '../../blocos';
import type { Bloco, DocumentoModelo } from '../../tipos';

export interface UnidadeRelatorioData {
  id: string;
  codigo_unidade: string;
  nome_unidade: string;
  tipo_unidade: string;
  municipio: string;
  endereco_completo: string | null;
  status: string;
  natureza_uso: string | null;
  diretoria_vinculada: string | null;
  unidade_administrativa: string | null;
  autoridade_autorizadora: string | null;
  capacidade: number | null;
  horario_funcionamento: string | null;
  estrutura_disponivel: string | null;
  areas_disponiveis: string[];
  regras_de_uso: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  chefe_atual_id: string | null;
  chefe_atual_nome: string | null;
  chefe_atual_cargo: string | null;
  chefe_ato_numero: string | null;
  chefe_data_inicio: string | null;
  total_patrimonio: number;
  patrimonio_valor_total: number;
  patrimonio_bom_estado: number;
  patrimonio_manutencao: number;
  total_agendamentos: number;
  agendamentos_aprovados: number;
  agendamentos_pendentes: number;
  total_termos_cessao: number;
  termos_vigentes: number;
}

/** Campos marcados na tela: no modo lista viram colunas; no detalhado, campos e seções da ficha. */
export interface CamposRelatorio {
  codigo: boolean;
  nome: boolean;
  tipo: boolean;
  municipio: boolean;
  endereco: boolean;
  status: boolean;
  natureza: boolean;
  diretoria: boolean;
  capacidade: boolean;
  horario: boolean;
  chefe: boolean;
  patrimonio: boolean;
  agendamentos: boolean;
  termos: boolean;
  areas: boolean;
  regras: boolean;
  observacoes: boolean;
}

/** Filtros da tela; `'all'` (ou vazio) é "sem filtro" e não sai no relatório. */
export interface FiltrosAplicados {
  municipio?: string;
  tipo?: string;
  status?: string;
  natureza?: string;
  diretoria?: string;
  comChefe?: boolean | 'all';
  comPatrimonio?: boolean | 'all';
  comAgendamentos?: boolean | 'all';
  busca?: string;
}

export interface ConfiguracaoRelatorio {
  titulo?: string;
  subtitulo?: string;
  modo: 'lista' | 'detalhado' | 'resumo';
  campos: CamposRelatorio;
  filtros: FiltrosAplicados;
  incluirEstatisticas: boolean;
  incluirTotalizadores: boolean;
}

export interface DadosRelatorioUnidadesLocais {
  unidades: UnidadeRelatorioData[];
  config: ConfiguracaoRelatorio;
}

// "lazer" vinha da lista antiga do relatório; as demais são as do cadastro.
const NATUREZA_LABELS: Record<string, string> = { ...NATUREZA_USO_LABELS, lazer: 'Lazer' };
const TIPO_LABELS: Record<string, string> = TIPO_UNIDADE_LABELS;
const STATUS_LABELS: Record<string, string> = STATUS_UNIDADE_LABELS;

/** Rótulo do código, ou o próprio código se a lista não o conhece; vazio volta '' (o bloco imprime "—"). */
const rotulo = (valor: string | null | undefined, labels: Record<string, string>): string => (valor ? labels[valor] || valor : '');
/** Contagem/valor numérico sem NaN: ausente vira 0. */
const num = (v: number | null | undefined): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);
const inteiro = (v: number | null | undefined): string => num(v).toLocaleString('pt-BR');
const MOEDA = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const moeda = (v: number | null | undefined): string => MOEDA.format(num(v));
const capacidade = (v: number | null | undefined): string => (typeof v === 'number' && Number.isFinite(v) ? v.toLocaleString('pt-BR') : '');
/** "2026-02-15" (ou timestamp ISO) → "15/02/2026", sem fuso. */
const data = (v: string | null | undefined): string => {
  if (!v) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(v);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : v;
};
const ativo = (v: string | undefined): v is string => !!v && v !== 'all';

/** Filtros na mesma ordem e com os mesmos textos do relatório antigo. */
function camposFiltros(f: FiltrosAplicados): Campo[] {
  const campos: Campo[] = [];
  if (ativo(f.municipio)) campos.push({ rotulo: 'Município', valor: f.municipio });
  if (ativo(f.tipo)) campos.push({ rotulo: 'Tipo', valor: rotulo(f.tipo, TIPO_LABELS) });
  if (ativo(f.status)) campos.push({ rotulo: 'Status', valor: rotulo(f.status, STATUS_LABELS) });
  if (ativo(f.natureza)) campos.push({ rotulo: 'Natureza', valor: rotulo(f.natureza, NATUREZA_LABELS) });
  if (ativo(f.diretoria)) campos.push({ rotulo: 'Diretoria', valor: f.diretoria });
  if (typeof f.comChefe === 'boolean') {
    campos.push({ rotulo: 'Chefe', valor: f.comChefe ? 'Com chefe designado' : 'Sem chefe designado' });
  }
  if (typeof f.comPatrimonio === 'boolean') {
    campos.push({ rotulo: 'Patrimônio', valor: f.comPatrimonio ? 'Com patrimônio' : 'Sem patrimônio' });
  }
  if (typeof f.comAgendamentos === 'boolean') {
    campos.push({ rotulo: 'Agendamentos', valor: f.comAgendamentos ? 'Com agendamentos' : 'Sem agendamentos' });
  }
  if (f.busca) campos.push({ rotulo: 'Busca', valor: `"${f.busca}"` });
  return campos;
}

interface ColunaLista extends ColunaTabela {
  chave: keyof CamposRelatorio;
  valor: (u: UnidadeRelatorioData) => string;
}

/**
 * Colunas do modo lista; o peso é a largura (mm) em A4 paisagem com as 12 colunas, de modo que nenhum título
 * quebre no meio da palavra. Com menos colunas marcadas, a largura útil se redistribui na mesma proporção.
 */
const COLUNAS_LISTA: ColunaLista[] = [
  { chave: 'codigo', titulo: 'Código', peso: 15, valor: (u) => u.codigo_unidade },
  { chave: 'nome', titulo: 'Nome', peso: 27, valor: (u) => u.nome_unidade },
  { chave: 'tipo', titulo: 'Tipo', peso: 21, valor: (u) => rotulo(u.tipo_unidade, TIPO_LABELS) },
  { chave: 'municipio', titulo: 'Município', peso: 21, valor: (u) => u.municipio },
  { chave: 'status', titulo: 'Status', peso: 23, valor: (u) => rotulo(u.status, STATUS_LABELS) },
  { chave: 'natureza', titulo: 'Natureza', peso: 18, valor: (u) => rotulo(u.natureza_uso, NATUREZA_LABELS) },
  { chave: 'diretoria', titulo: 'Diretoria', peso: 23, valor: (u) => u.diretoria_vinculada ?? '' },
  { chave: 'capacidade', titulo: 'Capacidade', peso: 21, alinhamento: 'direita', valor: (u) => capacidade(u.capacidade) },
  { chave: 'chefe', titulo: 'Chefe atual', peso: 23, valor: (u) => u.chefe_atual_nome || 'Sem chefe' },
  { chave: 'patrimonio', titulo: 'Patrimônio', peso: 20, alinhamento: 'direita', valor: (u) => `${inteiro(u.total_patrimonio)} itens` },
  { chave: 'agendamentos', titulo: 'Agendamentos', peso: 27, alinhamento: 'direita', valor: (u) => inteiro(u.total_agendamentos) },
  { chave: 'termos', titulo: 'Termos vigentes', peso: 18, alinhamento: 'direita', valor: (u) => inteiro(u.termos_vigentes) },
];
/** Sem nenhuma coluna marcada, o antigo mostrava estas. */
const COLUNAS_PADRAO: (keyof CamposRelatorio)[] = ['codigo', 'nome', 'municipio', 'status'];

function blocosLista(unidades: UnidadeRelatorioData[], campos: CamposRelatorio): Bloco[] {
  let colunas = COLUNAS_LISTA.filter((c) => campos[c.chave]);
  if (colunas.length === 0) colunas = COLUNAS_LISTA.filter((c) => COLUNAS_PADRAO.includes(c.chave));
  return [
    tabela({
      colunas: colunas.map(({ chave, titulo, peso, alinhamento }) => ({ chave, titulo, peso, alinhamento })),
      linhas: unidades.map((u) => Object.fromEntries(colunas.map((c) => [c.chave, c.valor(u)]))),
    }),
  ];
}

function fichaDaUnidade(u: UnidadeRelatorioData, campos: CamposRelatorio): Bloco[] {
  const blocos: Bloco[] = [
    paragrafo({ texto: `Ficha de unidade local: ${[u.codigo_unidade, u.nome_unidade].filter(Boolean).join(' - ')}`, negrito: true }),
  ];

  const curtos: Campo[] = [];
  if (campos.codigo) curtos.push({ rotulo: 'Código', valor: u.codigo_unidade });
  if (campos.tipo) curtos.push({ rotulo: 'Tipo', valor: rotulo(u.tipo_unidade, TIPO_LABELS) });
  if (campos.status) curtos.push({ rotulo: 'Status', valor: rotulo(u.status, STATUS_LABELS) });
  if (campos.natureza) curtos.push({ rotulo: 'Natureza', valor: rotulo(u.natureza_uso, NATUREZA_LABELS) });
  if (campos.municipio) curtos.push({ rotulo: 'Município', valor: u.municipio });
  if (campos.capacidade) curtos.push({ rotulo: 'Capacidade', valor: capacidade(u.capacidade) });
  if (campos.horario) curtos.push({ rotulo: 'Horário', valor: u.horario_funcionamento });
  const longos: Campo[] = [];
  // Como no antigo: endereço e diretoria só saem quando informados.
  if (campos.endereco && u.endereco_completo) longos.push({ rotulo: 'Endereço', valor: u.endereco_completo });
  if (campos.diretoria && u.diretoria_vinculada) longos.push({ rotulo: 'Diretoria vinculada', valor: u.diretoria_vinculada });
  if (campos.nome || curtos.length > 0 || longos.length > 0) {
    blocos.push(secao({ texto: 'Identificação' }));
    if (campos.nome) blocos.push(camposChaveValor({ colunas: 1, campos: [{ rotulo: 'Nome', valor: u.nome_unidade }] }));
    if (curtos.length > 0) blocos.push(camposChaveValor({ colunas: 3, campos: curtos }));
    if (longos.length > 0) blocos.push(camposChaveValor({ colunas: 1, campos: longos }));
  }

  if (campos.chefe) {
    blocos.push(secao({ texto: 'Responsável' }));
    if (u.chefe_atual_nome) {
      const resp: Campo[] = [
        { rotulo: 'Nome', valor: u.chefe_atual_nome },
        { rotulo: 'Cargo', valor: u.chefe_atual_cargo },
      ];
      // Como no antigo: ato e data de início só com o número do ato.
      if (u.chefe_ato_numero) {
        resp.push({ rotulo: 'Ato de nomeação', valor: u.chefe_ato_numero }, { rotulo: 'Data de início', valor: data(u.chefe_data_inicio) });
      }
      blocos.push(camposChaveValor({ colunas: 2, campos: resp }));
    } else {
      blocos.push(paragrafo({ texto: 'Nenhum responsável designado' }));
    }
  }
  // Patrimônio, agendamentos e termos numa tabela de uma linha (só os grupos marcados), como as três seções do antigo.
  const acervo: { coluna: ColunaTabela; valor: string }[] = [];
  const col = (chave: string, titulo: string, valor: string) => acervo.push({ coluna: { chave, titulo, alinhamento: 'direita' }, valor });
  if (campos.patrimonio) {
    col('patrimonio', 'Patrimônio (itens)', inteiro(u.total_patrimonio));
    col('valor', 'Valor estimado', moeda(u.patrimonio_valor_total));
    col('bom', 'Em bom estado', inteiro(u.patrimonio_bom_estado));
  }
  if (campos.agendamentos) {
    col('agendamentos', 'Agendamentos', inteiro(u.total_agendamentos));
    col('aprovados', 'Aprovados', inteiro(u.agendamentos_aprovados));
    col('pendentes', 'Pendentes', inteiro(u.agendamentos_pendentes));
  }
  if (campos.termos) {
    col('termos', 'Termos de cessão', inteiro(u.total_termos_cessao));
    col('vigentes', 'Termos vigentes', inteiro(u.termos_vigentes));
  }
  if (acervo.length > 0) {
    blocos.push(
      secao({ texto: 'Acervo' }),
      tabela({ colunas: acervo.map((a) => a.coluna), linhas: [Object.fromEntries(acervo.map((a) => [a.coluna.chave, a.valor]))] }),
    );
  }

  const outros: Campo[] = [];
  if (campos.areas && u.areas_disponiveis?.length > 0) outros.push({ rotulo: 'Áreas disponíveis', valor: u.areas_disponiveis.join(', ') });
  if (campos.regras && u.regras_de_uso) outros.push({ rotulo: 'Regras de uso', valor: u.regras_de_uso });
  if (campos.observacoes && u.observacoes) outros.push({ rotulo: 'Observações', valor: u.observacoes });
  if (outros.length > 0) blocos.push(secao({ texto: 'Uso e observações' }), camposChaveValor({ colunas: 1, campos: outros }));
  return blocos;
}

function blocosDetalhado(unidades: UnidadeRelatorioData[], campos: CamposRelatorio): Bloco[] {
  if (unidades.length === 0) return [paragrafo({ texto: 'Nenhuma unidade encontrada.' })];
  // Uma ficha por página, como no antigo.
  return unidades.flatMap((u, i) => [...(i > 0 ? [quebraPagina()] : []), ...fichaDaUnidade(u, campos)]);
}

/** Contagem por chave, da maior para a menor (empate: ordem alfabética). */
function contarPor(unidades: UnidadeRelatorioData[], chave: (u: UnidadeRelatorioData) => string): { item: string; qtd: number }[] {
  const mapa = new Map<string, number>();
  for (const u of unidades) mapa.set(chave(u), (mapa.get(chave(u)) ?? 0) + 1);
  return [...mapa.entries()]
    .map(([item, qtd]) => ({ item, qtd }))
    .sort((a, b) => b.qtd - a.qtd || a.item.localeCompare(b.item, 'pt-BR'));
}

function tabelaDistribuicao(titulo: string, linhas: { item: string; qtd: number }[], total: number): Bloco {
  return tabela({
    colunas: [
      { chave: 'item', titulo, peso: 4 },
      { chave: 'qtd', titulo: 'Quantidade', peso: 1, alinhamento: 'direita' },
    ],
    linhas: linhas.map((l) => ({ item: l.item, qtd: inteiro(l.qtd) })),
    totais: { item: 'Total', qtd: inteiro(total) },
  });
}

function blocosResumo(unidades: UnidadeRelatorioData[]): Bloco[] {
  const total = unidades.length;
  const comStatus = (s: string) => unidades.filter((u) => u.status === s).length;
  const comChefe = unidades.filter((u) => u.chefe_atual_id).length;
  const itens = unidades.reduce((s, u) => s + num(u.total_patrimonio), 0);
  const valor = unidades.reduce((s, u) => s + num(u.patrimonio_valor_total), 0);
  return [
    secao({ texto: 'Estatísticas gerais' }),
    camposChaveValor({
      colunas: 2,
      campos: [
        { rotulo: 'Total de unidades', valor: inteiro(total) },
        { rotulo: 'Unidades ativas', valor: inteiro(comStatus('ativa')) },
        { rotulo: 'Em manutenção', valor: inteiro(comStatus('manutencao')) },
        { rotulo: 'Interditadas', valor: inteiro(comStatus('interditada')) },
        { rotulo: 'Com chefe designado', valor: inteiro(comChefe) },
        { rotulo: 'Sem chefe designado', valor: inteiro(total - comChefe) },
        { rotulo: 'Total patrimônio', valor: `${inteiro(itens)} itens` },
        { rotulo: 'Valor patrimônio', valor: moeda(valor) },
      ],
    }),
    secao({ texto: 'Distribuição por tipo' }),
    tabelaDistribuicao('Tipo', contarPor(unidades, (u) => rotulo(u.tipo_unidade, TIPO_LABELS) || 'Não informado'), total),
    secao({ texto: 'Distribuição por município' }),
    tabelaDistribuicao('Município', contarPor(unidades, (u) => u.municipio || 'Não informado'), total),
  ];
}

function blocosTotalizadores(unidades: UnidadeRelatorioData[]): Bloco[] {
  return [
    secao({ texto: 'Totalizadores' }),
    camposChaveValor({
      colunas: 2,
      campos: [
        { rotulo: 'Unidades', valor: inteiro(unidades.length) },
        { rotulo: 'Itens de patrimônio', valor: inteiro(unidades.reduce((s, u) => s + num(u.total_patrimonio), 0)) },
        { rotulo: 'Valor total', valor: moeda(unidades.reduce((s, u) => s + num(u.patrimonio_valor_total), 0)) },
        { rotulo: 'Agendamentos', valor: inteiro(unidades.reduce((s, u) => s + num(u.total_agendamentos), 0)) },
      ],
    }),
  ];
}

export const relatorioUnidadesLocais: DocumentoModelo<DadosRelatorioUnidadesLocais> = {
  tipo: 'unidades-relatorio-unidades-locais',
  familia: 'relatorio',
  orientacao: 'paisagem',
  titulo: (d) => d.config.titulo || 'Relatório de unidades locais',
  subtitulo: (d) =>
    `${d.config.subtitulo || 'Inventário de acervo de unidades esportivas e culturais'} · Total de registros: ${d.unidades.length}`,
  nomeArquivo: (d) => {
    const sufixo = d.config.modo === 'detalhado' ? '-detalhado' : d.config.modo === 'resumo' ? '-resumo' : '';
    return `relatorio-unidades${sufixo}-${new Date().toISOString().slice(0, 10)}.pdf`;
  },
  blocos: (d) => {
    const blocos: Bloco[] = [];
    const filtros = camposFiltros(d.config.filtros ?? {});
    if (filtros.length > 0) blocos.push(secao({ texto: 'Filtros aplicados' }), camposChaveValor({ colunas: 3, campos: filtros }));
    if (d.config.modo === 'detalhado') blocos.push(...blocosDetalhado(d.unidades, d.config.campos));
    else if (d.config.modo === 'resumo') blocos.push(...blocosResumo(d.unidades));
    else blocos.push(...blocosLista(d.unidades, d.config.campos));
    if (d.config.incluirTotalizadores) blocos.push(...blocosTotalizadores(d.unidades));
    return blocos;
  },
};
