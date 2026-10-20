import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import type { DiaNaoUtil } from '@/types/frequencia';
import { renderizarDocumento } from '../core/renderizar';
import { ESCALAS, ESTILO_PADRAO } from '../core/tokens';
import {
  folhaFrequencia,
  type DadosFolhaFrequencia,
  type DiaFolhaFrequencia,
  type ServidorFolhaFrequencia,
} from '../modelos/rh/folhaFrequencia';
import { REGISTRO } from '../registro';
import type { EscalaLetra } from '../tipos';
import { emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf } from './lerPdf';

// O motor de jornada importa o cliente do Supabase; aqui só a regra de turnos importa.
vi.mock('@/integrations/supabase/client', () => ({ supabase: {} }));

// ============================================
// FIXTURES (dados fictícios)
// ============================================

/** Mês com fim de semana nos dias reais do calendário; horários só nos dias úteis quando `preenchida`. */
function diasDoMes(ano: number, mes: number, preenchida: boolean, extras: Partial<Record<number, Partial<DiaFolhaFrequencia>>> = {}): DiaFolhaFrequencia[] {
  const ultimo = new Date(ano, mes, 0).getDate();
  return Array.from({ length: ultimo }, (_, i) => {
    const dia = i + 1;
    const diaSemana = new Date(ano, mes - 1, dia).getDay();
    const situacao = diaSemana === 0 ? 'domingo' : diaSemana === 6 ? 'sabado' : 'util';
    const horarios = preenchida && situacao === 'util' ? { entrada1: '08:00', saida1: '12:00', entrada2: '14:00', saida2: '18:00' } : {};
    return { dia, diaSemana, situacao, ...horarios, ...extras[dia] };
  });
}

const servidor = (over: Partial<ServidorFolhaFrequencia> = {}): ServidorFolhaFrequencia => ({
  nome: 'Fulana de Teste',
  matricula: 'M-0001',
  cargo: 'Analista',
  funcao: 'Chefe de Divisão',
  unidade: 'UN1 - Unidade de Teste',
  cargaHorariaDiaria: 8,
  cargaHorariaSemanal: 40,
  doisTurnos: true,
  dias: diasDoMes(2026, 3, false),
  ...over,
});

const dados = (over: Partial<DadosFolhaFrequencia> = {}): DadosFolhaFrequencia => ({
  tipo: 'em_branco',
  competencia: { mes: 3, ano: 2026 },
  local: 'Cidade Exemplo/EX',
  servidores: [servidor()],
  ...over,
});

const gerar = (d: DadosFolhaFrequencia, escala: EscalaLetra = 'normal') =>
  renderizarDocumento(folhaFrequencia, d, marcaTeste, emissaoTeste, { ...ESTILO_PADRAO, escala });

const textoSemEspaco = (s: string) => s.replace(/\s+/g, ' ');

// ============================================
// FOLHA INDIVIDUAL
// ============================================

