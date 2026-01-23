import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import type { CampoRelatorioFederacao } from '@/types/federacoesRelatorio';

// ================================================================
// HELPERS
// ================================================================

function formatarValor(valor: unknown, campo: CampoRelatorioFederacao): string {
  if (valor === null || valor === undefined || valor === '') return '';

  switch (campo.tipo) {
    case 'data':
      try {
        return format(new Date(valor as string), 'dd/MM/yyyy', { locale: ptBR });
      } catch {
        return String(valor);
      }
    case 'badge':
      if (campo.id === 'status') {
        const labels: Record<string, string> = {
          em_analise: 'Em Análise',
          ativo: 'Ativa',
          inativo: 'Inativa',
          rejeitado: 'Rejeitada',
        };
        return labels[String(valor)] || String(valor);
      }
      return String(valor);
    default:
      return String(valor);
  }
}

function gerarNomeArquivo(prefixo: string, extensao: 'xlsx' | 'csv'): string {
  const timestamp = format(new Date(), 'yyyy-MM-dd-HHmm');
  return `${prefixo}-${timestamp}.${extensao}`;
}

// ================================================================
// EXPORTAR EXCEL
// ================================================================

export function exportarFederacoesExcel(
  dados: Record<string, unknown>[],
  camposSelecionados: CampoRelatorioFederacao[],
  nomeRelatorio: string = 'federacoes'
): void {
  // Criar cabeçalhos
  const headers = camposSelecionados.map((c) => c.label);

  // Criar linhas de dados
  const rows = dados.map((item) =>
    camposSelecionados.map((campo) => {
      const valor = item[campo.id];
      return formatarValor(valor, campo);
    })
  );

  // Criar planilha
  const wsData = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Ajustar larguras das colunas
  const colWidths = camposSelecionados.map((campo) => {
    switch (campo.largura) {
      case 'pequena': return { wch: 10 };
      case 'media': return { wch: 18 };
      case 'grande': return { wch: 30 };
      default: return { wch: 15 };
    }
  });
  ws['!cols'] = colWidths;

  // Criar workbook e salvar
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Relatório');

  const nomeArquivo = gerarNomeArquivo(nomeRelatorio, 'xlsx');
  XLSX.writeFile(wb, nomeArquivo);
}

// ================================================================
// EXPORTAR CSV
// ================================================================

export function exportarFederacoesCSV(
  dados: Record<string, unknown>[],
  camposSelecionados: CampoRelatorioFederacao[],
  nomeRelatorio: string = 'federacoes'
): void {
  // Criar cabeçalhos
  const headers = camposSelecionados.map((c) => `"${c.label}"`).join(';');

  // Criar linhas de dados
  const rows = dados.map((item) =>
    camposSelecionados
      .map((campo) => {
        const valor = item[campo.id];
        const textoFormatado = formatarValor(valor, campo);
        // Escapar aspas duplas
        const textoEscapado = textoFormatado.replace(/"/g, '""');
        return `"${textoEscapado}"`;
      })
      .join(';')
  );

  // Montar CSV
  const csvContent = [headers, ...rows].join('\n');

  // Criar blob com BOM para UTF-8
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

  // Download
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = gerarNomeArquivo(nomeRelatorio, 'csv');
  link.click();
  URL.revokeObjectURL(link.href);
}
