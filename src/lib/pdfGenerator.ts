import jsPDF from 'jspdf';

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
  doc.text('GOVERNO DO ESTADO DE RORAIMA', 105, 15, { align: 'center' });
  doc.text('INSTITUTO DE DESPORTO, JUVENTUDE E LAZER - IDJUV', 105, 20, { align: 'center' });
  
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
  doc.text('Documento gerado pelo Sistema de Governança Digital IDJUV', 105, pageHeight - 15, { align: 'center' });
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
  doc.text('Documento gerado pelo Sistema de Governança Digital IDJUV', 105, pageHeight - 15, { align: 'center' });
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
    doc.text('GOVERNO DO ESTADO DE RORAIMA', pageWidth / 2, 15, { align: 'center' });
    doc.text('INSTITUTO DE DESPORTO, JUVENTUDE E LAZER - IDJUV', pageWidth / 2, 20, { align: 'center' });
    
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
    doc.text('Documento gerado pelo Sistema de Governança Digital IDJUV', pageWidth / 2, pageHeight - 15, { align: 'center' });
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
  doc.text('Documento gerado pelo Sistema de Governança Digital IDJuv', 105, 285, { align: 'center' });
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 105, 290, { align: 'center' });
  
  doc.save('Relatorio_Governanca_Integridade_2025.pdf');
};

// Interface para dados do servidor na ficha cadastral
interface FichaCadastralData {
  // Dados Pessoais
  nome_completo: string;
  nome_social?: string | null;
  cpf: string;
  rg?: string | null;
  rg_orgao_expedidor?: string | null;
  rg_uf?: string | null;
  rg_data_emissao?: string | null;
  data_nascimento?: string | null;
  sexo?: string | null;
  estado_civil?: string | null;
  nacionalidade?: string | null;
  naturalidade_cidade?: string | null;
  naturalidade_uf?: string | null;
  titulo_eleitor?: string | null;
  titulo_zona?: string | null;
  titulo_secao?: string | null;
  pis_pasep?: string | null;
  ctps_numero?: string | null;
  ctps_serie?: string | null;
  ctps_uf?: string | null;
  cnh_numero?: string | null;
  cnh_categoria?: string | null;
  cnh_validade?: string | null;
  certificado_reservista?: string | null;
  
  // Contato
  email_pessoal?: string | null;
  email_institucional?: string | null;
  telefone_fixo?: string | null;
  telefone_celular?: string | null;
  telefone_emergencia?: string | null;
  contato_emergencia_nome?: string | null;
  contato_emergencia_parentesco?: string | null;
  
  // Endereço
  endereco_logradouro?: string | null;
  endereco_numero?: string | null;
  endereco_complemento?: string | null;
  endereco_bairro?: string | null;
  endereco_cidade?: string | null;
  endereco_uf?: string | null;
  endereco_cep?: string | null;
  
  // Dados Funcionais
  matricula?: string | null;
  situacao: string;
  cargo_nome?: string | null;
  cargo_sigla?: string | null;
  unidade_nome?: string | null;
  unidade_sigla?: string | null;
  carga_horaria?: number | null;
  regime_juridico?: string | null;
  data_admissao?: string | null;
  data_desligamento?: string | null;
  
  // Formação
  escolaridade?: string | null;
  formacao_academica?: string | null;
  instituicao_ensino?: string | null;
  ano_conclusao?: number | null;
  cursos_especializacao?: string[] | null;
  
  // Dados Bancários
  banco_codigo?: string | null;
  banco_nome?: string | null;
  banco_agencia?: string | null;
  banco_conta?: string | null;
  banco_tipo_conta?: string | null;
  
  // Remuneração
  remuneracao_bruta?: number | null;
  gratificacoes?: number | null;
  descontos?: number | null;
  
  // Declarações
  acumula_cargo?: boolean | null;
  acumulo_descricao?: string | null;
  declaracao_bens_data?: string | null;
  declaracao_acumulacao_data?: string | null;
  
  // Observações
  observacoes?: string | null;
}

const VINCULO_LABELS_PDF: Record<string, string> = {
  efetivo: 'Efetivo',
  comissionado: 'Comissionado',
  cedido: 'Cedido',
  temporario: 'Temporário',
  estagiario: 'Estagiário',
  requisitado: 'Requisitado',
};

const SITUACAO_LABELS_PDF: Record<string, string> = {
  ativo: 'Ativo',
  afastado: 'Afastado',
  cedido: 'Cedido',
  licenca: 'Em Licença',
  ferias: 'Em Férias',
  exonerado: 'Exonerado',
  aposentado: 'Aposentado',
  falecido: 'Falecido',
};

