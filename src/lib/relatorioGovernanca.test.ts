import { describe, expect, it, vi } from 'vitest';
import { relatorioSemCadastro } from '@/lib/documentos/modelos/governanca/relatorioAnual';
import { montarRelatorioGovernanca, planoNoExercicio, rotular, type LinhasRelatorioGovernanca } from './relatorioGovernanca';

// O nome das áreas vem de modules.config, que puxa o tenant (e o cliente do Supabase) na carga.
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));

const vazio: LinhasRelatorioGovernanca = {
  checklists: [], itensChecklist: [], respostasChecklist: [], processos: [], riscos: [], planos: [],
  avaliacoesControle: [], denuncias: null,
};

describe('montarRelatorioGovernanca', () => {
  it('sem linhas no banco: tudo vazio, sem número inventado, e o relatório fica "sem cadastro"', () => {
    const d = montarRelatorioGovernanca(2026, vazio);
    expect(d).toEqual({
      exercicio: '2026', conformidade: [], processosPorArea: [], riscosPorNivel: [], riscosPorSituacao: [], acoes: [],
      avaliacoesControle: [], denuncias: null,
    });
    expect(relatorioSemCadastro(d)).toBe(true);
    // Canal consultado e sem denúncias também não conta como cadastro.
    expect(relatorioSemCadastro(montarRelatorioGovernanca(2026, { ...vazio, denuncias: [] }))).toBe(true);
  });

  it('conformidade: última resposta por item vale, item sem resposta é pendente, checklist sem item sai', () => {
    const d = montarRelatorioGovernanca(2026, {
      ...vazio,
      checklists: [
        { id: 'c1', nome: 'Checklist A', orgao_fiscalizador: 'TCE' },
        { id: 'c2', nome: 'Checklist sem itens', orgao_fiscalizador: 'CGE' },
      ],
      itensChecklist: [
        { id: 'i1', checklist_id: 'c1' }, { id: 'i2', checklist_id: 'c1' }, { id: 'i3', checklist_id: 'c1' }, { id: 'i4', checklist_id: 'c1' },
      ],
      respostasChecklist: [
        { item_id: 'i1', status: 'nao_conforme', updated_at: '2026-01-01' },
        { item_id: 'i1', status: 'conforme', updated_at: '2026-05-01' },
        { item_id: 'i2', status: 'parcialmente_conforme' },
        { item_id: 'i3', status: 'nao_aplicavel' },
      ],
    });
    expect(d.conformidade).toEqual([
      { nome: 'Checklist A', orgao: 'TCE', itens: 4, conformes: 1, parciais: 1, naoConformes: 0, naoAplicaveis: 1, pendentes: 1 },
    ]);
  });

  it('riscos por nível (inerente e residual), situação, áreas pelo nome do módulo e denúncias por situação', () => {
    const d = montarRelatorioGovernanca(2026, {
      ...vazio,
      processos: [{ modulo_sistema: 'compras' }, { modulo_sistema: 'compras' }, { modulo_sistema: null }],
      riscos: [
        { nivel_risco_inerente: 'alto', nivel_risco_residual: 'medio', status: 'em_tratamento' },
        { nivel_risco_inerente: 'alto', nivel_risco_residual: null, status: 'identificado' },
      ],
      denuncias: [{ status: 'em_analise' }, { status: 'em_analise' }, { status: 'concluida' }],
      avaliacoesControle: [{ efetividade: 'efetivo' }],
    });
    expect(d.processosPorArea[0]).toEqual({ area: expect.any(String), quantidade: 2 });
    expect(d.processosPorArea[0].area).not.toBe('compras');
    expect(d.processosPorArea[1]).toEqual({ area: 'Sem módulo informado', quantidade: 1 });
    expect(d.riscosPorNivel).toEqual([
      { nivel: 'Alto', inerente: 2, residual: 0 },
      { nivel: 'Médio', inerente: 0, residual: 1 },
    ]);
    expect(d.riscosPorSituacao).toEqual([
      { situacao: 'Em tratamento', quantidade: 1 },
      { situacao: 'Identificado', quantidade: 1 },
    ]);
    expect(d.denuncias).toEqual([
      { situacao: 'Em análise', quantidade: 2 },
      { situacao: 'Concluída', quantidade: 1 },
    ]);
    expect(d.avaliacoesControle).toEqual([{ efetividade: 'Efetivo', quantidade: 1 }]);
  });

  it('ações: só as vigentes no exercício, prazo em dd/mm/aaaa e percentual ausente vira null', () => {
    const d = montarRelatorioGovernanca(2026, {
      ...vazio,
      planos: [
        { titulo: 'Vigente', status: 'em_andamento', percentual_execucao: 40, prazo_inicio: '2025-06-01', prazo_conclusao: '2026-03-31' },
        { titulo: 'Sem prazo', status: 'planejado', percentual_execucao: null, prazo_inicio: null, prazo_conclusao: null },
        { titulo: 'Terminou antes', status: 'concluido', percentual_execucao: 100, prazo_inicio: null, prazo_conclusao: '2025-12-31' },
        { titulo: 'Começa depois', status: 'planejado', percentual_execucao: 0, prazo_inicio: '2027-01-01', prazo_conclusao: null },
      ],
    });
    expect(d.acoes).toEqual([
      { titulo: 'Vigente', situacao: 'Em andamento', percentual: 40, prazo: '31/03/2026' },
      { titulo: 'Sem prazo', situacao: 'Planejado', percentual: null, prazo: null },
    ]);
    expect(planoNoExercicio({ prazo_inicio: '2026-12-31', prazo_conclusao: null }, 2026)).toBe(true);
  });

  it('rotular: código conhecido, desconhecido e vazio', () => {
    expect(rotular('parcialmente_efetivo')).toBe('Parcialmente efetivo');
    expect(rotular('algo_novo')).toBe('Algo novo');
    expect(rotular(null)).toBe('Não informado');
  });
});
