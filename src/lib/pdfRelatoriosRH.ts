/**
 * Geração de Relatórios de RH - IDJUV
 * Utiliza template institucional unificado
 */
import jsPDF from 'jspdf';
import {
  loadLogos,
  generateInstitutionalHeader,
  generateInstitutionalFooter,
  addPageNumbers,
  addSectionTitle,
  addSectionHeader,
  addField,
  addTableHeader,
  addTableRow,
  CORES,
  PAGINA,
  getPageDimensions,
  setColor,
  formatCPF,
  formatDate,
  checkPageBreak,
} from './pdfTemplate';

// ===== Interfaces =====

interface ServidorDiretoriaItem {
  nome: string;
  cpf: string;
  matricula: string | null;
  cargo: string;
  vinculo: string;
  situacao: string;
}

interface GrupoDiretoria {
  unidade_nome: string;
  unidade_sigla: string | null;
  servidores: ServidorDiretoriaItem[];
}

interface RelatorioServidoresDiretoriaData {
  grupos: GrupoDiretoria[];
  totalServidores: number;
  dataGeracao: string;
  filtroUnidade: string | null;
}

interface ServidorVinculoItem {
  nome: string;
  cpf: string;
  matricula: string | null;
  cargo: string;
  unidade: string;
  situacao: string;
}

interface GrupoVinculo {
  vinculo: string;
  servidores: ServidorVinculoItem[];
}

interface RelatorioServidoresVinculoData {
  grupos: GrupoVinculo[];
  totalServidores: number;
  dataGeracao: string;
  filtroVinculo: string | null;
}

interface HistoricoItem {
  data: string;
  tipo: string;
  descricao: string;
  portaria: string | null;
  cargo_anterior?: string;
  cargo_novo?: string;
  unidade_anterior?: string;
  unidade_nova?: string;
}

interface PortariaItem {
  numero: string;
  ano: number;
  tipo: string;
  assunto: string;
  data_publicacao: string;
}

interface FeriasItem {
  periodo_aquisitivo: string;
  data_inicio: string;
  data_fim: string;
  dias: number;
}

interface LicencaItem {
  tipo: string | null;
  data_inicio: string;
  data_fim: string | null;
  dias: number | null;
}

interface RelatorioHistoricoFuncionalData {
  servidor: {
    nome: string;
    cpf: string;
    matricula: string | null;
    cargo: string;
    unidade: string;
    vinculo: string;
    situacao: string;
    data_admissao: string | null;
  };
  historico: HistoricoItem[];
  portarias: PortariaItem[];
  ferias: FeriasItem[];
  licencas: LicencaItem[];
  dataGeracao: string;
}

// ===== Relatório por Diretoria =====

