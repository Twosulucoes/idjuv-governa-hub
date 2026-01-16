/**
 * Relatório de Servidores - Situação de Portaria de Nomeação
 * Agrupa servidores em: COM PORTARIA e SEM PORTARIA
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

export interface ServidorPortariaItem {
  ord: number;
  nome: string;
  cpf: string;
  cargo: string;
  unidade: string;
  codigo: string;
  portaria?: string;
}

export interface RelatorioSituacaoPortariaData {
  servidoresComPortaria: ServidorPortariaItem[];
  servidoresSemPortaria: ServidorPortariaItem[];
  dataGeracao: string;
}

// ===== Constantes de largura (total = 170mm para respeitar margens) =====

const colWidths = {
  ord: 10,
  nome: 40,
  cpf: 26,
  cargo: 30,
  unidade: 18,
  codigo: 14,
  portaria: 32
};

// ===== Função auxiliar para desenhar tabela =====

const drawTableHeader = (doc: jsPDF, y: number): number => {
  const startX = PAGINA.margemEsquerda;
  const { width } = getPageDimensions(doc);
  const tableWidth = width - PAGINA.margemEsquerda - PAGINA.margemDireita;
  
  // Fundo do header
  setColor(doc, CORES.primaria, 'fill');
  doc.rect(startX, y - 4, tableWidth, 7, 'F');
  
  setColor(doc, CORES.textoBranco);
  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  
  let x = startX + 1;
  doc.text('Ord.', x, y);
  x += colWidths.ord;
  doc.text('Nome', x, y);
  x += colWidths.nome;
  doc.text('CPF', x, y);
  x += colWidths.cpf;
  doc.text('Cargo', x, y);
  x += colWidths.cargo;
  doc.text('Unidade', x, y);
  x += colWidths.unidade;
  doc.text('Cód.', x, y);
  x += colWidths.codigo;
  doc.text('Portaria', x, y);
  
  return y + 6;
};

const drawTableRow = (doc: jsPDF, servidor: ServidorPortariaItem, y: number, isAlternate: boolean): number => {
  const startX = PAGINA.margemEsquerda;
  const { width } = getPageDimensions(doc);
  const tableWidth = width - PAGINA.margemEsquerda - PAGINA.margemDireita;
  const lineHeight = 3;
  const fontSize = 6.5;
  
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', 'normal');
  
  // Quebrar textos longos em múltiplas linhas
  const nomeLines = doc.splitTextToSize(servidor.nome || '', colWidths.nome - 2);
  const cargoLines = doc.splitTextToSize(servidor.cargo || '-', colWidths.cargo - 2);
  const portariaLines = doc.splitTextToSize(servidor.portaria || '-', colWidths.portaria - 2);
  
  // Calcular altura máxima da linha baseado no maior número de linhas
  const maxLines = Math.max(nomeLines.length, cargoLines.length, portariaLines.length, 1);
  const rowHeight = maxLines * lineHeight + 2;
  
  // Fundo alternado
  if (isAlternate) {
    setColor(doc, CORES.fundoClaro, 'fill');
    doc.rect(startX, y - 3, tableWidth, rowHeight, 'F');
  }
  
  setColor(doc, CORES.textoEscuro);
  
  let x = startX + 1;
  
  // Ord
  doc.text(String(servidor.ord), x, y);
  x += colWidths.ord;
  
  // Nome (multilinha)
  nomeLines.forEach((line: string, i: number) => {
    doc.text(line, x, y + (i * lineHeight));
  });
  x += colWidths.nome;
  
  // CPF
  doc.text(formatCPF(servidor.cpf), x, y);
  x += colWidths.cpf;
  
  // Cargo (multilinha)
  cargoLines.forEach((line: string, i: number) => {
    doc.text(line, x, y + (i * lineHeight));
  });
  x += colWidths.cargo;
  
  // Unidade
  doc.text((servidor.unidade || '-').substring(0, 10), x, y);
  x += colWidths.unidade;
  
  // Código
  doc.text((servidor.codigo || '-').substring(0, 8), x, y);
  x += colWidths.codigo;
  
  // Portaria (multilinha)
  portariaLines.forEach((line: string, i: number) => {
    doc.text(line, x, y + (i * lineHeight));
  });
  
  return y + rowHeight;
};

// ===== Geração do Relatório =====

export const generateRelatorioSituacaoPortaria = async (data: RelatorioSituacaoPortariaData): Promise<void> => {
  const logos = await loadLogos();
  const doc = new jsPDF();
  const { width, contentWidth } = getPageDimensions(doc);
  
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'RELATÓRIO DE SERVIDORES - SITUAÇÃO DE PORTARIA',
    subtitulo: 'Servidores com e sem Portaria de Nomeação',
    fundoEscuro: true,
  }, logos);
  
  // Resumo geral
  const totalCom = data.servidoresComPortaria.length;
  const totalSem = data.servidoresSemPortaria.length;
  const totalGeral = totalCom + totalSem;
  
  setColor(doc, CORES.cinzaMedio);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data de geração: ${data.dataGeracao}`, PAGINA.margemEsquerda, y);
  doc.text(`Total de servidores: ${totalGeral}`, width - PAGINA.margemDireita - 50, y);
  y += 10;
  
  // ========== SEÇÃO 1: SERVIDORES COM PORTARIA ==========
  y = addSectionHeader(doc, `SERVIDORES COM PORTARIA DE NOMEAÇÃO (${totalCom})`, y);
  
  if (totalCom > 0) {
    y = drawTableHeader(doc, y);
    
    data.servidoresComPortaria.forEach((servidor, index) => {
      y = checkPageBreak(doc, y, 20);
      
      // Se mudou de página, redesenha o header
      if (y < 50) {
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
    doc.text(`Subtotal: ${totalCom} servidor(es)`, width - PAGINA.margemDireita - 45, y);
  } else {
    setColor(doc, CORES.cinzaMedio);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text('Nenhum servidor com portaria de nomeação registrada.', PAGINA.margemEsquerda, y);
  }
  
  y += 15;
  
  // ========== SEÇÃO 2: SERVIDORES SEM PORTARIA ==========
  y = checkPageBreak(doc, y, 50);
  y = addSectionHeader(doc, `SERVIDORES SEM PORTARIA DE NOMEAÇÃO (${totalSem})`, y);
  
  if (totalSem > 0) {
    y = drawTableHeader(doc, y);
    
    data.servidoresSemPortaria.forEach((servidor, index) => {
      y = checkPageBreak(doc, y, 20);
      
      // Se mudou de página, redesenha o header
      if (y < 50) {
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
    doc.text(`Subtotal: ${totalSem} servidor(es)`, width - PAGINA.margemDireita - 45, y);
  } else {
    setColor(doc, CORES.cinzaMedio);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.text('Todos os servidores possuem portaria de nomeação registrada.', PAGINA.margemEsquerda, y);
  }
  
  y += 15;
  
  // ========== RESUMO FINAL ==========
  y = checkPageBreak(doc, y, 40);
  
  // Box de resumo
  setColor(doc, CORES.fundoClaro, 'fill');
  doc.roundedRect(PAGINA.margemEsquerda, y, contentWidth, 25, 3, 3, 'F');
  
  setColor(doc, CORES.primaria, 'draw');
  doc.setLineWidth(0.5);
  doc.roundedRect(PAGINA.margemEsquerda, y, contentWidth, 25, 3, 3, 'S');
  
  y += 7;
  setColor(doc, CORES.primaria);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('RESUMO GERAL', PAGINA.margemEsquerda + 5, y);
  
  y += 7;
  doc.setFontSize(9);
  const col1 = PAGINA.margemEsquerda + 10;
  const col2 = PAGINA.margemEsquerda + 70;
  const col3 = PAGINA.margemEsquerda + 130;
  
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Geral: ${totalGeral}`, col1, y);
  
  setColor(doc, CORES.secundaria);
  doc.text(`Com Portaria: ${totalCom}`, col2, y);
  
  setColor(doc, CORES.erro);
  doc.text(`Sem Portaria: ${totalSem}`, col3, y);
  
  y += 6;
  setColor(doc, CORES.cinzaMedio);
  doc.setFontSize(8);
  const percentCom = totalGeral > 0 ? ((totalCom / totalGeral) * 100).toFixed(1) : '0';
  const percentSem = totalGeral > 0 ? ((totalSem / totalGeral) * 100).toFixed(1) : '0';
  doc.text(`(${percentCom}% regularizados)`, col2, y);
  doc.text(`(${percentSem}% pendentes)`, col3, y);
  
  generateInstitutionalFooter(doc, { sistema: 'Sistema de Gestão de RH - IDJUV' });
  addPageNumbers(doc);
  
  doc.save(`Relatorio_Situacao_Portaria_${data.dataGeracao.replace(/\//g, '-')}.pdf`);
};
