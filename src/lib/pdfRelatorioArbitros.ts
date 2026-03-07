/**
 * Geração de PDF institucional para Relatório de Árbitros
 * Usa jsPDF com timbre do IDJUV/Governo de Roraima
 */
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { loadLogos, calculateLogoDimensions, type LogoCache } from './pdfTemplate';

export interface ArbitroExportData {
  [key: string]: unknown;
}

interface ConfigRelatorioArbitros {
  titulo?: string;
  subtitulo?: string;
  campos: { key: string; label: string }[];
  resumo?: { total: number; pendentes: number; aprovados: number; rejeitados: number };
}

const LOGO_MAX_HEIGHT = 14;
const LOGO_GOV_HEIGHT = 7;

export async function gerarRelatorioArbitrosPDF(
  dados: ArbitroExportData[],
  config: ConfigRelatorioArbitros
): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 15;
  const marginRight = 15;
  const marginTop = 15;
  const marginBottom = 15;
  const contentWidth = pageWidth - marginLeft - marginRight;

  let currentY = marginTop;
  let currentPage = 1;

  // Load logos
  const loadedLogos = await loadLogos();
  const logos = { governo: loadedLogos.governo, idjuv: loadedLogos.idjuvOficial };

  // Calculate column widths proportionally
  const numCols = config.campos.length;
  const colWidths = config.campos.map(c => {
    if (['nome', 'email', 'indicacao', 'local_trabalho'].includes(c.key)) return contentWidth * 0.15;
    if (['protocolo', 'modalidade', 'cidade'].includes(c.key)) return contentWidth * 0.10;
    return contentWidth * 0.07;
  });
  // Normalize to fit contentWidth
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  const normalizedWidths = colWidths.map(w => (w / totalW) * contentWidth);

  function addHeader(): void {
    // Logos
    if (logos.governo?.data) {
      try {
        const dims = calculateLogoDimensions(logos.governo.width, logos.governo.height, LOGO_GOV_HEIGHT);
        doc.addImage(logos.governo.data, 'PNG', marginLeft, currentY, dims.width, dims.height);
      } catch (e) { console.warn('Erro logo governo:', e); }
    }
    if (logos.idjuv?.data) {
      try {
        const dims = calculateLogoDimensions(logos.idjuv.width, logos.idjuv.height, LOGO_MAX_HEIGHT);
        doc.addImage(logos.idjuv.data, 'PNG', pageWidth - marginRight - dims.width, currentY, dims.width, dims.height);
      } catch (e) { console.warn('Erro logo IDJUV:', e); }
    }

    // Institutional text
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('GOVERNO DO ESTADO DE RORAIMA', pageWidth / 2, currentY + 5, { align: 'center' });
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Instituto de Desporto, Juventude e Lazer do Estado de Roraima', pageWidth / 2, currentY + 9, { align: 'center' });

    // Title
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(config.titulo || 'Relatório de Cadastro de Árbitros', pageWidth / 2, currentY + 16, { align: 'center' });

    if (config.subtitulo) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(config.subtitulo, pageWidth / 2, currentY + 21, { align: 'center' });
      doc.setTextColor(0);
    }

    // Gold line
    doc.setDrawColor(180, 145, 75);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, currentY + 23, pageWidth - marginRight, currentY + 23);

    currentY += 26;
  }

  function addFooter(): void {
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text(`Página ${currentPage}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
    doc.text('Sistema IDJuv — Documento gerado eletronicamente', marginLeft, pageHeight - 8);
    doc.text(format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }), pageWidth - marginRight, pageHeight - 8, { align: 'right' });
    doc.setTextColor(0);
  }

  function addResumo(): void {
    if (!config.resumo) return;
    const r = config.resumo;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    
    const items = [
      `Total: ${r.total}`,
      `Pendentes: ${r.pendentes}`,
      `Aprovados: ${r.aprovados}`,
      `Rejeitados: ${r.rejeitados}`,
    ];
    doc.text(items.join('   |   '), marginLeft, currentY + 4);
    currentY += 8;
  }

  function addTableHeader(): void {
    const rowHeight = 7;
    doc.setFillColor(0, 68, 68); // Verde institucional
    doc.rect(marginLeft, currentY, contentWidth, rowHeight, 'F');

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255);

    let xPos = marginLeft + 1;
    config.campos.forEach((campo, i) => {
      doc.text(campo.label, xPos, currentY + 5);
      xPos += normalizedWidths[i];
    });

    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');
    currentY += rowHeight;
  }

  function checkPageBreak(height: number): void {
    if (currentY + height > pageHeight - marginBottom) {
      addFooter();
      doc.addPage();
      currentPage++;
      currentY = marginTop;
      addHeader();
      addTableHeader();
    }
  }

  function addDataRow(row: ArbitroExportData, index: number): void {
    const rowHeight = 6;
    checkPageBreak(rowHeight);

    if (index % 2 === 0) {
      doc.setFillColor(248, 249, 250);
      doc.rect(marginLeft, currentY, contentWidth, rowHeight, 'F');
    }

    doc.setFontSize(6.5);
    let xPos = marginLeft + 1;
    config.campos.forEach((campo, i) => {
      const val = String(row[campo.label] ?? '—');
      const maxChars = Math.floor((normalizedWidths[i] - 2) / 1.5);
      const truncated = val.length > maxChars ? val.substring(0, maxChars - 1) + '…' : val;
      doc.text(truncated, xPos, currentY + 4);
      xPos += normalizedWidths[i];
    });

    currentY += rowHeight;
  }

  // === RENDER ===
  addHeader();
  addResumo();
  addTableHeader();

  dados.forEach((row, i) => addDataRow(row, i));

  addFooter();

  const filename = `relatorio-arbitros-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
  doc.save(filename);
}
