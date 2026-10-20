import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderizarDocumento } from '../core/renderizar';
import {
  ALTURA_LINHA_ASSINATURA,
  listaConvocados,
  listaPresenca,
  relatorioReuniao,
  type DadosListaPresenca,
  type DadosListaReuniao,
  type ParticipanteReuniao,
} from '../modelos/reunioes/reunioes';
import { REGISTRO } from '../registro';
import type { DocumentoModelo } from '../tipos';
import { emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf, mmParaPt } from './lerPdf';

const ler = async <D,>(modelo: DocumentoModelo<D>, dados: D) => {
  const r = renderizarDocumento(modelo, dados, marcaTeste, emissaoTeste);
  const paginas = await lerPdf(r.doc);
  return { ...r, paginas, texto: paginas.map((p) => p.texto).join(' ') };
};

const semLixo = (texto: string) => {
  expect(texto).not.toContain('undefined');
  expect(texto).not.toContain('null');
  expect(texto).not.toContain('NaN');
};

// ---------- fixtures ----------

const reuniao: DadosListaReuniao['reuniao'] = {
  titulo: 'Reunião ordinária do conselho',
  data_reuniao: '2026-10-15',
  hora_inicio: '09:00:00',
  hora_fim: '11:30:00',
  local: 'Auditório principal',
  tipo: 'ordinaria',
  pauta: '1. Abertura\n2. Prestação de contas do trimestre\n3. Encerramento',
  ata_conteudo: 'Aos quinze dias do mês de outubro, reuniram-se os membros do conselho. '.repeat(40),
};

const STATUS = ['presente', 'ausente', 'confirmado', 'pendente', 'recusado'];
const participantes = (n: number): ParticipanteReuniao[] =>
  Array.from({ length: n }, (_, i) => ({
    id: String(i),
    servidor: i % 3 ? { nome_completo: `Servidor Participante ${i + 1}` } : null,
    nome_externo: i % 3 ? null : `Convidado Externo ${i + 1}`,
    cargo_funcao: i % 4 ? 'Assessor Técnico' : null,
    status: STATUS[i % 5],
    justificativa_ausencia: i % 5 === 1 ? 'Em viagem a serviço' : null,
  }));

const presenca = (n: number, local = 'Cidade Exemplo - UF'): DadosListaPresenca => ({
  reuniao, participantes: participantes(n), local, data: '20 de outubro de 2026',
});

const reuniaoVazia: DadosListaReuniao['reuniao'] = { titulo: 'Reunião sem dados', data_reuniao: '2026-10-15', hora_inicio: '', tipo: 'ordinaria' };

// ---------- testes ----------

