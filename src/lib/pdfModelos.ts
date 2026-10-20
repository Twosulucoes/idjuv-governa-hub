/**
 * Modelos de documentos administrativos padronizados do IDJUV-RR
 * Baseado nos anexos oficiais, adaptados à Lei nº 2.301/2025
 * 
 * Cada modelo possui duas versões:
 * - Modelo em branco (para impressão e preenchimento manual)
 * - Modelo preenchido (com dados do sistema)
 */
import jsPDF from 'jspdf';
import {
  loadLogos,
  generateInstitutionalHeader,
  generateInstitutionalFooter,
  addPageNumbers,
  addSectionHeader,
  addFieldWithLine,
  addTextArea,
  addSignatureArea,
  addLocalData,
  addTableHeader,
  addTableRow,
  PAGINA,
  getPageDimensions,
  CORES,
  setColor,
} from './pdfTemplate';

// ============ 2. FICHA CADASTRAL DO SERVIDOR ============
// Motor único (modelo `rh-ficha-cadastral`): a versão em branco é a mesma ficha sem servidor.
export { generateFichaCadastralModelo } from './pdfGenerator';

// ============ 5. TERMO DE DEMANDA ============

export const generateTermoDemandaModelo = async (): Promise<void> => {
  const doc = new jsPDF();
  const logos = await loadLogos();
  
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'TERMO DE DEMANDA',
    numero: '___/____',
  }, logos);
  
  const { contentWidth } = getPageDimensions(doc);
  const halfWidth = contentWidth / 2 - 5;
  
  y = addSectionHeader(doc, 'Identificação do Solicitante', y, { numerada: true, numero: 1 });
  y = addFieldWithLine(doc, 'Nome', '', PAGINA.margemEsquerda, y, contentWidth);
  y = addFieldWithLine(doc, 'Cargo/Função', '', PAGINA.margemEsquerda, y, halfWidth);
  y -= 6;
  y = addFieldWithLine(doc, 'Setor/Unidade', '', PAGINA.margemEsquerda + halfWidth + 10, y, halfWidth);
  y = addFieldWithLine(doc, 'E-mail', '', PAGINA.margemEsquerda, y, halfWidth);
  y -= 6;
  y = addFieldWithLine(doc, 'Telefone', '', PAGINA.margemEsquerda + halfWidth + 10, y, halfWidth);
  
  y += 4;
  
  y = addSectionHeader(doc, 'Descrição da Demanda', y, { numerada: true, numero: 2 });
  y = addTextArea(doc, 'Objeto da demanda:', '', y, 2);
  y = addTextArea(doc, 'Justificativa (necessidade e motivação):', '', y, 4);
  
  y = addSectionHeader(doc, 'Especificações Técnicas', y, { numerada: true, numero: 3 });
  y = addFieldWithLine(doc, 'Quantidade estimada', '', PAGINA.margemEsquerda, y, halfWidth);
  y -= 6;
  y = addFieldWithLine(doc, 'Valor estimado (R$)', '', PAGINA.margemEsquerda + halfWidth + 10, y, halfWidth);
  y = addFieldWithLine(doc, 'Prazo necessário', '', PAGINA.margemEsquerda, y, halfWidth);
  y -= 6;
  y = addFieldWithLine(doc, 'Prioridade (Alta/Média/Baixa)', '', PAGINA.margemEsquerda + halfWidth + 10, y, halfWidth);
  
  y += 4;
  
  y = addSectionHeader(doc, 'Observações', y, { numerada: true, numero: 4 });
  y = addTextArea(doc, '', '', y, 3);
  
  y += 8;
  
  y = addLocalData(doc, 'Boa Vista - RR', y);
  y += 8;
  
  y = addSignatureArea(doc, [
    { cargo: 'Solicitante' },
    { cargo: 'Chefia Imediata' },
  ], y);
  
  generateInstitutionalFooter(doc);
  addPageNumbers(doc);
  
  doc.save('Modelo_Termo_Demanda_IDJUV.pdf');
};

// ============ 6. ORDEM DE MISSÃO ============

