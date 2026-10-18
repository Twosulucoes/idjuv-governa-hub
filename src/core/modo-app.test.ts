import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { ROTAS_DO_SITE, rotaFicaNoSite, urlDoSistema, filtrarMenuParaSite, ehHostDoApp, destinoForaDoSite } from './modo-app';

describe('rotaFicaNoSite', () => {
  it('aceita as rotas do site e seus filhos', () => {
    for (const r of ['/', '/editais', '/base-legal', '/noticias-portal', '/noticias-portal/algum-slug',
      '/transparencia', '/transparencia/lai', '/integridade/denuncias',
      '/governanca/lei-criacao', '/governanca/decreto', '/links-uteis', '/curriculo', '/curriculo/sucesso',
      '/cadastrogestores', '/cadastrogestores/consulta', '/cadastro-arbitros', '/federacoes/cadastro',
      '/ascom/solicitar', '/programas/selecoes', '/programas/selecoes/noticia/x', '/galerias/x'])
      expect(rotaFicaNoSite(r)).toBe(true);
  });
  it('recusa o que é do sistema', () => {
    for (const r of ['/auth', '/sistema', '/admin/usuarios', '/rh', '/governanca/regimento', '/processos/compras',
      '/manuais', '/integridade/codigo-etica', '/integridade', '/ascom/demandas', '/federacoes']) expect(rotaFicaNoSite(r)).toBe(false);
  });
  it('recusa tela do sistema que mora embaixo de uma rota do site', () => {
    for (const r of ['/transparencia/admin', '/cadastrogestores/escolas', '/cadastro-arbitros/admin',
      '/programas/selecoes/admin/inscricoes']) expect(rotaFicaNoSite(r)).toBe(false);
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

describe('destinoForaDoSite', () => {
  const app = 'https://app.idjuv.online';
  it('manda rota do sistema para o app, com query e hash', () => {
    expect(destinoForaDoSite('/auth?mode=reset#access_token=x', app)).toBe('https://app.idjuv.online/auth?mode=reset#access_token=x');
    expect(destinoForaDoSite('/rh/servidores', app)).toBe('https://app.idjuv.online/rh/servidores');
    expect(destinoForaDoSite('/transparencia/admin', app)).toBe('https://app.idjuv.online/transparencia/admin');
  });
  it('não mexe no que o site serve nem sem URL do app', () => {
    expect(destinoForaDoSite('/', app)).toBeNull();
    expect(destinoForaDoSite('/transparencia/lai', app)).toBeNull();
    expect(destinoForaDoSite('/auth', '')).toBeNull();
  });
});

describe('ROTAS_DO_SITE', () => {
  it('não repete e começa com /', () => {
    expect(new Set(ROTAS_DO_SITE).size).toBe(ROTAS_DO_SITE.length);
    expect(ROTAS_DO_SITE.every((r) => r.startsWith('/'))).toBe(true);
  });
});

describe('site x sistema no App.tsx e no AppSite.tsx', () => {
  const ler = (arquivo: string) => readFileSync(resolve(__dirname, '..', arquivo), 'utf8');
  const caminhos = (fonte: string, re: RegExp) => [...fonte.matchAll(re)].map((m) => m[1]);

  it('nenhuma rota protegida do sistema cai no site', () => {
    const protegidas = caminhos(ler('App.tsx'), /<Route path="([^"]+)" element=\{\s*<ProtectedRoute\b/g);
    expect(protegidas.length).toBeGreaterThan(150);
    expect(protegidas.filter(rotaFicaNoSite)).toEqual([]);
  });
  it('toda rota do AppSite está em ROTAS_DO_SITE (menos os redirecionamentos)', () => {
    const fonte = ler('AppSite.tsx');
    const redirecionadas = new Set(caminhos(fonte, /<Route path="([^"]+)" element=\{<Navigate\b/g));
    const rotas = caminhos(fonte, /<Route path="([^"*]+)"/g).filter((r) => !redirecionadas.has(r));
    expect(rotas.length).toBeGreaterThan(20);
    expect(rotas.filter((r) => !rotaFicaNoSite(r))).toEqual([]);
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
    expect(titulos).toContain('Links Úteis');
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

describe('ehHostDoApp', () => {
  it('reconhece o host do app, com ou sem barra e caminho na URL configurada', () => {
    expect(ehHostDoApp('app.idjuv.online', 'https://app.idjuv.online')).toBe(true);
    expect(ehHostDoApp('app.idjuv.online', 'https://app.idjuv.online/')).toBe(true);
    expect(ehHostDoApp('app.idjuv.online', 'https://app.idjuv.online/sistema')).toBe(true);
  });
  it('ignora maiúsculas no host', () => {
    expect(ehHostDoApp('APP.idjuv.online', 'https://app.idjuv.online')).toBe(true);
  });
  it('o site e outros hosts não são o app', () => {
    expect(ehHostDoApp('idjuv.online', 'https://app.idjuv.online')).toBe(false);
    expect(ehHostDoApp('www.idjuv.online', 'https://app.idjuv.online')).toBe(false);
    expect(ehHostDoApp('idjuv-site.169.58.144.179.sslip.io', 'https://app.idjuv.online')).toBe(false);
  });
  it('sem URL do app configurada (ou inválida) nunca redireciona', () => {
    expect(ehHostDoApp('app.idjuv.online', '')).toBe(false);
    expect(ehHostDoApp('app.idjuv.online', undefined)).toBe(false);
    expect(ehHostDoApp('app.idjuv.online', 'isto-nao-e-url')).toBe(false);
  });
});