describe('reuniões no motor único', () => {
  it('os três modelos estão no REGISTRO', () => {
    expect(Object.keys(REGISTRO)).toEqual(
      expect.arrayContaining(['reunioes-lista-convocados', 'reunioes-lista-presenca', 'reunioes-relatorio']),
    );
  });

  it('lista de convocados: dados da reunião, colunas, status e total', async () => {
    const { texto, nomeArquivo } = await ler(listaConvocados, { reuniao, participantes: participantes(5) });
    expect(nomeArquivo).toBe('lista-convocados-2026-10-15.pdf');
    for (const t of ['LISTA DE CONVOCADOS', 'Reunião ordinária do conselho', 'Reunião', 'Data', '15 de outubro de 2026',
      'Horário', '09:00 às 11:30', 'Local', 'Auditório principal', 'Tipo', 'Ordinária',
      'Nº', 'Nome', 'Cargo/Função', 'Status', '01', 'Convidado Externo 1', 'Servidor Participante 2', 'Assessor Técnico',
      'Presente', 'Ausente', 'Confirmado', 'Pendente', 'Recusado', 'Total de convocados: 5', 'Documento emitido eletronicamente']) {
      expect(texto).toContain(t);
    }
    semLixo(texto);
  });

  it('lista de presença: contagem, presença, justificativa, coluna de assinatura e assinatura do responsável', async () => {
    const { texto, nomeArquivo } = await ler(listaPresenca, presenca(5));
    expect(nomeArquivo).toBe('lista-presenca-2026-10-15.pdf');
    for (const t of ['LISTA DE PRESENÇA', 'Presentes', 'Ausentes', 'Total', 'Nº', 'Nome', 'Cargo/Função', 'Presença', 'Assinatura',
      'Presente', 'Ausente', 'Justificativa: Em viagem a serviço', 'Cidade Exemplo - UF, 20 de outubro de 2026.',
      'Responsável pela Reunião']) {
      expect(texto).toContain(t);
    }
    semLixo(texto);
  });

  it('lista de presença: cada linha tem altura para assinar à mão', async () => {
    const { paginas } = await ler(listaPresenca, presenca(6));
    const ys = paginas[0].itens.filter((i) => i.x < mmParaPt(32) && /^0\d$/.test(i.str)).map((i) => i.y);
    expect(ys.length).toBeGreaterThanOrEqual(5);
    // Linhas de uma única linha de texto: o passo entre elas é a altura mínima (10 mm), não a do texto.
    const passos = ys.slice(1).map((y, k) => ys[k] - y);
    const simples = [passos[2], passos[3]]; // 03→04 e 04→05: nenhuma tem justificativa
    for (const p of simples) expect(p).toBeCloseTo(mmParaPt(ALTURA_LINHA_ASSINATURA), 0);
    // A coluna Assinatura (a partir de 143 mm) fica em branco: só o título dela, sem "—".
    const naColuna = paginas[0].itens.filter((i) => i.x > mmParaPt(143) && i.x < mmParaPt(170) && i.y > mmParaPt(25));
    expect(naColuna.map((i) => i.str)).toEqual(['Assinatura']);
  });

  it('lista de presença com muitos participantes atravessa páginas repetindo o cabeçalho, sem perder ninguém', async () => {
    const { paginas } = await ler(listaPresenca, presenca(60));
    expect(paginas.length).toBeGreaterThanOrEqual(3);
    for (const pg of paginas.slice(0, -1)) {
      expect(pg.texto).toContain('Cargo/Função');
      expect(pg.texto).toContain('Assinatura');
    }
    // Só a coluna Nº (centralizada, acima do rodapé): contagens e data do rodapé também têm números de dois dígitos.
    const ordens = paginas.flatMap((p) => p.itens.filter((i) => i.x > mmParaPt(21) && i.x < mmParaPt(32) && i.y > mmParaPt(25)).map((i) => i.str)).filter((s) => /^\d{2}$/.test(s));
    expect(ordens).toEqual(Array.from({ length: 60 }, (_, i) => String(i + 1).padStart(2, '0')));
    const ultima = paginas[paginas.length - 1].texto;
    expect(ultima).toContain('Responsável pela Reunião');
  });

  it('lista de convocados com muitos participantes repete o cabeçalho da tabela', async () => {
    const { paginas } = await ler(listaConvocados, { reuniao, participantes: participantes(80) });
    expect(paginas.length).toBeGreaterThanOrEqual(2);
    for (const pg of paginas) expect(pg.texto).toContain('Cargo/Função');
    expect(paginas[paginas.length - 1].texto).toContain('Total de convocados: 80');
  });

  it('relatório: informações gerais, presentes, pauta e ata longa em várias páginas', async () => {
    const { texto, nomeArquivo, paginas } = await ler(relatorioReuniao, { reuniao, participantes: participantes(10) });
    expect(nomeArquivo).toBe('relatorio-reuniao-2026-10-15.pdf');
    for (const t of ['RELATÓRIO DE REUNIÃO', 'Informações gerais', '15 de outubro de 2026', '09:00 às 11:30', 'Auditório principal',
      'Ordinária', 'Participantes presentes (2)', 'Convidado Externo 1', 'Servidor Participante 6', 'Pauta', '2. Prestação de contas do trimestre',
      'Ata da reunião', 'reuniram-se os membros']) {
      expect(texto).toContain(t);
    }
    // Só os presentes entram na lista.
    expect(texto).not.toContain('Servidor Participante 2 ');
    expect(paginas.length).toBeGreaterThanOrEqual(2);
    semLixo(texto);
  });

  it('vazios: sem participantes, sem local, sem pauta/ata, sem undefined/null/NaN', async () => {
    const c = await ler(listaConvocados, { reuniao: reuniaoVazia, participantes: [] });
    expect(c.texto).toContain('Nenhum registro encontrado.');
    expect(c.texto).toContain('Não informado');
    expect(c.texto).toContain('Total de convocados: 0');
    semLixo(c.texto);

    const p = await ler(listaPresenca, { reuniao: reuniaoVazia, participantes: [], local: '', data: '20 de outubro de 2026' });
    expect(p.texto).toContain('20 de outubro de 2026.');
    expect(p.texto).toContain('Responsável pela Reunião');
    semLixo(p.texto);

    const r = await ler(relatorioReuniao, { reuniao: reuniaoVazia, participantes: [] });
    expect(r.texto).toContain('Participantes presentes (0)');
    expect(r.texto).not.toContain('Pauta');
    expect(r.texto).not.toContain('Ata da reunião');
    semLixo(r.texto);
  });
});

// Amostras para inspeção visual: DOCUMENTOS_AMOSTRAS=<pasta> npx vitest run …/reunioes.test.ts
const saida = process.env.DOCUMENTOS_AMOSTRAS;
describe.skipIf(!saida)('amostras de reuniões', () => {
  it('grava os três documentos', () => {
    mkdirSync(saida!, { recursive: true });
    const gravar = (nome: string, doc: { output: (t: 'arraybuffer') => ArrayBuffer }) =>
      writeFileSync(join(saida!, nome), Buffer.from(doc.output('arraybuffer')));
    gravar('depois-convocados.pdf', renderizarDocumento(listaConvocados, { reuniao, participantes: participantes(45) }, marcaTeste, emissaoTeste).doc);
    gravar('depois-presenca.pdf', renderizarDocumento(listaPresenca, presenca(45), marcaTeste, emissaoTeste).doc);
    gravar('depois-relatorio.pdf', renderizarDocumento(relatorioReuniao, { reuniao, participantes: participantes(45) }, marcaTeste, emissaoTeste).doc);
  });
});