describe('rh-folha-frequencia — folha individual', () => {
  it('está no REGISTRO, família comprovante', () => {
    expect(REGISTRO['rh-folha-frequencia']).toBe(folhaFrequencia);
    expect(folhaFrequencia.familia).toBe('comprovante');
  });

  it('31 dias, dados do servidor e assinaturas cabem numa página (dois turnos)', async () => {
    const p = await lerPdf(gerar(dados()).doc);
    expect(p).toHaveLength(1);
    const t = p[0].texto;
    expect(t).toContain('FOLHA INDIVIDUAL DE PRESENÇA');
    for (let dia = 1; dia <= 31; dia++) expect(t).toContain(`${String(dia).padStart(2, '0')} `);
    expect(t).toContain('31 Ter');
    for (const rotulo of ['Servidor(a)', 'Matrícula', 'Competência', 'Cargo / Função', 'Unidade de lotação', 'Jornada']) expect(t).toContain(rotulo);
    expect(t).toContain('FULANA DE TESTE');
    expect(t).toContain('M-0001');
    expect(t).toContain('Março / 2026');
    expect(t).toContain('Analista / Chefe de Divisão');
    expect(t).toContain('UN1 - Unidade de Teste');
    expect(t).toContain('8h/dia · 40h/sem');
    for (const col of ['Dia', 'Ent. 1º', 'Saí. 1º', 'Assin. 1º', 'Abono 1º', 'Ent. 2º', 'Saí. 2º', 'Assin. 2º', 'Abono 2º']) expect(t).toContain(col);
    expect(t).toContain('Cidade Exemplo/EX, _______ de');
    expect(t).toContain('Assinatura do(a) Servidor(a)');
    expect(t).toContain('Visto do(a) Chefe Imediato');
    expect(t).toContain('Documento emitido eletronicamente');
  });

  it('um turno (jornada de 6h): colunas de um turno, ainda numa página', async () => {
    const p = await lerPdf(gerar(dados({ servidores: [servidor({ doisTurnos: false, cargaHorariaDiaria: 6, cargaHorariaSemanal: 30 })] })).doc);
    expect(p).toHaveLength(1);
    for (const col of ['Entrada', 'Saída', 'Assinatura do servidor', 'Abono chefia']) expect(p[0].texto).toContain(col);
    expect(p[0].texto).not.toContain('Ent. 2º');
    expect(p[0].texto).toContain('6h/dia · 30h/sem');
  });

  it('preenchida: horários nos dias úteis; fim de semana, feriado e férias com o rótulo nas duas assinaturas', async () => {
    const dias = diasDoMes(2026, 3, true, {
      10: { situacao: 'ferias', entrada1: undefined, saida1: undefined, entrada2: undefined, saida2: undefined },
      19: { situacao: 'feriado', rotulo: 'Dia de São José Padroeiro do Estado', entrada1: undefined, saida1: undefined, entrada2: undefined, saida2: undefined },
    });
    const [p1] = await lerPdf(gerar(dados({ tipo: 'preenchida', servidores: [servidor({ dias })] })).doc);
    const strs = p1.itens.map((i) => i.str);
    // 22 dias úteis em março/2026, menos férias (10) e feriado (19) = 20 dias com os quatro horários.
    expect(strs.filter((s) => s === '08:00')).toHaveLength(20);
    expect(strs.filter((s) => s === '18:00')).toHaveLength(20);
    expect(strs.filter((s) => s === 'FÉRIAS')).toHaveLength(2);
    expect(strs.filter((s) => s === 'DOMINGO')).toHaveLength(2 * 5);
    expect(strs.filter((s) => s === 'SÁBADO')).toHaveLength(2 * 4);
    // Nome do feriado cortado na largura da coluna (uma linha só, como o antigo).
    expect(strs.filter((s) => s.startsWith('Dia de São José') && s.endsWith('…'))).toHaveLength(2);
  });

  it('fevereiro: dias 29 a 31 saem riscados, sem dia inexistente', async () => {
    const [p1] = await lerPdf(gerar(dados({ competencia: { mes: 2, ano: 2026 }, servidores: [servidor({ dias: diasDoMes(2026, 2, false) })] })).doc);
    expect(p1.texto).toContain('28 Sáb');
    expect(p1.texto).not.toMatch(/\b29 (Dom|Seg|Ter|Qua|Qui|Sex|Sáb)\b/);
    // 3 linhas × 9 colunas de "—" além dos fins de semana (8 dias × 6 traços).
    expect(p1.itens.filter((i) => i.str === '—')).toHaveLength(3 * 9 + 8 * 6);
  });

  it('nome, cargo e unidade longos ainda cabem numa página, em todas as escalas de letra', async () => {
    const longo = servidor({
      nome: 'Maria Aparecida dos Santos Ferreira de Albuquerque Cavalcanti',
      cargo: 'Analista Técnico Administrativo de Gestão Pública',
      funcao: 'Coordenadora de Planejamento',
      unidade: 'CGP - Coordenação de Gestão de Pessoas e Desenvolvimento Institucional',
    });
    for (const escala of Object.keys(ESCALAS) as EscalaLetra[]) {
      const p = await lerPdf(gerar(dados({ servidores: [longo] }), escala).doc);
      expect(p, `escala ${escala}`).toHaveLength(1);
      expect(p[0].texto).toContain('Visto do(a) Chefe Imediato');
    }
  });

  it('em branco e sem dados opcionais: nada de undefined/null/NaN, linha de data para preencher', async () => {
    const vazio = servidor({ nome: '', matricula: undefined, cargo: undefined, funcao: undefined, unidade: undefined, dias: [] });
    const [p1] = await lerPdf(gerar(dados({ local: undefined, servidores: [vazio] })).doc);
    expect(p1.texto).not.toMatch(/undefined|null|NaN/);
    expect(p1.texto).toContain('________________________, _______ de');
    expect(p1.texto).toContain('31 Ter');
  });

  it('nome do arquivo igual ao antigo', () => {
    expect(folhaFrequencia.nomeArquivo(dados({ tipo: 'preenchida' }))).toBe('Frequencia_Fulana_de_Teste_Março_2026_preenchida.pdf');
  });
});

