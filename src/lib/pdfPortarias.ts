import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { loadLogos, calculateLogoDimensions, LogoCache, CORES } from './pdfTemplate';
import { Artigo, ConfiguracaoTabela, ConfiguracaoAssinatura, ColunaTabela, COLUNA_LABELS } from '@/types/portariaUnificada';

// Configurações do documento - Margens padrão ABNT
const CONFIG = {
  marginLeft: 25,
  marginRight: 20,
  marginTop: 15,
  marginBottom: 25,
  pageWidth: 210,
  pageHeight: 297,
  headerHeight: 35,
  footerHeight: 20,
  lineHeight: 5,
};

// Cache de logos
let logoCache: { governo: LogoCache | null; idjuvOficial: LogoCache | null; idjuvDark: LogoCache | null } | null = null;

async function getLogos() {
  if (!logoCache) {
    logoCache = await loadLogos();
  }
  return logoCache;
}

// Interfaces legadas
interface DadosPortaria {
  numero: string;
  data_documento: string;
  ementa?: string;
  conteudo?: string;
}

interface DadosServidor {
  nome_completo: string;
  cpf: string;
  matricula?: string;
}

interface DadosCargo {
  nome: string;
  sigla?: string;
  simbolo?: string;
}

interface DadosUnidade {
  nome: string;
  sigla?: string;
}

// Configurações do Presidente
const PRESIDENTE = {
  nome: 'MARCELO DE MAGALHÃES NUNES',
  cargo: 'Presidente do Instituto de Desporto, Juventude e Lazer',
  orgao: 'do Estado de Roraima',
};

// Função auxiliar para formatar data por extenso
function formatarDataExtenso(dataString: string): string {
  const data = new Date(dataString + 'T00:00:00');
  return format(data, "d 'de' MMMM 'de' yyyy", { locale: ptBR });
}

// Função auxiliar para formatar data para cabeçalho da portaria
function formatarDataCabecalhoPortaria(dataString: string): string {
  const data = new Date(dataString + 'T00:00:00');
  const dia = format(data, 'dd', { locale: ptBR });
  const mes = format(data, 'MMMM', { locale: ptBR }).toUpperCase();
  const ano = format(data, 'yyyy', { locale: ptBR });
  return `${dia} DE ${mes} DE ${ano}`;
}

// Formatar número da portaria no padrão oficial
function formatarCabecalhoPortaria(numero: string, dataDocumento: string): string {
  const dataFormatada = formatarDataCabecalhoPortaria(dataDocumento);
  const ano = new Date(dataDocumento + 'T00:00:00').getFullYear();
  const numeroLimpo = numero.split('/')[0];
  return `PORTARIA Nº ${numeroLimpo}/IDJuv/PRESI/GAB/${ano} DE ${dataFormatada}`;
}