export const generateOrdemMissaoModelo = async (): Promise<void> => {
  const doc = new jsPDF();
  const logos = await loadLogos();
  
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'ORDEM DE MISSÃO',
    numero: '___/____',
  }, logos);
  
  const { contentWidth } = getPageDimensions(doc);
  const halfWidth = contentWidth / 2 - 5;
  
  y = addSectionHeader(doc, 'Identificação do Servidor', y, { numerada: true, numero: 1 });
  y = addFieldWithLine(doc, 'Nome', '', PAGINA.margemEsquerda, y, contentWidth);
  y = addFieldWithLine(doc, 'Cargo/Função', '', PAGINA.margemEsquerda, y, halfWidth);
  y -= 6;
  y = addFieldWithLine(doc, 'Matrícula', '', PAGINA.margemEsquerda + halfWidth + 10, y, halfWidth);
  y = addFieldWithLine(doc, 'Unidade de Lotação', '', PAGINA.margemEsquerda, y, contentWidth);
  
  y += 4;
  
  y = addSectionHeader(doc, 'Dados da Missão', y, { numerada: true, numero: 2 });
  y = addFieldWithLine(doc, 'Destino (Cidade/UF)', '', PAGINA.margemEsquerda, y, contentWidth);
  y = addTextArea(doc, 'Objetivo/Finalidade:', '', y, 3);
  
  y = addSectionHeader(doc, 'Período e Transporte', y, { numerada: true, numero: 3 });
  y = addFieldWithLine(doc, 'Data/Hora Saída', '', PAGINA.margemEsquerda, y, halfWidth);
  y -= 6;
  y = addFieldWithLine(doc, 'Data/Hora Retorno', '', PAGINA.margemEsquerda + halfWidth + 10, y, halfWidth);
  y = addFieldWithLine(doc, 'Meio de Transporte', '', PAGINA.margemEsquerda, y, contentWidth);
  
  y += 4;
  
  y = addSectionHeader(doc, 'Diárias e Passagens', y, { numerada: true, numero: 4 });
  y = addFieldWithLine(doc, 'Quantidade de Diárias', '', PAGINA.margemEsquerda, y, halfWidth);
  y -= 6;
  y = addFieldWithLine(doc, 'Valor Unitário (R$)', '', PAGINA.margemEsquerda + halfWidth + 10, y, halfWidth);
  y = addFieldWithLine(doc, 'Valor Total Diárias (R$)', '', PAGINA.margemEsquerda, y, halfWidth);
  y -= 6;
  y = addFieldWithLine(doc, 'Passagem Aérea (Sim/Não)', '', PAGINA.margemEsquerda + halfWidth + 10, y, halfWidth);
  
  y += 4;
  
  y = addSectionHeader(doc, 'Observações', y, { numerada: true, numero: 5 });
  y = addTextArea(doc, '', '', y, 2);
  
  y += 5;
  
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('Autorizo a realização da missão acima descrita, nos termos da legislação vigente.', PAGINA.margemEsquerda, y);
  
  y += 10;
  
  y = addLocalData(doc, 'Boa Vista - RR', y);
  y += 8;
  
  y = addSignatureArea(doc, [
    { cargo: 'Servidor' },
    { cargo: 'Chefia Imediata' },
    { cargo: 'Ordenador de Despesa' },
  ], y);
  
  generateInstitutionalFooter(doc);
  addPageNumbers(doc);
  
  doc.save('Modelo_Ordem_Missao_IDJUV.pdf');
};

// ============ 7. RELATÓRIO DE VIAGEM ============