// ============================================
// LOTE DA UNIDADE
// ============================================

describe('rh-folha-frequencia — lote', () => {
  const tres = [1, 2, 3].map((i) => servidor({ nome: `Servidor Lote ${i}`, matricula: `L${i}`, doisTurnos: i !== 2 }));
  const lote = (capa: boolean, servidores = tres): DadosFolhaFrequencia =>
    dados({ servidores, lote: { unidade: { nome: 'Unidade de Teste', sigla: 'UN1' }, capa, dataGeracao: '20/10/2026 às 10:00' } });

  it('com capa: resumo do lote na 1ª página e uma página por servidor', async () => {
    const p = await lerPdf(gerar(lote(true)).doc);
    expect(p).toHaveLength(4);
    const capa = textoSemEspaco(p[0].texto);
    expect(capa).toContain('FOLHA DE FREQUÊNCIA MENSAL');
    expect(capa).toContain('Lote por unidade administrativa');
    expect(capa).toContain('UN1 - Unidade de Teste');
    expect(capa).toContain('Março de 2026');
    expect(capa).toContain('3 folhas de frequência');
    expect(capa).toContain('20/10/2026 às 10:00');
    for (const [i, pg] of p.slice(1).entries()) {
      expect(pg.texto).toContain('FOLHA INDIVIDUAL DE PRESENÇA');
      expect(pg.texto).toContain(`SERVIDOR LOTE ${i + 1}`);
      expect(pg.texto).toContain('31 Ter');
      expect(pg.texto).toContain('Visto do(a) Chefe Imediato');
      expect(pg.texto).toContain(`Página ${i + 2} de 4`);
    }
    expect(p[2].texto).toContain('Assinatura do servidor'); // jornada de um turno
  });

  it('sem capa: o 1º servidor fica sob o título e cada um ocupa uma página', async () => {
    const p = await lerPdf(gerar(lote(false)).doc);
    expect(p).toHaveLength(3);
    expect(p[0].texto).toContain('SERVIDOR LOTE 1');
    expect(p[1].texto).toContain('SERVIDOR LOTE 2');
    expect(p[2].texto).toContain('SERVIDOR LOTE 3');
    expect(folhaFrequencia.nomeArquivo(lote(false))).toBe('Frequencia_Lote_UN1_03-2026.pdf');
  });

  it('lote vazio não quebra nem imprime lixo', async () => {
    const [semCapa] = await lerPdf(gerar(lote(false, [])).doc);
    expect(semCapa.texto).toContain('Nenhum servidor selecionado.');
    const comCapa = await lerPdf(gerar(lote(true, [])).doc);
    expect(comCapa).toHaveLength(1);
    expect(comCapa[0].texto).toContain('0 folhas de frequência');
    expect(comCapa[0].texto).not.toMatch(/undefined|null|NaN/);
  });
});

