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
