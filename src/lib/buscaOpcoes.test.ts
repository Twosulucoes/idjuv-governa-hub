import { describe, expect, it } from 'vitest';
import { filtrarOpcaoBusca } from './buscaOpcoes';

describe('filtrarOpcaoBusca (item 25 do teste do RH)', () => {
  const id = '3f2a9c1e-7e5d-4b7a-9e1f-5c6d7e8f9a0b';
  it('não aceita letras espalhadas nem o id', () => {
    expect(filtrarOpcaoBusca(id, 'TESTE', ['THAYNA SOUZA', 'mat. 1234'])).toBe(0);
    expect(filtrarOpcaoBusca(id, 'TESTE', ['LUCAS PEREIRA', null as unknown as string].filter(Boolean))).toBe(0);
  });
  it('aceita o nome, sem diferença de acento ou maiúscula', () => {
    expect(filtrarOpcaoBusca(id, 'teste', ['Servidor TESTE RH'])).toBe(1);
    expect(filtrarOpcaoBusca(id, 'joao', ['JOÃO DA SILVA'])).toBe(1);
  });
  it('todas as palavras precisam aparecer, em qualquer ordem', () => {
    expect(filtrarOpcaoBusca(id, 'silva joão', ['JOÃO DA SILVA'])).toBe(1);
    expect(filtrarOpcaoBusca(id, 'silva maria', ['JOÃO DA SILVA'])).toBe(0);
  });
  it('busca pela matrícula do detalhe', () => {
    expect(filtrarOpcaoBusca(id, '1234', ['JOÃO', 'mat. 1234'])).toBe(1);
  });
});
