/**
 * Geração de Relatórios de Frequência - IDJUV
 * Utiliza template institucional unificado
 */
import jsPDF from 'jspdf';
import {
  loadLogos,
  generateInstitutionalHeader,
  generateInstitutionalFooter,
  addPageNumbers,
  addSectionHeader,
  addField,
  CORES,
  PAGINA,
  getPageDimensions,
  setColor,
  formatCPF,
  formatDate,
  checkPageBreak,
} from './pdfTemplate';

interface FrequenciaServidor {
  servidor_id: string;
  servidor_nome: string;
  servidor_matricula?: string;
  servidor_cargo?: string;
  servidor_unidade?: string;
  dias_uteis: number;
  dias_trabalhados: number;
  faltas: number;
  atestados: number;
  ferias: number;
  licencas: number;
  abonos: number;
  percentual_presenca: number;
}

interface RegistroPontoDetalhe {
  data: string;
  dia_semana: string;
  tipo: string;
  entrada1?: string;
  saida1?: string;
  entrada2?: string;
  saida2?: string;
  horas_trabalhadas?: number;
  observacao?: string;
}

interface RelatorioFrequenciaGeralData {
  competencia: string;
  servidores: FrequenciaServidor[];
  dataGeracao: string;
  filtroUnidade?: string;
}

