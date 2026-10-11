/**
 * NOME DO PRODUTO
 *
 * O sistema é um produto vendido a várias instituições. O nome que aparece na
 * aba, no menu e no rodapé dos documentos é "<produto> / <sigla do cliente>"
 * (ex.: "Governa Hub / ABC"). O produto é do fornecedor, não do cliente, por
 * isso o padrão mora aqui; cada instalação pode trocá-lo na tela
 * "Configuração do cliente" (chave `sistema_nome` de `dados_oficiais`).
 *
 * Ver docs/CONFIGURACAO_CLIENTE.md.
 */

import type { TenantConfig } from './types';

/** Nome provisório do produto, até a decisão comercial do nome definitivo. */
export const NOME_PRODUTO_PADRAO = 'Governa Hub';

/** Nome do produto na instalação ativa. */
export function nomeDoProduto(tenant: TenantConfig): string {
  return tenant.sistema?.nomeProduto?.trim() || NOME_PRODUTO_PADRAO;
}

/** "<produto> / <sigla>": título da aba, menu e rodapé dos documentos. */
export function nomeDoSistema(tenant: TenantConfig): string {
  const sigla = tenant.identidade.sigla?.trim();
  const produto = nomeDoProduto(tenant);
  return sigla ? `${produto} / ${sigla}` : produto;
}
