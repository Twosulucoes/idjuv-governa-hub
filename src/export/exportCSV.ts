/**
 * Função isolada de exportação para CSV
 * Não altera nenhum arquivo existente
 * Células sempre entre aspas e sem fórmula (celulaCsv).
 */
import { celulaCsv } from '@/export/csvSeguro';

export function exportarParaCSV(
  dados: Record<string, unknown>[],
  nomeArquivo: string
) {
  if (dados.length === 0) return;

  const headers = Object.keys(dados[0]);
  const csvContent = [
    headers.map(celulaCsv).join(';'),
    ...dados.map((row) =>
      headers
        .map((h) => celulaCsv(row[h]))
        .join(';')
    ),
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${nomeArquivo}-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
