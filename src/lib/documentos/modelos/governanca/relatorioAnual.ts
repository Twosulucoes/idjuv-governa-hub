import { carimbo, paragrafo, secao, tabela } from '../../blocos';
import type { Bloco, DocumentoModelo } from '../../tipos';

// Relatório anual de governança e integridade. Só imprime o que vem do cadastro (matriz de riscos, planos de
// tratamento, controles internos, checklists de conformidade, matriz RACI e canal de denúncias): número fixo no
// código, resumo executivo e metas saíram porque não há tabela de origem. Os dados são montados por
// `montarRelatorioGovernanca` (`src/lib/relatorioGovernanca.ts`), o mesmo que alimenta a tela.

/** Situação dos itens de um checklist de conformidade no exercício. */
export interface ConformidadeChecklist {
  nome: string;
  orgao: string;
  /** Itens ativos do checklist (todos, inclusive "não se aplica"). */
  itens: number;
  conformes: number;
  parciais: number;
  naoConformes: number;
  naoAplicaveis: number;
  /** Itens sem resposta ou com resposta "pendente". */
  pendentes: number;
}

export interface DadosRelatorioGovernanca {
  /** Ano do exercício (ex.: "2026"), escolhido na tela. */
  exercicio: string;
  conformidade: ConformidadeChecklist[];
  /** Processos ativos da matriz RACI por módulo. */
  processosPorArea: { area: string; quantidade: number }[];
  /** Riscos ativos por nível: inerente (todos) e residual (só os já reavaliados). */
  riscosPorNivel: { nivel: string; inerente: number; residual: number }[];
  riscosPorSituacao: { situacao: string; quantidade: number }[];
  /** Planos de tratamento de risco vigentes no exercício. */
  acoes: { titulo: string; situacao: string; percentual: number | null; prazo: string | null }[];
  /** Avaliações de controles internos feitas no exercício, por efetividade. */
  avaliacoesControle: { efetividade: string; quantidade: number }[];
  /** Denúncias recebidas no exercício por situação; `null` quando quem emite não pode consultar o canal. */
  denuncias: { situacao: string; quantidade: number }[] | null;
}

export const AVISO_SEM_CADASTRO = 'Dados ilustrativos — sem cadastro de governança';

const soma = (xs: { quantidade: number }[]) => xs.reduce((s, x) => s + x.quantidade, 0);

/** Itens aplicáveis (fora "não se aplica") e conformes, somando todos os checklists. */
export function totaisConformidade(d: Pick<DadosRelatorioGovernanca, 'conformidade'>) {
  const aplicaveis = d.conformidade.reduce((s, c) => s + c.itens - c.naoAplicaveis, 0);
  const conformes = d.conformidade.reduce((s, c) => s + c.conformes, 0);
  return { aplicaveis, conformes, percentual: aplicaveis > 0 ? Math.round((conformes / aplicaveis) * 100) : null };
}

/** Verdadeiro quando nenhuma seção tem registro: o relatório sai com o aviso e sem números. */
export function relatorioSemCadastro(d: DadosRelatorioGovernanca): boolean {
  return (
    d.conformidade.length === 0 &&
    d.processosPorArea.length === 0 &&
    d.riscosPorNivel.length === 0 &&
    d.acoes.length === 0 &&
    d.avaliacoesControle.length === 0 &&
    (d.denuncias === null || d.denuncias.length === 0)
  );
}

/** Indicadores do topo: só os que têm registro. Valor já formatado. Usado no PDF e na tela. */
export function indicadoresGovernanca(d: DadosRelatorioGovernanca): { titulo: string; valor: string; base: string }[] {
  const out: { titulo: string; valor: string; base: string }[] = [];
  const conf = totaisConformidade(d);
  if (conf.percentual !== null) {
    out.push({ titulo: 'Conformidade', valor: `${conf.percentual}%`, base: `${conf.conformes} de ${conf.aplicaveis} itens aplicáveis conformes` });
  }
  if (d.processosPorArea.length > 0) {
    out.push({ titulo: 'Processos mapeados', valor: String(soma(d.processosPorArea)), base: 'Matriz RACI (processos ativos)' });
  }
  if (d.riscosPorNivel.length > 0) {
    const total = d.riscosPorNivel.reduce((s, r) => s + r.inerente, 0);
    out.push({ titulo: 'Riscos identificados', valor: String(total), base: 'Matriz de riscos (riscos ativos)' });
  }
  if (d.acoes.length > 0) {
    const concluidas = d.acoes.filter((a) => a.percentual === 100 || /^conclu/i.test(a.situacao)).length;
    out.push({ titulo: 'Ações de tratamento', valor: String(d.acoes.length), base: `${concluidas} concluída(s)` });
  }
  if (d.avaliacoesControle.length > 0) {
    out.push({ titulo: 'Avaliações de controles', valor: String(soma(d.avaliacoesControle)), base: 'Controles internos avaliados no exercício' });
  }
  if (d.denuncias && d.denuncias.length > 0) {
    out.push({ titulo: 'Denúncias recebidas', valor: String(soma(d.denuncias)), base: 'Canal de denúncias' });
  }
  return out;
}

const SEM_DADOS = 'Sem dados cadastrados no exercício.';
const vazio = (): Bloco => paragrafo({ texto: SEM_DADOS });

