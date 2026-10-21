// Montagem do relatório anual de governança e integridade a partir das linhas do banco.
// Função pura: o hook `useRelatorioGovernanca` busca as linhas e chama `montarRelatorioGovernanca`;
// a tela e o PDF (`governanca-relatorio-anual`) usam o mesmo resultado. Nada aqui inventa número:
// seção sem registro volta vazia.

import type { ConformidadeChecklist, DadosRelatorioGovernanca } from '@/lib/documentos/modelos/governanca/relatorioAnual';
import { MODULES_CONFIG } from '@/shared/config/modules.config';

export interface LinhasRelatorioGovernanca {
  checklists: { id: string; nome: string; orgao_fiscalizador: string }[];
  itensChecklist: { id: string; checklist_id: string }[];
  /** Respostas do exercício; com mais de uma por item vale a de `updated_at` mais recente. */
  respostasChecklist: { item_id: string; status: string; updated_at?: string | null }[];
  processos: { modulo_sistema: string | null }[];
  riscos: { nivel_risco_inerente: string; nivel_risco_residual: string | null; status: string }[];
  planos: {
    titulo: string;
    status: string;
    percentual_execucao: number | null;
    prazo_inicio: string | null;
    prazo_conclusao: string | null;
  }[];
  avaliacoesControle: { efetividade: string }[];
  /** `null` quando quem emite não tem permissão para consultar o canal de denúncias. */
  denuncias: { status: string }[] | null;
}

const NIVEIS: [string, string][] = [
  ['muito_alto', 'Muito alto'],
  ['alto', 'Alto'],
  ['medio', 'Médio'],
  ['baixo', 'Baixo'],
  ['muito_baixo', 'Muito baixo'],
];

const ROTULOS: Record<string, string> = {
  identificado: 'Identificado',
  em_analise: 'Em análise',
  em_tratamento: 'Em tratamento',
  monitorado: 'Monitorado',
  encerrado: 'Encerrado',
  planejado: 'Planejado',
  em_andamento: 'Em andamento',
  em_execucao: 'Em execução',
  concluido: 'Concluído',
  concluida: 'Concluída',
  cancelado: 'Cancelado',
  suspenso: 'Suspenso',
  atrasado: 'Atrasado',
  efetivo: 'Efetivo',
  parcialmente_efetivo: 'Parcialmente efetivo',
  inefetivo: 'Inefetivo',
  nao_efetivo: 'Não efetivo',
  pendente: 'Pendente',
  em_investigacao: 'Em investigação',
  arquivada: 'Arquivada',
};

/** Código do banco → rótulo legível (conhecido ou "primeira maiúscula, _ vira espaço"). */
export function rotular(codigo: string | null | undefined): string {
  const c = (codigo ?? '').trim();
  if (!c) return 'Não informado';
  if (ROTULOS[c]) return ROTULOS[c];
  const t = c.replace(/_/g, ' ');
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function areaDoModulo(modulo: string | null): string {
  if (!modulo?.trim()) return 'Sem módulo informado';
  return MODULES_CONFIG.find((m) => m.codigo === modulo.trim())?.nome ?? rotular(modulo);
}

/** Agrupa e conta, em ordem decrescente de quantidade (empate: ordem alfabética). */
function contar<T>(linhas: T[], chave: (l: T) => string): { rotulo: string; quantidade: number }[] {
  const mapa = new Map<string, number>();
  for (const l of linhas) mapa.set(chave(l), (mapa.get(chave(l)) ?? 0) + 1);
  return [...mapa.entries()]
    .map(([rotulo, quantidade]) => ({ rotulo, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade || a.rotulo.localeCompare(b.rotulo, 'pt-BR'));
}

const dataBR = (iso: string) => {
  const [a, m, d] = iso.slice(0, 10).split('-');
  return d && m && a ? `${d}/${m}/${a}` : iso;
};

/** Limites do exercício em ISO (para filtrar no banco). */
export function limitesDoExercicio(ano: number) {
  return { inicio: `${ano}-01-01`, fim: `${ano}-12-31`, proximoInicio: `${ano + 1}-01-01` };
}

/** Plano vigente no exercício: começa até 31/12 e termina a partir de 01/01 (prazo em branco não exclui). */
export function planoNoExercicio(p: { prazo_inicio: string | null; prazo_conclusao: string | null }, ano: number): boolean {
  const { inicio, fim } = limitesDoExercicio(ano);
  return (!p.prazo_inicio || p.prazo_inicio.slice(0, 10) <= fim) && (!p.prazo_conclusao || p.prazo_conclusao.slice(0, 10) >= inicio);
}

function conformidade(l: LinhasRelatorioGovernanca): ConformidadeChecklist[] {
  const ultima = new Map<string, { status: string; updated_at?: string | null }>();
  for (const r of l.respostasChecklist) {
    const atual = ultima.get(r.item_id);
    if (!atual || (r.updated_at ?? '') >= (atual.updated_at ?? '')) ultima.set(r.item_id, r);
  }
  return l.checklists
    .map((c) => {
      const itens = l.itensChecklist.filter((i) => i.checklist_id === c.id);
      const st = itens.map((i) => ultima.get(i.id)?.status ?? 'pendente');
      const n = (s: string) => st.filter((x) => x === s).length;
      return {
        nome: c.nome,
        orgao: c.orgao_fiscalizador,
        itens: itens.length,
        conformes: n('conforme'),
        parciais: n('parcialmente_conforme'),
        naoConformes: n('nao_conforme'),
        naoAplicaveis: n('nao_aplicavel'),
        pendentes: n('pendente'),
      };
    })
    .filter((c) => c.itens > 0);
}

export function montarRelatorioGovernanca(ano: number, l: LinhasRelatorioGovernanca): DadosRelatorioGovernanca {
  const riscosPorNivel = l.riscos.length === 0
    ? []
    : NIVEIS.map(([codigo, nivel]) => ({
        nivel,
        inerente: l.riscos.filter((r) => r.nivel_risco_inerente === codigo).length,
        residual: l.riscos.filter((r) => r.nivel_risco_residual === codigo).length,
      })).filter((r) => r.inerente > 0 || r.residual > 0);

  return {
    exercicio: String(ano),
    conformidade: conformidade(l),
    processosPorArea: contar(l.processos, (p) => areaDoModulo(p.modulo_sistema)).map(({ rotulo, quantidade }) => ({ area: rotulo, quantidade })),
    riscosPorNivel,
    riscosPorSituacao: contar(l.riscos, (r) => rotular(r.status)).map(({ rotulo, quantidade }) => ({ situacao: rotulo, quantidade })),
    acoes: l.planos
      .filter((p) => planoNoExercicio(p, ano))
      .map((p) => ({
        titulo: p.titulo,
        situacao: rotular(p.status),
        percentual: typeof p.percentual_execucao === 'number' ? p.percentual_execucao : null,
        prazo: p.prazo_conclusao ? dataBR(p.prazo_conclusao) : null,
      })),
    avaliacoesControle: contar(l.avaliacoesControle, (a) => rotular(a.efetividade)).map(({ rotulo, quantidade }) => ({ efetividade: rotulo, quantidade })),
    denuncias: l.denuncias === null ? null : contar(l.denuncias, (x) => rotular(x.status)).map(({ rotulo, quantidade }) => ({ situacao: rotulo, quantidade })),
  };
}
