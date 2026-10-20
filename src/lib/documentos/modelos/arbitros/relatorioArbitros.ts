import { secao, tabela } from '../../blocos';
import type { Celula, ColunaTabela } from '../../blocos';
import type { Bloco, DocumentoModelo } from '../../tipos';

/** Campo escolhido na tela (chave do cadastro + rótulo da coluna). */
export interface CampoRelatorioArbitros {
  chave: string;
  rotulo: string;
}

/** Linha já formatada como texto pela tela, indexada pela chave do campo. */
export type LinhaRelatorioArbitros = Record<string, Celula>;

export interface GrupoRelatorioArbitros {
  modalidade: string;
  linhas: LinhaRelatorioArbitros[];
}

/**
 * Relatório de cadastro de árbitros (Admin → Relatórios). Os campos são os que a tela marcou; o modelo só
 * acrescenta a coluna "Ord." (numeração contínua, mesmo atravessando grupos) e imprime.
 */
export interface DadosRelatorioArbitros {
  titulo?: string;
  subtitulo?: string;
  campos: CampoRelatorioArbitros[];
  /** Sem agrupamento. */
  linhas: LinhaRelatorioArbitros[];
  /** Agrupado por modalidade: quando presente (e não vazio), substitui `linhas`. */
  grupos?: GrupoRelatorioArbitros[];
  /** Carimbo de data do nome do arquivo (ex.: `2026-10-20-1430`). */
  carimboArquivo: string;
}

const TITULO_PADRAO = 'Relatório de Cadastro de Árbitros';
const CHAVE_ORDEM = '_ord';
/** mm livres abaixo do título do grupo para o cabeçalho da tabela e a 1ª linha não ficarem na página seguinte. */
const RESERVA_GRUPO = 32;
/** Campos com vários itens separados por vírgula: um item por linha na célula, para todos aparecerem. */
const ITEM_POR_LINHA = new Set(['modalidades_texto', 'categorias_texto']);

/** Mesma proporção de larguras do relatório antigo. */
function pesoDe(chave: string): number {
  if (['nome', 'email', 'indicacao', 'local_trabalho'].includes(chave)) return 14;
  if (['protocolo', 'modalidade', 'cidade', 'modalidades_texto', 'categorias_texto'].includes(chave)) return 10;
  if (['cpf', 'rg', 'celular'].includes(chave)) return 9;
  return 7;
}

function colunasDe(d: DadosRelatorioArbitros): ColunaTabela[] {
  return [
    { chave: CHAVE_ORDEM, titulo: 'ORD.', peso: 4 },
    ...d.campos.map((c) => ({ chave: c.chave, titulo: c.rotulo.toUpperCase(), peso: pesoDe(c.chave) })),
  ];
}

function linhaImpressa(d: DadosRelatorioArbitros, linha: LinhaRelatorioArbitros, ordem: number): Record<string, Celula> {
  const saida: Record<string, Celula> = { [CHAVE_ORDEM]: ordem };
  for (const c of d.campos) {
    const valor = linha[c.chave];
    saida[c.chave] =
      ITEM_POR_LINHA.has(c.chave) && typeof valor === 'string'
        ? valor.split(',').map((p) => p.trim()).filter(Boolean).join('\n')
        : valor;
  }
  return saida;
}

const arbitros = (n: number): string => `${n} árbitro${n !== 1 ? 's' : ''}`;

export const relatorioArbitros: DocumentoModelo<DadosRelatorioArbitros> = {
  tipo: 'arbitros-relatorio-cadastro',
  familia: 'relatorio',
  orientacao: 'paisagem',
  titulo: (d) => d.titulo || TITULO_PADRAO,
  subtitulo: (d) => d.subtitulo,
  nomeArquivo: (d) => `relatorio-arbitros-${d.carimboArquivo}.pdf`,
  blocos: (d) => {
    const colunas = colunasDe(d);
    if (!d.grupos?.length) {
      return [tabela({ colunas, linhas: d.linhas.map((l, i) => linhaImpressa(d, l, i + 1)) })];
    }
    let ordem = 0;
    return d.grupos.flatMap((g): Bloco[] => [
      // Cabeçalho da tabela em até 2 linhas ("DATA DE CADASTRO") + 1ª linha com quebra: reserva maior que o padrão.
      secao({ texto: `${g.modalidade.toUpperCase()} (${arbitros(g.linhas.length)})`, reservaAbaixo: RESERVA_GRUPO }),
      tabela({ colunas, linhas: g.linhas.map((l) => linhaImpressa(d, l, ++ordem)) }),
    ]);
  },
};
