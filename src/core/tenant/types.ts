/**
 * CONTRATO DE CONFIGURAÇÃO DE TENANT (White Label — Fase 0)
 *
 * Define a forma do perfil de uma instituição cliente. O núcleo do sistema
 * consome SEMPRE por este contrato — nunca importa `tenants/<slug>` direto.
 *
 * Ver: docs/WHITE_LABEL.md
 */

import type { Modulo } from '@/shared/config/modules.config';

/** Valor de token de cor no formato aceito por `hsl(var(--token))`: "210 65% 25%" */
export type TokenHSL = string;

/**
 * Tokens de MARCA. Apenas os que variam por instituição.
 * Neutros (background, card, muted, border…), raios e sombras permanecem em
 * `src/index.css` — não são identidade, são o design system do produto.
 */
export interface PaletaModo {
  primary: TokenHSL;
  primaryForeground: TokenHSL;
  secondary: TokenHSL;
  secondaryForeground: TokenHSL;
  accent: TokenHSL;
  accentForeground: TokenHSL;
  highlight: TokenHSL;
  highlightForeground: TokenHSL;
  success: TokenHSL;
  successForeground: TokenHSL;
  warning: TokenHSL;
  warningForeground: TokenHSL;
  info: TokenHSL;
  infoForeground: TokenHSL;
  ring: TokenHSL;
  sidebarBackground: TokenHSL;
  sidebarForeground: TokenHSL;
  sidebarPrimary: TokenHSL;
  sidebarPrimaryForeground: TokenHSL;
  sidebarAccent: TokenHSL;
  sidebarAccentForeground: TokenHSL;
  sidebarBorder: TokenHSL;
  sidebarRing: TokenHSL;
  /**
   * Cor de TEXTO dos estados (`text-success`, `text-warning`…). Opcionais no
   * tipo (sem eles valem os de `src/index.css`), mas o guard de contraste
   * (`scripts/check-contraste.mjs`) exige o `*Text` de todo estado cujo matiz o
   * perfil sobrepõe — senão o texto herdaria a cor de outra instituição — e
   * confere ≥ 4,5:1 sobre o fundo.
   */
  successText?: TokenHSL;
  warningText?: TokenHSL;
  infoText?: TokenHSL;
  accentText?: TokenHSL;
  secondaryText?: TokenHSL;
}

export interface Paleta {
  light: PaletaModo;
  dark: PaletaModo;
}

/** Identificação jurídica do órgão. */
export interface TenantIdentidade {
  /** "Instituto de Desporto, Juventude e Lazer do Estado de Roraima – IDJuv" */
  nomeOficial: string;
  /** "IDJuv" — uso corrente em texto */
  nomeCurto: string;
  /** "IDJUV" — uso em caixa alta, menus, rodapés */
  sigla: string;
  naturezaJuridica: string;
  /** Abertura dos atos administrativos: "O PRESIDENTE DO INSTITUTO ..." */
  tratamentoDirigente: string;
  /**
   * Nome como aparece no cabeçalho de documentos oficiais (PDF/Word), em caixa
   * alta. Existe separado de `nomeOficial` porque o texto impresso em atos já
   * emitidos costuma ter forma própria, e mudá-lo altera documento oficial.
   * Ausente: usa `nomeOficial` em caixa alta.
   */
  nomeParaDocumentos?: string;
}

/**
 * Entidade de nível superior exibida em co-branding (Governo do Estado,
 * Prefeitura, Ministério). Opcional: nem todo cliente tem.
 */
export interface TenantEntidadeSuperior {
  nome: string;
  /** Se entra no cabeçalho de documentos oficiais (PDF/Word). */
  exibirEmDocumentos: boolean;
}

/**
 * Imagens da instituição, resolvidas pelo bundler.
 *
 * Os valores são URLs finais (com hash), produzidas pelo import estático em
 * `tenants/<slug>/tenant.config.ts`. O núcleo NUNCA importa de `@/assets` uma
 * imagem de cliente — lê daqui.
 *
 * Os ícones (favicon/PWA) aparecem aqui para consumo em runtime; a injeção no
 * `index.html` e no manifest é de BUILD e usa `tenants/<slug>/metadata.ts`,
 * que não importa binário e por isso pode ser lido pelo `vite.config.ts`.
 */
export interface TenantAssets {
  /** Logo do órgão para fundos claros. */
  logoLight: string;
  /** Logo do órgão para fundos escuros. */
  logoDark: string;
  /** Logo da entidade superior (co-branding), fundos claros. */
  entidadeSuperiorLight?: string;
  /** Logo da entidade superior, fundos escuros. */
  entidadeSuperiorDark?: string;
  favicon: string;
  appleTouchIcon: string;
  pwa192: string;
  pwa512: string;
}

