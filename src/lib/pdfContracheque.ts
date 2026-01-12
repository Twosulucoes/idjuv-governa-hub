/**
 * Geração de Contracheque (Holerite) - IDJUV
 * Utiliza template institucional unificado
 */
import jsPDF from 'jspdf';
import {
  loadLogos,
  generateInstitutionalHeader,
  generateInstitutionalFooter,
  addPageNumbers,
  addSectionHeader,
  addField,
  CORES,
  PAGINA,
  getPageDimensions,
  setColor,
  formatCPF,
  formatCurrency,
  checkPageBreak,
} from './pdfTemplate';

interface RubricaItem {
  codigo: string;
  descricao: string;
  tipo: 'provento' | 'desconto';
  referencia?: number;
  valor: number;
}

interface FichaFinanceira {
  id: string;
  servidor_id: string;
  cargo_nome?: string;
  unidade_nome?: string;
  total_proventos: number;
  total_descontos: number;
  valor_liquido: number;
  base_inss?: number;
  valor_inss?: number;
  base_irrf?: number;
  valor_irrf?: number;
  quantidade_dependentes?: number;
  rubricas?: RubricaItem[];
  servidor?: {
    nome_completo: string;
    cpf: string;
    matricula?: string;
    pis_pasep?: string;
  };
}

interface DadosContracheque {
  ficha: FichaFinanceira;
  competencia: string;
  competenciaAno: number;
  competenciaMes: number;
}

/**
 * Gera o contracheque individual de um servidor
 */
