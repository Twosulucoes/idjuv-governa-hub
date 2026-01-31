import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import logoGovernoSrc from '@/assets/logo-governo-roraima.jpg';
import logoIDJUVOficialSrc from '@/assets/logo-idjuv-oficial.png';
import { getLogosPDF } from './pdfLogos';

// ================================================================
// GERADOR DE PDF - RELATÓRIO SIMPLIFICADO DE FOLHA
// Campos: Nº, NOME COMPLETO, CPF, CARGO, CÓDIGO, VALORES
// Layout fixo otimizado para evitar sobreposição
// ================================================================

interface DadosServidor {
  numero?: number;
  nome_completo?: string;
  cpf?: string;
  cargo_nome?: string;
  cargo_sigla?: string;
  matricula?: string;
  vencimento_base?: number;
  valor_total?: number;
  [key: string]: unknown;
}

interface ConfigRelatorioFolha {
  titulo?: string;
  subtitulo?: string;
  mesReferencia?: string;
  incluirLogos?: boolean;
}

// Cores institucionais
const CORES = {
  primaria: [0, 60, 100] as [number, number, number],
  header: [0, 80, 120] as [number, number, number],
  textoEscuro: [30, 30, 30] as [number, number, number],
  textoMedio: [80, 80, 80] as [number, number, number],
  fundoPar: [248, 248, 248] as [number, number, number],
  fundoImpar: [255, 255, 255] as [number, number, number],
  bordaTabela: [200, 200, 200] as [number, number, number],
  branco: [255, 255, 255] as [number, number, number],
};

// Configuração de colunas com larguras FIXAS (em mm)
// Total = 277mm (A4 paisagem - margens de 10mm cada lado)
const COLUNAS = [
  { id: 'numero', label: 'Nº', largura: 15, align: 'center' as const },
  { id: 'nome_completo', label: 'NOME COMPLETO', largura: 90, align: 'left' as const },
  { id: 'cpf', label: 'CPF', largura: 40, align: 'center' as const },
  { id: 'cargo_nome', label: 'CARGO', largura: 70, align: 'left' as const },
  { id: 'codigo', label: 'CÓDIGO', largura: 25, align: 'center' as const },
  { id: 'valor', label: 'VALORES', largura: 37, align: 'right' as const },
];

// Formatar CPF
function formatarCPF(cpf: string | null | undefined): string {
  if (!cpf) return '-';
  const numeros = cpf.replace(/\D/g, '');
  if (numeros.length !== 11) return cpf;
  return `${numeros.slice(0, 3)}.${numeros.slice(3, 6)}.${numeros.slice(6, 9)}-${numeros.slice(9)}`;
}

