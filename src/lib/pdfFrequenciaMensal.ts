/**
 * Geração de PDF da Frequência Mensal - VERSÃO SUPER SIMPLIFICADA
 */
import jsPDF from 'jspdf';
import { DIAS_SEMANA_SIGLA } from '@/types/frequencia';
import type { DiaNaoUtil } from '@/types/frequencia';

export interface ServidorFrequencia {
  id: string;
  nome_completo: string;
  matricula?: string;
  cargo?: string;
  unidade?: string;
  regime?: string;
  carga_horaria_diaria?: number;
  carga_horaria_semanal?: number;
}

export interface FrequenciaMensalPDFData {
  tipo: 'em_branco' | 'preenchida';
  competencia: { mes: number; ano: number };
  servidor: ServidorFrequencia;
  diasNaoUteis: DiaNaoUtil[];
  dataGeracao: string;
}

// MESES
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

// Função para gerar dias do mês
function gerarDiasMes(ano: number, mes: number, diasNaoUteis: DiaNaoUtil[]) {
  const ultimoDia = new Date(ano, mes, 0).getDate();
  const dias = [];
  
  for (let dia = 1; dia <= ultimoDia; dia++) {
    const data = new Date(ano, mes - 1, dia);
    const dataStr = `${ano}-${mes.toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`;
    const diaSemana = data.getDay();
    
    const diaNaoUtil = diasNaoUteis.find(d => d.data === dataStr);
    let tipoDia = '';
    
    if (diaNaoUtil) {
      tipoDia = diaNaoUtil.nome || 'Feriado';
    } else if (diaSemana === 0) {
      tipoDia = 'Domingo';
    } else if (diaSemana === 6) {
      tipoDia = 'Sábado';
    }
    
    dias.push({
      dia: dia.toString().padStart(2, '0'),
      semana: DIAS_SEMANA_SIGLA[diaSemana],
      tipo: tipoDia,
      data: dataStr
    });
  }
  
  return dias;
}