const formatDatePDF = (date: string | null | undefined): string => {
  if (!date) return '-';
  try {
    const d = new Date(date);
    return d.toLocaleDateString('pt-BR');
  } catch {
    return '-';
  }
};

const formatCPFPDF = (cpf: string): string => {
  return cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || '-';
};

const formatCurrencyPDF = (value: number | null | undefined): string => {
  if (!value && value !== 0) return '-';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const generateFichaCadastral = (data: FichaCadastralData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  
  // Helper para adicionar seção
  const addSection = (title: string, y: number): number => {
    doc.setFillColor(39, 174, 96); // Verde institucional
    doc.rect(margin, y, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(title, margin + 3, y + 5);
    doc.setTextColor(0, 0, 0);
    return y + 10;
  };
  
  // Helper para adicionar campo
  const addFieldRow = (label: string, value: string, x: number, y: number, width: number): void => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(label, x, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(value || '-', width - 5);
    doc.text(lines, x, y + 4);
  };
  
  // Header institucional
  doc.setFillColor(0, 68, 68); // Verde escuro
  doc.rect(0, 0, pageWidth, 25, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('GOVERNO DO ESTADO DE RORAIMA', pageWidth / 2, 8, { align: 'center' });
  doc.setFontSize(10);
  doc.text('INSTITUTO DE DESPORTO, JUVENTUDE E LAZER - IDJUV', pageWidth / 2, 14, { align: 'center' });
  doc.setFontSize(12);
  doc.text('FICHA CADASTRAL DO SERVIDOR', pageWidth / 2, 21, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  let y = 32;
  
  // ============ IDENTIFICAÇÃO ============
  y = addSection('1. IDENTIFICAÇÃO DO SERVIDOR', y);
  
  const col1 = margin;
  const col2 = margin + contentWidth * 0.5;
  const colWidth = contentWidth * 0.48;
  
  addFieldRow('Nome Completo', data.nome_completo, col1, y, contentWidth);
  y += 12;
  
  if (data.nome_social) {
    addFieldRow('Nome Social', data.nome_social, col1, y, contentWidth);
    y += 10;
  }
  
  addFieldRow('CPF', formatCPFPDF(data.cpf), col1, y, colWidth);
  addFieldRow('Matrícula', data.matricula || '-', col2, y, colWidth);
  y += 10;
  
  addFieldRow('RG', data.rg ? `${data.rg} - ${data.rg_orgao_expedidor || ''}/${data.rg_uf || ''}` : '-', col1, y, colWidth);
  addFieldRow('Data de Nascimento', formatDatePDF(data.data_nascimento), col2, y, colWidth);
  y += 10;
  
  addFieldRow('Sexo', data.sexo === 'M' ? 'Masculino' : data.sexo === 'F' ? 'Feminino' : data.sexo || '-', col1, y, colWidth / 2);
  addFieldRow('Estado Civil', data.estado_civil || '-', col1 + colWidth * 0.35, y, colWidth / 2);
  addFieldRow('Nacionalidade', data.nacionalidade || '-', col2, y, colWidth);
  y += 10;
  
  addFieldRow('Naturalidade', data.naturalidade_cidade ? `${data.naturalidade_cidade}/${data.naturalidade_uf}` : '-', col1, y, colWidth);
  y += 12;
  
  // ============ DOCUMENTOS ============
  y = addSection('2. DOCUMENTOS', y);
  
  addFieldRow('Título de Eleitor', data.titulo_eleitor || '-', col1, y, colWidth * 0.6);
  addFieldRow('Zona', data.titulo_zona || '-', col1 + colWidth * 0.45, y, colWidth * 0.2);
  addFieldRow('Seção', data.titulo_secao || '-', col2, y, colWidth * 0.2);
  y += 10;
  
  addFieldRow('PIS/PASEP', data.pis_pasep || '-', col1, y, colWidth);
  addFieldRow('Cert. Reservista', data.certificado_reservista || '-', col2, y, colWidth);
  y += 10;
  
  addFieldRow('CTPS', data.ctps_numero ? `${data.ctps_numero} Série: ${data.ctps_serie || '-'} UF: ${data.ctps_uf || '-'}` : '-', col1, y, contentWidth);
  y += 10;
  
  addFieldRow('CNH', data.cnh_numero ? `${data.cnh_numero} Cat: ${data.cnh_categoria || '-'} Val: ${formatDatePDF(data.cnh_validade)}` : '-', col1, y, contentWidth);
  y += 12;
  
  // ============ ENDEREÇO ============
  y = addSection('3. ENDEREÇO', y);
  
  const endereco = data.endereco_logradouro 
    ? `${data.endereco_logradouro}, ${data.endereco_numero || 'S/N'}${data.endereco_complemento ? ` - ${data.endereco_complemento}` : ''}`
    : '-';
  addFieldRow('Logradouro', endereco, col1, y, contentWidth);
  y += 10;
  
  addFieldRow('Bairro', data.endereco_bairro || '-', col1, y, colWidth * 0.6);
  addFieldRow('Cidade/UF', data.endereco_cidade ? `${data.endereco_cidade}/${data.endereco_uf}` : '-', col2 - 20, y, colWidth * 0.5);
  addFieldRow('CEP', data.endereco_cep || '-', col2 + colWidth * 0.3, y, colWidth * 0.3);
  y += 12;
  
  // ============ CONTATO ============
  y = addSection('4. CONTATO', y);
  
  addFieldRow('Email Pessoal', data.email_pessoal || '-', col1, y, colWidth);
  addFieldRow('Email Institucional', data.email_institucional || '-', col2, y, colWidth);
  y += 10;
  
  addFieldRow('Telefone Fixo', data.telefone_fixo || '-', col1, y, colWidth * 0.5);
  addFieldRow('Celular', data.telefone_celular || '-', col1 + colWidth * 0.4, y, colWidth * 0.5);
  addFieldRow('Emergência', data.telefone_emergencia || '-', col2, y, colWidth);
  y += 10;
  
  if (data.contato_emergencia_nome) {
    addFieldRow('Contato Emergência', `${data.contato_emergencia_nome} (${data.contato_emergencia_parentesco || '-'})`, col1, y, contentWidth);
    y += 10;
  }
  y += 2;
  
  // ============ DADOS FUNCIONAIS ============
  y = addSection('5. DADOS FUNCIONAIS', y);
  
  addFieldRow('Situação', SITUACAO_LABELS_PDF[data.situacao] || data.situacao, col1, y, colWidth * 0.5);
  addFieldRow('Regime Jurídico', data.regime_juridico || '-', col2, y, colWidth);
  y += 10;
  
  addFieldRow('Cargo', data.cargo_nome ? `${data.cargo_nome}${data.cargo_sigla ? ` (${data.cargo_sigla})` : ''}` : '-', col1, y, contentWidth);
  y += 10;
  
  addFieldRow('Lotação', data.unidade_nome ? `${data.unidade_nome}${data.unidade_sigla ? ` (${data.unidade_sigla})` : ''}` : '-', col1, y, contentWidth);
  y += 10;
  
  addFieldRow('Carga Horária', data.carga_horaria ? `${data.carga_horaria}h/semana` : '-', col1, y, colWidth * 0.5);
  addFieldRow('Admissão', formatDatePDF(data.data_admissao), col2, y, colWidth * 0.5);
  y += 12;
  
  // ============ PÁGINA 2 ============
  doc.addPage();
  y = 15;
  
  // Header página 2
  doc.setFillColor(0, 68, 68);
  doc.rect(0, 0, pageWidth, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`FICHA CADASTRAL - ${data.nome_completo}`, pageWidth / 2, 8, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y = 20;
  
  // ============ FORMAÇÃO ACADÊMICA ============
  y = addSection('6. FORMAÇÃO ACADÊMICA', y);
  
  addFieldRow('Escolaridade', data.escolaridade || '-', col1, y, colWidth);
  addFieldRow('Ano Conclusão', data.ano_conclusao?.toString() || '-', col2, y, colWidth);
  y += 10;
  
  addFieldRow('Formação', data.formacao_academica || '-', col1, y, contentWidth);
  y += 10;
  
  addFieldRow('Instituição', data.instituicao_ensino || '-', col1, y, contentWidth);
  y += 10;
  
  if (data.cursos_especializacao && data.cursos_especializacao.length > 0) {
    addFieldRow('Cursos/Especializações', data.cursos_especializacao.join('; '), col1, y, contentWidth);
    y += 10;
  }
  y += 2;
  
  // ============ DADOS BANCÁRIOS ============
  y = addSection('7. DADOS BANCÁRIOS', y);
  
  addFieldRow('Banco', data.banco_nome ? `${data.banco_codigo ? `(${data.banco_codigo}) ` : ''}${data.banco_nome}` : '-', col1, y, colWidth);
  addFieldRow('Agência', data.banco_agencia || '-', col2, y, colWidth * 0.4);
  y += 10;
  
  addFieldRow('Conta', data.banco_conta || '-', col1, y, colWidth * 0.5);
  addFieldRow('Tipo', data.banco_tipo_conta || '-', col1 + colWidth * 0.4, y, colWidth * 0.5);
  y += 12;
  
  // ============ REMUNERAÇÃO ============
  y = addSection('8. REMUNERAÇÃO', y);
  
  addFieldRow('Remuneração Bruta', formatCurrencyPDF(data.remuneracao_bruta), col1, y, colWidth * 0.4);
  addFieldRow('Gratificações', formatCurrencyPDF(data.gratificacoes), col1 + colWidth * 0.35, y, colWidth * 0.4);
  addFieldRow('Descontos', formatCurrencyPDF(data.descontos), col2, y, colWidth * 0.4);
  
  const liquido = (data.remuneracao_bruta || 0) + (data.gratificacoes || 0) - (data.descontos || 0);
  addFieldRow('Líquido', formatCurrencyPDF(liquido > 0 ? liquido : null), col2 + colWidth * 0.35, y, colWidth * 0.4);
  y += 12;
  
  // ============ DECLARAÇÕES ============
  y = addSection('9. DECLARAÇÕES', y);
  
  addFieldRow('Acumula Cargo?', data.acumula_cargo ? 'SIM' : 'NÃO', col1, y, colWidth * 0.3);
  if (data.acumula_cargo && data.acumulo_descricao) {
    addFieldRow('Descrição Acúmulo', data.acumulo_descricao, col1 + colWidth * 0.25, y, colWidth * 0.75 + colWidth);
  }
  y += 10;
  
  addFieldRow('Declaração de Bens', data.declaracao_bens_data ? `Entregue em ${formatDatePDF(data.declaracao_bens_data)}` : 'Não entregue', col1, y, colWidth);
  addFieldRow('Declaração de Acumulação', data.declaracao_acumulacao_data ? `Entregue em ${formatDatePDF(data.declaracao_acumulacao_data)}` : 'Não entregue', col2, y, colWidth);
  y += 12;
  
  // ============ OBSERVAÇÕES ============
  if (data.observacoes) {
    y = addSection('10. OBSERVAÇÕES', y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const obsLines = doc.splitTextToSize(data.observacoes, contentWidth - 5);
    doc.text(obsLines, col1, y + 2);
    y += obsLines.length * 4 + 10;
  }
  
  // ============ ASSINATURAS ============
  y = Math.max(y + 15, pageHeight - 60);
  
  doc.setLineWidth(0.3);
  doc.line(margin + 10, y, margin + 75, y);
  doc.line(pageWidth - margin - 75, y, pageWidth - margin - 10, y);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Assinatura do Servidor', margin + 42.5, y + 5, { align: 'center' });
  doc.text('Responsável RH', pageWidth - margin - 42.5, y + 5, { align: 'center' });
  
  // Data
  y += 15;
  doc.text(`Boa Vista/RR, ${new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageWidth / 2, y, { align: 'center' });
  
  // Footer
  doc.setFontSize(7);
  doc.setTextColor(128, 128, 128);
  doc.text('Documento gerado pelo Sistema de Recursos Humanos - IDJUV', pageWidth / 2, pageHeight - 10, { align: 'center' });
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, pageHeight - 6, { align: 'center' });
  
// Salvar
  const nomeArquivo = data.nome_completo.replace(/\s+/g, '_').substring(0, 30);
  doc.save(`Ficha_Cadastral_${nomeArquivo}.pdf`);
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
  doc.text('GOVERNO DO ESTADO DE RORAIMA', pageWidth / 2, 10, { align: 'center' });
  doc.setFontSize(10);
  doc.text('INSTITUTO DE DESPORTO, JUVENTUDE E LAZER - IDJUV', pageWidth / 2, 17, { align: 'center' });
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
  doc.text('GOVERNO DO ESTADO DE RORAIMA', pageWidth / 2, 10, { align: 'center' });
  doc.setFontSize(10);
  doc.text('INSTITUTO DE DESPORTO, JUVENTUDE E LAZER - IDJUV', pageWidth / 2, 17, { align: 'center' });
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
  doc.text('GOVERNO DO ESTADO DE RORAIMA', pageWidth / 2, 10, { align: 'center' });
  doc.setFontSize(10);
  doc.text('INSTITUTO DE DESPORTO, JUVENTUDE E LAZER - IDJUV', pageWidth / 2, 17, { align: 'center' });
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
// LOGOS DO SISTEMA (Base64) - Altere aqui para mudar em todos os documentos
// ============================================================

// Logo placeholder - será substituído pela logo real carregada dinamicamente
let cachedLogoGoverno: string | null = null;
let cachedLogoIDJUV: string | null = null;

const loadImageAsBase64 = async (src: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Could not get canvas context'));
      }
    };
    img.onerror = reject;
    img.src = src;
  });
};

// Importar logos do sistema
import logoGovernoSrc from '@/assets/logo-governo-roraima.jpg';
import logoIDJUVOficialSrc from '@/assets/logo-idjuv-oficial.png';
import logoIDJUVDarkSrc from '@/assets/logo-idjuv-dark4.png';

const loadLogos = async () => {
  if (!cachedLogoGoverno) {
    try {
      cachedLogoGoverno = await loadImageAsBase64(logoGovernoSrc);
    } catch (e) {
      console.warn('Não foi possível carregar logo do governo');
    }
  }
  if (!cachedLogoIDJUV) {
    try {
      // Para fundo claro, usa logo oficial
      cachedLogoIDJUV = await loadImageAsBase64(logoIDJUVOficialSrc);
    } catch (e) {
      console.warn('Não foi possível carregar logo do IDJUV');
    }
  }
};

// Cache separado para logo dark (fundo escuro)
let cachedLogoIDJUVDark: string | null = null;

const loadLogoDark = async () => {
  if (!cachedLogoIDJUVDark) {
    try {
      cachedLogoIDJUVDark = await loadImageAsBase64(logoIDJUVDarkSrc);
    } catch (e) {
      console.warn('Não foi possível carregar logo dark do IDJUV');
    }
  }
};

// ============================================================
// FICHA CADASTRAL EM BRANCO (MODELO INSTITUCIONAL PROFISSIONAL)
// ============================================================

export const generateFichaCadastralModelo = async (): Promise<void> => {
  await loadLogos();
  await loadLogoDark(); // Carregar versão dark para cabeçalho escuro
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  
  // Cores institucionais
  const primaryColor = { r: 0, g: 85, b: 75 }; // Verde institucional escuro
  const secondaryColor = { r: 0, g: 110, b: 95 }; // Verde institucional médio
  const accentColor = { r: 245, g: 245, b: 245 }; // Cinza claro para fundos
  const borderColor = { r: 180, g: 180, b: 180 };
  const textDark = { r: 40, g: 40, b: 40 };
  const textMuted = { r: 100, g: 100, b: 100 };
  
  // Helper: Seção com número e título
  const addSectionHeader = (num: string, title: string, y: number): number => {
    // Linha decorativa superior
    doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + contentWidth, y);
    
    // Badge com número
    doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.roundedRect(margin, y + 1, 8, 5, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(num, margin + 4, y + 4.5, { align: 'center' });
    
    // Título da seção
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.text(title.toUpperCase(), margin + 11, y + 4.8);
    
    doc.setTextColor(textDark.r, textDark.g, textDark.b);
    return y + 8;
  };
  
  // Helper: Campo com label e linha
  const addField = (label: string, x: number, y: number, width: number, height: number = 6): void => {
    // Background do campo
    doc.setFillColor(accentColor.r, accentColor.g, accentColor.b);
    doc.rect(x, y, width, height, 'F');
    
    // Borda do campo
    doc.setDrawColor(borderColor.r, borderColor.g, borderColor.b);
    doc.setLineWidth(0.2);
    doc.rect(x, y, width, height, 'D');
    
    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.5);
    doc.setTextColor(textMuted.r, textMuted.g, textMuted.b);
    doc.text(label, x + 1.5, y + 2.5);
    
    // Linha para preenchimento
    doc.setDrawColor(borderColor.r - 30, borderColor.g - 30, borderColor.b - 30);
    doc.setLineWidth(0.1);
    doc.line(x + 1.5, y + height - 1.5, x + width - 1.5, y + height - 1.5);
  };
  
  // Helper: Campo com checkbox
  const addCheckField = (label: string, x: number, y: number): number => {
    doc.setDrawColor(borderColor.r, borderColor.g, borderColor.b);
    doc.setLineWidth(0.3);
    doc.rect(x, y, 3, 3, 'D');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(textDark.r, textDark.g, textDark.b);
    doc.text(label, x + 4.5, y + 2.5);
    return doc.getTextWidth(label) + 8;
  };
  
  // ============ CABEÇALHO INSTITUCIONAL ============
  const headerHeight = 24;
  
  // Fundo do cabeçalho (gradiente simulado com duas barras)
  doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');
  doc.setFillColor(secondaryColor.r, secondaryColor.g, secondaryColor.b);
  doc.rect(0, headerHeight - 3, pageWidth, 3, 'F');
  
  // Logo Governo (esquerda) - fundo escuro, usa logo clara
  if (cachedLogoGoverno) {
    try {
      doc.addImage(cachedLogoGoverno, 'JPEG', margin, 3, 32, 17);
    } catch (e) { /* silently fail */ }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text('GOVERNO DE', margin + 2, 10);
    doc.text('RORAIMA', margin + 2, 15);
  }
  
  // Título central
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('FICHA CADASTRAL', pageWidth / 2, 10, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(220, 220, 220);
  doc.text('Instituto de Desporto, Juventude e Lazer de Roraima - IDJuv-RR', pageWidth / 2, 16, { align: 'center' });
  
  // Logo IDJUV (direita) - fundo escuro, usa versão dark
  if (cachedLogoIDJUVDark) {
    try {
      doc.addImage(cachedLogoIDJUVDark, 'PNG', pageWidth - margin - 32, 3, 32, 17);
    } catch (e) { /* silently fail */ }
  } else if (cachedLogoIDJUV) {
    // Fallback para logo oficial se dark não disponível
    try {
      doc.addImage(cachedLogoIDJUV, 'PNG', pageWidth - margin - 32, 3, 32, 17);
    } catch (e) { /* silently fail */ }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text('IDJuv-RR', pageWidth - margin - 16, 12, { align: 'center' });
  }
  
  doc.setTextColor(textDark.r, textDark.g, textDark.b);
  let y = headerHeight + 4;
  
  // Definição de colunas
  const col1 = margin;
  const gap = 2;
  const fieldHeight = 7;
  const smallFieldHeight = 6;
  
  // ============ SEÇÃO 1: IDENTIFICAÇÃO ============
  y = addSectionHeader('1', 'Identificação do Servidor', y);
  
  // Linha 1: Nome Completo
  addField('Nome Completo', col1, y, contentWidth, fieldHeight);
  y += fieldHeight + 1;
  
  // Linha 2: Nome Social
  addField('Nome Social (se houver)', col1, y, contentWidth, smallFieldHeight);
  y += smallFieldHeight + 1;
  
  // Linha 3: CPF, Matrícula, Data Nascimento
  const w3 = (contentWidth - gap * 2) / 3;
  addField('CPF', col1, y, w3, smallFieldHeight);
  addField('Matrícula', col1 + w3 + gap, y, w3, smallFieldHeight);
  addField('Data de Nascimento', col1 + w3 * 2 + gap * 2, y, w3, smallFieldHeight);
  y += smallFieldHeight + 1;
  
  // Linha 4: RG, Órgão, UF, Sexo, Estado Civil
  const w5 = (contentWidth - gap * 4) / 5;
  addField('RG', col1, y, w5, smallFieldHeight);
  addField('Órgão Exp.', col1 + w5 + gap, y, w5 * 0.7, smallFieldHeight);
  addField('UF', col1 + w5 * 1.7 + gap * 2, y, w5 * 0.5, smallFieldHeight);
  addField('Sexo', col1 + w5 * 2.2 + gap * 3, y, w5 * 0.8, smallFieldHeight);
  addField('Estado Civil', col1 + w5 * 3 + gap * 4, y, w5 * 1.2, smallFieldHeight);
  addField('Nacionalidade', col1 + w5 * 4.2 + gap * 4, y, contentWidth - w5 * 4.2 - gap * 4, smallFieldHeight);
  y += smallFieldHeight + 1;
  
  // Linha 5: Naturalidade, PIS/PASEP
  const w2 = (contentWidth - gap) / 2;
  addField('Naturalidade (Cidade/UF)', col1, y, w2, smallFieldHeight);
  addField('PIS/PASEP', col1 + w2 + gap, y, w2, smallFieldHeight);
  y += smallFieldHeight + 3;
  
  // ============ SEÇÃO 2: DOCUMENTOS ============
  y = addSectionHeader('2', 'Documentos', y);
  
  // Linha 1: Título Eleitor, Zona, Seção, Cert. Reservista
  const w4 = (contentWidth - gap * 3) / 4;
  addField('Título de Eleitor', col1, y, w4, smallFieldHeight);
  addField('Zona', col1 + w4 + gap, y, w4 * 0.6, smallFieldHeight);
  addField('Seção', col1 + w4 * 1.6 + gap * 2, y, w4 * 0.6, smallFieldHeight);
  addField('Certificado de Reservista', col1 + w4 * 2.2 + gap * 3, y, contentWidth - w4 * 2.2 - gap * 3, smallFieldHeight);
  y += smallFieldHeight + 1;
  
  // Linha 2: CTPS e CNH
  addField('CTPS (Número / Série / UF)', col1, y, w2, smallFieldHeight);
  addField('CNH (Número / Categoria / Validade)', col1 + w2 + gap, y, w2, smallFieldHeight);
  y += smallFieldHeight + 3;
  
  // ============ SEÇÃO 3: ENDEREÇO ============
  y = addSectionHeader('3', 'Endereço', y);
  
  // Linha 1: Logradouro, Nº, Complemento
  addField('Logradouro', col1, y, contentWidth * 0.55, smallFieldHeight);
  addField('Nº', col1 + contentWidth * 0.55 + gap, y, contentWidth * 0.1, smallFieldHeight);
  addField('Complemento', col1 + contentWidth * 0.65 + gap * 2, y, contentWidth * 0.35 - gap * 2, smallFieldHeight);
  y += smallFieldHeight + 1;
  
  // Linha 2: Bairro, Cidade, UF, CEP
  addField('Bairro', col1, y, w3, smallFieldHeight);
  addField('Cidade', col1 + w3 + gap, y, w3, smallFieldHeight);
  addField('UF', col1 + w3 * 2 + gap * 2, y, w3 * 0.3, smallFieldHeight);
  addField('CEP', col1 + w3 * 2.3 + gap * 3, y, w3 * 0.7 - gap, smallFieldHeight);
  y += smallFieldHeight + 3;
  
  // ============ SEÇÃO 4: CONTATO ============
  y = addSectionHeader('4', 'Contato', y);
  
  // Linha 1: Emails
  addField('E-mail Pessoal', col1, y, w2, smallFieldHeight);
  addField('E-mail Institucional', col1 + w2 + gap, y, w2, smallFieldHeight);
  y += smallFieldHeight + 1;
  
  // Linha 2: Telefones
  addField('Telefone Fixo', col1, y, w3, smallFieldHeight);
  addField('Celular', col1 + w3 + gap, y, w3, smallFieldHeight);
  addField('Tel. Emergência', col1 + w3 * 2 + gap * 2, y, w3, smallFieldHeight);
  y += smallFieldHeight + 1;
  
  // Linha 3: Contato de emergência
  addField('Contato de Emergência (Nome e Parentesco)', col1, y, contentWidth, smallFieldHeight);
  y += smallFieldHeight + 3;
  
  // ============ SEÇÃO 5: DADOS FUNCIONAIS ============
  y = addSectionHeader('5', 'Dados Funcionais', y);
  
  // Linha 1: Vínculo, Situação, Regime
  addField('Vínculo', col1, y, w3, smallFieldHeight);
  addField('Situação Funcional', col1 + w3 + gap, y, w3, smallFieldHeight);
  addField('Regime Jurídico', col1 + w3 * 2 + gap * 2, y, w3, smallFieldHeight);
  y += smallFieldHeight + 1;
  
  // Linha 2: Cargo, Carga Horária
  addField('Cargo/Função', col1, y, contentWidth * 0.7, smallFieldHeight);
  addField('Carga Horária', col1 + contentWidth * 0.7 + gap, y, contentWidth * 0.3 - gap, smallFieldHeight);
  y += smallFieldHeight + 1;
  
  // Linha 3: Lotação
  addField('Lotação / Unidade de Trabalho', col1, y, contentWidth, smallFieldHeight);
  y += smallFieldHeight + 1;
  
  // Linha 4: Datas
  addField('Data Admissão', col1, y, w3, smallFieldHeight);
  addField('Data Posse', col1 + w3 + gap, y, w3, smallFieldHeight);
  addField('Data Exercício', col1 + w3 * 2 + gap * 2, y, w3, smallFieldHeight);
  y += smallFieldHeight + 3;
  
  // ============ SEÇÃO 6: FORMAÇÃO ACADÊMICA ============
  y = addSectionHeader('6', 'Formação Acadêmica', y);
  
  // Linha 1
  addField('Escolaridade', col1, y, w3, smallFieldHeight);
  addField('Formação / Curso', col1 + w3 + gap, y, w3 * 1.3, smallFieldHeight);
  addField('Ano Conclusão', col1 + w3 * 2.3 + gap * 2, y, w3 * 0.7, smallFieldHeight);
  y += smallFieldHeight + 1;
  
  // Linha 2
  addField('Instituição de Ensino', col1, y, w2, smallFieldHeight);
  addField('Especializações / Cursos Complementares', col1 + w2 + gap, y, w2, smallFieldHeight);
  y += smallFieldHeight + 3;
  
  // ============ SEÇÃO 7: DADOS BANCÁRIOS ============
  y = addSectionHeader('7', 'Dados Bancários', y);
  
  addField('Banco (Código e Nome)', col1, y, w3, smallFieldHeight);
  addField('Agência', col1 + w3 + gap, y, w3, smallFieldHeight);
  addField('Conta / Tipo', col1 + w3 * 2 + gap * 2, y, w3, smallFieldHeight);
  y += smallFieldHeight + 3;
  
  // ============ SEÇÃO 8: DECLARAÇÕES ============
  y = addSectionHeader('8', 'Declarações', y);
  
  // Box de declaração
  doc.setFillColor(255, 253, 240);
  doc.setDrawColor(borderColor.r, borderColor.g, borderColor.b);
  doc.setLineWidth(0.3);
  doc.rect(col1, y, contentWidth, 10, 'FD');
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(textDark.r, textDark.g, textDark.b);
  doc.text('Declaro, sob as penas da lei, que as informações aqui prestadas são verdadeiras e assumo inteira responsabilidade pelas mesmas.', col1 + 2, y + 3.5);
  
  // Checkboxes para acúmulo de cargo
  let checkX = col1 + 2;
  doc.text('Exerce outro cargo/emprego público?', checkX, y + 7.5);
  checkX += doc.getTextWidth('Exerce outro cargo/emprego público?') + 3;
  addCheckField('SIM', checkX, y + 5);
  checkX += 15;
  addCheckField('NÃO', checkX, y + 5);
  checkX += 18;
  doc.text('Se SIM, especificar: ___________________________________________', checkX, y + 7.5);
  
  y += 13;
  
  // ============ ÁREA DE ASSINATURAS ============
  const signatureY = pageHeight - 28;
  
  // Linha decorativa
  doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.setLineWidth(0.3);
  doc.line(margin, signatureY - 3, margin + contentWidth, signatureY - 3);
  
  // Colunas de assinatura
  const signWidth = (contentWidth - 20) / 3;
  
  // Assinatura do Servidor
  doc.setDrawColor(textDark.r, textDark.g, textDark.b);
  doc.setLineWidth(0.3);
  doc.line(col1, signatureY + 8, col1 + signWidth, signatureY + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(textMuted.r, textMuted.g, textMuted.b);
  doc.text('Assinatura do Servidor', col1 + signWidth / 2, signatureY + 12, { align: 'center' });
  
  // Data
  doc.line(col1 + signWidth + 10, signatureY + 8, col1 + signWidth * 2 + 10, signatureY + 8);
  doc.text('Local e Data', col1 + signWidth * 1.5 + 10, signatureY + 12, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.text('Boa Vista - RR, ____/____/________', col1 + signWidth * 1.5 + 10, signatureY + 6, { align: 'center' });
  
  // Responsável RH
  doc.setFontSize(6);
  doc.line(col1 + signWidth * 2 + 20, signatureY + 8, col1 + contentWidth, signatureY + 8);
  doc.text('Responsável pelo Recebimento', col1 + signWidth * 2.5 + 20, signatureY + 12, { align: 'center' });
  doc.setFontSize(5);
  doc.text('(Carimbo e Assinatura)', col1 + signWidth * 2.5 + 20, signatureY + 16, { align: 'center' });
  
  // ============ RODAPÉ ============
  doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.rect(0, pageHeight - 8, pageWidth, 8, 'F');
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(255, 255, 255);
  doc.text('Instituto de Desporto, Juventude e Lazer de Roraima - IDJuv-RR', pageWidth / 2, pageHeight - 4.5, { align: 'center' });
  doc.setFontSize(4.5);
  doc.text('Documento gerado pelo Sistema de Gestão Institucional', pageWidth / 2, pageHeight - 2, { align: 'center' });
  
  doc.save('Modelo_Ficha_Cadastral_IDJUV.pdf');
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
  doc.text('GOVERNO DO ESTADO DE RORAIMA', pageWidth / 2, 10, { align: 'center' });
  doc.setFontSize(10);
  doc.text('INSTITUTO DE DESPORTO, JUVENTUDE E LAZER - IDJUV', pageWidth / 2, 17, { align: 'center' });
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
  doc.text('GOVERNO DO ESTADO DE RORAIMA', pageWidth / 2, 10, { align: 'center' });
  doc.setFontSize(10);
  doc.text('INSTITUTO DE DESPORTO, JUVENTUDE E LAZER - IDJUV', pageWidth / 2, 17, { align: 'center' });
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
