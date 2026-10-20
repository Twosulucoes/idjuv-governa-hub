import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderizarDocumento } from '../core/renderizar';
import { declaracaoAcumulacao } from '../modelos/declaracoes/acumulacao';
import { declaracaoBens } from '../modelos/declaracoes/bens';
import type { DadosDeclaracao, DeclaranteServidor } from '../modelos/declaracoes/comum';
import { relacaoDocumentos } from '../modelos/declaracoes/relacaoDocumentos';
import { declaracaoResidencia } from '../modelos/declaracoes/residencia';
import { REGISTRO } from '../registro';
import type { DocumentoModelo } from '../tipos';
import { emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf } from './lerPdf';

const ler = <D,>(modelo: DocumentoModelo<D>, dados: D) => lerPdf(renderizarDocumento(modelo, dados, marcaTeste, emissaoTeste).doc);
const texto = async <D,>(modelo: DocumentoModelo<D>, dados: D) => (await ler(modelo, dados)).map((p) => p.texto).join(' ');
const semVazioCru = (t: string) => {
  expect(t).not.toContain('undefined');
  expect(t).not.toContain('null');
  expect(t).not.toContain('NaN');
};

const servidor: DeclaranteServidor = {
  nome_completo: 'Maria de Exemplo Souza',
  cpf: '12345678901',
  rg: '1234567',
  rg_orgao_expedidor: 'SSP',
  cargo_nome: 'Assessor Técnico',
  unidade_nome: 'Divisão de Pessoal',
  naturalidade_cidade: 'Cidade Exemplo',
  naturalidade_uf: 'XX',
  endereco_logradouro: 'Rua de Exemplo',
  endereco_numero: '100',
  endereco_complemento: 'Apto 2',
  endereco_bairro: 'Centro',
  endereco_cidade: 'Cidade Exemplo',
  endereco_uf: 'XX',
  endereco_cep: '00000-000',
  acumula_cargo: true,
  acumulo_descricao: 'Professora na rede municipal, 20h',
};

const preenchida: DadosDeclaracao = { servidor, orgao: 'Órgão de Exemplo – OEX', local: 'Cidade Sede/XX', data: '20 de outubro de 2026' };
const emBranco: DadosDeclaracao = { orgao: 'Órgão de Exemplo – OEX', local: 'Cidade Sede/XX' };

