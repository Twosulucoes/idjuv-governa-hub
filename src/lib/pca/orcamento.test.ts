import { describe, expect, it } from 'vitest';
import { calcularOrcamento, totaisOrcamento, type ItemOrcamento, type TetoOrcamento } from './orcamento';

const teto = (acao: string, fonte: string, valor: number): TetoOrcamento => ({
  acao_id: acao, fonte_recurso_id: fonte, valor_previsto: valor,
});
const item = (acao: string, fonte: string, valor: number, situacao = 'ativo'): ItemOrcamento => ({
  acao_id: acao, fonte_recurso_id: fonte, valor_total: valor, situacao,
});

describe('calcularOrcamento', () => {
  it('soma o planejado da ação × fonte e mostra a sobra', () => {
    const [l] = calcularOrcamento([teto('a1', 'f1', 100000)], [item('a1', 'f1', 30000), item('a1', 'f1', 20000)]);
    expect(l).toEqual({ acaoId: 'a1', fonteRecursoId: 'f1', teto: 100000, planejado: 50000, diferenca: 50000, estourado: false });
  });

  it('item excluído não soma', () => {
    const [l] = calcularOrcamento([teto('a1', 'f1', 100)], [item('a1', 'f1', 40), item('a1', 'f1', 1000, 'excluido')]);
    expect(l.planejado).toBe(40);
  });

  it('ação × fonte sem teto aparece com teto 0 e estourada', () => {
    const linhas = calcularOrcamento([], [item('a2', 'f9', 5000)]);
    expect(linhas).toEqual([{ acaoId: 'a2', fonteRecursoId: 'f9', teto: 0, planejado: 5000, diferenca: -5000, estourado: true }]);
  });

  it('teto sem item aparece com planejado 0', () => {
    const [l] = calcularOrcamento([teto('a1', 'f1', 10)], []);
    expect(l).toMatchObject({ planejado: 0, diferenca: 10, estourado: false });
  });

  it('estouradas primeiro, a maior falta antes', () => {
    const linhas = calcularOrcamento(
      [teto('a1', 'f1', 100), teto('a2', 'f1', 100), teto('a3', 'f1', 100)],
      [item('a1', 'f1', 50), item('a2', 'f1', 150), item('a3', 'f1', 400)],
    );
    expect(linhas.map((l) => l.acaoId)).toEqual(['a3', 'a2', 'a1']);
  });

  it('soma em centavos, sem erro de ponto flutuante', () => {
    const [l] = calcularOrcamento([teto('a1', 'f1', 0.3)], [item('a1', 'f1', 0.1), item('a1', 'f1', 0.2)]);
    expect(l.planejado).toBe(0.3);
    expect(l.diferenca).toBe(0);
    expect(l.estourado).toBe(false);
  });

  it('valores que chegam como texto do banco (numeric) também somam', () => {
    const [l] = calcularOrcamento(
      [{ acao_id: 'a1', fonte_recurso_id: 'f1', valor_previsto: '10.50' as unknown as number }],
      [{ acao_id: 'a1', fonte_recurso_id: 'f1', valor_total: '0.25' as unknown as number, situacao: 'ativo' }],
    );
    expect(l.diferenca).toBe(10.25);
  });
});

describe('totaisOrcamento', () => {
  it('soma as linhas', () => {
    const linhas = calcularOrcamento([teto('a1', 'f1', 100), teto('a2', 'f1', 50)], [item('a1', 'f1', 30), item('a2', 'f1', 80)]);
    expect(totaisOrcamento(linhas)).toEqual({ teto: 150, planejado: 110, diferenca: 40 });
  });
});
