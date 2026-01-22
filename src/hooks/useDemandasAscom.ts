// ============================================
// HOOK DE DEMANDAS ASCOM
// ============================================

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  DemandaAscom, 
  StatusDemandaAscom, 
  AnexoDemandaAscom,
  EntregavelDemandaAscom,
  ComentarioDemandaAscom
} from '@/types/ascom';

interface FiltrosDemandas {
  status?: StatusDemandaAscom | StatusDemandaAscom[];
  categoria?: string;
  unidade_id?: string;
  servidor_id?: string;
  data_inicio?: string;
  data_fim?: string;
  busca?: string;
}

export function useDemandasAscom() {
  const { user } = useAuth();
  const [demandas, setDemandas] = useState<DemandaAscom[]>([]);
  const [loading, setLoading] = useState(false);
  const [demandaAtual, setDemandaAtual] = useState<DemandaAscom | null>(null);

  // Buscar demandas
  const fetchDemandas = useCallback(async (filtros?: FiltrosDemandas) => {
    setLoading(true);
    try {
      let query = (supabase as any)
        .from('demandas_ascom')
        .select(`
          *,
          unidade_solicitante:estrutura_organizacional(id, nome, sigla),
          servidor_solicitante:servidores!demandas_ascom_servidor_solicitante_id_fkey(id, nome_completo),
          responsavel_ascom:servidores!demandas_ascom_responsavel_ascom_id_fkey(id, nome_completo)
        `)
        .order('created_at', { ascending: false });

      if (filtros?.status) {
        if (Array.isArray(filtros.status)) {
          query = query.in('status', filtros.status);
        } else {
          query = query.eq('status', filtros.status);
        }
      }

      if (filtros?.categoria) {
        query = query.eq('categoria', filtros.categoria);
      }

      if (filtros?.unidade_id) {
        query = query.eq('unidade_solicitante_id', filtros.unidade_id);
      }

      if (filtros?.servidor_id) {
        query = query.eq('servidor_solicitante_id', filtros.servidor_id);
      }

      if (filtros?.data_inicio) {
        query = query.gte('created_at', filtros.data_inicio);
      }

      if (filtros?.data_fim) {
        query = query.lte('created_at', filtros.data_fim);
      }

      if (filtros?.busca) {
        query = query.or(`titulo.ilike.%${filtros.busca}%,numero_demanda.ilike.%${filtros.busca}%,descricao_detalhada.ilike.%${filtros.busca}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setDemandas(data as DemandaAscom[]);
    } catch (error: any) {
      console.error('Erro ao buscar demandas:', error);
      toast.error('Erro ao carregar demandas');
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar demanda por ID
  const fetchDemandaPorId = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('demandas_ascom')
        .select(`
          *,
          unidade_solicitante:estrutura_organizacional(id, nome, sigla),
          servidor_solicitante:servidores!demandas_ascom_servidor_solicitante_id_fkey(id, nome_completo),
          responsavel_ascom:servidores!demandas_ascom_responsavel_ascom_id_fkey(id, nome_completo)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      setDemandaAtual(data as DemandaAscom);
      return data as DemandaAscom;
    } catch (error: any) {
      console.error('Erro ao buscar demanda:', error);
      toast.error('Erro ao carregar demanda');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Criar demanda
  const criarDemanda = useCallback(async (dados: Partial<DemandaAscom>) => {
    try {
      const { data, error } = await (supabase as any)
        .from('demandas_ascom')
        .insert({ ...dados, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;

      toast.success('Demanda criada com sucesso!');
      return data as DemandaAscom;
    } catch (error: any) {
      console.error('Erro ao criar demanda:', error);
      toast.error('Erro ao criar demanda');
      return null;
    }
  }, [user?.id]);

  // Atualizar demanda
  const atualizarDemanda = useCallback(async (id: string, dados: Partial<DemandaAscom>) => {
    try {
      const { data, error } = await (supabase as any)
        .from('demandas_ascom')
        .update({ ...dados, updated_by: user?.id })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Demanda atualizada com sucesso!');
      return data as DemandaAscom;
    } catch (error: any) {
      console.error('Erro ao atualizar demanda:', error);
      toast.error('Erro ao atualizar demanda');
      return null;
    }
  }, [user?.id]);

  // Alterar status
  const alterarStatus = useCallback(async (id: string, novoStatus: StatusDemandaAscom, justificativa?: string) => {
    try {
      const updateData: any = { status: novoStatus };
      
      if (novoStatus === 'indeferida' && justificativa) {
        updateData.justificativa_indeferimento = justificativa;
      }
      if (novoStatus === 'aprovada') updateData.data_aprovacao = new Date().toISOString();
      if (novoStatus === 'em_execucao') updateData.data_inicio_execucao = new Date().toISOString();
      if (novoStatus === 'concluida') updateData.data_conclusao = new Date().toISOString();

      const { data, error } = await (supabase as any)
        .from('demandas_ascom')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast.success(`Status alterado para "${novoStatus}"`);
      return data as DemandaAscom;
    } catch (error: any) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status');
      return null;
    }
  }, []);

  // Autorizar pela presidência
  const autorizarPresidencia = useCallback(async (id: string, autorizado: boolean) => {
    try {
      const novoStatus = autorizado ? 'aprovada' : 'indeferida';
      
      const { data, error } = await (supabase as any)
        .from('demandas_ascom')
        .update({ status: novoStatus, data_autorizacao_presidencia: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast.success(autorizado ? 'Demanda autorizada!' : 'Demanda não autorizada');
      return data as DemandaAscom;
    } catch (error: any) {
      console.error('Erro ao autorizar:', error);
      toast.error('Erro ao processar autorização');
      return null;
    }
  }, []);

  // ANEXOS
  const fetchAnexos = useCallback(async (demandaId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('demandas_ascom_anexos')
        .select('*')
        .eq('demanda_id', demandaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as AnexoDemandaAscom[];
    } catch (error: any) {
      console.error('Erro ao buscar anexos:', error);
      return [];
    }
  }, []);

  const uploadAnexo = useCallback(async (demandaId: string, file: File, tipoAnexo: 'solicitacao' | 'entregavel' | 'referencia', descricao?: string) => {
    try {
      const fileName = `${demandaId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from('ascom-demandas').upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('ascom-demandas').getPublicUrl(fileName);

      const { data, error } = await (supabase as any)
        .from('demandas_ascom_anexos')
        .insert({
          demanda_id: demandaId,
          tipo_anexo: tipoAnexo,
          nome_arquivo: file.name,
          descricao,
          url_arquivo: urlData.publicUrl,
          tipo_mime: file.type,
          tamanho_bytes: file.size,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Arquivo enviado com sucesso!');
      return data as AnexoDemandaAscom;
    } catch (error: any) {
      console.error('Erro ao enviar arquivo:', error);
      toast.error('Erro ao enviar arquivo');
      return null;
    }
  }, [user?.id]);

  const removerAnexo = useCallback(async (anexo: AnexoDemandaAscom) => {
    try {
      const urlParts = anexo.url_arquivo.split('/');
      const filePath = urlParts.slice(-2).join('/');
      await supabase.storage.from('ascom-demandas').remove([filePath]);

      const { error } = await (supabase as any).from('demandas_ascom_anexos').delete().eq('id', anexo.id);

      if (error) throw error;

      toast.success('Arquivo removido!');
      return true;
    } catch (error: any) {
      console.error('Erro ao remover arquivo:', error);
      toast.error('Erro ao remover arquivo');
      return false;
    }
  }, []);

  // ENTREGÁVEIS
  const fetchEntregaveis = useCallback(async (demandaId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('demandas_ascom_entregaveis')
        .select('*')
        .eq('demanda_id', demandaId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as EntregavelDemandaAscom[];
    } catch (error: any) {
      console.error('Erro ao buscar entregáveis:', error);
      return [];
    }
  }, []);

  const adicionarEntregavel = useCallback(async (demandaId: string, dados: Partial<EntregavelDemandaAscom>) => {
    try {
      const { data, error } = await (supabase as any)
        .from('demandas_ascom_entregaveis')
        .insert({ ...dados, demanda_id: demandaId, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;

      toast.success('Entregável adicionado!');
      return data as EntregavelDemandaAscom;
    } catch (error: any) {
      console.error('Erro ao adicionar entregável:', error);
      toast.error('Erro ao adicionar entregável');
      return null;
    }
  }, [user?.id]);

  // COMENTÁRIOS
  const fetchComentarios = useCallback(async (demandaId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('demandas_ascom_comentarios')
        .select('*')
        .eq('demanda_id', demandaId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as ComentarioDemandaAscom[];
    } catch (error: any) {
      console.error('Erro ao buscar comentários:', error);
      return [];
    }
  }, []);

  const adicionarComentario = useCallback(async (demandaId: string, conteudo: string, tipo: 'comentario' | 'status' | 'interno' = 'comentario', visivelSolicitante: boolean = true) => {
    try {
      const { data, error } = await (supabase as any)
        .from('demandas_ascom_comentarios')
        .insert({ demanda_id: demandaId, tipo, conteudo, visivel_solicitante: visivelSolicitante, created_by: user?.id })
        .select()
        .single();

      if (error) throw error;

      return data as ComentarioDemandaAscom;
    } catch (error: any) {
      console.error('Erro ao adicionar comentário:', error);
      toast.error('Erro ao adicionar comentário');
      return null;
    }
  }, [user?.id]);

  return {
    demandas,
    loading,
    demandaAtual,
    fetchDemandas,
    fetchDemandaPorId,
    criarDemanda,
    atualizarDemanda,
    alterarStatus,
    autorizarPresidencia,
    fetchAnexos,
    uploadAnexo,
    removerAnexo,
    fetchEntregaveis,
    adicionarEntregavel,
    fetchComentarios,
    adicionarComentario
  };
}
