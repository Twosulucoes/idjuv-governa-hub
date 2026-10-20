import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderizarDocumento } from '../core/renderizar';
import { arvoreOrganograma, emOrdemHierarquica } from '../modelos/organograma/comum';
import { organogramaDesenho, type DadosOrganogramaDesenho } from '../modelos/organograma/desenho';
import { organogramaLista, type DadosOrganogramaLista } from '../modelos/organograma/lista';
import { REGISTRO } from '../registro';
import type { DocumentoModelo } from '../tipos';
import { emissaoTeste, marcaTeste } from './fixtures';
import { contarServidoresOrganograma, servidoresPorCargoOrganograma, unidadesOrganograma } from './fixturesOrganograma';
import { lerPdf } from './lerPdf';

// A casca da tela (`pdfOrganograma.ts`) monta os dados; aqui se captura o que ela manda ao motor.
const emitidos: { tipo: string; dados: unknown }[] = [];
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));
vi.mock('@/lib/documentos', () => ({
  emitirDocumento: async (tipo: string, dados: unknown) => {
    emitidos.push({ tipo, dados });
    return { doc: null, blob: null, nomeArquivo: 'x.pdf' };
  },
  baixarDocumento: () => undefined,
}));

const { gerarOrganogramaListaPDF, gerarOrganogramaPDF } = await import('@/lib/pdfOrganograma');

const ler = async <D,>(modelo: DocumentoModelo<D>, dados: D) => {
  const r = renderizarDocumento(modelo, dados, marcaTeste, emissaoTeste);
  const paginas = await lerPdf(r.doc);
  return { ...r, paginas, texto: paginas.map((p) => p.texto).join(' ') };
};
const semLixo = (t: string) => {
  expect(t).not.toContain('undefined');
  expect(t).not.toContain('null');
  expect(t).not.toContain('NaN');
};

const TUDO = { exibirNomesServidores: true, exibirQuantidadeServidores: true, exibirLegenda: true, exibirTodosServidores: true };
const base = { unidades: unidadesOrganograma, contarServidores: contarServidoresOrganograma, getServidoresByUnidadeCargo: servidoresPorCargoOrganograma };

async function dadosLista(config = TUDO): Promise<DadosOrganogramaLista> {
  emitidos.length = 0;
  await gerarOrganogramaListaPDF({ ...base, titulo: 'ESTRUTURA ORGANIZACIONAL', config });
  expect(emitidos[0].tipo).toBe('organograma-lista');
  return emitidos[0].dados as DadosOrganogramaLista;
}
async function dadosDesenho(config = TUDO): Promise<DadosOrganogramaDesenho> {
  emitidos.length = 0;
  await gerarOrganogramaPDF({ ...base, titulo: 'ORGANOGRAMA INSTITUCIONAL', config });
  expect(emitidos[0].tipo).toBe('organograma-desenho');
  return emitidos[0].dados as DadosOrganogramaDesenho;
}

const TOTAL_SERVIDORES = unidadesOrganograma.reduce((s, u) => s + contarServidoresOrganograma(u.id), 0);

