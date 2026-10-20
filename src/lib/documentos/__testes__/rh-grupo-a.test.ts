import { describe, expect, it } from 'vitest';
import { renderizarDocumento } from '../core/renderizar';
import { fichaHistoricoFuncional } from '../modelos/rh/historicoFuncional';
import { relatorioServidoresDiretoria } from '../modelos/rh/servidoresDiretoria';
import { relatorioServidoresPortarias } from '../modelos/rh/servidoresPortarias';
import { relatorioServidoresVinculo } from '../modelos/rh/servidoresVinculo';
import { relatorioVagasCargo } from '../modelos/rh/vagasCargo';
import { REGISTRO } from '../registro';
import type { DocumentoModelo } from '../tipos';
import { emissaoTeste, marcaTeste } from './fixtures';
import { dadosDiretoria, dadosHistorico, dadosPortarias, dadosVagas, dadosVinculo } from './fixturesRhGrupoA';
import { lerPdf } from './lerPdf';

const ler = <D,>(modelo: DocumentoModelo<D>, dados: D) => lerPdf(renderizarDocumento(modelo, dados, marcaTeste, emissaoTeste).doc);
const textoTodo = (p: { texto: string }[]) => p.map((x) => x.texto).join(' ');
const semVazioCru = (t: string) => {
  expect(t).not.toContain('undefined');
  expect(t).not.toContain('null');
  expect(t).not.toContain('NaN');
};

