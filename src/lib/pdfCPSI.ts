/**
 * Gerador de PDFs para CPSI - Contrato Público de Solução Inovadora
 * LC 182/2021 + IN SEGES/MP nº 5/2017
 */

import {
  criarDocumentoInstitucional,
  finalizarDocumentoInstitucional,
  adicionarSecao,
  adicionarCampo,
  adicionarCampoInline,
  verificarQuebraPagina,
  MARGENS,
  CORES_INSTITUCIONAIS,
  ConfiguracaoDocumento,
} from './pdfInstitucional';
import { generateDocumentNumber } from './pdfGenerator';
import jsPDF from 'jspdf';

// ============ INTERFACES ============

export interface DFDData {
  areaRequisitante: string;
  responsavel: string;
  cargo: string;
  problemaIdentificado: string;
  necessidade: string;
  alinhamentoEstrategico: string;
  resultadosEsperados: string;
  previsaoContratacao: string;
  observacoes?: string;
}

export interface ETPData {
  // 1. Descrição da necessidade
  descricaoNecessidade: string;
  // 2. Área requisitante
  areaRequisitante: string;
  // 3. Descrição dos requisitos
  requisitosTecnicos: string;
  requisitosNegocio: string;
  // 4. Estimativa de valor
  estimativaValor: string;
  metodologiaEstimativa: string;
  // 5. Justificativa da contratação
  justificativaContratacao: string;
  // 6. Descrição da solução
  descricaoSolucao: string;
  // 7. Parâmetros de inovação
  diferencialInovador: string;
  ganhoEficiencia: string;
  baseComparativa: string;
  // 8. Demonstração em ambiente real
  ambienteTeste: string;
  criteriosAvaliacao: string;
  prazoTeste: string;
  // 9. Análise de riscos
  riscos: string;
  mitigacao: string;
  // 10. Viabilidade
  viabilidadeTecnica: string;
  viabilidadeOrcamentaria: string;
  observacoes?: string;
}

export interface TRData {
  // 1. Objeto
  objeto: string;
  // 2. Justificativa
  justificativa: string;
  // 3. Fundamentação Legal
  fundamentacaoLegal: string;
  // 4. Descrição detalhada
  descricaoDetalhada: string;
  modulosSistema: string;
  // 5. Requisitos técnicos
  requisitosTecnicos: string;
  requisitosSeguranca: string;
  requisitosDesempenho: string;
  // 6. Metodologia de avaliação
  metricas: string;
  criteriosAceite: string;
  // 7. Prazo
  prazoExecucao: string;
  cronograma: string;
  // 8. Valor e pagamento
  valorEstimado: string;
  condicoesPagamento: string;
  // 9. Obrigações
  obrigatoesContratada: string;
  obrigatoesContratante: string;
  // 10. Sanções
  sancoes: string;
  observacoes?: string;
}

// ============ HELPERS ============

