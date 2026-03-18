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
  const marginLeft = 10;
  const marginRight = 10;
  const marginTop = 12;
  const marginBottom = 12;
  const contentWidth = pageWidth - marginLeft - marginRight;

  let currentY = marginTop;
  let currentPage = 1;

  const loadedLogos = await loadLogos();
  const logos = { governo: loadedLogos.governo, idjuv: loadedLogos.idjuvOficial };

  // Add "Ord." as first column + user-selected fields
  const allCampos = [{ key: '_ord', label: 'Ord.' }, ...config.campos];

  // Calculate column widths
  const colWidths = allCampos.map(c => {
    if (c.key === '_ord') return 8;
    if (['nome', 'email', 'indicacao', 'local_trabalho'].includes(c.key)) return contentWidth * 0.14;
    if (['protocolo', 'modalidade', 'cidade', 'modalidades', 'categorias'].includes(c.key)) return contentWidth * 0.10;
    if (['cpf', 'rg', 'celular'].includes(c.key)) return contentWidth * 0.09;
    if (['created_at', 'data_nascimento'].includes(c.key)) return contentWidth * 0.07;
    return contentWidth * 0.07;
  });
  const totalW = colWidths.reduce((a, b) => a + b, 0);
  const normalizedWidths = colWidths.map(w => (w / totalW) * contentWidth);

  function addHeader(): void {
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

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('GOVERNO DO ESTADO DE RORAIMA', pageWidth / 2, currentY + 5, { align: 'center' });
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Instituto de Desporto, Juventude e Lazer do Estado de Roraima', pageWidth / 2, currentY + 9, { align: 'center' });

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

    doc.setDrawColor(180, 145, 75);
    doc.setLineWidth(0.5);
    doc.line(marginLeft, currentY + 23, pageWidth - marginRight, currentY + 23);

    currentY += 26;
  }

  function addFooter(): void {
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text(`Página ${currentPage}`, pageWidth / 2, pageHeight - 6, { align: 'center' });
    doc.text('Sistema IDJuv — Documento gerado eletronicamente', marginLeft, pageHeight - 6);
    doc.text(format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }), pageWidth - marginRight, pageHeight - 6, { align: 'right' });
    doc.setTextColor(0);
  }

  function addTableHeader(): void {
    const rowHeight = 6;
    doc.setFillColor(0, 68, 68);
    doc.rect(marginLeft, currentY, contentWidth, rowHeight, 'F');

    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255);

    let xPos = marginLeft;
    allCampos.forEach((campo, i) => {
      const label = campo.label.toUpperCase();
      doc.text(label, xPos + 1, currentY + 4);
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
    const fontSize = 5.8;
    const lineHeight = 3.2;
    const cellPadding = 1;
    const minRowHeight = 5.5;

    doc.setFontSize(fontSize);

    // Calculate wrapped text for each column to determine row height
    const wrappedTexts: string[][] = [];
    allCampos.forEach((campo, i) => {
      let val: string;
      if (campo.key === '_ord') {
        val = String(index + 1);
      } else {
        val = String(row[campo.label] ?? '—');
      }
      const colW = normalizedWidths[i] - 2;
      const lines = doc.splitTextToSize(val, colW) as string[];
      wrappedTexts.push(lines);
    });

    const maxLines = Math.max(...wrappedTexts.map((lines) => lines.length), 1);
    const rowHeight = Math.max(minRowHeight, maxLines * lineHeight + 2);

    checkPageBreak(rowHeight);

    if (index % 2 === 0) {
      doc.setFillColor(245, 247, 249);
      doc.rect(marginLeft, currentY, contentWidth, rowHeight, 'F');
    }

    // Light grid line
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.1);
    doc.line(marginLeft, currentY + rowHeight, marginLeft + contentWidth, currentY + rowHeight);

    doc.setFontSize(fontSize);
    let xPos = marginLeft;
    wrappedTexts.forEach((lines, i) => {
      lines.forEach((line, lineIdx) => {
        doc.text(line, xPos + cellPadding, currentY + 3.5 + lineIdx * lineHeight);
      });
      xPos += normalizedWidths[i];
    });

    currentY += rowHeight;
  }

  // === RENDER ===
  addHeader();
  addTableHeader();

  dados.forEach((row, i) => addDataRow(row, i));

  addFooter();

  const filename = `relatorio-arbitros-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
  doc.save(filename);
}
