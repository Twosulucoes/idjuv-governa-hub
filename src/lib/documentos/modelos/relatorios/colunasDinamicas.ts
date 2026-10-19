import { camposChaveValor, paragrafo, secao, tabela } from '../../blocos';
import type { Campo, Celula, ColunaTabela } from '../../blocos';
import type { Bloco, DocumentoModelo } from '../../tipos';

/** Grupo de um agrupamento (até 3 níveis). Grupo-folha traz as linhas; os demais, os subgrupos. */
export interface GrupoRelatorioDinamico {
  rotulo: string;
  contagem: number;
  subgrupos: GrupoRelatorioDinamico[];
  linhas: Record<string, Celula>[];
}

/**
 * Relatório de colunas escolhidas na tela (Central de relatórios). As colunas e os valores já chegam
 * formatados como texto: o modelo só imprime.
 */
export interface DadosRelatorioDinamico {
  titulo: string;
  subtitulo?: string;
  /** Rótulo do tipo de relatório ("Servidores", "Portarias"…). */
  tipoRotulo: string;
  colunas: ColunaTabela[];
  totalRegistros: number;
  /** Contagem por valor do 1º agrupamento. */
  resumo?: Campo[];
  /** Com agrupamento; sem ele, `linhas`. */
  grupos?: GrupoRelatorioDinamico[];
  linhas?: Record<string, Celula>[];
  /** Subtotal por grupo e total geral. */
  mostrarTotais: boolean;
  nomeArquivo: string;
}

const registros = (n: number): string => `${n} registro(s)`;

function blocosDoGrupo(d: DadosRelatorioDinamico, g: GrupoRelatorioDinamico, caminho: string[]): Bloco[] {
  const rotulos = [...caminho, g.rotulo];
  // O caminho completo no título da seção mostra a hierarquia ("Diretoria A / Efetivo (3)").
  const cabecalho = secao({ texto: `${rotulos.join(' / ')} (${g.contagem})` });
  if (g.subgrupos.length > 0) return [cabecalho, ...g.subgrupos.flatMap((s) => blocosDoGrupo(d, s, rotulos))];
  return [
    cabecalho,
    tabela({
      colunas: d.colunas,
      linhas: g.linhas,
      totais: d.mostrarTotais ? { [d.colunas[0].chave]: `Subtotal: ${registros(g.linhas.length)}` } : undefined,
    }),
  ];
}

export const relatorioDinamico: DocumentoModelo<DadosRelatorioDinamico> = {
  tipo: 'relatorios-colunas-dinamicas',
  familia: 'relatorio',
  orientacao: 'retrato',
  titulo: (d) => d.titulo || 'Relatório',
  subtitulo: (d) =>
    [d.subtitulo, `Total: ${registros(d.totalRegistros)}`, `Tipo: ${d.tipoRotulo}`].filter(Boolean).join(' · '),
  nomeArquivo: (d) => d.nomeArquivo,
  blocos: (d) => {
    if (d.colunas.length === 0) return [paragrafo({ texto: 'Nenhuma coluna selecionada para o relatório.' })];
    const resumo = d.resumo?.length ? [secao({ texto: 'Resumo' }), camposChaveValor({ colunas: 3, campos: d.resumo })] : [];
    const corpo = d.grupos?.length
      ? d.grupos.flatMap((g) => blocosDoGrupo(d, g, []))
      : [tabela({ colunas: d.colunas, linhas: d.linhas ?? [] })];
    const total = d.mostrarTotais ? [paragrafo({ texto: `TOTAL GERAL: ${registros(d.totalRegistros)}`, negrito: true })] : [];
    return [...resumo, ...corpo, ...total];
  },
};

/** Mesmo relatório quando a tela pede paisagem (a orientação do modelo é fixa). */
export const relatorioDinamicoPaisagem: DocumentoModelo<DadosRelatorioDinamico> = {
  ...relatorioDinamico,
  tipo: 'relatorios-colunas-dinamicas-paisagem',
  orientacao: 'paisagem',
};
