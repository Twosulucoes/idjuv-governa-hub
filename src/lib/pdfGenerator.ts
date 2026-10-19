import jsPDF from 'jspdf';

import { getTenantSnapshot, nomeDoSistema } from '@/core/tenant';
import { baixarDocumento, emitirDocumento } from '@/lib/documentos';
import type { DependenteFicha, ServidorFichaCadastral } from '@/lib/documentos/modelos/rh/fichaCadastral';

import { nomeEntidadeSuperiorDocumentos, nomeOficialDocumentos } from './pdfTemplate';

interface DocumentHeader {
  titulo: string;
  numero: string;
  data: string;
  setor: string;
}

interface TermoDemandaData {
  solicitante: string;
  cargo: string;
  setor: string;
  objeto: string;
  justificativa: string;
  quantidade: string;
  valorEstimado: string;
  prazoEntrega: string;
  prioridade: string;
  observacoes: string;
}

interface OrdemMissaoData {
  servidor: string;
  cargo: string;
  matricula: string;
  destino: string;
  objetivo: string;
  dataInicio: string;
  dataFim: string;
  meioTransporte: string;
  diarias: string;
  valorDiarias: string;
  observacoes: string;
}

interface RelatorioViagemData {
  servidor: string;
  cargo: string;
  matricula: string;
  destino: string;
  objetivoOriginal: string;
  dataInicio: string;
  dataFim: string;
  atividadesRealizadas: string;
  resultadosObtidos: string;
  despesasRealizadas: string;
  observacoes: string;
}

interface RequisicaoMaterialData {
  solicitante: string;
  cargo: string;
  setor: string;
  itens: string;
  justificativa: string;
  urgencia: string;
  observacoes: string;
}

interface TermoResponsabilidadeData {
  servidor: string;
  cargo: string;
  matricula: string;
  setor: string;
  bens: string;
  localUtilizacao: string;
  observacoes: string;
}

