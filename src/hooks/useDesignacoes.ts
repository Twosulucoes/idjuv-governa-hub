import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Designacao, CreateDesignacaoData, StatusDesignacao } from "@/types/designacao";

export function useDesignacoes(filters?: { status?: StatusDesignacao; unidade_id?: string }) {
  return useQuery({
    queryKey: ["designacoes", filters],
    queryFn: async () => {
      let query = supabase
        .from("designacoes")
        .select(`
          *,
          servidor:servidores(id, nome_completo, matricula, cpf),
          unidade_origem:estrutura_organizacional!designacoes_unidade_origem_id_fkey(id, nome, sigla),
          unidade_destino:estrutura_organizacional!designacoes_unidade_destino_id_fkey(id, nome, sigla),
          lotacao:lotacoes(
            id,
            cargo:cargos(id, nome, sigla)
          ),
          aprovador:profiles!designacoes_aprovado_por_fkey(id, full_name)
        `)
        .eq("ativo", true)
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.unidade_id) {
        query = query.or(`unidade_origem_id.eq.${filters.unidade_id},unidade_destino_id.eq.${filters.unidade_id}`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Designacao[];
    },
  });
}

export function useDesignacaoServidor(servidorId: string) {
  return useQuery({
    queryKey: ["designacoes-servidor", servidorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("designacoes")
        .select(`
          *,
          unidade_origem:estrutura_organizacional!designacoes_unidade_origem_id_fkey(id, nome, sigla),
          unidade_destino:estrutura_organizacional!designacoes_unidade_destino_id_fkey(id, nome, sigla)
        `)
        .eq("servidor_id", servidorId)
        .eq("ativo", true)
        .order("data_inicio", { ascending: false });

      if (error) throw error;
      return data as Designacao[];
    },
    enabled: !!servidorId,
  });
}

export function useDesignacaoAtivaServidor(servidorId: string) {
  return useQuery({
    queryKey: ["designacao-ativa", servidorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("designacoes")
        .select(`
          *,
          unidade_origem:estrutura_organizacional!designacoes_unidade_origem_id_fkey(id, nome, sigla),
          unidade_destino:estrutura_organizacional!designacoes_unidade_destino_id_fkey(id, nome, sigla)
        `)
        .eq("servidor_id", servidorId)
        .eq("status", "aprovada")
        .eq("ativo", true)
        .maybeSingle();

      if (error) throw error;
      return data as Designacao | null;
    },
    enabled: !!servidorId,
  });
}

export function useCreateDesignacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDesignacaoData) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase.from("designacoes").insert({
        ...data,
        status: "pendente",
        ativo: true,
        created_by: userData?.user?.id,
      });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designacoes"] });
      toast.success("Solicitação de designação criada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar designação: ${error.message}`);
    },
  });
}

/**
 * Aprovar designação - SINCRONIZADO
 * 1. Atualiza status para aprovada
 * 2. Registra no histórico funcional
 * 3. Gera portaria na tabela documentos (NÃO mais em portarias_servidor)
 */
export function useAprovarDesignacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (designacaoId: string) => {
      const { data: userData } = await supabase.auth.getUser();
      
      // 1. Buscar dados completos da designação
      const { data: designacao, error: fetchError } = await supabase
        .from("designacoes")
        .select(`
          *,
          servidor:servidores(id, nome_completo),
          unidade_origem:estrutura_organizacional!designacoes_unidade_origem_id_fkey(id, nome, sigla),
          unidade_destino:estrutura_organizacional!designacoes_unidade_destino_id_fkey(id, nome, sigla)
        `)
        .eq("id", designacaoId)
        .single();
      
      if (fetchError) throw fetchError;
      if (!designacao) throw new Error("Designação não encontrada");
      
      // 2. Atualizar designação para aprovada
      const { error: updateError } = await supabase
        .from("designacoes")
        .update({
          status: "aprovada",
          aprovado_por: userData?.user?.id,
          data_aprovacao: new Date().toISOString(),
        })
        .eq("id", designacaoId);
      
      if (updateError) throw updateError;
      
      // 3. Criar registro no histórico funcional
      try {
        await supabase
          .from("historico_funcional")
          .insert({
            servidor_id: designacao.servidor_id,
            tipo: "designacao",
            data_evento: designacao.data_inicio,
            data_vigencia_inicio: designacao.data_inicio,
            data_vigencia_fim: designacao.data_fim || null,
            unidade_anterior_id: designacao.unidade_origem_id,
            unidade_nova_id: designacao.unidade_destino_id,
            portaria_numero: designacao.ato_numero || null,
            portaria_data: designacao.ato_data || null,
            diario_oficial_numero: designacao.ato_doe_numero || null,
            diario_oficial_data: designacao.ato_doe_data || null,
            descricao: `Designação temporária de ${designacao.servidor?.nome_completo || 'servidor'} para ${designacao.unidade_destino?.sigla || designacao.unidade_destino?.nome || 'outra unidade'}`,
            fundamentacao_legal: designacao.justificativa || null,
            created_by: userData?.user?.id,
          });
      } catch (e) {
        console.error("Erro ao criar histórico funcional:", e);
      }
      
      // 4. Gerar portaria na tabela documentos (NÃO mais em portarias_servidor)
      if (designacao.ato_numero || true) {
        const nomeServidor = designacao.servidor?.nome_completo || 'Servidor';
        const unidadeDestinoNome = designacao.unidade_destino?.sigla || designacao.unidade_destino?.nome || 'outra unidade';
        
        try {
          const ano = designacao.ato_data 
            ? new Date(designacao.ato_data).getFullYear() 
            : new Date().getFullYear();
          
          // Gerar número automático
          let numero: string | null = null;
          try {
            const { data: numData } = await supabase.rpc("gerar_numero_portaria", { p_ano: ano });
            numero = numData as string;
          } catch {
            numero = designacao.ato_numero || `PENDENTE/${ano}`;
          }

          await supabase
            .from("documentos")
            .insert({
              tipo: "portaria",
              categoria: "designacao",
              status: "minuta",
              titulo: `Designação - ${nomeServidor}`,
              ementa: `Designa ${nomeServidor} para exercício no(a) ${unidadeDestinoNome}.`,
              numero: numero || `PENDENTE/${ano}`,
              data_documento: designacao.ato_data || designacao.data_inicio,
              servidores_ids: [designacao.servidor_id],
              unidade_id: designacao.unidade_destino_id,
              designacao_id: designacaoId,
              created_by: userData?.user?.id,
            });
        } catch (e) {
          console.error("Erro ao criar portaria na tabela documentos:", e);
        }
      }

      return designacao;
    },
    onSuccess: (designacao) => {
      queryClient.invalidateQueries({ queryKey: ["designacoes"] });
      queryClient.invalidateQueries({ queryKey: ["designacoes-servidor", designacao.servidor_id] });
      queryClient.invalidateQueries({ queryKey: ["designacao-ativa", designacao.servidor_id] });
      queryClient.invalidateQueries({ queryKey: ["historico-funcional", designacao.servidor_id] });
      queryClient.invalidateQueries({ queryKey: ["portarias-servidor", designacao.servidor_id] });
      queryClient.invalidateQueries({ queryKey: ["portarias"] });
      toast.success("Designação aprovada! Histórico e portaria registrados automaticamente.");
    },
    onError: (error: any) => {
      toast.error(`Erro ao aprovar designação: ${error.message}`);
    },
  });
}

