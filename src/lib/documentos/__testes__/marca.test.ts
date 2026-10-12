import { describe, expect, it } from 'vitest';
import type { TenantConfig } from '@/core/tenant';
import { marcaDoTenant } from '../marca';
import { PNG_1X1 } from './fixtures';

const tenant = {
  identidade: { nomeOficial: 'Instituto de Exemplo', nomeParaDocumentos: undefined },
  entidadeSuperior: { nome: 'Governo de Exemplo', exibirEmDocumentos: true },
  marca: { corPrimariaHex: '#164069' },
} as unknown as TenantConfig;

describe('marcaDoTenant', () => {
  it('usa o nome para documentos quando houver, senão o nome oficial em caixa alta', () => {
    expect(marcaDoTenant(tenant, { nomeSistema: 'S' }).nomeOrgao).toBe('INSTITUTO DE EXEMPLO');
    const com = { ...tenant, identidade: { ...tenant.identidade, nomeParaDocumentos: 'INSTITUTO X' } } as TenantConfig;
    expect(marcaDoTenant(com, { nomeSistema: 'S' }).nomeOrgao).toBe('INSTITUTO X');
  });

  it('entidade superior só entra se exibirEmDocumentos', () => {
    expect(marcaDoTenant(tenant, { nomeSistema: 'S' }).entidadeSuperior).toBe('GOVERNO DE EXEMPLO');
    const oculta = { ...tenant, entidadeSuperior: { nome: 'G', exibirEmDocumentos: false } } as TenantConfig;
    expect(marcaDoTenant(oculta, { nomeSistema: 'S' }).entidadeSuperior).toBeUndefined();
    const sem = { ...tenant, entidadeSuperior: undefined } as TenantConfig;
    expect(marcaDoTenant(sem, { nomeSistema: 'S' }).entidadeSuperior).toBeUndefined();
  });

  it('converte a cor primária e repassa nome do sistema e logos', () => {
    const logo = { dataUrl: PNG_1X1, largura: 1, altura: 1, formato: 'PNG' as const };
    const m = marcaDoTenant(tenant, { nomeSistema: 'Sistema / EX', logoOrgao: logo });
    expect(m.corPrimaria).toEqual({ r: 22, g: 64, b: 105 });
    expect(m.nomeSistema).toBe('Sistema / EX');
    expect(m.logoOrgao).toBe(logo);
    expect(m.logoEntidadeSuperior).toBeUndefined();
  });
});
