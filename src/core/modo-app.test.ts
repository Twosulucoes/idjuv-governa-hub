import { describe, it, expect } from 'vitest';
import { ROTAS_DO_SITE, rotaFicaNoSite, urlDoSistema } from './modo-app';

describe('rotaFicaNoSite', () => {
  it('aceita as rotas do site e seus filhos', () => {
    for (const r of ['/', '/editais', '/base-legal', '/noticias-portal', '/noticias-portal/algum-slug',
      '/transparencia', '/transparencia/lai', '/integridade/denuncias',
      '/governanca/lei-criacao', '/governanca/decreto']) expect(rotaFicaNoSite(r)).toBe(true);
  });
  it('recusa o que é do sistema', () => {
    for (const r of ['/auth', '/sistema', '/admin/usuarios', '/rh', '/governanca/regimento', '/processos/compras',
      '/manuais', '/curriculo', '/links-uteis', '/integridade/codigo-etica', '/integridade']) expect(rotaFicaNoSite(r)).toBe(false);
  });
  it('"/" não casa com tudo', () => { expect(rotaFicaNoSite('/qualquer')).toBe(false); });
  it('ignora query e hash', () => { expect(rotaFicaNoSite('/editais?x=1#a')).toBe(true); });
  it('não confunde prefixo parecido', () => { expect(rotaFicaNoSite('/editaisfalso')).toBe(false); });
});

describe('urlDoSistema', () => {
  it('junta a base e o caminho sem barra dupla', () => {
    expect(urlDoSistema('/auth', 'https://app.idjuv.online/')).toBe('https://app.idjuv.online/auth');
    expect(urlDoSistema('sistema', 'https://app.idjuv.online')).toBe('https://app.idjuv.online/sistema');
  });
  it('sem base devolve o caminho interno (modo sistema)', () => {
    expect(urlDoSistema('/auth', '')).toBe('/auth');
  });
});

describe('ROTAS_DO_SITE', () => {
  it('não repete e começa com /', () => {
    expect(new Set(ROTAS_DO_SITE).size).toBe(ROTAS_DO_SITE.length);
    expect(ROTAS_DO_SITE.every((r) => r.startsWith('/'))).toBe(true);
  });
});