const generateHeader = (doc: jsPDF, header: DocumentHeader) => {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(nomeEntidadeSuperiorDocumentos(), 105, 15, { align: 'center' });
  doc.text(nomeOficialDocumentos(), 105, 20, { align: 'center' });
  
  doc.setLineWidth(0.5);
  doc.line(20, 25, 190, 25);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(header.titulo, 105, 35, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nº ${header.numero}`, 20, 45);
  doc.text(`Data: ${header.data}`, 150, 45);
  doc.text(`Setor: ${header.setor}`, 20, 52);
  
  doc.line(20, 56, 190, 56);
  
  return 62;
};

const addField = (doc: jsPDF, label: string, value: string, y: number, fullWidth = false): number => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`${label}:`, 20, y);
  
  doc.setFont('helvetica', 'normal');
  
  if (fullWidth) {
    const lines = doc.splitTextToSize(value || '-', 170);
    doc.text(lines, 20, y + 5);
    return y + 5 + (lines.length * 4);
  } else {
    doc.text(value || '-', 60, y);
    return y + 6;
  }
};

const generateFooter = (doc: jsPDF, pageHeight: number) => {
  const y = pageHeight - 40;
  
  doc.setLineWidth(0.3);
  doc.line(30, y, 90, y);
  doc.line(120, y, 180, y);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Assinatura do Solicitante', 60, y + 5, { align: 'center' });
  doc.text('Assinatura da Chefia Imediata', 150, y + 5, { align: 'center' });
  
  doc.setFontSize(7);
  doc.text(`Documento gerado pelo ${nomeDoSistema(getTenantSnapshot())}`, 105, pageHeight - 15, { align: 'center' });
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 105, pageHeight - 10, { align: 'center' });
};

export const generateTermoDemanda = (data: TermoDemandaData, numero: string): void => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  
  const header: DocumentHeader = {
    titulo: 'TERMO DE DEMANDA',
    numero,
    data: new Date().toLocaleDateString('pt-BR'),
    setor: data.setor
  };
  
  let y = generateHeader(doc, header);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. IDENTIFICAÇÃO DO SOLICITANTE', 20, y);
  y += 8;
  
  y = addField(doc, 'Nome', data.solicitante, y);
  y = addField(doc, 'Cargo', data.cargo, y);
  y = addField(doc, 'Setor', data.setor, y);
  
  y += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. DESCRIÇÃO DA DEMANDA', 20, y);
  y += 8;
  
  y = addField(doc, 'Objeto', data.objeto, y, true);
  y += 3;
  y = addField(doc, 'Justificativa', data.justificativa, y, true);
  
  y += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('3. ESPECIFICAÇÕES', 20, y);
  y += 8;
  
  y = addField(doc, 'Quantidade', data.quantidade, y);
  y = addField(doc, 'Valor Estimado', `R$ ${data.valorEstimado}`, y);
  y = addField(doc, 'Prazo de Entrega', data.prazoEntrega, y);
  y = addField(doc, 'Prioridade', data.prioridade, y);
  
  if (data.observacoes) {
    y += 5;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('4. OBSERVAÇÕES', 20, y);
    y += 8;
    y = addField(doc, '', data.observacoes, y - 5, true);
  }
  
  generateFooter(doc, pageHeight);
  
  doc.save(`Termo_Demanda_${numero}.pdf`);
};

export const generateOrdemMissao = (data: OrdemMissaoData, numero: string): void => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  
  const header: DocumentHeader = {
    titulo: 'ORDEM DE MISSÃO',
    numero,
    data: new Date().toLocaleDateString('pt-BR'),
    setor: 'DIRAF'
  };
  
  let y = generateHeader(doc, header);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. IDENTIFICAÇÃO DO SERVIDOR', 20, y);
  y += 8;
  
  y = addField(doc, 'Nome', data.servidor, y);
  y = addField(doc, 'Cargo', data.cargo, y);
  y = addField(doc, 'Matrícula', data.matricula, y);
  
  y += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. DADOS DA MISSÃO', 20, y);
  y += 8;
  
  y = addField(doc, 'Destino', data.destino, y);
  y = addField(doc, 'Objetivo', data.objetivo, y, true);
  y += 3;
  
  y += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('3. PERÍODO E TRANSPORTE', 20, y);
  y += 8;
  
  y = addField(doc, 'Data Início', data.dataInicio, y);
  y = addField(doc, 'Data Fim', data.dataFim, y);
  y = addField(doc, 'Meio de Transporte', data.meioTransporte, y);
  
  y += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('4. DIÁRIAS', 20, y);
  y += 8;
  
  y = addField(doc, 'Quantidade', data.diarias, y);
  y = addField(doc, 'Valor Total', `R$ ${data.valorDiarias}`, y);
  
  if (data.observacoes) {
    y += 5;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('5. OBSERVAÇÕES', 20, y);
    y += 8;
    y = addField(doc, '', data.observacoes, y - 5, true);
  }
  
  y += 10;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Autorizo a realização da missão acima descrita, nos termos da legislação vigente.', 20, y);
  
  generateFooter(doc, pageHeight);
  
  doc.save(`Ordem_Missao_${numero}.pdf`);
};

export const generateRelatorioViagem = (data: RelatorioViagemData, numero: string): void => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  
  const header: DocumentHeader = {
    titulo: 'RELATÓRIO DE VIAGEM',
    numero,
    data: new Date().toLocaleDateString('pt-BR'),
    setor: 'DIRAF'
  };
  
  let y = generateHeader(doc, header);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. IDENTIFICAÇÃO DO SERVIDOR', 20, y);
  y += 8;
  
  y = addField(doc, 'Nome', data.servidor, y);
  y = addField(doc, 'Cargo', data.cargo, y);
  y = addField(doc, 'Matrícula', data.matricula, y);
  
  y += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. DADOS DA VIAGEM', 20, y);
  y += 8;
  
  y = addField(doc, 'Destino', data.destino, y);
  y = addField(doc, 'Período', `${data.dataInicio} a ${data.dataFim}`, y);
  y = addField(doc, 'Objetivo Original', data.objetivoOriginal, y, true);
  
  y += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('3. ATIVIDADES REALIZADAS', 20, y);
  y += 8;
  
  y = addField(doc, '', data.atividadesRealizadas, y - 5, true);
  
  y += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('4. RESULTADOS OBTIDOS', 20, y);
  y += 8;
  
  y = addField(doc, '', data.resultadosObtidos, y - 5, true);
  
  y += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('5. DESPESAS REALIZADAS', 20, y);
  y += 8;
  
  y = addField(doc, '', data.despesasRealizadas, y - 5, true);
  
  if (data.observacoes) {
    y += 5;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('6. OBSERVAÇÕES', 20, y);
    y += 8;
    y = addField(doc, '', data.observacoes, y - 5, true);
  }
  
  y += 10;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Declaro que as informações acima são verdadeiras e estou ciente das responsabilidades', 20, y);
  doc.text('previstas na IN de Diárias do IDJUV.', 20, y + 5);
  
  generateFooter(doc, pageHeight);
  
  doc.save(`Relatorio_Viagem_${numero}.pdf`);
};

export const generateRequisicaoMaterial = (data: RequisicaoMaterialData, numero: string): void => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  
  const header: DocumentHeader = {
    titulo: 'REQUISIÇÃO DE MATERIAL',
    numero,
    data: new Date().toLocaleDateString('pt-BR'),
    setor: data.setor
  };
  
  let y = generateHeader(doc, header);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. IDENTIFICAÇÃO DO SOLICITANTE', 20, y);
  y += 8;
  
  y = addField(doc, 'Nome', data.solicitante, y);
  y = addField(doc, 'Cargo', data.cargo, y);
  y = addField(doc, 'Setor', data.setor, y);
  
  y += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. MATERIAIS SOLICITADOS', 20, y);
  y += 8;
  
  y = addField(doc, '', data.itens, y - 5, true);
  
  y += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('3. JUSTIFICATIVA', 20, y);
  y += 8;
  
  y = addField(doc, '', data.justificativa, y - 5, true);
  
  y += 5;
  y = addField(doc, 'Urgência', data.urgencia, y);
  
  if (data.observacoes) {
    y += 5;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('4. OBSERVAÇÕES', 20, y);
    y += 8;
    y = addField(doc, '', data.observacoes, y - 5, true);
  }
  
  y += 15;
  doc.setLineWidth(0.3);
  doc.line(30, y, 90, y);
  doc.line(120, y, 180, y);
  
  doc.setFontSize(8);
  doc.text('Solicitante', 60, y + 5, { align: 'center' });
  doc.text('Chefia Imediata', 150, y + 5, { align: 'center' });
  
  y += 20;
  doc.line(75, y, 135, y);
  doc.text('Responsável pelo Almoxarifado', 105, y + 5, { align: 'center' });
  
  doc.setFontSize(7);
  doc.text(`Documento gerado pelo ${nomeDoSistema(getTenantSnapshot())}`, 105, pageHeight - 15, { align: 'center' });
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 105, pageHeight - 10, { align: 'center' });
  
  doc.save(`Requisicao_Material_${numero}.pdf`);
};

export const generateTermoResponsabilidade = (data: TermoResponsabilidadeData, numero: string): void => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  
  const header: DocumentHeader = {
    titulo: 'TERMO DE RESPONSABILIDADE PATRIMONIAL',
    numero,
    data: new Date().toLocaleDateString('pt-BR'),
    setor: data.setor
  };
  
  let y = generateHeader(doc, header);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('1. IDENTIFICAÇÃO DO RESPONSÁVEL', 20, y);
  y += 8;
  
  y = addField(doc, 'Nome', data.servidor, y);
  y = addField(doc, 'Cargo', data.cargo, y);
  y = addField(doc, 'Matrícula', data.matricula, y);
  y = addField(doc, 'Setor', data.setor, y);
  
  y += 5;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('2. BENS SOB RESPONSABILIDADE', 20, y);
  y += 8;
  
  y = addField(doc, '', data.bens, y - 5, true);
  
  y += 5;
  y = addField(doc, 'Local de Utilização', data.localUtilizacao, y);
  
  if (data.observacoes) {
    y += 5;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('3. OBSERVAÇÕES', 20, y);
    y += 8;
    y = addField(doc, '', data.observacoes, y - 5, true);
  }
  
  y += 10;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const declaracao = 'Declaro ter recebido os bens acima descritos, comprometendo-me a zelar pela sua guarda, conservação e uso adequado, nos termos da IN de Patrimônio do IDJUV. Estou ciente de que responderei administrativa, civil e penalmente por dano, extravio ou uso indevido.';
  const linhas = doc.splitTextToSize(declaracao, 170);
  doc.text(linhas, 20, y);
  
  generateFooter(doc, pageHeight);
  
  doc.save(`Termo_Responsabilidade_${numero}.pdf`);
};

export const generateDocumentNumber = (prefix: string): string => {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `${prefix}${random}/${year}`;
};

// Interfaces para o Relatório de Cargos
interface CargoReportItem {
  nome: string;
  sigla: string | null;
  categoria: string;
  nivel_hierarquico: number | null;
  quantidade_vagas: number;
  ocupadas: number;
  composicao: {
    unidade_nome: string;
    unidade_sigla: string | null;
    quantidade_vagas: number;
  }[];
}

interface RelatorioCargosData {
  cargos: CargoReportItem[];
  totalCargos: number;
  totalVagas: number;
  totalOcupadas: number;
  totalVacancia: number;
  dataGeracao: string;
}

const CATEGORIA_LABELS_PDF: Record<string, string> = {
  efetivo: 'Efetivo',
  comissionado: 'Comissionado',
  funcao_gratificada: 'Função Gratificada',
  temporario: 'Temporário',
  estagiario: 'Estagiário',
};

export const generateRelatorioCargos = (data: RelatorioCargosData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  // Função para adicionar cabeçalho
  const addHeader = () => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 51, 102);
    doc.text(nomeEntidadeSuperiorDocumentos(), pageWidth / 2, 15, { align: 'center' });
    doc.text(nomeOficialDocumentos(), pageWidth / 2, 20, { align: 'center' });
    
    doc.setLineWidth(0.5);
    doc.setDrawColor(0, 51, 102);
    doc.line(20, 25, pageWidth - 20, 25);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('RELATÓRIO DE CARGOS E VAGAS', pageWidth / 2, 35, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Data de Geração: ${data.dataGeracao}`, pageWidth - 20, 42, { align: 'right' });
    
    doc.line(20, 46, pageWidth - 20, 46);
    
    return 52;
  };
  
  // Função para adicionar rodapé
  const addFooter = (pageNum: number, totalPages: number) => {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Documento gerado pelo ${nomeDoSistema(getTenantSnapshot())}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
    doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  };
  
  let y = addHeader();
  
  // Resumo Geral
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 51, 102);
  doc.text('RESUMO GERAL', 20, y);
  y += 8;
  
  doc.setFillColor(240, 245, 250);
  doc.rect(20, y - 4, pageWidth - 40, 24, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  
  const resumoCol1 = 30;
  const resumoCol2 = 80;
  const resumoCol3 = 130;
  
  doc.text(`Total de Cargos: ${data.totalCargos}`, resumoCol1, y + 4);
  doc.text(`Total de Vagas: ${data.totalVagas}`, resumoCol2, y + 4);
  doc.text(`Vagas Ocupadas: ${data.totalOcupadas}`, resumoCol3, y + 4);
  
  doc.setFont('helvetica', 'bold');
  const vacanciaColor = data.totalVacancia < 0 ? [220, 38, 38] : data.totalVacancia === 0 ? [234, 179, 8] : [34, 197, 94];
  doc.setTextColor(vacanciaColor[0], vacanciaColor[1], vacanciaColor[2]);
  doc.text(`Vacância: ${data.totalVacancia}`, resumoCol1, y + 14);
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  const percentOcupacao = data.totalVagas > 0 ? ((data.totalOcupadas / data.totalVagas) * 100).toFixed(1) : '0';
  doc.text(`Taxa de Ocupação: ${percentOcupacao}%`, resumoCol2, y + 14);
  
  y += 30;
  
  // Por categoria
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 51, 102);
  doc.text('DISTRIBUIÇÃO POR CATEGORIA', 20, y);
  y += 8;
  
  const categorias = ['comissionado', 'efetivo', 'funcao_gratificada', 'temporario', 'estagiario'];
  categorias.forEach((cat) => {
    const cargosCategoria = data.cargos.filter(c => c.categoria === cat);
    const vagasCat = cargosCategoria.reduce((sum, c) => sum + c.quantidade_vagas, 0);
    const ocupadasCat = cargosCategoria.reduce((sum, c) => sum + c.ocupadas, 0);
    
    if (cargosCategoria.length > 0) {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(`${CATEGORIA_LABELS_PDF[cat]}: ${cargosCategoria.length} cargos | ${vagasCat} vagas | ${ocupadasCat} ocupadas | ${vagasCat - ocupadasCat} vacância`, 25, y);
      y += 5;
    }
  });
  
  y += 8;
  
  // Tabela de cargos
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 51, 102);
  doc.text('DETALHAMENTO POR CARGO', 20, y);
  y += 8;
  
  // Cabeçalho da tabela
  doc.setFillColor(0, 51, 102);
  doc.rect(20, y - 4, pageWidth - 40, 8, 'F');
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  
  const colCargo = 22;
  const colCategoria = 75;
  const colNivel = 110;
  const colVagas = 125;
  const colOcup = 142;
  const colVac = 158;
  const colUnidades = 172;
  
  doc.text('CARGO', colCargo, y);
  doc.text('CATEGORIA', colCategoria, y);
  doc.text('NÍVEL', colNivel, y);
  doc.text('VAGAS', colVagas, y);
  doc.text('OCUP.', colOcup, y);
  doc.text('VAC.', colVac, y);
  doc.text('UNID.', colUnidades, y);
  
  y += 6;
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  // Ordenar cargos por nível hierárquico
  const cargosOrdenados = [...data.cargos].sort((a, b) => (a.nivel_hierarquico || 99) - (b.nivel_hierarquico || 99));
  
  let pageNum = 1;
  
  cargosOrdenados.forEach((cargo, index) => {
    // Verificar se precisa de nova página
    if (y > pageHeight - 40) {
      addFooter(pageNum, Math.ceil(data.cargos.length / 20) + 1);
      doc.addPage();
      pageNum++;
      y = addHeader();
      
      // Repetir cabeçalho da tabela
      doc.setFillColor(0, 51, 102);
      doc.rect(20, y - 4, pageWidth - 40, 8, 'F');
      
      doc.setFontSize(7);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 255, 255);
      
      doc.text('CARGO', colCargo, y);
      doc.text('CATEGORIA', colCategoria, y);
      doc.text('NÍVEL', colNivel, y);
      doc.text('VAGAS', colVagas, y);
      doc.text('OCUP.', colOcup, y);
      doc.text('VAC.', colVac, y);
      doc.text('UNID.', colUnidades, y);
      
      y += 6;
      doc.setTextColor(0, 0, 0);
    }
    
    // Linha alternada
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(20, y - 3, pageWidth - 40, 6, 'F');
    }
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    
    // Nome do cargo (truncar se muito longo)
    const nomeExibir = cargo.sigla 
      ? `${cargo.nome.substring(0, 25)}${cargo.nome.length > 25 ? '...' : ''} (${cargo.sigla})`
      : cargo.nome.substring(0, 35) + (cargo.nome.length > 35 ? '...' : '');
    doc.text(nomeExibir, colCargo, y);
    
    // Categoria
    doc.text(CATEGORIA_LABELS_PDF[cargo.categoria] || cargo.categoria, colCategoria, y);
    
    // Nível
    doc.text(cargo.nivel_hierarquico?.toString() || '-', colNivel + 5, y);
    
    // Vagas
    doc.text(cargo.quantidade_vagas.toString(), colVagas + 5, y);
    
    // Ocupadas
    doc.text(cargo.ocupadas.toString(), colOcup + 5, y);
    
    // Vacância
    const vacancia = cargo.quantidade_vagas - cargo.ocupadas;
    if (vacancia < 0) {
      doc.setTextColor(220, 38, 38);
    } else if (vacancia === 0) {
      doc.setTextColor(234, 179, 8);
    } else {
      doc.setTextColor(34, 197, 94);
    }
    doc.text(vacancia.toString(), colVac + 5, y);
    doc.setTextColor(0, 0, 0);
    
    // Unidades
    doc.text(cargo.composicao.length.toString(), colUnidades + 5, y);
    
    y += 6;
    
    // Mostrar detalhes das unidades se houver
    if (cargo.composicao.length > 0 && cargo.composicao.length <= 5) {
      doc.setFontSize(6);
      doc.setTextColor(100, 100, 100);
      const unidadesStr = cargo.composicao
        .map(c => `${c.unidade_sigla || c.unidade_nome.substring(0, 10)}: ${c.quantidade_vagas}`)
        .join(' | ');
      doc.text(`   → ${unidadesStr}`, colCargo, y);
      doc.setTextColor(0, 0, 0);
      y += 4;
    }
  });
  
  // Linha final
  doc.setDrawColor(0, 51, 102);
  doc.line(20, y, pageWidth - 20, y);
  
  // Totalizador
  y += 6;
  doc.setFillColor(0, 51, 102);
  doc.rect(20, y - 4, pageWidth - 40, 8, 'F');
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  
  doc.text('TOTAL', colCargo, y);
  doc.text(`${data.totalCargos} cargos`, colCategoria, y);
  doc.text(data.totalVagas.toString(), colVagas + 5, y);
  doc.text(data.totalOcupadas.toString(), colOcup + 5, y);
  doc.text(data.totalVacancia.toString(), colVac + 5, y);
  
  // Rodapé final
  addFooter(pageNum, pageNum);
  
  doc.save(`Relatorio_Cargos_${new Date().toISOString().split('T')[0]}.pdf`);
};

