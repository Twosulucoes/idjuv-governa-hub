/** Modo do build: 'site' (institucional, sem sistema interno) ou 'sistema' (padrão, comportamento de sempre). */
export const MODO_SITE = import.meta.env.VITE_APP_MODE === 'site';

/** Única fonte das rotas que o build `site` serve (filhos incluídos). Mexer aqui muda roteador, menu e guard. */
export const ROTAS_DO_SITE = [
  '/',
  '/editais',
  '/base-legal',
  '/noticias-portal',
  '/transparencia',
  '/integridade/denuncias',
  '/governanca/lei-criacao',
  '/governanca/decreto',
] as const;

export function rotaFicaNoSite(href: string): boolean {
  const caminho = href.split(/[?#]/)[0];
  return ROTAS_DO_SITE.some((r) =>
    r === '/' ? caminho === '/' : caminho === r || caminho.startsWith(`${r}/`),
  );
}

/** Endereço de uma tela do sistema. No site vira URL absoluta do app; no sistema continua o caminho interno. */
export function urlDoSistema(caminho: string, base: string = import.meta.env.VITE_APP_URL ?? ''): string {
  const c = caminho.startsWith('/') ? caminho : `/${caminho}`;
  return base ? `${base.replace(/\/+$/, '')}${c}` : c;
}
