/**
 * Folha individual de presença do servidor (frequência mensal, em branco ou preenchida).
 *
 * O PDF sai do motor único (`src/lib/documentos/`, modelo `rh-folha-frequencia`). Aqui ficam os tipos
 * usados pelas telas, as regras de calendário (`gerarRegistrosDiariosBranco`, `calcularResumoMensal`) e a
 * conversão dos dados da tela para o modelo. CAMADA DE APRESENTAÇÃO - NÃO CONTÉM LÓGICA DE CÁLCULO de
 * jornada: a decisão de um ou dois turnos vem do motor parametrizado (`verificarDoisTurnos`).
 */
import type jsPDF from 'jspdf';
import type { DiaNaoUtil } from '@/types/frequencia';
import { verificarDoisTurnos } from '@/lib/frequenciaCalculoService';
import { emitirDocumento, localDaSede } from '@/lib/documentos';
import type { DiaFolhaFrequencia, ServidorFolhaFrequencia } from '@/lib/documentos/modelos/rh/folhaFrequencia';

// ============================================
// INTERFACES
// ============================================

export interface RegistroDiario {
  data: string;
  dia_semana: number;
  situacao: 'util' | 'feriado' | 'domingo' | 'sabado' | 'ponto_facultativo' | 'recesso' | 'licenca' | 'ferias';
  label?: string;
  entrada_manha?: string;
  saida_manha?: string;
  entrada_tarde?: string;
  saida_tarde?: string;
  total_horas?: number;
  observacao?: string;
  tipo_registro?: string;
}

export interface ResumoMensal {
  dias_uteis: number;
  dias_trabalhados: number;
  horas_previstas: number;
  horas_trabalhadas: number;
  faltas: number;
  atrasos: number;
  horas_extras: number;
}

export interface ConfigAssinatura {
  servidor_obrigatoria: boolean;
  chefia_obrigatoria: boolean;
  rh_obrigatoria: boolean;
  texto_declaracao: string;
  nome_chefia?: string;
  cargo_chefia?: string;
}

export interface FrequenciaMensalPDFData {
  tipo: 'em_branco' | 'preenchida';
  competencia: { mes: number; ano: number };
  servidor: {
    id: string;
    nome_completo: string;
    matricula: string;
    cpf?: string;
    cargo?: string;
    funcao?: string;
    unidade?: string;
    categoria?: string;
    telefone?: string;
    regime?: string;
    carga_horaria_diaria?: number;
    carga_horaria_semanal?: number;
    frequencia_integral?: boolean;
  };
  registros?: RegistroDiario[];
  resumo?: ResumoMensal;
  diasNaoUteis: DiaNaoUtil[];
  configAssinatura: ConfigAssinatura;
  statusPeriodo?: {
    status: string;
  };
  dataGeracao: string;
  usuarioGeracao?: string;
}

// ============================================
// HELPERS
// ============================================

function getUltimoDiaMes(ano: number, mes: number): number {
  return new Date(ano, mes, 0).getDate();
}

function getSituacaoDia(data: Date, diasNaoUteis: DiaNaoUtil[]): { situacao: string; label?: string } {
  const diaSemana = data.getDay();
  const dataStr = data.toISOString().split('T')[0];

  const diaNaoUtil = diasNaoUteis.find(d => d.data === dataStr && d.ativo);
  if (diaNaoUtil) {
    const tipo = diaNaoUtil.tipo;
    const isFeriado = tipo.includes('feriado');
    return { situacao: isFeriado ? 'feriado' : tipo, label: diaNaoUtil.nome };
  }

  if (diaSemana === 0) return { situacao: 'domingo' };
  if (diaSemana === 6) return { situacao: 'sabado' };
  return { situacao: 'util' };
}

// ============================================
// FUNÇÕES AUXILIARES DE GERAÇÃO
// ============================================

