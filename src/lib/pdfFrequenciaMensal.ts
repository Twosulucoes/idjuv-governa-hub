/**
 * Geração de PDF da Frequência Mensal - IDJuv-RR
 * Implementa versões em branco e preenchida, com validade administrativa e jurídica
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
  formatDate,
  checkPageBreak,
} from './pdfTemplate';
import { DIAS_SEMANA_SIGLA, TIPO_DIA_NAO_UTIL_LABELS, STATUS_FECHAMENTO_LABELS } from '@/types/frequencia';
import type { 
  DiaNaoUtil, 
  ConfigJornadaPadrao, 
  RegimeTrabalho,
  ConfigAssinaturaFrequencia,
  ConfigFechamentoFrequencia,
  StatusFechamento
} from '@/types/frequencia';

// ============================================
// INTERFACES
// ============================================

export interface ServidorFrequencia {
  id: string;
  nome_completo: string;
  matricula?: string;
  cpf?: string;
  cargo?: string;
  unidade?: string;
  regime?: string;
  jornada?: string;
  carga_horaria_diaria?: number;
  carga_horaria_semanal?: number;
}

export interface RegistroDiario {
  data: string;
  dia_semana: number;
  situacao: 'util' | 'sabado' | 'domingo' | 'feriado' | 'ponto_facultativo' | 'recesso' | 'expediente_reduzido';
  situacao_label?: string;
  entrada_manha?: string;
  saida_manha?: string;
  entrada_tarde?: string;
  saida_tarde?: string;
  total_horas?: number;
  observacao?: string;
  tipo_registro?: string;
}

export interface ResumoFrequencia {
  dias_uteis: number;
  dias_trabalhados: number;
  dias_falta: number;
  dias_abono: number;
  dias_atestado: number;
  dias_ferias: number;
  dias_licenca: number;
  horas_previstas: number;
  horas_trabalhadas: number;
  horas_abonadas: number;
  horas_compensadas: number;
  saldo_banco_horas: number;
}

export interface ConfiguracaoAssinaturas {
  servidor_obrigatoria: boolean;
  chefia_obrigatoria: boolean;
  rh_obrigatoria: boolean;
  texto_declaracao: string;
  nome_chefia?: string;
  cargo_chefia?: string;
  nome_rh?: string;
  cargo_rh?: string;
}

export interface StatusPeriodo {
  status: StatusFechamento;
  fechado_em?: string;
  validado_chefia_em?: string;
  consolidado_rh_em?: string;
}

export interface FrequenciaMensalPDFData {
  tipo: 'em_branco' | 'preenchida';
  competencia: { mes: number; ano: number };
  servidor: ServidorFrequencia;
  registros?: RegistroDiario[];
  resumo?: ResumoFrequencia;
  diasNaoUteis: DiaNaoUtil[];
  configAssinatura: ConfiguracaoAssinaturas;
  statusPeriodo?: StatusPeriodo;
  dataGeracao: string;
  usuarioGeracao?: string;
}

// ============================================
// HELPERS
// ============================================

const MESES_EXTENSO = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function getUltimoDiaMes(ano: number, mes: number): number {
  return new Date(ano, mes, 0).getDate();
}

function getSituacaoDia(
  data: Date,
  diasNaoUteis: DiaNaoUtil[]
): { situacao: RegistroDiario['situacao']; label?: string } {
  const diaSemana = data.getDay();
  const dataStr = data.toISOString().split('T')[0];

  // Verificar se é dia não útil cadastrado
  const diaNaoUtil = diasNaoUteis.find(d => d.data === dataStr && d.ativo);
  if (diaNaoUtil) {
    const tipoDia = diaNaoUtil.tipo;
    // Mapear tipos de feriado para 'feriado'
    const isFeriado = tipoDia === 'feriado_nacional' || tipoDia === 'feriado_estadual' || tipoDia === 'feriado_municipal';
    const situacaoMapeada: RegistroDiario['situacao'] = isFeriado 
      ? 'feriado' 
      : (tipoDia as RegistroDiario['situacao']);
    return { 
      situacao: situacaoMapeada,
      label: diaNaoUtil.nome 
    };
  }

  // Verificar fim de semana
  if (diaSemana === 0) return { situacao: 'domingo' };
  if (diaSemana === 6) return { situacao: 'sabado' };

  return { situacao: 'util' };
}

function formatarHoraMinuto(horas?: number): string {
  if (horas === undefined || horas === null) return '-';
  const h = Math.floor(horas);
  const m = Math.round((horas - h) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function gerarCodigoVerificacao(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let codigo = '';
  for (let i = 0; i < 8; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
}

// ============================================
// GERAÇÃO DO PDF
// ============================================

export const generateFrequenciaMensalPDF = async (data: FrequenciaMensalPDFData): Promise<void> => {
  const logos = await loadLogos();
  const doc = new jsPDF();
  const { width, contentWidth } = getPageDimensions(doc);
  const pageHeight = doc.internal.pageSize.getHeight();

  const competenciaStr = `${MESES_EXTENSO[data.competencia.mes - 1]}/${data.competencia.ano}`;
  const tipoDoc = data.tipo === 'em_branco' ? ' (EM BRANCO)' : '';
  const codigoVerificacao = gerarCodigoVerificacao();

  // ============ CABEÇALHO INSTITUCIONAL ============
  let y = await generateInstitutionalHeader(doc, {
    titulo: 'FOLHA DE FREQUÊNCIA MENSAL' + tipoDoc,
    subtitulo: `Competência: ${competenciaStr}`,
    fundoEscuro: true,
  }, logos);

  // ============ DADOS DO SERVIDOR ============
  y = addSectionHeader(doc, 'IDENTIFICAÇÃO DO SERVIDOR', y);

  const col1 = PAGINA.margemEsquerda;
  const col2 = PAGINA.margemEsquerda + contentWidth / 2;
  const colWidth = contentWidth / 2 - 5;

  addField(doc, 'Nome Completo', data.servidor.nome_completo, col1, y, contentWidth);
  y += 9;

  addField(doc, 'Matrícula', data.servidor.matricula || '-', col1, y, colWidth);
  addField(doc, 'CPF', data.servidor.cpf || '-', col2, y, colWidth);
  y += 9;

  addField(doc, 'Cargo', data.servidor.cargo || '-', col1, y, colWidth);
  addField(doc, 'Unidade de Lotação', data.servidor.unidade || '-', col2, y, colWidth);
  y += 9;

  addField(doc, 'Regime de Trabalho', data.servidor.regime || 'Presencial', col1, y, colWidth);
  addField(doc, 'Jornada', data.servidor.jornada || `${data.servidor.carga_horaria_diaria || 8}h diárias`, col2, y, colWidth);
  y += 12;

  // ============ STATUS DO PERÍODO (apenas para preenchida) ============
  if (data.tipo === 'preenchida' && data.statusPeriodo) {
    const statusLabel = STATUS_FECHAMENTO_LABELS[data.statusPeriodo.status] || data.statusPeriodo.status;
    
    setColor(doc, CORES.cinzaMuitoClaro, 'fill');
    doc.rect(PAGINA.margemEsquerda, y - 3, contentWidth, 8, 'F');
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    setColor(doc, CORES.primaria);
    doc.text(`STATUS: ${statusLabel.toUpperCase()}`, PAGINA.margemEsquerda + 3, y + 2);
    
    if (data.statusPeriodo.consolidado_rh_em) {
      doc.setFont('helvetica', 'normal');
      doc.text(`| Consolidado em: ${formatDate(data.statusPeriodo.consolidado_rh_em)}`, PAGINA.margemEsquerda + 80, y + 2);
    }
    y += 12;
  }

  // ============ QUADRO DIÁRIO DE FREQUÊNCIA ============
  y = addSectionHeader(doc, 'QUADRO DIÁRIO DE FREQUÊNCIA', y);

  // Gerar dias do mês
  const ultimoDia = getUltimoDiaMes(data.competencia.ano, data.competencia.mes);
  const registrosDias: RegistroDiario[] = [];

  for (let dia = 1; dia <= ultimoDia; dia++) {
    const dataAtual = new Date(data.competencia.ano, data.competencia.mes - 1, dia);
    const dataStr = `${data.competencia.ano}-${String(data.competencia.mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const { situacao, label } = getSituacaoDia(dataAtual, data.diasNaoUteis);

    // Buscar registro existente se for preenchida
    const registroExistente = data.registros?.find(r => r.data === dataStr);

    registrosDias.push({
      data: dataStr,
      dia_semana: dataAtual.getDay(),
      situacao: registroExistente?.situacao || situacao,
      situacao_label: registroExistente?.situacao_label || label,
      entrada_manha: registroExistente?.entrada_manha,
      saida_manha: registroExistente?.saida_manha,
      entrada_tarde: registroExistente?.entrada_tarde,
      saida_tarde: registroExistente?.saida_tarde,
      total_horas: registroExistente?.total_horas,
      observacao: registroExistente?.observacao || label,
      tipo_registro: registroExistente?.tipo_registro,
    });
  }

  // Header da tabela
  const colWidths = {
    data: 18,
    dia: 12,
    situacao: 22,
    entrada1: 16,
    saida1: 16,
    entrada2: 16,
    saida2: 16,
    total: 14,
    obs: contentWidth - 18 - 12 - 22 - 16 - 16 - 16 - 16 - 14,
  };

  setColor(doc, CORES.primaria, 'fill');
  doc.rect(PAGINA.margemEsquerda, y - 4, contentWidth, 7, 'F');

  setColor(doc, { r: 255, g: 255, b: 255 });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');

  let colX = PAGINA.margemEsquerda + 2;
  doc.text('DATA', colX, y); colX += colWidths.data;
  doc.text('DIA', colX, y); colX += colWidths.dia;
  doc.text('SITUAÇÃO', colX, y); colX += colWidths.situacao;
  doc.text('ENT. 1', colX, y); colX += colWidths.entrada1;
  doc.text('SAÍ. 1', colX, y); colX += colWidths.saida1;
  doc.text('ENT. 2', colX, y); colX += colWidths.entrada2;
  doc.text('SAÍ. 2', colX, y); colX += colWidths.saida2;
  doc.text('TOTAL', colX, y); colX += colWidths.total;
  doc.text('OBSERVAÇÕES', colX, y);
  y += 6;

  // Linhas de dados
  const rowHeight = 4.8;
  doc.setFontSize(6.5);

  registrosDias.forEach((reg, index) => {
    y = checkPageBreak(doc, y, 30);

    // Alternar cor de fundo
    if (index % 2 === 0) {
      setColor(doc, { r: 252, g: 252, b: 252 }, 'fill');
      doc.rect(PAGINA.margemEsquerda, y - 3.2, contentWidth, rowHeight, 'F');
    }

    // Cor especial para dias não úteis
    if (reg.situacao !== 'util') {
      setColor(doc, { r: 245, g: 245, b: 220 }, 'fill');
      doc.rect(PAGINA.margemEsquerda, y - 3.2, contentWidth, rowHeight, 'F');
    }

    // Extrair dia/mês
    const diaNum = parseInt(reg.data.split('-')[2]);
    const mesNum = parseInt(reg.data.split('-')[1]);

    colX = PAGINA.margemEsquerda + 2;
    
    doc.setFont('helvetica', 'normal');
    setColor(doc, CORES.textoEscuro);
    doc.text(`${String(diaNum).padStart(2, '0')}/${String(mesNum).padStart(2, '0')}`, colX, y); 
    colX += colWidths.data;

    // Dia da semana
    setColor(doc, reg.situacao === 'sabado' || reg.situacao === 'domingo' ? CORES.cinzaMedio : CORES.textoEscuro);
    doc.text(DIAS_SEMANA_SIGLA[reg.dia_semana], colX, y); 
    colX += colWidths.dia;

    // Situação
    let situacaoText = '';
    switch (reg.situacao) {
      case 'util': situacaoText = 'Útil'; break;
      case 'sabado': situacaoText = 'Sábado'; break;
      case 'domingo': situacaoText = 'Domingo'; break;
      case 'feriado': situacaoText = 'Feriado'; break;
      case 'ponto_facultativo': situacaoText = 'Pt.Facult.'; break;
      case 'recesso': situacaoText = 'Recesso'; break;
      case 'expediente_reduzido': situacaoText = 'Exp.Red.'; break;
      default: situacaoText = reg.situacao;
    }
    
    // Cor por tipo de registro
    if (reg.tipo_registro === 'falta') {
      setColor(doc, CORES.erro);
      situacaoText = 'FALTA';
    } else if (reg.tipo_registro === 'atestado') {
      setColor(doc, { r: 255, g: 152, b: 0 });
      situacaoText = 'Atestado';
    } else if (reg.tipo_registro === 'ferias') {
      setColor(doc, { r: 33, g: 150, b: 243 });
      situacaoText = 'Férias';
    } else if (reg.tipo_registro === 'licenca') {
      setColor(doc, { r: 156, g: 39, b: 176 });
      situacaoText = 'Licença';
    } else {
      setColor(doc, CORES.cinzaMedio);
    }
    doc.text(situacaoText, colX, y); 
    colX += colWidths.situacao;

    // Horários
    setColor(doc, CORES.textoEscuro);
    doc.setFont('helvetica', 'normal');

    if (data.tipo === 'em_branco') {
      // Em branco: mostrar campos vazios apenas para dias úteis
      if (reg.situacao === 'util') {
        doc.text('____', colX + 2, y); colX += colWidths.entrada1;
        doc.text('____', colX + 2, y); colX += colWidths.saida1;
        doc.text('____', colX + 2, y); colX += colWidths.entrada2;
        doc.text('____', colX + 2, y); colX += colWidths.saida2;
        doc.text('____', colX, y); colX += colWidths.total;
      } else {
        // Dias não úteis: traços
        doc.text('-', colX + 4, y); colX += colWidths.entrada1;
        doc.text('-', colX + 4, y); colX += colWidths.saida1;
        doc.text('-', colX + 4, y); colX += colWidths.entrada2;
        doc.text('-', colX + 4, y); colX += colWidths.saida2;
        doc.text('-', colX + 2, y); colX += colWidths.total;
      }
    } else {
      // Preenchida: mostrar valores
      doc.text(reg.entrada_manha || '-', colX + 2, y); colX += colWidths.entrada1;
      doc.text(reg.saida_manha || '-', colX + 2, y); colX += colWidths.saida1;
      doc.text(reg.entrada_tarde || '-', colX + 2, y); colX += colWidths.entrada2;
      doc.text(reg.saida_tarde || '-', colX + 2, y); colX += colWidths.saida2;
      doc.text(formatarHoraMinuto(reg.total_horas), colX, y); colX += colWidths.total;
    }

    // Observações
    setColor(doc, CORES.cinzaMedio);
    const obsText = (reg.observacao || '').substring(0, 20);
    doc.text(obsText, colX, y);

    y += rowHeight;
  });

  // ============ RESUMO MENSAL ============
  y += 6;
  y = checkPageBreak(doc, y, 45);
  y = addSectionHeader(doc, 'RESUMO MENSAL', y);

  // Box de resumo
  setColor(doc, CORES.cinzaMuitoClaro, 'fill');
  doc.rect(PAGINA.margemEsquerda, y - 4, contentWidth, 32, 'F');

  const resumo = data.resumo || {
    dias_uteis: 0,
    dias_trabalhados: 0,
    dias_falta: 0,
    dias_abono: 0,
    dias_atestado: 0,
    dias_ferias: 0,
    dias_licenca: 0,
    horas_previstas: 0,
    horas_trabalhadas: 0,
    horas_abonadas: 0,
    horas_compensadas: 0,
    saldo_banco_horas: 0,
  };

  const boxWidth = contentWidth / 4;
  
  const drawResumoBox = (label: string, valor: string | number, x: number, yPos: number, highlight?: 'success' | 'danger' | 'warning') => {
    setColor(doc, CORES.cinzaMedio);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(label, x, yPos);

    if (highlight === 'success') setColor(doc, CORES.sucesso);
    else if (highlight === 'danger') setColor(doc, CORES.erro);
    else if (highlight === 'warning') setColor(doc, CORES.alerta);
    else setColor(doc, CORES.textoEscuro);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(String(valor), x, yPos + 5);
  };

  // Primeira linha: Dias
  let boxX = PAGINA.margemEsquerda + 5;
  let boxY = y + 2;
  drawResumoBox('Dias Úteis', resumo.dias_uteis, boxX, boxY); boxX += boxWidth;
  drawResumoBox('Dias Trabalhados', resumo.dias_trabalhados, boxX, boxY, 'success'); boxX += boxWidth;
  drawResumoBox('Faltas', resumo.dias_falta, boxX, boxY, resumo.dias_falta > 0 ? 'danger' : undefined); boxX += boxWidth;
  drawResumoBox('Abonos', resumo.dias_abono + resumo.dias_atestado, boxX, boxY);

  // Segunda linha: Horas
  boxX = PAGINA.margemEsquerda + 5;
  boxY += 14;
  drawResumoBox('Horas Previstas', formatarHoraMinuto(resumo.horas_previstas), boxX, boxY); boxX += boxWidth;
  drawResumoBox('Horas Trabalhadas', formatarHoraMinuto(resumo.horas_trabalhadas), boxX, boxY); boxX += boxWidth;
  drawResumoBox('Horas Abonadas', formatarHoraMinuto(resumo.horas_abonadas), boxX, boxY); boxX += boxWidth;
  
  const saldoHoras = resumo.saldo_banco_horas;
  drawResumoBox('Saldo Banco Horas', 
    (saldoHoras >= 0 ? '+' : '') + formatarHoraMinuto(Math.abs(saldoHoras)), 
    boxX, boxY, 
    saldoHoras > 0 ? 'success' : saldoHoras < 0 ? 'danger' : undefined
  );

  y += 36;

  // ============ ÁREA DE ASSINATURAS ============
  y = checkPageBreak(doc, y, 55);
  y = addSectionHeader(doc, 'ASSINATURAS', y);

  // Texto declaratório
  setColor(doc, CORES.cinzaMedio);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  const textoDeclaracao = data.configAssinatura.texto_declaracao || 
    'Declaro que as informações acima refletem fielmente a jornada de trabalho exercida no período.';
  
  const linhasDeclaracao = doc.splitTextToSize(textoDeclaracao, contentWidth - 10);
  doc.text(linhasDeclaracao, PAGINA.margemEsquerda + 5, y);
  y += linhasDeclaracao.length * 3.5 + 6;

  // Calcular quantas assinaturas
  const assinaturas: Array<{ label: string; nome?: string; cargo?: string }> = [];

  if (data.configAssinatura.servidor_obrigatoria) {
    assinaturas.push({ 
      label: 'Servidor(a)', 
      nome: data.servidor.nome_completo,
      cargo: data.servidor.cargo
    });
  }
  if (data.configAssinatura.chefia_obrigatoria) {
    assinaturas.push({ 
      label: 'Chefia Imediata', 
      nome: data.configAssinatura.nome_chefia,
      cargo: data.configAssinatura.cargo_chefia
    });
  }
  if (data.configAssinatura.rh_obrigatoria) {
    assinaturas.push({ 
      label: 'Recursos Humanos', 
      nome: data.configAssinatura.nome_rh,
      cargo: data.configAssinatura.cargo_rh
    });
  }

  // Desenhar áreas de assinatura
  const assinaturaWidth = (contentWidth - 20) / Math.max(assinaturas.length, 2);
  
  assinaturas.forEach((ass, idx) => {
    const assX = PAGINA.margemEsquerda + 5 + (idx * assinaturaWidth);
    
    // Linha para assinatura
    setColor(doc, CORES.cinzaMedio, 'draw');
    doc.setLineWidth(0.3);
    doc.line(assX, y + 12, assX + assinaturaWidth - 15, y + 12);

    // Label
    setColor(doc, CORES.textoEscuro);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(ass.label.toUpperCase(), assX, y + 16);

    // Nome e cargo (se disponíveis)
    if (ass.nome) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      setColor(doc, CORES.cinzaMedio);
      doc.text(ass.nome.substring(0, 30), assX, y + 20);
      if (ass.cargo) {
        doc.text(ass.cargo.substring(0, 25), assX, y + 23);
      }
    }

    // Campo de data
    doc.setFontSize(6);
    doc.text('Data: ___/___/______', assX, y + 28);
  });

  y += 35;

  // ============ RODAPÉ INSTITUCIONAL ============
  y = checkPageBreak(doc, y, 25);

  // Box de informações de geração
  setColor(doc, { r: 240, g: 245, b: 250 }, 'fill');
  doc.rect(PAGINA.margemEsquerda, y - 3, contentWidth, 14, 'F');

  setColor(doc, CORES.cinzaMedio);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');

  doc.text(`Documento gerado em: ${data.dataGeracao}`, PAGINA.margemEsquerda + 3, y + 2);
  doc.text(`Usuário: ${data.usuarioGeracao || 'Sistema'}`, PAGINA.margemEsquerda + 3, y + 6);
  doc.text(`Código de verificação: ${codigoVerificacao}`, PAGINA.margemEsquerda + 3, y + 10);

  // Aviso de documento
  setColor(doc, CORES.primaria);
  doc.setFont('helvetica', 'bold');
  doc.text(data.tipo === 'em_branco' 
    ? 'DOCUMENTO PARA PREENCHIMENTO MANUAL' 
    : 'DOCUMENTO OFICIAL - FREQUÊNCIA CONSOLIDADA', 
    width - PAGINA.margemDireita - 80, y + 6
  );

  // Footer institucional e paginação
  generateInstitutionalFooter(doc, { sistema: 'Sistema de Gestão de RH - IDJuv' });
  addPageNumbers(doc);

  // Salvar
  const nomeServidor = data.servidor.nome_completo.replace(/\s+/g, '_').substring(0, 20);
  const tipoSufixo = data.tipo === 'em_branco' ? '_BRANCO' : '';
  const nomeArquivo = `Frequencia_${nomeServidor}_${String(data.competencia.mes).padStart(2, '0')}-${data.competencia.ano}${tipoSufixo}.pdf`;
  
  doc.save(nomeArquivo);
};

// ============================================
// FUNÇÕES AUXILIARES PARA USO NA UI
// ============================================

/**
 * Gera lista de registros diários em branco para o mês
 */
