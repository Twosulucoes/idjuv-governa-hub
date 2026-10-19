import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderizarDocumento } from '../core/renderizar';
import { fichaUnidadeLocal, type FichaUnidadeLocalData } from '../modelos/unidades/fichaUnidadeLocal';
import { REGISTRO } from '../registro';
import { emissaoTeste, marcaTeste } from './fixtures';
import { lerPdf } from './lerPdf';

const ler = (dados: FichaUnidadeLocalData) => lerPdf(renderizarDocumento(fichaUnidadeLocal, dados, marcaTeste, emissaoTeste).doc);
const textoTodo = (p: { texto: string }[]) => p.map((x) => x.texto).join(' ');
const semVazioCru = (t: string) => {
  expect(t).not.toContain('undefined');
  expect(t).not.toContain('null');
  expect(t).not.toContain('NaN');
};

const completa = (itens = 3): FichaUnidadeLocalData => ({
  identificacao: {
    codigo: 'UL-001',
    nome: 'Ginásio de Exemplo',
    tipo: 'ginasio',
    status: 'manutencao',
    diretoria: 'Diretoria de Esporte de Exemplo',
    capacidade: 2500,
  },
  localizacao: {
    municipio: 'Cidade Exemplo',
    uf: 'EX',
    endereco: 'Rua das Flores, 100 - Centro',
    complemento: 'Bloco B',
    referencia: 'Ao lado da praça',
  },
  estrutura: {
    areas: ['Quadra poliesportiva', 'Vestiários', 'Arquibancada', 'Sala de musculação', 'Copa'],
    estrutura: 'Ginásio coberto com iluminação e sonorização.',
    horarioFuncionamento: 'Segunda a sexta, 7h às 22h',
  },
  responsavel: {
    nome: 'Responsável de Exemplo',
    cargo: 'Chefe de Unidade',
    tipoAto: 'portaria',
    numeroAto: '123/2026',
    dataPublicacao: '10/01/2026',
    dataInicio: '15/01/2026',
  },
  cedencias: {
    totalSolicitadas: 42,
    aprovadas: 30,
    pendentes: 5,
    rejeitadas: 4,
    canceladas: 3,
    publicoTotal: 12500,
    ultimaCedencia: { titulo: 'Campeonato de Exemplo', solicitante: 'Associação de Exemplo', dataInicio: '01/02/2026', dataFim: '03/02/2026' },
  },
  patrimonio: {
    totalItens: itens,
    valorEstimado: 15432.1,
    porEstado: { otimo: 2, bom: 1, ruim: 0 },
    itensRecentes: Array.from({ length: itens }, (_, i) => ({
      tombo: `TMB-${String(i + 1).padStart(4, '0')}`,
      descricao: `Bem patrimonial de exemplo número ${i + 1}`,
      estado: ['otimo', 'bom', 'regular', 'ruim', 'inservivel'][i % 5],
    })),
  },
  observacoes: 'Unidade passa por reforma do piso da quadra.',
});

const minima: FichaUnidadeLocalData = {
  identificacao: { nome: 'Quadra Sem Código', tipo: 'quadra', status: 'ativa' },
  localizacao: { municipio: 'Cidade Exemplo' },
  estrutura: { areas: [] },
  responsavel: null,
};

describe('ficha cadastral de unidade local no motor único', () => {
  it('está no REGISTRO com o tipo do próprio modelo', () => {
    expect(REGISTRO['unidades-ficha-unidade-local']).toBe(fichaUnidadeLocal);
    expect(fichaUnidadeLocal.familia).toBe('ficha');
  });

  it('título, seções e valores com rótulos', async () => {
    const t = textoTodo(await ler(completa()));
    expect(t).toContain('FICHA CADASTRAL DE UNIDADE LOCAL');
    expect(t).toContain('Ginásio de Exemplo');
    for (const s of ['Identificação da unidade', 'Localização', 'Estrutura e áreas disponíveis', 'Responsável pela unidade', 'Resumo de cedências', 'Patrimônio', 'Observações']) {
      expect(t).toContain(s);
    }
    expect(t).toContain('UL-001');
    expect(t).toContain('Ginásio'); // rótulo do tipo
    expect(t).toContain('Em Manutenção'); // rótulo do status
    expect(t).toContain('2.500 pessoas');
    expect(t).toContain('Cidade Exemplo/EX');
    expect(t).toContain('Ao lado da praça');
    expect(t).toContain('Sala de musculação');
    expect(t).toContain('Portaria nº 123/2026');
    expect(t).toContain('12.500 pessoas');
    expect(t).toContain('Campeonato de Exemplo - Associação de Exemplo (01/02/2026 a 03/02/2026)');
    expect(t).toMatch(/R\$\s?15\.432,10/);
    for (const e of ['Ótimo', 'Bom', 'Regular', 'Ruim', 'Inservível']) expect(t).toContain(e);
    expect(t).toContain('TMB-0003');
    expect(t).toContain('reforma do piso');
    semVazioCru(t);
  });

  it('unidade sem código, responsável, cedências nem patrimônio não imprime vazio cru', async () => {
    const p = await ler(minima);
    const t = textoTodo(p);
    expect(p).toHaveLength(1);
    expect(t).toContain('Quadra Sem Código');
    expect(t).toContain('Unidade sem responsável designado.');
    expect(t).toContain('Nenhuma estrutura ou área informada.');
    expect(t).not.toContain('Resumo de cedências');
    expect(t).not.toContain('Patrimônio');
    expect(t).not.toContain('/EX');
    semVazioCru(t);
  });

  it('patrimônio sem itens e sem valor: só o total, sem distribuição', async () => {
    const t = textoTodo(await ler({ ...minima, patrimonio: { totalItens: 0, porEstado: {} } }));
    expect(t).toContain('Total de itens');
    expect(t).not.toContain('Valor estimado');
    expect(t).not.toContain('Distribuição por estado');
    semVazioCru(t);
  });

  it('muitos itens de patrimônio atravessam páginas repetindo o cabeçalho da tabela', async () => {
    const p = await ler(completa(80));
    expect(p.length).toBeGreaterThan(2);
    const comItens = p.slice(1).filter((pagina) => pagina.texto.includes('TMB-'));
    expect(comItens.length).toBeGreaterThan(1);
    for (const pagina of comItens) {
      expect(pagina.texto).toContain('Tombo');
      expect(pagina.texto).toContain('Estado de conservação');
    }
    expect(textoTodo(p)).toContain('TMB-0080');
    expect(p[p.length - 1].texto).toContain('Observações');
  });

  // Amostra para inspeção visual (pdftoppm). Sem DOCUMENTOS_AMOSTRAS, não grava nada.
  it.skipIf(!process.env.DOCUMENTOS_AMOSTRAS)('grava as amostras', () => {
    const saida = process.env.DOCUMENTOS_AMOSTRAS!;
    mkdirSync(saida, { recursive: true });
    const gravar = (nome: string, dados: FichaUnidadeLocalData) =>
      writeFileSync(
        join(saida, nome),
        Buffer.from(renderizarDocumento(fichaUnidadeLocal, dados, marcaTeste, emissaoTeste).doc.output('arraybuffer')),
      );
    gravar('unidades-ficha-completa.pdf', completa(40));
    gravar('unidades-ficha-minima.pdf', minima);
  });
});