// VERSÃO SUPER SIMPLIFICADA - APENAS TEXTO
export const generateFrequenciaMensalPDF = async (data: FrequenciaMensalPDFData): Promise<{ doc: jsPDF; nomeArquivo: string }> => {
  // Criar documento
  const doc = new jsPDF();
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let y = 20;
  
  const competencia = `${MESES[data.competencia.mes - 1]} de ${data.competencia.ano}`;
  
  // Título
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('FOLHA DE FREQUÊNCIA MENSAL', pageWidth / 2, y, { align: 'center' });
  y += 10;
  
  // Instituição
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Instituto de Desporto, Juventude e Lazer do Estado de Roraima', pageWidth / 2, y, { align: 'center' });
  y += 6;
  doc.setFontSize(8);
  doc.text('CNPJ: 64.689.510/0001-09 | Rua Cel. Pinto, 588, Centro, Boa Vista/RR', pageWidth / 2, y, { align: 'center' });
  y += 15;
  
  // Linha
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;
  
  // Informações do Servidor
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMAÇÕES DO SERVIDOR', margin, y);
  y += 8;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Nome
  doc.setFont('helvetica', 'bold');
  doc.text('Nome:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.servidor.nome_completo, margin + 20, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Competência:', pageWidth - 60, y);
  doc.setFont('helvetica', 'normal');
  doc.text(competencia, pageWidth - 20, y, { align: 'right' });
  y += 6;
  
  // Matrícula e Cargo
  doc.setFont('helvetica', 'bold');
  doc.text('Matrícula:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.servidor.matricula || '---', margin + 25, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Cargo:', margin + 70, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.servidor.cargo || '---', margin + 85, y);
  y += 6;
  
  // Unidade e Jornada
  doc.setFont('helvetica', 'bold');
  doc.text('Unidade:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.servidor.unidade || '---', margin + 25, y);
  
  doc.setFont('helvetica', 'bold');
  doc.text('Jornada:', margin + 90, y);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.servidor.carga_horaria_diaria || 8}h/dia | ${data.servidor.carga_horaria_semanal || 40}h/sem`, margin + 110, y);
  y += 15;
  
  // Tabela de frequência
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('REGISTROS DIÁRIOS', margin, y);
  y += 8;
  
  // Cabeçalho da tabela
  doc.setFontSize(10);
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  
  // Colunas
  doc.text('DIA', margin + 10, y + 5);
  doc.text('SEMANA', margin + 30, y + 5);
  doc.text('TIPO', margin + 60, y + 5);
  doc.text('ENTRADA', margin + 100, y + 5);
  doc.text('SAÍDA', margin + 130, y + 5);
  doc.text('ASSINATURA', margin + 160, y + 5);
  
  y += 10;
  
  // Gerar dias
  const dias = gerarDiasMes(data.competencia.ano, data.competencia.mes, data.diasNaoUteis);
  
  // Linhas da tabela
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  for (let i = 0; i < dias.length; i++) {
    const dia = dias[i];
    
    // Cor de fundo alternada
    if (dia.tipo === 'Sábado' || dia.tipo === 'Domingo') {
      doc.setFillColor(250, 250, 250);
    } else if (i % 2 === 0) {
      doc.setFillColor(255, 255, 255);
    } else {
      doc.setFillColor(245, 245, 245);
    }
    
    doc.rect(margin, y, pageWidth - margin * 2, 7, 'F');
    
    // Dia
    doc.text(dia.dia, margin + 10, y + 5);
    
    // Semana
    doc.text(dia.semana, margin + 30, y + 5);
    
    // Tipo
    doc.text(dia.tipo, margin + 60, y + 5);
    
    // Entrada (linha para preencher)
    if (!dia.tipo) {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin + 100, y + 5, margin + 120, y + 5);
    } else {
      doc.text('—', margin + 110, y + 5);
    }
    
    // Saída (linha para preencher)
    if (!dia.tipo) {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin + 130, y + 5, margin + 150, y + 5);
    } else {
      doc.text('—', margin + 140, y + 5);
    }
    
    // Linha para assinatura (apenas dias úteis)
    if (!dia.tipo) {
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(margin + 160, y + 5, margin + 190, y + 5);
    }
    
    y += 7;
    
    // Quebra de página se necessário
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
  }
  
  y += 10;
  
  // Assinaturas
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('ASSINATURAS', margin, y);
  y += 8;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  // Linha servidor
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(margin, y + 5, margin + 80, y + 5);
  doc.text('Assinatura do Servidor', margin + 40, y + 10, { align: 'center' });
  doc.setFontSize(8);
  doc.text(data.servidor.nome_completo, margin + 40, y + 15, { align: 'center' });
  
  // Linha chefia
  doc.setLineWidth(0.5);
  doc.line(pageWidth - margin - 80, y + 5, pageWidth - margin, y + 5);
  doc.setFontSize(9);
  doc.text('Assinatura da Chefia', pageWidth - margin - 40, y + 10, { align: 'center' });
  
  y += 25;
  
  // Rodapé
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Gerado em: ${data.dataGeracao}`, margin, y);
  doc.text('IDJuv - Sistema de Gestão de Pessoas', pageWidth / 2, y, { align: 'center' });
  doc.text('Página 1', pageWidth - margin, y, { align: 'right' });
  
  // Nome do arquivo
  const nomeArquivo = `Frequencia_${data.servidor.nome_completo.replace(/\s+/g, '_').substring(0, 15)}_${data.competencia.mes.toString().padStart(2, '0')}-${data.competencia.ano}.pdf`;
  
  // Salvar
  doc.save(nomeArquivo);
  
  return { doc, nomeArquivo };
};

// Funções auxiliares exportadas
export function gerarRegistrosDiariosBranco(ano: number, mes: number, diasNaoUteis: DiaNaoUtil[]): any[] {
  return gerarDiasMes(ano, mes, diasNaoUteis);
}

export function calcularResumoMensal(registros: any[], cargaHorariaDiaria: number = 8): any {
  return {
    dias_uteis: registros.filter(r => !r.tipo).length,
    dias_trabalhados: 0,
    horas_previstas: 0,
    horas_trabalhadas: 0
  };
}

export const generateFrequenciaMensalBlob = async (data: FrequenciaMensalPDFData): Promise<{ blob: Blob; nomeArquivo: string }> => {
  const result = await generateFrequenciaMensalPDF(data);
  const blob = result.doc.output('blob');
  return { blob, nomeArquivo: result.nomeArquivo };
};
