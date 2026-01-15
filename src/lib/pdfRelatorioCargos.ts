import jsPDF from 'jspdf';
import { 
  generateInstitutionalHeader, 
  generateInstitutionalFooter, 
  loadLogos 
} from '@/lib/pdfTemplate';

interface CargoComServidor {
  cargo_id: string;
  cargo_nome: string;
  cargo_sigla: string;
  quantidade_vagas: number;
  unidade_nome: string;
  unidade_sigla: string;
  servidor_nome: string | null;
  servidor_id: string | null;
}

interface RelatorioConfig {
  titulo?: string;
  subtitulo?: string;
  agruparPorUnidade?: boolean;
}

export async function gerarRelatorioCargos98PDF(
  dados: CargoComServidor[],
  config: RelatorioConfig = {}
): Promise<void> {
  const {
    titulo = 'QUADRO DE CARGOS COMISSIONADOS',
    subtitulo = 'Lei nº 2.301/2025 - 98 Cargos',
    agruparPorUnidade = true
  } = config;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;

  const textColor: [number, number, number] = [30, 41, 59];
  const headerBg: [number, number, number] = [0, 68, 68];
  const headerText: [number, number, number] = [255, 255, 255];
  const altRowBg: [number, number, number] = [248, 250, 252];
  const vacantBg: [number, number, number] = [254, 243, 199]; // amber-100

  const logos = await loadLogos();

  let currentY = await generateInstitutionalHeader(pdf, {
    titulo,
    subtitulo,
    fundoEscuro: true
  }, logos);

  currentY += 6;

  // Definir colunas
  const colWidths = {
    seq: 8,
    cargo: contentWidth * 0.28,
    simbolo: 18,
    unidade: contentWidth * 0.25,
    servidor: contentWidth * 0.30
  };

  const colX = {
    seq: margin,
    cargo: margin + colWidths.seq,
    simbolo: margin + colWidths.seq + colWidths.cargo,
    unidade: margin + colWidths.seq + colWidths.cargo + colWidths.simbolo,
    servidor: margin + colWidths.seq + colWidths.cargo + colWidths.simbolo + colWidths.unidade
  };

  const rowHeight = 6;
  const headerHeight = 8;
  let pageNumber = 1;
  let sequencial = 0;

  // Função para desenhar cabeçalho da tabela
  function desenharCabecalhoTabela() {
    pdf.setFillColor(...headerBg);
    pdf.rect(margin, currentY, contentWidth, headerHeight, 'F');

    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...headerText);
    
    pdf.text('Nº', colX.seq + 2, currentY + 5.5);
    pdf.text('CARGO', colX.cargo + 2, currentY + 5.5);
    pdf.text('SÍMBOLO', colX.simbolo + 1, currentY + 5.5);
    pdf.text('UNIDADE', colX.unidade + 2, currentY + 5.5);
    pdf.text('SERVIDOR', colX.servidor + 2, currentY + 5.5);

    currentY += headerHeight;
  }

  // Desenhar cabeçalho inicial
  desenharCabecalhoTabela();

  // Agrupar por unidade se configurado
  let dadosOrdenados = [...dados];
  if (agruparPorUnidade) {
    dadosOrdenados.sort((a, b) => {
      const unidadeCompare = (a.unidade_nome || '').localeCompare(b.unidade_nome || '');
      if (unidadeCompare !== 0) return unidadeCompare;
      return (a.cargo_nome || '').localeCompare(b.cargo_nome || '');
    });
  }

  let rowIndex = 0;
  let totalOcupados = 0;
  let totalVagos = 0;

  for (const item of dadosOrdenados) {
    // Verificar quebra de página
    if (currentY > pageHeight - 20) {
      pdf.addPage();
      pageNumber++;
      currentY = 15;
      desenharCabecalhoTabela();
    }

    sequencial++;
    const isVago = !item.servidor_nome;

    if (isVago) {
      totalVagos++;
    } else {
      totalOcupados++;
    }

    // Fundo alternado ou destaque para vago
    if (isVago) {
      pdf.setFillColor(...vacantBg);
      pdf.rect(margin, currentY, contentWidth, rowHeight, 'F');
    } else if (rowIndex % 2 === 1) {
      pdf.setFillColor(...altRowBg);
      pdf.rect(margin, currentY, contentWidth, rowHeight, 'F');
    }

    // Borda inferior
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.1);
    pdf.line(margin, currentY + rowHeight, margin + contentWidth, currentY + rowHeight);

    // Nº sequencial
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    pdf.text(String(sequencial), colX.seq + 2, currentY + 4);

    // Cargo
    pdf.setFontSize(6.5);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(...textColor);
    let cargoExibido = item.cargo_nome;
    if (cargoExibido.length > 30) {
      cargoExibido = cargoExibido.substring(0, 28) + '...';
    }
    pdf.text(cargoExibido, colX.cargo + 2, currentY + 4);

    // Símbolo
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    pdf.text(item.cargo_sigla || '-', colX.simbolo + 1, currentY + 4);

    // Unidade
    pdf.setFontSize(6);
    pdf.setTextColor(...textColor);
    const unidadeExibida = item.unidade_sigla || item.unidade_nome?.substring(0, 20) || '-';
    pdf.text(unidadeExibida, colX.unidade + 2, currentY + 4);

    // Servidor
    pdf.setFontSize(6.5);
    if (isVago) {
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(180, 83, 9); // amber-700
      pdf.text('(VAGO)', colX.servidor + 2, currentY + 4);
    } else {
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(...textColor);
      let servidorExibido = item.servidor_nome || '';
      if (servidorExibido.length > 35) {
        servidorExibido = servidorExibido.substring(0, 33) + '...';
      }
      pdf.text(servidorExibido, colX.servidor + 2, currentY + 4);
    }

    currentY += rowHeight;
    rowIndex++;
  }

  // Linha final
  pdf.setDrawColor(...headerBg);
  pdf.setLineWidth(0.5);
  pdf.line(margin, currentY, margin + contentWidth, currentY);

  // Resumo
  currentY += 6;
  if (currentY > pageHeight - 30) {
    pdf.addPage();
    pageNumber++;
    currentY = 20;
  }

  // Caixa de resumo
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(...headerBg);
  pdf.setLineWidth(0.3);
  pdf.roundedRect(margin, currentY, contentWidth, 18, 2, 2, 'FD');

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...textColor);
  pdf.text('RESUMO DO QUADRO DE CARGOS', margin + 5, currentY + 6);

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Total de Cargos: ${sequencial}`, margin + 5, currentY + 11);
  pdf.text(`Ocupados: ${totalOcupados}`, margin + 60, currentY + 11);
  
  pdf.setFillColor(...vacantBg);
  pdf.rect(margin + 100, currentY + 7.5, 4, 4, 'F');
  pdf.text(`Vagos: ${totalVagos}`, margin + 106, currentY + 11);

  const dataGeracao = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  pdf.setFontSize(7);
  pdf.text(`Gerado em: ${dataGeracao}`, margin + contentWidth - 5, currentY + 15, { align: 'right' });

  // Rodapé institucional
  generateInstitutionalFooter(pdf, {
    sistema: 'Sistema de Governança Digital IDJUV',
    mostrarData: true
  });

  // Números de página
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Página ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });
  }

  const nomeArquivo = `quadro-cargos-98-idjuv-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(nomeArquivo);
}
