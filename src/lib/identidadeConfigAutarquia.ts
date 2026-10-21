/**
 * Dados da instituição num lugar só.
 *
 * Razão social, CNPJ, endereço, contato e dirigente se cadastram em Administração → Configuração do cliente
 * (`dados_oficiais`, aplicado por cima do perfil do tenant). `config_autarquia` (Configuração da Folha → Autarquia)
 * fica só com o que é da folha e do eSocial: natureza jurídica (código), regime tributário, código IBGE do
 * município, CPF do responsável, responsável contábil e parâmetros do eSocial.
 *
 * Quem lê `config_autarquia` (eSocial, CNAB da folha, remessa do Gestão MAX) passa por `comIdentidadeDoCliente`:
 * o valor da Configuração do cliente vale; o que estiver vazio lá cai no que já estava gravado na Folha.
 */

import type { TenantConfig } from "@/core/tenant";

/** Campos de `config_autarquia` que pertencem à identidade da instituição (só leitura na Folha). */
export interface IdentidadeConfigAutarquia {
  razao_social: string;
  nome_fantasia: string | null;
  cnpj: string;
  endereco_logradouro: string | null;
  endereco_numero: string | null;
  endereco_complemento: string | null;
  endereco_bairro: string | null;
  endereco_cidade: string | null;
  endereco_uf: string | null;
  endereco_cep: string | null;
  telefone: string | null;
  email_institucional: string | null;
  site: string | null;
  responsavel_legal: string | null;
  cargo_responsavel: string | null;
}

const texto = (v: string | null | undefined) => (v ?? "").trim();

/** O primeiro valor preenchido (a Configuração do cliente vem antes). */
const primeiro = (doCliente: string | undefined, daFolha: string | null | undefined) =>
  texto(doCliente) || texto(daFolha) || null;

/**
 * A identidade da Configuração do cliente, com o que faltar completado pelo que está gravado na Folha.
 * O endereço vai inteiro de um lado só: o do cliente quando tem logradouro, senão o da Folha (sem misturar).
 */
export function identidadeDoCliente(
  tenant: TenantConfig | null,
  daFolha: Partial<IdentidadeConfigAutarquia> | null | undefined,
): IdentidadeConfigAutarquia {
  const f = daFolha ?? {};
  const e = tenant?.endereco;
  const enderecoDoCliente = !!texto(e?.logradouro);
  const endereco = enderecoDoCliente
    ? {
        endereco_logradouro: texto(e?.logradouro) || null,
        endereco_numero: texto(e?.numero) || null,
        endereco_complemento: texto(e?.complemento) || null,
        endereco_bairro: texto(e?.bairro) || null,
        endereco_cidade: texto(e?.cidade) || null,
        endereco_uf: texto(e?.uf) || null,
        endereco_cep: texto(e?.cep) || null,
      }
    : {
        endereco_logradouro: texto(f.endereco_logradouro) || null,
        endereco_numero: texto(f.endereco_numero) || null,
        endereco_complemento: texto(f.endereco_complemento) || null,
        endereco_bairro: texto(f.endereco_bairro) || null,
        endereco_cidade: texto(f.endereco_cidade) || null,
        endereco_uf: texto(f.endereco_uf) || null,
        endereco_cep: texto(f.endereco_cep) || null,
      };

  return {
    razao_social: primeiro(tenant?.identidade.nomeOficial, f.razao_social) ?? "",
    nome_fantasia: primeiro(tenant?.identidade.nomeCurto, f.nome_fantasia),
    cnpj: primeiro(tenant?.legal?.cnpj, f.cnpj) ?? "",
    ...endereco,
    telefone: primeiro(tenant?.contato?.telefone, f.telefone),
    email_institucional: primeiro(tenant?.contato?.email, f.email_institucional),
    site: primeiro(tenant?.contato?.site, f.site),
    responsavel_legal: primeiro(tenant?.legal?.dirigenteNome, f.responsavel_legal),
    cargo_responsavel: primeiro(tenant?.legal?.dirigenteCargo, f.cargo_responsavel),
  };
}

/** A linha de `config_autarquia` com a identidade da Configuração do cliente por cima (null continua null). */
export function comIdentidadeDoCliente<T extends Partial<IdentidadeConfigAutarquia>>(
  config: T | null | undefined,
  tenant: TenantConfig | null,
): (T & IdentidadeConfigAutarquia) | null {
  if (!config) return null;
  return { ...config, ...identidadeDoCliente(tenant, config) };
}
