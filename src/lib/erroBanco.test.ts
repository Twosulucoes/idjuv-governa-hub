import { describe, expect, it } from 'vitest';
import { mensagemDeErro, vazioParaNulo } from './erroBanco';

describe('mensagemDeErro (teste do RH de 06/11/2026, item 24)', () => {
  it('designação com lotação inexistente (23503) diz qual campo', () => {
    expect(mensagemDeErro({
      code: '23503',
      message: 'insert or update on table "designacoes" violates foreign key constraint "designacoes_lotacao_id_fkey"',
      details: 'Key (lotacao_id)=(x) is not present in table "lotacoes".',
    })).toContain('lotação');
  });

  it('data vazia (22007) e regra do banco (P0001) com o texto do banco', () => {
    expect(mensagemDeErro({ code: '22007', message: 'invalid input syntax for type date: ""' })).toMatch(/data vazia/);
    expect(mensagemDeErro({ code: 'P0001', message: 'Data anterior ao início da lotação.' })).toBe('Data anterior ao início da lotação.');
  });

  it('RLS, Error comum, texto e nada', () => {
    expect(mensagemDeErro({ code: '42501', message: 'new row violates row-level security policy' })).toMatch(/permissão/);
    expect(mensagemDeErro(new Error('falhou'))).toBe('falhou');
    expect(mensagemDeErro('texto')).toBe('texto');
    expect(mensagemDeErro(null)).toBe('Erro desconhecido.');
    expect(mensagemDeErro({ message: 'Failed to fetch' })).toMatch(/conexão/);
  });

  it('vazioParaNulo troca "" por null só nas chaves pedidas', () => {
    expect(vazioParaNulo({ a: '', b: '', c: 'x' }, ['a', 'c'])).toEqual({ a: null, b: '', c: 'x' });
  });
});
