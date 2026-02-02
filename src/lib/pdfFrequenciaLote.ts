/**
 * Geração de PDF em Lote de Frequência por Unidade Administrativa
 * 
 * REGRA DE OURO: USA EXATAMENTE O MESMO GERADOR INDIVIDUAL
 * - Capa opcional do lote
 * - Cada servidor = página gerada pela mesma função do individual
 * - ZERO código duplicado - 100% reutilização
 */
import jsPDF from 'jspdf';
import type { DiaNaoUtil } from '@/types/frequencia';
import type { ServidorComSituacao } from '@/hooks/useServidoresPorUnidade';
import { 
  renderizarPaginaFrequencia,
  gerarRegistrosDiariosBranco,
  MESES,
  INSTITUICAO,
  CORES,
  type FrequenciaMensalPDFData,
  type ConfigAssinatura 
} from './pdfFrequenciaMensalGenerator';

// Importar logos para a capa
import logoGoverno from '@/assets/logo-governo-roraima.jpg';
import logoIdjuv from '@/assets/logo-idjuv-oficial.png';
import { getLogosPDF } from './pdfLogos';

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
 * Gera o PDF em lote USANDO EXATAMENTE a mesma função do individual
 */
export const generateFrequenciaLotePDFInternal = async (config: LoteFrequenciaPDFConfig): Promise<FrequenciaLotePDFResult> => {
  const { unidade, competencia, servidores, diasNaoUteis, configAssinatura, opcoes, dataGeracao, usuarioGeracao } = config;
  const competenciaStr = `${MESES[competencia.mes - 1]} de ${competencia.ano}`;

  const doc = new jsPDF('portrait', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // =========================================================
  // CAPA DO LOTE (OPCIONAL)
  // =========================================================
  if (opcoes.incluirCapa) {
    gerarCapaLote(doc, {
      unidade,
      competenciaStr,
      totalServidores: servidores.length,
      dataGeracao,
      usuarioGeracao,
      pageWidth,
      pageHeight,
      margin,
      contentWidth,
    });
  }

  // =========================================================
  // GERAR CADA PÁGINA USANDO A MESMA FUNÇÃO DO INDIVIDUAL
  // =========================================================
  for (let index = 0; index < servidores.length; index++) {
    const servidor = servidores[index];
    
    // Adicionar nova página (exceto para o primeiro servidor se não tem capa)
    if (opcoes.incluirCapa || index > 0) {
      doc.addPage();
    }

    // Converter para o formato do gerador individual
    const configAssinaturaIndividual: ConfigAssinatura = {
      servidor_obrigatoria: configAssinatura.servidor_obrigatoria,
      chefia_obrigatoria: configAssinatura.chefia_obrigatoria,
      rh_obrigatoria: configAssinatura.rh_obrigatoria,
      texto_declaracao: configAssinatura.texto_declaracao,
      nome_chefia: configAssinatura.nome_chefia,
      cargo_chefia: configAssinatura.cargo_chefia,
    };

    // Preparar dados no formato EXATO do gerador individual
    const dadosIndividual: FrequenciaMensalPDFData = {
      tipo: 'em_branco',
      competencia,
      servidor: {
        id: servidor.id,
        nome_completo: servidor.nome_completo,
        matricula: servidor.matricula || '',
        cpf: servidor.cpf,
        cargo: servidor.cargo_nome,
        unidade: servidor.unidade_sigla 
          ? `${servidor.unidade_sigla} - ${servidor.unidade_nome || ''}`
          : servidor.unidade_nome,
        regime: servidor.regime || 'Presencial',
        carga_horaria_diaria: servidor.carga_horaria_diaria || 8,
        carga_horaria_semanal: servidor.carga_horaria_semanal || 40,
      },
      registros: gerarRegistrosDiariosBranco(competencia.ano, competencia.mes, diasNaoUteis),
      diasNaoUteis,
      configAssinatura: configAssinaturaIndividual,
      dataGeracao,
      usuarioGeracao,
    };

    // Usar a MESMA função de renderização do individual
    renderizarPaginaFrequencia({
      doc,
      data: dadosIndividual,
      rodapePersonalizado: `Página ${index + 1} de ${servidores.length}`,
    });
  }

  const sigla = unidade.sigla || unidade.nome.substring(0, 10);
  const nomeArquivo = `Frequencia_Lote_${sigla}_${String(competencia.mes).padStart(2, '0')}-${competencia.ano}.pdf`;

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

// ============================================
// CAPA DO LOTE
// ============================================

interface CapaParams {
  unidade: { nome: string; sigla?: string };
  competenciaStr: string;
  totalServidores: number;
  dataGeracao: string;
  usuarioGeracao?: string;
  pageWidth: number;
  pageHeight: number;
  margin: number;
  contentWidth: number;
}

function gerarCapaLote(doc: jsPDF, params: CapaParams) {
  const { unidade, competenciaStr, totalServidores, dataGeracao, usuarioGeracao, pageWidth, pageHeight, margin, contentWidth } = params;

  const logos = getLogosPDF(20);
  let y = margin;

  try {
    doc.addImage(logoGoverno, 'JPEG', margin, y, logos.governo.width, logos.governo.height);
    doc.addImage(logoIdjuv, 'PNG', pageWidth - margin - logos.idjuv.width, y, logos.idjuv.width, logos.idjuv.height);
  } catch (e) {
    console.warn('Logos não carregados');
  }

  const textCenterY = y + logos.altura / 2;
  
  doc.setTextColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('GOVERNO DO ESTADO DE RORAIMA', pageWidth / 2, textCenterY - 4, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setTextColor(CORES.texto.r, CORES.texto.g, CORES.texto.b);
  doc.text(INSTITUICAO.nome, pageWidth / 2, textCenterY + 3, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(CORES.textoSecundario.r, CORES.textoSecundario.g, CORES.textoSecundario.b);
  doc.text(`CNPJ: ${INSTITUICAO.cnpj}`, pageWidth / 2, textCenterY + 9, { align: 'center' });

  y = margin + logos.altura + 8;

  doc.setDrawColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
  doc.setLineWidth(0.8);
  doc.line(margin + 20, y, pageWidth - margin - 20, y);

  y += 25;
  doc.setTextColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('FOLHAS DE FREQUÊNCIA MENSAL', pageWidth / 2, y, { align: 'center' });

  y += 12;
  doc.setFontSize(16);
  doc.setTextColor(CORES.texto.r, CORES.texto.g, CORES.texto.b);
  doc.text('LOTE POR UNIDADE ADMINISTRATIVA', pageWidth / 2, y, { align: 'center' });

  y += 30;
  const boxHeight = 75;
  doc.setFillColor(CORES.bgCinza.r, CORES.bgCinza.g, CORES.bgCinza.b);
  doc.setDrawColor(CORES.primaria.r, CORES.primaria.g, CORES.primaria.b);
  doc.setLineWidth(0.5);
  doc.roundedRect(margin + 20, y, contentWidth - 40, boxHeight, 4, 4, 'FD');

  const labelX = margin + 35;
  const valueX = margin + 95;
  let infoY = y + 18;
  
  doc.setFontSize(11);
  doc.setTextColor(CORES.texto.r, CORES.texto.g, CORES.texto.b);
  
  doc.setFont('helvetica', 'bold');
  doc.text('UNIDADE:', labelX, infoY);
  doc.setFont('helvetica', 'normal');
  const unidadeText = unidade.sigla ? `${unidade.sigla} - ${unidade.nome}` : unidade.nome;
  const unidadeDisplay = unidadeText.length > 55 ? unidadeText.substring(0, 52) + '...' : unidadeText;
  doc.text(unidadeDisplay, valueX, infoY);

  infoY += 14;
  doc.setFont('helvetica', 'bold');
  doc.text('COMPETÊNCIA:', labelX, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(competenciaStr, valueX, infoY);

  infoY += 14;
  doc.setFont('helvetica', 'bold');
  doc.text('SERVIDORES:', labelX, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(`${totalServidores} folha${totalServidores !== 1 ? 's' : ''} de frequência`, valueX, infoY);

  infoY += 14;
  doc.setFont('helvetica', 'bold');
  doc.text('EMISSÃO:', labelX, infoY);
  doc.setFont('helvetica', 'normal');
  doc.text(dataGeracao, valueX, infoY);

  y += boxHeight + 25;
  doc.setFontSize(10);
  doc.setTextColor(CORES.textoSecundario.r, CORES.textoSecundario.g, CORES.textoSecundario.b);
  doc.setFont('helvetica', 'italic');
  doc.text('Este lote contém as folhas de frequência individuais de cada servidor da unidade.', pageWidth / 2, y, { align: 'center' });
  y += 6;
  doc.text('Cada servidor ocupa exatamente uma página para fins de arquivo e auditoria.', pageWidth / 2, y, { align: 'center' });

  doc.setTextColor(CORES.textoSecundario.r, CORES.textoSecundario.g, CORES.textoSecundario.b);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Gerado por: ${usuarioGeracao || 'Sistema'}`, margin, pageHeight - 15);
  doc.text(`${INSTITUICAO.sigla} - Sistema de Gestão de Pessoas`, pageWidth / 2, pageHeight - 15, { align: 'center' });
  doc.text('Capa do Lote', pageWidth - margin, pageHeight - 15, { align: 'right' });
}
