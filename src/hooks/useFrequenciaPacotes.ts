/**
 * Hook para gestão de arquivos e pacotes de frequência
 * Integração com storage e registro em banco
 */
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

// ============================================
// TIPOS
// ============================================

export interface FrequenciaArquivo {
  id: string;
  periodo: string;
  ano: number;
  mes: number;
  servidor_id: string | null;
  servidor_nome: string | null;
  servidor_matricula: string | null;
  unidade_id: string | null;
  unidade_nome: string | null;
  unidade_sigla: string | null;
  tipo: string;
  arquivo_path: string;
  arquivo_nome: string;
  arquivo_tamanho: number | null;
  hash_conteudo: string | null;
  created_at: string;
  created_by: string | null;
}

export interface FrequenciaPacote {
  id: string;
  periodo: string;
  ano: number;
  mes: number;
  unidade_id: string | null;
  unidade_nome: string | null;
  agrupamento_id: string | null;
  agrupamento_nome: string | null;
  tipo: string;
  status: 'pendente' | 'gerando' | 'gerado' | 'erro';
  arquivo_path: string | null;
  arquivo_nome: string | null;
  arquivo_tamanho: number | null;
  total_arquivos: number;
  link_download: string | null;
  link_expira_em: string | null;
  erro_mensagem: string | null;
  gerado_em: string | null;
  created_at: string;
  created_by: string | null;
  updated_at: string;
}

export interface UploadFrequenciaParams {
  pdfBlob: Blob;
  periodo: string;
  ano: number;
  mes: number;
  servidor: {
    id: string;
    nome: string;
    matricula?: string;
  };
  unidade: {
    id: string;
    nome: string;
    sigla?: string;
  };
  tipo?: 'individual' | 'lote';
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

const formatPeriodo = (ano: number, mes: number): string => {
  return `${ano}-${String(mes).padStart(2, '0')}`;
};

const gerarCaminhoArquivo = (
  periodo: string, 
  unidadeSigla: string, 
  servidorMatricula: string,
  servidorNome: string
): string => {
  const nomeNormalizado = servidorNome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 30);
  
  const timestamp = Date.now();
  return `${periodo}/${unidadeSigla || 'GERAL'}/${servidorMatricula || 'SEM_MAT'}_${nomeNormalizado}_${timestamp}.pdf`;
};

// ============================================
// HOOKS
// ============================================

/**
 * Busca arquivos de frequência por período
 */
export function useFrequenciaArquivos(periodo?: string, unidadeId?: string) {
  return useQuery({
    queryKey: ['frequencia-arquivos', periodo, unidadeId],
    queryFn: async () => {
      let query = supabase
        .from('frequencia_arquivos')
        .select('*')
        .order('created_at', { ascending: false });

      if (periodo) {
        query = query.eq('periodo', periodo);
      }

      if (unidadeId) {
        query = query.eq('unidade_id', unidadeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as FrequenciaArquivo[];
    },
    enabled: !!periodo,
  });
}

/**
 * Busca pacotes de frequência
 */
export function useFrequenciaPacotes(periodo?: string) {
  return useQuery({
    queryKey: ['frequencia-pacotes', periodo],
    queryFn: async () => {
      let query = supabase
        .from('frequencia_pacotes')
        .select('*')
        .order('created_at', { ascending: false });

      if (periodo) {
        query = query.eq('periodo', periodo);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as FrequenciaPacote[];
    },
  });
}

/**
 * Busca pacote por link de download
 */
export function useFrequenciaPacotePorLink(linkDownload?: string) {
  return useQuery({
    queryKey: ['frequencia-pacote-link', linkDownload],
    queryFn: async () => {
      if (!linkDownload) return null;

      const { data, error } = await supabase
        .from('frequencia_pacotes')
        .select('*')
        .eq('link_download', linkDownload)
        .single();

      if (error) throw error;
      return data as FrequenciaPacote;
    },
    enabled: !!linkDownload,
  });
}

/**
 * Upload de PDF de frequência para storage
 */
export function useUploadFrequencia() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UploadFrequenciaParams) => {
      const { pdfBlob, periodo, ano, mes, servidor, unidade, tipo = 'individual' } = params;

      // 1. Gerar caminho do arquivo
      const arquivoPath = gerarCaminhoArquivo(
        periodo,
        unidade.sigla || unidade.nome.substring(0, 10),
        servidor.matricula || servidor.id.substring(0, 8),
        servidor.nome
      );

      const arquivoNome = arquivoPath.split('/').pop() || 'frequencia.pdf';

      // 2. Upload para storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('frequencias')
        .upload(arquivoPath, pdfBlob, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        console.error('Erro no upload:', uploadError);
        throw new Error(`Falha no upload: ${uploadError.message}`);
      }

      // 3. Registrar no banco
      const { data: registro, error: registroError } = await supabase
        .from('frequencia_arquivos')
        .insert({
          periodo,
          ano,
          mes,
          servidor_id: servidor.id,
          servidor_nome: servidor.nome,
          servidor_matricula: servidor.matricula,
          unidade_id: unidade.id,
          unidade_nome: unidade.nome,
          unidade_sigla: unidade.sigla,
          tipo,
          arquivo_path: arquivoPath,
          arquivo_nome: arquivoNome,
          arquivo_tamanho: pdfBlob.size,
          created_by: user?.id,
        })
        .select()
        .single();

      if (registroError) {
        console.error('Erro ao registrar arquivo:', registroError);
        // Não falha completamente, arquivo já foi salvo
      }

      return {
        path: arquivoPath,
        registro,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frequencia-arquivos'] });
    },
    onError: (error) => {
      console.error('Erro no upload de frequência:', error);
      toast.error('Erro ao salvar frequência no storage');
    },
  });
}