// Função auxiliar para formatar CPF
function formatarCPF(cpf: string): string {
  const numeros = cpf.replace(/\D/g, '');
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Adiciona cabeçalho com logos
async function addHeaderWithLogos(doc: jsPDF): Promise<number> {
  const logos = await getLogos();
  const pageWidth = CONFIG.pageWidth;
  const centerX = pageWidth / 2;
  const logoMaxHeight = 12;
  const logoMargin = 15;
  
  let y = CONFIG.marginTop;
  
  // Logo Governo (esquerda)
  if (logos.governo?.data) {
    try {
      const dims = calculateLogoDimensions(logos.governo.width, logos.governo.height, logoMaxHeight);
      doc.addImage(logos.governo.data, 'JPEG', logoMargin, y, dims.width, dims.height);
    } catch (e) { /* silently fail */ }
  }
  
  // Logo IDJUV (direita)
  const logoIdjuv = logos.idjuvOficial;
  if (logoIdjuv?.data) {
    try {
      const dims = calculateLogoDimensions(logoIdjuv.width, logoIdjuv.height, logoMaxHeight);
      doc.addImage(logoIdjuv.data, 'PNG', pageWidth - logoMargin - dims.width, y, dims.width, dims.height);
    } catch (e) { /* silently fail */ }
  }
  
  // Textos do cabeçalho
  y += 3;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('GOVERNO DO ESTADO DE RORAIMA', centerX, y, { align: 'center' });
  
  y += 5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('INSTITUTO DE DESPORTO, JUVENTUDE E LAZER DO ESTADO DE RORAIMA', centerX, y, { align: 'center' });
  
  y += 4;
  doc.setFont('helvetica', 'bold');
  doc.text('IDJUV', centerX, y, { align: 'center' });
  
  // Linha separadora
  y += 4;
  doc.setDrawColor(0, 100, 0);
  doc.setLineWidth(0.8);
  doc.line(CONFIG.marginLeft, y, pageWidth - CONFIG.marginRight, y);
  
  return y + 8;
}

// Adiciona rodapé com logos e paginação
async function addFooterWithLogos(doc: jsPDF, pageNumber: number, totalPages: number) {
  const logos = await getLogos();
  const pageWidth = CONFIG.pageWidth;
  const pageHeight = CONFIG.pageHeight;
  const footerY = pageHeight - CONFIG.footerHeight;
  const logoMaxHeight = 8;
  const logoMargin = 15;
  
  // Linha separadora do rodapé
  doc.setDrawColor(0, 100, 0);
  doc.setLineWidth(0.5);
  doc.line(CONFIG.marginLeft, footerY, pageWidth - CONFIG.marginRight, footerY);
  
  // Logo Governo (esquerda no rodapé)
  if (logos.governo?.data) {
    try {
      const dims = calculateLogoDimensions(logos.governo.width, logos.governo.height, logoMaxHeight);
      doc.addImage(logos.governo.data, 'JPEG', logoMargin, footerY + 2, dims.width, dims.height);
    } catch (e) { /* silently fail */ }
  }
  
  // Paginação (centro)
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth / 2, footerY + 5, { align: 'center' });
  
  // Endereço (centro abaixo)
  doc.setFontSize(7);
  doc.text('Av. Brigadeiro Eduardo Gomes, 4124 - Aeroporto - CEP: 69.310-005 - Boa Vista/RR', pageWidth / 2, footerY + 10, { align: 'center' });
  
  // Logo IDJUV (direita no rodapé)
  const logoIdjuv = logos.idjuvOficial;
  if (logoIdjuv?.data) {
    try {
      const dims = calculateLogoDimensions(logoIdjuv.width, logoIdjuv.height, logoMaxHeight);
      doc.addImage(logoIdjuv.data, 'PNG', pageWidth - logoMargin - dims.width, footerY + 2, dims.width, dims.height);
    } catch (e) { /* silently fail */ }
  }
}

// Verifica se há espaço suficiente na página
function checkPageSpace(doc: jsPDF, currentY: number, requiredSpace: number, addHeaderFn: () => Promise<number>): { needsNewPage: boolean; newY: number } {
  const maxY = CONFIG.pageHeight - CONFIG.footerHeight - 10;
  if (currentY + requiredSpace > maxY) {
    return { needsNewPage: true, newY: 0 };
  }
  return { needsNewPage: false, newY: currentY };
}

// (PRESIDENTE já definido acima)

// Interface para dados do servidor na tabela
interface ServidorTabela {
  nome_completo: string;
  cpf: string;
  matricula?: string;
  cargo: string;
  codigo: string;
  unidade_nome?: string;
  [key: string]: string | undefined;
}

/**
 * Gera PDF de Portaria Unificada com logos, tabela configurável e artigos personalizados
 */