export const generateContracheque = async (dados: DadosContracheque): Promise<void> => {
  const logos = await loadLogos();
  const doc = new jsPDF();
  const { width, contentWidth } = getPageDimensions(doc);
  const { ficha, competencia } = dados;
  
  // Header institucional
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'CONTRACHEQUE',
    subtitulo: `Competência: ${competencia}`,
    fundoEscuro: true,
  }, logos);
  
  // Dados do servidor
  y = addSectionHeader(doc, 'DADOS DO SERVIDOR', y);
  
  const col1 = PAGINA.margemEsquerda;
  const col2 = PAGINA.margemEsquerda + contentWidth / 2;
  const colWidth = contentWidth / 2 - 5;
  
  addField(doc, 'Nome', ficha.servidor?.nome_completo || '-', col1, y, contentWidth);
  y += 10;
  
  addField(doc, 'CPF', formatCPF(ficha.servidor?.cpf || ''), col1, y, colWidth);
  addField(doc, 'Matrícula', ficha.servidor?.matricula || '-', col2, y, colWidth);
  y += 10;
  
  addField(doc, 'Cargo', ficha.cargo_nome || '-', col1, y, contentWidth);
  y += 10;
  
  addField(doc, 'Lotação', ficha.unidade_nome || '-', col1, y, contentWidth);
  y += 10;
  
  if (ficha.servidor?.pis_pasep) {
    addField(doc, 'PIS/PASEP', ficha.servidor.pis_pasep, col1, y, colWidth);
    addField(doc, 'Dependentes IR', String(ficha.quantidade_dependentes || 0), col2, y, colWidth);
    y += 10;
  }
  
  // Separador
  setColor(doc, CORES.cinzaMuitoClaro, 'draw');
  doc.setLineWidth(0.3);
  doc.line(PAGINA.margemEsquerda, y, width - PAGINA.margemDireita, y);
  y += 8;
  
  // Preparar rubricas
  const rubricas = ficha.rubricas || [];
  const proventos = rubricas.filter(r => r.tipo === 'provento');
  const descontos = rubricas.filter(r => r.tipo === 'desconto');
  
  // Se não tem rubricas, criar a partir dos valores
  if (proventos.length === 0 && ficha.total_proventos > 0) {
    proventos.push({
      codigo: '001',
      descricao: 'Vencimento Base',
      tipo: 'provento',
      referencia: 30,
      valor: ficha.total_proventos
    });
  }
  
  if (descontos.length === 0) {
    if (ficha.valor_inss && ficha.valor_inss > 0) {
      descontos.push({
        codigo: '101',
        descricao: 'INSS',
        tipo: 'desconto',
        valor: ficha.valor_inss
      });
    }
    if (ficha.valor_irrf && ficha.valor_irrf > 0) {
      descontos.push({
        codigo: '102',
        descricao: 'IRRF',
        tipo: 'desconto',
        valor: ficha.valor_irrf
      });
    }
  }
  
  // Layout de duas colunas: Proventos | Descontos
  const tableWidth = (contentWidth - 10) / 2;
  const proventosX = PAGINA.margemEsquerda;
  const descontosX = PAGINA.margemEsquerda + tableWidth + 10;
  
  // Header da tabela de Proventos
  setColor(doc, CORES.primaria, 'fill');
  doc.rect(proventosX, y - 5, tableWidth, 8, 'F');
  setColor(doc, { r: 255, g: 255, b: 255 });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('PROVENTOS', proventosX + tableWidth / 2, y, { align: 'center' });
  
  // Header da tabela de Descontos
  setColor(doc, { r: 220, g: 53, b: 69 }, 'fill');
  doc.rect(descontosX, y - 5, tableWidth, 8, 'F');
  setColor(doc, { r: 255, g: 255, b: 255 });
  doc.text('DESCONTOS', descontosX + tableWidth / 2, y, { align: 'center' });
  y += 8;
  
  // Subheaders
  setColor(doc, CORES.cinzaMuitoClaro, 'fill');
  doc.rect(proventosX, y - 4, tableWidth, 6, 'F');
  doc.rect(descontosX, y - 4, tableWidth, 6, 'F');
  
  setColor(doc, CORES.textoEscuro);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  
  doc.text('Cód', proventosX + 2, y);
  doc.text('Descrição', proventosX + 15, y);
  doc.text('Ref', proventosX + tableWidth - 25, y);
  doc.text('Valor', proventosX + tableWidth - 5, y, { align: 'right' });
  
  doc.text('Cód', descontosX + 2, y);
  doc.text('Descrição', descontosX + 15, y);
  doc.text('Ref', descontosX + tableWidth - 25, y);
  doc.text('Valor', descontosX + tableWidth - 5, y, { align: 'right' });
  y += 5;
  
  // Linhas de proventos e descontos
  const maxLinhas = Math.max(proventos.length, descontos.length, 5);
  doc.setFont('helvetica', 'normal');
  
  for (let i = 0; i < maxLinhas; i++) {
    if (i % 2 === 0) {
      setColor(doc, { r: 250, g: 250, b: 250 }, 'fill');
      doc.rect(proventosX, y - 3.5, tableWidth, 5, 'F');
      doc.rect(descontosX, y - 3.5, tableWidth, 5, 'F');
    }
    
    setColor(doc, CORES.textoEscuro);
    
    // Provento
    if (i < proventos.length) {
      const p = proventos[i];
      doc.text(p.codigo.substring(0, 4), proventosX + 2, y);
      doc.text(p.descricao.substring(0, 20), proventosX + 15, y);
      doc.text(p.referencia ? String(p.referencia) : '', proventosX + tableWidth - 25, y);
      doc.text(formatCurrency(p.valor).replace('R$', '').trim(), proventosX + tableWidth - 5, y, { align: 'right' });
    }
    
    // Desconto
    if (i < descontos.length) {
      const d = descontos[i];
      doc.text(d.codigo.substring(0, 4), descontosX + 2, y);
      doc.text(d.descricao.substring(0, 20), descontosX + 15, y);
      doc.text(d.referencia ? String(d.referencia) : '', descontosX + tableWidth - 25, y);
      doc.text(formatCurrency(d.valor).replace('R$', '').trim(), descontosX + tableWidth - 5, y, { align: 'right' });
    }
    
    y += 5;
  }
  
  // Totais
  y += 3;
  setColor(doc, CORES.cinzaMedio, 'fill');
  doc.rect(proventosX, y - 4, tableWidth, 7, 'F');
  doc.rect(descontosX, y - 4, tableWidth, 7, 'F');
  
  setColor(doc, { r: 255, g: 255, b: 255 });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  
  doc.text('TOTAL PROVENTOS:', proventosX + 2, y);
  doc.text(formatCurrency(ficha.total_proventos), proventosX + tableWidth - 5, y, { align: 'right' });
  
  doc.text('TOTAL DESCONTOS:', descontosX + 2, y);
  doc.text(formatCurrency(ficha.total_descontos), descontosX + tableWidth - 5, y, { align: 'right' });
  y += 10;
  
  // Valor Líquido - destaque
  setColor(doc, CORES.primaria, 'fill');
  doc.rect(PAGINA.margemEsquerda, y - 5, contentWidth, 12, 'F');
  
  setColor(doc, { r: 255, g: 255, b: 255 });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('VALOR LÍQUIDO:', PAGINA.margemEsquerda + 10, y + 2);
  doc.text(formatCurrency(ficha.valor_liquido), width - PAGINA.margemDireita - 10, y + 2, { align: 'right' });
  y += 15;
  
  // Informações adicionais
  y = checkPageBreak(doc, y, 40);
  
  setColor(doc, CORES.cinzaMuitoClaro, 'fill');
  doc.rect(PAGINA.margemEsquerda, y - 4, contentWidth, 18, 'F');
  
  setColor(doc, CORES.textoEscuro);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  
  y += 2;
  doc.text(`Base INSS: ${formatCurrency(ficha.base_inss || 0)}`, PAGINA.margemEsquerda + 5, y);
  doc.text(`INSS: ${formatCurrency(ficha.valor_inss || 0)}`, PAGINA.margemEsquerda + 55, y);
  doc.text(`Base IRRF: ${formatCurrency(ficha.base_irrf || 0)}`, PAGINA.margemEsquerda + 105, y);
  doc.text(`IRRF: ${formatCurrency(ficha.valor_irrf || 0)}`, PAGINA.margemEsquerda + 155, y);
  y += 6;
  doc.text(`Dependentes IRRF: ${ficha.quantidade_dependentes || 0}`, PAGINA.margemEsquerda + 5, y);
  
  // Footer
  generateInstitutionalFooter(doc, { sistema: 'Sistema de Folha de Pagamento - IDJUV' });
  addPageNumbers(doc);
  
  const nomeArquivo = (ficha.servidor?.nome_completo || 'servidor').replace(/\s+/g, '_').substring(0, 20);
  doc.save(`Contracheque_${nomeArquivo}_${competencia.replace('/', '-')}.pdf`);
};

