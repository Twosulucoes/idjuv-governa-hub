import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { assinaturas, camposChaveValor, localData, paragrafo, secao, tabela, type ColunaTabela } from '../../blocos';
import type { Bloco, DocumentoModelo } from '../../tipos';

/** Participante como vem de `participantes_reuniao` (com o nome do servidor, se for servidor). */
export interface ParticipanteReuniao {
  id?: string;
  servidor?: { nome_completo: string } | null;
  nome_externo?: string | null;
  cargo_funcao?: string | null;
  status: string;
  justificativa_ausencia?: string | null;
}

/** Campos da reunião que os documentos imprimem (linha de `reunioes`). */
export interface ReuniaoImpressa {
  titulo: string;
  /** AAAA-MM-DD. */
  data_reuniao: string;
  hora_inicio: string;
  hora_fim?: string | null;
  local?: string | null;
  tipo: string;
  pauta?: string | null;
  ata_conteudo?: string | null;
}

export interface DadosListaReuniao {
  reuniao: ReuniaoImpressa;
  participantes: ParticipanteReuniao[];
}

export interface DadosListaPresenca extends DadosListaReuniao {
  /** Local e data da assinatura do responsável (cidade da sede do órgão e dia da emissão). */
  local?: string;
  data: string;
}

const TIPOS: Record<string, string> = {
  ordinaria: 'Ordinária',
  extraordinaria: 'Extraordinária',
  audiencia: 'Audiência',
  sessao_solene: 'Sessão Solene',
  reuniao_trabalho: 'Reunião de Trabalho',
};

const STATUS: Record<string, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmado',
  recusado: 'Recusado',
  presente: 'Presente',
  ausente: 'Ausente',
};