export async function generatePortariaUnificadaPdf(
  portaria: { numero: string; data_documento: string },
  preambulo: string,
  artigos: Artigo[],
  servidores: ServidorTabela[],
  configTabela: ConfiguracaoTabela,
  assinatura: ConfiguracaoAssinatura
): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const contentWidth = CONFIG.pageWidth - CONFIG.marginLeft - CONFIG.marginRight;
  
  // Adicionar cabeçalho inicial
  let y = await addHeaderWithLogos(doc);

  // Título da portaria
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const tituloPortaria = formatarCabecalhoPortaria(portaria.numero, portaria.data_documento);
  const tituloLines = doc.splitTextToSize(tituloPortaria, contentWidth);
  tituloLines.forEach((line: string) => {
    doc.text(line, CONFIG.pageWidth / 2, y, { align: 'center' });
    y += 5;
  });
  y += 8;

  // Preâmbulo
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const preambuloLines = doc.splitTextToSize(preambulo, contentWidth);
  preambuloLines.forEach((line: string) => {
    // Verificar se precisa de nova página
    if (y > CONFIG.pageHeight - CONFIG.footerHeight - 20) {
      doc.addPage();
      y = CONFIG.marginTop + 10;
    }
    doc.text(line, CONFIG.marginLeft, y);
    y += 4.5;
  });
  y += 6;

  // Primeiro artigo (antes da tabela se houver)
  const primeiroArtigo = artigos[0];
  if (primeiroArtigo) {
    const art1Text = `Art. ${primeiroArtigo.numero} ${primeiroArtigo.conteudo}`;
    const art1Lines = doc.splitTextToSize(art1Text, contentWidth);
    art1Lines.forEach((line: string) => {
      if (y > CONFIG.pageHeight - CONFIG.footerHeight - 20) {
        doc.addPage();
        y = CONFIG.marginTop + 10;
      }
      doc.text(line, CONFIG.marginLeft, y);
      y += 4.5;
    });
    y += 4;
  }

  // Tabela de servidores (se habilitada e tiver servidores)
  if (configTabela.habilitada && servidores.length > 0) {
    y = await renderTabelaServidores(doc, servidores, configTabela, y);
    y += 6;
  }

  // Artigos restantes
  for (let i = 1; i < artigos.length; i++) {
    const artigo = artigos[i];
    const artigoText = `Art. ${artigo.numero} ${artigo.conteudo}`;
    const artigoLines = doc.splitTextToSize(artigoText, contentWidth);
    
    // Verificar espaço
    if (y + artigoLines.length * 4.5 > CONFIG.pageHeight - CONFIG.footerHeight - 30) {
      doc.addPage();
      y = CONFIG.marginTop + 10;
    }
    
    artigoLines.forEach((line: string) => {
      doc.text(line, CONFIG.marginLeft, y);
      y += 4.5;
    });
    y += 4;
  }

  // Verificar espaço para assinatura
  if (y > CONFIG.pageHeight - CONFIG.footerHeight - 50) {
    doc.addPage();
    y = CONFIG.marginTop + 10;
  }

  y += 10;

  // Local e data
  const dataDocumentoTexto = formatarDataExtenso(portaria.data_documento);
  doc.setFont('helvetica', 'normal');
  doc.text(`${assinatura.local}, ${dataDocumentoTexto}.`, CONFIG.marginLeft, y);
  y += 20;

  // Assinatura
  doc.setFont('helvetica', 'bold');
  doc.text(assinatura.nome, CONFIG.pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  const cargoLines = assinatura.cargo.split('\n');
  cargoLines.forEach((linha) => {
    doc.text(linha, CONFIG.pageWidth / 2, y, { align: 'center' });
    y += 4;
  });

  // Adicionar rodapé em todas as páginas
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    await addFooterWithLogos(doc, i, pageCount);
  }

  return doc;
}

/**
 * Renderiza tabela de servidores com colunas configuráveis
 */