interface RelatorioFrequenciaIndividualData {
  competencia: string;
  servidor: {
    nome: string;
    cpf: string;
    matricula?: string;
    cargo?: string;
    unidade?: string;
  };
  resumo: FrequenciaServidor;
  registros: RegistroPontoDetalhe[];
  dataGeracao: string;
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

/**
 * Gera relatório geral de frequência de todos os servidores
 */
export const generateRelatorioFrequenciaGeral = async (data: RelatorioFrequenciaGeralData): Promise<void> => {
  const logos = await loadLogos();
  const doc = new jsPDF({ orientation: 'landscape' });
  const { width, contentWidth } = getPageDimensions(doc);
  
  const subtitulo = data.filtroUnidade 
    ? `Filtro: ${data.filtroUnidade}` 
    : 'Todas as Unidades';
  
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'RELATÓRIO DE FREQUÊNCIA MENSAL',
    subtitulo: `Competência: ${data.competencia} | ${subtitulo}`,
    fundoEscuro: true,
  }, logos);
  
  // Info geral
  setColor(doc, CORES.cinzaMedio);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data de geração: ${data.dataGeracao}`, PAGINA.margemEsquerda, y);
  doc.text(`Total de servidores: ${data.servidores.length}`, width - PAGINA.margemDireita - 50, y);
  y += 10;
  
  // Header da tabela
  setColor(doc, CORES.primaria, 'fill');
  doc.rect(PAGINA.margemEsquerda, y - 5, contentWidth, 8, 'F');
  
  setColor(doc, { r: 255, g: 255, b: 255 });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  
  let colX = PAGINA.margemEsquerda + 2;
  doc.text('Matrícula', colX, y); colX += 22;
  doc.text('Servidor', colX, y); colX += 60;
  doc.text('Cargo', colX, y); colX += 40;
  doc.text('Dias Úteis', colX, y); colX += 22;
  doc.text('Trabalhados', colX, y); colX += 25;
  doc.text('Faltas', colX, y); colX += 18;
  doc.text('Atestados', colX, y); colX += 22;
  doc.text('Férias', colX, y); colX += 18;
  doc.text('Licenças', colX, y); colX += 22;
  doc.text('% Presença', colX, y);
  y += 8;
  
  // Linhas de dados
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  
  data.servidores.forEach((s, index) => {
    y = checkPageBreak(doc, y, 30);
    
    if (index % 2 === 0) {
      setColor(doc, { r: 250, g: 250, b: 250 }, 'fill');
      doc.rect(PAGINA.margemEsquerda, y - 4, contentWidth, 5.5, 'F');
    }
    
    setColor(doc, CORES.textoEscuro);
    
    colX = PAGINA.margemEsquerda + 2;
    doc.text(s.servidor_matricula || '-', colX, y); colX += 22;
    doc.text(s.servidor_nome.substring(0, 28), colX, y); colX += 60;
    doc.text((s.servidor_cargo || '-').substring(0, 18), colX, y); colX += 40;
    doc.text(String(s.dias_uteis), colX + 8, y, { align: 'center' }); colX += 22;
    doc.text(String(s.dias_trabalhados), colX + 10, y, { align: 'center' }); colX += 25;
    
    // Faltas em vermelho se > 0
    if (s.faltas > 0) {
      setColor(doc, { r: 220, g: 53, b: 69 });
    }
    doc.text(String(s.faltas), colX + 6, y, { align: 'center' }); colX += 18;
    setColor(doc, CORES.textoEscuro);
    
    doc.text(String(s.atestados), colX + 8, y, { align: 'center' }); colX += 22;
    doc.text(String(s.ferias), colX + 6, y, { align: 'center' }); colX += 18;
    doc.text(String(s.licencas), colX + 8, y, { align: 'center' }); colX += 22;
    
    // Percentual colorido
    const pct = s.percentual_presenca;
    if (pct >= 95) {
      setColor(doc, { r: 40, g: 167, b: 69 });
    } else if (pct >= 80) {
      setColor(doc, { r: 255, g: 193, b: 7 });
    } else {
      setColor(doc, { r: 220, g: 53, b: 69 });
    }
    doc.text(`${pct.toFixed(1)}%`, colX + 10, y, { align: 'center' });
    
    y += 5.5;
  });
  
  // Resumo
  y += 8;
  y = checkPageBreak(doc, y, 30);
  
  const totalFaltas = data.servidores.reduce((acc, s) => acc + s.faltas, 0);
  const mediaPresenca = data.servidores.length > 0 
    ? data.servidores.reduce((acc, s) => acc + s.percentual_presenca, 0) / data.servidores.length 
    : 0;
  
  setColor(doc, CORES.cinzaMuitoClaro, 'fill');
  doc.rect(PAGINA.margemEsquerda, y - 5, contentWidth, 12, 'F');
  
  setColor(doc, CORES.textoEscuro);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`RESUMO: ${data.servidores.length} servidores | Total de faltas: ${totalFaltas} | Média de presença: ${mediaPresenca.toFixed(1)}%`, PAGINA.margemEsquerda + 5, y + 2);
  
  generateInstitutionalFooter(doc, { sistema: 'Sistema de Gestão de RH - IDJUV' });
  addPageNumbers(doc);
  
  doc.save(`Relatorio_Frequencia_${data.competencia.replace('/', '-')}.pdf`);
};

/**
 * Gera relatório individual de frequência do servidor
 */
export const generateRelatorioFrequenciaIndividual = async (data: RelatorioFrequenciaIndividualData): Promise<void> => {
  const logos = await loadLogos();
  const doc = new jsPDF();
  const { width, contentWidth } = getPageDimensions(doc);
  
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'FOLHA DE FREQUÊNCIA',
    subtitulo: `Competência: ${data.competencia}`,
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
  
  addField(doc, 'Cargo', data.servidor.cargo || '-', col1, y, colWidth);
  addField(doc, 'Unidade', data.servidor.unidade || '-', col2, y, colWidth);
  y += 12;
  
  // Resumo da frequência
  y = addSectionHeader(doc, 'RESUMO DO MÊS', y);
  
  setColor(doc, CORES.cinzaMuitoClaro, 'fill');
  doc.rect(PAGINA.margemEsquerda, y - 4, contentWidth, 16, 'F');
  
  const boxWidth = contentWidth / 6;
  const resumoY = y + 2;
  
  const drawBox = (label: string, valor: string, x: number, highlight?: string) => {
    setColor(doc, CORES.cinzaMedio);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(label, x + boxWidth / 2, resumoY - 2, { align: 'center' });
    
    if (highlight === 'success') {
      setColor(doc, { r: 40, g: 167, b: 69 });
    } else if (highlight === 'danger') {
      setColor(doc, { r: 220, g: 53, b: 69 });
    } else if (highlight === 'warning') {
      setColor(doc, { r: 255, g: 193, b: 7 });
    } else {
      setColor(doc, CORES.textoEscuro);
    }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(valor, x + boxWidth / 2, resumoY + 6, { align: 'center' });
  };
  
  let boxX = PAGINA.margemEsquerda;
  drawBox('Dias Úteis', String(data.resumo.dias_uteis), boxX); boxX += boxWidth;
  drawBox('Trabalhados', String(data.resumo.dias_trabalhados), boxX, 'success'); boxX += boxWidth;
  drawBox('Faltas', String(data.resumo.faltas), boxX, data.resumo.faltas > 0 ? 'danger' : undefined); boxX += boxWidth;
  drawBox('Atestados', String(data.resumo.atestados), boxX); boxX += boxWidth;
  drawBox('Férias/Lic.', String(data.resumo.ferias + data.resumo.licencas), boxX); boxX += boxWidth;
  drawBox('% Presença', `${data.resumo.percentual_presenca.toFixed(0)}%`, boxX, 
    data.resumo.percentual_presenca >= 95 ? 'success' : data.resumo.percentual_presenca >= 80 ? 'warning' : 'danger');
  
  y += 20;
  
  // Tabela de registros
  y = addSectionHeader(doc, 'REGISTROS DIÁRIOS', y);
  
  // Header
  setColor(doc, CORES.primaria, 'fill');
  doc.rect(PAGINA.margemEsquerda, y - 5, contentWidth, 8, 'F');
  
  setColor(doc, { r: 255, g: 255, b: 255 });
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  
  doc.text('Data', PAGINA.margemEsquerda + 5, y);
  doc.text('Dia', PAGINA.margemEsquerda + 28, y);
  doc.text('Situação', PAGINA.margemEsquerda + 45, y);
  doc.text('Entrada', PAGINA.margemEsquerda + 80, y);
  doc.text('Saída', PAGINA.margemEsquerda + 105, y);
  doc.text('Entrada', PAGINA.margemEsquerda + 125, y);
  doc.text('Saída', PAGINA.margemEsquerda + 150, y);
  doc.text('Observação', PAGINA.margemEsquerda + 170, y);
  y += 8;
  
  // Linhas
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  
  data.registros.forEach((r, index) => {
    y = checkPageBreak(doc, y, 25);
    
    if (index % 2 === 0) {
      setColor(doc, { r: 250, g: 250, b: 250 }, 'fill');
      doc.rect(PAGINA.margemEsquerda, y - 3.5, contentWidth, 5, 'F');
    }
    
    // Cor baseada no tipo
    if (r.tipo === 'falta') {
      setColor(doc, { r: 220, g: 53, b: 69 });
    } else if (r.tipo === 'atestado' || r.tipo === 'licenca') {
      setColor(doc, { r: 255, g: 193, b: 7 });
    } else if (r.tipo === 'ferias') {
      setColor(doc, { r: 23, g: 162, b: 184 });
    } else {
      setColor(doc, CORES.textoEscuro);
    }
    
    doc.text(formatDate(r.data), PAGINA.margemEsquerda + 5, y);
    doc.text(r.dia_semana, PAGINA.margemEsquerda + 28, y);
    doc.text(r.tipo.charAt(0).toUpperCase() + r.tipo.slice(1), PAGINA.margemEsquerda + 45, y);
    doc.text(r.entrada1 || '-', PAGINA.margemEsquerda + 80, y);
    doc.text(r.saida1 || '-', PAGINA.margemEsquerda + 105, y);
    doc.text(r.entrada2 || '-', PAGINA.margemEsquerda + 125, y);
    doc.text(r.saida2 || '-', PAGINA.margemEsquerda + 150, y);
    doc.text((r.observacao || '').substring(0, 15), PAGINA.margemEsquerda + 170, y);
    
    y += 5;
  });
  
  // Área de assinatura
  y = checkPageBreak(doc, y, 40);
  y += 15;
  
  setColor(doc, CORES.cinzaMedio, 'draw');
  doc.setLineWidth(0.3);
  
  const assinaturaWidth = contentWidth / 2 - 20;
  doc.line(PAGINA.margemEsquerda, y, PAGINA.margemEsquerda + assinaturaWidth, y);
  doc.line(col2, y, col2 + assinaturaWidth, y);
  
  y += 4;
  setColor(doc, CORES.textoEscuro);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Assinatura do Servidor', PAGINA.margemEsquerda + assinaturaWidth / 2, y, { align: 'center' });
  doc.text('Assinatura do Chefe Imediato', col2 + assinaturaWidth / 2, y, { align: 'center' });
  
  generateInstitutionalFooter(doc, { sistema: 'Sistema de Gestão de RH - IDJUV' });
  addPageNumbers(doc);
  
  const nomeArquivo = data.servidor.nome.replace(/\s+/g, '_').substring(0, 20);
  doc.save(`Frequencia_${nomeArquivo}_${data.competencia.replace('/', '-')}.pdf`);
};
