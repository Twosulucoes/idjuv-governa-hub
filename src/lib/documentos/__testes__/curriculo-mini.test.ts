import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderizarDocumento } from '../core/renderizar';
import { fichaMiniCurriculo, type DadosMiniCurriculo } from '../modelos/curriculo/miniCurriculo';
import { REGISTRO } from '../registro';
import { emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf } from './lerPdf';

const dadosMini = (): DadosMiniCurriculo => ({
  local: 'Cidade de Exemplo/EX',
  data: '19 de outubro de 2026',
  candidato: {
    codigo_acesso: 'PC-2026-0042',
    nome_completo: 'Joana de Exemplo Pereira',
    nome_social: '',
    data_nascimento: '1995-04-12',
    sexo: 'Feminino',
    estado_civil: 'Solteiro(a)',
    nacionalidade: 'Brasileira',
    naturalidade_cidade: 'Cidade de Exemplo',
    naturalidade_uf: 'EX',
    cpf: '12345678901',
    rg: '1234567',
    rg_orgao_expedidor: 'SSP',
    rg_uf: 'EX',
    rg_data_emissao: '2013-01-20',
    titulo_eleitor: '000011112222',
    titulo_zona: '001',
    titulo_secao: '0123',
    email: 'joana.exemplo@example.com',
    telefone_celular: '(00) 90000-0000',
    endereco_logradouro: 'Rua das Palmeiras de Exemplo',
    endereco_numero: '100',
    endereco_bairro: 'Centro',
    endereco_cidade: 'Cidade de Exemplo',
    endereco_uf: 'EX',
    endereco_cep: '00000-000',
    pis_pasep: '123.45678.90-1',
    escolaridade: 'Superior Completo',
    formacao_academica: 'Educação Física',
    instituicao_ensino: 'Universidade de Exemplo',
    ano_conclusao: 2018,
    cnh_numero: '01234567890',
    cnh_categoria: 'AB',
    cnh_validade: '2030-05-01',
    banco_nome: 'Banco de Exemplo',
    banco_agencia: '0001',
    banco_conta: '12345-6',
    banco_tipo_conta: 'Corrente',
    habilidades: ['Organização de eventos', 'Arbitragem', 'Primeiros socorros'],
    idiomas: [{ idioma: 'Inglês', nivel: 'intermediario' }],
    experiencia_resumo: 'Cinco anos coordenando escolinhas esportivas.',
    doc_rg: true,
    doc_cpf: true,
    doc_diploma: true,
    dependentes: [{ nome: 'Pedro de Exemplo Pereira', cpf: '98765432100', data_nascimento: '2019-02-02', parentesco: 'Filho(a)' }],
  },
});

const ler = (d: DadosMiniCurriculo) => lerPdf(renderizarDocumento(fichaMiniCurriculo, d, marcaTeste, emissaoTeste).doc);
const textoTodo = (p: { texto: string }[]) => p.map((x) => x.texto).join(' ');
const semVazioCru = (t: string) => {
  expect(t).not.toContain('undefined');
  expect(t).not.toContain('null');
  expect(t).not.toContain('NaN');
};

