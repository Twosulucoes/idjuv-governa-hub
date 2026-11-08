import { describe, expect, it } from 'vitest';
import { paraDataLocal } from './dataLocal';

describe('paraDataLocal', () => {
  it('data sem hora fica no mesmo dia, em qualquer fuso', () => {
    const d = paraDataLocal('2026-11-09');
    expect([d.getFullYear(), d.getMonth() + 1, d.getDate()]).toEqual([2026, 11, 9]);
  });
  it('timestamp segue como o Date normal', () => {
    expect(paraDataLocal('2026-11-09T12:00:00Z').toISOString()).toBe('2026-11-09T12:00:00.000Z');
  });
});
