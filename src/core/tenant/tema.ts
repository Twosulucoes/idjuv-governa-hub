/**
 * APLICAÇÃO DO TEMA DO TENANT
 *
 * Injeta os tokens de marca como um bloco <style> no <head>.
 *
 * Por que <style> e não `element.style.setProperty`:
 * estilo inline no <html> venceria TANTO `:root` quanto `.dark`, quebrando o
 * dark mode (o next-themes alterna a classe `.dark`, que deixaria de ter efeito
 * sobre os tokens de marca). Um bloco de regras preserva a cascata: `:root` e
 * `.dark` continuam sendo seletores distintos.
 *
 * Os tokens de `src/index.css` vivem dentro de `@layer base`; CSS sem camada
 * tem precedência sobre CSS em camada, então este bloco vence de forma estável,
 * independentemente da ordem de inserção.
 */

import type { Paleta, PaletaModo } from './types';

const ID_ELEMENTO = 'tenant-theme';

/** Token do contrato → nome da CSS custom property. */
const MAPA_TOKENS: Record<keyof PaletaModo, string> = {
  primary: '--primary',
  primaryForeground: '--primary-foreground',
  secondary: '--secondary',
  secondaryForeground: '--secondary-foreground',
  accent: '--accent',
  accentForeground: '--accent-foreground',
  highlight: '--highlight',
  highlightForeground: '--highlight-foreground',
  success: '--success',
  successForeground: '--success-foreground',
  warning: '--warning',
  warningForeground: '--warning-foreground',
  info: '--info',
  infoForeground: '--info-foreground',
  ring: '--ring',
  sidebarBackground: '--sidebar-background',
  sidebarForeground: '--sidebar-foreground',
  sidebarPrimary: '--sidebar-primary',
  sidebarPrimaryForeground: '--sidebar-primary-foreground',
  sidebarAccent: '--sidebar-accent',
  sidebarAccentForeground: '--sidebar-accent-foreground',
  sidebarBorder: '--sidebar-border',
  sidebarRing: '--sidebar-ring',
};

function declaracoes(modo: PaletaModo): string {
  return (Object.keys(MAPA_TOKENS) as (keyof PaletaModo)[])
    .map((token) => `  ${MAPA_TOKENS[token]}: ${modo[token]};`)
    .join('\n');
}

export function cssDoTema(paleta: Paleta): string {
  return [
    ':root {',
    declaracoes(paleta.light),
    '}',
    '.dark {',
    declaracoes(paleta.dark),
    '}',
  ].join('\n');
}

/**
 * Aplica (ou reaplica) a paleta do tenant. Idempotente: reutiliza o mesmo
 * elemento <style>, então chamar várias vezes não acumula nós no DOM.
 */
export function aplicarTema(paleta: Paleta): void {
  if (typeof document === 'undefined') return;

  let elemento = document.getElementById(ID_ELEMENTO) as HTMLStyleElement | null;
  if (!elemento) {
    elemento = document.createElement('style');
    elemento.id = ID_ELEMENTO;
    document.head.appendChild(elemento);
  }

  const css = cssDoTema(paleta);
  if (elemento.textContent !== css) {
    elemento.textContent = css;
  }
}
