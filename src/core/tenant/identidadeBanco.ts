/**
 * IDENTIDADE VINDA DO BANCO (Camada 2 do White Label)
 *
 * O perfil do tenant (`tenants/<slug>`) é só o ponto de partida. Os dados da
 * instituição — nome, sigla, CNPJ, endereço, dirigente, nome do sistema — vêm
 * da tabela `dados_oficiais`, editada em `/admin/configuracao-cliente`, e são
 * aplicados por cima do perfil assim que a leitura responde.
 *
 * É um store fora do React porque os geradores de PDF leem o snapshot de
 * forma síncrona: ao aplicar o banco, o snapshot também é atualizado.
 *
 * A leitura é pública (anon) de propósito: o portal e a tela de login também
 * mostram a identidade. Ver docs/CONFIGURACAO_CLIENTE.md.
 */

import { aplicarDadosOficiais } from './dadosOficiais';
import { TENANT_ATIVO } from './resolver';
import { definirTenant } from './snapshot';
import type { TenantConfig } from './types';

let atual: TenantConfig = TENANT_ATIVO;
const ouvintes = new Set<() => void>();

function publicar(config: TenantConfig) {
  atual = config;
  definirTenant(config);
  ouvintes.forEach((ouvinte) => ouvinte());
}

/** Perfil efetivo (perfil do tenant + banco). */
export function getTenantEfetivo(): TenantConfig {
  return atual;
}

export function assinarTenantEfetivo(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}

/**
 * Lê `dados_oficiais` e aplica por cima do perfil do tenant. Falha de rede ou
 * de permissão mantém o que já está valendo (o perfil, na primeira carga).
 * Chame de novo depois de salvar a configuração.
 */
export async function recarregarIdentidadeDoBanco(): Promise<void> {
  try {
    // Import dinâmico: o núcleo de tenant não depende do cliente Supabase no
    // carregamento (tipos e scripts de build o importam fora do navegador).
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.from('dados_oficiais').select('chave, valor');
    if (error) throw error;

    const valores = Object.fromEntries((data ?? []).map((d) => [d.chave, d.valor]));
    publicar(aplicarDadosOficiais(TENANT_ATIVO, valores));
  } catch (err) {
    console.warn('[tenant] Não foi possível ler a configuração do cliente no banco; usando o perfil.', err);
  }
}