/**
 * Criar/iniciar geração de pacote
 */
export function useCriarPacote() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      periodo: string;
      ano: number;
      mes: number;
      unidadeId?: string;
      unidadeNome?: string;
      agrupamentoId?: string;
      agrupamentoNome?: string;
      tipo: 'unidade' | 'agrupamento' | 'geral';
    }) => {
      // Gerar link único
      const { data: linkData } = await supabase.rpc('gerar_link_frequencia');
      const linkDownload = linkData || crypto.randomUUID().replace(/-/g, '');

      const { data, error } = await supabase
        .from('frequencia_pacotes')
        .insert({
          periodo: params.periodo,
          ano: params.ano,
          mes: params.mes,
          unidade_id: params.unidadeId,
          unidade_nome: params.unidadeNome,
          agrupamento_id: params.agrupamentoId,
          agrupamento_nome: params.agrupamentoNome,
          tipo: params.tipo,
          status: 'pendente',
          link_download: linkDownload,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as FrequenciaPacote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frequencia-pacotes'] });
      toast.success('Pacote criado! Iniciando geração...');
    },
    onError: (error) => {
      console.error('Erro ao criar pacote:', error);
      toast.error('Erro ao criar pacote de frequências');
    },
  });
}

/**
 * Atualizar status do pacote
 */
export function useAtualizarPacote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      id: string;
      status?: FrequenciaPacote['status'];
      arquivo_path?: string;
      arquivo_nome?: string;
      arquivo_tamanho?: number;
      total_arquivos?: number;
      erro_mensagem?: string;
      gerado_em?: string;
    }) => {
      const { id, ...updates } = params;

      const { data, error } = await supabase
        .from('frequencia_pacotes')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as FrequenciaPacote;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['frequencia-pacotes'] });
    },
  });
}

/**
 * Obter URL de download de arquivo
 */
export async function obterUrlDownload(arquivoPath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from('frequencias')
    .createSignedUrl(arquivoPath, 3600); // 1 hora

  if (error) {
    console.error('Erro ao gerar URL:', error);
    return null;
  }

  return data.signedUrl;
}

/**
 * Listar arquivos do storage por período
 */
export async function listarArquivosStorage(periodo: string): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from('frequencias')
    .list(periodo, {
      limit: 1000,
      sortBy: { column: 'name', order: 'asc' },
    });

  if (error) {
    console.error('Erro ao listar arquivos:', error);
    return [];
  }

  // Listar subpastas e seus arquivos
  const arquivos: string[] = [];

  for (const item of data || []) {
    if (item.id === null) {
      // É uma pasta, buscar conteúdo
      const { data: subData } = await supabase.storage
        .from('frequencias')
        .list(`${periodo}/${item.name}`, {
          limit: 1000,
        });

      for (const subItem of subData || []) {
        if (subItem.name.endsWith('.pdf')) {
          arquivos.push(`${periodo}/${item.name}/${subItem.name}`);
        }
      }
    } else if (item.name.endsWith('.pdf')) {
      arquivos.push(`${periodo}/${item.name}`);
    }
  }

  return arquivos;
}

/**
 * Obter estatísticas do período
 */
export function useEstatisticasPeriodo(periodo: string) {
  return useQuery({
    queryKey: ['frequencia-estatisticas', periodo],
    queryFn: async () => {
      // Total de arquivos
      const { count: totalArquivos } = await supabase
        .from('frequencia_arquivos')
        .select('*', { count: 'exact', head: true })
        .eq('periodo', periodo);

      // Arquivos por unidade
      const { data: porUnidade } = await supabase
        .from('frequencia_arquivos')
        .select('unidade_sigla, unidade_nome')
        .eq('periodo', periodo);

      const unidadesMap = new Map<string, { sigla: string; nome: string; count: number }>();
      porUnidade?.forEach((item) => {
        const key = item.unidade_sigla || 'SEM_UNIDADE';
        const existing = unidadesMap.get(key);
        if (existing) {
          existing.count++;
        } else {
          unidadesMap.set(key, {
            sigla: item.unidade_sigla || 'N/A',
            nome: item.unidade_nome || 'Sem unidade',
            count: 1,
          });
        }
      });

      // Pacotes do período
      const { data: pacotes } = await supabase
        .from('frequencia_pacotes')
        .select('*')
        .eq('periodo', periodo);

      return {
        totalArquivos: totalArquivos || 0,
        porUnidade: Array.from(unidadesMap.values()),
        pacotes: pacotes || [],
      };
    },
    enabled: !!periodo,
  });
}
