// ============================================================================
// HOOK: useConfigVidaFuncional
// Consumo de configurações de Vida Funcional com fallback para valores locais
// ============================================================================

import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useConfigParametros } from './useConfigParametros';

// ============================================================================
// FALLBACK: Valores hardcoded originais (para transição segura)
// ============================================================================

const FALLBACK_TIPOS_SERVIDOR = {
  efetivo_idjuv: {
    codigo: 'efetivo_idjuv',
    nome: 'Efetivo do IDJuv',
    descricao: 'Servidor efetivo do quadro permanente do IDJuv',
    cor_classe: 'bg-success/20 text-success border-success/30',
    permite_cargo: true,
    tipos_cargo_permitidos: ['efetivo'],
    permite_lotacao_interna: true,
    permite_lotacao_externa: false,
    requer_provimento: true,
    requer_orgao_origem: false,
    requer_orgao_destino: false,
  },
  comissionado_idjuv: {
    codigo: 'comissionado_idjuv',
    nome: 'Comissionado do IDJuv',
    descricao: 'Servidor comissionado do IDJuv',
    cor_classe: 'bg-primary/20 text-primary border-primary/30',
    permite_cargo: true,
    tipos_cargo_permitidos: ['comissionado'],
    permite_lotacao_interna: true,
    permite_lotacao_externa: false,
    requer_provimento: true,
    requer_orgao_origem: false,
    requer_orgao_destino: false,
  },
  cedido_entrada: {
    codigo: 'cedido_entrada',
    nome: 'Cedido de Outro Órgão (Entrada)',
    descricao: 'Servidor cedido de outro órgão para o IDJuv',
    cor_classe: 'bg-info/20 text-info border-info/30',
    permite_cargo: false,
    tipos_cargo_permitidos: [],
    permite_lotacao_interna: true,
    permite_lotacao_externa: false,
    requer_provimento: false,
    requer_orgao_origem: true,
    requer_orgao_destino: false,
  },
  cedido_saida: {
    codigo: 'cedido_saida',
    nome: 'Cedido para Outro Órgão (Saída)',
    descricao: 'Servidor efetivo do IDJuv cedido para outro órgão',
    cor_classe: 'bg-warning/20 text-warning border-warning/30',
    permite_cargo: true,
    tipos_cargo_permitidos: ['efetivo'],
    permite_lotacao_interna: false,
    permite_lotacao_externa: true,
    requer_provimento: false,
    requer_orgao_origem: false,
    requer_orgao_destino: true,
  },
};

const FALLBACK_SITUACOES = {
  ativo: { codigo: 'ativo', nome: 'Ativo', cor_classe: 'bg-success/20 text-success border-success/30' },
  afastado: { codigo: 'afastado', nome: 'Afastado', cor_classe: 'bg-warning/20 text-warning border-warning/30' },
  cedido: { codigo: 'cedido', nome: 'Cedido', cor_classe: 'bg-info/20 text-info border-info/30' },
  licenca: { codigo: 'licenca', nome: 'Licença', cor_classe: 'bg-warning/20 text-warning border-warning/30' },
  ferias: { codigo: 'ferias', nome: 'Férias', cor_classe: 'bg-primary/20 text-primary border-primary/30' },
  exonerado: { codigo: 'exonerado', nome: 'Exonerado', cor_classe: 'bg-destructive/20 text-destructive border-destructive/30' },
  aposentado: { codigo: 'aposentado', nome: 'Aposentado', cor_classe: 'bg-muted text-muted-foreground border-muted' },
  falecido: { codigo: 'falecido', nome: 'Falecido', cor_classe: 'bg-muted text-muted-foreground border-muted' },
};

const FALLBACK_MOTIVOS = [
  { codigo: 'exoneracao', nome: 'Exoneração' },
  { codigo: 'termino_mandato', nome: 'Término de Mandato' },
  { codigo: 'cessao_comissionado', nome: 'Cessão (Comissionado)' },
  { codigo: 'aposentadoria', nome: 'Aposentadoria' },
  { codigo: 'falecimento', nome: 'Falecimento' },
  { codigo: 'demissao', nome: 'Demissão' },
];

const FALLBACK_TIPOS_ATO = [
  { codigo: 'portaria', nome: 'Portaria' },
  { codigo: 'decreto', nome: 'Decreto' },
  { codigo: 'lei', nome: 'Lei' },
  { codigo: 'resolucao', nome: 'Resolução' },
];

