import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { loadLogos, calculateLogoDimensions, type LogoCache } from './pdfTemplate';
import { formatTelefone } from './formatters';

interface ServidorContato {
  nome_completo: string;
  telefone_celular: string | null;
  indicacao: string | null;
}

interface LogosCarregados {
  governo: LogoCache | null;
  idjuv: LogoCache | null;
}

const LOGO_MAX_HEIGHT = 14;

export async function gerarRelatorioContatosEstrategicos(
  servidores: ServidorContato[],
  incluirLogos: boolean = true
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginLeft = 15;
  const marginRight = 15;
  const marginTop = 15;
  const marginBottom = 20;
  const contentWidth = pageWidth - marginLeft - marginRight;

  let currentY = marginTop;
  let currentPage = 1;

  // Carregar logos
  let logos: LogosCarregados = { governo: null, idjuv: null };
  if (incluirLogos) {
    const loadedLogos = await loadLogos();
    logos = { 
      governo: loadedLogos.governo, 
      idjuv: loadedLogos.idjuvOficial
    };
  }

  // Larguras das colunas
  const colNome = contentWidth * 0.35;
  const colTelefone = contentWidth * 0.20;
  const colIndicacao = contentWidth * 0.45;

  function checkPageBreak(altura: number): void {
    if (currentY + altura > pageHeight - marginBottom) {
      addFooter();
      doc.addPage();
      currentPage++;
      currentY = marginTop;
      addHeader();
      addTableHeader();
    }
  }

  function addHeader(): void {
    const headerHeight = 25;
    
    if (incluirLogos) {
      // Logo Governo - lado esquerdo
      if (logos.governo?.data) {
        try {
          const dims = calculateLogoDimensions(
            logos.governo.width,
            logos.governo.height,
            LOGO_MAX_HEIGHT
          );
          doc.addImage(logos.governo.data, 'PNG', marginLeft, currentY, dims.width, dims.height);
        } catch (e) {
          console.warn('Erro ao adicionar logo governo:', e);
        }
      }
      // Logo IDJUV - lado direito
      if (logos.idjuv?.data) {
        try {
          const dims = calculateLogoDimensions(
            logos.idjuv.width,
            logos.idjuv.height,
            LOGO_MAX_HEIGHT
          );
          doc.addImage(
            logos.idjuv.data, 
            'PNG', 
            pageWidth - marginRight - dims.width, 
            currentY, 
            dims.width, 
            dims.height
          );
        } catch (e) {
          console.warn('Erro ao adicionar logo IDJUV:', e);
        }
      }
    }

    // Título
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório de Contatos Estratégicos', pageWidth / 2, currentY + 6, { align: 'center' });

    // Subtítulo
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Servidores com Indicação Política', pageWidth / 2, currentY + 12, { align: 'center' });

    // Data de geração
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`,
      pageWidth / 2,
      currentY + 18,
      { align: 'center' }
    );
    doc.setTextColor(0);

    currentY += headerHeight;
  }

  function addFooter(): void {
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      `Página ${currentPage}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
    doc.text(
      'Sistema IDJuv - Documento Confidencial',
      marginLeft,
      pageHeight - 10
    );
    doc.text(
      format(new Date(), 'dd/MM/yyyy', { locale: ptBR }),
      pageWidth - marginRight,
      pageHeight - 10,
      { align: 'right' }
    );
    doc.setTextColor(0);
  }

  function addTableHeader(): void {
    const rowHeight = 8;
    
    // Fundo do cabeçalho
    doc.setFillColor(30, 64, 115);
    doc.rect(marginLeft, currentY, contentWidth, rowHeight, 'F');

    // Texto do cabeçalho
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255);

    let xPos = marginLeft + 2;
    doc.text('Nome', xPos, currentY + 5.5);
    xPos += colNome;
    doc.text('Telefone', xPos, currentY + 5.5);
    xPos += colTelefone;
    doc.text('Indicação', xPos, currentY + 5.5);

    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');
    currentY += rowHeight;
  }

  function addDataRow(servidor: ServidorContato, rowIndex: number): void {
    // Calcular altura da linha baseado no texto da indicação
    const indicacaoText = servidor.indicacao || '-';
    const maxIndicacaoWidth = colIndicacao - 4;
    
    doc.setFontSize(8);
    const linhasIndicacao = doc.splitTextToSize(indicacaoText, maxIndicacaoWidth);
    const rowHeight = Math.max(7, linhasIndicacao.length * 4 + 3);
    
    checkPageBreak(rowHeight);

    // Cor de fundo alternada
    if (rowIndex % 2 === 0) {
      doc.setFillColor(248, 249, 250);
      doc.rect(marginLeft, currentY, contentWidth, rowHeight, 'F');
    }

    // Dados
    doc.setFontSize(8);
    let xPos = marginLeft + 2;
    
    // Nome (truncar se necessário)
    const nomeText = servidor.nome_completo || '-';
    const maxNomeChars = Math.floor((colNome - 4) / 1.8);
    const nomeTruncado = nomeText.length > maxNomeChars 
      ? nomeText.substring(0, maxNomeChars - 2) + '...' 
      : nomeText;
    doc.text(nomeTruncado, xPos, currentY + 4.5);
    
    xPos += colNome;
    
    // Telefone
    const telefoneFormatado = servidor.telefone_celular 
      ? formatTelefone(servidor.telefone_celular) 
      : '-';
    doc.text(telefoneFormatado, xPos, currentY + 4.5);
    
    xPos += colTelefone;
    
    // Indicação (com quebra de linha)
    doc.text(linhasIndicacao, xPos, currentY + 4.5);

    currentY += rowHeight;
  }

  // ================================================================
  // RENDERIZAÇÃO PRINCIPAL
  // ================================================================

  // Header
  addHeader();

  // Resumo
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total de registros: ${servidores.length}`, marginLeft, currentY + 5);
  currentY += 12;

  // Tabela
  if (servidores.length > 0) {
    addTableHeader();
    servidores.forEach((servidor, index) => {
      addDataRow(servidor, index);
    });
  } else {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Nenhum servidor encontrado com indicação.', pageWidth / 2, currentY + 10, { align: 'center' });
    doc.setTextColor(0);
  }

  // Footer final
  addFooter();

  // Salvar
  const nomeArquivo = `contatos-estrategicos-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
  doc.save(nomeArquivo);
}
