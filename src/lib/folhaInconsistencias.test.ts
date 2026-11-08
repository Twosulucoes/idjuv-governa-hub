import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { INCONSISTENCIAS_BLOQUEANTES, codigosDaFicha, ehBloqueante, rotuloInconsistencia } from './folhaInconsistencias';

describe('folhaInconsistencias', () => {
  it('a lista de bloqueantes é a mesma do banco (folha_inconsistencias_bloqueantes)', () => {
    const sql = readFileSync('supabase/migrations/20261121090000_rh_testes_folha_contracheque.sql', 'utf8');
    const corpo = sql.match(/folha_inconsistencias_bloqueantes\(\) RETURNS text\[\][\s\S]*?ARRAY\[([\s\S]*?)\]/)![1];
    const doBanco = [...corpo.matchAll(/'([a-z_0-9]+)'/g)].map((m) => m[1]);
    expect(doBanco).toEqual([...INCONSISTENCIAS_BLOQUEANTES]);
  });

  it('rótulo conhecido, código desconhecido legível, jsonb fora do formato vira vazio', () => {
    expect(rotuloInconsistencia('sem_dados_bancarios')).toBe('Sem banco e conta no cadastro');
    expect(rotuloInconsistencia('codigo_novo')).toBe('codigo novo');
    expect(codigosDaFicha(['a', 1, 'b'])).toEqual(['a', 'b']);
    expect(codigosDaFicha({ a: 1 })).toEqual([]);
    expect(ehBloqueante('tabela_inss_ausente')).toBe(true);
    expect(ehBloqueante('sem_dados_bancarios')).toBe(false);
  });
});
