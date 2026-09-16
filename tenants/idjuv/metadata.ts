/**
 * METADADOS DE BUILD — IDJUV
 *
 * Valores extraídos do `index.html` e do bloco `manifest` do `vite.config.ts`
 * como estavam antes da Fase 1. Duas correções deliberadas:
 *
 *  - `themeColor` passa de `#1e40af` para `#164069`, a cor institucional
 *    canônica definida na Fase 0 (`marca.corPrimariaHex`). Eram tons de azul
 *    diferentes para a mesma marca; agora há uma só fonte.
 *  - `appName` unifica o título da aba e o `manifest.name`, que divergiam
 *    ("IDJUV - Instituto de Desporto..." vs. "IDJUV - Sistema de Governança").
 */

import type { TenantMetadata } from '../metadata.types';

export const idjuvMetadata: TenantMetadata = {
  slug: 'idjuv',
  lang: 'pt-BR',
  appName: 'IDJUV - Instituto de Desporto, Juventude e Lazer de Roraima',
  appShortName: 'IDJUV',
  appDescription:
    'Portal de Governança e Transparência do Instituto de Desporto, Juventude e Lazer de Roraima - IDJUV',
  author: 'IDJUV - Governo de Roraima',
  themeColor: '#164069',
  backgroundColor: '#ffffff',
  twitterSite: '@GovernoRoraima',
  icones: {
    favicon: 'favicon.png',
    faviconIco: 'favicon.ico',
    appleTouchIcon: 'apple-touch-icon.png',
    pwa192: 'pwa-192x192.png',
    pwa512: 'pwa-512x512.png',
  },
};
