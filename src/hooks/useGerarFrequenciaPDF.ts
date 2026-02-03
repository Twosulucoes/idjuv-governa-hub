/**
 * ============================================
 * HOOK DE GERAÇÃO DE PDF DE FREQUÊNCIA
 * ============================================
 * 
 * Hook que orquestra a geração de PDFs de frequência,
 * delegando a lógica de cálculo ao motor parametrizado.
 * 
 * FLUXO:
 * 1. Recebe parâmetros do servidor e período
 * 2. Busca configurações via frequenciaCalculoService
 * 3. Gera PDF usando pdfFrequenciaMensalGenerator
 * 
 * Este hook NÃO contém lógica de cálculo própria.
 * 
 * @author Sistema IDJUV
 * @version 2.0.0 - Refatorado para consumir motor parametrizado
 * @date 03/02/2026
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { 
  buscarConfigFrequenciaServidor,
  gerarRegistrosDiariosParametrizado 
} from '@/lib/frequenciaCalculoService';
import {
  generateFrequenciaMensalPDF,
  type FrequenciaMensalPDFData,
  type RegistroDiario,
} from '@/lib/pdfFrequenciaMensalGenerator';

interface GerarFrequenciaPDFParams {
  tipo: 'em_branco' | 'preenchida';
  servidor: {
    id: string;
    nome_completo: string;
    matricula?: string;
    cpf?: string;
    cargo?: string;
    funcao?: string;
    unidade?: string;
    carga_horaria_diaria?: number;
    carga_horaria_semanal?: number;
  };
  ano: number;
  mes: number;
  registrosPonto?: any[];
  diasNaoUteis?: any[];
  configAssinatura?: any;
  usuarioEmail?: string;
  incluirMetadados?: boolean;
  altaQualidade?: boolean;
}

interface ResultadoGeracaoPDF {
  sucesso: boolean;
  nomeArquivo: string;
  dados: {
    tipo: 'em_branco' | 'preenchida';
    servidor: any;
    ano: number;
    mes: number;
  };
}

/**
 * Hook para geração de PDF de frequência
 * Consome configurações do motor parametrizado (frequenciaCalculoService)
 */
export function useGerarFrequenciaPDF() {
  const [estaGerando, setEstaGerando] = useState(false);
  const [progresso, setProgresso] = useState(0);

  const atualizarProgresso = (etapa: number, totalEtapas: number) => {
    setProgresso(Math.round((etapa / totalEtapas) * 100));
  };

  const gerarPDF = async ({
    tipo,
    servidor,
    ano,
    mes,
    registrosPonto = [],
    diasNaoUteis = [],
    configAssinatura = {},
    usuarioEmail = 'Sistema',
    incluirMetadados = true,
    altaQualidade = false,
  }: GerarFrequenciaPDFParams): Promise<ResultadoGeracaoPDF> => {
    setEstaGerando(true);
    setProgresso(0);

    try {
      // =====================================================
      // ETAPA 1: Buscar configurações do motor parametrizado
      // =====================================================
      atualizarProgresso(1, 5);
      
      const config = await buscarConfigFrequenciaServidor(
        servidor.id,
        ano,
        mes,
        servidor.carga_horaria_diaria
      );

      // Log técnico se usou fallback
      if (config.usouFallback) {
        console.warn(
          '[GERARPDF] Usando fallback para:',
          config.fallbackDetalhes.join(', ')
        );
      }

      atualizarProgresso(2, 5);

      // =====================================================
      // ETAPA 2: Preparar registros diários
      // =====================================================
      let registros: RegistroDiario[] = [];
      
      if (tipo === 'em_branco') {
        // Gerar registros em branco usando o motor parametrizado
        const registrosCalculo = gerarRegistrosDiariosParametrizado(
          ano,
          mes,
          config.diasNaoUteis.length > 0 ? config.diasNaoUteis : diasNaoUteis,
          config.regime,
          config.jornada
        );
        
        // Converter para formato do PDF
        registros = registrosCalculo.map(r => ({
          data: r.data,
          dia_semana: r.diaSemana,
          situacao: r.situacao,
          label: r.label,
        }));
      } else {
        // Usar registros fornecidos (frequência preenchida)
        registros = registrosPonto.map(r => ({
          data: r.data,
          dia_semana: new Date(r.data).getDay(),
          situacao: r.tipo === 'normal' ? 'util' : r.tipo,
          entrada_manha: r.entrada1,
          saida_manha: r.saida1,
          entrada_tarde: r.entrada2,
          saida_tarde: r.saida2,
          total_horas: r.horas_trabalhadas,
          observacao: r.observacao,
          tipo_registro: r.tipo,
        }));
      }

      atualizarProgresso(3, 5);

      // =====================================================
      // ETAPA 3: Montar dados para o gerador de PDF
      // =====================================================
      const dataGeracao = new Date().toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Configuração de assinatura (usar do banco ou fallback)
      const configAssinaturaFinal = {
        servidor_obrigatoria: configAssinatura.servidor_obrigatoria ?? true,
        chefia_obrigatoria: configAssinatura.chefia_obrigatoria ?? true,
        rh_obrigatoria: configAssinatura.rh_obrigatoria ?? false,
        texto_declaracao: configAssinatura.texto_declaracao || 
          'Declaro que as informações acima são verdadeiras.',
        nome_chefia: configAssinatura.nome_chefia,
        cargo_chefia: configAssinatura.cargo_chefia,
      };

      const dadosPDF: FrequenciaMensalPDFData = {
        tipo,
        competencia: { mes, ano },
        servidor: {
          id: servidor.id,
          nome_completo: servidor.nome_completo,
          matricula: servidor.matricula || '',
          cpf: servidor.cpf,
          cargo: servidor.cargo,
          funcao: servidor.funcao,
          unidade: servidor.unidade,
          // Dados de jornada do motor parametrizado
          carga_horaria_diaria: config.jornada.carga_horaria_diaria,
          carga_horaria_semanal: config.jornada.carga_horaria_semanal,
          regime: config.regime.nome,
        },
        registros,
        diasNaoUteis: config.diasNaoUteis.length > 0 ? config.diasNaoUteis : diasNaoUteis,
        configAssinatura: configAssinaturaFinal,
        dataGeracao,
        usuarioGeracao: usuarioEmail,
      };

      atualizarProgresso(4, 5);

      // =====================================================
      // ETAPA 4: Gerar o PDF
      // =====================================================
      const { doc, nomeArquivo } = await generateFrequenciaMensalPDF(dadosPDF);
      
      // Fazer download do PDF
      doc.save(nomeArquivo);

      atualizarProgresso(5, 5);
      
      toast.success('PDF gerado com sucesso!');
      
      return {
        sucesso: true,
        nomeArquivo,
        dados: { tipo, servidor, ano, mes }
      };
      
    } catch (error) {
      console.error('[GERARPDF] Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF. Tente novamente.');
      throw error;
    } finally {
      setEstaGerando(false);
      setProgresso(0);
    }
  };

  return {
    gerarPDF,
    estaGerando,
    progresso,
  };
}
