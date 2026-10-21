import { describe, expect, it } from 'vitest';
import type { TenantConfig } from '@/core/tenant';
import { comIdentidadeDoCliente, identidadeDoCliente } from './identidadeConfigAutarquia';

// Dados fictícios
const tenant = {
  identidade: { nomeOficial: 'Instituto Exemplo', nomeCurto: 'IEx', sigla: 'IEX' },
  legal: { cnpj: '00.000.000/0001-91', dirigenteNome: 'Fulana de Tal', dirigenteCargo: 'Presidente' },
  endereco: { logradouro: 'Rua A', numero: '10', bairro: 'Centro', cidade: 'Cidade', uf: 'RR', cep: '69300-000' },
  contato: { email: 'contato@exemplo.gov.br', telefone: '(95) 0000-0000', site: 'https://exemplo.gov.br' },
} as unknown as TenantConfig;

const daFolha = {
  id: 'cfg-1',
  razao_social: 'Nome antigo',
  cnpj: '11.111.111/0001-11',
  endereco_logradouro: 'Rua Velha',
  endereco_numero: '1',
  endereco_cidade: 'Outra',
  telefone: '(95) 9999-9999',
  codigo_municipio: '1400100',
  cpf_responsavel: '000.000.000-00',
  esocial_ambiente: '2 - Produção Restrita (Homologação)',
};

describe('dados da instituição num lugar só', () => {
  it('a Configuração do cliente vale por cima do que está na Folha', () => {
    const r = comIdentidadeDoCliente(daFolha, tenant);
    expect(r?.razao_social).toBe('Instituto Exemplo');
    expect(r?.cnpj).toBe('00.000.000/0001-91');
    expect(r?.telefone).toBe('(95) 0000-0000');
    expect(r?.responsavel_legal).toBe('Fulana de Tal');
    expect(r?.endereco_logradouro).toBe('Rua A');
    expect(r?.endereco_cidade).toBe('Cidade');
  });

  it('o que é da folha e do eSocial continua vindo da Folha', () => {
    const r = comIdentidadeDoCliente(daFolha, tenant);
    expect(r?.id).toBe('cfg-1');
    expect(r?.codigo_municipio).toBe('1400100');
    expect(r?.cpf_responsavel).toBe('000.000.000-00');
    expect(r?.esocial_ambiente).toBe('2 - Produção Restrita (Homologação)');
  });

  it('campo vazio no cliente cai no da Folha', () => {
    const semCnpj = { ...tenant, legal: { cnpj: '  ' }, contato: {} } as unknown as TenantConfig;
    const r = identidadeDoCliente(semCnpj, daFolha);
    expect(r.cnpj).toBe('11.111.111/0001-11');
    expect(r.telefone).toBe('(95) 9999-9999');
  });

  it('endereço vem inteiro de um lado só', () => {
    const semEndereco = { ...tenant, endereco: { cidade: 'Só a cidade' } } as unknown as TenantConfig;
    const r = identidadeDoCliente(semEndereco, daFolha);
    expect(r.endereco_logradouro).toBe('Rua Velha');
    expect(r.endereco_cidade).toBe('Outra');
    expect(r.endereco_bairro).toBeNull();
  });

  it('sem linha na Folha continua sem linha', () => {
    expect(comIdentidadeDoCliente(null, tenant)).toBeNull();
  });
});
