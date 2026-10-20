import { camposChaveValor, paragrafo, secao, tabela } from '../../blocos';
import type { Celula, ColunaTabela } from '../../blocos';
import type { Bloco, DocumentoModelo } from '../../tipos';

/** Coluna escolhida na tela (chave do campo + rótulo). */
export interface ColunaRelatorioPortarias {
  chave: string;
  rotulo: string;
}

/** Grupo do agrupamento escolhido; sem agrupamento a tela manda um grupo só ("Todas as Portarias"). */
export interface GrupoRelatorioPortarias {
  rotulo: string;
  /** Linhas já formatadas como texto, indexadas pela chave da coluna. */
  linhas: Record<string, Celula>[];
}

/**
 * Relatório de portarias (Central de Portarias → Gerar relatório). A tela filtra, ordena, agrupa e formata;
 * o modelo só imprime. Nada de órgão no modelo: cabeçalho e rodapé vêm do motor.
 */
export interface DadosRelatorioPortarias {
  titulo?: string;
  subtitulo?: string;
  colunas: ColunaRelatorioPortarias[];
  grupos: GrupoRelatorioPortarias[];
  /** Linhas de contexto impressas abaixo do total (agrupamento, ordenação, filtros). */
  criterios?: string[];
  /** Contagem por status ("Mostrar resumo"); ausente = sem resumo. */
  resumo?: { rotulo: string; quantidade: number }[];
  /** Subtotal por grupo e total geral ("Mostrar totais"). */
  mostrarTotais: boolean;
  /** Carimbo de data do nome do arquivo (ex.: `2026-10-20-1430`). */
  carimboArquivo: string;
}

const TITULO_PADRAO = 'Relatório de Portarias';

/** Larguras relativas: texto longo (título, ementa) ganha mais espaço e quebra linha em vez de ser cortado. */
const PESOS: Record<string, number> = {
  numero: 1.1,
  titulo: 2.2,
  categoria: 1.5,
  status: 1.3,
  data_documento: 1.3,
  ementa: 2.4,
  servidores: 1.5,
  unidade: 1.1,
  cargo: 1,
  doe_numero: 1,
  doe_data: 1.3,
};

const portarias = (n: number): string => `${n} portaria(s)`;

export const relatorioPortarias: DocumentoModelo<DadosRelatorioPortarias> = {
  tipo: 'portarias-relatorio',
  familia: 'relatorio',
  orientacao: 'retrato',
  titulo: (d) => d.titulo || TITULO_PADRAO,
  subtitulo: (d) => d.subtitulo,
  nomeArquivo: (d) => `relatorio-portarias-${d.carimboArquivo}.pdf`,
  blocos: (d) => {
    const total = d.grupos.reduce((s, g) => s + g.linhas.length, 0);
    const colunas: ColunaTabela[] = d.colunas.map((c) => ({
      chave: c.chave,
      titulo: c.rotulo.toUpperCase(),
      peso: PESOS[c.chave] ?? 1,
      alinhamento: c.chave === 'servidores' ? 'centro' : undefined,
    }));
    const blocos: Bloco[] = [
      paragrafo({ texto: `Total: ${portarias(total)}` }),
      ...(d.criterios ?? []).map((texto) => paragrafo({ texto })),
    ];
    if (d.resumo?.length) {
      blocos.push(
        secao({ texto: 'Resumo por status' }),
        camposChaveValor({ campos: d.resumo.map((r) => ({ rotulo: r.rotulo, valor: r.quantidade })), colunas: 3 }),
      );
    }
    if (total === 0) {
      blocos.push(paragrafo({ texto: 'Nenhuma portaria encontrada para os filtros selecionados.' }));
      return blocos;
    }
    for (const g of d.grupos) {
      blocos.push(secao({ texto: `${g.rotulo} (${g.linhas.length})` }), tabela({ colunas, linhas: g.linhas }));
      if (d.mostrarTotais) blocos.push(paragrafo({ texto: `Subtotal: ${portarias(g.linhas.length)}` }));
    }
    if (d.mostrarTotais) blocos.push(paragrafo({ texto: `TOTAL GERAL: ${portarias(total)}`, negrito: true }));
    return blocos;
  },
};

/** Mesmo relatório em paisagem: a tela escolhe quando há muitas colunas (a orientação do modelo é fixa). */
export const relatorioPortariasPaisagem: DocumentoModelo<DadosRelatorioPortarias> = {
  ...relatorioPortarias,
  tipo: 'portarias-relatorio-paisagem',
  orientacao: 'paisagem',
};