export function useRejeitarDesignacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ designacaoId, motivo }: { designacaoId: string; motivo: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("designacoes")
        .update({
          status: "rejeitada",
          motivo_rejeicao: motivo,
          aprovado_por: userData?.user?.id,
          data_aprovacao: new Date().toISOString(),
        })
        .eq("id", designacaoId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["designacoes"] });
      toast.success("Designação rejeitada.");
    },
    onError: (error: any) => {
      toast.error(`Erro ao rejeitar designação: ${error.message}`);
    },
  });
}

/**
 * Encerrar designação - SINCRONIZADO
 * 1. Atualiza designação para encerrada
 * 2. Registra dispensa no histórico funcional
 * 3. Revoga portaria na tabela documentos (NÃO mais em portarias_servidor)
 */
export function useEncerrarDesignacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ designacaoId, dataFim }: { designacaoId: string; dataFim?: string }) => {
      const { data: userData } = await supabase.auth.getUser();
      const dataEncerramento = dataFim || new Date().toISOString().split("T")[0];
      
      // 1. Buscar dados da designação
      const { data: designacao, error: fetchError } = await supabase
        .from("designacoes")
        .select(`
          *,
          servidor:servidores(id, nome_completo),
          unidade_origem:estrutura_organizacional!designacoes_unidade_origem_id_fkey(id, nome, sigla),
          unidade_destino:estrutura_organizacional!designacoes_unidade_destino_id_fkey(id, nome, sigla)
        `)
        .eq("id", designacaoId)
        .single();
      
      if (fetchError) throw fetchError;
      if (!designacao) throw new Error("Designação não encontrada");
      
      // 2. Atualizar designação para encerrada
      const { error: updateError } = await supabase
        .from("designacoes")
        .update({
          status: "encerrada",
          data_fim: dataEncerramento,
        })
        .eq("id", designacaoId);
      
      if (updateError) throw updateError;
      
      // 3. Criar registro de dispensa no histórico funcional
      try {
        await supabase
          .from("historico_funcional")
          .insert({
            servidor_id: designacao.servidor_id,
            tipo: "dispensa",
            data_evento: dataEncerramento,
            unidade_anterior_id: designacao.unidade_destino_id,
            unidade_nova_id: designacao.unidade_origem_id,
            descricao: `Dispensa de designação temporária de ${designacao.servidor?.nome_completo || 'servidor'}`,
            created_by: userData?.user?.id,
          });
      } catch (e) {
        console.error("Erro ao criar histórico de dispensa:", e);
      }
      
      // 4. Revogar portaria na tabela documentos (não mais em portarias_servidor)
      try {
        await supabase
          .from("documentos")
          .update({
            status: "revogado",
          })
          .eq("designacao_id", designacaoId)
          .eq("tipo", "portaria")
          .eq("categoria", "designacao")
          .in("status", ["minuta", "vigente", "publicado", "assinado"]);
      } catch (e) {
        console.error("Erro ao revogar portaria:", e);
      }

      return designacao;
    },
    onSuccess: (designacao) => {
      queryClient.invalidateQueries({ queryKey: ["designacoes"] });
      queryClient.invalidateQueries({ queryKey: ["designacoes-servidor", designacao.servidor_id] });
      queryClient.invalidateQueries({ queryKey: ["designacao-ativa", designacao.servidor_id] });
      queryClient.invalidateQueries({ queryKey: ["historico-funcional", designacao.servidor_id] });
      queryClient.invalidateQueries({ queryKey: ["portarias-servidor", designacao.servidor_id] });
      queryClient.invalidateQueries({ queryKey: ["portarias"] });
      toast.success("Designação encerrada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao encerrar designação: ${error.message}`);
    },
  });
}
