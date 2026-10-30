import { paragrafo, secao, tabela } from '../../blocos';
import type { Celula, ColunaTabela } from '../../blocos';
import type { Bloco, DocumentoModelo } from '../../tipos';

/** Grupo do relatório (até 2 níveis): o do último nível traz as linhas; os demais, os subgrupos. */
export interface GrupoRelatorioGerador {
  rotulo: string;
  quantidade: number;
  /** Subtotal já formatado, por chave de coluna (só as colunas com total escolhido). */
  totais: Record<string, Celula>;
  subgrupos: GrupoRelatorioGerador[];
  linhas: Record<string, Celula>[];
}

/**
 * Relatório montado no Gerador de relatórios (Financeiro → Relatórios). Colunas, valores e totais chegam
 * formatados como texto: o modelo só imprime. Subtotal por grupo e total geral seguem a função escolhida em
 * cada coluna (soma, média, maior, menor).
 */
export interface DadosRelatorioGerador {
  titulo: string;
  /** Nome da fonte ("Empenhos (FIP 614)"). */
  fonte: string;
  /** "Situação: Pago, Emitido · Período: 01/10/2026 a 31/10/2026". */
  filtros: string[];
  colunas: ColunaTabela[];
  quantidade: number;
  grupos?: GrupoRelatorioGerador[];
  linhas?: Record<string, Celula>[];
  /** Total geral formatado; vazio = sem linha de total. */
  totais: Record<string, Celula>;
  /** Rótulos das funções usadas ("Empenhado: soma"), para quem lê saber o que é a linha de total. */
  legendaTotais?: string;
  nomeArquivo: string;
}

const registros = (n: number): string => `${n} registro(s)`;

function linhaTotal(d: DadosRelatorioGerador, rotulo: string, totais: Record<string, Celula>): Record<string, Celula> | undefined {
  if (d.colunas.length === 0) return undefined;
  return { ...totais, [d.colunas[0].chave]: totais[d.colunas[0].chave] ?? rotulo };
}

/** "412 registro(s) · Empenhado: R$ 10,00 · Liquidado: R$ 5,00" (total de grupo com subgrupos e total geral saem em texto). */
function textoTotais(d: DadosRelatorioGerador, quantidade: number, totais: Record<string, Celula>): string {
  const valores = d.colunas
    .filter((c) => totais[c.chave] !== undefined && totais[c.chave] !== null && totais[c.chave] !== '')
    .map((c) => `${c.titulo}: ${totais[c.chave]}`);
  return [registros(quantidade), ...valores].join(' · ');
}

function blocosDoGrupo(d: DadosRelatorioGerador, g: GrupoRelatorioGerador, caminho: string[]): Bloco[] {
  const rotulos = [...caminho, g.rotulo];
  const cabecalho = secao({ texto: `${rotulos.join(' / ')} (${g.quantidade})` });
  if (g.subgrupos.length > 0)
    return [
      cabecalho,
      ...g.subgrupos.flatMap((s) => blocosDoGrupo(d, s, rotulos)),
      paragrafo({ texto: `Subtotal de ${rotulos.join(' / ')}: ${textoTotais(d, g.quantidade, g.totais)}`, negrito: true }),
    ];
  return [
    cabecalho,
    tabela({ colunas: d.colunas, linhas: g.linhas, totais: linhaTotal(d, `Subtotal: ${registros(g.quantidade)}`, g.totais) }),
  ];
}

export const relatorioGerador: DocumentoModelo<DadosRelatorioGerador> = {
  tipo: 'relatorios-gerador',
  familia: 'relatorio',
  orientacao: 'retrato',
  titulo: (d) => d.titulo || 'Relatório',
  subtitulo: (d) => [`Fonte: ${d.fonte}`, `Total: ${registros(d.quantidade)}`].join(' · '),
  nomeArquivo: (d) => d.nomeArquivo,
  blocos: (d) => {
    if (d.colunas.length === 0) return [paragrafo({ texto: 'Nenhuma coluna selecionada para o relatório.' })];
    const filtros = paragrafo({ texto: d.filtros.length > 0 ? `Filtros: ${d.filtros.join(' · ')}` : 'Filtros: nenhum (todos os registros).' });
    if (d.quantidade === 0) return [filtros, paragrafo({ texto: 'Nenhum registro atende aos filtros escolhidos.' })];
    const legenda = d.legendaTotais ? [paragrafo({ texto: `Totais: ${d.legendaTotais}` })] : [];
    if (d.grupos?.length) {
      return [
        filtros,
        ...legenda,
        ...d.grupos.flatMap((g) => blocosDoGrupo(d, g, [])),
        secao({ texto: 'Total geral' }),
        paragrafo({ texto: textoTotais(d, d.quantidade, d.totais), negrito: true }),
      ];
    }
    return [
      filtros,
      ...legenda,
      tabela({ colunas: d.colunas, linhas: d.linhas ?? [], totais: linhaTotal(d, `Total: ${registros(d.quantidade)}`, d.totais) }),
    ];
  },
};

/** Mesmo relatório deitado (muitas colunas ou escolha do usuário). */
export const relatorioGeradorPaisagem: DocumentoModelo<DadosRelatorioGerador> = {
  ...relatorioGerador,
  tipo: 'relatorios-gerador-paisagem',
  orientacao: 'paisagem',
};