/** "2026-10-15" → "15 de outubro de 2026". Lê só a parte da data: sem fuso, sem dia trocado. */
export function dataPorExtenso(data: string | null | undefined): string {
  if (!data) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(data);
  if (!m) return data;
  return format(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

/** "09:00:00" → "09:00" (o banco guarda `time` com segundos). */
const hora = (h: string | null | undefined): string => (h ? h.replace(/^(\d{2}:\d{2}):\d{2}$/, '$1') : '');

const nomeDe = (p: ParticipanteReuniao): string => p.servidor?.nome_completo || p.nome_externo || '';
const ordem = (i: number): string => String(i + 1).padStart(2, '0');

/** Reunião, data, horário, local e tipo — o cabeçalho de dados dos três documentos. */
const infoReuniao = (r: ReuniaoImpressa): Bloco =>
  camposChaveValor({
    colunas: 3,
    campos: [
      { rotulo: 'Reunião', valor: r.titulo },
      { rotulo: 'Data', valor: dataPorExtenso(r.data_reuniao) },
      { rotulo: 'Horário', valor: r.hora_inicio ? `${hora(r.hora_inicio)}${r.hora_fim ? ` às ${hora(r.hora_fim)}` : ''}` : '' },
      { rotulo: 'Local', valor: r.local || 'Não informado' },
      { rotulo: 'Tipo', valor: TIPOS[r.tipo] || r.tipo },
    ],
  });

// ============================================
// LISTA DE CONVOCADOS
// ============================================

// Pesos em mm da largura útil em retrato (170).
const COLUNAS_CONVOCADOS: ColunaTabela[] = [
  { chave: 'n', titulo: 'Nº', peso: 10, alinhamento: 'centro' },
  { chave: 'nome', titulo: 'Nome', peso: 78 },
  { chave: 'cargo', titulo: 'Cargo/Função', peso: 54 },
  { chave: 'status', titulo: 'Status', peso: 28 },
];

export const listaConvocados: DocumentoModelo<DadosListaReuniao> = {
  tipo: 'reunioes-lista-convocados',
  familia: 'comprovante',
  titulo: () => 'Lista de convocados',
  subtitulo: (d) => d.reuniao.titulo,
  nomeArquivo: (d) => `lista-convocados-${d.reuniao.data_reuniao}.pdf`,
  blocos: (d) => [
    secao({ texto: 'Dados da reunião' }),
    infoReuniao(d.reuniao),
    secao({ texto: 'Convocados' }),
    tabela({
      colunas: COLUNAS_CONVOCADOS,
      linhas: d.participantes.map((p, i) => ({
        n: ordem(i),
        nome: nomeDe(p),
        cargo: p.cargo_funcao,
        status: STATUS[p.status] || p.status,
      })),
    }),
    paragrafo({ texto: `Total de convocados: ${d.participantes.length}`, negrito: true }),
  ],
};

// ============================================
// LISTA DE PRESENÇA — com espaço para cada participante assinar à mão
// ============================================

/** Altura (mm) de cada linha da lista de presença: cabe uma assinatura à mão. */
export const ALTURA_LINHA_ASSINATURA = 10;

const COLUNAS_PRESENCA: ColunaTabela[] = [
  { chave: 'n', titulo: 'Nº', peso: 9, alinhamento: 'centro' },
  { chave: 'nome', titulo: 'Nome', peso: 50 },
  { chave: 'cargo', titulo: 'Cargo/Função', peso: 34 },
  { chave: 'presenca', titulo: 'Presença', peso: 30 },
  { chave: 'assinatura', titulo: 'Assinatura', peso: 47, emBranco: true },
];

const presencaDe = (p: ParticipanteReuniao): string => {
  if (p.status === 'presente') return 'Presente';
  if (p.status !== 'ausente') return '';
  const just = p.justificativa_ausencia?.trim();
  return just ? `Ausente\nJustificativa: ${just}` : 'Ausente';
};

export const listaPresenca: DocumentoModelo<DadosListaPresenca> = {
  tipo: 'reunioes-lista-presenca',
  familia: 'comprovante',
  titulo: () => 'Lista de presença',
  subtitulo: (d) => d.reuniao.titulo,
  nomeArquivo: (d) => `lista-presenca-${d.reuniao.data_reuniao}.pdf`,
  blocos: (d) => {
    const contar = (s: string) => d.participantes.filter((p) => p.status === s).length;
    const local = d.local?.trim();
    return [
      secao({ texto: 'Dados da reunião' }),
      infoReuniao(d.reuniao),
      camposChaveValor({
        colunas: 3,
        campos: [
          { rotulo: 'Presentes', valor: contar('presente') },
          { rotulo: 'Ausentes', valor: contar('ausente') },
          { rotulo: 'Total', valor: d.participantes.length },
        ],
      }),
      secao({ texto: 'Participantes' }),
      tabela({
        colunas: COLUNAS_PRESENCA,
        alturaMinimaLinha: ALTURA_LINHA_ASSINATURA,
        linhas: d.participantes.map((p, i) => ({
          n: ordem(i),
          nome: nomeDe(p),
          cargo: p.cargo_funcao,
          presenca: presencaDe(p),
        })),
      }),
      local ? localData({ local, data: d.data }) : paragrafo({ texto: `${d.data}.` }),
      assinaturas({ assinantes: [{ nome: 'Responsável pela Reunião' }] }),
    ];
  },
};

// ============================================
// RELATÓRIO DA REUNIÃO — dados, presentes, pauta e ata
// ============================================

const COLUNAS_PRESENTES: ColunaTabela[] = [
  { chave: 'n', titulo: 'Nº', peso: 10, alinhamento: 'centro' },
  { chave: 'nome', titulo: 'Nome', peso: 90 },
  { chave: 'cargo', titulo: 'Cargo/Função', peso: 70 },
];

export const relatorioReuniao: DocumentoModelo<DadosListaReuniao> = {
  tipo: 'reunioes-relatorio',
  familia: 'relatorio',
  titulo: () => 'Relatório de reunião',
  nomeArquivo: (d) => `relatorio-reuniao-${d.reuniao.data_reuniao}.pdf`,
  blocos: (d) => {
    const presentes = d.participantes.filter((p) => p.status === 'presente');
    const blocos: Bloco[] = [
      secao({ texto: 'Informações gerais' }),
      infoReuniao(d.reuniao),
      secao({ texto: `Participantes presentes (${presentes.length})` }),
      tabela({
        colunas: COLUNAS_PRESENTES,
        linhas: presentes.map((p, i) => ({ n: ordem(i), nome: nomeDe(p), cargo: p.cargo_funcao })),
      }),
    ];
    if (d.reuniao.pauta?.trim()) blocos.push(secao({ texto: 'Pauta' }), paragrafo({ texto: d.reuniao.pauta }));
    if (d.reuniao.ata_conteudo?.trim()) {
      blocos.push(secao({ texto: 'Ata da reunião' }), paragrafo({ texto: d.reuniao.ata_conteudo, alinhamento: 'justificado' }));
    }
    return blocos;
  },
};
