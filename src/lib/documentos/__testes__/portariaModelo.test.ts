import { describe, expect, it } from 'vitest';
import { renderizarDocumento } from '../core/renderizar';
import { portariaModelo, type DadosPortariaModelo } from '../modelos/portaria/modelo';
import { emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf } from './lerPdf';

const base: DadosPortariaModelo = {
  titulo: 'PORTARIA Nº 12/2026 DE 05 DE OUTUBRO DE 2026', dataDocumento: '2026-10-05',
  preambulo: 'O PRESIDENTE DO ÓRGÃO DE TESTE, no uso das atribuições legais, e demais normas aplicáveis,',
  resolve: true,
  artigos: [
    { numero: '1º', conteudo: 'NOMEAR FULANO DE TESTE para o cargo de Assessor.' },
    { numero: '2º', conteudo: 'Esta Portaria entra em vigor na data de sua publicação.' },
  ],
  assinatura: { nome: 'BELTRANO DE TESTE', cargo: 'Presidente do Órgão' },
};
const gerar = (d: DadosPortariaModelo) => renderizarDocumento(portariaModelo, d, marcaTeste, emissaoTeste);

describe('portariaModelo', () => {
  it('título, preâmbulo, RESOLVE, artigos em ordem e assinatura', async () => {
    const [p1] = await lerPdf(gerar(base).doc);
    const t = p1.texto;
    expect(t).toContain('PORTARIA Nº 12');
    expect(t.indexOf('O PRESIDENTE')).toBeLessThan(t.indexOf('RESOLVE:'));
    expect(t.indexOf('RESOLVE:')).toBeLessThan(t.indexOf('Art. 1º'));
    expect(t.indexOf('Art. 1º')).toBeLessThan(t.indexOf('Art. 2º'));
    expect(t.indexOf('Art. 2º')).toBeLessThan(t.indexOf('BELTRANO DE TESTE'));
  });

  it('sem `resolve` não imprime RESOLVE:; sem `local` não imprime linha de local/data', async () => {
    const [p1] = await lerPdf(gerar({ ...base, resolve: false }).doc);
    expect(p1.texto).not.toContain('RESOLVE:');
    expect(p1.texto).not.toMatch(/ de outubro de 2026\./);
  });

  it('com `local` imprime "Local, data por extenso."', async () => {
    const [p1] = await lerPdf(gerar({ ...base, local: 'Cidade de Teste' }).doc);
    expect(p1.texto).toContain('Cidade de Teste, 5 de outubro de 2026.');
  });

  it('a tabela vem DEPOIS do artigo indicado e os artigos seguintes depois dela', async () => {
    const d: DadosPortariaModelo = { ...base, artigos: [...base.artigos, { numero: '3º', conteudo: 'Revogam-se as disposições em contrário.' }],
      tabela: { colunas: [{ chave: 'nome', titulo: 'NOME' }], linhas: [{ nome: 'SERVIDOR-A' }, { nome: 'SERVIDOR-B' }] } };
    const [p1] = await lerPdf(gerar(d).doc);
    const t = p1.texto;
    expect(t.indexOf('Art. 1º')).toBeLessThan(t.indexOf('SERVIDOR-A'));
    expect(t.indexOf('SERVIDOR-B')).toBeLessThan(t.indexOf('Art. 2º'));
  });

  it('protocolo e unidade emissora aparecem no cabeçalho', async () => {
    const [p1] = await lerPdf(gerar({ ...base, protocolo: 'RH-2026-000999', unidadeEmissora: ['GABINETE DA PRESIDÊNCIA'] }).doc);
    expect(p1.texto).toContain('Protocolo: RH-2026-000999');
    expect(p1.texto).toContain('GABINETE DA PRESIDÊNCIA');
  });

  it('REVIEW FOCUS 1: último artigo termina rente ao fim da página → artigo, local e assinatura vão juntos', async () => {
    const texto = 'Texto do artigo número de teste com extensão razoável para ocupar linhas. '.repeat(4);
    for (let n = 14; n <= 22; n++) {
      const artigos = Array.from({ length: n }, (_, i) => ({ numero: `${i + 1}º`, conteudo: i === n - 1 ? 'ULTIMO-ARTIGO texto final' : texto }));
      const p = await lerPdf(gerar({ ...base, local: 'Cidade de Teste', artigos }).doc);
      const comAssinatura = p.find((x) => x.texto.includes('BELTRANO DE TESTE'))!;
      expect(comAssinatura.texto).toContain('ULTIMO-ARTIGO');
      expect(comAssinatura.texto).toContain('Cidade de Teste, 5 de outubro de 2026.');
    }
  });

  it('REVIEW FOCUS 6: nome com símbolos fora da fonte (emoji, ł, ✓) não quebra o PDF', async () => {
    const [p1] = await lerPdf(gerar({ ...base, artigos: [{ numero: '1º', conteudo: 'NOMEAR JOÃO ✓ ŁÓDŹ 😀 para o cargo.' }] }).doc);
    expect(p1.texto).toContain('PORTARIA Nº 12');
    expect(p1.texto).toContain('NOMEAR JOÃO');
  });

  it('data do documento inválida lança erro claro ao montar a linha de local e data', () => {
    expect(() => gerar({ ...base, local: 'Cidade de Teste', dataDocumento: '2026-13-40' })).toThrow(/Data inválida/);
  });

  it('o título da portaria preserva a caixa da numeração oficial (IDJuv não vira IDJUV)', async () => {
    const [p1] = await lerPdf(gerar({ ...base, titulo: 'PORTARIA Nº 12/IDJuv/PRESI/GAB/2026 DE 05 DE OUTUBRO DE 2026' }).doc);
    expect(p1.texto).toContain('PORTARIA Nº 12/IDJuv/PRESI/GAB/2026 DE 05 DE OUTUBRO DE 2026');
    expect(p1.texto).not.toContain('/IDJUV/');
  });

  it('REVIEW (importante): com a TABELA como último bloco do corpo, a assinatura nunca fica numa página sem artigo nem linha da tabela', async () => {
    for (let n = 1; n <= 45; n++) {
      const d: DadosPortariaModelo = {
        ...base, local: 'Cidade de Teste', resolve: false,
        artigos: [{ numero: '1º', conteudo: 'DESIGNAR os servidores abaixo relacionados:' }],
        tabela: { colunas: [{ chave: 'nome', titulo: 'NOME' }], linhas: Array.from({ length: n }, (_, i) => ({ nome: `SERVIDOR-${i + 1}` })) },
      };
      const p = await lerPdf(gerar(d).doc);
      const comAssinatura = p.find((x) => x.texto.includes('BELTRANO DE TESTE'))!;
      expect(comAssinatura.texto.includes('SERVIDOR-') || comAssinatura.texto.includes('Art. 1º'), `n=${n}`).toBe(true);
      expect(p.flatMap((x) => x.itens).filter((i) => /^SERVIDOR-\d+$/.test(i.str))).toHaveLength(n);
    }
  });
});
