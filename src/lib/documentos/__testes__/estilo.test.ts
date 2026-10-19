import { describe, expect, it } from 'vitest';
import type { TenantConfig } from '@/core/tenant';
// Direto do submódulo: o índice puxa o cliente Supabase, que exige navegador.
import { aplicarDadosOficiais } from '@/core/tenant/dadosOficiais';
import { renderizarDocumento } from '../core/renderizar';
import { ESTILO_PADRAO } from '../core/tokens';
import { estiloDoTenant, marcaDoTenant } from '../marca';
import { tabela } from '../blocos';
import { amostraFicha, amostraRelatorio, type DadosAmostra } from '../modelos/amostras';
import { REGISTRO } from '../registro';
import type { DocumentoModelo, EstiloImpressao } from '../tipos';
import { PNG_1X1, emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf } from './lerPdf';

const renderizar = (estilo: Partial<EstiloImpressao> = {}, modelo = amostraRelatorio) =>
  renderizarDocumento(modelo, { solicitante: 'Fulana' }, marcaTeste, emissaoTeste, { ...ESTILO_PADRAO, ...estilo });

const tenant = {
  identidade: { nomeOficial: 'Instituto de Exemplo' },
  entidadeSuperior: { nome: 'Governo de Exemplo', exibirEmDocumentos: true },
  marca: { corPrimariaHex: '#164069' },
} as unknown as TenantConfig;

describe('estilo de impressão no motor', () => {
  it('linha extra do cabeçalho só na 1ª página; texto do rodapé em todas', async () => {
    const p = await lerPdf(renderizar({ linhaCabecalho: 'Secretaria de Exemplo', textoRodape: 'Rua Exemplo, 100' }).doc);
    expect(p.length).toBeGreaterThan(1);
    expect(p[0].texto).toContain('Secretaria de Exemplo');
    expect(p[1].texto).not.toContain('Secretaria de Exemplo');
    for (const pagina of p) expect(pagina.texto).toContain('Rua Exemplo, 100');
  });

  it('linha extra longa ocupa uma linha só e não tira a unidade emissora do cabeçalho', async () => {
    const duasUnidades = { ...amostraRelatorio, unidadeEmissora: () => ['DIRETORIA DE EXEMPLO', 'DIVISAO DE EXEMPLO'] };
    const [p1] = await lerPdf(renderizar({ linhaCabecalho: `Secretaria ${'muito '.repeat(30)}longa` }, duasUnidades).doc);
    for (const trecho of ['GOVERNO DE TESTE', 'INSTITUTO DE TESTE', 'Secretaria', 'DIRETORIA DE EXEMPLO', 'DIVISAO DE EXEMPLO']) {
      expect(p1.texto).toContain(trecho);
    }
    expect(p1.texto).not.toContain('longa');
  });

  it('esconder o emissor mantém a data e tira o nome', async () => {
    const [com] = await lerPdf(renderizar().doc);
    expect(com.texto).toContain('Emitido por Fulana de Tal');
    const [sem] = await lerPdf(renderizar({ mostrarEmissor: false }).doc);
    expect(sem.texto).not.toContain('Fulana de Tal');
    expect(sem.texto).toMatch(/Emitido em \d{2}\/\d{2}\/\d{4}/);
  });

  it('orientação forçada vale mesmo quando o modelo não escolhe', async () => {
    const [retrato] = await lerPdf(renderizar().doc);
    expect(retrato.largura).toBeLessThan(retrato.altura);
    const [paisagem] = await lerPdf(renderizar({ orientacao: 'paisagem' }).doc);
    expect(paisagem.largura).toBeGreaterThan(paisagem.altura);
  });

  it('letra compacta cabe em menos páginas que a grande', async () => {
    const longo: DocumentoModelo<DadosAmostra> = {
      ...amostraRelatorio,
      blocos: () => [tabela({ colunas: [{ chave: 'n', titulo: 'N' }], linhas: Array.from({ length: 200 }, (_, n) => ({ n })) })],
    };
    const compacta = renderizar({ escala: 'compacto' }, longo).doc.getNumberOfPages();
    const grande = renderizar({ escala: 'grande' }, longo).doc.getNumberOfPages();
    expect(compacta).toBeLessThan(grande);
  });

  it('texto de rodapé longo é cortado numa linha (não invade a margem)', async () => {
    const p = await lerPdf(renderizar({ textoRodape: 'x'.repeat(400) }).doc);
    const item = p[0].itens.find((i) => i.str.startsWith('Sistema de Teste'));
    expect(item).toBeDefined();
    expect(item!.x + item!.largura).toBeLessThanOrEqual(p[0].largura);
  });

  it('a ficha de amostra imprime o protocolo de exemplo e o campo vazio como traço', async () => {
    const [p1] = await lerPdf(renderizar({}, amostraFicha).doc);
    expect(p1.texto).toContain('Protocolo: EX-2026-000001');
    expect(p1.texto).not.toContain('undefined');
  });

  it('as amostras estão no REGISTRO', () => {
    expect(Object.keys(REGISTRO)).toEqual(expect.arrayContaining(['amostra-relatorio', 'amostra-ficha']));
  });
});

describe('configuração de impressão vinda do banco', () => {
  it('sem configuração, o estilo é o padrão', () => {
    expect(estiloDoTenant(tenant)).toEqual(ESTILO_PADRAO);
  });

  it('chaves impressao_* viram estilo e marca', () => {
    const t = aplicarDadosOficiais(tenant, {
      impressao_cor_destaque: '#0A5C36',
      impressao_logo_orgao: 'nao',
      impressao_mostrar_emissor: 'nao',
      impressao_tamanho_letra: 'grande',
      impressao_tabela_listrada: 'nao',
      impressao_orientacao: 'paisagem',
      impressao_linha_cabecalho: '  Secretaria  ',
      impressao_texto_rodape: 'Rua Exemplo',
    });
    expect(estiloDoTenant(t)).toEqual({
      escala: 'grande',
      zebra: false,
      mostrarEmissor: false,
      orientacao: 'paisagem',
      linhaCabecalho: 'Secretaria',
      textoRodape: 'Rua Exemplo',
    });
    const logo = { dataUrl: PNG_1X1, largura: 1, altura: 1, formato: 'PNG' as const };
    const m = marcaDoTenant(t, { nomeSistema: 'S', logoOrgao: logo, logoEntidadeSuperior: logo });
    expect(m.corPrimaria).toEqual({ r: 10, g: 92, b: 54 });
    expect(m.logoOrgao).toBeUndefined();
    expect(m.logoEntidadeSuperior).toBe(logo);
  });

  it('valor fora da lista ou cor inválida é ignorado (fica o padrão)', () => {
    const t = aplicarDadosOficiais(tenant, {
      impressao_cor_destaque: 'vermelho',
      impressao_tamanho_letra: 'enorme',
      impressao_orientacao: 'de lado',
      impressao_tabela_listrada: 'talvez',
    });
    expect(estiloDoTenant(t)).toEqual(ESTILO_PADRAO);
    expect(marcaDoTenant(t, { nomeSistema: 'S' }).corPrimaria).toEqual({ r: 22, g: 64, b: 105 });
  });
});