async function renderTabelaServidores(
  doc: jsPDF,
  servidores: ServidorTabela[],
  config: ConfiguracaoTabela,
  startY: number
): Promise<number> {
  const tableX = CONFIG.marginLeft;
  const tableWidth = CONFIG.pageWidth - CONFIG.marginLeft - CONFIG.marginRight;
  const headerRowHeight = 7;
  const minRowHeight = 8;
  
  // Definir larguras das colunas baseado nas colunas selecionadas
  const colunasAtivas = config.colunas;
  const numColunas = colunasAtivas.length + config.colunasPersonalizadas.length;
  
  // Distribuir larguras proporcionalmente
  const colWidths: Record<string, number> = {};
  const baseWidths: Record<ColunaTabela, number> = {
    numero: 8,
    nome_completo: 45,
    cpf: 28,
    matricula: 20,
    cargo: 35,
    unidade_setor: 30,
    codigo: 10,
    custom: 20,
  };
  
  // Calcular largura total das colunas selecionadas
  let totalBaseWidth = 0;
  colunasAtivas.forEach((col) => {
    totalBaseWidth += baseWidths[col] || 20;
  });
  config.colunasPersonalizadas.forEach(() => {
    totalBaseWidth += 20;
  });
  
  // Escalar para caber na largura disponível
  const scale = tableWidth / totalBaseWidth;
  colunasAtivas.forEach((col) => {
    colWidths[col] = (baseWidths[col] || 20) * scale;
  });
  config.colunasPersonalizadas.forEach((col) => {
    colWidths[col.id] = 20 * scale;
  });

  let y = startY;

  // Função para desenhar cabeçalho da tabela
  const drawTableHeader = async () => {
    doc.setFillColor(230, 230, 230);
    doc.rect(tableX, y, tableWidth, headerRowHeight, 'F');
    doc.setDrawColor(80, 80, 80);
    doc.setLineWidth(0.3);
    doc.rect(tableX, y, tableWidth, headerRowHeight);
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    
    let colX = tableX;
    
    // Desenhar cabeçalhos das colunas padrão
    colunasAtivas.forEach((col) => {
      const width = colWidths[col];
      const label = COLUNA_LABELS[col] || col;
      doc.text(label, colX + 2, y + 5);
      doc.line(colX + width, y, colX + width, y + headerRowHeight);
      colX += width;
    });
    
    // Desenhar cabeçalhos das colunas personalizadas
    config.colunasPersonalizadas.forEach((col) => {
      const width = colWidths[col.id];
      doc.text(col.titulo.toUpperCase(), colX + 2, y + 5);
      doc.line(colX + width, y, colX + width, y + headerRowHeight);
      colX += width;
    });
    
    y += headerRowHeight;
  };

  // Verificar espaço para iniciar tabela
  if (y + headerRowHeight + minRowHeight * 2 > CONFIG.pageHeight - CONFIG.footerHeight - 10) {
    doc.addPage();
    y = CONFIG.marginTop + 10;
  }
  
  await drawTableHeader();

  // Renderizar linhas da tabela
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);

  for (let index = 0; index < servidores.length; index++) {
    const servidor = servidores[index];
    
    // Calcular altura da linha baseado no conteúdo
    let maxLines = 1;
    colunasAtivas.forEach((col) => {
      const valor = getValorColuna(servidor, col, index);
      const lines = doc.splitTextToSize(valor, colWidths[col] - 3);
      maxLines = Math.max(maxLines, lines.length);
    });
    const lineHeight = Math.max(minRowHeight, maxLines * 3.2 + 2);

    // Verificar se precisa de nova página
    if (y + lineHeight > CONFIG.pageHeight - CONFIG.footerHeight - 15) {
      doc.addPage();
      y = CONFIG.marginTop + 10;
      await drawTableHeader();
    }

    // Alternar cor de fundo
    if (index % 2 === 1) {
      doc.setFillColor(248, 248, 248);
      doc.rect(tableX, y, tableWidth, lineHeight, 'F');
    }

    // Borda da linha
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.2);
    doc.rect(tableX, y, tableWidth, lineHeight);

    let colX = tableX;

    // Renderizar valores das colunas padrão
    colunasAtivas.forEach((col) => {
      const width = colWidths[col];
      const valor = getValorColuna(servidor, col, index);
      const lines = doc.splitTextToSize(valor, width - 3);
      
      if (col === 'numero' || col === 'codigo') {
        doc.text(valor, colX + width / 2, y + lineHeight / 2 + 1, { align: 'center' });
      } else if (col === 'cpf') {
        doc.text(valor, colX + width / 2, y + lineHeight / 2 + 1, { align: 'center' });
      } else {
        doc.text(lines, colX + 1.5, y + 3.5);
      }
      
      doc.line(colX + width, y, colX + width, y + lineHeight);
      colX += width;
    });
    
    // Renderizar colunas personalizadas
    config.colunasPersonalizadas.forEach((col) => {
      const width = colWidths[col.id];
      const valor = servidor[col.id] || '-';
      doc.text(valor, colX + 2, y + lineHeight / 2 + 1);
      doc.line(colX + width, y, colX + width, y + lineHeight);
      colX += width;
    });

    y += lineHeight;
  }

  return y;
}

/**
 * Obtém valor da coluna para o servidor
 */
function getValorColuna(servidor: ServidorTabela, coluna: ColunaTabela, index: number): string {
  switch (coluna) {
    case 'numero':
      return String(index + 1);
    case 'nome_completo':
      return servidor.nome_completo?.toUpperCase() || '-';
    case 'cpf':
      return servidor.cpf ? formatarCPF(servidor.cpf) : '-';
    case 'matricula':
      return servidor.matricula || '-';
    case 'cargo':
      return servidor.cargo || '-';
    case 'unidade_setor':
      return servidor.unidade_nome || '-';
    case 'codigo':
      return servidor.codigo || '-';
    default:
      return '-';
  }
}

