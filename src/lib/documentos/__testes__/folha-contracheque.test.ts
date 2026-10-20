import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderizarDocumento } from '../core/renderizar';
import { ESTILO_PADRAO } from '../core/tokens';
import { contracheque, rubricasDoContracheque, type DadosContracheque } from '../modelos/folha/contracheque';
import { REGISTRO } from '../registro';
import { emissaoTeste, marcaTeste } from './fixtures';
import { fichaCompleta, fichaMinima } from './fixturesContracheque';
import { lerPdf } from './lerPdf';

const COMPETENCIA = 'Setembro/2026';
const render = (dados: DadosContracheque, estilo = ESTILO_PADRAO) =>
  renderizarDocumento(contracheque, dados, marcaTeste, emissaoTeste, estilo);
const ler = (dados: DadosContracheque, estilo = ESTILO_PADRAO) => lerPdf(render(dados, estilo).doc);
const textoTodo = (p: { texto: string }[]) => p.map((x) => x.texto).join(' ');
/** O "R$" e o valor vêm separados por espaço não separável (Intl): compara como espaço comum. */
const normalizar = (t: string) => t.replace(/\u00a0/g, ' ');
const semVazioCru = (t: string) => {
  expect(t).not.toContain('undefined');
  expect(t).not.toContain('null');
  expect(t).not.toContain('NaN');
};