describe('organograma no motor único', () => {
  beforeEach(() => {
    emitidos.length = 0;
  });

  it('os dois modelos estão no registro, família relatório', () => {
    expect(REGISTRO['organograma-lista']).toBe(organogramaLista);
    expect(REGISTRO['organograma-desenho']).toBe(organogramaDesenho);
    expect(organogramaLista.familia).toBe('relatorio');
    expect(organogramaDesenho.familia).toBe('relatorio');
    expect(organogramaDesenho.orientacao).toBe('paisagem');
  });

  it('árvore: ordem hierárquica, órfã vira topo e ciclo não trava nem perde unidade', () => {
    const u = (id: string, superiorId: string | null, nome = id) => ({ id, superiorId, nivel: 1, nome, tipo: 'Setor', quantidadeServidores: 0 });
    const ordem = emOrdemHierarquica(arvoreOrganograma([u('b', 'a'), u('a', null), u('c', 'inexistente'), u('x', 'y'), u('y', 'x')]));
    expect(ordem.map((o) => `${o.unidade.id}${o.profundidade}`)).toEqual(['a0', 'b1', 'c0', 'x0', 'y1']);
  });

  it('lista: colunas, ordem da hierarquia, vínculo, quantidades, servidores com cargo e totais', async () => {
    const d = await dadosLista();
    const { texto, paginas } = await ler(organogramaLista, d);
    for (const t of ['ESTRUTURA ORGANIZACIONAL', 'Sigla', 'Unidade', 'Superior', 'Servidores', 'Responsável e lotados',
      'Diretoria de Administração e Finanças', 'Núcleo de Acompanhamento de Convênios e Parcerias Institucionais',
      'Maria Fictícia da Presidência (Responsável)', 'Servidor Fictício 3-1 (Chefe da unidade)', '(Sem lotação)',
      'Total de unidades', 'Total de servidores']) expect(texto).toContain(t);
    // Responsável repetido entre os lotados por cargo não aparece duas vezes.
    expect(texto).not.toContain('MARIA FICTÍCIA DA PRESIDÊNCIA');
    // Até 5 nomes por unidade, o resto vira "+N servidores" (NUCDP tem 6 lotados).
    expect(texto).toContain('Servidor Fictício 20-5 (Assessor técnico)');
    expect(texto).toContain('+1 servidores');
    expect(texto).not.toContain('Servidor Fictício 20-6');
    // Todas as 40 unidades, na ordem da hierarquia (PRES, depois as filhas por nível e nome).
    for (const u of unidadesOrganograma) expect(texto).toContain(u.nome);
    expect(texto.indexOf('Presidência')).toBeLessThan(texto.indexOf('Assessoria de Comunicação'));
    expect(texto.indexOf('Divisão de Compras e Contratos')).toBeLessThan(texto.indexOf('Núcleo de Licitações'));
    expect(texto).toContain(`${TOTAL_SERVIDORES}`);
    expect(paginas.length).toBeGreaterThan(1);
    semLixo(texto);
  });

  it('lista: só o primeiro com +N, e opções desligadas tiram as colunas e os nomes', async () => {
    const primeiro = await ler(organogramaLista, await dadosLista({ ...TUDO, exibirTodosServidores: false }));
    expect(primeiro.texto).toContain('Servidor Fictício 5-1 (Chefe da unidade) +4');
    expect(primeiro.texto).not.toContain('Servidor Fictício 5-2');

    const d = await dadosLista({ ...TUDO, exibirNomesServidores: false, exibirQuantidadeServidores: false });
    expect(d.unidades.every((u) => u.servidores.length === 0)).toBe(true);
    const { texto } = await ler(organogramaLista, d);
    expect(texto).not.toContain('Responsável e lotados');
    expect(texto).not.toContain('Fictício');
    expect(texto).not.toMatch(/\bServidores\b/);
    expect(texto).toContain('Total de servidores');
    semLixo(texto);
  });

  it('desenho: A4 paisagem, todas as unidades com tipo, quantidade e responsável, totais e legenda', async () => {
    const d = await dadosDesenho();
    const { texto, paginas } = await ler(organogramaDesenho, d);
    expect(paginas[0].largura).toBeGreaterThan(paginas[0].altura);
    expect(texto).toContain('ORGANOGRAMA INSTITUCIONAL');
    for (const u of unidadesOrganograma) if (u.sigla) expect(texto).toContain(u.sigla);
    // Sem sigla, o nome inteiro (quebrado em linhas, nunca cortado).
    for (const parte of ['Núcleo de', 'Convênios e', 'Institucionais']) expect(texto).toContain(parte);
    expect(texto).toContain('Assessoria · 8 serv.');
    expect(texto).toContain('Maria Fictícia da Presidência');
    expect(texto).toContain('João Exemplo de Administração');
    expect(texto).toContain('Servidor Fictício 3-1 +2');
    expect(texto).toContain(`Total: 40 unidades | ${TOTAL_SERVIDORES} servidores`);
    expect(texto).toContain('Legenda');
    expect(texto).toContain('Núcleo (21)');
    semLixo(texto);
  });

  it('desenho: nenhuma caixa sai da página nem cobre o rodapé', async () => {
    const { paginas } = await ler(organogramaDesenho, await dadosDesenho());
    for (const p of paginas) {
      for (const i of p.itens) {
        expect(i.x).toBeGreaterThanOrEqual(0);
        expect(i.x + i.largura).toBeLessThanOrEqual(p.largura);
      }
    }
  });

  it('desenho: opções desligadas tiram quantidade, nomes e legenda', async () => {
    const d = await dadosDesenho({ ...TUDO, exibirNomesServidores: false, exibirQuantidadeServidores: false, exibirLegenda: false });
    expect(d.unidades.every((u) => !u.responsavel)).toBe(true);
    const { texto } = await ler(organogramaDesenho, d);
    expect(texto).not.toContain('serv.');
    expect(texto).not.toContain('Fictícia');
    expect(texto).not.toContain('Legenda');
    expect(texto).toContain('DIRAF');
    semLixo(texto);
  });

  it('desenho: estrutura vazia e estrutura longa (pilha que continua na coluna seguinte)', async () => {
    const vazio = await ler(organogramaDesenho, { unidades: [], exibirNomesServidores: true, exibirQuantidadeServidores: true, exibirLegenda: true });
    expect(vazio.texto).toContain('Nenhuma unidade cadastrada');
    semLixo(vazio.texto);

    const longa: DadosOrganogramaDesenho = {
      exibirNomesServidores: true, exibirQuantidadeServidores: true, exibirLegenda: true,
      unidades: [
        { id: 'r', nivel: 1, nome: 'Topo', sigla: 'TOPO', tipo: 'Presidência', quantidadeServidores: 1 },
        { id: 'd', superiorId: 'r', nivel: 2, nome: 'Diretoria única', sigla: 'DU', tipo: 'Diretoria', quantidadeServidores: 2 },
        ...Array.from({ length: 30 }, (_, i) => ({
          id: `n${i}`, superiorId: 'd', nivel: 3, nome: `Núcleo ${i}`, sigla: `N${String(i).padStart(2, '0')}`, tipo: 'Núcleo', quantidadeServidores: i,
        })),
      ],
    };
    const { texto } = await ler(organogramaDesenho, longa);
    expect(texto).toContain('(continuação de DU)');
    for (let i = 0; i < 30; i++) expect(texto).toContain(`N${String(i).padStart(2, '0')}`);
  });

  it('desenho: cadeia de 15 níveis e nome enorme continuam dentro da página', async () => {
    const funda: DadosOrganogramaDesenho = {
      exibirNomesServidores: true, exibirQuantidadeServidores: true, exibirLegenda: false,
      unidades: Array.from({ length: 15 }, (_, i) => ({
        id: `u${i}`, superiorId: i ? `u${i - 1}` : undefined, nivel: i + 1, tipo: 'Núcleo', quantidadeServidores: 1,
        nome: i === 3 ? 'Unidade de nome muito longo '.repeat(150) : `Unidade ${i}`, sigla: i === 3 ? undefined : `U${i}`,
      })),
    };
    const { paginas, texto } = await ler(organogramaDesenho, funda);
    for (let i = 4; i < 15; i++) expect(texto).toContain(`U${i}`);
    expect(texto).toContain('…');
    for (const p of paginas) {
      for (const i of p.itens) {
        expect(i.x).toBeGreaterThanOrEqual(0);
        expect(i.x + i.largura).toBeLessThanOrEqual(p.largura);
        expect(i.y).toBeGreaterThanOrEqual(0);
        expect(i.y).toBeLessThanOrEqual(p.altura);
      }
    }
  });
});