// Helper function to draw bar chart in PDF
const drawBarChart = (
  doc: jsPDF, 
  data: { label: string; value: number; color: string }[], 
  x: number, 
  y: number, 
  width: number, 
  height: number, 
  title: string
) => {
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 51, 102);
  doc.text(title, x + width / 2, y, { align: 'center' });
  
  const maxValue = Math.max(...data.map(d => d.value));
  const barWidth = (width - 20) / data.length;
  const barMaxHeight = height - 25;
  
  data.forEach((item, index) => {
    const barHeight = (item.value / maxValue) * barMaxHeight;
    const barX = x + 10 + index * barWidth;
    const barY = y + 10 + (barMaxHeight - barHeight);
    
    const [r, g, b] = item.color.match(/\d+/g)?.map(Number) || [59, 130, 246];
    doc.setFillColor(r, g, b);
    doc.rect(barX + 2, barY, barWidth - 4, barHeight, 'F');
    
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.text(item.value.toString(), barX + barWidth / 2, barY - 2, { align: 'center' });
    doc.text(item.label.substring(0, 6), barX + barWidth / 2, y + height - 5, { align: 'center' });
  });
};

// Helper function to draw indicator card in PDF
const drawIndicatorCard = (
  doc: jsPDF, 
  x: number, 
  y: number, 
  width: number, 
  height: number, 
  title: string, 
  value: string, 
  meta: string, 
  color: string
) => {
  const [r, g, b] = color.match(/\d+/g)?.map(Number) || [59, 130, 246];
  
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(x, y, width, height, 2, 2, 'F');
  
  doc.setFillColor(r, g, b);
  doc.rect(x, y, 3, height, 'F');
  
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(title, x + 8, y + 10);
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(r, g, b);
  doc.text(value, x + 8, y + 22);
  
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Meta: ${meta}`, x + 8, y + 29);
};

export const generateRelatorioGovernancaPDF = (): void => {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(0, 51, 102);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('IDJUV - Instituto de Desporto, Juventude e Lazer', 105, 10, { align: 'center' });
  doc.setFontSize(12);
  doc.text('Relatório Anual de Governança e Integridade', 105, 18, { align: 'center' });
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Exercício 2025', 105, 25, { align: 'center' });
  
  // KPIs Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 51, 102);
  doc.text('Indicadores Principais', 15, 38);
  
  drawIndicatorCard(doc, 15, 42, 42, 32, 'Conformidade', '87%', '90%', 'rgb(16, 185, 129)');
  drawIndicatorCard(doc, 62, 42, 42, 32, 'Processos', '24', '30', 'rgb(59, 130, 246)');
  drawIndicatorCard(doc, 109, 42, 42, 32, 'Capacitações', '156', '200', 'rgb(139, 92, 246)');
  drawIndicatorCard(doc, 156, 42, 42, 32, 'Riscos Mitig.', '18', '22', 'rgb(245, 158, 11)');
  
  // Conformity Evolution Chart
  const conformityData = [
    { label: 'Jan', value: 72, color: 'rgb(59, 130, 246)' },
    { label: 'Fev', value: 75, color: 'rgb(59, 130, 246)' },
    { label: 'Mar', value: 78, color: 'rgb(59, 130, 246)' },
    { label: 'Abr', value: 80, color: 'rgb(59, 130, 246)' },
    { label: 'Mai', value: 82, color: 'rgb(59, 130, 246)' },
    { label: 'Jun', value: 85, color: 'rgb(59, 130, 246)' },
    { label: 'Jul', value: 84, color: 'rgb(59, 130, 246)' },
    { label: 'Ago', value: 86, color: 'rgb(59, 130, 246)' },
    { label: 'Set', value: 87, color: 'rgb(59, 130, 246)' },
    { label: 'Out', value: 87, color: 'rgb(59, 130, 246)' },
    { label: 'Nov', value: 88, color: 'rgb(59, 130, 246)' },
    { label: 'Dez', value: 87, color: 'rgb(59, 130, 246)' },
  ];
  
  drawBarChart(doc, conformityData, 15, 85, 85, 55, 'Evolução da Conformidade (%)');
  
  let barX = 25;
  conformityData.forEach((item) => {
    const barHeight = (item.value / 100) * 35;
    doc.setFillColor(59, 130, 246);
    doc.rect(barX, 130 - barHeight, 5, barHeight, 'F');
    barX += 6;
  });
  
  // Processes by Area
  const processesData = [
    { label: 'Compras', value: 8, color: 'rgb(59, 130, 246)' },
    { label: 'RH', value: 5, color: 'rgb(139, 92, 246)' },
    { label: 'Patrim.', value: 4, color: 'rgb(16, 185, 129)' },
    { label: 'Financ.', value: 4, color: 'rgb(245, 158, 11)' },
    { label: 'Almox.', value: 3, color: 'rgb(239, 68, 68)' },
  ];
  
  drawBarChart(doc, processesData, 110, 85, 85, 55, 'Processos por Área');
  
  let procX = 120;
  processesData.forEach((item) => {
    const barHeight = (item.value / 10) * 35;
    const [r, g, b] = item.color.match(/\d+/g)?.map(Number) || [59, 130, 246];
    doc.setFillColor(r, g, b);
    doc.rect(procX, 130 - barHeight, 12, barHeight, 'F');
    doc.setFontSize(6);
    doc.setTextColor(0, 0, 0);
    doc.text(item.label, procX + 6, 137, { align: 'center' });
    procX += 15;
  });
  
  // Risk Matrix
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 51, 102);
  doc.text('Matriz de Riscos', 55, 150, { align: 'center' });
  
  const riscos = [
    { label: 'Baixo', value: 12, color: [16, 185, 129] },
    { label: 'Médio', value: 8, color: [245, 158, 11] },
    { label: 'Alto', value: 4, color: [239, 68, 68] },
    { label: 'Crítico', value: 1, color: [124, 45, 18] },
  ];
  
  let riskY = 155;
  riscos.forEach((risco) => {
    doc.setFillColor(risco.color[0], risco.color[1], risco.color[2]);
    doc.rect(20, riskY, (risco.value / 15) * 60, 8, 'F');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text(`${risco.label}: ${risco.value}`, 85, riskY + 6);
    riskY += 12;
  });
  
  // Action Plan
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 51, 102);
  doc.text('Plano de Ação de Integridade', 155, 150, { align: 'center' });
  
  const acoes = [
    { titulo: 'Treinamento em Ética', status: 'Concluído', cor: [16, 185, 129] },
    { titulo: 'Código de Conduta', status: 'Concluído', cor: [16, 185, 129] },
    { titulo: 'Mapeamento Riscos', status: 'Em Andamento', cor: [245, 158, 11] },
    { titulo: 'Canal Denúncias', status: 'Concluído', cor: [16, 185, 129] },
    { titulo: 'Auditoria Interna', status: 'Em Andamento', cor: [245, 158, 11] },
  ];
  
  let acaoY = 155;
  acoes.forEach((acao) => {
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.text(acao.titulo, 115, acaoY + 5);
    doc.setFillColor(acao.cor[0], acao.cor[1], acao.cor[2]);
    doc.circle(190, acaoY + 3, 2, 'F');
    acaoY += 9;
  });
  
  // Executive Summary
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 51, 102);
  doc.text('Resumo Executivo', 15, 210);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  
  const resumo = [
    'O IDJUV alcançou 87% de conformidade em 2025, superando o resultado de 2024.',
    'Foram mapeados 24 processos administrativos e 156 servidores capacitados.',
    'O Canal de Denúncias está operacional com garantia de anonimato.',
    'A Matriz de Riscos institucional foi aprovada e publicada.',
  ];
  
  let resumoY = 218;
  resumo.forEach((linha) => {
    doc.text('• ' + linha, 20, resumoY);
    resumoY += 6;
  });
  
  // Goals Section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 51, 102);
  doc.text('Metas para 2026', 15, 248);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  
  const metas = [
    'Atingir 95% de conformidade nos processos críticos',
    'Mapear 100% dos processos institucionais (30 processos)',
    'Capacitar 100% dos servidores em integridade',
    'Obter certificação ISO 37001 (Antissuborno)',
  ];
  
  let metaY = 256;
  metas.forEach((meta) => {
    doc.text('• ' + meta, 20, metaY);
    metaY += 6;
  });
  
  // Footer
  doc.setFontSize(7);
  doc.setTextColor(128, 128, 128);
  doc.text(`Documento gerado pelo ${nomeDoSistema(getTenantSnapshot())}`, 105, 285, { align: 'center' });
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 105, 290, { align: 'center' });
  
  doc.save('Relatorio_Governanca_Integridade_2025.pdf');
};

const formatCPFPDF = (cpf: string): string => {
  return cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || '-';
};

// ============================================================
// FICHA CADASTRAL DO SERVIDOR (motor único: modelo `rh-ficha-cadastral`)
// ============================================================

/** Dados vindos do cadastro (linha de `servidores` + cargo/lotação); `dependentes` é o JSON da coluna. */
export type FichaCadastralData = Omit<ServidorFichaCadastral, 'dependentes'> & { dependentes?: unknown };

/** Só itens com nome: o JSON de dependentes é livre e pode vir com lixo de cadastro antigo. */
function dependentesDaFicha(json: unknown): DependenteFicha[] {
  if (!Array.isArray(json)) return [];
  return json
    .filter((d): d is Record<string, unknown> => !!d && typeof d === 'object' && typeof (d as { nome?: unknown }).nome === 'string' && (d as { nome: string }).nome.trim() !== '')
    .map((d) => ({
      nome: String(d.nome),
      data_nascimento: typeof d.data_nascimento === 'string' ? d.data_nascimento : null,
      cpf: typeof d.cpf === 'string' ? d.cpf : null,
      parentesco: typeof d.parentesco === 'string' ? d.parentesco : null,
    }));
}

/** "Cidade/UF" da sede, do perfil da instituição; vazio se não cadastrado (a ficha deixa a linha para preencher). */
function localDaSede(): string | undefined {
  const { cidade, uf } = getTenantSnapshot().endereco ?? {};
  return [cidade, uf].filter(Boolean).join('/') || undefined;
}

export const generateFichaCadastral = async (data: FichaCadastralData): Promise<void> => {
  const servidor: ServidorFichaCadastral = { ...data, dependentes: dependentesDaFicha(data.dependentes) };
  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  baixarDocumento(await emitirDocumento('rh-ficha-cadastral', { servidor, local: localDaSede(), data: hoje }));
};

// ============================================================
// DECLARAÇÃO DE ACUMULAÇÃO DE CARGOS
// ============================================================

interface DeclaracaoAcumulacaoData {
  nome_completo: string;
  cpf: string;
  rg?: string | null;
  rg_orgao_expedidor?: string | null;
  cargo_nome?: string | null;
  unidade_nome?: string | null;
  acumula_cargo: boolean;
  acumulo_descricao?: string | null;
}

export const generateDeclaracaoAcumulacao = (data: DeclaracaoAcumulacaoData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 25;
  const contentWidth = pageWidth - margin * 2;
  
  // Header institucional
  doc.setFillColor(0, 68, 68);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(nomeEntidadeSuperiorDocumentos(), pageWidth / 2, 10, { align: 'center' });
  doc.setFontSize(10);
  doc.text(nomeOficialDocumentos(), pageWidth / 2, 17, { align: 'center' });
  doc.setFontSize(9);
  doc.text('Departamento de Recursos Humanos', pageWidth / 2, 24, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  let y = 50;
  
  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('DECLARAÇÃO DE NÃO ACUMULAÇÃO DE CARGOS', pageWidth / 2, y, { align: 'center' });
  
  y += 20;
  
  // Corpo do documento
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  
  const cpfFormatado = formatCPFPDF(data.cpf);
  const rgInfo = data.rg ? `, portador(a) do RG nº ${data.rg}${data.rg_orgao_expedidor ? ` - ${data.rg_orgao_expedidor}` : ''}` : '';
  
  let texto = '';
  
  if (data.acumula_cargo) {
    texto = `Eu, ${data.nome_completo.toUpperCase()}, inscrito(a) no CPF sob o nº ${cpfFormatado}${rgInfo}, ocupante do cargo de ${data.cargo_nome || '[cargo não informado]'}, lotado(a) no(a) ${data.unidade_nome || 'IDJuv'}, DECLARO, para os devidos fins, que ACUMULO cargo, emprego ou função pública, conforme descrição abaixo:

${data.acumulo_descricao || '[Descrição do acúmulo não informada]'}

Declaro estar ciente de que a acumulação de cargos só é permitida nos casos previstos no Art. 37, inciso XVI, da Constituição Federal de 1988, e que a ocultação de informações ou declaração falsa sujeitará o(a) declarante às penalidades previstas em lei.`;
  } else {
    texto = `Eu, ${data.nome_completo.toUpperCase()}, inscrito(a) no CPF sob o nº ${cpfFormatado}${rgInfo}, ocupante do cargo de ${data.cargo_nome || '[cargo não informado]'}, lotado(a) no(a) ${data.unidade_nome || 'IDJuv'}, DECLARO, para os devidos fins, que NÃO ACUMULO cargo, emprego ou função pública na Administração Pública Federal, Estadual ou Municipal, direta ou indireta, incluindo autarquias, fundações, empresas públicas, sociedades de economia mista e fundações mantidas pelo Poder Público.

Declaro estar ciente de que a acumulação ilícita de cargos, empregos ou funções públicas sujeitará o(a) declarante às penalidades previstas em lei, incluindo a restituição dos valores indevidamente recebidos.`;
  }
  
  const textLines = doc.splitTextToSize(texto, contentWidth);
  doc.text(textLines, margin, y);
  y += textLines.length * 6 + 20;
  
  // Compromisso
  doc.setFont('helvetica', 'normal');
  const compromisso = 'Comprometo-me a comunicar imediatamente ao Departamento de Recursos Humanos do IDJUV qualquer alteração na situação aqui declarada.';
  const compLines = doc.splitTextToSize(compromisso, contentWidth);
  doc.text(compLines, margin, y);
  y += compLines.length * 6 + 10;
  
  // Responsabilidade
  const responsabilidade = 'Declaro estar ciente de que respondo civil, penal e administrativamente pela veracidade das informações aqui prestadas.';
  const respLines = doc.splitTextToSize(responsabilidade, contentWidth);
  doc.text(respLines, margin, y);
  
  // Data e assinatura
  y = pageHeight - 70;
  doc.setFont('helvetica', 'normal');
  doc.text(`Boa Vista/RR, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.`, pageWidth / 2, y, { align: 'center' });
  
  y += 30;
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - 50, y, pageWidth / 2 + 50, y);
  y += 5;
  doc.setFontSize(10);
  doc.text(data.nome_completo.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text(`CPF: ${cpfFormatado}`, pageWidth / 2, y, { align: 'center' });
  
  // Footer
  doc.setFontSize(7);
  doc.setTextColor(128, 128, 128);
  doc.text('Documento gerado pelo Sistema de Recursos Humanos - IDJUV', pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  const nomeArquivo = data.nome_completo.replace(/\s+/g, '_').substring(0, 30);
  doc.save(`Declaracao_Acumulacao_${nomeArquivo}.pdf`);
};

// ============================================================
// DECLARAÇÃO DE BENS E VALORES
// ============================================================

interface DeclaracaoBensData {
  nome_completo: string;
  cpf: string;
  rg?: string | null;
  rg_orgao_expedidor?: string | null;
  cargo_nome?: string | null;
  unidade_nome?: string | null;
  data_admissao?: string | null;
}

export const generateDeclaracaoBens = (data: DeclaracaoBensData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 25;
  const contentWidth = pageWidth - margin * 2;
  
  // Header institucional
  doc.setFillColor(0, 68, 68);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(nomeEntidadeSuperiorDocumentos(), pageWidth / 2, 10, { align: 'center' });
  doc.setFontSize(10);
  doc.text(nomeOficialDocumentos(), pageWidth / 2, 17, { align: 'center' });
  doc.setFontSize(9);
  doc.text('Departamento de Recursos Humanos', pageWidth / 2, 24, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  let y = 50;
  
  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('DECLARAÇÃO DE BENS E VALORES', pageWidth / 2, y, { align: 'center' });
  
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('(Art. 13 da Lei nº 8.429/92 - Lei de Improbidade Administrativa)', pageWidth / 2, y, { align: 'center' });
  
  y += 20;
  
  // Corpo do documento
  doc.setFontSize(11);
  
  const cpfFormatado = formatCPFPDF(data.cpf);
  const rgInfo = data.rg ? `, portador(a) do RG nº ${data.rg}${data.rg_orgao_expedidor ? ` - ${data.rg_orgao_expedidor}` : ''}` : '';
  
  const texto = `Eu, ${data.nome_completo.toUpperCase()}, inscrito(a) no CPF sob o nº ${cpfFormatado}${rgInfo}, ocupante do cargo de ${data.cargo_nome || '[cargo não informado]'}, lotado(a) no(a) ${data.unidade_nome || 'IDJuv'}, DECLARO, sob as penas da lei, que possuo os seguintes bens e valores que integram meu patrimônio:`;
  
  const textLines = doc.splitTextToSize(texto, contentWidth);
  doc.text(textLines, margin, y);
  y += textLines.length * 6 + 15;
  
  // Quadro para preenchimento
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.5);
  
  // Cabeçalho da tabela
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, contentWidth, 8, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DESCRIÇÃO DO BEM/VALOR', margin + 5, y + 5.5);
  doc.text('VALOR (R$)', pageWidth - margin - 30, y + 5.5);
  y += 8;
  
  // Linhas em branco para preenchimento
  for (let i = 0; i < 8; i++) {
    doc.rect(margin, y, contentWidth, 8, 'D');
    y += 8;
  }
  
  // Linha de total
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, contentWidth, 8, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL', margin + 5, y + 5.5);
  doc.text('R$', pageWidth - margin - 30, y + 5.5);
  y += 15;
  
  // Observação
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const obs = '( ) DECLARO não possuir bens e valores a declarar.';
  doc.text(obs, margin, y);
  y += 10;
  
  // Responsabilidade
  doc.setFontSize(10);
  const responsabilidade = 'Declaro estar ciente de que a apresentação de declaração falsa importará em sanções civis, penais e administrativas, nos termos da Lei nº 8.429/92.';
  const respLines = doc.splitTextToSize(responsabilidade, contentWidth);
  doc.text(respLines, margin, y);
  
  // Data e assinatura
  y = pageHeight - 65;
  doc.text(`Boa Vista/RR, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.`, pageWidth / 2, y, { align: 'center' });
  
  y += 25;
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - 50, y, pageWidth / 2 + 50, y);
  y += 5;
  doc.setFontSize(10);
  doc.text(data.nome_completo.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text(`CPF: ${cpfFormatado}`, pageWidth / 2, y, { align: 'center' });
  
  // Footer
  doc.setFontSize(7);
  doc.setTextColor(128, 128, 128);
  doc.text('Documento gerado pelo Sistema de Recursos Humanos - IDJUV', pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  const nomeArquivo = data.nome_completo.replace(/\s+/g, '_').substring(0, 30);
  doc.save(`Declaracao_Bens_${nomeArquivo}.pdf`);
};

// ============================================================
// DECLARAÇÃO DE RESIDÊNCIA
// ============================================================

interface DeclaracaoResidenciaData {
  nome_completo: string;
  cpf: string;
  rg?: string | null;
  rg_orgao_expedidor?: string | null;
  endereco_logradouro?: string | null;
  endereco_numero?: string | null;
  endereco_complemento?: string | null;
  endereco_bairro?: string | null;
  endereco_cidade?: string | null;
  endereco_uf?: string | null;
  endereco_cep?: string | null;
}

export const generateDeclaracaoResidencia = (data: DeclaracaoResidenciaData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 25;
  const contentWidth = pageWidth - margin * 2;
  
  // Header institucional
  doc.setFillColor(0, 68, 68);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(nomeEntidadeSuperiorDocumentos(), pageWidth / 2, 10, { align: 'center' });
  doc.setFontSize(10);
  doc.text(nomeOficialDocumentos(), pageWidth / 2, 17, { align: 'center' });
  doc.setFontSize(9);
  doc.text('Departamento de Recursos Humanos', pageWidth / 2, 24, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  let y = 50;
  
  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('DECLARAÇÃO DE RESIDÊNCIA', pageWidth / 2, y, { align: 'center' });
  
  y += 25;
  
  // Corpo do documento
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  
  const cpfFormatado = formatCPFPDF(data.cpf);
  const rgInfo = data.rg ? `, portador(a) do RG nº ${data.rg}${data.rg_orgao_expedidor ? ` - ${data.rg_orgao_expedidor}` : ''}` : '';
  
  const endereco = data.endereco_logradouro 
    ? `${data.endereco_logradouro}, nº ${data.endereco_numero || 'S/N'}${data.endereco_complemento ? `, ${data.endereco_complemento}` : ''}, Bairro ${data.endereco_bairro || '[não informado]'}, ${data.endereco_cidade || '[cidade não informada]'}/${data.endereco_uf || 'RR'}${data.endereco_cep ? `, CEP: ${data.endereco_cep}` : ''}`
    : '[endereço não informado]';
  
  const texto = `Eu, ${data.nome_completo.toUpperCase()}, inscrito(a) no CPF sob o nº ${cpfFormatado}${rgInfo}, DECLARO, para os devidos fins e sob as penas da lei, que resido no seguinte endereço:

${endereco}

Declaro, ainda, que as informações acima prestadas são verdadeiras e que estou ciente de que a falsidade das informações configura crime previsto no Código Penal Brasileiro, passível de apuração na forma da Lei.`;
  
  const textLines = doc.splitTextToSize(texto, contentWidth);
  doc.text(textLines, margin, y);
  
  // Data e assinatura
  y = pageHeight - 70;
  doc.text(`Boa Vista/RR, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}.`, pageWidth / 2, y, { align: 'center' });
  
  y += 30;
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - 50, y, pageWidth / 2 + 50, y);
  y += 5;
  doc.setFontSize(10);
  doc.text(data.nome_completo.toUpperCase(), pageWidth / 2, y, { align: 'center' });
  y += 5;
  doc.text(`CPF: ${cpfFormatado}`, pageWidth / 2, y, { align: 'center' });
  
  // Footer
  doc.setFontSize(7);
  doc.setTextColor(128, 128, 128);
  doc.text('Documento gerado pelo Sistema de Recursos Humanos - IDJUV', pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  const nomeArquivo = data.nome_completo.replace(/\s+/g, '_').substring(0, 30);
  doc.save(`Declaracao_Residencia_${nomeArquivo}.pdf`);
};

// ============================================================
// FICHA CADASTRAL EM BRANCO: o mesmo modelo, sem servidor (rótulos com linha para preencher)
// ============================================================

export const generateFichaCadastralModelo = async (): Promise<void> => {
  baixarDocumento(await emitirDocumento('rh-ficha-cadastral', { local: localDaSede() }));
};

// ============================================================
// DECLARAÇÃO DE ACUMULAÇÃO EM BRANCO (MODELO)
// ============================================================

export const generateDeclaracaoAcumulacaoModelo = (): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 25;
  const contentWidth = pageWidth - margin * 2;
  
  // Header institucional
  doc.setFillColor(0, 68, 68);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(nomeEntidadeSuperiorDocumentos(), pageWidth / 2, 10, { align: 'center' });
  doc.setFontSize(10);
  doc.text(nomeOficialDocumentos(), pageWidth / 2, 17, { align: 'center' });
  doc.setFontSize(9);
  doc.text('Departamento de Recursos Humanos', pageWidth / 2, 24, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  let y = 50;
  
  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('DECLARAÇÃO DE NÃO ACUMULAÇÃO DE CARGOS', pageWidth / 2, y, { align: 'center' });
  
  y += 25;
  
  // Corpo do documento
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  
  const texto1 = 'Eu, ______________________________________________________________, inscrito(a) no CPF sob o nº ___________________, portador(a) do RG nº ___________________, ocupante do cargo de _____________________________________________, lotado(a) no(a) _____________________________________________, DECLARO, para os devidos fins, que:';
  
  const textLines1 = doc.splitTextToSize(texto1, contentWidth);
  doc.text(textLines1, margin, y);
  y += textLines1.length * 6 + 15;
  
  // Opções
  doc.text('(   ) NÃO ACUMULO cargo, emprego ou função pública na Administração Pública Federal,', margin, y);
  y += 6;
  doc.text('       Estadual ou Municipal, direta ou indireta.', margin, y);
  y += 12;
  
  doc.text('(   ) ACUMULO cargo, emprego ou função pública, conforme descrição abaixo:', margin, y);
  y += 10;
  
  // Linhas para descrição
  doc.setDrawColor(180, 180, 180);
  for (let i = 0; i < 4; i++) {
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;
  }
  
  y += 10;
  
  // Compromisso
  const compromisso = 'Declaro estar ciente de que a acumulação ilícita de cargos, empregos ou funções públicas sujeitará o(a) declarante às penalidades previstas em lei. Comprometo-me a comunicar imediatamente ao Departamento de Recursos Humanos do IDJUV qualquer alteração na situação aqui declarada.';
  const compLines = doc.splitTextToSize(compromisso, contentWidth);
  doc.text(compLines, margin, y);
  
  // Data e assinatura
  y = pageHeight - 70;
  doc.text('Boa Vista/RR, ______ de ____________________ de ________.', pageWidth / 2, y, { align: 'center' });
  
  y += 30;
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - 50, y, pageWidth / 2 + 50, y);
  y += 5;
  doc.setFontSize(10);
  doc.text('Assinatura do Servidor', pageWidth / 2, y, { align: 'center' });
  
  // Footer
  doc.setFontSize(7);
  doc.setTextColor(128, 128, 128);
  doc.text('Modelo de Declaração - IDJUV', pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  doc.save('Modelo_Declaracao_Acumulacao_IDJUV.pdf');
};

// ============================================================
// DECLARAÇÃO DE BENS EM BRANCO (MODELO)
// ============================================================

export const generateDeclaracaoBensModelo = (): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 25;
  const contentWidth = pageWidth - margin * 2;
  
  // Header institucional
  doc.setFillColor(0, 68, 68);
  doc.rect(0, 0, pageWidth, 30, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(nomeEntidadeSuperiorDocumentos(), pageWidth / 2, 10, { align: 'center' });
  doc.setFontSize(10);
  doc.text(nomeOficialDocumentos(), pageWidth / 2, 17, { align: 'center' });
  doc.setFontSize(9);
  doc.text('Departamento de Recursos Humanos', pageWidth / 2, 24, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  let y = 50;
  
  // Título
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('DECLARAÇÃO DE BENS E VALORES', pageWidth / 2, y, { align: 'center' });
  
  y += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('(Art. 13 da Lei nº 8.429/92 - Lei de Improbidade Administrativa)', pageWidth / 2, y, { align: 'center' });
  
  y += 20;
  
  // Corpo do documento
  doc.setFontSize(11);
  
  const texto = 'Eu, ______________________________________________________________, inscrito(a) no CPF sob o nº ___________________, portador(a) do RG nº ___________________, ocupante do cargo de _____________________________________________, lotado(a) no(a) _____________________________________________, DECLARO, sob as penas da lei, que possuo os seguintes bens e valores:';
  
  const textLines = doc.splitTextToSize(texto, contentWidth);
  doc.text(textLines, margin, y);
  y += textLines.length * 6 + 15;
  
  // Quadro para preenchimento
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.5);
  
  // Cabeçalho da tabela
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, contentWidth, 8, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DESCRIÇÃO DO BEM/VALOR', margin + 5, y + 5.5);
  doc.text('VALOR (R$)', pageWidth - margin - 30, y + 5.5);
  y += 8;
  
  // Linhas em branco para preenchimento
  for (let i = 0; i < 10; i++) {
    doc.rect(margin, y, contentWidth, 8, 'D');
    y += 8;
  }
  
  // Linha de total
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, contentWidth, 8, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL', margin + 5, y + 5.5);
  doc.text('R$', pageWidth - margin - 30, y + 5.5);
  y += 15;
  
  // Observação
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('(   ) DECLARO não possuir bens e valores a declarar.', margin, y);
  
  // Data e assinatura
  y = pageHeight - 55;
  doc.setFontSize(11);
  doc.text('Boa Vista/RR, ______ de ____________________ de ________.', pageWidth / 2, y, { align: 'center' });
  
  y += 25;
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - 50, y, pageWidth / 2 + 50, y);
  y += 5;
  doc.setFontSize(10);
  doc.text('Assinatura do Servidor', pageWidth / 2, y, { align: 'center' });
  
  // Footer
  doc.setFontSize(7);
  doc.setTextColor(128, 128, 128);
  doc.text('Modelo de Declaração - IDJUV', pageWidth / 2, pageHeight - 10, { align: 'center' });
  
  doc.save('Modelo_Declaracao_Bens_IDJUV.pdf');
};