describe('mini-currículo (pré-cadastro) no motor único', () => {
  it('está no REGISTRO com o tipo do próprio modelo', () => {
    expect(REGISTRO['curriculo-mini-curriculo']).toBe(fichaMiniCurriculo);
    expect(fichaMiniCurriculo.familia).toBe('ficha');
  });

  it('título, código de acesso, seções e campos principais', async () => {
    const t = textoTodo(await ler(dadosMini()));
    expect(t).toContain('FORMULÁRIO DE PRÉ-CADASTRO');
    expect(t).toContain('Código de acesso: PC-2026-0042');
    for (const s of ['1. Dados pessoais', '2. Documentos pessoais', '3. Contato e endereço', '4. Documentos previdenciários',
      '5. Escolaridade / habilitação', '6. Dados bancários', '7. Aptidões e habilidades', '8. Checklist de documentos', '9. Dependentes']) {
      expect(t).toContain(s);
    }
    expect(t).toContain('Joana de Exemplo Pereira');
    expect(t).toContain('123.456.789-01');
    expect(t).toContain('12/04/1995');
    expect(t).toContain('SSP/EX');
    expect(t).toContain('001/0123');
    expect(t).toContain('joana.exemplo@example.com');
    expect(t).toContain('Cidade de Exemplo/EX');
    expect(t).toContain('Inglês (intermediario)');
    expect(t).toContain('Primeiros socorros');
    expect(t).toContain('Banco de Exemplo');
    expect(t).toContain('987.654.321-00');
    expect(t).toContain('Assinatura do(a) candidato(a)');
    expect(t).toContain('19 de outubro de 2026');
    semVazioCru(t);
  });

  it('checklist vira Sim/Não por documento', async () => {
    const p = await ler(dadosMini());
    const itens = p.flatMap((x) => x.itens);
    const linhaDe = (rotulo: string) => {
      const item = itens.find((i) => i.str.startsWith(rotulo))!;
      return itens.filter((i) => Math.abs(i.y - item.y) < 1).map((i) => i.str).join(' ');
    };
    expect(linhaDe('RG - Documento')).toContain('Sim');
    expect(linhaDe('Título de Eleitor')).toContain('Não');
    expect(linhaDe('Certidão de Quitação')).toContain('Não');
  });

  it('candidato vazio (rascunho) sai com traços, sem "undefined/null/NaN" e sem seções opcionais', async () => {
    const d: DadosMiniCurriculo = { data: '19 de outubro de 2026', candidato: {} };
    const t = textoTodo(await ler(d));
    expect(t).toContain('FORMULÁRIO DE PRÉ-CADASTRO');
    expect(t).not.toContain('Código de acesso');
    expect(t).toContain('—');
    expect(t).not.toContain('9. Dependentes');
    expect(t).not.toContain('Idiomas');
    expect(t).not.toContain('Resumo de experiência');
    expect(t).toContain('19 de outubro de 2026.');
    semVazioCru(t);
    expect(fichaMiniCurriculo.nomeArquivo(d)).toBe('pre-cadastro-rascunho.pdf');
  });

  it('resumo de experiência muito longo atravessa páginas sem perder o fim', async () => {
    const d = dadosMini();
    d.candidato.experiencia_resumo = Array.from({ length: 160 }, (_, i) => `Atividade ${i + 1} com equipes de base.`).join(' ') + ' FIM-DO-RESUMO';
    const p = await ler(d);
    expect(p.length).toBeGreaterThan(2);
    const t = textoTodo(p);
    expect(t).toContain('FIM-DO-RESUMO');
    expect(p[p.length - 1].texto).toContain('Assinatura do(a) candidato(a)');
    semVazioCru(t);
  });

  it('nome do arquivo segue o do gerador antigo', () => {
    expect(fichaMiniCurriculo.nomeArquivo(dadosMini())).toBe('pre-cadastro-PC-2026-0042.pdf');
  });

  // Amostra para inspeção visual (pdftoppm). Sem DOCUMENTOS_AMOSTRAS, não faz nada.
  it.skipIf(!process.env.DOCUMENTOS_AMOSTRAS)('grava amostras do mini-currículo', () => {
    const saida = process.env.DOCUMENTOS_AMOSTRAS!;
    mkdirSync(saida, { recursive: true });
    const gravar = (nome: string, d: DadosMiniCurriculo) =>
      writeFileSync(join(saida, nome), Buffer.from(renderizarDocumento(fichaMiniCurriculo, d, marcaTeste, emissaoTeste).doc.output('arraybuffer')));
    gravar('curriculo-mini-curriculo.pdf', dadosMini());
    gravar('curriculo-mini-curriculo-vazio.pdf', { data: '19 de outubro de 2026', candidato: {} });
  });
});