export const generateRelatorioViagemModelo = async (): Promise<void> => {
  const doc = new jsPDF();
  const logos = await loadLogos();
  
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'RELATÓRIO DE VIAGEM',
    numero: '___/____',
  }, logos);
  
  const { contentWidth } = getPageDimensions(doc);
  const halfWidth = contentWidth / 2 - 5;
  
  y = addSectionHeader(doc, 'Identificação', y, { numerada: true, numero: 1 });
  y = addFieldWithLine(doc, 'Nome do Servidor', '', PAGINA.margemEsquerda, y, contentWidth);
  y = addFieldWithLine(doc, 'Cargo/Função', '', PAGINA.margemEsquerda, y, halfWidth);
  y -= 6;
  y = addFieldWithLine(doc, 'Matrícula', '', PAGINA.margemEsquerda + halfWidth + 10, y, halfWidth);
  y = addFieldWithLine(doc, 'Nº Ordem de Missão', '', PAGINA.margemEsquerda, y, halfWidth);
  
  y += 4;
  
  y = addSectionHeader(doc, 'Dados da Viagem', y, { numerada: true, numero: 2 });
  y = addFieldWithLine(doc, 'Destino', '', PAGINA.margemEsquerda, y, contentWidth);
  y = addFieldWithLine(doc, 'Período', '', PAGINA.margemEsquerda, y, contentWidth);
  y = addTextArea(doc, 'Objetivo Original:', '', y, 2);
  
  y = addSectionHeader(doc, 'Atividades Realizadas', y, { numerada: true, numero: 3 });
  y = addTextArea(doc, '', '', y, 5);
  
  y = addSectionHeader(doc, 'Resultados Obtidos', y, { numerada: true, numero: 4 });
  y = addTextArea(doc, '', '', y, 3);
  
  y = addSectionHeader(doc, 'Despesas e Observações', y, { numerada: true, numero: 5 });
  y = addTextArea(doc, '', '', y, 2);
  
  y += 3;
  
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.text('Declaro que as informações acima são verdadeiras e que cumpri integralmente os objetivos da missão.', PAGINA.margemEsquerda, y);
  
  y += 10;
  
  y = addLocalData(doc, 'Boa Vista - RR', y);
  y += 8;
  
  y = addSignatureArea(doc, [
    { cargo: 'Servidor' },
    { cargo: 'Chefia Imediata' },
  ], y);
  
  generateInstitutionalFooter(doc);
  addPageNumbers(doc);
  
  doc.save('Modelo_Relatorio_Viagem_IDJUV.pdf');
};

// ============ 8. REQUISIÇÃO DE MATERIAL ============

export const generateRequisicaoMaterialModelo = async (): Promise<void> => {
  const doc = new jsPDF();
  const logos = await loadLogos();
  
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'REQUISIÇÃO DE MATERIAL',
    numero: '___/____',
  }, logos);
  
  const { contentWidth } = getPageDimensions(doc);
  const halfWidth = contentWidth / 2 - 5;
  
  y = addSectionHeader(doc, 'Identificação do Solicitante', y, { numerada: true, numero: 1 });
  y = addFieldWithLine(doc, 'Nome', '', PAGINA.margemEsquerda, y, contentWidth);
  y = addFieldWithLine(doc, 'Cargo/Função', '', PAGINA.margemEsquerda, y, halfWidth);
  y -= 6;
  y = addFieldWithLine(doc, 'Setor/Unidade', '', PAGINA.margemEsquerda + halfWidth + 10, y, halfWidth);
  
  y += 4;
  
  y = addSectionHeader(doc, 'Materiais Solicitados', y, { numerada: true, numero: 2 });
  
  // Cabeçalho da tabela de materiais
  const colunas = [
    { header: 'QTD', width: 15, align: 'center' as const },
    { header: 'UNID.', width: 15, align: 'center' as const },
    { header: 'DESCRIÇÃO DO MATERIAL', width: 110, align: 'left' as const },
    { header: 'OBS', width: 30, align: 'left' as const },
  ];
  
  y = addTableHeader(doc, colunas, y);
  
  for (let i = 0; i < 8; i++) {
    y = addTableRow(doc, ['', '', '', ''], colunas, y, i % 2 === 1);
    setColor(doc, CORES.cinzaMuitoClaro, 'draw');
    doc.setLineWidth(0.2);
    doc.line(PAGINA.margemEsquerda, y - 2, PAGINA.margemEsquerda + contentWidth, y - 2);
  }
  
  y += 5;
  
  y = addSectionHeader(doc, 'Justificativa', y, { numerada: true, numero: 3 });
  y = addTextArea(doc, '', '', y, 3);
  
  y = addFieldWithLine(doc, 'Urgência (Alta/Média/Baixa)', '', PAGINA.margemEsquerda, y, halfWidth);
  
  y += 8;
  
  y = addLocalData(doc, 'Boa Vista - RR', y);
  y += 8;
  
  y = addSignatureArea(doc, [
    { cargo: 'Solicitante' },
    { cargo: 'Chefia Imediata' },
    { cargo: 'Almoxarifado' },
  ], y);
  
  generateInstitutionalFooter(doc);
  addPageNumbers(doc);
  
  doc.save('Modelo_Requisicao_Material_IDJUV.pdf');
};

