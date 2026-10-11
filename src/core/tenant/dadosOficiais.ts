/**
 * CAMPOS DA CONFIGURAÇÃO DO CLIENTE (tabela `dados_oficiais`)
 *
 * A tabela `dados_oficiais` é a fonte de verdade em runtime da identidade da
 * instituição (key-value auditável), editada pela tela "Configuração do
 * cliente" (`/admin/configuracao-cliente`). Este catálogo diz, para cada chave,
 * onde ela mora no perfil `TenantConfig`. Ele serve aos três lados:
 *
 *   - fallback: valor do perfil (`tenants/<slug>`) enquanto o banco não tem a chave;
 *   - sobreposição: valor do banco aplicado por cima do perfil (`aplicarDadosOficiais`);
 *   - tela: rótulo, categoria e ordem dos campos.
 *
 * As CHAVES são as mesmas da coluna `dados_oficiais.chave` e não podem ser
 * renomeadas sem uma migração correspondente. Ver docs/CONFIGURACAO_CLIENTE.md.
 */

import { NOME_PRODUTO_PADRAO } from './produto';
import { getTenantSnapshot } from './snapshot';
import type { TenantConfig } from './types';

/** Grupos da tela; também é o valor gravado em `dados_oficiais.categoria`. */
export type CategoriaCampoCliente =
  | 'sistema'
  | 'identificacao'
  | 'vinculacao'
  | 'legal'
  | 'dirigente'
  | 'endereco'
  | 'contato'
  | 'integracoes';

export interface CampoCliente {
  chave: string;
  categoria: CategoriaCampoCliente;
  rotulo: string;
  /** Texto de ajuda exibido abaixo do campo. */
  ajuda?: string;
  /** Campo longo (textarea). */
  longo?: boolean;
  /** Valor no perfil do tenant (fallback). */
  ler: (t: TenantConfig) => string | undefined;
  /** Devolve o perfil com o valor do banco aplicado (sem mutar o original). */
  aplicar: (t: TenantConfig, valor: string) => TenantConfig;
}

const identidade = (t: TenantConfig, parcial: Partial<TenantConfig['identidade']>): TenantConfig => ({
  ...t,
  identidade: { ...t.identidade, ...parcial },
});
const endereco = (t: TenantConfig, parcial: TenantConfig['endereco']): TenantConfig => ({
  ...t,
  endereco: { ...t.endereco, ...parcial },
});
const contato = (t: TenantConfig, parcial: TenantConfig['contato']): TenantConfig => ({
  ...t,
  contato: { ...t.contato, ...parcial },
});
const redes = (
  t: TenantConfig,
  rede: 'instagram' | 'facebook' | 'youtube' | 'twitter',
  valor: string
): TenantConfig => contato(t, { redesSociais: { ...t.contato?.redesSociais, [rede]: valor } });
const legal = (t: TenantConfig, parcial: TenantConfig['legal']): TenantConfig => ({
  ...t,
  legal: { ...t.legal, ...parcial },
});
const integracoes = (t: TenantConfig, parcial: TenantConfig['integracoes']): TenantConfig => ({
  ...t,
  integracoes: { ...t.integracoes, ...parcial },
});

