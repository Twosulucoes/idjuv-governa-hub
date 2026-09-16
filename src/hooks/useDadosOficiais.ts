import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { fallbackDadosOficiais } from '@/core/tenant';

interface DadoOficial {
  id: string;
  chave: string;
  valor: string;
  descricao: string | null;
  categoria: string;
  lei_referencia: string | null;
  documento_url: string | null;
  bloqueado: boolean;
  ultima_alteracao_por: string | null;
  ultima_alteracao_em: string;
  created_at: string;
  updated_at: string;
}

interface DadosOficiaisAgrupados {
  identificacao: Record<string, string>;
  vinculacao: Record<string, string>;
  endereco: Record<string, string>;
  contato: Record<string, string>;
  legal: Record<string, string>;
  dirigente: Record<string, string>;
  [key: string]: Record<string, string>;
}

interface UseDadosOficiaisReturn {
  dados: DadoOficial[];
  dadosAgrupados: DadosOficiaisAgrupados;
  loading: boolean;
  error: string | null;
  obterValor: (chave: string, fallback?: string) => string;
  refetch: () => Promise<void>;
  // Dados de acesso rápido
  nomeOficial: string;
  nomeCurto: string;
  cnpj: string;
  vinculacao: string;
  enderecoCompleto: string;
  presidenteNome: string;
  leiCriacao: string;
  emailInstitucional: string;
}

/**
 * Fallback usado enquanto a tabela `dados_oficiais` não responde.
 * Vem do perfil da instituição (tenants/<slug>/tenant.config.ts) — não de
 * literais aqui. Ver docs/WHITE_LABEL.md.
 */
const FALLBACK_DATA: Record<string, string> = fallbackDadosOficiais();

export function useDadosOficiais(): UseDadosOficiaisReturn {
  const [dados, setDados] = useState<DadoOficial[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDados = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('dados_oficiais')
        .select('*')
        .order('categoria')
        .order('chave');

      if (fetchError) throw fetchError;
      setDados(data || []);
      setError(null);
    } catch (err: any) {
      console.error('Erro ao carregar dados oficiais:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  // Função para obter valor por chave
  const obterValor = useCallback((chave: string, fallback?: string): string => {
    const dado = dados.find(d => d.chave === chave);
    return dado?.valor || fallback || FALLBACK_DATA[chave] || '';
  }, [dados]);

  // Agrupar por categoria
  const dadosAgrupados = dados.reduce<DadosOficiaisAgrupados>((acc, dado) => {
    const cat = dado.categoria || 'geral';
    if (!acc[cat]) acc[cat] = {};
    acc[cat][dado.chave] = dado.valor;
    return acc;
  }, {
    identificacao: {},
    vinculacao: {},
    endereco: {},
    contato: {},
    legal: {},
    dirigente: {},
  });

  // Dados de acesso rápido
  const nomeOficial = obterValor('nome_oficial');
  const nomeCurto = obterValor('nome_curto');
  const cnpj = obterValor('cnpj');
  const vinculacao = obterValor('vinculacao');
  const presidenteNome = obterValor('presidente_nome');
  const leiCriacao = obterValor('lei_criacao');
  const emailInstitucional = obterValor('email_institucional');

  // Montar endereço completo
  const enderecoCompleto = [
    obterValor('endereco_logradouro'),
    obterValor('endereco_numero') ? `nº ${obterValor('endereco_numero')}` : '',
    obterValor('endereco_complemento') ? `– ${obterValor('endereco_complemento')}` : '',
    obterValor('endereco_cidade'),
    obterValor('endereco_uf') ? `– ${obterValor('endereco_uf')}` : '',
    obterValor('endereco_pais') ? `– ${obterValor('endereco_pais')}` : '',
  ].filter(Boolean).join(' ');

  return {
    dados,
    dadosAgrupados,
    loading,
    error,
    obterValor,
    refetch: fetchDados,
    nomeOficial,
    nomeCurto,
    cnpj,
    vinculacao,
    enderecoCompleto,
    presidenteNome,
    leiCriacao,
    emailInstitucional,
  };
}

// Hook simples para obter um único valor
export function useDadoOficial(chave: string, fallback?: string): string {
  const [valor, setValor] = useState<string>(fallback || FALLBACK_DATA[chave] || '');

  useEffect(() => {
    supabase
      .from('dados_oficiais')
      .select('valor')
      .eq('chave', chave)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setValor(data.valor);
        }
      });
  }, [chave]);

  return valor;
}