export const generateRelatorioServidoresDiretoria = async (data: RelatorioServidoresDiretoriaData): Promise<void> => {
  const logos = await loadLogos();
  const doc = new jsPDF();
  const { width, height, contentWidth } = getPageDimensions(doc);
  
  const subtitulo = data.filtroUnidade 
    ? `Filtro: ${data.filtroUnidade}` 
    : 'Todas as Unidades Organizacionais';
  
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'RELATÓRIO DE SERVIDORES POR DIRETORIA',
    subtitulo,
    fundoEscuro: true,
  }, logos);
  
  // Info geral
  setColor(doc, CORES.cinzaMedio);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data de geração: ${data.dataGeracao}`, PAGINA.margemEsquerda, y);
  doc.text(`Total de servidores: ${data.totalServidores}`, width - PAGINA.margemDireita - 50, y);
  y += 10;
  
  // Iterar grupos
  data.grupos.forEach((grupo) => {
    y = checkPageBreak(doc, y, 60);
    
    // Header do grupo
    setColor(doc, CORES.cinzaMuitoClaro, 'fill');
    doc.rect(PAGINA.margemEsquerda, y - 5, contentWidth, 8, 'F');
    setColor(doc, CORES.textoEscuro);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const unidadeLabel = grupo.unidade_sigla 
      ? `${grupo.unidade_sigla} - ${grupo.unidade_nome}` 
      : grupo.unidade_nome;
    doc.text(`${unidadeLabel} (${grupo.servidores.length} servidores)`, PAGINA.margemEsquerda + 2, y);
    y += 10;
    
    // Table header
    setColor(doc, CORES.cinzaMedio);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Nome', PAGINA.margemEsquerda + 2, y);
    doc.text('CPF', 85, y);
    doc.text('Cargo', 115, y);
    doc.text('Vínculo', 155, y);
    doc.text('Situação', 178, y);
    y += 2;
    setColor(doc, CORES.cinzaMuitoClaro, 'draw');
    doc.setLineWidth(0.2);
    doc.line(PAGINA.margemEsquerda, y, width - PAGINA.margemDireita, y);
    y += 4;
    
    // Rows
    setColor(doc, CORES.textoEscuro);
    doc.setFont('helvetica', 'normal');
    grupo.servidores.forEach((s) => {
      y = checkPageBreak(doc, y, 30);
      
      doc.text(s.nome.substring(0, 35), PAGINA.margemEsquerda + 2, y);
      doc.text(formatCPF(s.cpf), 85, y);
      doc.text((s.cargo || '-').substring(0, 20), 115, y);
      doc.text((s.vinculo || '-').substring(0, 12), 155, y);
      doc.text((s.situacao || '-').substring(0, 10), 178, y);
      y += 5;
    });
    
    y += 5;
  });
  
  generateInstitutionalFooter(doc, { sistema: 'Sistema de Gestão de RH - IDJUV' });
  addPageNumbers(doc);
  
  doc.save(`Relatorio_Servidores_Diretoria_${data.dataGeracao.replace(/\//g, '-')}.pdf`);
};

// ===== Relatório por Vínculo =====

export const generateRelatorioServidoresVinculo = async (data: RelatorioServidoresVinculoData): Promise<void> => {
  const logos = await loadLogos();
  const doc = new jsPDF();
  const { width, height, contentWidth } = getPageDimensions(doc);
  
  const subtitulo = data.filtroVinculo 
    ? `Filtro: ${data.filtroVinculo}` 
    : 'Todos os Vínculos Funcionais';
  
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'RELATÓRIO DE SERVIDORES POR VÍNCULO FUNCIONAL',
    subtitulo,
    fundoEscuro: true,
  }, logos);
  
  // Info geral
  setColor(doc, CORES.cinzaMedio);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data de geração: ${data.dataGeracao}`, PAGINA.margemEsquerda, y);
  doc.text(`Total de servidores: ${data.totalServidores}`, width - PAGINA.margemDireita - 50, y);
  y += 10;
  
  // Iterar grupos
  data.grupos.forEach((grupo) => {
    y = checkPageBreak(doc, y, 60);
    
    // Header do grupo
    setColor(doc, CORES.cinzaMuitoClaro, 'fill');
    doc.rect(PAGINA.margemEsquerda, y - 5, contentWidth, 8, 'F');
    setColor(doc, CORES.textoEscuro);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${grupo.vinculo} (${grupo.servidores.length} servidores)`, PAGINA.margemEsquerda + 2, y);
    y += 10;
    
    // Table header
    setColor(doc, CORES.cinzaMedio);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Nome', PAGINA.margemEsquerda + 2, y);
    doc.text('CPF', 80, y);
    doc.text('Cargo', 110, y);
    doc.text('Unidade', 150, y);
    doc.text('Situação', 178, y);
    y += 2;
    setColor(doc, CORES.cinzaMuitoClaro, 'draw');
    doc.setLineWidth(0.2);
    doc.line(PAGINA.margemEsquerda, y, width - PAGINA.margemDireita, y);
    y += 4;
    
    // Rows
    setColor(doc, CORES.textoEscuro);
    doc.setFont('helvetica', 'normal');
    grupo.servidores.forEach((s) => {
      y = checkPageBreak(doc, y, 30);
      
      doc.text(s.nome.substring(0, 32), PAGINA.margemEsquerda + 2, y);
      doc.text(formatCPF(s.cpf), 80, y);
      doc.text((s.cargo || '-').substring(0, 20), 110, y);
      doc.text((s.unidade || '-').substring(0, 15), 150, y);
      doc.text((s.situacao || '-').substring(0, 10), 178, y);
      y += 5;
    });
    
    y += 5;
  });
  
  generateInstitutionalFooter(doc, { sistema: 'Sistema de Gestão de RH - IDJUV' });
  addPageNumbers(doc);
  
  doc.save(`Relatorio_Servidores_Vinculo_${data.dataGeracao.replace(/\//g, '-')}.pdf`);
};

