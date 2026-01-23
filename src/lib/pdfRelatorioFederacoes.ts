import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { 
  ConfiguracaoRelatorioFederacao, 
  CampoRelatorioFederacao,
  CAMPOS_POR_TIPO_FEDERACAO,
  STATUS_FEDERACAO_LABELS,
} from '@/types/federacoesRelatorio';

// ================================================================
// TIPOS
// ================================================================

interface LogosCarregados {
  logoGov: HTMLImageElement | null;
  logoIdjuv: HTMLImageElement | null;
}

// ================================================================
// HELPERS
// ================================================================

async function carregarImagem(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function carregarLogos(): Promise<LogosCarregados> {
  const [logoGov, logoIdjuv] = await Promise.all([
    carregarImagem('/src/assets/logo-gov-vaza.png'),
    carregarImagem('/src/assets/logo-idjuv-dark4.png'),
  ]);
  return { logoGov, logoIdjuv };
}

function formatarValor(valor: unknown, campo: CampoRelatorioFederacao): string {
  if (valor === null || valor === undefined || valor === '') return '-';

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

function obterValor(item: Record<string, unknown>, campoId: string): unknown {
  return item[campoId];
}

// ================================================================
// GERADOR PDF
// ================================================================

export async function gerarRelatorioFederacoesPDF(
  config: ConfiguracaoRelatorioFederacao,
  dados: Record<string, unknown>[],
  camposDisponiveis: CampoRelatorioFederacao[]
): Promise<void> {
  const doc = new jsPDF({
    orientation: config.orientacao === 'paisagem' ? 'landscape' : 'portrait',
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
  let logos: LogosCarregados = { logoGov: null, logoIdjuv: null };
  if (config.incluirLogos) {
    logos = await carregarLogos();
  }

  // Obter campos selecionados
  const camposSelecionados = camposDisponiveis.filter(
    (c) => config.camposSelecionados.includes(c.id)
  );

  // Calcular larguras das colunas
  const colCount = camposSelecionados.length;
  const colWidth = contentWidth / colCount;

  // ================================================================
  // FUNÇÕES DE RENDERIZAÇÃO
  // ================================================================

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
    
    // Logos
    if (config.incluirLogos) {
      if (logos.logoGov) {
        try {
          doc.addImage(logos.logoGov, 'PNG', marginLeft, currentY, 30, 15);
        } catch {}
      }
      if (logos.logoIdjuv) {
        try {
          doc.addImage(logos.logoIdjuv, 'PNG', pageWidth - marginRight - 30, currentY, 30, 15);
        } catch {}
      }
    }

    // Título
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(config.titulo, pageWidth / 2, currentY + 6, { align: 'center' });

    // Subtítulo
    if (config.subtitulo) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(config.subtitulo, pageWidth / 2, currentY + 12, { align: 'center' });
    }

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
      'Sistema IDJuv - Relatório Oficial',
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
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255);

    let xPos = marginLeft + 2;
    camposSelecionados.forEach((campo) => {
      const text = campo.label;
      doc.text(text, xPos, currentY + 5.5, { maxWidth: colWidth - 4 });
      xPos += colWidth;
    });

    doc.setTextColor(0);
    doc.setFont('helvetica', 'normal');
    currentY += rowHeight;
  }

  function addDataRow(item: Record<string, unknown>, rowIndex: number): void {
    const rowHeight = 7;
    checkPageBreak(rowHeight);

    // Cor de fundo alternada
    if (rowIndex % 2 === 0) {
      doc.setFillColor(248, 249, 250);
      doc.rect(marginLeft, currentY, contentWidth, rowHeight, 'F');
    }

    // Dados
    doc.setFontSize(7);
    let xPos = marginLeft + 2;
    camposSelecionados.forEach((campo) => {
      const valor = obterValor(item, campo.id);
      const texto = formatarValor(valor, campo);
      
      // Truncar texto se muito longo
      const maxChars = Math.floor((colWidth - 4) / 1.5);
      const textoTruncado = texto.length > maxChars 
        ? texto.substring(0, maxChars - 2) + '...' 
        : texto;
      
      doc.text(textoTruncado, xPos, currentY + 4.5, { maxWidth: colWidth - 4 });
      xPos += colWidth;
    });

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
  doc.text(`Total de registros: ${dados.length}`, marginLeft, currentY + 5);
  currentY += 12;

  // Tabela
  if (dados.length > 0) {
    addTableHeader();
    dados.forEach((item, index) => {
      addDataRow(item, index);
    });
  } else {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text('Nenhum registro encontrado para os filtros selecionados.', pageWidth / 2, currentY + 10, { align: 'center' });
    doc.setTextColor(0);
  }

  // Footer final
  addFooter();

  // Salvar
  const nomeArquivo = `relatorio-federacoes-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
  doc.save(nomeArquivo);
}
