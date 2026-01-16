/**
 * Relatório de Servidores Agrupado por Portaria de Nomeação
 * Lista servidores organizados por número de portaria
 */
import jsPDF from 'jspdf';
import {
  loadLogos,
  generateInstitutionalHeader,
  generateInstitutionalFooter,
  addPageNumbers,
  addSectionHeader,
  CORES,
  PAGINA,
  getPageDimensions,
  setColor,
  formatCPF,
  checkPageBreak,
} from './pdfTemplate';

// ===== Interfaces =====

export interface ServidorParaPortaria {
  ord: number;
  nome: string;
  cpf: string;
  cargo: string;
  unidade: string;
  codigo: string;
}

export interface GrupoPortaria {
  numero: string;
  servidores: ServidorParaPortaria[];
}

export interface RelatorioAgrupadoPortariaData {
  grupos: GrupoPortaria[];
  servidoresSemPortaria: ServidorParaPortaria[];
  dataGeracao: string;
}

// ===== Constantes de largura =====

const colWidths = {
  ord: 10,
  nome: 55,
  cpf: 28,
  cargo: 40,
  unidade: 20,
  codigo: 17
};

// ===== Funções auxiliares =====

const drawTableHeader = (doc: jsPDF, y: number): number => {
  const startX = PAGINA.margemEsquerda;
  const { width } = getPageDimensions(doc);
  const tableWidth = width - PAGINA.margemEsquerda - PAGINA.margemDireita;
  
  setColor(doc, CORES.primaria, 'fill');
  doc.rect(startX, y - 4, tableWidth, 7, 'F');
  
  setColor(doc, CORES.textoBranco);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  
  let x = startX + 1;
  doc.text('Ord.', x, y);
  x += colWidths.ord;
  doc.text('Nome do Servidor', x, y);
  x += colWidths.nome;
  doc.text('CPF', x, y);
  x += colWidths.cpf;
  doc.text('Cargo', x, y);
  x += colWidths.cargo;
  doc.text('Unidade', x, y);
  x += colWidths.unidade;
  doc.text('Cód.', x, y);
  
  return y + 6;
};

const drawTableRow = (doc: jsPDF, servidor: ServidorParaPortaria, y: number, isAlternate: boolean): number => {
  const startX = PAGINA.margemEsquerda;
  const { width } = getPageDimensions(doc);
  const tableWidth = width - PAGINA.margemEsquerda - PAGINA.margemDireita;
  const lineHeight = 3.5;
  const fontSize = 7;
  
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', 'normal');
  
  const nomeLines = doc.splitTextToSize(servidor.nome || '', colWidths.nome - 2);
  const cargoLines = doc.splitTextToSize(servidor.cargo || '-', colWidths.cargo - 2);
  
  const maxLines = Math.max(nomeLines.length, cargoLines.length, 1);
  const rowHeight = maxLines * lineHeight + 2;
  
  if (isAlternate) {
    setColor(doc, CORES.fundoClaro, 'fill');
    doc.rect(startX, y - 3, tableWidth, rowHeight, 'F');
  }
  
  setColor(doc, CORES.textoEscuro);
  
  let x = startX + 1;
  
  doc.text(String(servidor.ord), x, y);
  x += colWidths.ord;
  
  nomeLines.forEach((line: string, i: number) => {
    doc.text(line, x, y + (i * lineHeight));
  });
  x += colWidths.nome;
  
  doc.text(formatCPF(servidor.cpf), x, y);
  x += colWidths.cpf;
  
  cargoLines.forEach((line: string, i: number) => {
    doc.text(line, x, y + (i * lineHeight));
  });
  x += colWidths.cargo;
  
  doc.text((servidor.unidade || '-').substring(0, 12), x, y);
  x += colWidths.unidade;
  
  doc.text((servidor.codigo || '-').substring(0, 10), x, y);
  
  return y + rowHeight;
};

// ===== Geração do Relatório =====

