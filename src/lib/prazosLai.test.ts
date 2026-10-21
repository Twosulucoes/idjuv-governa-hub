import { describe, expect, it } from 'vitest';
import { prazosLaiParaExibicao } from './prazosLai';

describe('prazosLaiParaExibicao', () => {
  it('sem parametrização usa o padrão da Lei nº 12.527/2011', () => {
    expect(prazosLaiParaExibicao([])).toEqual({
      resposta: '20 dias úteis (prorrogável por +10)',
      recursoPrimeira: '10 dias úteis após resposta',
      recursoSegunda: '10 dias úteis após 1ª instância',
    });
    expect(prazosLaiParaExibicao(undefined).resposta).toBe('20 dias úteis (prorrogável por +10)');
  });

  it('usa o prazo cadastrado em prazos_lai quando existe', () => {
    const r = prazosLaiParaExibicao([
      { tipo_prazo: 'resposta_inicial', prazo_dias: 15, prorrogavel: false, prorrogacao_dias: 0, dias_uteis: false },
      { tipo_prazo: 'recurso_primeira_instancia', prazo_dias: 5, prorrogavel: false, prorrogacao_dias: 0, dias_uteis: true },
    ]);
    expect(r.resposta).toBe('15 dias');
    expect(r.recursoPrimeira).toBe('5 dias úteis após resposta');
    // linha ausente cai no padrão legal
    expect(r.recursoSegunda).toBe('10 dias úteis após 1ª instância');
  });
});
