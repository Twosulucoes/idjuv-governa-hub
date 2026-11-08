import { describe, expect, it } from 'vitest';
import { exercicioPadrao } from './useExercicioFinanceiro';

describe('exercicioPadrao', () => {
  it('usa o ano guardado quando é o atual ou anterior', () => {
    expect(exercicioPadrao('2025', 2026)).toBe(2025);
    expect(exercicioPadrao('2026', 2026)).toBe(2026);
  });

  it('ignora o ano seguinte guardado no navegador (item 14 do teste do RH)', () => {
    expect(exercicioPadrao('2027', 2026)).toBe(2026);
  });

  it('cai no ano atual sem valor guardado ou com valor inválido', () => {
    expect(exercicioPadrao(null, 2026)).toBe(2026);
    expect(exercicioPadrao('abc', 2026)).toBe(2026);
    expect(exercicioPadrao('2019', 2026)).toBe(2026);
  });
});