export const CAMPOS_CLIENTE: CampoCliente[] = [
  // ---- Sistema ----
  {
    chave: 'sistema_nome',
    categoria: 'sistema',
    rotulo: 'Nome do sistema',
    ajuda: `Nome do produto. Aparece como "<nome do sistema> / <sigla>". Vazio: ${NOME_PRODUTO_PADRAO}.`,
    ler: (t) => t.sistema?.nomeProduto,
    aplicar: (t, v) => ({ ...t, sistema: { ...t.sistema, nomeProduto: v } }),
  },

  // ---- Identificação ----
  {
    chave: 'nome_oficial',
    categoria: 'identificacao',
    rotulo: 'Nome oficial da instituição',
    ler: (t) => t.identidade.nomeOficial,
    aplicar: (t, v) => identidade(t, { nomeOficial: v }),
  },
  {
    chave: 'nome_curto',
    categoria: 'identificacao',
    rotulo: 'Nome curto',
    ajuda: 'Uso corrente em texto.',
    ler: (t) => t.identidade.nomeCurto,
    aplicar: (t, v) => identidade(t, { nomeCurto: v }),
  },
  {
    chave: 'sigla',
    categoria: 'identificacao',
    rotulo: 'Sigla',
    ajuda: 'Em caixa alta, usada em menus, rodapés e no nome do sistema.',
    ler: (t) => t.identidade.sigla,
    aplicar: (t, v) => identidade(t, { sigla: v }),
  },
  {
    chave: 'natureza_juridica',
    categoria: 'identificacao',
    rotulo: 'Natureza jurídica',
    ler: (t) => t.identidade.naturezaJuridica,
    aplicar: (t, v) => identidade(t, { naturezaJuridica: v }),
  },
  {
    chave: 'nome_para_documentos',
    categoria: 'identificacao',
    rotulo: 'Nome no cabeçalho dos documentos',
    ajuda: 'Como o nome sai impresso em PDFs e atos. Vazio: o nome oficial em caixa alta.',
    ler: (t) => t.identidade.nomeParaDocumentos,
    aplicar: (t, v) => identidade(t, { nomeParaDocumentos: v }),
  },
  {
    chave: 'tratamento_dirigente',
    categoria: 'identificacao',
    rotulo: 'Abertura dos atos',
    ajuda: 'Ex.: "O PRESIDENTE DO INSTITUTO ...".',
    longo: true,
    ler: (t) => t.identidade.tratamentoDirigente,
    aplicar: (t, v) => identidade(t, { tratamentoDirigente: v }),
  },

  // ---- Vinculação ----
  {
    chave: 'vinculacao',
    categoria: 'vinculacao',
    rotulo: 'Vinculação',
    ajuda: 'Órgão ao qual a instituição é vinculada.',
    ler: (t) => t.legal?.vinculacao,
    aplicar: (t, v) => legal(t, { vinculacao: v }),
  },
  {
    chave: 'entidade_superior_nome',
    categoria: 'vinculacao',
    rotulo: 'Entidade superior',
    ajuda: 'Governo do Estado, Prefeitura etc. Aparece no topo dos documentos.',
    ler: (t) => t.entidadeSuperior?.nome,
    aplicar: (t, v) => ({
      ...t,
      entidadeSuperior: { exibirEmDocumentos: true, ...t.entidadeSuperior, nome: v },
    }),
  },

  // ---- Base legal ----
  {
    chave: 'cnpj',
    categoria: 'legal',
    rotulo: 'CNPJ',
    ler: (t) => t.legal?.cnpj,
    aplicar: (t, v) => legal(t, { cnpj: v }),
  },
  {
    chave: 'data_criacao',
    categoria: 'legal',
    rotulo: 'Data de criação',
    ler: (t) => t.legal?.dataCriacao,
    aplicar: (t, v) => legal(t, { dataCriacao: v }),
  },
  {
    chave: 'atividade_principal',
    categoria: 'legal',
    rotulo: 'Atividade principal (CNAE)',
    ler: (t) => t.legal?.atividadePrincipal,
    aplicar: (t, v) => legal(t, { atividadePrincipal: v }),
  },
  {
    chave: 'lei_criacao',
    categoria: 'legal',
    rotulo: 'Lei de criação',
    ler: (t) => t.legal?.leiCriacao,
    aplicar: (t, v) => legal(t, { leiCriacao: v }),
  },
  {
    chave: 'decreto_regulamentacao',
    categoria: 'legal',
    rotulo: 'Decreto de regulamentação',
    ler: (t) => t.legal?.decretoRegulamentacao,
    aplicar: (t, v) => legal(t, { decretoRegulamentacao: v }),
  },

  // ---- Dirigente ----
  {
    chave: 'presidente_nome',
    categoria: 'dirigente',
    rotulo: 'Nome do dirigente',
    ler: (t) => t.legal?.dirigenteNome,
    aplicar: (t, v) => legal(t, { dirigenteNome: v }),
  },
  {
    chave: 'presidente_cargo',
    categoria: 'dirigente',
    rotulo: 'Cargo do dirigente',
    ler: (t) => t.legal?.dirigenteCargo,
    aplicar: (t, v) => legal(t, { dirigenteCargo: v }),
  },
  {
    chave: 'presidente_decreto_nomeacao',
    categoria: 'dirigente',
    rotulo: 'Ato de nomeação',
    ler: (t) => t.legal?.dirigenteDecretoNomeacao,
    aplicar: (t, v) => legal(t, { dirigenteDecretoNomeacao: v }),
  },

  // ---- Endereço ----
  {
    chave: 'endereco_logradouro',
    categoria: 'endereco',
    rotulo: 'Logradouro',
    ler: (t) => t.endereco?.logradouro,
    aplicar: (t, v) => endereco(t, { logradouro: v }),
  },
  {
    chave: 'endereco_numero',
    categoria: 'endereco',
    rotulo: 'Número',
    ler: (t) => t.endereco?.numero,
    aplicar: (t, v) => endereco(t, { numero: v }),
  },
  {
    chave: 'endereco_complemento',
    categoria: 'endereco',
    rotulo: 'Complemento',
    ler: (t) => t.endereco?.complemento,
    aplicar: (t, v) => endereco(t, { complemento: v }),
  },
  {
    chave: 'endereco_bairro',
    categoria: 'endereco',
    rotulo: 'Bairro',
    ler: (t) => t.endereco?.bairro,
    aplicar: (t, v) => endereco(t, { bairro: v }),
  },
  {
    chave: 'endereco_cep',
    categoria: 'endereco',
    rotulo: 'CEP',
    ler: (t) => t.endereco?.cep,
    aplicar: (t, v) => endereco(t, { cep: v }),
  },
  {
    chave: 'endereco_cidade',
    categoria: 'endereco',
    rotulo: 'Cidade',
    ler: (t) => t.endereco?.cidade,
    aplicar: (t, v) => endereco(t, { cidade: v }),
  },
  {
    chave: 'endereco_uf',
    categoria: 'endereco',
    rotulo: 'UF',
    ajuda: 'Também define a sede no cálculo de diárias.',
    ler: (t) => t.endereco?.uf,
    aplicar: (t, v) => endereco(t, { uf: v }),
  },
  {
    chave: 'endereco_pais',
    categoria: 'endereco',
    rotulo: 'País',
    ler: (t) => t.endereco?.pais,
    aplicar: (t, v) => endereco(t, { pais: v }),
  },

  // ---- Contato ----
  {
    chave: 'email_institucional',
    categoria: 'contato',
    rotulo: 'E-mail institucional',
    ler: (t) => t.contato?.email,
    aplicar: (t, v) => contato(t, { email: v }),
  },
  {
    chave: 'telefone',
    categoria: 'contato',
    rotulo: 'Telefone',
    ler: (t) => t.contato?.telefone,
    aplicar: (t, v) => contato(t, { telefone: v }),
  },
  {
    chave: 'site',
    categoria: 'contato',
    rotulo: 'Site',
    ler: (t) => t.contato?.site,
    aplicar: (t, v) => contato(t, { site: v }),
  },
  {
    chave: 'email_suporte',
    categoria: 'contato',
    rotulo: 'E-mail do suporte técnico',
    ler: (t) => t.contato?.emailSuporte,
    aplicar: (t, v) => contato(t, { emailSuporte: v }),
  },
  {
    chave: 'instagram',
    categoria: 'contato',
    rotulo: 'Instagram',
    ajuda: 'Só o usuário, sem @.',
    ler: (t) => t.contato?.redesSociais?.instagram,
    aplicar: (t, v) => redes(t, 'instagram', v),
  },
  {
    chave: 'facebook',
    categoria: 'contato',
    rotulo: 'Facebook',
    ler: (t) => t.contato?.redesSociais?.facebook,
    aplicar: (t, v) => redes(t, 'facebook', v),
  },
  {
    chave: 'youtube',
    categoria: 'contato',
    rotulo: 'YouTube',
    ler: (t) => t.contato?.redesSociais?.youtube,
    aplicar: (t, v) => redes(t, 'youtube', v),
  },
  {
    chave: 'twitter',
    categoria: 'contato',
    rotulo: 'X (Twitter)',
    ler: (t) => t.contato?.redesSociais?.twitter,
    aplicar: (t, v) => redes(t, 'twitter', v),
  },

  // ---- Integrações ----
  {
    chave: 'diario_oficial_url',
    categoria: 'integracoes',
    rotulo: 'Endereço do Diário Oficial',
    ler: (t) => t.integracoes?.diarioOficialUrl,
    aplicar: (t, v) => integracoes(t, { diarioOficialUrl: v }),
  },
  {
    chave: 'portal_transparencia_url',
    categoria: 'integracoes',
    rotulo: 'Endereço do Portal da Transparência',
    ler: (t) => t.integracoes?.portalTransparenciaUrl,
    aplicar: (t, v) => integracoes(t, { portalTransparenciaUrl: v }),
  },
];

/**
 * Valores do perfil do tenant por chave — o fallback de `dados_oficiais`.
 * Chaves sem valor no perfil ficam de fora: `obterValor` já trata ausência,
 * e string vazia mascararia o dado vindo do banco.
 */
export function fallbackDadosOficiais(
  tenant: TenantConfig = getTenantSnapshot()
): Record<string, string> {
  const mapa: Record<string, string> = {};
  for (const campo of CAMPOS_CLIENTE) {
    const valor = campo.ler(tenant);
    if (typeof valor === 'string' && valor !== '') mapa[campo.chave] = valor;
  }
  return mapa;
}

/**
 * Aplica os valores do banco por cima do perfil. Chave desconhecida ou valor
 * vazio é ignorado (o perfil continua valendo).
 */
export function aplicarDadosOficiais(
  tenant: TenantConfig,
  valores: Record<string, string>
): TenantConfig {
  let resultado = tenant;
  for (const campo of CAMPOS_CLIENTE) {
    const valor = valores[campo.chave]?.trim();
    if (valor) resultado = campo.aplicar(resultado, valor);
  }
  return resultado;
}
