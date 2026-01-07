import jsPDF from 'jspdf';

export interface MemorandoLotacaoData {
  numeroProtocolo: string;
  dataEmissao: string;
  servidor: {
    nome: string;
    matricula?: string;
    email?: string;
  };
  unidadeDestino: {
    nome: string;
    sigla?: string;
  };
  cargo?: {
    nome: string;
    sigla?: string;
  };
  tipoMovimentacao: string;
  dataInicioExercicio: string;
  observacoes?: string;
  emitidoPor?: string;
}

const TIPO_MOVIMENTACAO_LABELS: Record<string, string> = {
  nomeacao: 'Nomeação',
  designacao: 'Designação',
  transferencia: 'Transferência',
  redistribuicao: 'Redistribuição',
  cessao: 'Cessão',
  remocao: 'Remoção',
};

export const generateMemorandoLotacao = (data: MemorandoLotacaoData): jsPDF => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Header
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('GOVERNO DO ESTADO DE RORAIMA', pageWidth / 2, 15, { align: 'center' });
  doc.text('INSTITUTO DE DESPORTO, JUVENTUDE E LAZER - IDJUV', pageWidth / 2, 20, { align: 'center' });
  doc.text('DIRETORIA ADMINISTRATIVA E FINANCEIRA - DIRAF', pageWidth / 2, 25, { align: 'center' });
  doc.text('DIVISÃO DE RECURSOS HUMANOS - DRH', pageWidth / 2, 30, { align: 'center' });
  
  // Linha separadora
  doc.setLineWidth(0.5);
  doc.line(20, 35, pageWidth - 20, 35);
  
  // Título
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('MEMORANDO DE LOTAÇÃO', pageWidth / 2, 45, { align: 'center' });
  
  // Número e data
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nº ${data.numeroProtocolo}`, 20, 55);
  doc.text(`Data: ${data.dataEmissao}`, pageWidth - 20, 55, { align: 'right' });
  
  // Linha separadora
  doc.line(20, 60, pageWidth - 20, 60);
  
  let y = 72;
  
  // Corpo do memorando
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  const tipoLabel = TIPO_MOVIMENTACAO_LABELS[data.tipoMovimentacao] || data.tipoMovimentacao;
  
  const texto = `Comunicamos que o(a) servidor(a) abaixo identificado(a) foi lotado(a) por meio de ${tipoLabel.toLowerCase()}, devendo se apresentar na unidade de destino para início do exercício.`;
  
  const linhasTexto = doc.splitTextToSize(texto, pageWidth - 40);
  doc.text(linhasTexto, 20, y);
  y += linhasTexto.length * 6 + 10;
  
  // Box de dados do servidor
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.3);
  doc.rect(20, y, pageWidth - 40, 55);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO SERVIDOR', 25, y + 8);
  
  doc.setFont('helvetica', 'normal');
  y += 15;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Nome:', 25, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.servidor.nome, 50, y);
  y += 7;
  
  if (data.servidor.matricula) {
    doc.setFont('helvetica', 'bold');
    doc.text('Matrícula:', 25, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.servidor.matricula, 55, y);
    y += 7;
  }
  
  if (data.servidor.email) {
    doc.setFont('helvetica', 'bold');
    doc.text('E-mail:', 25, y);
    doc.setFont('helvetica', 'normal');
    doc.text(data.servidor.email, 50, y);
    y += 7;
  }
  
  y = y + 25;
  
  // Box de dados da lotação
  doc.rect(20, y, pageWidth - 40, 50);
  
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DA LOTAÇÃO', 25, y + 8);
  
  y += 15;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Unidade de Destino:', 25, y);
  doc.setFont('helvetica', 'normal');
  const unidadeTexto = data.unidadeDestino.sigla 
    ? `${data.unidadeDestino.sigla} - ${data.unidadeDestino.nome}`
    : data.unidadeDestino.nome;
  doc.text(unidadeTexto, 70, y);
  y += 7;
  
  if (data.cargo) {
    doc.setFont('helvetica', 'bold');
    doc.text('Cargo:', 25, y);
    doc.setFont('helvetica', 'normal');
    const cargoTexto = data.cargo.sigla 
      ? `${data.cargo.sigla} - ${data.cargo.nome}`
      : data.cargo.nome;
    doc.text(cargoTexto, 45, y);
    y += 7;
  }
  
  doc.setFont('helvetica', 'bold');
  doc.text('Tipo de Movimentação:', 25, y);
  doc.setFont('helvetica', 'normal');
  doc.text(tipoLabel, 75, y);
  y += 7;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Data de Início do Exercício:', 25, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.dataInicioExercicio, 85, y);
  
  y += 30;
  
  // Observações
  if (data.observacoes) {
    doc.setFont('helvetica', 'bold');
    doc.text('Observações:', 20, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    const linhasObs = doc.splitTextToSize(data.observacoes, pageWidth - 40);
    doc.text(linhasObs, 20, y);
    y += linhasObs.length * 5 + 10;
  }
  
  // Assinaturas
  const assinaturaY = pageHeight - 70;
  
  doc.setLineWidth(0.3);
  doc.line(25, assinaturaY, 85, assinaturaY);
  doc.line(115, assinaturaY, 185, assinaturaY);
  
  doc.setFontSize(8);
  doc.text('Assinatura do Servidor', 55, assinaturaY + 5, { align: 'center' });
  doc.text('Data: ____/____/______', 55, assinaturaY + 10, { align: 'center' });
  
  doc.text('Chefia da Unidade de Destino', 150, assinaturaY + 5, { align: 'center' });
  doc.text('Data: ____/____/______', 150, assinaturaY + 10, { align: 'center' });
  
  // Rodapé
  doc.setFontSize(7);
  doc.text('Documento gerado pelo Sistema de Governança Digital IDJUV', pageWidth / 2, pageHeight - 25, { align: 'center' });
  if (data.emitidoPor) {
    doc.text(`Emitido por: ${data.emitidoPor}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
  }
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
  
  // Protocolo no canto
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(`Protocolo: ${data.numeroProtocolo}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
  
  return doc;
};

export const downloadMemorandoLotacao = (data: MemorandoLotacaoData): void => {
  const doc = generateMemorandoLotacao(data);
  doc.save(`Memorando_Lotacao_${data.numeroProtocolo.replace(/\//g, '-')}.pdf`);
};