describe('declarações do servidor no motor único', () => {
  it('estão no REGISTRO, família ficha', () => {
    expect(REGISTRO['declaracoes-acumulacao']).toBe(declaracaoAcumulacao);
    expect(REGISTRO['declaracoes-bens']).toBe(declaracaoBens);
    expect(REGISTRO['declaracoes-residencia']).toBe(declaracaoResidencia);
    expect(REGISTRO['declaracoes-relacao-documentos']).toBe(relacaoDocumentos);
    for (const m of [declaracaoAcumulacao, declaracaoBens, declaracaoResidencia, relacaoDocumentos]) expect(m.familia).toBe('ficha');
  });

  describe('acumulação de cargos', () => {
    it('preenchida: nome, CPF, cargo, órgão, opção marcada e assinatura', async () => {
      const t = await texto(declaracaoAcumulacao, preenchida);
      expect(t).toContain('DECLARAÇÃO DE ACUMULAÇÃO DE CARGOS');
      expect(t).toContain('Maria de Exemplo Souza');
      expect(t).toContain('123.456.789-01');
      expect(t).toContain('1234567 - SSP');
      expect(t).toContain('Assessor Técnico');
      expect(t).toContain('Divisão de Pessoal');
      expect(t).toContain('Órgão de Exemplo – OEX');
      expect(t).toMatch(/\( X \)\s+ACUMULO licitamente/);
      expect(t).toMatch(/\(\s+\)\s+NÃO ACUMULO/);
      expect(t).toContain('Professora na rede municipal, 20h');
      expect(t).toContain('art. 299 do Código Penal');
      expect(t).toContain('Cidade Sede/XX, 20 de outubro de 2026.');
      expect(t).toContain('CPF: 123.456.789-01');
      semVazioCru(t);
    });

    it('preenchida sem acúmulo marca "não acumulo"; sem a informação, nenhuma opção', async () => {
      const nao = await texto(declaracaoAcumulacao, { ...preenchida, servidor: { ...servidor, acumula_cargo: false } });
      expect(nao).toMatch(/\( X \)\s+NÃO ACUMULO/);
      expect(nao).not.toContain('Professora na rede municipal');
      const semInfo = await texto(declaracaoAcumulacao, { servidor: { nome_completo: 'José Mínimo' } });
      expect(semInfo).not.toContain('( X )');
      semVazioCru(semInfo);
    });

    it('em branco: linhas para preencher, sem dados nem "undefined"', async () => {
      const t = await texto(declaracaoAcumulacao, emBranco);
      expect(t).toContain('Nome do(a) servidor(a)');
      expect(t).toContain('_____');
      expect(t).toContain('______ de ____________________ de ________');
      expect(t).toContain('Assinatura do(a) declarante');
      expect(t).not.toContain('( X )');
      semVazioCru(t);
      semVazioCru(await texto(declaracaoAcumulacao, {}));
    });
  });

  describe('bens e valores', () => {
    it('preenchida: identificação com naturalidade e endereço, quadro e total', async () => {
      const t = await texto(declaracaoBens, preenchida);
      expect(t).toContain('DECLARAÇÃO DE BENS E VALORES');
      expect(t).toContain('Maria de Exemplo Souza');
      expect(t).toContain('123.456.789-01');
      expect(t).toContain('Assessor Técnico');
      expect(t).toContain('Cidade Exemplo/XX');
      expect(t).toContain('Rua de Exemplo, nº 100, Apto 2, Bairro Centro, Cidade Exemplo/XX, CEP 00000-000');
      expect(t).toContain('Descrição do bem/valor');
      expect(t).toContain('TOTAL');
      expect(t).toContain('NÃO POSSUO');
      semVazioCru(t);
    });

    it('em branco: sem "undefined"/"null"/"NaN"', async () => {
      const t = await texto(declaracaoBens, emBranco);
      expect(t).toContain('Residente e domiciliado(a) em');
      expect(t).toContain('_____');
      semVazioCru(t);
    });
  });

  describe('residência', () => {
    it('preenchida: nome em caixa alta, CPF, RG e endereço', async () => {
      const t = await texto(declaracaoResidencia, preenchida);
      expect(t).toContain('DECLARAÇÃO DE RESIDÊNCIA');
      expect(t).toContain('MARIA DE EXEMPLO SOUZA');
      expect(t).toContain('123.456.789-01');
      expect(t).toContain('Rua de Exemplo, nº 100, Apto 2');
      expect(t).toContain('Cidade Exemplo/XX');
      expect(t).toContain('00000-000');
      semVazioCru(t);
    });

    it('preenchida sem endereço nem RG: linha para preencher, sem UF inventada', async () => {
      const t = await texto(declaracaoResidencia, { servidor: { nome_completo: 'José Mínimo', cpf: '12345678901' } });
      expect(t).toContain('JOSÉ MÍNIMO');
      expect(t).not.toContain('portador(a) do RG');
      expect(t).toContain('_____');
      semVazioCru(t);
    });

    it('em branco: sem "undefined"/"null"/"NaN"', async () => {
      const t = await texto(declaracaoResidencia, {});
      expect(t).toContain('_____');
      semVazioCru(t);
    });
  });

  it('relação de documentos: órgão do tenant e as listas do antigo', async () => {
    const t = await texto(relacaoDocumentos, { orgao: 'Órgão de Exemplo – OEX' });
    expect(t).toContain('DOCUMENTOS OBRIGATÓRIOS PARA CADASTRO');
    expect(t).toContain('cadastro funcional no(a) Órgão de Exemplo – OEX');
    expect(t).toContain('Cópia do CPF');
    expect(t).toContain('Declaração de Bens e Valores');
    expect(t).toContain('tradução juramentada');
    semVazioCru(t);
    semVazioCru(await texto(relacaoDocumentos, {}));
  });

  it('nome do arquivo: com o nome do servidor ou de modelo', () => {
    expect(declaracaoAcumulacao.nomeArquivo(preenchida)).toBe('Declaracao_Acumulacao_Maria_de_Exemplo_Souza.pdf');
    expect(declaracaoBens.nomeArquivo({})).toBe('Modelo_Declaracao_Bens.pdf');
    expect(declaracaoResidencia.nomeArquivo({})).toBe('Modelo_Declaracao_Residencia.pdf');
  });

  // Amostras para inspeção visual: DOCUMENTOS_AMOSTRAS=<pasta> npx vitest run …/declaracoes.test.ts
  it.skipIf(!process.env.DOCUMENTOS_AMOSTRAS)('grava as amostras preenchidas e em branco', () => {
    const saida = process.env.DOCUMENTOS_AMOSTRAS!;
    mkdirSync(saida, { recursive: true });
    const gravar = <D,>(nome: string, modelo: DocumentoModelo<D>, dados: D) =>
      writeFileSync(join(saida, nome), Buffer.from(renderizarDocumento(modelo, dados, marcaTeste, emissaoTeste).doc.output('arraybuffer')));
    gravar('declaracoes-acumulacao-preenchida.pdf', declaracaoAcumulacao, preenchida);
    gravar('declaracoes-acumulacao-em-branco.pdf', declaracaoAcumulacao, emBranco);
    gravar('declaracoes-bens-preenchida.pdf', declaracaoBens, preenchida);
    gravar('declaracoes-bens-em-branco.pdf', declaracaoBens, emBranco);
    gravar('declaracoes-residencia-preenchida.pdf', declaracaoResidencia, preenchida);
    gravar('declaracoes-residencia-em-branco.pdf', declaracaoResidencia, emBranco);
    gravar('declaracoes-relacao-documentos.pdf', relacaoDocumentos, { orgao: 'Órgão de Exemplo – OEX' });
  });
});
