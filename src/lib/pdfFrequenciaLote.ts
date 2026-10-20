/**
 * ============================================
 * GERAÇÃO DE PDF EM LOTE DE FREQUÊNCIA - MODELO OFICIAL
 * ============================================
 *
 * CAMADA DE APRESENTAÇÃO - REUTILIZA A FOLHA INDIVIDUAL
 *
 * Este módulo NÃO contém lógica de cálculo própria. Cada servidor vira uma folha do mesmo modelo da
 * frequência individual (`rh-folha-frequencia`, motor único `src/lib/documentos/`), uma por página,
 * com capa opcional. A decisão de um ou dois turnos é do motor parametrizado
 * (`src/lib/frequenciaCalculoService.ts`), aplicada em `paraFolhaFrequencia`.
 */
import type jsPDF from 'jspdf';
import type { DiaNaoUtil } from '@/types/frequencia';
import type { ServidorComSituacao } from '@/hooks/useServidoresPorUnidade';
import { emitirDocumento, localDaSede } from '@/lib/documentos';
import {
  gerarRegistrosDiariosBranco,
  paraFolhaFrequencia,
  type FrequenciaMensalPDFData,
  type ConfigAssinatura,
} from './pdfFrequenciaMensalGenerator';

// ============================================
// INTERFACES
// ============================================

export interface ConfigAssinaturaLote {
  servidor_obrigatoria: boolean;
  chefia_obrigatoria: boolean;
  rh_obrigatoria: boolean;
  texto_declaracao: string;
  nome_chefia?: string;
  cargo_chefia?: string;
}

export interface LoteFrequenciaPDFConfig {
  unidade: {
    id: string;
    nome: string;
    sigla?: string;
  };
  competencia: { mes: number; ano: number };
  servidores: ServidorComSituacao[];
  diasNaoUteis: DiaNaoUtil[];
  configAssinatura: ConfigAssinaturaLote;
  opcoes: {
    incluirCapa: boolean;
    ordenacao: 'alfabetica' | 'matricula';
  };
  dataGeracao: string;
  usuarioGeracao?: string;
}

export interface FrequenciaLotePDFResult {
  doc: jsPDF;
  nomeArquivo: string;
}

/**
 * Gera o PDF em lote com a MESMA folha do individual (em branco, um servidor por página).
 *
 * IMPORTANTE: Este método não faz cálculos próprios.
 * Os dados de jornada/turnos vêm dos dados do servidor,
 * que devem ser calculados previamente pelo motor parametrizado.
 */
export const generateFrequenciaLotePDFInternal = async (config: LoteFrequenciaPDFConfig): Promise<FrequenciaLotePDFResult> => {
  const { unidade, competencia, servidores, diasNaoUteis, configAssinatura, opcoes, dataGeracao, usuarioGeracao } = config;

  const configAssinaturaIndividual: ConfigAssinatura = {
    servidor_obrigatoria: configAssinatura.servidor_obrigatoria,
    chefia_obrigatoria: configAssinatura.chefia_obrigatoria,
    rh_obrigatoria: configAssinatura.rh_obrigatoria,
    texto_declaracao: configAssinatura.texto_declaracao,
    nome_chefia: configAssinatura.nome_chefia,
    cargo_chefia: configAssinatura.cargo_chefia,
  };

  // Mesmo formato do gerador individual. carga_horaria_diaria vem do cadastro do servidor;
  // a decisão de 1 ou 2 turnos é feita em paraFolhaFrequencia (verificarDoisTurnos).
  const folhas = servidores.map((servidor) => {
    const dadosIndividual: FrequenciaMensalPDFData = {
      tipo: 'em_branco',
      competencia,
      servidor: {
        id: servidor.id,
        nome_completo: servidor.nome_completo,
        matricula: servidor.matricula || '',
        cpf: servidor.cpf,
        cargo: servidor.cargo_nome,
        funcao: '', // Campo opcional
        categoria: '', // Campo opcional
        telefone: '', // Campo opcional
        unidade: servidor.unidade_sigla
          ? `${servidor.unidade_sigla} - ${servidor.unidade_nome || ''}`
          : servidor.unidade_nome,
        regime: servidor.regime || 'Presencial',
        carga_horaria_diaria: servidor.carga_horaria_diaria || 8,
        carga_horaria_semanal: servidor.carga_horaria_semanal || 40,
        frequencia_integral: true,
      },
      registros: gerarRegistrosDiariosBranco(competencia.ano, competencia.mes, diasNaoUteis),
      diasNaoUteis,
      configAssinatura: configAssinaturaIndividual,
      dataGeracao,
      usuarioGeracao,
    };
    return paraFolhaFrequencia(dadosIndividual);
  });

  const { doc, nomeArquivo } = await emitirDocumento(
    'rh-folha-frequencia',
    {
      tipo: 'em_branco',
      competencia,
      local: localDaSede(),
      servidores: folhas,
      lote: { unidade: { nome: unidade.nome, sigla: unidade.sigla }, capa: opcoes.incluirCapa, dataGeracao },
    },
    { emitidoPor: usuarioGeracao },
  );
  return { doc, nomeArquivo };
};

/**
 * Gera e faz download do PDF em lote
 */
export const generateFrequenciaLotePDF = async (config: LoteFrequenciaPDFConfig): Promise<void> => {
  const { doc, nomeArquivo } = await generateFrequenciaLotePDFInternal(config);
  doc.save(nomeArquivo);
};

/**
 * Gera o PDF e retorna como Blob para upload
 */
export const generateFrequenciaLoteBlob = async (config: LoteFrequenciaPDFConfig): Promise<{ blob: Blob; nomeArquivo: string }> => {
  const { doc, nomeArquivo } = await generateFrequenciaLotePDFInternal(config);
  const blob = doc.output('blob');
  return { blob, nomeArquivo };
};