const addMultiLineField = (
  doc: jsPDF,
  label: string,
  value: string,
  y: number,
  config: ConfiguracaoDocumento
): number => {
  const { largura } = { largura: doc.internal.pageSize.width };
  const larguraUtil = largura - MARGENS.esquerda - MARGENS.direita;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(CORES_INSTITUCIONAIS.textoMedio.r, CORES_INSTITUCIONAIS.textoMedio.g, CORES_INSTITUCIONAIS.textoMedio.b);
  doc.text(label, MARGENS.esquerda, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(CORES_INSTITUCIONAIS.textoEscuro.r, CORES_INSTITUCIONAIS.textoEscuro.g, CORES_INSTITUCIONAIS.textoEscuro.b);
  const lines = doc.splitTextToSize(value || '-', larguraUtil);
  
  for (const line of lines) {
    y = verificarQuebraPagina(doc, y, 5, config);
    doc.text(line, MARGENS.esquerda, y);
    y += 4;
  }

  return y + 3;
};

// ============ GERADOR DFD ============

export const generateDFD = async (data: DFDData): Promise<string> => {
  const numero = generateDocumentNumber('DFD-CPSI');
  
  const config: ConfiguracaoDocumento = {
    titulo: 'DOCUMENTO DE FORMALIZAÇÃO DE DEMANDA',
    subtitulo: 'Contrato Público de Solução Inovadora — LC 182/2021',
    numero,
    variante: 'claro',
  };

  const { doc, yInicial } = await criarDocumentoInstitucional(config);
  let y = yInicial;

  // Seção 1
  y = adicionarSecao(doc, 'IDENTIFICAÇÃO DA DEMANDA', y, 1);
  y = addMultiLineField(doc, 'Área Requisitante:', data.areaRequisitante, y, config);
  y = addMultiLineField(doc, 'Responsável:', data.responsavel, y, config);
  y = addMultiLineField(doc, 'Cargo/Função:', data.cargo, y, config);

  // Seção 2
  y = verificarQuebraPagina(doc, y, 20, config);
  y = adicionarSecao(doc, 'PROBLEMA IDENTIFICADO', y, 2);
  y = addMultiLineField(doc, '', data.problemaIdentificado, y, config);

  // Seção 3
  y = verificarQuebraPagina(doc, y, 20, config);
  y = adicionarSecao(doc, 'NECESSIDADE DA CONTRATAÇÃO', y, 3);
  y = addMultiLineField(doc, '', data.necessidade, y, config);

  // Seção 4
  y = verificarQuebraPagina(doc, y, 20, config);
  y = adicionarSecao(doc, 'ALINHAMENTO ESTRATÉGICO', y, 4);
  y = addMultiLineField(doc, '', data.alinhamentoEstrategico, y, config);

  // Seção 5
  y = verificarQuebraPagina(doc, y, 20, config);
  y = adicionarSecao(doc, 'RESULTADOS ESPERADOS', y, 5);
  y = addMultiLineField(doc, '', data.resultadosEsperados, y, config);

  // Seção 6
  y = verificarQuebraPagina(doc, y, 15, config);
  y = adicionarSecao(doc, 'PREVISÃO DE CONTRATAÇÃO', y, 6);
  y = addMultiLineField(doc, '', data.previsaoContratacao, y, config);

  if (data.observacoes) {
    y = verificarQuebraPagina(doc, y, 15, config);
    y = adicionarSecao(doc, 'OBSERVAÇÕES', y, 7);
    y = addMultiLineField(doc, '', data.observacoes, y, config);
  }

  // Assinaturas
  y = verificarQuebraPagina(doc, y, 40, config);
  y += 15;
  doc.setLineWidth(0.3);
  doc.setDrawColor(CORES_INSTITUCIONAIS.bordaMedia.r, CORES_INSTITUCIONAIS.bordaMedia.g, CORES_INSTITUCIONAIS.bordaMedia.b);
  doc.line(30, y, 90, y);
  doc.line(120, y, 180, y);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(CORES_INSTITUCIONAIS.textoMedio.r, CORES_INSTITUCIONAIS.textoMedio.g, CORES_INSTITUCIONAIS.textoMedio.b);
  doc.text('Responsável pela Demanda', 60, y + 5, { align: 'center' });
  doc.text('Autoridade Competente', 150, y + 5, { align: 'center' });

  finalizarDocumentoInstitucional(doc, config);
  doc.save(`DFD_CPSI_${numero.replace('/', '-')}.pdf`);
  return numero;
};

// ============ GERADOR ETP ============

export const generateETP = async (data: ETPData): Promise<string> => {
  const numero = generateDocumentNumber('ETP-CPSI');
  
  const config: ConfiguracaoDocumento = {
    titulo: 'ESTUDO TÉCNICO PRELIMINAR',
    subtitulo: 'CPSI — IN SEGES/MP nº 5/2017 | LC 182/2021',
    numero,
    variante: 'claro',
  };

  const { doc, yInicial } = await criarDocumentoInstitucional(config);
  let y = yInicial;

  const sections: { title: string; num: number; fields: [string, string][] }[] = [
    { title: 'DESCRIÇÃO DA NECESSIDADE', num: 1, fields: [['', data.descricaoNecessidade]] },
    { title: 'ÁREA REQUISITANTE', num: 2, fields: [['', data.areaRequisitante]] },
    { title: 'REQUISITOS DA CONTRATAÇÃO', num: 3, fields: [['Requisitos Técnicos:', data.requisitosTecnicos], ['Requisitos de Negócio:', data.requisitosNegocio]] },
    { title: 'ESTIMATIVA DE VALOR', num: 4, fields: [['Valor Estimado:', data.estimativaValor], ['Metodologia:', data.metodologiaEstimativa]] },
    { title: 'JUSTIFICATIVA DA CONTRATAÇÃO', num: 5, fields: [['', data.justificativaContratacao]] },
    { title: 'DESCRIÇÃO DA SOLUÇÃO', num: 6, fields: [['', data.descricaoSolucao]] },
    { title: 'PARÂMETROS DE INOVAÇÃO (LC 182/2021)', num: 7, fields: [['Diferencial Inovador:', data.diferencialInovador], ['Ganho de Eficiência:', data.ganhoEficiencia], ['Base Comparativa:', data.baseComparativa]] },
    { title: 'DEMONSTRAÇÃO EM AMBIENTE REAL', num: 8, fields: [['Ambiente de Teste:', data.ambienteTeste], ['Critérios de Avaliação:', data.criteriosAvaliacao], ['Prazo do Teste:', data.prazoTeste]] },
    { title: 'ANÁLISE DE RISCOS', num: 9, fields: [['Riscos Identificados:', data.riscos], ['Medidas de Mitigação:', data.mitigacao]] },
    { title: 'VIABILIDADE', num: 10, fields: [['Viabilidade Técnica:', data.viabilidadeTecnica], ['Viabilidade Orçamentária:', data.viabilidadeOrcamentaria]] },
  ];

  for (const section of sections) {
    y = verificarQuebraPagina(doc, y, 20, config);
    y = adicionarSecao(doc, section.title, y, section.num);
    for (const [label, value] of section.fields) {
      y = addMultiLineField(doc, label, value, y, config);
    }
  }

  if (data.observacoes) {
    y = verificarQuebraPagina(doc, y, 15, config);
    y = adicionarSecao(doc, 'OBSERVAÇÕES', y, 11);
    y = addMultiLineField(doc, '', data.observacoes, y, config);
  }

  // Assinaturas
  y = verificarQuebraPagina(doc, y, 50, config);
  y += 15;
  doc.setLineWidth(0.3);
  doc.setDrawColor(CORES_INSTITUCIONAIS.bordaMedia.r, CORES_INSTITUCIONAIS.bordaMedia.g, CORES_INSTITUCIONAIS.bordaMedia.b);
  doc.line(25, y, 95, y);
  doc.line(115, y, 185, y);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(CORES_INSTITUCIONAIS.textoMedio.r, CORES_INSTITUCIONAIS.textoMedio.g, CORES_INSTITUCIONAIS.textoMedio.b);
  doc.text('Equipe de Planejamento', 60, y + 5, { align: 'center' });
  doc.text('Autoridade Competente', 150, y + 5, { align: 'center' });

  finalizarDocumentoInstitucional(doc, config);
  doc.save(`ETP_CPSI_${numero.replace('/', '-')}.pdf`);
  return numero;
};

// ============ GERADOR TR ============

export const generateTR = async (data: TRData): Promise<string> => {
  const numero = generateDocumentNumber('TR-CPSI');
  
  const config: ConfiguracaoDocumento = {
    titulo: 'TERMO DE REFERÊNCIA',
    subtitulo: 'CPSI — Lei 14.133/2021 | LC 182/2021',
    numero,
    variante: 'claro',
  };

  const { doc, yInicial } = await criarDocumentoInstitucional(config);
  let y = yInicial;

  const sections: { title: string; num: number; fields: [string, string][] }[] = [
    { title: 'OBJETO', num: 1, fields: [['', data.objeto]] },
    { title: 'JUSTIFICATIVA', num: 2, fields: [['', data.justificativa]] },
    { title: 'FUNDAMENTAÇÃO LEGAL', num: 3, fields: [['', data.fundamentacaoLegal]] },
    { title: 'DESCRIÇÃO DETALHADA DA SOLUÇÃO', num: 4, fields: [['Descrição:', data.descricaoDetalhada], ['Módulos do Sistema:', data.modulosSistema]] },
    { title: 'REQUISITOS TÉCNICOS', num: 5, fields: [['Requisitos Funcionais:', data.requisitosTecnicos], ['Requisitos de Segurança:', data.requisitosSeguranca], ['Requisitos de Desempenho:', data.requisitosDesempenho]] },
    { title: 'METODOLOGIA DE AVALIAÇÃO', num: 6, fields: [['Métricas:', data.metricas], ['Critérios de Aceite:', data.criteriosAceite]] },
    { title: 'PRAZO DE EXECUÇÃO', num: 7, fields: [['Prazo:', data.prazoExecucao], ['Cronograma:', data.cronograma]] },
    { title: 'VALOR E CONDIÇÕES DE PAGAMENTO', num: 8, fields: [['Valor Estimado:', data.valorEstimado], ['Condições de Pagamento:', data.condicoesPagamento]] },
    { title: 'OBRIGAÇÕES DAS PARTES', num: 9, fields: [['Obrigações da Contratada:', data.obrigatoesContratada], ['Obrigações da Contratante:', data.obrigatoesContratante]] },
    { title: 'SANÇÕES', num: 10, fields: [['', data.sancoes]] },
  ];

  for (const section of sections) {
    y = verificarQuebraPagina(doc, y, 20, config);
    y = adicionarSecao(doc, section.title, y, section.num);
    for (const [label, value] of section.fields) {
      y = addMultiLineField(doc, label, value, y, config);
    }
  }

  if (data.observacoes) {
    y = verificarQuebraPagina(doc, y, 15, config);
    y = adicionarSecao(doc, 'OBSERVAÇÕES', y, 11);
    y = addMultiLineField(doc, '', data.observacoes, y, config);
  }

  // Assinaturas
  y = verificarQuebraPagina(doc, y, 60, config);
  y += 15;
  doc.setLineWidth(0.3);
  doc.setDrawColor(CORES_INSTITUCIONAIS.bordaMedia.r, CORES_INSTITUCIONAIS.bordaMedia.g, CORES_INSTITUCIONAIS.bordaMedia.b);
  doc.line(25, y, 95, y);
  doc.line(115, y, 185, y);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(CORES_INSTITUCIONAIS.textoMedio.r, CORES_INSTITUCIONAIS.textoMedio.g, CORES_INSTITUCIONAIS.textoMedio.b);
  doc.text('Equipe de Planejamento', 60, y + 5, { align: 'center' });
  doc.text('Autoridade Competente', 150, y + 5, { align: 'center' });
  y += 20;
  doc.line(75, y, 135, y);
  doc.text('Assessoria Jurídica', 105, y + 5, { align: 'center' });

  finalizarDocumentoInstitucional(doc, config);
  doc.save(`TR_CPSI_${numero.replace('/', '-')}.pdf`);
  return numero;
};