describe('relatórios do RH (grupo A) no motor único', () => {
  it('todos estão no REGISTRO com o tipo do próprio modelo', () => {
    const modelos = [relatorioServidoresDiretoria, relatorioServidoresVinculo, fichaHistoricoFuncional, relatorioVagasCargo, relatorioServidoresPortarias];
    for (const m of modelos) expect(REGISTRO[m.tipo as keyof typeof REGISTRO]).toBe(m);
  });

  it('servidores por estrutura: título, grupos com tipo/hierarquia, colunas e CPF formatado', async () => {
    const p = await ler(relatorioServidoresDiretoria, dadosDiretoria());
    const t = textoTodo(p);
    expect(t).toContain('RELATÓRIO DE SERVIDORES POR ESTRUTURA ORGANIZACIONAL');
    expect(t).toContain('Todas as Unidades Organizacionais');
    expect(t).toContain('PRES - Presidência de Exemplo (6)');
    expect(t).not.toContain('[PRESIDÊNCIA]');
    expect(t).toContain('[DIRETORIA] DIRAF - Diretoria Administrativa (6)');
    expect(t).toContain('[DIVISÃO] Divisão de Pessoal (6)');
    expect(t).toContain('Hierarquia: PRES > DIRAF > DIPES');
    for (const c of ['Nome', 'CPF', 'Cargo', 'Vínculo', 'Situação']) expect(t).toContain(c);
    expect(t).toMatch(/\d{3}\.\d{3}\.\d{3}-\d{2}/);
    expect(t).toContain('Total de servidores');
    semVazioCru(t);
  });

  it('servidores por estrutura: muitas linhas atravessam páginas repetindo o cabeçalho da tabela', async () => {
    const p = await ler(relatorioServidoresDiretoria, dadosDiretoria(40));
    expect(p.length).toBeGreaterThan(2);
    const ultimo = p[p.length - 1].texto;
    expect(ultimo).toContain('Situação');
    expect(textoTodo(p)).toContain('Servidor 3-40 de Exemplo da Silva');
  });

  it('servidores por vínculo: filtro, grupos, 2º vínculo em coluna própria e unidade vazia como traço', async () => {
    const t = textoTodo(await ler(relatorioServidoresVinculo, dadosVinculo()));
    expect(t).toContain('RELATÓRIO DE SERVIDORES POR VÍNCULO FUNCIONAL');
    expect(t).toContain('Filtro: Comissionado');
    expect(t).toContain('Comissionado (6 servidores)');
    expect(t).toContain('Efetivo (6 servidores)');
    expect(t).toContain('2º vínculo');
    expect(t).toContain('Secretaria Municipal de Exemplo');
    expect(t).toContain('100.000.000-00'); // CPF inteiro numa linha (coluna larga o bastante)
    expect(t).toContain('—');
    semVazioCru(t);
  });

  it('histórico funcional: dados do servidor, seções, total de férias e segundo vínculo com rótulos', async () => {
    const t = textoTodo(await ler(fichaHistoricoFuncional, dadosHistorico()));
    expect(t).toContain('RELATÓRIO DE HISTÓRICO FUNCIONAL');
    expect(t).toContain('Maria de Exemplo Souza');
    expect(t).toContain('123.456.789-01');
    expect(t).toContain('01/03/2020');
    for (const s of ['Histórico funcional', 'Portarias vinculadas', 'Férias registradas', 'Licenças e afastamentos', 'Segundo vínculo funcional']) {
      expect(t).toContain(s);
    }
    expect(t).toContain('45/2022');
    expect(t).toContain('45'); // total de dias de férias (30 + 15)
    expect(t).toContain('Cessão Formal');
    expect(t).toContain('Portaria nº 123/2024');
    semVazioCru(t);
  });

  it('histórico funcional: seção sem registro não é impressa', async () => {
    const t = textoTodo(await ler(fichaHistoricoFuncional, { ...dadosHistorico(), historico: [], portarias: [], ferias: [], licencas: [] }));
    expect(t).not.toContain('Férias registradas');
    expect(t).not.toContain('Portarias vinculadas');
    expect(t).toContain('Dados do servidor');
  });

  it('vagas por cargo: subtotal por natureza, natureza vazia omitida e resumo geral', async () => {
    const d = dadosVagas();
    const t = textoTodo(await ler(relatorioVagasCargo, d));
    expect(t).toContain('RELATÓRIO DE VAGAS DISPONÍVEIS POR CARGO');
    expect(t).toContain('Cargos Comissionados (5 cargos)');
    expect(t).not.toContain('Cargos Temporários (');
    for (const c of ['Cargo', 'Símbolo', 'Previstas', 'Ocupadas', 'Disponíveis', 'Ocupação']) expect(t).toContain(c);
    expect(t).toContain('Subtotal Cargos Comissionados');
    expect(t).toContain(String(d.grupos[0].total_previstas));
    expect(t).toContain('Taxa de ocupação');
    expect(t).toContain(`${d.percentualGeral.toFixed(1).replace('.', ',')}%`);
    semVazioCru(t);
  });

  it('servidores com portarias: identificação, colunas, servidor sem portaria omitido e resumo', async () => {
    const t = textoTodo(await ler(relatorioServidoresPortarias, dadosPortarias()));
    expect(t).toContain('RELATÓRIO DE SERVIDORES COM PORTARIAS');
    expect(t).toContain('Filtro: portaria');
    expect(t).toContain('Servidor 1 de Exemplo');
    expect(t).not.toContain('Servidor 4 de Exemplo');
    expect(t).toContain('Mat: M1');
    for (const c of ['Número', 'Tipo', 'Categoria', 'Título', 'Data doc.', 'Status']) expect(t).toContain(c);
    expect(t).toContain('03/02/2026');
    expect(t).toContain('aguardando publicacao');
    expect(t).toContain('3 servidores com 9 portarias vinculadas');
    semVazioCru(t);
  });

  it('servidores com portarias: muitas portarias atravessam páginas', async () => {
    const p = await ler(relatorioServidoresPortarias, dadosPortarias(30));
    expect(p.length).toBeGreaterThan(2);
    expect(p[p.length - 1].texto).toContain('portarias vinculadas');
  });

  it('nomes de arquivo seguem os do gerador antigo', () => {
    expect(relatorioServidoresDiretoria.nomeArquivo(dadosDiretoria())).toBe('Relatorio_Servidores_Estrutura_19-10-2026.pdf');
    expect(fichaHistoricoFuncional.nomeArquivo(dadosHistorico())).toBe('Historico_Funcional_Maria_de_Exemplo_Souza_19-10-2026.pdf');
  });
});
