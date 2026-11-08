import { describe, expect, it } from 'vitest';
import { filtroDiasNaoUteis, limitesDoMes, projetarDiasNaoUteis } from './diasNaoUteis';

const finados = { data: '2026-11-02', nome: 'Finados', recorrente: true, mes_recorrente: 11, dia_recorrente: 2 };
const consciencia = { data: '2026-11-20', nome: 'Consciência Negra', recorrente: true, mes_recorrente: 11, dia_recorrente: 20 };
const sextaSanta2026 = { data: '2026-04-03', nome: 'Sexta-feira Santa', recorrente: false };

describe('projetarDiasNaoUteis', () => {
  it('leva o feriado recorrente para o ano pedido (item 17 do teste do RH)', () => {
    const { inicio, fim } = limitesDoMes(2027, 11);
    const dias = projetarDiasNaoUteis([finados, consciencia], inicio, fim);
    expect(dias.map((d) => d.data)).toEqual(['2027-11-02', '2027-11-20']);
    expect(dias[0].nome).toBe('Finados');
  });

  it('mantém o de data única só no período dele', () => {
    expect(projetarDiasNaoUteis([sextaSanta2026], '2027-04-01', '2027-04-30')).toEqual([]);
    expect(projetarDiasNaoUteis([sextaSanta2026], '2026-04-01', '2026-04-30')).toEqual([sextaSanta2026]);
  });

  it('não duplica o dia que tem cadastro recorrente e de data única', () => {
    const extra = { data: '2026-11-20', nome: 'Ponto facultativo', recorrente: false };
    const dias = projetarDiasNaoUteis([consciencia, extra], '2026-11-01', '2026-11-30');
    expect(dias).toEqual([extra]);
  });

  it('29/02 recorrente vira 28/02 em ano não bissexto', () => {
    const d = { data: '2028-02-29', recorrente: true, mes_recorrente: 2, dia_recorrente: 29 };
    expect(projetarDiasNaoUteis([d], '2027-02-01', '2027-02-28')[0].data).toBe('2027-02-28');
  });

  it('cobre períodos que atravessam o ano', () => {
    const natal = { data: '2026-12-25', recorrente: true, mes_recorrente: 12, dia_recorrente: 25 };
    const confra = { data: '2026-01-01', recorrente: true, mes_recorrente: 1, dia_recorrente: 1 };
    expect(projetarDiasNaoUteis([natal, confra], '2026-12-20', '2027-01-05').map((d) => d.data)).toEqual([
      '2026-12-25',
      '2027-01-01',
    ]);
  });
});

describe('limitesDoMes e filtro', () => {
  it('monta o mês sem depender do fuso', () => {
    expect(limitesDoMes(2026, 2)).toEqual({ inicio: '2026-02-01', fim: '2026-02-28' });
    expect(limitesDoMes(2028, 2).fim).toBe('2028-02-29');
  });
  it('pede os recorrentes junto', () => {
    expect(filtroDiasNaoUteis('2026-11-01', '2026-11-30')).toBe(
      'recorrente.eq.true,and(data.gte.2026-11-01,data.lte.2026-11-30)',
    );
  });
});
