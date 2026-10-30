/**
 * Função isolada de exportação para Excel
 * Não altera nenhum arquivo existente
 */

import * as XLSX from 'xlsx';

export function exportarParaExcel(
  dados: Record<string, unknown>[],
  nomeArquivo: string,
  nomeAba: string = 'Dados'
) {
  const ws = XLSX.utils.json_to_sheet(dados);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, nomeAba);
  XLSX.writeFile(wb, `${nomeArquivo}-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

/**
 * Planilha a partir de linhas já montadas (Gerador de relatórios): números continuam números, e as colunas de
 * `colunasMoeda` recebem o formato de R$ abaixo da linha de cabeçalho.
 */
export function exportarLinhasParaExcel(
  linhas: (string | number | null)[][],
  nomeArquivo: string,
  opcoes: { colunasMoeda?: number[]; linhaCabecalho?: number; nomeAba?: string } = {},
) {
  const ws = XLSX.utils.aoa_to_sheet(linhas);
  const inicio = (opcoes.linhaCabecalho ?? 0) + 1;
  for (let r = inicio; r < linhas.length; r++) {
    for (const c of opcoes.colunasMoeda ?? []) {
      const celula = ws[XLSX.utils.encode_cell({ r, c })];
      if (celula && celula.t === 'n') celula.z = '"R$" #,##0.00';
    }
  }
  const larguras = (linhas[opcoes.linhaCabecalho ?? 0] ?? []).map((_, c) => ({
    wch: Math.min(60, Math.max(10, ...linhas.slice(inicio - 1).map((l) => String(l[c] ?? '').length + 2))),
  }));
  ws['!cols'] = larguras;
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, (opcoes.nomeAba ?? 'Relatório').slice(0, 31));
  XLSX.writeFile(wb, nomeArquivo);
}
