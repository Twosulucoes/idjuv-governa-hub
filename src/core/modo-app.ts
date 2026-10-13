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

interface ItemMenu {
  href: string;
  title: string;
  items?: { title: string; href: string }[];
}

/**
 * Menu do build `site`: tira o que o site não serve e não repete destino. Pai que não existe no site mas
 * tem filho que existe vira item simples (ex.: "Integridade" → "Canal de Denúncias"). Não altera a entrada.
 */
export function filtrarMenuParaSite<T extends ItemMenu>(menu: readonly T[]): T[] {
  const vistos = new Set<string>();
  const saida: T[] = [];
  for (const item of menu) {
    const filhos = (item.items ?? []).filter((f) => rotaFicaNoSite(f.href) && !vistos.has(f.href));
    if (rotaFicaNoSite(item.href)) {
      if (vistos.has(item.href)) continue;
      vistos.add(item.href);
      filhos.forEach((f) => vistos.add(f.href));
      saida.push(item.items ? { ...item, items: filhos } : item);
    } else if (filhos.length === 1) {
      vistos.add(filhos[0].href);
      saida.push({ ...item, title: filhos[0].title, href: filhos[0].href, items: undefined });
    } else if (filhos.length > 1) {
      filhos.forEach((f) => vistos.add(f.href));
      saida.push({ ...item, href: filhos[0].href, items: filhos });
    }
  }
  return saida;
}
