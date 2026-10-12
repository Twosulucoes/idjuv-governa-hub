import { describe, expect, it } from 'vitest';
import type { TenantConfig } from '@/core/tenant';
import { renderizarDocumento } from '../core/renderizar';
import { dadosColetiva, dadosDesignacao, dadosExoneracao, dadosNomeacao, dadosUnificada } from '../modelos/portaria/construtores';
import type { ConfiguracaoTabela } from '@/types/portariaUnificada';
import { portariaModelo, type DadosPortariaModelo } from '../modelos/portaria/modelo';
import type { ServidorTabela } from '../modelos/portaria/tabelaServidores';
import { emissaoTeste, marcaTeste } from './fixtures';
import { entradasLegado as e } from './fixturesPortaria';
import { lerPdf } from './lerPdf';

const t = {
  identidade: { nomeOficial: 'Instituto de Teste do Estado de Exemplo – ITE', nomeCurto: 'ITE', tratamentoDirigente: 'O PRESIDENTE DO INSTITUTO DE TESTE DO ESTADO DE EXEMPLO – ITE' },
  legal: { leiCriacao: 'Lei nº 1, de 1º de janeiro de 2000', dirigenteNome: 'Fulano de Tal', dirigenteCargo: 'Presidente', numeracaoAtos: 'ITE/PRESI/GAB' },
  endereco: { cidade: 'Cidade Exemplo', uf: 'EX' },
} as unknown as TenantConfig;
const norm = (s: string) => s.replace(/\s+/g, ' ');
const pdfDe = async (d: DadosPortariaModelo) =>
  norm((await lerPdf(renderizarDocumento(portariaModelo, d, marcaTeste, emissaoTeste).doc)).map((p) => p.texto).join(' '));
const cfg = (habilitada = true): ConfiguracaoTabela => ({ ...e.unificada.configTabela, habilitada, colunas: [...e.unificada.configTabela.colunas] });
const servidoresUnificada: ServidorTabela[] = e.unificada.servidores;

