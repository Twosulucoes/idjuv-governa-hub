/**
 * Sistema Modular de PDF para Federações Esportivas
 * 
 * Arquitetura em blocos reutilizáveis:
 * - Bloco 1: Cabeçalho Institucional
 * - Bloco 2: Conteúdo Central (variável por tipo de relatório)
 * - Bloco 3: Rodapé com metadados
 * 
 * IMPORTANTE: Sempre usar a logo OFICIAL em fundo branco (não a versão dark)
 */

import jsPDF from 'jspdf';
import { format, isPast, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { loadLogos, calculateLogoDimensions, CORES, type LogoCache } from './pdfTemplate';
import { getLogosPDF, LOGO_CONFIG_PADRAO } from './pdfLogos';

// ============================================================
// TIPOS E INTERFACES
// ============================================================

export interface FederacaoCompleta {
  id: string;
  nome: string;
  sigla: string;
  cnpj?: string | null;
  data_criacao: string;
  endereco: string;
  telefone: string;
  email: string;
  instagram?: string | null;
  facebook?: string | null;
  site?: string | null;
  mandato_inicio: string;
  mandato_fim: string;
  presidente_nome: string;
  presidente_nascimento?: string;
  presidente_telefone: string;
  presidente_email: string;
  presidente_endereco?: string | null;
  presidente_instagram?: string | null;
  vice_presidente_nome: string;
  vice_presidente_telefone: string;
  vice_presidente_data_nascimento?: string | null;
  diretor_tecnico_nome?: string | null;
  diretor_tecnico_telefone?: string | null;
  status: string;
  observacoes_internas?: string | null;
}

export interface ConfigPdfFederacao {
  titulo: string;
  subtitulo?: string;
  incluirLogos?: boolean;
  orientacao?: 'retrato' | 'paisagem';
  usuario?: string;
}

interface LogosCarregados {
  governo: LogoCache | null;
  idjuvOficial: LogoCache | null;
}

// ============================================================
// CONSTANTES
// ============================================================

const MARGEM = {
  esquerda: 20,
  direita: 20,
  superior: 15,
  inferior: 20,
};

const LOGO_ALTURA = LOGO_CONFIG_PADRAO.altura; // 14mm

// ============================================================
// UTILITÁRIOS
// ============================================================

/**
 * Verifica se o mandato está expirado
 */
export function isMandatoExpirado(mandatoFim: string): boolean {
  try {
    const data = parseISO(mandatoFim);
    return isValid(data) && isPast(data);
  } catch {
    return false;
  }
}

/**
 * Formata data para exibição
 */
function formatarData(data: string | null | undefined): string {
  if (!data) return '-';
  try {
    const parsed = parseISO(data);
    return isValid(parsed) ? format(parsed, 'dd/MM/yyyy', { locale: ptBR }) : data;
  } catch {
    return data;
  }
}

/**
 * Formata CNPJ para exibição
 */
function formatarCNPJ(cnpj: string | null | undefined): string {
  if (!cnpj) return '-';
  const numeros = cnpj.replace(/\D/g, '');
  if (numeros.length !== 14) return cnpj;
  return `${numeros.slice(0, 2)}.${numeros.slice(2, 5)}.${numeros.slice(5, 8)}/${numeros.slice(8, 12)}-${numeros.slice(12, 14)}`;
}

/**
 * Quebra texto longo em múltiplas linhas
 */
function quebrarTexto(doc: jsPDF, texto: string, larguraMax: number): string[] {
  return doc.splitTextToSize(texto, larguraMax);
}

// ============================================================
// BLOCO 1: CABEÇALHO INSTITUCIONAL
// ============================================================

async function renderizarCabecalho(
  doc: jsPDF,
  config: ConfigPdfFederacao,
  logos: LogosCarregados,
  y: number
): Promise<number> {
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGEM.esquerda - MARGEM.direita;
  
  // Logos - SEMPRE usar a versão OFICIAL (não dark) em fundo branco
  if (config.incluirLogos !== false) {
    // Logo Governo (esquerda)
    if (logos.governo?.data) {
      try {
        const dims = calculateLogoDimensions(logos.governo.width, logos.governo.height, LOGO_ALTURA);
        doc.addImage(logos.governo.data, 'JPEG', MARGEM.esquerda, y, dims.width, dims.height);
      } catch (e) {
        console.warn('Erro ao adicionar logo governo:', e);
      }
    }
    
    // Logo IDJUV OFICIAL (direita) - NÃO usar a versão dark!
    if (logos.idjuvOficial?.data) {
      try {
        const dims = calculateLogoDimensions(logos.idjuvOficial.width, logos.idjuvOficial.height, LOGO_ALTURA);
        doc.addImage(logos.idjuvOficial.data, 'PNG', pageWidth - MARGEM.direita - dims.width, y, dims.width, dims.height);
      } catch (e) {
        console.warn('Erro ao adicionar logo IDJUV:', e);
      }
    }
  }
  
  // Textos institucionais
  doc.setTextColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('GOVERNO DO ESTADO DE RORAIMA', pageWidth / 2, y + 5, { align: 'center' });
  
  doc.setFontSize(9);
  doc.text('INSTITUTO DE DESPORTO, JUVENTUDE E LAZER - IDJUV', pageWidth / 2, y + 10, { align: 'center' });
  
  y += LOGO_ALTURA + 4;
  
  // Linha divisória
  doc.setDrawColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
  doc.setLineWidth(0.5);
  doc.line(MARGEM.esquerda, y, pageWidth - MARGEM.direita, y);
  
  y += 6;
  
  // Título do documento
  doc.setTextColor(CORES.textoEscuro.r, CORES.textoEscuro.g, CORES.textoEscuro.b);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(config.titulo.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  
  y += 6;
  
  // Subtítulo
  if (config.subtitulo) {
    doc.setTextColor(CORES.cinzaMedio.r, CORES.cinzaMedio.g, CORES.cinzaMedio.b);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(config.subtitulo, pageWidth / 2, y, { align: 'center' });
    y += 5;
  }
  
  y += 4;
  
  return y;
}

// ============================================================
// BLOCO 3: RODAPÉ INSTITUCIONAL
// ============================================================

function renderizarRodape(
  doc: jsPDF,
  config: ConfigPdfFederacao,
  paginaAtual: number,
  totalPaginas: number
): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  const rodapeY = pageHeight - 15;
  
  doc.setTextColor(CORES.cinzaClaro.r, CORES.cinzaClaro.g, CORES.cinzaClaro.b);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  
  // Sistema
  doc.text('Sistema IDJuv - Governança Digital', MARGEM.esquerda, rodapeY);
  
  // Data e usuário
  const dataGeracao = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  const infoGeracao = config.usuario 
    ? `Gerado em ${dataGeracao} | Usuário: ${config.usuario}`
    : `Gerado em ${dataGeracao}`;
  doc.text(infoGeracao, pageWidth / 2, rodapeY, { align: 'center' });
  
  // Paginação
  doc.text(`Página ${paginaAtual} de ${totalPaginas}`, pageWidth - MARGEM.direita, rodapeY, { align: 'right' });
  
  // Aviso de documento eletrônico
  doc.setFontSize(6);
  doc.text(
    'Documento gerado eletronicamente pelo Sistema de Governança Digital',
    pageWidth / 2,
    rodapeY + 4,
    { align: 'center' }
  );
}

// ============================================================
// BLOCO 2: DADOS DA FEDERAÇÃO (com quebra de linha)
// ============================================================

function renderizarDadosFederacao(
  doc: jsPDF,
  federacao: FederacaoCompleta,
  y: number
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGEM.esquerda - MARGEM.direita;
  const colWidth = contentWidth / 2;
  
  // === SEÇÃO: DADOS DA FEDERAÇÃO ===
  doc.setFillColor(CORES.secundaria.r, CORES.secundaria.g, CORES.secundaria.b);
  doc.rect(MARGEM.esquerda, y, contentWidth, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('1. DADOS DA FEDERAÇÃO', MARGEM.esquerda + 3, y + 5);
  y += 11;
  
  // Nome completo (com quebra de linha)
  doc.setTextColor(CORES.cinzaMedio.r, CORES.cinzaMedio.g, CORES.cinzaMedio.b);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('NOME', MARGEM.esquerda, y);
  
  doc.setTextColor(CORES.textoEscuro.r, CORES.textoEscuro.g, CORES.textoEscuro.b);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  // Quebrar nome se muito longo
  const linhasNome = quebrarTexto(doc, federacao.nome, contentWidth - 10);
  linhasNome.forEach((linha, idx) => {
    doc.text(linha, MARGEM.esquerda, y + 4 + (idx * 4));
  });
  y += 4 + (linhasNome.length * 4) + 4;
  
  // Sigla e CNPJ (lado a lado)
  const col1X = MARGEM.esquerda;
  const col2X = MARGEM.esquerda + colWidth;
  
  // Sigla
  doc.setTextColor(CORES.cinzaMedio.r, CORES.cinzaMedio.g, CORES.cinzaMedio.b);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('SIGLA', col1X, y);
  doc.setTextColor(CORES.textoEscuro.r, CORES.textoEscuro.g, CORES.textoEscuro.b);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(federacao.sigla, col1X, y + 4);
  
  // CNPJ
  doc.setTextColor(CORES.cinzaMedio.r, CORES.cinzaMedio.g, CORES.cinzaMedio.b);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CNPJ', col2X, y);
  doc.setTextColor(CORES.textoEscuro.r, CORES.textoEscuro.g, CORES.textoEscuro.b);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(formatarCNPJ(federacao.cnpj), col2X, y + 4);
  
  y += 12;
  
  // Data de criação e Status
  doc.setTextColor(CORES.cinzaMedio.r, CORES.cinzaMedio.g, CORES.cinzaMedio.b);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DATA DE FUNDAÇÃO', col1X, y);
  doc.setTextColor(CORES.textoEscuro.r, CORES.textoEscuro.g, CORES.textoEscuro.b);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(formatarData(federacao.data_criacao), col1X, y + 4);
  
  doc.setTextColor(CORES.cinzaMedio.r, CORES.cinzaMedio.g, CORES.cinzaMedio.b);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('STATUS', col2X, y);
  doc.setTextColor(CORES.textoEscuro.r, CORES.textoEscuro.g, CORES.textoEscuro.b);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const statusLabel = {
    em_analise: 'Em Análise',
    ativo: 'Ativa',
    inativo: 'Inativa',
    rejeitado: 'Rejeitada',
  }[federacao.status] || federacao.status;
  doc.text(statusLabel, col2X, y + 4);
  
  y += 12;
  
  // Endereço
  doc.setTextColor(CORES.cinzaMedio.r, CORES.cinzaMedio.g, CORES.cinzaMedio.b);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('ENDEREÇO', col1X, y);
  doc.setTextColor(CORES.textoEscuro.r, CORES.textoEscuro.g, CORES.textoEscuro.b);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const linhasEndereco = quebrarTexto(doc, federacao.endereco, contentWidth - 10);
  linhasEndereco.forEach((linha, idx) => {
    doc.text(linha, col1X, y + 4 + (idx * 4));
  });
  y += 4 + (linhasEndereco.length * 4) + 4;
  
  // Contatos
  doc.setTextColor(CORES.cinzaMedio.r, CORES.cinzaMedio.g, CORES.cinzaMedio.b);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('TELEFONE', col1X, y);
  doc.setTextColor(CORES.textoEscuro.r, CORES.textoEscuro.g, CORES.textoEscuro.b);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(federacao.telefone || '-', col1X, y + 4);
  
  doc.setTextColor(CORES.cinzaMedio.r, CORES.cinzaMedio.g, CORES.cinzaMedio.b);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('E-MAIL', col2X, y);
  doc.setTextColor(CORES.textoEscuro.r, CORES.textoEscuro.g, CORES.textoEscuro.b);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(federacao.email || '-', col2X, y + 4);
  
  y += 14;
  
  return y;
}

// ============================================================
// BLOCO 2: MANDATO (com aviso de expiração)
// ============================================================

function renderizarMandato(
  doc: jsPDF,
  federacao: FederacaoCompleta,
  y: number
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGEM.esquerda - MARGEM.direita;
  const colWidth = contentWidth / 2;
  const col1X = MARGEM.esquerda;
  const col2X = MARGEM.esquerda + colWidth;
  
  const mandatoExpirado = isMandatoExpirado(federacao.mandato_fim);
  
  // === SEÇÃO: MANDATO ===
  doc.setFillColor(CORES.secundaria.r, CORES.secundaria.g, CORES.secundaria.b);
  doc.rect(MARGEM.esquerda, y, contentWidth, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('2. MANDATO ATUAL', MARGEM.esquerda + 3, y + 5);
  y += 11;
  
  // Início e Fim
  doc.setTextColor(CORES.cinzaMedio.r, CORES.cinzaMedio.g, CORES.cinzaMedio.b);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('INÍCIO', col1X, y);
  doc.setTextColor(CORES.textoEscuro.r, CORES.textoEscuro.g, CORES.textoEscuro.b);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(formatarData(federacao.mandato_inicio), col1X, y + 4);
  
  doc.setTextColor(CORES.cinzaMedio.r, CORES.cinzaMedio.g, CORES.cinzaMedio.b);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('FIM', col2X, y);
  
  // Se mandato expirado, mostrar em vermelho
  if (mandatoExpirado) {
    doc.setTextColor(CORES.erro.r, CORES.erro.g, CORES.erro.b);
  } else {
    doc.setTextColor(CORES.textoEscuro.r, CORES.textoEscuro.g, CORES.textoEscuro.b);
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(formatarData(federacao.mandato_fim), col2X, y + 4);
  
  y += 10;
  
  // Aviso de mandato expirado
  if (mandatoExpirado) {
    doc.setFillColor(CORES.erro.r, CORES.erro.g, CORES.erro.b);
    doc.roundedRect(MARGEM.esquerda, y, contentWidth, 8, 1, 1, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('⚠ MANDATO EXPIRADO - Regularização pendente', pageWidth / 2, y + 5.5, { align: 'center' });
    y += 12;
  }
  
  y += 4;
  
  return y;
}

// ============================================================
// BLOCO 2: DIRIGENTES (com quebra de linha para nomes longos)
// ============================================================

function renderizarDirigentes(
  doc: jsPDF,
  federacao: FederacaoCompleta,
  y: number
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - MARGEM.esquerda - MARGEM.direita;
  const colWidth = contentWidth / 2;
  const col1X = MARGEM.esquerda;
  const col2X = MARGEM.esquerda + colWidth;
  
  // === SEÇÃO: DIRIGENTES ===
  doc.setFillColor(CORES.secundaria.r, CORES.secundaria.g, CORES.secundaria.b);
  doc.rect(MARGEM.esquerda, y, contentWidth, 7, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('3. DIRIGENTES', MARGEM.esquerda + 3, y + 5);
  y += 11;
  
  // Presidente
  doc.setTextColor(CORES.cinzaMedio.r, CORES.cinzaMedio.g, CORES.cinzaMedio.b);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('PRESIDENTE', col1X, y);
  y += 4;
  
  doc.setTextColor(CORES.textoEscuro.r, CORES.textoEscuro.g, CORES.textoEscuro.b);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  // Nome do presidente com quebra de linha
  const linhasPresidente = quebrarTexto(doc, federacao.presidente_nome, colWidth - 5);
  linhasPresidente.forEach((linha, idx) => {
    doc.text(linha, col1X, y + (idx * 4));
  });
  y += (linhasPresidente.length * 4) + 2;
  
  doc.setFontSize(8);
  doc.setTextColor(CORES.cinzaMedio.r, CORES.cinzaMedio.g, CORES.cinzaMedio.b);
  doc.text(`Tel: ${federacao.presidente_telefone || '-'}`, col1X, y);
  doc.text(`E-mail: ${federacao.presidente_email || '-'}`, col1X, y + 4);
  y += 12;
  
  // Vice-Presidente
  doc.setTextColor(CORES.cinzaMedio.r, CORES.cinzaMedio.g, CORES.cinzaMedio.b);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('VICE-PRESIDENTE', col1X, y);
  y += 4;
  
  doc.setTextColor(CORES.textoEscuro.r, CORES.textoEscuro.g, CORES.textoEscuro.b);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  const linhasVice = quebrarTexto(doc, federacao.vice_presidente_nome, colWidth - 5);
  linhasVice.forEach((linha, idx) => {
    doc.text(linha, col1X, y + (idx * 4));
  });
  y += (linhasVice.length * 4) + 2;
  
  doc.setFontSize(8);
  doc.setTextColor(CORES.cinzaMedio.r, CORES.cinzaMedio.g, CORES.cinzaMedio.b);
  doc.text(`Tel: ${federacao.vice_presidente_telefone || '-'}`, col1X, y);
  y += 8;
  
  // Diretor Técnico (se houver)
  if (federacao.diretor_tecnico_nome) {
    doc.setTextColor(CORES.cinzaMedio.r, CORES.cinzaMedio.g, CORES.cinzaMedio.b);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('DIRETOR TÉCNICO', col1X, y);
    y += 4;
    
    doc.setTextColor(CORES.textoEscuro.r, CORES.textoEscuro.g, CORES.textoEscuro.b);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    const linhasDiretor = quebrarTexto(doc, federacao.diretor_tecnico_nome, colWidth - 5);
    linhasDiretor.forEach((linha, idx) => {
      doc.text(linha, col1X, y + (idx * 4));
    });
    y += (linhasDiretor.length * 4) + 2;
    
    doc.setFontSize(8);
    doc.setTextColor(CORES.cinzaMedio.r, CORES.cinzaMedio.g, CORES.cinzaMedio.b);
    doc.text(`Tel: ${federacao.diretor_tecnico_telefone || '-'}`, col1X, y);
    y += 8;
  }
  
  y += 4;
  
  return y;
}

// ============================================================
// GERADOR PRINCIPAL: FICHA DA FEDERAÇÃO
// ============================================================

export async function gerarFichaFederacaoPDF(
  federacao: FederacaoCompleta,
  config: ConfigPdfFederacao
): Promise<void> {
  const doc = new jsPDF({
    orientation: config.orientacao === 'paisagem' ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  // Carregar logos - SEMPRE usar a versão OFICIAL
  const logosCarregados = await loadLogos();
  const logos: LogosCarregados = {
    governo: logosCarregados.governo,
    idjuvOficial: logosCarregados.idjuvOficial, // NUNCA usar idjuvDark em fundo branco!
  };
  
  let y = MARGEM.superior;
  
  // BLOCO 1: Cabeçalho
  y = await renderizarCabecalho(doc, config, logos, y);
  
  // BLOCO 2: Dados da Federação
  y = renderizarDadosFederacao(doc, federacao, y);
  
  // BLOCO 2: Mandato
  y = renderizarMandato(doc, federacao, y);
  
  // BLOCO 2: Dirigentes
  y = renderizarDirigentes(doc, federacao, y);
  
  // BLOCO 3: Rodapé
  renderizarRodape(doc, config, 1, 1);
  
  // Salvar
  const nomeArquivo = `ficha-federacao-${federacao.sigla.toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(nomeArquivo);
}

// ============================================================
// GERADOR: RELATÓRIO LISTAGEM DE FEDERAÇÕES
// ============================================================

export async function gerarRelatorioListagemPDF(
  federacoes: FederacaoCompleta[],
  config: ConfigPdfFederacao
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGEM.esquerda - MARGEM.direita;
  
  // Carregar logos - SEMPRE usar a versão OFICIAL
  const logosCarregados = await loadLogos();
  const logos: LogosCarregados = {
    governo: logosCarregados.governo,
    idjuvOficial: logosCarregados.idjuvOficial,
  };
  
  let y = MARGEM.superior;
  let paginaAtual = 1;
  
  // Função para verificar quebra de página
  const checkPageBreak = (alturaNecessaria: number): void => {
    if (y + alturaNecessaria > pageHeight - MARGEM.inferior - 15) {
      renderizarRodape(doc, config, paginaAtual, -1); // Total será atualizado depois
      doc.addPage();
      paginaAtual++;
      y = MARGEM.superior;
      // Repetir cabeçalho em cada página
      renderizarCabecalhoLista();
    }
  };
  
  // Cabeçalho da lista (compacto)
  const renderizarCabecalhoLista = async (): Promise<void> => {
    y = await renderizarCabecalho(doc, { ...config, subtitulo: undefined }, logos, MARGEM.superior);
    
    // Cabeçalho da tabela
    const colunas = [
      { label: 'Sigla', width: 25 },
      { label: 'Nome', width: 80 },
      { label: 'CNPJ', width: 35 },
      { label: 'Presidente', width: 55 },
      { label: 'Mandato', width: 40 },
      { label: 'Status', width: 22 },
    ];
    
    doc.setFillColor(30, 64, 115);
    doc.rect(MARGEM.esquerda, y, contentWidth, 7, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    
    let xPos = MARGEM.esquerda + 2;
    colunas.forEach((col) => {
      doc.text(col.label, xPos, y + 5);
      xPos += col.width;
    });
    
    y += 9;
  };
  
  // Primeiro cabeçalho
  await renderizarCabecalhoLista();
  
  // Linhas de dados
  federacoes.forEach((fed, index) => {
    checkPageBreak(8);
    
    const rowHeight = 7;
    
    // Fundo alternado
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(MARGEM.esquerda, y, contentWidth, rowHeight, 'F');
    }
    
    // Verificar mandato expirado
    const mandatoExpirado = isMandatoExpirado(fed.mandato_fim);
    
    doc.setTextColor(CORES.textoEscuro.r, CORES.textoEscuro.g, CORES.textoEscuro.b);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    
    let xPos = MARGEM.esquerda + 2;
    
    // Sigla
    doc.setFont('helvetica', 'bold');
    doc.text(fed.sigla, xPos, y + 5);
    xPos += 25;
    
    // Nome (truncar se muito longo)
    doc.setFont('helvetica', 'normal');
    const nomeMax = 78;
    const nomeTruncado = fed.nome.length > 45 ? fed.nome.substring(0, 42) + '...' : fed.nome;
    doc.text(nomeTruncado, xPos, y + 5);
    xPos += 80;
    
    // CNPJ
    doc.text(formatarCNPJ(fed.cnpj), xPos, y + 5);
    xPos += 35;
    
    // Presidente (truncar se muito longo)
    const presidenteTruncado = fed.presidente_nome.length > 30 
      ? fed.presidente_nome.substring(0, 27) + '...' 
      : fed.presidente_nome;
    doc.text(presidenteTruncado, xPos, y + 5);
    xPos += 55;
    
    // Mandato
    if (mandatoExpirado) {
      doc.setTextColor(CORES.erro.r, CORES.erro.g, CORES.erro.b);
      doc.setFont('helvetica', 'bold');
    }
    doc.text(`${formatarData(fed.mandato_inicio)} - ${formatarData(fed.mandato_fim)}`, xPos, y + 5);
    if (mandatoExpirado) {
      doc.text('⚠', xPos + 38, y + 5);
    }
    xPos += 40;
    
    // Status
    doc.setTextColor(CORES.textoEscuro.r, CORES.textoEscuro.g, CORES.textoEscuro.b);
    doc.setFont('helvetica', 'normal');
    const statusLabel = {
      em_analise: 'Análise',
      ativo: 'Ativa',
      inativo: 'Inativa',
      rejeitado: 'Rejeitada',
    }[fed.status] || fed.status;
    doc.text(statusLabel, xPos, y + 5);
    
    y += rowHeight;
  });
  
  // Resumo
  y += 5;
  doc.setTextColor(CORES.cinzaMedio.r, CORES.cinzaMedio.g, CORES.cinzaMedio.b);
  doc.setFontSize(8);
  doc.text(`Total: ${federacoes.length} federações`, MARGEM.esquerda, y);
  
  const mandatosExpirados = federacoes.filter(f => isMandatoExpirado(f.mandato_fim)).length;
  if (mandatosExpirados > 0) {
    doc.setTextColor(CORES.erro.r, CORES.erro.g, CORES.erro.b);
    doc.text(`⚠ ${mandatosExpirados} com mandato expirado`, MARGEM.esquerda + 50, y);
  }
  
  // Atualizar rodapés com total de páginas
  const totalPaginas = doc.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    renderizarRodape(doc, config, i, totalPaginas);
  }
  
  // Salvar
  const nomeArquivo = `relatorio-federacoes-${format(new Date(), 'yyyy-MM-dd-HHmm')}.pdf`;
  doc.save(nomeArquivo);
}