export const relatorioGovernanca: DocumentoModelo<DadosRelatorioGovernanca> = {
  tipo: 'governanca-relatorio-anual',
  familia: 'relatorio',
  titulo: () => 'Relatório anual de governança e integridade',
  subtitulo: (d) => `Exercício ${d.exercicio}`,
  nomeArquivo: (d) => `Relatorio_Governanca_Integridade_${d.exercicio}.pdf`,
  blocos: (d) => {
    if (relatorioSemCadastro(d)) {
      return [
        carimbo({
          linhas: [
            AVISO_SEM_CADASTRO,
            `Não há riscos, controles, checklists de conformidade, processos mapeados nem ações de tratamento cadastrados para o exercício ${d.exercicio}. Este relatório não traz números.`,
          ],
        }),
      ];
    }
    const indicadores = indicadoresGovernanca(d);
    const blocos: Bloco[] = [
      secao({ texto: 'Indicadores principais' }),
      tabela({
        colunas: [
          { chave: 'titulo', titulo: 'Indicador', peso: 2 },
          { chave: 'valor', titulo: 'Resultado', alinhamento: 'direita' },
          { chave: 'base', titulo: 'Base', peso: 3 },
        ],
        linhas: indicadores.map((i) => ({ ...i })),
      }),

      secao({ texto: 'Conformidade por checklist' }),
      d.conformidade.length === 0
        ? vazio()
        : tabela({
            colunas: [
              { chave: 'nome', titulo: 'Checklist', peso: 3 },
              { chave: 'orgao', titulo: 'Órgão', peso: 1.4 },
              { chave: 'conformes', titulo: 'Conf.', alinhamento: 'direita' },
              { chave: 'parciais', titulo: 'Parc.', alinhamento: 'direita' },
              { chave: 'naoConformes', titulo: 'Não conf.', alinhamento: 'direita' },
              { chave: 'pendentes', titulo: 'Pend.', alinhamento: 'direita' },
              { chave: 'pct', titulo: '%', alinhamento: 'direita' },
            ],
            linhas: d.conformidade.map((c) => {
              const aplicaveis = c.itens - c.naoAplicaveis;
              return { ...c, pct: aplicaveis > 0 ? `${Math.round((c.conformes / aplicaveis) * 100)}%` : '—' };
            }),
          }),

      secao({ texto: 'Processos mapeados por área' }),
      d.processosPorArea.length === 0
        ? vazio()
        : tabela({
            colunas: [
              { chave: 'area', titulo: 'Área', peso: 3 },
              { chave: 'quantidade', titulo: 'Processos', alinhamento: 'direita' },
            ],
            linhas: d.processosPorArea.map((p) => ({ ...p })),
          }),

      secao({ texto: 'Matriz de riscos' }),
      ...(d.riscosPorNivel.length === 0
        ? [vazio()]
        : [
            tabela({
              colunas: [
                { chave: 'nivel', titulo: 'Nível de risco', peso: 3 },
                { chave: 'inerente', titulo: 'Inerente', alinhamento: 'direita' },
                { chave: 'residual', titulo: 'Residual', alinhamento: 'direita' },
              ],
              linhas: d.riscosPorNivel.map((r) => ({ ...r })),
            }),
            tabela({
              colunas: [
                { chave: 'situacao', titulo: 'Situação do risco', peso: 3 },
                { chave: 'quantidade', titulo: 'Riscos', alinhamento: 'direita' },
              ],
              linhas: d.riscosPorSituacao.map((r) => ({ ...r })),
            }),
          ]),

      secao({ texto: 'Plano de tratamento de riscos' }),
      d.acoes.length === 0
        ? vazio()
        : tabela({
            colunas: [
              { chave: 'titulo', titulo: 'Ação', peso: 3 },
              { chave: 'situacao', titulo: 'Situação', peso: 1.3 },
              { chave: 'pct', titulo: 'Execução', alinhamento: 'direita' },
              { chave: 'prazo', titulo: 'Prazo', alinhamento: 'direita' },
            ],
            linhas: d.acoes.map((a) => ({
              titulo: a.titulo,
              situacao: a.situacao,
              pct: a.percentual === null ? '—' : `${a.percentual}%`,
              prazo: a.prazo ?? '—',
            })),
          }),

      secao({ texto: 'Avaliação de controles internos' }),
      d.avaliacoesControle.length === 0
        ? vazio()
        : tabela({
            colunas: [
              { chave: 'efetividade', titulo: 'Efetividade', peso: 3 },
              { chave: 'quantidade', titulo: 'Avaliações', alinhamento: 'direita' },
            ],
            linhas: d.avaliacoesControle.map((a) => ({ ...a })),
          }),
    ];
    if (d.denuncias !== null) {
      blocos.push(
        secao({ texto: 'Canal de denúncias' }),
        d.denuncias.length === 0
          ? vazio()
          : tabela({
              colunas: [
                { chave: 'situacao', titulo: 'Situação', peso: 3 },
                { chave: 'quantidade', titulo: 'Denúncias', alinhamento: 'direita' },
              ],
              linhas: d.denuncias.map((x) => ({ ...x })),
            }),
      );
    }
    blocos.push(
      paragrafo({
        texto:
          'Fonte: cadastros do sistema (matriz de riscos, planos de tratamento, controles internos, checklists de conformidade, matriz RACI e canal de denúncias). Riscos e processos mostram a situação atual dos registros existentes até o fim do exercício.',
      }),
    );
    return blocos;
  },
};
