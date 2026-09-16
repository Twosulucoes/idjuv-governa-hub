/**
 * METADADOS DE BUILD — TEMPLATE NEUTRO
 *
 * Nomes genéricos de propósito. Quem clonar o repositório sem configurar
 * `VITE_TENANT_SLUG` sobe um sistema sem marca — nunca a marca de outro cliente.
 */

import type { TenantMetadata } from '../metadata.types';

export const templateMetadata: TenantMetadata = {
  slug: '_template',
  lang: 'pt-BR',
  appName: 'Sistema de Governança',
  appShortName: 'Governança',
  appDescription: 'Plataforma de gestão e governança pública',
  author: 'Sistema de Governança',
  themeColor: '#334155',
  backgroundColor: '#ffffff',
  icones: {
    favicon: 'favicon.png',
    faviconIco: 'favicon.ico',
    appleTouchIcon: 'apple-touch-icon.png',
    pwa192: 'pwa-192x192.png',
    pwa512: 'pwa-512x512.png',
  },
};
