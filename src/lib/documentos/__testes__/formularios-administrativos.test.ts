import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderizarDocumento } from '../core/renderizar';
import type { DadosFormulario } from '../modelos/formularios/comum';
import { ordemMissao, type OrdemMissaoPreenchida } from '../modelos/formularios/ordemMissao';
import { relatorioViagem, type RelatorioViagemPreenchido } from '../modelos/formularios/relatorioViagem';
import { requisicaoMaterial, type RequisicaoMaterialPreenchida } from '../modelos/formularios/requisicaoMaterial';
import { termoDemanda, type TermoDemandaPreenchido } from '../modelos/formularios/termoDemanda';
import { termoResponsabilidade, type TermoResponsabilidadePreenchido } from '../modelos/formularios/termoResponsabilidade';
import { REGISTRO } from '../registro';
import type { DocumentoModelo } from '../tipos';
import { emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf } from './lerPdf';

const ler = async <T,>(modelo: DocumentoModelo<DadosFormulario<T>>, dados: DadosFormulario<T>): Promise<string> =>
  (await lerPdf(renderizarDocumento(modelo, dados, marcaTeste, emissaoTeste).doc)).map((p) => p.texto).join(' ');

const semVazioCru = (t: string) => {
  expect(t).not.toContain('undefined');
  expect(t).not.toContain('null');
  expect(t).not.toContain('NaN');
};

/** Em branco: nada de dado nem de "—" onde deve haver linha para preencher. */
const emBrancoLimpo = (t: string) => {
  semVazioCru(t);
  expect(t).not.toContain('—');
  expect(t).toContain('_____');
  expect(t).toContain('____/____/________');
  expect(t).toContain('Nº ________/________');
};

const comum = { numero: 'XX1234/2026', local: 'Cidade Sede/XX', data: '20 de outubro de 2026', siglaOrgao: 'ORG' };

const demanda: TermoDemandaPreenchido = {
  solicitante: 'Fulana de Exemplo',
  cargo: 'Analista',
  setor: 'Diretoria de Exemplo',
  objeto: 'Aquisição de 20 bolas oficiais de futsal para os núcleos esportivos.',
  justificativa: 'Reposição do material desgastado nos núcleos, necessário à continuidade das aulas do programa.',
  quantidade: '20 unidades',
  valorEstimado: '3.000,00',
  prazoEntrega: '30 dias',
  prioridade: 'Alta',
  observacoes: 'Entrega no almoxarifado central.',
};

const missao: OrdemMissaoPreenchida = {
  servidor: 'Fulano de Exemplo',
  cargo: 'Coordenador',
  matricula: 'MAT-0042',
  destino: 'Cidade Exemplo/XX',
  objetivo: 'Acompanhar a etapa regional dos jogos escolares.',
  dataInicio: '2026-11-03',
  dataFim: '2026-11-06',
  meioTransporte: 'Veículo Oficial',
  diarias: '3.5',
  valorDiarias: '1.050,00',
  observacoes: 'Saída às 7h.',
};

const viagem: RelatorioViagemPreenchido = {
  servidor: 'Fulano de Exemplo',
  cargo: 'Coordenador',
  matricula: 'MAT-0042',
  destino: 'Cidade Exemplo/XX',
  dataInicio: '2026-11-03',
  dataFim: '2026-11-06',
  objetivoOriginal: 'Acompanhar a etapa regional dos jogos escolares.',
  atividadesRealizadas: 'Reunião com a organização local, vistoria dos ginásios e acompanhamento das 14 partidas.',
  resultadosObtidos: 'Etapa concluída sem ocorrências; relatório técnico entregue.',
  despesasRealizadas: 'Diárias: R$ 1.050,00. Combustível: R$ 320,00.',
  observacoes: '',
};

const requisicao: RequisicaoMaterialPreenchida = {
  solicitante: 'Fulana de Exemplo',
  cargo: 'Analista',
  setor: 'Diretoria de Exemplo',
  itens: '10 resmas de papel A4\n5 caixas de caneta azul\n2 grampeadores',
  justificativa: 'Consumo regular da diretoria no trimestre, estoque esgotado.',
  urgencia: 'Normal',
};

const responsabilidade: TermoResponsabilidadePreenchido = {
  servidor: 'Fulano de Exemplo',
  cargo: 'Coordenador',
  matricula: 'MAT-0042',
  setor: 'Diretoria de Exemplo',
  bens: 'Tombo 000123 - Notebook\nTombo 000124 - Projetor multimídia',
  localUtilizacao: 'Sala 3 da diretoria',
  observacoes: 'Bens em bom estado.',
};

