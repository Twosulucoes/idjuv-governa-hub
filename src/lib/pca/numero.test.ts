import { describe, expect, it } from 'vitest';
import { lerNumeroBr } from './numero';

describe('lerNumeroBr', () => {
  it('aceita vírgula decimal e ponto de milhar', () => {
    expect(lerNumeroBr('1.234,56')).toBe(1234.56);
    expect(lerNumeroBr('10,5')).toBe(10.5);
  });
  it('aceita ponto decimal quando não há vírgula', () => {
    expect(lerNumeroBr('10.50')).toBe(10.5);
    expect(lerNumeroBr(' 3 ')).toBe(3);
  });
  it('vazio ou texto vira NaN', () => {
    expect(lerNumeroBr('')).toBeNaN();
    expect(lerNumeroBr('abc')).toBeNaN();
  });
});