// ===== Histórico Funcional Individual =====

export const generateRelatorioHistoricoFuncional = async (data: RelatorioHistoricoFuncionalData): Promise<void> => {
  const logos = await loadLogos();
  const doc = new jsPDF();
  const { width, height, contentWidth } = getPageDimensions(doc);
  
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'RELATÓRIO DE HISTÓRICO FUNCIONAL',
    fundoEscuro: true,
  }, logos);
  
  // Dados do servidor
  y = addSectionHeader(doc, 'DADOS DO SERVIDOR', y);
  
  const col1 = PAGINA.margemEsquerda;
  const col2 = PAGINA.margemEsquerda + contentWidth / 2;
  const colWidth = contentWidth / 2 - 5;
  
  addField(doc, 'Nome', data.servidor.nome, col1, y, contentWidth);
  y += 10;
  
  addField(doc, 'CPF', formatCPF(data.servidor.cpf), col1, y, colWidth);
  addField(doc, 'Matrícula', data.servidor.matricula || '-', col2, y, colWidth);
  y += 10;
  
  addField(doc, 'Cargo', data.servidor.cargo, col1, y, contentWidth);
  y += 10;
  
  addField(doc, 'Unidade', data.servidor.unidade, col1, y, contentWidth);
  y += 10;
  
  addField(doc, 'Vínculo', data.servidor.vinculo, col1, y, colWidth);
  addField(doc, 'Situação', data.servidor.situacao, col2, y, colWidth);
  y += 10;
  
  addField(doc, 'Data Admissão', formatDate(data.servidor.data_admissao), col1, y, colWidth);
  y += 10;
  
  setColor(doc, CORES.cinzaMuitoClaro, 'draw');
  doc.setLineWidth(0.3);
  doc.line(PAGINA.margemEsquerda, y, width - PAGINA.margemDireita, y);
  y += 8;
  
  // Histórico Funcional
  if (data.historico.length > 0) {
    y = addSectionHeader(doc, 'HISTÓRICO FUNCIONAL', y);
    
    setColor(doc, CORES.cinzaMedio);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Data', PAGINA.margemEsquerda + 2, y);
    doc.text('Tipo', 45, y);
    doc.text('Descrição', 85, y);
    doc.text('Portaria', 165, y);
    y += 2;
    setColor(doc, CORES.cinzaMuitoClaro, 'draw');
    doc.line(PAGINA.margemEsquerda, y, width - PAGINA.margemDireita, y);
    y += 4;
    
    setColor(doc, CORES.textoEscuro);
    doc.setFont('helvetica', 'normal');
    data.historico.forEach(h => {
      y = checkPageBreak(doc, y, 30);
      
      doc.text(formatDate(h.data), PAGINA.margemEsquerda + 2, y);
      doc.text((h.tipo || '-').substring(0, 18), 45, y);
      doc.text((h.descricao || '-').substring(0, 45), 85, y);
      doc.text((h.portaria || '-').substring(0, 15), 165, y);
      y += 5;
    });
    y += 5;
  }
  
  // Portarias
  if (data.portarias.length > 0) {
    y = checkPageBreak(doc, y, 60);
    y = addSectionHeader(doc, 'PORTARIAS VINCULADAS', y);
    
    setColor(doc, CORES.cinzaMedio);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Número', PAGINA.margemEsquerda + 2, y);
    doc.text('Tipo', 55, y);
    doc.text('Assunto', 90, y);
    doc.text('Data Publicação', 160, y);
    y += 2;
    setColor(doc, CORES.cinzaMuitoClaro, 'draw');
    doc.line(PAGINA.margemEsquerda, y, width - PAGINA.margemDireita, y);
    y += 4;
    
    setColor(doc, CORES.textoEscuro);
    doc.setFont('helvetica', 'normal');
    data.portarias.forEach(p => {
      y = checkPageBreak(doc, y, 30);
      
      doc.text(`${p.numero}/${p.ano}`, PAGINA.margemEsquerda + 2, y);
      doc.text((p.tipo || '-').substring(0, 15), 55, y);
      doc.text((p.assunto || '-').substring(0, 40), 90, y);
      doc.text(formatDate(p.data_publicacao), 160, y);
      y += 5;
    });
    y += 5;
  }
  
  // Férias
  if (data.ferias.length > 0) {
    y = checkPageBreak(doc, y, 60);
    y = addSectionHeader(doc, 'FÉRIAS REGISTRADAS', y);
    
    setColor(doc, CORES.cinzaMedio);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Período Aquisitivo', PAGINA.margemEsquerda + 2, y);
    doc.text('Início', 90, y);
    doc.text('Fim', 125, y);
    doc.text('Dias', 160, y);
    y += 2;
    setColor(doc, CORES.cinzaMuitoClaro, 'draw');
    doc.line(PAGINA.margemEsquerda, y, width - PAGINA.margemDireita, y);
    y += 4;
    
    setColor(doc, CORES.textoEscuro);
    doc.setFont('helvetica', 'normal');
    data.ferias.forEach(f => {
      y = checkPageBreak(doc, y, 30);
      
      doc.text(f.periodo_aquisitivo || '-', PAGINA.margemEsquerda + 2, y);
      doc.text(formatDate(f.data_inicio), 90, y);
      doc.text(formatDate(f.data_fim), 125, y);
      doc.text(String(f.dias || 0), 160, y);
      y += 5;
    });
    y += 5;
  }
  
  // Licenças
  if (data.licencas.length > 0) {
    y = checkPageBreak(doc, y, 60);
    y = addSectionHeader(doc, 'LICENÇAS E AFASTAMENTOS', y);
    
    setColor(doc, CORES.cinzaMedio);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('Tipo', PAGINA.margemEsquerda + 2, y);
    doc.text('Início', 90, y);
    doc.text('Fim', 125, y);
    doc.text('Dias', 160, y);
    y += 2;
    setColor(doc, CORES.cinzaMuitoClaro, 'draw');
    doc.line(PAGINA.margemEsquerda, y, width - PAGINA.margemDireita, y);
    y += 4;
    
    setColor(doc, CORES.textoEscuro);
    doc.setFont('helvetica', 'normal');
    data.licencas.forEach(l => {
      y = checkPageBreak(doc, y, 30);
      
      doc.text((l.tipo || '-').substring(0, 35), PAGINA.margemEsquerda + 2, y);
      doc.text(formatDate(l.data_inicio), 90, y);
      doc.text(formatDate(l.data_fim), 125, y);
      doc.text(String(l.dias || '-'), 160, y);
      y += 5;
    });
  }
  
  generateInstitutionalFooter(doc, { sistema: 'Sistema de Gestão de RH - IDJUV' });
  addPageNumbers(doc);
  
  const nomeArquivo = data.servidor.nome.replace(/\s+/g, '_').substring(0, 30);
  doc.save(`Historico_Funcional_${nomeArquivo}_${data.dataGeracao.replace(/\//g, '-')}.pdf`);
};