// ============================================
// CONVERSÃO DA TELA (gerador antigo → modelo)
// ============================================

describe('paraFolhaFrequencia', () => {
  it('aplica calendário, registros e turnos como a folha antiga', async () => {
    const { paraFolhaFrequencia, gerarRegistrosDiariosBranco } = await import('@/lib/pdfFrequenciaMensalGenerator');
    const diasNaoUteis = [{ id: '1', data: '2026-03-19', nome: 'Feriado Estadual', tipo: 'feriado_estadual', ativo: true }] as unknown as DiaNaoUtil[];
    const registros = gerarRegistrosDiariosBranco(2026, 3, diasNaoUteis).map((r) =>
      r.situacao === 'util' ? { ...r, entrada_manha: '08:00', saida_manha: '12:00', entrada_tarde: '14:00', saida_tarde: '18:00' } : r,
    );
    registros[9] = { ...registros[9], situacao: 'ferias' };
    const base = {
      competencia: { mes: 3, ano: 2026 },
      servidor: { id: 's', nome_completo: 'Fulana', matricula: '1', carga_horaria_diaria: 8 },
      registros,
      diasNaoUteis,
      configAssinatura: { servidor_obrigatoria: true, chefia_obrigatoria: true, rh_obrigatoria: false, texto_declaracao: '' },
      dataGeracao: '20/10/2026',
    };
    const preenchida = paraFolhaFrequencia({ ...base, tipo: 'preenchida' });
    expect(preenchida.dias).toHaveLength(31);
    expect(preenchida.doisTurnos).toBe(true);
    expect(preenchida.cargaHorariaSemanal).toBe(40);
    expect(preenchida.dias[1]).toMatchObject({ situacao: 'util', entrada1: '08:00', saida2: '18:00' });
    expect(preenchida.dias[9]).toMatchObject({ situacao: 'ferias' });
    expect(preenchida.dias[9].entrada1).toBeUndefined();
    expect(preenchida.dias[18]).toMatchObject({ situacao: 'feriado', rotulo: 'Feriado Estadual' });
    // Em branco não imprime horário, mesmo com registro.
    expect(paraFolhaFrequencia({ ...base, tipo: 'em_branco' }).dias[1].entrada1).toBeUndefined();
    expect(paraFolhaFrequencia({ ...base, tipo: 'em_branco', servidor: { ...base.servidor, carga_horaria_diaria: 6 } }).doisTurnos).toBe(false);
  });
});

// Amostras para inspeção visual: DOCUMENTOS_AMOSTRAS=<pasta> npx vitest run …/rh-folha-frequencia.test.ts
const saida = process.env.DOCUMENTOS_AMOSTRAS;
describe.skipIf(!saida)('amostras da folha de frequência', () => {
  it('grava individual (em branco e preenchida) e lote', () => {
    mkdirSync(saida!, { recursive: true });
    const gravar = (nome: string, d: DadosFolhaFrequencia) => writeFileSync(join(saida!, nome), Buffer.from(gerar(d).doc.output('arraybuffer')));
    gravar('rh-folha-frequencia-branco.pdf', dados());
    gravar('rh-folha-frequencia-preenchida.pdf', dados({ tipo: 'preenchida', servidores: [servidor({ dias: diasDoMes(2026, 3, true) })] }));
    gravar(
      'rh-folha-frequencia-lote.pdf',
      dados({
        servidores: [servidor(), servidor({ nome: 'Outro Servidor', doisTurnos: false, cargaHorariaDiaria: 6, cargaHorariaSemanal: 30 })],
        lote: { unidade: { nome: 'Unidade de Teste', sigla: 'UN1' }, capa: true, dataGeracao: '20/10/2026 às 10:00' },
      }),
    );
  });
});