describe('construtores das portarias', () => {
  it('nomeação: redação do Art. 1º e do Art. 2º', async () => {
    const d = dadosNomeacao(t, e.nomeacao.portaria, e.nomeacao.servidor, e.nomeacao.cargo);
    expect(d.artigos[0].conteudo).toBe('NOMEAR MARIA DE SOUZA LIMA, para exercer o cargo em comissão de ASSESSOR TÉCNICO, código CC-3, integrante da estrutura organizacional do Instituto de Teste do Estado de Exemplo – ITE.');
    expect(d.artigos[1]).toEqual({ numero: '2º', conteudo: 'Esta Portaria entra em vigor na data de sua publicação.' });
    expect(d.resolve).toBe(true);
    expect(d.local).toBeUndefined();
    const texto = await pdfDe(d);
    expect(texto).toContain('RESOLVE:');
    expect(texto).toContain('FULANO DE TAL');
    expect(texto).toContain('Presidente do ITE');
  });

  it('nomeação sem símbolo no cargo não imprime ", código undefined"', () => {
    const d = dadosNomeacao(t, e.nomeacao.portaria, e.nomeacao.servidor, { nome: 'Assessor' });
    expect(d.artigos[0].conteudo).not.toMatch(/código|undefined/);
  });

  it('exoneração a pedido e de ofício, CPF formatado', () => {
    const a = dadosExoneracao(t, e.exoneracao.portaria, e.exoneracao.servidor, e.exoneracao.cargo, e.exoneracao.unidade, 'pedido');
    expect(a.artigos[0].conteudo).toBe('EXONERAR, a pedido, MARIA DE SOUZA LIMA, inscrito(a) no CPF nº 123.456.789-01, do cargo de Assessor Técnico, no(a) Divisão de Projetos, do Instituto de Teste do Estado de Exemplo – ITE.');
    expect(dadosExoneracao(t, e.exoneracao.portaria, e.exoneracao.servidor, e.exoneracao.cargo, e.exoneracao.unidade, 'oficio').artigos[0].conteudo).toContain('EXONERAR, de ofício,');
  });

  it('designação: origem e destino', () => {
    const d = dadosDesignacao(t, e.designacao.portaria, e.designacao.servidor, e.designacao.cargo, e.designacao.unidadeOrigem, e.designacao.unidadeDestino);
    expect(d.artigos[0].conteudo).toBe('DESIGNAR MARIA DE SOUZA LIMA, inscrito(a) no CPF nº 123.456.789-01, ocupante do cargo de Assessor Técnico, lotado(a) no(a) Divisão de Projetos, para exercer suas atividades no(a) Gabinete da Presidência.');
  });

  it('coletiva: 3 artigos, tabela depois do 1º, local do tenant, 40 servidores em várias páginas sem perder ninguém', async () => {
    const d = dadosColetiva(t, e.coletiva.portaria, e.coletiva.cabecalho, e.coletiva.servidores, 'nomeacao');
    expect(d.artigos.map((a) => a.numero)).toEqual(['1º', '2º', '3º']);
    expect(d.artigos[0].conteudo).toBe('NOMEAR os servidores abaixo relacionados para os respectivos cargos em comissão do Instituto de Teste do Estado de Exemplo – ITE:');
    expect(d.artigos[1].conteudo).toBe('Os nomeados farão jus à remuneração correspondente aos respectivos cargos, conforme disposto no Anexo I da Lei nº 1, de 1º de janeiro de 2000.');
    expect(d.local).toBe('Cidade Exemplo – EX');
    const texto = await pdfDe(d);
    for (let i = 1; i <= 40; i++) expect(texto).toContain(`SERVIDOR DE TESTE ${i}`);
    expect(texto.indexOf('Art. 1º')).toBeLessThan(texto.indexOf('SERVIDOR DE TESTE 1 '));
    expect(texto.indexOf('SERVIDOR DE TESTE 40')).toBeLessThan(texto.indexOf('Art. 3º'));
  });

  it('REVIEW FOCUS 2/5: coletiva com 300 servidores e campos ausentes — nada some, ausente vira "—"', async () => {
    const muitos = Array.from({ length: 300 }, (_, i) => ({ nome_completo: `Pessoa ${i + 1}`, cpf: String(20000000000 + i), cargo: '', codigo: '', unidade_nome: undefined }));
    const d = dadosColetiva(t, e.coletiva.portaria, 'cabeçalho', muitos, 'exoneracao');
    const p = await lerPdf(renderizarDocumento(portariaModelo, d, marcaTeste, emissaoTeste).doc);
    expect(p.length).toBeGreaterThanOrEqual(6);
    const todo = p.flatMap((x) => x.itens.map((i) => i.str));
    expect(todo.filter((s) => /^PESSOA \d+$/.test(s))).toHaveLength(300);
    expect(todo).toContain('—');
    expect(p[p.length - 1].texto).toContain('FULANO DE TAL');
    for (const pg of p) expect(pg.texto).toContain('NOME COMPLETO');
  });

  it('unificada: artigos, tabela com coluna personalizada, assinatura e local informados pelo usuário', async () => {
    const d = dadosUnificada(t, e.unificada.portaria, e.unificada.preambulo, e.unificada.artigos, servidoresUnificada, cfg(), e.unificada.assinatura);
    const texto = await pdfDe(d);
    expect(texto).toContain('PORTARIA Nº 12/ITE/PRESI/GAB/2026 DE 05 DE OUTUBRO DE 2026');
    expect(texto).toContain('OBSERVAÇÃO');
    expect(texto).toContain('ver ofício');
    expect(texto).toContain('Cidade de Teste, 5 de outubro de 2026.');
    expect(texto).toContain('FULANO DE TESTE');
    expect(texto.indexOf('Art. 1º')).toBeLessThan(texto.indexOf('SERVIDOR DE TESTE 1 '));
    expect(texto.indexOf('SERVIDOR DE TESTE 12')).toBeLessThan(texto.indexOf('Art. 2º'));
  });

  it('unificada com tabela desabilitada ou sem servidores não imprime tabela', () => {
    expect(dadosUnificada(t, e.unificada.portaria, 'p', e.unificada.artigos, servidoresUnificada, cfg(false), e.unificada.assinatura).tabela).toBeUndefined();
    expect(dadosUnificada(t, e.unificada.portaria, 'p', e.unificada.artigos, [], cfg(true), e.unificada.assinatura).tabela).toBeUndefined();
  });

  it('REVIEW FOCUS 4/6: data inválida e número sem barra', () => {
    expect(() => dadosNomeacao(t, { numero: '1/2026', data_documento: '' }, e.nomeacao.servidor, e.nomeacao.cargo)).toThrow(/Data inválida/);
    expect(dadosNomeacao(t, { numero: '7', data_documento: '2026-10-05' }, e.nomeacao.servidor, e.nomeacao.cargo).titulo).toBe('PORTARIA Nº 7/ITE/PRESI/GAB/2026 DE 05 DE OUTUBRO DE 2026');
  });
});
