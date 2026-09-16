/**
 * FALLBACK DE DADOS OFICIAIS A PARTIR DO PERFIL DO TENANT
 *
 * A tabela `dados_oficiais` é a fonte de verdade em runtime (key-value
 * auditável). Este mapa é só o fallback usado enquanto ela não responde — e
 * agora vem do perfil da instituição, não de literais dentro do hook.
 *
 * As CHAVES são as mesmas da coluna `dados_oficiais.chave` e não podem ser
 * renomeadas sem uma migração correspondente.
 */

import { getTenantSnapshot } from './snapshot';
import type { TenantConfig } from './types';

export function fallbackDadosOficiais(
  tenant: TenantConfig = getTenantSnapshot()
): Record<string, string> {
  const { identidade, endereco = {}, contato = {}, legal = {} } = tenant;

  const mapa: Record<string, string | undefined> = {
    nome_oficial: identidade.nomeOficial,
    nome_curto: identidade.nomeCurto,
    natureza_juridica: identidade.naturezaJuridica,
    cnpj: legal.cnpj,
    data_criacao: legal.dataCriacao,
    atividade_principal: legal.atividadePrincipal,
    vinculacao: legal.vinculacao,
    endereco_logradouro: endereco.logradouro,
    endereco_numero: endereco.numero,
    endereco_complemento: endereco.complemento,
    endereco_bairro: endereco.bairro,
    endereco_cep: endereco.cep,
    endereco_cidade: endereco.cidade,
    endereco_uf: endereco.uf,
    endereco_pais: endereco.pais,
    email_institucional: contato.email,
    telefone: contato.telefone,
    lei_criacao: legal.leiCriacao,
    decreto_regulamentacao: legal.decretoRegulamentacao,
    presidente_nome: legal.dirigenteNome,
    presidente_cargo: legal.dirigenteCargo,
    presidente_decreto_nomeacao: legal.dirigenteDecretoNomeacao,
  };

  // Chaves sem valor no perfil ficam de fora: `obterValor` já trata ausência,
  // e string vazia mascararia o dado vindo do banco.
  return Object.fromEntries(
    Object.entries(mapa).filter(([, valor]) => typeof valor === 'string' && valor !== '')
  ) as Record<string, string>;
}