describe('folha-contracheque', () => {
  it('está no REGISTRO como comprovante', () => {
    expect(REGISTRO['folha-contracheque']).toBe(contracheque);
    expect(contracheque.familia).toBe('comprovante');
  });

  it('imprime todos os campos e valores que o gerador antigo imprimia, numa página', async () => {
    const ficha = fichaCompleta(1);
    const paginas = await ler({ competencia: COMPETENCIA, fichas: [ficha] });
    expect(paginas).toHaveLength(1);
    const t = normalizar(textoTodo(paginas));
    semVazioCru(t);
    // Cabeçalho do documento
    expect(t).toContain('CONTRACHEQUE');
    expect(t).toContain('Competência: Setembro/2026');
    // Identificação
    for (const s of ['Nome', 'Maria de Exemplo Souza', 'CPF', '123.456.789-01', 'Matrícula', 'MAT-001', 'Cargo',
      'Assessor Técnico de Planejamento', 'Lotação', 'Divisão de Gestão de Pessoas', 'PIS/PASEP', '123.45678.90-1']) {
      expect(t).toContain(s);
    }
    // Cada rubrica: código, descrição completa (o antigo cortava em 20 letras), referência e valor
    for (const r of ficha.rubricas!) {
      expect(t).toContain(r.codigo);
      expect(t.replace(/\s+/g, ' ')).toContain(r.descricao.split(' ')[0]);
    }
    for (const v of ['6.500,00', '2.600,00', '650,00', '1.200,00', '800,00', '220,50', '375,12', '180,00',
      '908,86', '1.702,33', '975,00', '640,40', '310,00', '45,00', '216,67']) {
      expect(t).toContain(v);
    }
    for (const ref of ['30', '100', '10', '8,5', '20', '14', '27,5', '15']) expect(t).toContain(ref);
    // Totais, líquido, bases e dependentes
    expect(t).toMatch(/Total de proventos \(bruto\).*12\.525,62/);
    expect(t).toMatch(/Total de descontos.*4\.798,26/);
    expect(t).toContain('VALOR LÍQUIDO: R$ 7.727,36');
    expect(t).toMatch(/Base INSS.*R\$ 7\.835,45/);
    expect(t).toMatch(/Base IRRF.*R\$ 9\.000,13/);
    expect(t).toContain('Dependentes IRRF');
    // Linha de autenticidade do comprovante
    expect(t).toContain('Documento emitido eletronicamente');
  });

  it('descrição longa sai inteira (quebra de linha, não corte)', async () => {
    const t = normalizar(textoTodo(await ler({ competencia: COMPETENCIA, fichas: [fichaCompleta(1)] }))).replace(/\s+/g, ' ');
    expect(t).toContain('Gratificação de Representação de Gabinete');
    expect(t).toContain('Empréstimo Consignado Banco Exemplo');
  });

  it('muitas rubricas (15 proventos e 15 descontos) ainda cabem numa página', async () => {
    const rubrica = (tipo: 'provento' | 'desconto', i: number) => ({ codigo: String(i), descricao: `Rubrica ${tipo} ${i}`, tipo, valor: 100 + i });
    const ficha = {
      ...fichaCompleta(1),
      rubricas: [...Array.from({ length: 15 }, (_, i) => rubrica('provento', i)), ...Array.from({ length: 15 }, (_, i) => rubrica('desconto', 50 + i))],
    };
    const paginas = await ler({ competencia: COMPETENCIA, fichas: [ficha] });
    expect(paginas).toHaveLength(1);
    expect(paginas[0].texto).toContain('Rubrica desconto 64');
    expect(paginas[0].texto).toContain('Dependentes IRRF');
  });

  it('cabe numa página mesmo com letra grande', async () => {
    const paginas = await ler({ competencia: COMPETENCIA, fichas: [fichaCompleta(1)] }, { ...ESTILO_PADRAO, escala: 'grande' });
    expect(paginas).toHaveLength(1);
  });

  it('lote: uma página por servidor, cada uma com nome, competência e líquido', async () => {
    const fichas = [fichaCompleta(1), fichaCompleta(2), fichaCompleta(3)];
    const paginas = await ler({ competencia: COMPETENCIA, fichas });
    expect(paginas).toHaveLength(3);
    paginas.forEach((p, i) => {
      const t = normalizar(p.texto);
      expect(t).toContain(fichas[i].servidor!.nome_completo);
      expect(t).toContain('Contracheque - competência Setembro/2026');
      expect(t).toContain('VALOR LÍQUIDO: R$ 7.727,36');
      expect(t).toContain(`Página ${i + 1} de 3`);
    });
    expect(render({ competencia: COMPETENCIA, fichas }).nomeArquivo).toBe('Contracheques_Setembro-2026_Lote.pdf');
  });

  it('sem rubricas detalhadas monta vencimento base, INSS e IRRF como o antigo', () => {
    const { proventos, descontos } = rubricasDoContracheque(fichaMinima);
    expect(proventos).toEqual([{ codigo: '001', descricao: 'Vencimento Base', tipo: 'provento', referencia: 30, valor: 3000 }]);
    expect(descontos.map((d) => [d.codigo, d.descricao, d.valor])).toEqual([['101', 'INSS', 330], ['102', 'IRRF', 90]]);
  });

  it('ficha sem servidor nem bases: traço no lugar, sem "undefined/null/NaN"', async () => {
    const paginas = await ler({ competencia: COMPETENCIA, fichas: [fichaMinima] });
    expect(paginas).toHaveLength(1);
    const t = normalizar(textoTodo(paginas));
    semVazioCru(t);
    expect(t).toContain('—');
    expect(t).toContain('Vencimento Base');
    expect(t).toMatch(/Base INSS.*R\$ 0,00/);
    expect(t).toContain('VALOR LÍQUIDO: R$ 2.580,00');
    expect(t).not.toContain('PIS/PASEP');
    expect(render({ competencia: COMPETENCIA, fichas: [fichaMinima] }).nomeArquivo).toBe('Contracheque_servidor_Setembro-2026.pdf');
  });

  it('lista vazia não quebra nem imprime vazio cru', async () => {
    const t = textoTodo(await ler({ competencia: COMPETENCIA, fichas: [] }));
    semVazioCru(t);
    expect(t).toContain('Nenhum contracheque');
  });

  it('nome do arquivo de um servidor igual ao antigo', () => {
    expect(render({ competencia: COMPETENCIA, fichas: [fichaCompleta(1)] }).nomeArquivo).toBe(
      'Contracheque_Maria_de_Exemplo_Sou_Setembro-2026.pdf',
    );
  });

  // Amostras para inspeção visual: DOCUMENTOS_AMOSTRAS=<pasta> npx vitest run …/folha-contracheque.test.ts
  it.skipIf(!process.env.DOCUMENTOS_AMOSTRAS)('grava amostras', () => {
    const saida = process.env.DOCUMENTOS_AMOSTRAS!;
    mkdirSync(saida, { recursive: true });
    const gravar = (nome: string, dados: DadosContracheque, estilo = ESTILO_PADRAO) =>
      writeFileSync(join(saida, nome), Buffer.from(render(dados, estilo).doc.output('arraybuffer')));
    gravar('depois-individual.pdf', { competencia: COMPETENCIA, fichas: [fichaCompleta(1)] });
    gravar('depois-individual-grande.pdf', { competencia: COMPETENCIA, fichas: [fichaCompleta(1)] }, { ...ESTILO_PADRAO, escala: 'grande' });
    gravar('depois-minimo.pdf', { competencia: COMPETENCIA, fichas: [fichaMinima] });
    gravar('depois-lote.pdf', { competencia: COMPETENCIA, fichas: [fichaCompleta(1), fichaCompleta(2), fichaMinima] });
  });
});
