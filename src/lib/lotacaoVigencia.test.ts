import { describe, expect, it } from 'vitest';
import { lotacaoVigenteEm, separarLotacoes } from './lotacaoVigencia';

// transferência registrada em 07/11 com efeito em 09/11 (item 19 do teste do RH)
const antiga = { id: 'pres', data_inicio: '2026-11-06', data_fim: '2026-11-08', ativo: false };
const nova = { id: 'diesp', data_inicio: '2026-11-09', data_fim: null, ativo: true };

describe('separarLotacoes', () => {
  it('antes do efeito, vale a antiga e a nova fica agendada', () => {
    const r = separarLotacoes([antiga, nova], '2026-11-07');
    expect(r.vigente?.id).toBe('pres');
    expect(r.agendada?.id).toBe('diesp');
  });

  it('no dia do efeito, vale a nova e nada fica agendado', () => {
    const r = separarLotacoes([antiga, nova], '2026-11-09');
    expect(r.vigente?.id).toBe('diesp');
    expect(r.agendada).toBeNull();
  });

  it('lotação aberta e cancelada (ativo falso, sem fim) não vale', () => {
    expect(lotacaoVigenteEm({ data_inicio: '2026-01-01', data_fim: null, ativo: false }, '2026-11-07')).toBe(false);
  });

  it('lotação externa não conta', () => {
    expect(
      lotacaoVigenteEm({ data_inicio: '2026-01-01', data_fim: null, ativo: true, tipo_lotacao: 'lotacao_externa' }, '2026-11-07'),
    ).toBe(false);
  });
});
