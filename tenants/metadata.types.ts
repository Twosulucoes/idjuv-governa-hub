/**
 * METADADOS DE BUILD DO TENANT
 *
 * Contrato do que o BUILD precisa saber sobre a instituição: título da aba,
 * manifest do PWA, cor do tema e nomes dos arquivos de ícone.
 *
 * Por que separado de `tenant.config.ts`: o perfil de runtime importa imagens
 * (`import logo from './assets/logo-light.png'`), e o `vite.config.ts` roda no
 * Node, antes de existir pipeline de assets — não consegue carregar um `.png`.
 * Este arquivo é só texto, então os dois lados leem a mesma fonte sem conflito.
 *
 * Ver docs/WHITE_LABEL.md §3.
 */

export interface TenantIcones {
  /** Ícone da aba. */
  favicon: string;
  /** Ícone legado servido em `/favicon.ico`. */
  faviconIco?: string;
  appleTouchIcon: string;
  pwa192: string;
  pwa512: string;
}

export interface TenantMetadata {
  slug: string;
  /** `<html lang>`. */
  lang: string;
  /** `<title>`, `og:title` e `manifest.name`. */
  appName: string;
  /** `manifest.short_name` e `apple-mobile-web-app-title`. Máx. ~12 caracteres. */
  appShortName: string;
  /** `<meta name="description">`, `og:description` e `manifest.description`. */
  appDescription: string;
  /** `<meta name="author">`. */
  author: string;
  /** `theme-color` e `manifest.theme_color`. Deve espelhar `marca.corPrimariaHex`. */
  themeColor: string;
  /** `manifest.background_color` — fundo da splash screen do PWA. */
  backgroundColor: string;
  /** Perfil do Twitter/X para `twitter:site`. Opcional. */
  twitterSite?: string;
  icones: TenantIcones;
}