// Amostras para inspeção visual: DOCUMENTOS_AMOSTRAS=<pasta>.
const saida = process.env.DOCUMENTOS_AMOSTRAS;
describe.skipIf(!saida)('amostras do organograma', () => {
  it('grava lista e desenho', async () => {
    mkdirSync(saida!, { recursive: true });
    const gravar = (nome: string, doc: { output: (t: 'arraybuffer') => ArrayBuffer }) =>
      writeFileSync(join(saida!, nome), Buffer.from(doc.output('arraybuffer')));
    gravar('organograma-lista.pdf', renderizarDocumento(organogramaLista, await dadosLista(), marcaTeste, emissaoTeste).doc);
    gravar(
      'organograma-lista-primeiro.pdf',
      renderizarDocumento(organogramaLista, await dadosLista({ ...TUDO, exibirTodosServidores: false }), marcaTeste, emissaoTeste).doc,
    );
    gravar('organograma-desenho.pdf', renderizarDocumento(organogramaDesenho, await dadosDesenho(), marcaTeste, emissaoTeste).doc);
    gravar(
      'organograma-desenho-sem-nomes.pdf',
      renderizarDocumento(organogramaDesenho, await dadosDesenho({ ...TUDO, exibirNomesServidores: false }), marcaTeste, emissaoTeste).doc,
    );
  });
});