// ============ FUNÇÕES LEGADAS (mantidas para compatibilidade) ============

interface DadosPortaria {
  numero: string;
  data_documento: string;
  ementa?: string;
  conteudo?: string;
}

interface DadosServidor {
  nome_completo: string;
  cpf: string;
  matricula?: string;
}

interface DadosCargo {
  nome: string;
  sigla?: string;
  simbolo?: string;
}

interface DadosUnidade {
  nome: string;
  sigla?: string;
}

// Adiciona cabeçalho simples (legado)
function addHeader(doc: jsPDF) {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('GOVERNO DO ESTADO DE RORAIMA', CONFIG.pageWidth / 2, CONFIG.marginTop, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('INSTITUTO DE DESPORTO, JUVENTUDE E LAZER DO ESTADO DE RORAIMA', CONFIG.pageWidth / 2, CONFIG.marginTop + 5, { align: 'center' });
  doc.text('IDJUV', CONFIG.pageWidth / 2, CONFIG.marginTop + 10, { align: 'center' });
  
  doc.setLineWidth(0.3);
  doc.line(CONFIG.marginLeft, CONFIG.marginTop + 14, CONFIG.pageWidth - CONFIG.marginRight, CONFIG.marginTop + 14);
}

// Adiciona rodapé simples (legado)
function addFooter(doc: jsPDF, pageNumber: number, totalPages: number) {
  const footerY = CONFIG.pageHeight - 10;
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Página ${pageNumber} de ${totalPages}`, CONFIG.pageWidth / 2, footerY, { align: 'center' });
  
  doc.setFontSize(7);
  doc.text('Av. Brigadeiro Eduardo Gomes, 4124 - Aeroporto - CEP: 69.310-005 - Boa Vista/RR', CONFIG.pageWidth / 2, footerY + 4, { align: 'center' });
}

// Gera PDF de Portaria Coletiva COM TABELA (versão legada mantida para compatibilidade)
export function generatePortariaColetivaComTabela(
  portaria: { numero: string; data_documento: string },
  cabecalho: string,
  servidores: Array<{
    nome_completo: string;
    cpf: string;
    cargo: string;
    codigo: string;
    unidade_nome?: string;
  }>,
  tipoAcao: 'nomeacao' | 'exoneracao' = 'nomeacao'
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  addHeader(doc);

  let y = CONFIG.marginTop + 20;
  const contentWidth = CONFIG.pageWidth - CONFIG.marginLeft - CONFIG.marginRight;

  // Título
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const tituloPortaria = formatarCabecalhoPortaria(portaria.numero, portaria.data_documento);
  const tituloLines = doc.splitTextToSize(tituloPortaria, contentWidth);
  tituloLines.forEach((line: string) => {
    doc.text(line, CONFIG.pageWidth / 2, y, { align: 'center' });
    y += 5;
  });
  y += 8;

  // Cabeçalho personalizado
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const cabecalhoLines = doc.splitTextToSize(cabecalho, contentWidth);
  cabecalhoLines.forEach((line: string) => {
    doc.text(line, CONFIG.marginLeft, y);
    y += 5;
  });
  y += 6;

  // Art. 1º
  const verbo = tipoAcao === 'nomeacao' ? 'NOMEAR' : 'EXONERAR';
  const artigo1 = `Art. 1º ${verbo} os servidores abaixo relacionados para os respectivos cargos em comissão do Instituto de Desporto, Juventude e Lazer do Estado de Roraima – IDJuv:`;
  const artigo1Lines = doc.splitTextToSize(artigo1, contentWidth);
  doc.text(artigo1Lines, CONFIG.marginLeft, y);
  y += artigo1Lines.length * 5 + 6;

  // Tabela
  const colWidths = { num: 8, nome: 48, cpf: 28, cargo: 36, unidade: 32, codigo: 8 };
  const tableWidth = contentWidth;
  const tableX = CONFIG.marginLeft;
  const headerRowHeight = 7;
  const minRowHeight = 8;

  const drawTableHeader = () => {
    doc.setFillColor(230, 230, 230);
    doc.rect(tableX, y, tableWidth, headerRowHeight, 'F');
    doc.setDrawColor(80);
    doc.setLineWidth(0.3);
    doc.rect(tableX, y, tableWidth, headerRowHeight);
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    
    let colX = tableX;
    doc.text('Nº', colX + colWidths.num / 2, y + 5, { align: 'center' });
    doc.line(colX + colWidths.num, y, colX + colWidths.num, y + headerRowHeight);
    colX += colWidths.num;
    
    doc.text('NOME COMPLETO', colX + 2, y + 5);
    doc.line(colX + colWidths.nome, y, colX + colWidths.nome, y + headerRowHeight);
    colX += colWidths.nome;
    
    doc.text('CPF', colX + colWidths.cpf / 2, y + 5, { align: 'center' });
    doc.line(colX + colWidths.cpf, y, colX + colWidths.cpf, y + headerRowHeight);
    colX += colWidths.cpf;
    
    doc.text('CARGO', colX + 2, y + 5);
    doc.line(colX + colWidths.cargo, y, colX + colWidths.cargo, y + headerRowHeight);
    colX += colWidths.cargo;

    doc.text('UNIDADE/SETOR', colX + 2, y + 5);
    doc.line(colX + colWidths.unidade, y, colX + colWidths.unidade, y + headerRowHeight);
    colX += colWidths.unidade;
    
    doc.text('CÓD.', colX + colWidths.codigo / 2, y + 5, { align: 'center' });
    
    y += headerRowHeight;
  };

  drawTableHeader();

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);

  servidores.forEach((s, index) => {
    const nomeLines = doc.splitTextToSize(s.nome_completo.toUpperCase(), colWidths.nome - 3);
    const cargoLines = doc.splitTextToSize(s.cargo, colWidths.cargo - 3);
    const unidadeLines = doc.splitTextToSize(s.unidade_nome || '-', colWidths.unidade - 3);
    const maxLines = Math.max(nomeLines.length, cargoLines.length, unidadeLines.length);
    const lineHeight = Math.max(minRowHeight, maxLines * 3.2 + 2);

    if (y + lineHeight > CONFIG.pageHeight - CONFIG.marginBottom - 20) {
      doc.addPage();
      addHeader(doc);
      y = CONFIG.marginTop + 20;
      drawTableHeader();
    }

    if (index % 2 === 1) {
      doc.setFillColor(248, 248, 248);
      doc.rect(tableX, y, tableWidth, lineHeight, 'F');
    }

    doc.setDrawColor(150);
    doc.setLineWidth(0.2);
    doc.rect(tableX, y, tableWidth, lineHeight);

    let colX = tableX;

    doc.text(String(index + 1), colX + colWidths.num / 2, y + lineHeight / 2 + 1, { align: 'center' });
    doc.line(colX + colWidths.num, y, colX + colWidths.num, y + lineHeight);
    colX += colWidths.num;

    doc.text(nomeLines, colX + 1.5, y + 3.5);
    doc.line(colX + colWidths.nome, y, colX + colWidths.nome, y + lineHeight);
    colX += colWidths.nome;

    doc.text(formatarCPF(s.cpf), colX + colWidths.cpf / 2, y + lineHeight / 2 + 1, { align: 'center' });
    doc.line(colX + colWidths.cpf, y, colX + colWidths.cpf, y + lineHeight);
    colX += colWidths.cpf;

    doc.text(cargoLines, colX + 1.5, y + 3.5);
    doc.line(colX + colWidths.cargo, y, colX + colWidths.cargo, y + lineHeight);
    colX += colWidths.cargo;

    doc.text(unidadeLines, colX + 1.5, y + 3.5);
    doc.line(colX + colWidths.unidade, y, colX + colWidths.unidade, y + lineHeight);
    colX += colWidths.unidade;

    doc.text(s.codigo || '-', colX + colWidths.codigo / 2, y + lineHeight / 2 + 1, { align: 'center' });

    y += lineHeight;
  });

  y += 8;

  // Art. 2º
  doc.setFontSize(10);
  const artigo2 = 'Art. 2º Os nomeados farão jus à remuneração correspondente aos respectivos cargos, conforme disposto no Anexo I da Lei nº 2.301, de 29 de dezembro de 2025.';
  const artigo2Lines = doc.splitTextToSize(artigo2, contentWidth);
  doc.text(artigo2Lines, CONFIG.marginLeft, y);
  y += artigo2Lines.length * 5 + 6;

  // Art. 3º
  const artigo3 = 'Art. 3º Esta Portaria entra em vigor na data de sua publicação.';
  doc.text(artigo3, CONFIG.marginLeft, y);
  y += 15;

  // Local e data
  const dataDocumentoTexto = formatarDataExtenso(portaria.data_documento);
  doc.text(`Boa Vista – RR, ${dataDocumentoTexto}.`, CONFIG.marginLeft, y);
  y += 20;

  // Assinatura
  doc.setFont('helvetica', 'bold');
  doc.text(PRESIDENTE.nome, CONFIG.pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(PRESIDENTE.cargo, CONFIG.pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text(PRESIDENTE.orgao, CONFIG.pageWidth / 2, y, { align: 'center' });

  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    addFooter(doc, i, pageCount);
  }

  return doc;
}

// ============ FUNÇÕES LEGADAS PARA COMPATIBILIDADE ============

// Gera PDF de Portaria de Nomeação (legado)
export function generatePortariaNomeacao(
  portaria: DadosPortaria,
  servidor: DadosServidor,
  cargo: DadosCargo,
  unidade: DadosUnidade,
  tipoNomeacao: 'comissionado' | 'efetivo' = 'comissionado',
  dataEfeitos?: string
): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  addHeader(doc);
  let y = CONFIG.marginTop + 25;
  const contentWidth = CONFIG.pageWidth - CONFIG.marginLeft - CONFIG.marginRight;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const titulo = formatarCabecalhoPortaria(portaria.numero, portaria.data_documento);
  const tituloLines = doc.splitTextToSize(titulo, contentWidth);
  tituloLines.forEach((line: string) => { doc.text(line, CONFIG.pageWidth / 2, y, { align: 'center' }); y += 5; });
  y += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const preambulo = 'O PRESIDENTE DO INSTITUTO DE DESPORTO, JUVENTUDE E LAZER DO ESTADO DE RORAIMA – IDJuv, no uso das atribuições legais que lhe são conferidas pela Lei nº 2.301, de 29 de dezembro de 2025, e demais normas aplicáveis,';
  const preambuloLines = doc.splitTextToSize(preambulo, contentWidth);
  doc.text(preambuloLines, CONFIG.marginLeft, y);
  y += preambuloLines.length * 5 + 8;

  doc.setFont('helvetica', 'bold');
  doc.text('RESOLVE:', CONFIG.marginLeft, y);
  y += 10;

  doc.setFont('helvetica', 'normal');
  const simboloTexto = cargo.simbolo ? `, código ${cargo.simbolo}` : '';
  const artigo1 = `Art. 1º NOMEAR ${servidor.nome_completo.toUpperCase()}, para exercer o cargo em comissão de ${cargo.nome.toUpperCase()}${simboloTexto}, integrante da estrutura organizacional do Instituto de Desporto, Juventude e Lazer do Estado de Roraima – IDJuv.`;
  const artigo1Lines = doc.splitTextToSize(artigo1, contentWidth);
  doc.text(artigo1Lines, CONFIG.marginLeft, y);
  y += artigo1Lines.length * 5 + 8;

  doc.text('Art. 2º Esta Portaria entra em vigor na data de sua publicação.', CONFIG.marginLeft, y);
  y += 25;

  doc.setFont('helvetica', 'bold');
  doc.text(PRESIDENTE.nome, CONFIG.pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(PRESIDENTE.cargo, CONFIG.pageWidth / 2, y, { align: 'center' });

  addFooter(doc, 1, 1);
  return doc;
}

// Gera PDF de Portaria de Exoneração (legado)
export function generatePortariaExoneracao(
  portaria: DadosPortaria,
  servidor: DadosServidor,
  cargo: DadosCargo,
  unidade: DadosUnidade,
  motivo: 'pedido' | 'oficio' = 'pedido'
): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  addHeader(doc);
  let y = CONFIG.marginTop + 25;
  const contentWidth = CONFIG.pageWidth - CONFIG.marginLeft - CONFIG.marginRight;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const titulo = formatarCabecalhoPortaria(portaria.numero, portaria.data_documento);
  const tituloLines = doc.splitTextToSize(titulo, contentWidth);
  tituloLines.forEach((line: string) => { doc.text(line, CONFIG.pageWidth / 2, y, { align: 'center' }); y += 5; });
  y += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const preambulo = 'O PRESIDENTE DO INSTITUTO DE DESPORTO, JUVENTUDE E LAZER DO ESTADO DE RORAIMA – IDJuv, no uso das atribuições legais que lhe são conferidas pela Lei nº 2.301, de 29 de dezembro de 2025, e demais normas aplicáveis,';
  const preambuloLines = doc.splitTextToSize(preambulo, contentWidth);
  doc.text(preambuloLines, CONFIG.marginLeft, y);
  y += preambuloLines.length * 5 + 8;

  doc.setFont('helvetica', 'bold');
  doc.text('RESOLVE:', CONFIG.marginLeft, y);
  y += 10;

  doc.setFont('helvetica', 'normal');
  const motivoTexto = motivo === 'pedido' ? 'a pedido' : 'de ofício';
  const artigo1 = `Art. 1º EXONERAR, ${motivoTexto}, ${servidor.nome_completo.toUpperCase()}, inscrito(a) no CPF nº ${formatarCPF(servidor.cpf)}, do cargo de ${cargo.nome}, no(a) ${unidade.nome}, do Instituto de Desporto, Juventude e Lazer do Estado de Roraima – IDJuv.`;
  const artigo1Lines = doc.splitTextToSize(artigo1, contentWidth);
  doc.text(artigo1Lines, CONFIG.marginLeft, y);
  y += artigo1Lines.length * 5 + 8;

  doc.text('Art. 2º Esta Portaria entra em vigor na data de sua publicação.', CONFIG.marginLeft, y);
  y += 25;

  doc.setFont('helvetica', 'bold');
  doc.text(PRESIDENTE.nome, CONFIG.pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(PRESIDENTE.cargo, CONFIG.pageWidth / 2, y, { align: 'center' });

  addFooter(doc, 1, 1);
  return doc;
}

// Gera PDF de Portaria de Designação (legado)
export function generatePortariaDesignacao(
  portaria: DadosPortaria,
  servidor: DadosServidor,
  cargo: DadosCargo,
  unidadeOrigem: DadosUnidade,
  unidadeDestino: DadosUnidade,
  dataInicio: string,
  dataFim?: string
): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  addHeader(doc);
  let y = CONFIG.marginTop + 25;
  const contentWidth = CONFIG.pageWidth - CONFIG.marginLeft - CONFIG.marginRight;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const titulo = formatarCabecalhoPortaria(portaria.numero, portaria.data_documento);
  const tituloLines = doc.splitTextToSize(titulo, contentWidth);
  tituloLines.forEach((line: string) => { doc.text(line, CONFIG.pageWidth / 2, y, { align: 'center' }); y += 5; });
  y += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const preambulo = 'O PRESIDENTE DO INSTITUTO DE DESPORTO, JUVENTUDE E LAZER DO ESTADO DE RORAIMA – IDJuv, no uso das atribuições legais que lhe são conferidas pela Lei nº 2.301, de 29 de dezembro de 2025, e demais normas aplicáveis,';
  const preambuloLines = doc.splitTextToSize(preambulo, contentWidth);
  doc.text(preambuloLines, CONFIG.marginLeft, y);
  y += preambuloLines.length * 5 + 8;

  doc.setFont('helvetica', 'bold');
  doc.text('RESOLVE:', CONFIG.marginLeft, y);
  y += 10;

  doc.setFont('helvetica', 'normal');
  const artigo1 = `Art. 1º DESIGNAR ${servidor.nome_completo.toUpperCase()}, inscrito(a) no CPF nº ${formatarCPF(servidor.cpf)}, ocupante do cargo de ${cargo.nome}, lotado(a) no(a) ${unidadeOrigem.nome}, para exercer suas atividades no(a) ${unidadeDestino.nome}.`;
  const artigo1Lines = doc.splitTextToSize(artigo1, contentWidth);
  doc.text(artigo1Lines, CONFIG.marginLeft, y);
  y += artigo1Lines.length * 5 + 8;

  doc.text('Art. 2º Esta Portaria entra em vigor na data de sua publicação.', CONFIG.marginLeft, y);
  y += 25;

  doc.setFont('helvetica', 'bold');
  doc.text(PRESIDENTE.nome, CONFIG.pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.text(PRESIDENTE.cargo, CONFIG.pageWidth / 2, y, { align: 'center' });

  addFooter(doc, 1, 1);
  return doc;
}