// ============ 9. TERMO DE RESPONSABILIDADE PATRIMONIAL ============

export const generateTermoResponsabilidadeModelo = async (): Promise<void> => {
  const doc = new jsPDF();
  const logos = await loadLogos();
  
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'TERMO DE RESPONSABILIDADE PATRIMONIAL',
    numero: '___/____',
  }, logos);
  
  const { contentWidth } = getPageDimensions(doc);
  const halfWidth = contentWidth / 2 - 5;
  
  y = addSectionHeader(doc, 'Identificação do Responsável', y, { numerada: true, numero: 1 });
  y = addFieldWithLine(doc, 'Nome', '', PAGINA.margemEsquerda, y, contentWidth);
  y = addFieldWithLine(doc, 'Cargo/Função', '', PAGINA.margemEsquerda, y, halfWidth);
  y -= 6;
  y = addFieldWithLine(doc, 'Matrícula', '', PAGINA.margemEsquerda + halfWidth + 10, y, halfWidth);
  y = addFieldWithLine(doc, 'Setor/Unidade', '', PAGINA.margemEsquerda, y, contentWidth);
  
  y += 4;
  
  y = addSectionHeader(doc, 'Bens sob Responsabilidade', y, { numerada: true, numero: 2 });
  
  const colunas = [
    { header: 'Nº TOMBO', width: 30, align: 'center' as const },
    { header: 'DESCRIÇÃO DO BEM', width: 90, align: 'left' as const },
    { header: 'ESTADO', width: 25, align: 'center' as const },
    { header: 'LOCAL', width: 25, align: 'center' as const },
  ];
  
  y = addTableHeader(doc, colunas, y);
  
  for (let i = 0; i < 6; i++) {
    y = addTableRow(doc, ['', '', '', ''], colunas, y, i % 2 === 1);
    setColor(doc, CORES.cinzaMuitoClaro, 'draw');
    doc.setLineWidth(0.2);
    doc.line(PAGINA.margemEsquerda, y - 2, PAGINA.margemEsquerda + contentWidth, y - 2);
  }
  
  y += 5;
  
  y = addSectionHeader(doc, 'Observações', y, { numerada: true, numero: 3 });
  y = addTextArea(doc, '', '', y, 2);
  
  y += 3;
  
  // Declaração
  setColor(doc, CORES.fundoClaro, 'fill');
  doc.rect(PAGINA.margemEsquerda, y, contentWidth, 22, 'F');
  y += 5;
  
  setColor(doc, CORES.textoEscuro);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('TERMO DE COMPROMISSO', PAGINA.margemEsquerda + 3, y);
  y += 5;
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const declaracao = 'Declaro ter recebido os bens acima descritos, comprometendo-me a zelar pela sua guarda, conservação e uso adequado. Estou ciente de que responderei administrativa, civil e penalmente por dano, extravio ou uso indevido dos bens patrimoniais sob minha responsabilidade.';
  const declLines = doc.splitTextToSize(declaracao, contentWidth - 6);
  doc.text(declLines, PAGINA.margemEsquerda + 3, y);
  
  y += 22;
  
  y = addLocalData(doc, 'Boa Vista - RR', y);
  y += 8;
  
  y = addSignatureArea(doc, [
    { cargo: 'Responsável' },
    { cargo: 'Chefia Imediata' },
    { cargo: 'Patrimônio' },
  ], y);
  
  generateInstitutionalFooter(doc);
  addPageNumbers(doc);
  
  doc.save('Modelo_Termo_Responsabilidade_IDJUV.pdf');
};
