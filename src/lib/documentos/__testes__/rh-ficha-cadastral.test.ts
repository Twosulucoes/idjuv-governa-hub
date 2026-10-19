import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderizarDocumento } from '../core/renderizar';
import { fichaCadastral, type DadosFichaCadastral, type ServidorFichaCadastral } from '../modelos/rh/fichaCadastral';
import { REGISTRO } from '../registro';
import { emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf } from './lerPdf';

const ler = (dados: DadosFichaCadastral) => lerPdf(renderizarDocumento(fichaCadastral, dados, marcaTeste, emissaoTeste).doc);
const textoTodo = (p: { texto: string }[]) => p.map((x) => x.texto).join(' ');
const semVazioCru = (t: string) => {
  expect(t).not.toContain('undefined');
  expect(t).not.toContain('null');
  expect(t).not.toContain('NaN');
};

function servidorExemplo(dependentes = 2): ServidorFichaCadastral {
  return {
    nome_completo: 'Maria de Exemplo Souza',
    nome_social: 'Mari Exemplo',
    cpf: '12345678901',
    rg: '1234567',
    rg_orgao_expedidor: 'SSP',
    rg_uf: 'XX',
    rg_data_emissao: '2010-05-04',
    data_nascimento: '1990-02-15',
    sexo: 'F',
    estado_civil: 'Casada',
    nacionalidade: 'Brasileira',
    naturalidade_cidade: 'Cidade Exemplo',
    naturalidade_uf: 'XX',
    titulo_eleitor: '000011112222',
    titulo_zona: '001',
    titulo_secao: '0123',
    pis_pasep: '123.45678.90-1',
    ctps_numero: '98765',
    ctps_serie: '0001',
    ctps_uf: 'XX',
    cnh_numero: '55544433322',
    cnh_categoria: 'B',
    cnh_validade: '2030-01-31',
    email_pessoal: 'maria@exemplo.com',
    email_institucional: 'maria@orgao.exemplo',
    telefone_celular: '(00) 90000-0000',
    contato_emergencia_nome: 'João Exemplo',
    contato_emergencia_parentesco: 'Cônjuge',
    endereco_logradouro: 'Rua de Exemplo',
    endereco_numero: '100',
    endereco_bairro: 'Centro',
    endereco_cidade: 'Cidade Exemplo',
    endereco_uf: 'XX',
    endereco_cep: '00000-000',
    matricula: 'MAT-0042',
    vinculo: 'comissionado',
    situacao: 'ativo',
    cargo_nome: 'Assessor Técnico',
    cargo_sigla: 'AT-1',
    unidade_nome: 'Divisão de Pessoal',
    unidade_sigla: 'DIPES',
    carga_horaria: 40,
    regime_juridico: 'Estatutário',
    data_admissao: '2020-03-01',
    data_posse: '2020-03-02',
    data_exercicio: '2020-03-03',
    escolaridade: 'Superior completo',
    formacao_academica: 'Administração',
    instituicao_ensino: 'Universidade de Exemplo',
    ano_conclusao: 2012,
    cursos_especializacao: ['Gestão Pública', 'Direito Administrativo'],
    banco_codigo: '001',
    banco_nome: 'Banco Exemplo',
    banco_agencia: '1234-5',
    banco_conta: '99999-9',
    banco_tipo_conta: 'Corrente',
    remuneracao_bruta: 5000,
    gratificacoes: 1000,
    descontos: 800,
    acumula_cargo: true,
    acumulo_descricao: 'Professora na rede municipal, 20h',
    declaracao_bens_data: '2020-03-01',
    declaracao_acumulacao_data: null,
    dependentes: Array.from({ length: dependentes }, (_, i) => ({
      nome: `Dependente ${i + 1} de Exemplo`,
      data_nascimento: '2015-06-10',
      cpf: '98765432100',
      parentesco: 'Filho(a)',
    })),
    observacoes: 'Servidora com processo de progressão em andamento.',
  };
}

