import { describe, expect, it } from 'vitest';
import type { TenantConfig } from '@/core/tenant';
import { assinaturaDirigente, dataExtenso, formatarCPF, localDoAto, parseData, preambulo, tituloPortaria } from '../modelos/portaria/textos';

const tenant = {
  identidade: {
    nomeOficial: 'Instituto de Teste do Estado de Exemplo – ITE',
    nomeCurto: 'ITE',
    tratamentoDirigente: 'O PRESIDENTE DO INSTITUTO DE TESTE DO ESTADO DE EXEMPLO – ITE',
  },
  legal: { leiCriacao: 'Lei nº 1, de 1º de janeiro de 2000', dirigenteNome: 'Fulano de Tal', dirigenteCargo: 'Presidente', numeracaoAtos: 'ITE/PRESI/GAB' },
  endereco: { cidade: 'Cidade Exemplo', uf: 'EX' },
} as unknown as TenantConfig;
const semNada = { identidade: { nomeOficial: 'X', nomeCurto: 'X', tratamentoDirigente: 'O PRESIDENTE DO X' } } as unknown as TenantConfig;

describe('textos da portaria', () => {
  it('título no padrão oficial, com a numeração do tenant', () => {
    expect(tituloPortaria(tenant, '12/2026', '2026-10-05')).toBe('PORTARIA Nº 12/ITE/PRESI/GAB/2026 DE 05 DE OUTUBRO DE 2026');
  });
  it('número sem barra também funciona', () => {
    expect(tituloPortaria(tenant, '12', '2026-10-05')).toBe('PORTARIA Nº 12/ITE/PRESI/GAB/2026 DE 05 DE OUTUBRO DE 2026');
  });
  it('tenant sem numeração: título sem o trecho, nunca "undefined"', () => {
    const t = tituloPortaria(semNada, '12/2026', '2026-10-05');
    expect(t).toBe('PORTARIA Nº 12/2026 DE 05 DE OUTUBRO DE 2026');
    expect(t).not.toMatch(/undefined|null/);
  });
  it('preâmbulo usa o tratamento do dirigente e a lei do tenant', () => {
    expect(preambulo(tenant)).toBe('O PRESIDENTE DO INSTITUTO DE TESTE DO ESTADO DE EXEMPLO – ITE, no uso das atribuições legais que lhe são conferidas pela Lei nº 1, de 1º de janeiro de 2000, e demais normas aplicáveis,');
  });
  it('preâmbulo sem lei no tenant não imprime "undefined"', () => {
    expect(preambulo(semNada)).toBe('O PRESIDENTE DO X, no uso das atribuições legais que lhe são conferidas e demais normas aplicáveis,');
  });
  it('assinatura do dirigente em caixa alta; sem dados, vazia sem "undefined"', () => {
    expect(assinaturaDirigente(tenant)).toEqual({ nome: 'FULANO DE TAL', cargo: 'Presidente do ITE' });
    expect(assinaturaDirigente(semNada)).toEqual({ nome: '', cargo: 'X' });
  });
  it('local do ato: "Cidade – UF" e vazio quando não há endereço', () => {
    expect(localDoAto(tenant)).toBe('Cidade Exemplo – EX');
    expect(localDoAto(semNada)).toBe('');
  });
  it('data por extenso e data inválida com erro claro', () => {
    expect(dataExtenso('2026-10-05')).toBe('5 de outubro de 2026');
    for (const ruim of ['', '2026-13-40', 'abc']) expect(() => parseData(ruim)).toThrow(/Data inválida/);
  });
  it('CPF com e sem máscara; entrada curta não é mutilada', () => {
    expect(formatarCPF('12345678901')).toBe('123.456.789-01');
    expect(formatarCPF('123.456.789-01')).toBe('123.456.789-01');
    expect(formatarCPF('123')).toBe('123');
  });
});
