import jsPDF from 'jspdf';

import { getTenantSnapshot, nomeDoSistema } from '@/core/tenant';
import { baixarDocumento, emitirDocumento, localDaSede } from '@/lib/documentos';
import type { DadosRelatorioCargosVagas } from '@/lib/documentos/modelos/cargos/cargosVagas';
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

// ============================================================
// RELATÓRIO DE CARGOS E VAGAS (motor único: modelo `cargos-relatorio-cargos-vagas`)
// ============================================================

/** Gera e baixa o relatório de cargos e vagas (GestaoCargosPage). */
export const generateRelatorioCargos = async (data: DadosRelatorioCargosVagas): Promise<void> => {
  baixarDocumento(await emitirDocumento('cargos-relatorio-cargos-vagas', data));
};

// ============================================================
// RELATÓRIO ANUAL DE GOVERNANÇA (motor único: modelo `governanca-relatorio-anual`)
// ============================================================

/** Gera e baixa o relatório anual de governança e integridade (RelatorioGovernancaPage). Números fixos, como no original. */
export const generateRelatorioGovernancaPDF = async (): Promise<void> => {
  const sigla = getTenantSnapshot().identidade.sigla?.trim() || 'órgão';
  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const conformidade = [72, 75, 78, 80, 82, 85, 84, 86, 87, 87, 88, 87];
  const d = await emitirDocumento('governanca-relatorio-anual', {
    exercicio: '2025',
    indicadores: [
      { titulo: 'Conformidade', valor: '87%', meta: '90%' },
      { titulo: 'Processos', valor: '24', meta: '30' },
      { titulo: 'Capacitações', valor: '156', meta: '200' },
      { titulo: 'Riscos mitigados', valor: '18', meta: '22' },
    ],
    conformidadeMensal: meses.map((mes, i) => ({ mes, valor: conformidade[i] })),
    processosPorArea: [
      { area: 'Compras', quantidade: 8 },
      { area: 'RH', quantidade: 5 },
      { area: 'Patrimônio', quantidade: 4 },
      { area: 'Financeiro', quantidade: 4 },
      { area: 'Almoxarifado', quantidade: 3 },
    ],
    riscos: [
      { nivel: 'Baixo', quantidade: 12 },
      { nivel: 'Médio', quantidade: 8 },
      { nivel: 'Alto', quantidade: 4 },
      { nivel: 'Crítico', quantidade: 1 },
    ],
    acoes: [
      { titulo: 'Treinamento em Ética', situacao: 'Concluído' },
      { titulo: 'Código de Conduta', situacao: 'Concluído' },
      { titulo: 'Mapeamento de Riscos', situacao: 'Em andamento' },
      { titulo: 'Canal de Denúncias', situacao: 'Concluído' },
      { titulo: 'Auditoria Interna', situacao: 'Em andamento' },
    ],
    resumoExecutivo: [
      `O ${sigla} alcançou 87% de conformidade em 2025, superando o resultado de 2024.`,
      'Foram mapeados 24 processos administrativos e 156 servidores capacitados.',
      'O Canal de Denúncias está operacional com garantia de anonimato.',
      'A Matriz de Riscos institucional foi aprovada e publicada.',
    ],
    anoMetas: '2026',
    metas: [
      'Atingir 95% de conformidade nos processos críticos',
      'Mapear 100% dos processos institucionais (30 processos)',
      'Capacitar 100% dos servidores em integridade',
      'Obter certificação ISO 37001 (Antissuborno)',
    ],
  });
  baixarDocumento(d);
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

export const generateFichaCadastral = async (data: FichaCadastralData): Promise<void> => {
  const servidor: ServidorFichaCadastral = { ...data, dependentes: dependentesDaFicha(data.dependentes) };
  const hoje = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  baixarDocumento(await emitirDocumento('rh-ficha-cadastral', { servidor, local: localDaSede(), data: hoje }));
};

// ============================================================
// FICHA CADASTRAL EM BRANCO: o mesmo modelo, sem servidor (rótulos com linha para preencher)
// ============================================================

export const generateFichaCadastralModelo = async (): Promise<void> => {
  baixarDocumento(await emitirDocumento('rh-ficha-cadastral', { local: localDaSede() }));
};