describe('ficha cadastral do servidor no motor único', () => {
  it('está no REGISTRO com o próprio tipo e família ficha', () => {
    expect(REGISTRO['rh-ficha-cadastral']).toBe(fichaCadastral);
    expect(fichaCadastral.familia).toBe('ficha');
  });

  it('preenchida: título, seções, campos e valores formatados', async () => {
    const t = textoTodo(await ler({ servidor: servidorExemplo(), local: 'Cidade Sede/XX', data: '19 de outubro de 2026' }));
    expect(t).toContain('FICHA CADASTRAL DO SERVIDOR');
    for (const s of ['Identificação do servidor', 'Documentos', 'Endereço', 'Contato', 'Dados funcionais', 'Formação acadêmica', 'Dados bancários', 'Dependentes', 'Remuneração', 'Declarações', 'Observações']) {
      expect(t).toContain(s);
    }
    expect(t).toContain('Maria de Exemplo Souza');
    expect(t).toContain('Mari Exemplo');
    expect(t).toContain('123.456.789-01');
    expect(t).toContain('15/02/1990');
    expect(t).toContain('SSP/XX');
    expect(t).toContain('Feminino');
    expect(t).toContain('Comissionado');
    expect(t).toContain('Ativo');
    expect(t).toContain('Assessor Técnico (AT-1)');
    expect(t).toContain('Divisão de Pessoal (DIPES)');
    expect(t).toContain('40h/semana');
    expect(t).toContain('02/03/2020'); // posse
    expect(t).toContain('Gestão Pública; Direito Administrativo');
    expect(t).toContain('(001) Banco Exemplo');
    expect(t).toMatch(/R\$\s?5\.200,00/); // líquido = 5000 + 1000 - 800
    expect(t).toContain('Professora na rede municipal');
    expect(t).toContain('Entregue em 01/03/2020');
    expect(t).toContain('Não entregue');
    expect(t).toContain('Dependente 1 de Exemplo');
    expect(t).not.toContain('987.654.321-00'); // CPF de dependente não sai no PDF (LGPD)
    expect(t).toContain('Cidade Sede/XX, 19 de outubro de 2026.');
    expect(t).toContain('Assinatura do(a) servidor(a)');
    expect(t).toContain('Responsável pelo recebimento');
    expect(t).not.toContain('Modelo para preenchimento');
    semVazioCru(t);
  });

  it('preenchida com cadastro mínimo: vazio vira traço, sem nome social, remuneração nem observações', async () => {
    const t = textoTodo(await ler({ servidor: { nome_completo: 'José Mínimo', situacao: 'ativo' } }));
    expect(t).toContain('José Mínimo');
    expect(t).toContain('—');
    expect(t).toContain('Nenhum dependente cadastrado.');
    expect(t).not.toContain('Nome social');
    expect(t).not.toContain('Observações');
    expect(t).not.toContain('Descrição do acúmulo');
    semVazioCru(t);
  });

  it('em branco: rótulos com linha para preencher, sem dados nem controle interno do RH', async () => {
    const p = await ler({});
    const t = textoTodo(p);
    expect(t).toContain('FICHA CADASTRAL DO SERVIDOR');
    expect(t).toContain('Modelo para preenchimento');
    for (const r of ['Nome completo', 'Nome social (se houver)', 'CPF', 'Matrícula', 'Título de eleitor', 'Logradouro', 'E-mail pessoal', 'Vínculo', 'Data de posse', 'Escolaridade', 'Banco', 'Parentesco', 'Se sim, especificar']) {
      expect(t).toContain(r);
    }
    expect(t).toContain('_____');
    expect(t).toMatch(/\(\s*\) Sim/);
    expect(t).toContain('____/____/________');
    expect(t).not.toContain('Remuneração');
    expect(t).not.toContain('Não entregue');
    expect(t).not.toContain('Nenhum dependente');
    semVazioCru(t);
  });

  it('dependentes em grande número atravessam página repetindo o cabeçalho da tabela', async () => {
    const p = await ler({ servidor: servidorExemplo(40) });
    expect(p.length).toBeGreaterThan(2);
    const t = textoTodo(p);
    expect(t).toContain('Dependente 40 de Exemplo');
    const paginasComDependentes = p.filter((x) => x.texto.includes('Dependente') && x.texto.includes('Parentesco'));
    expect(paginasComDependentes.length).toBeGreaterThan(1);
  });

  it('imprime o protocolo do RH quando houver e nada quando não houver', async () => {
    const com = textoTodo(await ler({ servidor: servidorExemplo(0), protocolo: 'RH-2026-000123' }));
    expect(com).toContain('RH-2026-000123');
    const sem = textoTodo(await ler({ servidor: servidorExemplo(0) }));
    expect(sem).not.toContain('RH-');
  });

  it('nome do arquivo: com o nome do servidor ou de modelo', () => {
    expect(fichaCadastral.nomeArquivo({ servidor: { nome_completo: 'Maria de Exemplo' } })).toBe('Ficha_Cadastral_Maria_de_Exemplo.pdf');
    expect(fichaCadastral.nomeArquivo({})).toBe('Modelo_Ficha_Cadastral.pdf');
  });

  // Amostras para inspeção visual: DOCUMENTOS_AMOSTRAS=<pasta> npx vitest run …/rh-ficha-cadastral.test.ts
  it.skipIf(!process.env.DOCUMENTOS_AMOSTRAS)('grava as amostras preenchida e em branco', () => {
    const saida = process.env.DOCUMENTOS_AMOSTRAS!;
    mkdirSync(saida, { recursive: true });
    const gravar = (nome: string, dados: DadosFichaCadastral) =>
      writeFileSync(join(saida, nome), Buffer.from(renderizarDocumento(fichaCadastral, dados, marcaTeste, emissaoTeste).doc.output('arraybuffer')));
    gravar('rh-ficha-cadastral-preenchida.pdf', { servidor: servidorExemplo(3), protocolo: 'RH-2026-000123', local: 'Cidade Sede/XX', data: '19 de outubro de 2026' });
    gravar('rh-ficha-cadastral-em-branco.pdf', { local: 'Cidade Sede/XX' });
  });
});