// Formatar valor monetário
function formatarMoeda(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return '-';
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Truncar texto para caber na coluna
function truncarTexto(texto: string, maxLargura: number, doc: jsPDF): string {
  if (!texto) return '-';
  
  let resultado = texto;
  while (doc.getTextWidth(resultado) > maxLargura - 4 && resultado.length > 0) {
    resultado = resultado.slice(0, -1);
  }
  
  if (resultado.length < texto.length && resultado.length > 3) {
    resultado = resultado.slice(0, -3) + '...';
  }
  
  return resultado || '-';
}

// Carregar imagem
async function carregarImagem(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// ================================================================
// FUNÇÃO PRINCIPAL
// ================================================================

export async function gerarRelatorioFolhaSimplificado(
  dados: DadosServidor[],
  config: ConfigRelatorioFolha = {}
): Promise<void> {
  // Sempre paisagem para caber todas as colunas
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  
  const pageWidth = doc.internal.pageSize.getWidth(); // 297mm
  const pageHeight = doc.internal.pageSize.getHeight(); // 210mm
  const marginX = 10;
  const marginY = 10;
  const contentWidth = pageWidth - marginX * 2; // 277mm
  
  let y = marginY;
  let paginaAtual = 1;
  let totalValores = 0;

  // Carregar logos
  let logoGov: HTMLImageElement | null = null;
  let logoIdjuv: HTMLImageElement | null = null;
  
  if (config.incluirLogos !== false) {
    [logoGov, logoIdjuv] = await Promise.all([
      carregarImagem(logoGovernoSrc),
      carregarImagem(logoIDJUVOficialSrc),
    ]);
  }

  // ================================================================
  // FUNÇÕES DE RENDERIZAÇÃO
  // ================================================================

  const renderHeader = (): void => {
    y = marginY;
    
    // Logos - mesma altura para ambos, mantendo proporção original
    const logos = getLogosPDF(14); // 14mm de altura para ambos
    
    if (logoGov) {
      doc.addImage(logoGov, 'JPEG', marginX, y, logos.governo.width, logos.governo.height);
    }
    if (logoIdjuv) {
      doc.addImage(logoIdjuv, 'PNG', pageWidth - marginX - logos.idjuv.width, y, logos.idjuv.width, logos.idjuv.height);
    }
    
    // Título centralizado
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(...CORES.primaria);
    const titulo = config.titulo || 'RELATÓRIO SIMPLIFICADO DE FOLHA';
    doc.text(titulo, pageWidth / 2, y + 8, { align: 'center' });
    
    // Subtítulo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...CORES.textoMedio);
    const subtitulo = config.subtitulo || 'Instituto de Desenvolvimento da Juventude, Esporte e Lazer - IDJUV';
    doc.text(subtitulo, pageWidth / 2, y + 14, { align: 'center' });
    
    y += 20;
    
    // Linha de informações
    doc.setFontSize(8);
    const dataGeracao = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    const info = `Gerado em: ${dataGeracao} | Total de registros: ${dados.length}`;
    if (config.mesReferencia) {
      doc.text(`Referência: ${config.mesReferencia} | ${info}`, pageWidth / 2, y, { align: 'center' });
    } else {
      doc.text(info, pageWidth / 2, y, { align: 'center' });
    }
    
    y += 6;
  };

  const renderTableHeader = (): void => {
    // Fundo do cabeçalho
    doc.setFillColor(...CORES.header);
    doc.rect(marginX, y, contentWidth, 8, 'F');
    
    // Textos do cabeçalho
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...CORES.branco);
    
    let x = marginX;
    COLUNAS.forEach((col) => {
      let textX = x + 2;
      if (col.align === 'center') {
        textX = x + col.largura / 2;
      } else if (col.align === 'right') {
        textX = x + col.largura - 2;
      }
      
      doc.text(col.label, textX, y + 5.5, { align: col.align === 'left' ? 'left' : col.align });
      x += col.largura;
    });
    
    y += 8;
  };

  const renderRow = (servidor: DadosServidor, index: number, numero: number): void => {
    const rowHeight = 6;
    
    // Verificar quebra de página
    if (y + rowHeight > pageHeight - 20) {
      renderFooter();
      doc.addPage();
      paginaAtual++;
      renderHeader();
      renderTableHeader();
    }
    
    // Fundo alternado
    const bgColor = index % 2 === 0 ? CORES.fundoPar : CORES.fundoImpar;
    doc.setFillColor(...bgColor);
    doc.rect(marginX, y, contentWidth, rowHeight, 'F');
    
    // Borda inferior sutil
    doc.setDrawColor(...CORES.bordaTabela);
    doc.setLineWidth(0.1);
    doc.line(marginX, y + rowHeight, marginX + contentWidth, y + rowHeight);
    
    // Configurar texto
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...CORES.textoEscuro);
    
    let x = marginX;
    
    // Nº
    doc.text(String(numero), x + COLUNAS[0].largura / 2, y + 4, { align: 'center' });
    x += COLUNAS[0].largura;
    
    // NOME COMPLETO (truncado se necessário)
    const nome = truncarTexto(servidor.nome_completo || '-', COLUNAS[1].largura, doc);
    doc.text(nome, x + 2, y + 4);
    x += COLUNAS[1].largura;
    
    // CPF
    const cpf = formatarCPF(servidor.cpf);
    doc.text(cpf, x + COLUNAS[2].largura / 2, y + 4, { align: 'center' });
    x += COLUNAS[2].largura;
    
    // CARGO (truncado se necessário)
    const cargo = truncarTexto(servidor.cargo_nome || '-', COLUNAS[3].largura, doc);
    doc.text(cargo, x + 2, y + 4);
    x += COLUNAS[3].largura;
    
    // CÓDIGO (sigla do cargo ou matrícula)
    const codigo = servidor.cargo_sigla || servidor.matricula || '-';
    doc.text(truncarTexto(codigo, COLUNAS[4].largura, doc), x + COLUNAS[4].largura / 2, y + 4, { align: 'center' });
    x += COLUNAS[4].largura;
    
    // VALORES
    const valor = servidor.valor_total ?? servidor.vencimento_base ?? 0;
    totalValores += valor;
    doc.text(formatarMoeda(valor), x + COLUNAS[5].largura - 2, y + 4, { align: 'right' });
    
    y += rowHeight;
  };

  const renderTotalizador = (): void => {
    // Verificar espaço
    if (y + 10 > pageHeight - 20) {
      renderFooter();
      doc.addPage();
      paginaAtual++;
      renderHeader();
    }
    
    y += 2;
    
    // Linha do totalizador
    doc.setFillColor(...CORES.header);
    doc.rect(marginX, y, contentWidth, 8, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...CORES.branco);
    
    // Label
    let x = marginX;
    const larguraLabel = COLUNAS[0].largura + COLUNAS[1].largura + COLUNAS[2].largura + COLUNAS[3].largura + COLUNAS[4].largura;
    doc.text('TOTAL GERAL:', x + larguraLabel - 5, y + 5.5, { align: 'right' });
    
    // Valor total
    x = marginX + larguraLabel;
    doc.text(formatarMoeda(totalValores), x + COLUNAS[5].largura - 2, y + 5.5, { align: 'right' });
    
    y += 12;
  };

  const renderFooter = (): void => {
    doc.setFillColor(...CORES.primaria);
    doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...CORES.branco);
    
    doc.text('Sistema de Gestão - IDJUV | Governo do Estado de Roraima', marginX, pageHeight - 4);
    doc.text(`Página ${paginaAtual}`, pageWidth - marginX - 20, pageHeight - 4);
  };

  // ================================================================
  // RENDERIZAÇÃO PRINCIPAL
  // ================================================================

  renderHeader();
  renderTableHeader();

  // Renderizar dados
  dados.forEach((servidor, index) => {
    renderRow(servidor, index, index + 1);
  });

  // Totalizador
  if (dados.length > 0) {
    renderTotalizador();
  }

  // Rodapé final
  renderFooter();

  // Baixar PDF
  const nomeArquivo = `relatorio_folha_simplificado_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`;
  doc.save(nomeArquivo);
}
