import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { loadLogos, calculateLogoDimensions, type LogoCache } from './pdfTemplate';
import { formatTelefone } from './formatters';

export interface ServidorDiretoria {
  nome: string;
  telefone: string | null;
  cargo: string | null;
}

export interface UnidadeComServidores {
  id: string;
  nome: string;
  sigla: string | null;
  tipo: 'diretoria' | 'divisao' | 'nucleo' | 'presidencia' | 'assessoria' | 'gabinete' | 'coordenacao' | 'outro';
  nivel: number;
  servidores: ServidorDiretoria[];
  subordinadas: UnidadeComServidores[];
}

interface LogosCarregados {
  governo: LogoCache | null;
  idjuv: LogoCache | null;
}

const LOGO_MAX_HEIGHT = 14;

// Cores por nível hierárquico
const CORES_NIVEL = {
  diretoria: { r: 30, g: 64, b: 115 },    // Azul escuro
  divisao: { r: 59, g: 130, b: 186 },     // Azul médio
  nucleo: { r: 100, g: 116, b: 139 },     // Cinza escuro
  default: { r: 71, g: 85, b: 105 },      // Slate
};

function getCorPorTipo(tipo: string): { r: number; g: number; b: number } {
  if (tipo === 'diretoria') return CORES_NIVEL.diretoria;
  if (tipo === 'divisao') return CORES_NIVEL.divisao;
  if (tipo === 'nucleo') return CORES_NIVEL.nucleo;
  return CORES_NIVEL.default;
}

function getIndentacao(tipo: string): number {
  if (tipo === 'diretoria' || tipo === 'presidencia' || tipo === 'gabinete') return 0;
  if (tipo === 'divisao' || tipo === 'assessoria' || tipo === 'coordenacao') return 5;
  if (tipo === 'nucleo') return 10;
  return 0;
}