export interface TenantMarca {
  paleta: Paleta;
  assets: TenantAssets;
  /**
   * Cor institucional canônica em hex. É a MESMA cor de `paleta.light.primary`,
   * materializada para consumidores que não leem CSS (jsPDF, e-mails, manifest).
   */
  corPrimariaHex: string;
  /** Proporções largura/altura das logos, para dimensionamento em PDF. */
  proporcaoLogo: {
    orgao: number;
    entidadeSuperior?: number;
  };
}

export interface TenantEndereco {
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cep?: string;
  cidade?: string;
  uf?: string;
  pais?: string;
}

export interface TenantContato {
  email?: string;
  telefone?: string;
  site?: string;
  /**
   * Endereço do suporte técnico interno, quando difere do institucional.
   * Usado em telas de operação (ex.: contatos de emergência do plano de
   * recuperação de desastre).
   */
  emailSuporte?: string;
  redesSociais?: Partial<
    Record<'instagram' | 'facebook' | 'youtube' | 'twitter', string>
  >;
}

/** Dados de constituição legal — base dos atos e das páginas de governança. */
export interface TenantLegal {
  cnpj?: string;
  dataCriacao?: string;
  atividadePrincipal?: string;
  vinculacao?: string;
  leiCriacao?: string;
  decretoRegulamentacao?: string;
  dirigenteNome?: string;
  dirigenteCargo?: string;
  dirigenteDecretoNomeacao?: string;
}

export interface TenantIntegracoes {
  diarioOficialUrl?: string;
  portalTransparenciaUrl?: string;
}

export interface TenantFeatures {
  portalPublico: boolean;
  transparenciaLai: boolean;
  folhaPagamento: boolean;
  esocial: boolean;
  patrimonioMobile: boolean;
}

/** Ramo de atuação — decide quais módulos verticais fazem sentido. */
export type Vertical = 'esporte' | 'cultura' | 'educacao' | 'saude' | 'generico';

/**
 * Faixa de destino de uma viagem a serviço, derivada de UF/país do destino e
 * da UF da sede do órgão (`endereco.uf`) por `classificarDestino` em
 * `@/lib/diariasRegras`.
 */
export type FaixaDestino = 'intermunicipal' | 'interestadual' | 'internacional';

/**
 * Categoria de cargo (`cargos.categoria`, enum `categoria_cargo` do banco). União literal
 * para o perfil do tenant não depender dos tipos gerados; `CATEGORIA_CARGO_LABELS` em
 * `src/types/rh.ts` confere em compilação que ela acompanha o enum.
 */
export type CategoriaCargo = 'efetivo' | 'comissionado' | 'funcao_gratificada' | 'temporario' | 'estagiario';

/**
 * Linha da tabela de diárias: valor por faixa de destino para um conjunto de
 * categorias de cargo (`cargos.categoria`), opcionalmente restrito a uma faixa
 * de `cargos.nivel_hierarquico`. A primeira linha que casar com o cargo vale.
 */
export interface LinhaTabelaDiarias {
  /** Rótulo livre para leitura humana (ex.: "Dirigentes", "Nível superior"). */
  descricao?: string;
  /** Categorias de cargo (`categoria_cargo`) cobertas pela linha. */
  categorias: CategoriaCargo[];
  /** Nível hierárquico mínimo (inclusivo); ausente = sem piso. */
  nivelMinimo?: number;
  /** Nível hierárquico máximo (inclusivo); ausente = sem teto. */
  nivelMaximo?: number;
  /** Valor unitário da diária (R$) por faixa de destino. */
  valores: Record<FaixaDestino, number>;
}

/**
 * Tabela de valores de diária do órgão (base legal: ato normativo de diárias
 * da instituição). Fica no perfil do tenant porque os valores são de cada
 * cliente; vazia, o formulário de viagens aceita quantidade e valor manuais.
 */
export interface TabelaDiariasConfig {
  /** Referência ao ato que fixou os valores (ex.: "IN nº 1/2026"). */
  vigencia?: string;
  regras?: {
    /** Conta meia diária no dia do retorno (padrão: `true`). */
    meiaDiariaNoRetorno?: boolean;
  };
  linhas: LinhaTabelaDiarias[];
}

/** Parâmetros de RH que variam por instituição. */
export interface TenantRH {
  diarias?: TabelaDiariasConfig;
}

export interface TenantConfig {
  slug: string;
  identidade: TenantIdentidade;
  entidadeSuperior?: TenantEntidadeSuperior;
  marca: TenantMarca;
  endereco?: TenantEndereco;
  contato?: TenantContato;
  legal?: TenantLegal;
  integracoes?: TenantIntegracoes;
  /** Parâmetros de RH (tabela de diárias etc.). */
  rh?: TenantRH;
  /** Módulos contratados. Subconjunto de MODULES_CONFIG. */
  modulos: Modulo[];
  verticais: Vertical[];
  features: TenantFeatures;
}