describe('formulários administrativos no motor único', () => {
  it('estão no REGISTRO, família ficha', () => {
    expect(REGISTRO['formularios-termo-demanda']).toBe(termoDemanda);
    expect(REGISTRO['formularios-ordem-missao']).toBe(ordemMissao);
    expect(REGISTRO['formularios-relatorio-viagem']).toBe(relatorioViagem);
    expect(REGISTRO['formularios-requisicao-material']).toBe(requisicaoMaterial);
    expect(REGISTRO['formularios-termo-responsabilidade']).toBe(termoResponsabilidade);
    for (const m of [termoDemanda, ordemMissao, relatorioViagem, requisicaoMaterial, termoResponsabilidade]) expect(m.familia).toBe('ficha');
  });

  describe('termo de demanda', () => {
    it('preenchido mostra os dados da tela', async () => {
      const t = await ler(termoDemanda, { preenchido: demanda, ...comum });
      expect(t).toContain('TERMO DE DEMANDA');
      expect(t).toContain('Nº XX1234/2026');
      for (const v of ['Fulana de Exemplo', 'Analista', 'Diretoria de Exemplo', 'bolas oficiais de futsal', 'Reposição do material', '20 unidades', '3.000,00', '30 dias', 'Alta', 'Entrega no almoxarifado central.']) {
        expect(t).toContain(v);
      }
      expect(t).toContain('Cidade Sede/XX, 20 de outubro de 2026.');
      expect(t).toContain('Chefia imediata');
      expect(t).not.toContain('E-mail'); // a tela não pede: só no modelo em branco
      expect(t).not.toContain('(   )');
      semVazioCru(t);
    });

    it('sem observações, a seção não sai', async () => {
      const t = await ler(termoDemanda, { preenchido: { ...demanda, observacoes: '' }, ...comum });
      expect(t).not.toContain('Observações');
    });

    it('em branco: rótulos, linhas e opções para marcar', async () => {
      const t = await ler(termoDemanda, { local: 'Cidade Sede/XX' });
      for (const r of ['Nome', 'Cargo/função', 'Setor/unidade', 'E-mail', 'Telefone', 'Objeto da demanda', 'Justificativa', 'Quantidade', 'Valor estimado (R$)', 'Prazo de entrega', '4. Observações', 'Solicitante']) {
        expect(t).toContain(r);
      }
      expect(t).toMatch(/\(\s+\) Baixa/);
      expect(t).toMatch(/\(\s+\) Crítica/);
      emBrancoLimpo(t);
    });
  });

  describe('ordem de missão', () => {
    it('preenchida mostra os dados, datas formatadas e a autorização', async () => {
      const t = await ler(ordemMissao, { preenchido: missao, ...comum });
      expect(t).toContain('ORDEM DE MISSÃO');
      for (const v of ['Fulano de Exemplo', 'MAT-0042', 'Cidade Exemplo/XX', 'etapa regional', '03/11/2026', '06/11/2026', 'Veículo Oficial', '3.5', '1.050,00', 'Saída às 7h.']) {
        expect(t).toContain(v);
      }
      expect(t).toContain('Autorizo a realização da missão acima descrita, nos termos da legislação vigente.');
      expect(t).toContain('Ordenador de despesa');
      expect(t).not.toContain('Unidade de lotação');
      expect(t).not.toContain('Passagem aérea');
      semVazioCru(t);
    });

    it('em branco', async () => {
      const t = await ler(ordemMissao, {});
      for (const r of ['Unidade de lotação', 'Destino (cidade/UF)', 'Objetivo/finalidade', 'Data/hora de saída', 'Meio de transporte', 'Valor unitário (R$)', 'Valor total das diárias (R$)', 'Passagem aérea', 'Ordenador de despesa']) {
        expect(t).toContain(r);
      }
      expect(t).toMatch(/\(\s+\) Sim/);
      emBrancoLimpo(t);
    });
  });

  describe('relatório de viagem', () => {
    it('preenchido mostra os dados, o período e a declaração com a sigla do tenant', async () => {
      const t = await ler(relatorioViagem, { preenchido: viagem, ...comum });
      expect(t).toContain('RELATÓRIO DE VIAGEM');
      for (const v of ['Fulano de Exemplo', 'Coordenador', '03/11/2026 a 06/11/2026', 'vistoria dos ginásios', 'Etapa concluída', 'Combustível']) {
        expect(t).toContain(v);
      }
      expect(t).toContain('IN de Diárias do ORG');
      expect(t).not.toContain('6. Observações');
      semVazioCru(t);
    });

    it('sem sigla cadastrada, a declaração cita "do órgão"', async () => {
      const t = await ler(relatorioViagem, { preenchido: viagem, ...comum, siglaOrgao: undefined });
      expect(t).toContain('IN de Diárias do órgão');
    });

    it('em branco', async () => {
      const t = await ler(relatorioViagem, {});
      for (const r of ['Nº da ordem de missão', 'Período', 'Objetivo original', '3. Atividades realizadas', '4. Resultados obtidos', '5. Despesas realizadas', '6. Observações']) {
        expect(t).toContain(r);
      }
      emBrancoLimpo(t);
    });
  });

  describe('requisição de material', () => {
    it('preenchida mostra a lista de materiais, a justificativa e a urgência', async () => {
      const t = await ler(requisicaoMaterial, { preenchido: requisicao, ...comum });
      expect(t).toContain('REQUISIÇÃO DE MATERIAL');
      for (const v of ['10 resmas de papel A4', '2 grampeadores', 'Consumo regular', 'Normal', 'Responsável pelo almoxarifado']) {
        expect(t).toContain(v);
      }
      expect(t).not.toContain('Descrição do material');
      semVazioCru(t);
    });

    it('em branco: tabela de materiais vazia, sem "—"', async () => {
      const t = await ler(requisicaoMaterial, {});
      for (const r of ['Qtd.', 'Unid.', 'Descrição do material', 'Obs.', '3. Justificativa', 'Urgência']) expect(t).toContain(r);
      expect(t).not.toContain('Nenhum registro');
      expect(t).toMatch(/\(\s+\) Programada/);
      expect(t).not.toContain('Observações'); // o modelo em branco antigo não tinha
      emBrancoLimpo(t);
    });
  });

  describe('termo de responsabilidade patrimonial', () => {
    it('preenchido mostra os bens, o local e o compromisso com a sigla do tenant', async () => {
      const t = await ler(termoResponsabilidade, { preenchido: responsabilidade, ...comum });
      expect(t).toContain('TERMO DE RESPONSABILIDADE PATRIMONIAL');
      for (const v of ['Fulano de Exemplo', 'MAT-0042', 'Tombo 000123 - Notebook', 'Projetor multimídia', 'Sala 3 da diretoria', 'Bens em bom estado.', 'Patrimônio']) {
        expect(t).toContain(v);
      }
      expect(t).toContain('IN de Patrimônio do ORG');
      expect(t).toContain('Termo de compromisso');
      semVazioCru(t);
    });

    it('em branco: tabela de bens vazia', async () => {
      const t = await ler(termoResponsabilidade, {});
      for (const r of ['Nº tombo', 'Descrição do bem', 'Estado', 'Local', 'Termo de compromisso', 'Responsável']) expect(t).toContain(r);
      expect(t).not.toContain('Local de utilização'); // vai por bem, na coluna Local
      emBrancoLimpo(t);
    });
  });

  it('nome do arquivo: com o número (sem barra) ou de modelo', () => {
    expect(termoDemanda.nomeArquivo({ preenchido: demanda, numero: 'TD1234/2026' })).toBe('Termo_Demanda_TD1234-2026.pdf');
    expect(termoDemanda.nomeArquivo({})).toBe('Modelo_Termo_Demanda.pdf');
    expect(termoResponsabilidade.nomeArquivo({})).toBe('Modelo_Termo_Responsabilidade.pdf');
  });

  // Amostras para inspeção visual: DOCUMENTOS_AMOSTRAS=<pasta> npx vitest run …/formularios-administrativos.test.ts
  it.skipIf(!process.env.DOCUMENTOS_AMOSTRAS)('grava as amostras preenchidas e em branco', () => {
    const saida = process.env.DOCUMENTOS_AMOSTRAS!;
    mkdirSync(saida, { recursive: true });
    const gravar = <T,>(nome: string, modelo: DocumentoModelo<DadosFormulario<T>>, dados: DadosFormulario<T>) =>
      writeFileSync(join(saida, nome), Buffer.from(renderizarDocumento(modelo, dados, marcaTeste, emissaoTeste).doc.output('arraybuffer')));
    const branco = { local: 'Cidade Sede/XX', siglaOrgao: 'ORG' };
    gravar('termo-demanda.pdf', termoDemanda, { preenchido: demanda, ...comum, numero: 'TD1234/2026' });
    gravar('termo-demanda-em-branco.pdf', termoDemanda, branco);
    gravar('ordem-missao.pdf', ordemMissao, { preenchido: missao, ...comum, numero: 'OM2345/2026' });
    gravar('ordem-missao-em-branco.pdf', ordemMissao, branco);
    gravar('relatorio-viagem.pdf', relatorioViagem, { preenchido: viagem, ...comum, numero: 'RV3456/2026' });
    gravar('relatorio-viagem-em-branco.pdf', relatorioViagem, branco);
    gravar('requisicao-material.pdf', requisicaoMaterial, { preenchido: requisicao, ...comum, numero: 'RM4567/2026' });
    gravar('requisicao-material-em-branco.pdf', requisicaoMaterial, branco);
    gravar('termo-responsabilidade.pdf', termoResponsabilidade, { preenchido: responsabilidade, ...comum, numero: 'TR5678/2026' });
    gravar('termo-responsabilidade-em-branco.pdf', termoResponsabilidade, branco);
  });
});