export async function gerarRelatorioServidoresDiretoria(
  diretoria: UnidadeComServidores,
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
  const colNome = contentWidth * 0.50;
  const colTelefone = contentWidth * 0.22;
  const colCargo = contentWidth * 0.28;

  function checkPageBreak(altura: number): boolean {
    if (currentY + altura > pageHeight - marginBottom) {
      addFooter();
      doc.addPage();
      currentPage++;
      currentY = marginTop;
      addHeader();
      return true;
    }
    return false;
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
    doc.text('Relatório de Servidores', pageWidth / 2, currentY + 6, { align: 'center' });

    // Subtítulo com nome da diretoria
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const subtitulo = diretoria.sigla 
      ? `${diretoria.sigla} - ${diretoria.nome}`
      : diretoria.nome;
    doc.text(subtitulo, pageWidth / 2, currentY + 12, { align: 'center' });

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
      'Sistema IDJuv - Documento Interno',
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

  function addUnidadeHeader(unidade: UnidadeComServidores, indent: number): void {
    const rowHeight = 8;
    checkPageBreak(rowHeight + 15);

    const cor = getCorPorTipo(unidade.tipo);
    const xStart = marginLeft + indent;
    const width = contentWidth - indent;

    // Fundo colorido para o cabeçalho da unidade
    doc.setFillColor(cor.r, cor.g, cor.b);
    doc.rect(xStart, currentY, width, rowHeight, 'F');

    // Texto do cabeçalho
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255);

    const headerText = unidade.sigla 
      ? `${unidade.sigla} - ${unidade.nome}`
      : unidade.nome;
    
    doc.text(headerText, xStart + 3, currentY + 5.5);

    // Quantidade de servidores
    const qtdText = `(${unidade.servidores.length} servidor${unidade.servidores.length !== 1 ? 'es' : ''})`;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(qtdText, xStart + width - 3, currentY + 5.5, { align: 'right' });

    doc.setTextColor(0);
    currentY += rowHeight;
  }

  function addTableHeader(indent: number): void {
    const rowHeight = 6;
    const xStart = marginLeft + indent;
    const adjustedWidth = contentWidth - indent;

    // Fundo do cabeçalho da tabela
    doc.setFillColor(240, 240, 240);
    doc.rect(xStart, currentY, adjustedWidth, rowHeight, 'F');

    // Larguras ajustadas
    const adjColNome = (adjustedWidth * 0.50);
    const adjColTelefone = (adjustedWidth * 0.22);

    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60);

    let xPos = xStart + 2;
    doc.text('Nome', xPos, currentY + 4);
    xPos += adjColNome;
    doc.text('Telefone', xPos, currentY + 4);
    xPos += adjColTelefone;
    doc.text('Cargo', xPos, currentY + 4);

    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');
    currentY += rowHeight;
  }

  function addServidorRow(servidor: ServidorDiretoria, rowIndex: number, indent: number): void {
    const rowHeight = 6;
    checkPageBreak(rowHeight);

    const xStart = marginLeft + indent;
    const adjustedWidth = contentWidth - indent;

    // Cor de fundo alternada
    if (rowIndex % 2 === 0) {
      doc.setFillColor(248, 249, 250);
      doc.rect(xStart, currentY, adjustedWidth, rowHeight, 'F');
    }

    // Larguras ajustadas
    const adjColNome = (adjustedWidth * 0.50);
    const adjColTelefone = (adjustedWidth * 0.22);

    doc.setFontSize(7);
    let xPos = xStart + 2;

    // Nome (truncar se necessário)
    const nomeText = servidor.nome || '-';
    const maxNomeChars = Math.floor((adjColNome - 4) / 1.6);
    const nomeTruncado = nomeText.length > maxNomeChars 
      ? nomeText.substring(0, maxNomeChars - 2) + '...' 
      : nomeText;
    doc.text(nomeTruncado, xPos, currentY + 4);

    xPos += adjColNome;

    // Telefone
    const telefoneFormatado = servidor.telefone 
      ? formatTelefone(servidor.telefone) 
      : '-';
    doc.text(telefoneFormatado, xPos, currentY + 4);

    xPos += adjColTelefone;

    // Cargo (truncar se necessário)
    const cargoText = servidor.cargo || '-';
    const maxCargoChars = Math.floor((adjustedWidth * 0.28 - 4) / 1.6);
    const cargoTruncado = cargoText.length > maxCargoChars 
      ? cargoText.substring(0, maxCargoChars - 2) + '...' 
      : cargoText;
    doc.text(cargoTruncado, xPos, currentY + 4);

    currentY += rowHeight;
  }

  function renderUnidade(unidade: UnidadeComServidores): void {
    const indent = getIndentacao(unidade.tipo);

    // Cabeçalho da unidade
    addUnidadeHeader(unidade, indent);

    // Servidores da unidade
    if (unidade.servidores.length > 0) {
      addTableHeader(indent);
      unidade.servidores.forEach((servidor, index) => {
        addServidorRow(servidor, index, indent);
      });
    } else {
      // Mensagem quando não há servidores
      doc.setFontSize(7);
      doc.setTextColor(120);
      doc.text('Nenhum servidor lotado nesta unidade', marginLeft + indent + 5, currentY + 4);
      doc.setTextColor(0);
      currentY += 6;
    }

    currentY += 3; // Espaço entre unidades

    // Renderizar subordinadas recursivamente
    unidade.subordinadas.forEach(subordinada => {
      renderUnidade(subordinada);
    });
  }

  function contarTotalServidores(unidade: UnidadeComServidores): number {
    let total = unidade.servidores.length;
    unidade.subordinadas.forEach(sub => {
      total += contarTotalServidores(sub);
    });
    return total;
  }

  // ================================================================
  // RENDERIZAÇÃO PRINCIPAL
  // ================================================================

  // Header
  addHeader();

  // Resumo
  const totalServidores = contarTotalServidores(diretoria);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total de servidores: ${totalServidores}`, marginLeft, currentY + 3);
  currentY += 10;

  // Renderizar estrutura hierárquica
  renderUnidade(diretoria);

  // Footer final
  addFooter();

  // Salvar
  const siglaArquivo = diretoria.sigla || 'diretoria';
  const nomeArquivo = `servidores-${siglaArquivo.toLowerCase()}-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
  doc.save(nomeArquivo);
}