const FALLBACK_TIPOS_ONUS = [
  { codigo: 'origem', nome: 'Ônus do Órgão de Origem' },
  { codigo: 'destino', nome: 'Ônus do Órgão de Destino' },
  { codigo: 'compartilhado', nome: 'Ônus Compartilhado' },
];

// ============================================================================
// TIPOS
// ============================================================================

export interface TipoServidorConfig {
  id?: string;
  codigo: string;
  nome: string;
  descricao?: string;
  cor_classe: string;
  permite_cargo: boolean;
  tipos_cargo_permitidos: string[];
  permite_lotacao_interna: boolean;
  permite_lotacao_externa: boolean;
  requer_provimento: boolean;
  requer_orgao_origem: boolean;
  requer_orgao_destino: boolean;
}

export interface SituacaoFuncionalConfig {
  id?: string;
  codigo: string;
  nome: string;
  descricao?: string;
  cor_classe: string;
  permite_trabalho?: boolean;
  permite_remuneracao?: boolean;
  situacao_final?: boolean;
}

export interface MotivoDesligamentoConfig {
  id?: string;
  codigo: string;
  nome: string;
  descricao?: string;
}

export interface TipoAtoConfig {
  id?: string;
  codigo: string;
  nome: string;
  sigla?: string;
}

