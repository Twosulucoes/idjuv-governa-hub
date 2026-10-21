import { describe, expect, it } from 'vitest';
import { resumirQuadroCargos, vagasPorTipo, type VagaParaResumo } from './quadroCargos';

const vaga = (p: Partial<VagaParaResumo>): VagaParaResumo => ({
  vencimento: null,
  diretoria: null,
  diretoria_tipo: null,
  ocupante: null,
  lei_criacao_numero: null,
  lei_criacao_data: null,
  ...p,
});

describe('resumirQuadroCargos', () => {
  it('quadro vazio dá zeros sem dividir por zero', () => {
    const r = resumirQuadroCargos([]);
    expect(r).toMatchObject({ total: 0, ocupados: 0, vagos: 0, percentualOcupacao: 0, valorMensal: 0 });
    expect(r.porDiretoria).toEqual([]);
    expect(r.leis).toEqual([]);
  });

  it('soma vagas, ocupação, custo e agrupa por diretoria', () => {
    const r = resumirQuadroCargos([
      vaga({ vencimento: 1000.1, diretoria: 'PRES', diretoria_tipo: 'presidencia', ocupante: 'Fulano' }),
      vaga({ vencimento: 500, diretoria: 'DIRA', diretoria_tipo: 'diretoria' }),
      vaga({ vencimento: 500, diretoria: 'DIRB', diretoria_tipo: 'diretoria', ocupante: 'Beltrano' }),
      vaga({ vencimento: null }),
    ]);
    expect(r.total).toBe(4);
    expect(r.ocupados).toBe(2);
    expect(r.vagos).toBe(2);
    expect(r.percentualOcupacao).toBe(50);
    expect(r.valorMensal).toBe(2000.1);
    expect(r.porDiretoria.map((d) => d.diretoria)).toEqual(['DIRA', 'DIRB', 'PRES', null]);
    expect(vagasPorTipo(r, 'presidencia')).toBe(1);
    expect(vagasPorTipo(r, 'diretoria')).toBe(2);
  });

  it('lista cada lei de criação uma vez', () => {
    const r = resumirQuadroCargos([
      vaga({ lei_criacao_numero: '10', lei_criacao_data: '2025-12-29' }),
      vaga({ lei_criacao_numero: '10', lei_criacao_data: '2025-12-29' }),
      vaga({ lei_criacao_numero: '11' }),
    ]);
    expect(r.leis).toEqual(['Lei nº 10, de 29/12/2025', 'Lei nº 11']);
  });
});
