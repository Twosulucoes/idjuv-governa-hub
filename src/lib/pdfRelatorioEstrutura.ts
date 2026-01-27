/**
 * Gerador de PDF para Relatório de Estrutura Organizacional
 * Colunas: Órgão (Sigla Secretaria), Nome da Unidade, Sigla da Unidade, Sigla Unidade Vinculada, E-mail
 */
import jsPDF from 'jspdf';
import {
  loadLogos,
  generateInstitutionalHeader,
  generateInstitutionalFooter,
  addPageNumbers,
  PAGINA,
  CORES,
  setColor,
  getPageDimensions,
} from './pdfTemplate';

export interface UnidadeEstruturaData {
  id: string;
  nome: string;
  sigla: string | null;
  email: string | null;
  superior_id: string | null;
  tipo: string;
  nivel: number;
  ativo: boolean;
  superior_sigla?: string | null;
  superior_nome?: string | null;
}

export interface ConfigRelatorioEstrutura {
  titulo?: string;
  subtitulo?: string;
  orgaoSigla?: string;
}

/**
 * Gera relatório de estrutura organizacional em PDF
 */
export const generateRelatorioEstruturaPDF = async (
  unidades: UnidadeEstruturaData[],
  config: ConfigRelatorioEstrutura = {}
): Promise<jsPDF> => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const logos = await loadLogos();
  
  const { width, contentWidth } = getPageDimensions(doc);
  
  // Cabeçalho institucional
  let y = await generateInstitutionalHeader(doc, {
    titulo: config.titulo || 'RELATÓRIO DE ESTRUTURA ORGANIZACIONAL',
    subtitulo: config.subtitulo || 'Instituto de Desenvolvimento da Juventude de Roraima - IDJUV',
    fundoEscuro: true,
  }, logos);
  
  // Informações do relatório
  y += 2;
  setColor(doc, CORES.cinzaMedio);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Data de emissão: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, PAGINA.margemEsquerda, y);
  doc.text(`Total de registros: ${unidades.length}`, width - PAGINA.margemDireita, y, { align: 'right' });
  y += 8;
  
  // Linha separadora
  setColor(doc, CORES.cinzaMuitoClaro, 'draw');
  doc.setLineWidth(0.3);
  doc.line(PAGINA.margemEsquerda, y, width - PAGINA.margemDireita, y);
  y += 5;
  
  // Definir colunas
  const colunas = [
    { header: 'ÓRGÃO (SIGLA DA SECRETARIA)', width: 50 },
    { header: 'NOME DA UNIDADE', width: 90 },
    { header: 'SIGLA DA UNIDADE', width: 40 },
    { header: 'SIGLA DA UNIDADE VINCULADA\n(SE HOUVER)', width: 50 },
    { header: 'E-MAIL', width: 47 },
  ];
  
  // Ajustar larguras proporcionalmente
  const totalLargura = colunas.reduce((acc, col) => acc + col.width, 0);
  const fator = contentWidth / totalLargura;
  colunas.forEach(col => {
    col.width = Math.floor(col.width * fator);
  });
  
  // Função para desenhar cabeçalho da tabela
  const desenharCabecalho = (posY: number): number => {
    setColor(doc, CORES.primaria, 'fill');
    doc.rect(PAGINA.margemEsquerda, posY, contentWidth, 10, 'F');
    
    setColor(doc, CORES.textoBranco);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    
    let x = PAGINA.margemEsquerda + 2;
    colunas.forEach(col => {
      const lines = col.header.split('\n');
      if (lines.length > 1) {
        doc.text(lines[0], x, posY + 4);
        doc.text(lines[1], x, posY + 7.5);
      } else {
        doc.text(col.header, x, posY + 6);
      }
      x += col.width;
    });
    
    return posY + 12;
  };
  
  // Cabeçalho da tabela
  y = desenharCabecalho(y);
  
  // Ordenar unidades por nome
  const unidadesOrdenadas = [...unidades].sort((a, b) => 
    a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' })
  );
  
  // Linhas de dados
  unidadesOrdenadas.forEach((unidade, idx) => {
    // Verificar quebra de página
    if (y > doc.internal.pageSize.height - 25) {
      doc.addPage();
      y = 20;
      y = desenharCabecalho(y);
    }
    
    // Fundo alternado
    if (idx % 2 === 1) {
      setColor(doc, CORES.fundoClaro, 'fill');
      doc.rect(PAGINA.margemEsquerda, y - 3, contentWidth, 6, 'F');
    }
    
    // Dados
    setColor(doc, CORES.textoEscuro);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    
    const orgaoSigla = config.orgaoSigla || 'IDJuv';
    
    const valores = [
      orgaoSigla,
      unidade.nome || '-',
      unidade.sigla || '-',
      unidade.superior_sigla || '-',
      unidade.email || '-',
    ];
    
    let x = PAGINA.margemEsquerda + 2;
    valores.forEach((valor, colIdx) => {
      // Truncar se muito longo
      const maxChars = Math.floor(colunas[colIdx].width / 1.8);
      let textoFinal = valor;
      if (valor.length > maxChars) {
        textoFinal = valor.substring(0, maxChars - 2) + '...';
      }
      doc.text(textoFinal, x, y + 2);
      x += colunas[colIdx].width;
    });
    
    y += 6;
  });
  
  // Rodapé e paginação
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    generateInstitutionalFooter(doc, { mostrarData: true });
  }
  addPageNumbers(doc);
  
  return doc;
};
