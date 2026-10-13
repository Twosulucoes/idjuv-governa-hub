import { describe, it, expect } from 'vitest';
import { ROTAS_DO_SITE, rotaFicaNoSite, urlDoSistema, filtrarMenuParaSite } from './modo-app';

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

describe('filtrarMenuParaSite', () => {
  const menu = [
    { title: 'Editais', href: '/editais' },
    { title: 'Base Legal', href: '/base-legal', items: [
      { title: 'Lei', href: '/governanca/lei-criacao' }, { title: 'Decreto', href: '/governanca/decreto' }] },
    { title: 'Links Úteis', href: '/links-uteis' },
    { title: 'Governança', href: '/governanca', items: [
      { title: 'Lei', href: '/governanca/lei-criacao' }, { title: 'Regimento', href: '/governanca/regimento' }] },
    { title: 'Processos', href: '/processos', items: [{ title: 'Compras', href: '/processos/compras' }] },
    { title: 'Integridade', href: '/integridade', items: [
      { title: 'Código de Ética', href: '/integridade/codigo-etica' }, { title: 'Canal de Denúncias', href: '/integridade/denuncias' }] },
    { title: 'Transparência', href: '/transparencia' },
  ];
  const r = filtrarMenuParaSite(menu);

  it('some com o que não existe no site', () => {
    const titulos = r.map((i) => i.title);
    expect(titulos).not.toContain('Links Úteis');
    expect(titulos).not.toContain('Processos');
  });
  it('mantém o que existe e tira subitens que não existem', () => {
    expect(r.find((i) => i.title === 'Base Legal')?.items?.map((s) => s.href))
      .toEqual(['/governanca/lei-criacao', '/governanca/decreto']);
  });
  it('não repete no menu um destino que já apareceu antes', () => {
    expect(r.map((i) => i.title)).not.toContain('Governança');
  });
  it('grupo cujo pai não existe no site, com um filho que existe, vira item simples', () => {
    const i = r.find((x) => x.href === '/integridade/denuncias');
    expect(i?.title).toBe('Canal de Denúncias');
    expect(i?.items).toBeUndefined();
  });
  it('todo href restante está no site', () => {
    const todos = r.flatMap((i) => [i.href, ...(i.items ?? []).map((s) => s.href)]);
    expect(todos.every(rotaFicaNoSite)).toBe(true);
  });
  it('não altera o menu original', () => {
    expect(menu).toHaveLength(7);
    expect(menu[3].items).toHaveLength(2);
  });
});
