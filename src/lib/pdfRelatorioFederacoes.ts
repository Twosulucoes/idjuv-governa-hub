import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { 
  ConfiguracaoRelatorioFederacao, 
  CampoRelatorioFederacao,
} from '@/types/federacoesRelatorio';
import { loadLogos, calculateLogoDimensions, type LogoCache } from './pdfTemplate';

// ================================================================
// TIPOS
// ================================================================

interface LogosCarregados {
  governo: LogoCache | null;
  idjuv: LogoCache | null;
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
        // Verifica se é status de federação ou de evento
        const federacaoLabels: Record<string, string> = {
          em_analise: 'Em Análise',
          ativo: 'Ativa',
          inativo: 'Inativa',
          rejeitado: 'Rejeitada',
        };
        const eventoLabels: Record<string, string> = {
          planejado: 'Planejado',
          confirmado: 'Confirmado',
          em_andamento: 'Em Andamento',
          concluido: 'Concluído',
          cancelado: 'Cancelado',
        };
        return federacaoLabels[String(valor)] || eventoLabels[String(valor)] || String(valor);
      }
      return String(valor);
    case 'numero':
      const num = Number(valor);
      return isNaN(num) ? String(valor) : num.toLocaleString('pt-BR');
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

// Altura máxima das logos (mantém proporção)
const LOGO_MAX_HEIGHT = 14;

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

  // Carregar logos usando o sistema centralizado
  // IMPORTANTE: Usar logo OFICIAL em fundo branco, não a versão dark!
  let logos: LogosCarregados = { governo: null, idjuv: null };
  if (config.incluirLogos) {
    const loadedLogos = await loadLogos();
    logos = { 
      governo: loadedLogos.governo, 
      idjuv: loadedLogos.idjuvOficial // Usar OFICIAL, não dark!
    };
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
    
    // Logos com proporção mantida
    if (config.incluirLogos) {
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