/**
 * Gera contracheques em lote (todos os servidores da folha)
 */
export const generateContrachequeEmLote = async (fichas: FichaFinanceira[], competencia: string, competenciaAno: number, competenciaMes: number): Promise<void> => {
  const logos = await loadLogos();
  const doc = new jsPDF();
  
  for (let i = 0; i < fichas.length; i++) {
    if (i > 0) {
      doc.addPage();
    }
    
    const ficha = fichas[i];
    const { width, contentWidth } = getPageDimensions(doc);
    
    // Header institucional
    let y = await generateInstitutionalHeader(doc, {
      titulo: 'CONTRACHEQUE',
      subtitulo: `Competência: ${competencia}`,
      fundoEscuro: true,
    }, logos);
    
    // Dados do servidor
    y = addSectionHeader(doc, 'DADOS DO SERVIDOR', y);
    
    const col1 = PAGINA.margemEsquerda;
    const col2 = PAGINA.margemEsquerda + contentWidth / 2;
    const colWidth = contentWidth / 2 - 5;
    
    addField(doc, 'Nome', ficha.servidor?.nome_completo || '-', col1, y, contentWidth);
    y += 10;
    
    addField(doc, 'CPF', formatCPF(ficha.servidor?.cpf || ''), col1, y, colWidth);
    addField(doc, 'Matrícula', ficha.servidor?.matricula || '-', col2, y, colWidth);
    y += 10;
    
    addField(doc, 'Cargo', ficha.cargo_nome || '-', col1, y, contentWidth);
    y += 10;
    
    addField(doc, 'Lotação', ficha.unidade_nome || '-', col1, y, contentWidth);
    y += 10;
    
    // Separador
    setColor(doc, CORES.cinzaMuitoClaro, 'draw');
    doc.setLineWidth(0.3);
    doc.line(PAGINA.margemEsquerda, y, width - PAGINA.margemDireita, y);
    y += 8;
    
    // Preparar rubricas
    const rubricas = ficha.rubricas || [];
    const proventos = rubricas.filter(r => r.tipo === 'provento');
    const descontos = rubricas.filter(r => r.tipo === 'desconto');
    
    if (proventos.length === 0 && ficha.total_proventos > 0) {
      proventos.push({
        codigo: '001',
        descricao: 'Vencimento Base',
        tipo: 'provento',
        referencia: 30,
        valor: ficha.total_proventos
      });
    }
    
    if (descontos.length === 0) {
      if (ficha.valor_inss && ficha.valor_inss > 0) {
        descontos.push({ codigo: '101', descricao: 'INSS', tipo: 'desconto', valor: ficha.valor_inss });
      }
      if (ficha.valor_irrf && ficha.valor_irrf > 0) {
        descontos.push({ codigo: '102', descricao: 'IRRF', tipo: 'desconto', valor: ficha.valor_irrf });
      }
    }
    
    // Layout compacto
    const tableWidth = (contentWidth - 10) / 2;
    const proventosX = PAGINA.margemEsquerda;
    const descontosX = PAGINA.margemEsquerda + tableWidth + 10;
    
    // Headers
    setColor(doc, CORES.primaria, 'fill');
    doc.rect(proventosX, y - 5, tableWidth, 8, 'F');
    setColor(doc, { r: 220, g: 53, b: 69 }, 'fill');
    doc.rect(descontosX, y - 5, tableWidth, 8, 'F');
    
    setColor(doc, { r: 255, g: 255, b: 255 });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('PROVENTOS', proventosX + tableWidth / 2, y, { align: 'center' });
    doc.text('DESCONTOS', descontosX + tableWidth / 2, y, { align: 'center' });
    y += 8;
    
    // Linhas
    const maxLinhas = Math.max(proventos.length, descontos.length, 3);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    
    for (let j = 0; j < maxLinhas; j++) {
      setColor(doc, CORES.textoEscuro);
      
      if (j < proventos.length) {
        const p = proventos[j];
        doc.text(p.descricao.substring(0, 18), proventosX + 2, y);
        doc.text(formatCurrency(p.valor).replace('R$', '').trim(), proventosX + tableWidth - 5, y, { align: 'right' });
      }
      
      if (j < descontos.length) {
        const d = descontos[j];
        doc.text(d.descricao.substring(0, 18), descontosX + 2, y);
        doc.text(formatCurrency(d.valor).replace('R$', '').trim(), descontosX + tableWidth - 5, y, { align: 'right' });
      }
      
      y += 5;
    }
    
    // Totais
    y += 3;
    setColor(doc, CORES.cinzaMedio, 'fill');
    doc.rect(proventosX, y - 4, tableWidth, 7, 'F');
    doc.rect(descontosX, y - 4, tableWidth, 7, 'F');
    
    setColor(doc, { r: 255, g: 255, b: 255 });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    
    doc.text('TOTAL:', proventosX + 2, y);
    doc.text(formatCurrency(ficha.total_proventos), proventosX + tableWidth - 5, y, { align: 'right' });
    doc.text('TOTAL:', descontosX + 2, y);
    doc.text(formatCurrency(ficha.total_descontos), descontosX + tableWidth - 5, y, { align: 'right' });
    y += 10;
    
    // Líquido
    setColor(doc, CORES.primaria, 'fill');
    doc.rect(PAGINA.margemEsquerda, y - 5, contentWidth, 12, 'F');
    setColor(doc, { r: 255, g: 255, b: 255 });
    doc.setFontSize(11);
    doc.text('VALOR LÍQUIDO:', PAGINA.margemEsquerda + 10, y + 2);
    doc.text(formatCurrency(ficha.valor_liquido), width - PAGINA.margemDireita - 10, y + 2, { align: 'right' });
    
    generateInstitutionalFooter(doc, { sistema: 'Sistema de Folha de Pagamento - IDJUV' });
  }
  
  addPageNumbers(doc);
  doc.save(`Contracheques_${competencia.replace('/', '-')}_Lote.pdf`);
};