export function gerarRegistrosDiariosBranco(
  ano: number, 
  mes: number, 
  diasNaoUteis: DiaNaoUtil[]
): RegistroDiario[] {
  const ultimoDia = getUltimoDiaMes(ano, mes);
  const registros: RegistroDiario[] = [];

  for (let dia = 1; dia <= ultimoDia; dia++) {
    const data = new Date(ano, mes - 1, dia);
    const dataStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const { situacao, label } = getSituacaoDia(data, diasNaoUteis);

    registros.push({
      data: dataStr,
      dia_semana: data.getDay(),
      situacao,
      situacao_label: label,
      observacao: label,
    });
  }

  return registros;
}

/**
 * Calcula resumo mensal a partir dos registros
 */
export function calcularResumoMensal(
  registros: RegistroDiario[], 
  cargaHorariaDiaria: number = 8
): ResumoFrequencia {
  let dias_uteis = 0;
  let dias_trabalhados = 0;
  let dias_falta = 0;
  let dias_abono = 0;
  let dias_atestado = 0;
  let dias_ferias = 0;
  let dias_licenca = 0;
  let horas_trabalhadas = 0;
  let horas_abonadas = 0;

  registros.forEach(reg => {
    if (reg.situacao === 'util') {
      dias_uteis++;

      if (reg.tipo_registro === 'normal' || reg.total_horas) {
        dias_trabalhados++;
        horas_trabalhadas += reg.total_horas || cargaHorariaDiaria;
      } else if (reg.tipo_registro === 'falta') {
        dias_falta++;
      } else if (reg.tipo_registro === 'atestado') {
        dias_atestado++;
        horas_abonadas += cargaHorariaDiaria;
      } else if (reg.tipo_registro === 'ferias') {
        dias_ferias++;
      } else if (reg.tipo_registro === 'licenca') {
        dias_licenca++;
      } else if (reg.tipo_registro === 'folga' || reg.tipo_registro === 'abono') {
        dias_abono++;
        horas_abonadas += cargaHorariaDiaria;
      }
    }
  });

  const horas_previstas = dias_uteis * cargaHorariaDiaria;

  return {
    dias_uteis,
    dias_trabalhados,
    dias_falta,
    dias_abono,
    dias_atestado,
    dias_ferias,
    dias_licenca,
    horas_previstas,
    horas_trabalhadas,
    horas_abonadas,
    horas_compensadas: 0,
    saldo_banco_horas: horas_trabalhadas - (horas_previstas - horas_abonadas),
  };
}