export interface TipoOnusConfig {
  id?: string;
  codigo: string;
  nome: string;
}

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function useConfigVidaFuncional() {
  const { obterInstituicao } = useConfigParametros();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usandoFallback, setUsandoFallback] = useState(false);
  
  // Estado para dados do banco
  const [tiposServidor, setTiposServidor] = useState<Record<string, TipoServidorConfig>>(FALLBACK_TIPOS_SERVIDOR);
  const [situacoes, setSituacoes] = useState<Record<string, SituacaoFuncionalConfig>>(FALLBACK_SITUACOES);
  const [motivosDesligamento, setMotivosDesligamento] = useState<MotivoDesligamentoConfig[]>(FALLBACK_MOTIVOS);
  const [tiposAto, setTiposAto] = useState<TipoAtoConfig[]>(FALLBACK_TIPOS_ATO);
  const [tiposOnus, setTiposOnus] = useState<TipoOnusConfig[]>(FALLBACK_TIPOS_ONUS);

  /**
   * Carrega todas as configurações de Vida Funcional do banco
   */
  const carregarConfiguracoes = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const instituicao = await obterInstituicao('IDJUV');
      
      if (!instituicao) {
        console.warn('Instituição IDJUV não encontrada, usando fallback');
        setUsandoFallback(true);
        return;
      }

      // Carregar tipos de servidor
      const { data: tiposServidorData, error: tsError } = await supabase
        .from('config_tipos_servidor')
        .select('*')
        .eq('instituicao_id', instituicao.id)
        .eq('ativo', true)
        .order('ordem');

      if (tsError) {
        console.warn('Erro ao carregar tipos_servidor, usando fallback:', tsError.message);
      } else if (tiposServidorData && tiposServidorData.length > 0) {
        const tiposMap: Record<string, TipoServidorConfig> = {};
        tiposServidorData.forEach(t => {
          tiposMap[t.codigo] = {
            id: t.id,
            codigo: t.codigo,
            nome: t.nome,
            descricao: t.descricao || undefined,
            cor_classe: t.cor_classe || 'bg-muted text-muted-foreground border-muted',
            permite_cargo: t.permite_cargo,
            tipos_cargo_permitidos: t.tipos_cargo_permitidos || [],
            permite_lotacao_interna: t.permite_lotacao_interna,
            permite_lotacao_externa: t.permite_lotacao_externa,
            requer_provimento: t.requer_provimento,
            requer_orgao_origem: t.requer_orgao_origem,
            requer_orgao_destino: t.requer_orgao_destino,
          };
        });
        setTiposServidor(tiposMap);
      }

      // Carregar situações funcionais
      const { data: situacoesData, error: sfError } = await supabase
        .from('config_situacoes_funcionais')
        .select('*')
        .eq('instituicao_id', instituicao.id)
        .eq('ativo', true)
        .order('ordem');

      if (sfError) {
        console.warn('Erro ao carregar situacoes_funcionais, usando fallback:', sfError.message);
      } else if (situacoesData && situacoesData.length > 0) {
        const situacoesMap: Record<string, SituacaoFuncionalConfig> = {};
        situacoesData.forEach(s => {
          situacoesMap[s.codigo] = {
            id: s.id,
            codigo: s.codigo,
            nome: s.nome,
            descricao: s.descricao || undefined,
            cor_classe: s.cor_classe || 'bg-muted text-muted-foreground border-muted',
            permite_trabalho: s.permite_trabalho,
            permite_remuneracao: s.permite_remuneracao,
            situacao_final: s.situacao_final,
          };
        });
        setSituacoes(situacoesMap);
      }

      // Carregar motivos de desligamento
      const { data: motivosData, error: mdError } = await supabase
        .from('config_motivos_desligamento')
        .select('*')
        .eq('instituicao_id', instituicao.id)
        .eq('ativo', true)
        .order('ordem');

      if (mdError) {
        console.warn('Erro ao carregar motivos_desligamento, usando fallback:', mdError.message);
      } else if (motivosData && motivosData.length > 0) {
        setMotivosDesligamento(motivosData.map(m => ({
          id: m.id,
          codigo: m.codigo,
          nome: m.nome,
          descricao: m.descricao || undefined,
        })));
      }

      // Carregar tipos de ato
      const { data: atosData, error: taError } = await supabase
        .from('config_tipos_ato')
        .select('*')
        .eq('instituicao_id', instituicao.id)
        .eq('ativo', true)
        .order('ordem');

      if (taError) {
        console.warn('Erro ao carregar tipos_ato, usando fallback:', taError.message);
      } else if (atosData && atosData.length > 0) {
        setTiposAto(atosData.map(a => ({
          id: a.id,
          codigo: a.codigo,
          nome: a.nome,
          sigla: a.sigla || undefined,
        })));
      }

      // Carregar tipos de ônus
      const { data: onusData, error: toError } = await supabase
        .from('config_tipos_onus')
        .select('*')
        .eq('instituicao_id', instituicao.id)
        .eq('ativo', true)
        .order('ordem');

      if (toError) {
        console.warn('Erro ao carregar tipos_onus, usando fallback:', toError.message);
      } else if (onusData && onusData.length > 0) {
        setTiposOnus(onusData.map(o => ({
          id: o.id,
          codigo: o.codigo,
          nome: o.nome,
        })));
      }

      setUsandoFallback(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar configurações';
      setError(message);
      setUsandoFallback(true);
      console.error('Erro ao carregar configurações de Vida Funcional:', err);
    } finally {
      setLoading(false);
    }
  }, [obterInstituicao]);

  // Carregar ao montar
  useEffect(() => {
    carregarConfiguracoes();
  }, [carregarConfiguracoes]);

  // ============================================================================
  // HELPERS DERIVADOS
  // ============================================================================

  /**
   * Retorna labels para exibição (equivalente a TIPO_SERVIDOR_LABELS)
   */
  const tipoServidorLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    Object.entries(tiposServidor).forEach(([codigo, config]) => {
      labels[codigo] = config.nome;
    });
    return labels;
  }, [tiposServidor]);

  /**
   * Retorna cores para badges (equivalente a TIPO_SERVIDOR_COLORS)
   */
  const tipoServidorColors = useMemo(() => {
    const colors: Record<string, string> = {};
    Object.entries(tiposServidor).forEach(([codigo, config]) => {
      colors[codigo] = config.cor_classe;
    });
    return colors;
  }, [tiposServidor]);

  /**
   * Retorna regras de negócio (equivalente a REGRAS_TIPO_SERVIDOR)
   */
  const regrasTipoServidor = useMemo(() => {
    const regras: Record<string, {
      permiteCargo: boolean;
      tiposCargo: string[];
      permiteLotacaoInterna: boolean;
      permiteLotacaoExterna: boolean;
      requereProvimento: boolean;
      requereOrgaoOrigem: boolean;
      requereOrgaoDestino: boolean;
      descricao: string;
    }> = {};
    
    Object.entries(tiposServidor).forEach(([codigo, config]) => {
      regras[codigo] = {
        permiteCargo: config.permite_cargo,
        tiposCargo: config.tipos_cargo_permitidos,
        permiteLotacaoInterna: config.permite_lotacao_interna,
        permiteLotacaoExterna: config.permite_lotacao_externa,
        requereProvimento: config.requer_provimento,
        requereOrgaoOrigem: config.requer_orgao_origem,
        requereOrgaoDestino: config.requer_orgao_destino,
        descricao: config.descricao || '',
      };
    });
    return regras;
  }, [tiposServidor]);

  /**
   * Retorna labels de situações (equivalente a SITUACAO_LABELS)
   */
  const situacaoLabels = useMemo(() => {
    const labels: Record<string, string> = {};
    Object.entries(situacoes).forEach(([codigo, config]) => {
      labels[codigo] = config.nome;
    });
    return labels;
  }, [situacoes]);

  /**
   * Retorna cores de situações (equivalente a SITUACAO_COLORS)
   */
  const situacaoColors = useMemo(() => {
    const colors: Record<string, string> = {};
    Object.entries(situacoes).forEach(([codigo, config]) => {
      colors[codigo] = config.cor_classe;
    });
    return colors;
  }, [situacoes]);

  /**
   * Retorna motivos formatados para selects (equivalente a MOTIVOS_ENCERRAMENTO)
   */
  const motivosEncerramentoOptions = useMemo(() => {
    return motivosDesligamento.map(m => ({
      value: m.codigo,
      label: m.nome,
    }));
  }, [motivosDesligamento]);

  /**
   * Retorna tipos de ato formatados para selects (equivalente a TIPOS_ATO)
   */
  const tiposAtoOptions = useMemo(() => {
    return tiposAto.map(t => ({
      value: t.codigo,
      label: t.nome,
    }));
  }, [tiposAto]);

  /**
   * Retorna tipos de ônus formatados para selects (equivalente a TIPOS_ONUS)
   */
  const tiposOnusOptions = useMemo(() => {
    return tiposOnus.map(t => ({
      value: t.codigo,
      label: t.nome,
    }));
  }, [tiposOnus]);

  // ============================================================================
  // FUNÇÕES UTILITÁRIAS
  // ============================================================================

  /**
   * Obtém configuração de um tipo de servidor específico
   */
  const obterTipoServidor = useCallback((codigo: string): TipoServidorConfig | null => {
    return tiposServidor[codigo] || null;
  }, [tiposServidor]);

  /**
   * Obtém configuração de uma situação funcional específica
   */
  const obterSituacao = useCallback((codigo: string): SituacaoFuncionalConfig | null => {
    return situacoes[codigo] || null;
  }, [situacoes]);

  /**
   * Obtém label de tipo de servidor com fallback seguro
   */
  const getLabelTipoServidor = useCallback((codigo: string): string => {
    return tipoServidorLabels[codigo] || codigo;
  }, [tipoServidorLabels]);

  /**
   * Obtém cor de tipo de servidor com fallback seguro
   */
  const getColorTipoServidor = useCallback((codigo: string): string => {
    return tipoServidorColors[codigo] || 'bg-muted text-muted-foreground border-muted';
  }, [tipoServidorColors]);

  /**
   * Obtém label de situação com fallback seguro
   */
  const getLabelSituacao = useCallback((codigo: string): string => {
    return situacaoLabels[codigo] || codigo;
  }, [situacaoLabels]);

  /**
   * Obtém cor de situação com fallback seguro
   */
  const getColorSituacao = useCallback((codigo: string): string => {
    return situacaoColors[codigo] || 'bg-muted text-muted-foreground border-muted';
  }, [situacaoColors]);

  return {
    // Estado
    loading,
    error,
    usandoFallback,
    
    // Dados brutos
    tiposServidor,
    situacoes,
    motivosDesligamento,
    tiposAto,
    tiposOnus,
    
    // Labels e Colors (compatibilidade com código existente)
    tipoServidorLabels,
    tipoServidorColors,
    regrasTipoServidor,
    situacaoLabels,
    situacaoColors,
    
    // Options para selects
    motivosEncerramentoOptions,
    tiposAtoOptions,
    tiposOnusOptions,
    
    // Funções utilitárias
    obterTipoServidor,
    obterSituacao,
    getLabelTipoServidor,
    getColorTipoServidor,
    getLabelSituacao,
    getColorSituacao,
    
    // Recarregar dados
    recarregar: carregarConfiguracoes,
  };
}

// ============================================================================
// EXPORT DEFAULT PARA COMPATIBILIDADE
// ============================================================================

export default useConfigVidaFuncional;
