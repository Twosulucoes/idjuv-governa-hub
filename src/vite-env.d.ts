/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'site' = build institucional enxuto; ausente/'sistema' = app completo. */
  readonly VITE_APP_MODE?: 'site' | 'sistema';
  /** Endereço do sistema interno (ex.: https://app.idjuv.online). Usado pelo build `site`. */
  readonly VITE_APP_URL?: string;
  /** Endereço do site institucional. */
  readonly VITE_SITE_URL?: string;
}
