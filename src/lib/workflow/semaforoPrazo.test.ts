import { describe, expect, it } from 'vitest';
import { rotuloSituacaoPrazo } from './semaforoPrazo';

describe('rotuloSituacaoPrazo', () => {
  it.each([
    ['em_dia', 'Em dia', 'sucesso'],
    ['vence_logo', 'Vence em breve', 'alerta'],
    ['vencido', 'Vencido', 'perigo'],
    ['sem_prazo', 'Sem prazo', 'neutro'],
  ] as const)('%s -> %s (%s)', (situacao, texto, tom) => {
    expect(rotuloSituacaoPrazo(situacao)).toEqual({ texto, tom });
  });
});