export function gerarRegistrosDiariosBranco(
  ano: number, 
  mes: number, 
  diasNaoUteis: DiaNaoUtil[]
): RegistroDiario[] {
  const registros: RegistroDiario[] = [];
  const ultimoDia = getUltimoDiaMes(ano, mes);

  for (let dia = 1; dia <= ultimoDia; dia++) {
    const data = new Date(ano, mes - 1, dia);
    const dataStr = `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    const { situacao, label } = getSituacaoDia(data, diasNaoUteis);

    registros.push({
      data: dataStr,
      dia_semana: data.getDay(),
      situacao: situacao as RegistroDiario['situacao'],
      label,
    });
  }

  return registros;
}

/**
 * @deprecated Use calcularResumoMensalParametrizado do frequenciaCalculoService
 */
export function calcularResumoMensal(registros: RegistroDiario[], cargaHorariaDiaria: number): ResumoMensal {
  const diasUteis = registros.filter(r => r.situacao === 'util').length;
  const diasTrabalhados = registros.filter(r => r.total_horas && r.total_horas > 0).length;
  const horasPrevistas = diasUteis * cargaHorariaDiaria;
  const horasTrabalhadas = registros.reduce((acc, r) => acc + (r.total_horas || 0), 0);
  
  return {
    dias_uteis: diasUteis,
    dias_trabalhados: diasTrabalhados,
    horas_previstas: horasPrevistas,
    horas_trabalhadas: horasTrabalhadas,
    faltas: diasUteis - diasTrabalhados,
    atrasos: 0,
    horas_extras: Math.max(0, horasTrabalhadas - horasPrevistas),
  };
}

// ============================================
// CONVERSÃO PARA O MODELO DO MOTOR ÚNICO
// ============================================

/**
 * Dados da tela → uma folha do modelo `rh-folha-frequencia`. Mesma regra da folha antiga: a situação do
 * dia vem do calendário e é trocada pela do registro quando este não é dia útil; horários só na preenchida.
 */
export function paraFolhaFrequencia(data: FrequenciaMensalPDFData): ServidorFolhaFrequencia {
  const { tipo, competencia, servidor, diasNaoUteis } = data;
  const registros = data.registros || gerarRegistrosDiariosBranco(competencia.ano, competencia.mes, diasNaoUteis);
  const cargaHorariaDiaria = servidor.carga_horaria_diaria || 8;
  const dias: DiaFolhaFrequencia[] = [];

  for (let dia = 1; dia <= getUltimoDiaMes(competencia.ano, competencia.mes); dia++) {
    const dataAtual = new Date(competencia.ano, competencia.mes - 1, dia);
    const base = getSituacaoDia(dataAtual, diasNaoUteis);
    let situacao = base.situacao;
    let rotulo = base.label || '';
    const registro = registros.find((r) => parseInt(r.data.split('-')[2], 10) === dia);
    if (registro && registro.situacao !== 'util') {
      situacao = registro.situacao;
      rotulo = registro.label || '';
    }
    const horarios =
      tipo === 'preenchida' && registro && situacao === 'util'
        ? { entrada1: registro.entrada_manha, saida1: registro.saida_manha, entrada2: registro.entrada_tarde, saida2: registro.saida_tarde }
        : {};
    dias.push({ dia, diaSemana: dataAtual.getDay(), situacao, rotulo: rotulo || undefined, ...horarios });
  }

  return {
    nome: servidor.nome_completo || '',
    matricula: servidor.matricula,
    cargo: servidor.cargo,
    funcao: servidor.funcao,
    unidade: servidor.unidade,
    cargaHorariaDiaria,
    cargaHorariaSemanal: servidor.carga_horaria_semanal || 40,
    doisTurnos: verificarDoisTurnos(cargaHorariaDiaria),
    dias,
  };
}

// ============================================
// GERADOR DO PDF INDIVIDUAL
// ============================================

export interface FrequenciaMensalPDFResult {
  doc: jsPDF;
  nomeArquivo: string;
}

/**
 * Gera o PDF de frequência mensal individual
 */
export async function generateFrequenciaMensalPDF(data: FrequenciaMensalPDFData): Promise<FrequenciaMensalPDFResult> {
  const { doc, nomeArquivo } = await emitirDocumento(
    'rh-folha-frequencia',
    { tipo: data.tipo, competencia: data.competencia, local: localDaSede(), servidores: [paraFolhaFrequencia(data)] },
    { emitidoPor: data.usuarioGeracao },
  );
  return { doc, nomeArquivo };
}

/**
 * Gera o PDF e retorna como Blob para upload
 */
export async function generateFrequenciaMensalBlob(
  data: FrequenciaMensalPDFData
): Promise<{ blob: Blob; nomeArquivo: string }> {
  const { doc, nomeArquivo } = await generateFrequenciaMensalPDF(data);
  const blob = doc.output('blob');
  return { blob, nomeArquivo };
}