export const generateRelatorioAgrupadoPortaria = async (data: RelatorioAgrupadoPortariaData): Promise<void> => {
  const logos = await loadLogos();
  const doc = new jsPDF();
  const { width, contentWidth } = getPageDimensions(doc);
  
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'RELATÓRIO DE SERVIDORES POR PORTARIA',
    subtitulo: 'Agrupamento por Número de Portaria de Nomeação',
    fundoEscuro: true,
  }, logos);
  
  // Calcular totais
  const totalComPortaria = data.grupos.reduce((sum, g) => sum + g.servidores.length, 0);
  const totalSemPortaria = data.servidoresSemPortaria.length;
  const totalGeral = totalComPortaria + totalSemPortaria;
  
  // Resumo geral
  setColor(doc, CORES.cinzaMedio);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data de geração: ${data.dataGeracao}`, PAGINA.margemEsquerda, y);
  doc.text(`Total de servidores: ${totalGeral}`, width - PAGINA.margemDireita - 50, y);
  y += 5;
  
  // Resumo das portarias
  setColor(doc, CORES.primaria);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  const resumoPortarias = data.grupos.map(g => `${g.numero}: ${g.servidores.length}`).join(' | ');
  doc.text(`Portarias: ${resumoPortarias}`, PAGINA.margemEsquerda, y);
  y += 10;
  
  // ========== SEÇÕES POR PORTARIA ==========
  for (const grupo of data.grupos) {
    y = checkPageBreak(doc, y, 50);
    y = addSectionHeader(doc, `PORTARIA Nº ${grupo.numero} (${grupo.servidores.length} servidores)`, y);
    
    if (grupo.servidores.length > 0) {
      y = drawTableHeader(doc, y);
      
      grupo.servidores.forEach((servidor, index) => {
        const yAntes = y;
        y = checkPageBreak(doc, y, 15);
        
        if (y < yAntes) {
          y = drawTableHeader(doc, y);
        }
        
        y = drawTableRow(doc, servidor, y, index % 2 === 1);
      });
      
      // Linha de fechamento
      setColor(doc, CORES.primaria, 'draw');
      doc.setLineWidth(0.5);
      doc.line(PAGINA.margemEsquerda, y, width - PAGINA.margemDireita, y);
      y += 3;
      
      // Subtotal
      setColor(doc, CORES.primaria);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(`Subtotal: ${grupo.servidores.length} servidor(es)`, width - PAGINA.margemDireita - 45, y);
    }
    
    y += 12;
  }
  
  // ========== SEÇÃO: SERVIDORES SEM PORTARIA ==========
  if (data.servidoresSemPortaria.length > 0) {
    y = checkPageBreak(doc, y, 50);
    y = addSectionHeader(doc, `SERVIDORES SEM PORTARIA DE NOMEAÇÃO (${totalSemPortaria})`, y);
    
    y = drawTableHeader(doc, y);
    
    data.servidoresSemPortaria.forEach((servidor, index) => {
      const yAntes = y;
      y = checkPageBreak(doc, y, 15);
      
      if (y < yAntes) {
        y = drawTableHeader(doc, y);
      }
      
      y = drawTableRow(doc, servidor, y, index % 2 === 1);
    });
    
    // Linha de fechamento
    setColor(doc, CORES.primaria, 'draw');
    doc.setLineWidth(0.5);
    doc.line(PAGINA.margemEsquerda, y, width - PAGINA.margemDireita, y);
    y += 3;
    
    setColor(doc, CORES.primaria);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`Subtotal: ${totalSemPortaria} servidor(es)`, width - PAGINA.margemDireita - 45, y);
    y += 12;
  }
  
  // ========== RESUMO FINAL ==========
  y = checkPageBreak(doc, y, 45);
  
  // Box de resumo
  const boxHeight = 30 + (data.grupos.length * 5);
  setColor(doc, CORES.fundoClaro, 'fill');
  doc.roundedRect(PAGINA.margemEsquerda, y, contentWidth, boxHeight, 3, 3, 'F');
  
  setColor(doc, CORES.primaria, 'draw');
  doc.setLineWidth(0.5);
  doc.roundedRect(PAGINA.margemEsquerda, y, contentWidth, boxHeight, 3, 3, 'S');
  
  y += 7;
  setColor(doc, CORES.primaria);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('RESUMO GERAL', PAGINA.margemEsquerda + 5, y);
  
  y += 7;
  doc.setFontSize(9);
  
  // Lista de portarias com quantidades
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'normal');
  
  data.grupos.forEach((grupo, index) => {
    const col = index % 3;
    const xPos = PAGINA.margemEsquerda + 10 + (col * 60);
    if (col === 0 && index > 0) y += 5;
    
    setColor(doc, CORES.secundaria);
    doc.text(`Portaria ${grupo.numero}: ${grupo.servidores.length}`, xPos, y);
  });
  
  y += 8;
  
  // Totais finais
  const col1 = PAGINA.margemEsquerda + 10;
  const col2 = PAGINA.margemEsquerda + 70;
  const col3 = PAGINA.margemEsquerda + 130;
  
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Geral: ${totalGeral}`, col1, y);
  
  setColor(doc, CORES.secundaria);
  doc.text(`Com Portaria: ${totalComPortaria}`, col2, y);
  
  setColor(doc, CORES.erro);
  doc.text(`Sem Portaria: ${totalSemPortaria}`, col3, y);
  
  y += 5;
  setColor(doc, CORES.cinzaMedio);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  const percentCom = totalGeral > 0 ? ((totalComPortaria / totalGeral) * 100).toFixed(1) : '0';
  const percentSem = totalGeral > 0 ? ((totalSemPortaria / totalGeral) * 100).toFixed(1) : '0';
  doc.text(`(${percentCom}% regularizados)`, col2, y);
  doc.text(`(${percentSem}% pendentes)`, col3, y);
  
  generateInstitutionalFooter(doc, { sistema: 'Sistema de Gestão de RH - IDJUV' });
  addPageNumbers(doc);
  
  doc.save(`Relatorio_Servidores_Por_Portaria_${data.dataGeracao.replace(/\//g, '-')}.pdf`);
};
