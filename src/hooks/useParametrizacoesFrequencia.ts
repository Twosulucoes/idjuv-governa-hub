// ============================================
// HOOK DE PARAMETRIZAÇÕES DE FREQUÊNCIA
// Gerencia todas as configurações institucionais
// ============================================

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import type {
  ConfigJornadaPadrao,
  RegimeTrabalho,
  DiaNaoUtil,
  TipoAbono,
  ConfigCompensacao,
  ConfigFechamentoFrequencia,
  ConfigAssinaturaFrequencia,
  SolicitacaoAbono,
  FrequenciaFechamento,
  ServidorRegime,
  StatusSolicitacaoAbono,
} from "@/types/frequencia";

// ============================================
// JORNADA DE TRABALHO
// ============================================

export function useConfigJornadas() {
  return useQuery({
    queryKey: ["config-jornadas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("config_jornada_padrao")
        .select(`
          *,
          unidade:unidade_id(nome, sigla),
          cargo:cargo_id(nome),
          servidor:servidor_id(nome_completo)
        `)
        .order("padrao", { ascending: false })
        .order("escopo", { ascending: true });

      if (error) throw error;
      return data as unknown as ConfigJornadaPadrao[];
    },
  });
}

export function useJornadaPadrao() {
  return useQuery({
    queryKey: ["jornada-padrao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("config_jornada_padrao")
        .select("*")
        .eq("padrao", true)
        .eq("ativo", true)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as ConfigJornadaPadrao | null;
    },
  });
}

export function useSalvarJornada() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jornada: Partial<ConfigJornadaPadrao>) => {
      const { id, unidade, cargo, servidor, ...dados } = jornada as any;

      if (id) {
        const { data, error } = await supabase
          .from("config_jornada_padrao")
          .update(dados)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("config_jornada_padrao")
          .insert(dados)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config-jornadas"] });
      queryClient.invalidateQueries({ queryKey: ["jornada-padrao"] });
      toast.success("Jornada salva com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao salvar jornada:", error);
      toast.error("Erro ao salvar jornada.");
    },
  });
}

// ============================================
// REGIMES DE TRABALHO
// ============================================

export function useRegimesTrabalho() {
  return useQuery({
    queryKey: ["regimes-trabalho"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("regimes_trabalho")
        .select("*")
        .order("nome");

      if (error) throw error;
      return data as RegimeTrabalho[];
    },
  });
}

export function useSalvarRegime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (regime: Partial<RegimeTrabalho>) => {
      const { id, ...dados } = regime;

      if (id) {
        const { data, error } = await supabase
          .from("regimes_trabalho")
          .update(dados)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("regimes_trabalho")
          .insert({ ...dados, codigo: dados.codigo || '' } as any)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["regimes-trabalho"] });
      toast.success("Regime salvo com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao salvar regime:", error);
      toast.error("Erro ao salvar regime.");
    },
  });
}

// ============================================
// DIAS NÃO ÚTEIS
// ============================================

export function useDiasNaoUteis(ano?: number) {
  return useQuery({
    queryKey: ["dias-nao-uteis", ano],
    queryFn: async () => {
      let query = supabase
        .from("dias_nao_uteis")
        .select("*")
        .order("data", { ascending: true });

      if (ano) {
        query = query
          .gte("data", `${ano}-01-01`)
          .lte("data", `${ano}-12-31`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DiaNaoUtil[];
    },
  });
}

export function useSalvarDiaNaoUtil() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dia: Partial<DiaNaoUtil>) => {
      const { id, ...dados } = dia;

      if (id) {
        const { data, error } = await supabase
          .from("dias_nao_uteis")
          .update(dados)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("dias_nao_uteis")
          .insert({ ...dados, data: dados.data || '' } as any)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dias-nao-uteis"] });
      toast.success("Dia não útil salvo com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao salvar dia não útil:", error);
      toast.error("Erro ao salvar dia não útil.");
    },
  });
}

export function useExcluirDiaNaoUtil() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("dias_nao_uteis")
        .update({ ativo: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dias-nao-uteis"] });
      toast.success("Dia não útil removido!");
    },
    onError: (error) => {
      console.error("Erro ao excluir:", error);
      toast.error("Erro ao excluir dia não útil.");
    },
  });
}

// ============================================
// TIPOS DE ABONO
// ============================================

export function useTiposAbono() {
  return useQuery({
    queryKey: ["tipos-abono"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tipos_abono")
        .select("*")
        .eq("ativo", true)
        .order("ordem")
        .order("nome");

      if (error) throw error;
      return data as TipoAbono[];
    },
  });
}

export function useSalvarTipoAbono() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tipo: Partial<TipoAbono>) => {
      const { id, ...dados } = tipo;

      if (id) {
        const { data, error } = await supabase
          .from("tipos_abono")
          .update(dados)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const insertData = {
          codigo: dados.codigo || '',
          nome: dados.nome || '',
          ...dados
        };
        const { data, error } = await supabase
          .from("tipos_abono")
          .insert(insertData)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tipos-abono"] });
      toast.success("Tipo de abono salvo com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao salvar tipo de abono:", error);
      toast.error("Erro ao salvar tipo de abono.");
    },
  });
}

// ============================================
// CONFIGURAÇÃO DE COMPENSAÇÃO
// ============================================

export function useConfigCompensacao() {
  return useQuery({
    queryKey: ["config-compensacao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("config_compensacao")
        .select("*")
        .order("padrao", { ascending: false });

      if (error) throw error;
      return data as ConfigCompensacao[];
    },
  });
}

export function useCompensacaoPadrao() {
  return useQuery({
    queryKey: ["compensacao-padrao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("config_compensacao")
        .select("*")
        .eq("padrao", true)
        .eq("ativo", true)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as ConfigCompensacao | null;
    },
  });
}

export function useSalvarCompensacao() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Partial<ConfigCompensacao>) => {
      const { id, ...dados } = config;

      if (id) {
        const { data, error } = await supabase
          .from("config_compensacao")
          .update(dados)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const insertData = {
          nome: dados.nome || 'Nova Configuração',
          ...dados
        };
        const { data, error } = await supabase
          .from("config_compensacao")
          .insert(insertData)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config-compensacao"] });
      queryClient.invalidateQueries({ queryKey: ["compensacao-padrao"] });
      toast.success("Configuração salva com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao salvar configuração:", error);
      toast.error("Erro ao salvar configuração.");
    },
  });
}

// ============================================
// CONFIGURAÇÃO DE FECHAMENTO
// ============================================

export function useConfigFechamento(ano: number, mes: number) {
  return useQuery({
    queryKey: ["config-fechamento", ano, mes],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("config_fechamento_frequencia")
        .select("*")
        .eq("ano", ano)
        .eq("mes", mes)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as ConfigFechamentoFrequencia | null;
    },
    enabled: ano > 0 && mes > 0,
  });
}

export function useSalvarFechamento() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Partial<ConfigFechamentoFrequencia>) => {
      const { id, ...dados } = config;

      const upsertData = {
        ano: dados.ano || new Date().getFullYear(),
        mes: dados.mes || (new Date().getMonth() + 1),
        ...dados
      };
      const { data, error } = await supabase
        .from("config_fechamento_frequencia")
        .upsert(upsertData, { onConflict: "ano,mes" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ["config-fechamento", data.ano, data.mes] 
      });
      toast.success("Configuração de fechamento salva!");
    },
    onError: (error) => {
      console.error("Erro ao salvar fechamento:", error);
      toast.error("Erro ao salvar configuração de fechamento.");
    },
  });
}

// ============================================
// CONFIGURAÇÃO DE ASSINATURA
// ============================================

export function useConfigAssinatura() {
  return useQuery({
    queryKey: ["config-assinatura-frequencia"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("config_assinatura_frequencia")
        .select("*")
        .order("padrao", { ascending: false });

      if (error) throw error;
      return data as ConfigAssinaturaFrequencia[];
    },
  });
}

export function useAssinaturaPadrao() {
  return useQuery({
    queryKey: ["assinatura-frequencia-padrao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("config_assinatura_frequencia")
        .select("*")
        .eq("padrao", true)
        .eq("ativo", true)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as ConfigAssinaturaFrequencia | null;
    },
  });
}

export function useSalvarAssinatura() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Partial<ConfigAssinaturaFrequencia>) => {
      const { id, ...dados } = config;

      if (id) {
        const { data, error } = await supabase
          .from("config_assinatura_frequencia")
          .update(dados)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const insertData = {
          nome: dados.nome || 'Nova Configuração',
          ...dados
        };
        const { data, error } = await supabase
          .from("config_assinatura_frequencia")
          .insert(insertData)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config-assinatura-frequencia"] });
      queryClient.invalidateQueries({ queryKey: ["assinatura-frequencia-padrao"] });
      toast.success("Configuração de assinatura salva!");
    },
    onError: (error) => {
      console.error("Erro ao salvar assinatura:", error);
      toast.error("Erro ao salvar configuração de assinatura.");
    },
  });
}

// ============================================
// SOLICITAÇÕES DE ABONO
// ============================================

export interface FiltrosSolicitacoesAbono {
  servidorId?: string;
  status?: StatusSolicitacaoAbono | StatusSolicitacaoAbono[];
  /** Filtra pela unidade atual do servidor (servidores.unidade_atual_id). */
  unidadeId?: string;
}

export function useSolicitacoesAbono(filtros: FiltrosSolicitacoesAbono = {}) {
  const { servidorId, status, unidadeId } = filtros;
  const statusKey = Array.isArray(status) ? status.join(",") : status;

  return useQuery({
    queryKey: ["solicitacoes-abono", servidorId ?? null, statusKey ?? null, unidadeId ?? null],
    queryFn: async () => {
      // `!inner` para o filtro de unidade valer sobre a solicitação, não só sobre o embed
      let query = supabase
        .from("solicitacoes_abono")
        .select(`
          *,
          servidor:servidor_id!inner(nome_completo, matricula, unidade_atual_id, unidade:unidade_atual_id(nome, sigla)),
          tipo_abono:tipo_abono_id(*)
        `)
        .order("created_at", { ascending: false });

      if (servidorId) query = query.eq("servidor_id", servidorId);
      if (Array.isArray(status)) {
        if (status.length > 0) query = query.in("status", status);
      } else if (status) {
        query = query.eq("status", status);
      }
      if (unidadeId) query = query.eq("servidor.unidade_atual_id", unidadeId);

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as SolicitacaoAbono[];
    },
  });
}

export function useSalvarSolicitacaoAbono() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (solicitacao: Partial<SolicitacaoAbono>) => {
      const { id, servidor, tipo_abono, ...dados } = solicitacao as any;

      if (id) {
        const { data, error } = await supabase
          .from("solicitacoes_abono")
          .update(dados)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("solicitacoes_abono")
          .insert(dados)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solicitacoes-abono"] });
      toast.success("Solicitação salva com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao salvar solicitação:", error);
      toast.error("Erro ao salvar solicitação.");
    },
  });
}

export function useAprovarSolicitacaoAbono() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      nivel,
      encerra = false,
    }: {
      id: string;
      nivel: 'chefia' | 'rh';
      /** Chefia encerra o fluxo (status `aprovado`) quando o tipo de abono dispensa o RH. */
      encerra?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const updates = nivel === 'chefia' 
        ? { 
            status: encerra ? ('aprovado' as const) : ('aprovado_chefia' as const),
            aprovado_chefia_por: user.id,
            aprovado_chefia_em: new Date().toISOString(),
          }
        : { 
            status: 'aprovado' as const,
            aprovado_rh_por: user.id,
            aprovado_rh_em: new Date().toISOString(),
          };

      const { data, error } = await supabase
        .from("solicitacoes_abono")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solicitacoes-abono"] });
      toast.success("Solicitação aprovada!");
    },
    onError: (error) => {
      console.error("Erro ao aprovar:", error);
      toast.error("Erro ao aprovar solicitação.");
    },
  });
}

export function useRejeitarSolicitacaoAbono() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { data, error } = await supabase
        .from("solicitacoes_abono")
        .update({ 
          status: 'rejeitado' as const,
          motivo_rejeicao: motivo,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solicitacoes-abono"] });
      toast.success("Solicitação rejeitada.");
    },
    onError: (error) => {
      console.error("Erro ao rejeitar:", error);
      toast.error("Erro ao rejeitar solicitação.");
    },
  });
}

// ============================================
// FECHAMENTO INDIVIDUAL
// ============================================

export function useFechamentoServidor(servidorId: string | undefined, ano: number, mes: number) {
  return useQuery({
    queryKey: ["frequencia-fechamento", servidorId, ano, mes],
    queryFn: async () => {
      if (!servidorId) return null;

      const { data, error } = await supabase
        .from("frequencia_fechamento")
        .select("*")
        .eq("servidor_id", servidorId)
        .eq("ano", ano)
        .eq("mes", mes)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as FrequenciaFechamento | null;
    },
    enabled: !!servidorId && ano > 0 && mes > 0,
  });
}

export function useAssinarFrequencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      servidor_id, 
      ano, 
      mes 
    }: { 
      servidor_id: string; 
      ano: number; 
      mes: number 
    }) => {
      const { data, error } = await supabase
        .from("frequencia_fechamento")
        .upsert({
          servidor_id,
          ano,
          mes,
          assinado_servidor: true,
          assinado_servidor_em: new Date().toISOString(),
        }, { onConflict: "servidor_id,ano,mes" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ["frequencia-fechamento", data.servidor_id, data.ano, data.mes] 
      });
      queryClient.invalidateQueries({ queryKey: ["frequencia-fechamentos", data.ano, data.mes] });
      toast.success("Frequência assinada com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao assinar:", error);
      toast.error("Erro ao assinar frequência.");
    },
  });
}

export function useValidarFrequenciaChefia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      servidor_id, 
      ano, 
      mes 
    }: { 
      servidor_id: string; 
      ano: number; 
      mes: number 
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("frequencia_fechamento")
        .upsert({
          servidor_id,
          ano,
          mes,
          validado_chefia: true,
          validado_chefia_por: user.id,
          validado_chefia_em: new Date().toISOString(),
        }, { onConflict: "servidor_id,ano,mes" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ["frequencia-fechamento", data.servidor_id, data.ano, data.mes] 
      });
      queryClient.invalidateQueries({ queryKey: ["frequencia-fechamentos", data.ano, data.mes] });
      toast.success("Frequência validada pela chefia!");
    },
    onError: (error) => {
      console.error("Erro ao validar:", error);
      toast.error("Erro ao validar frequência.");
    },
  });
}

export function useConsolidarFrequenciaRH() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      servidor_id, 
      ano, 
      mes 
    }: { 
      servidor_id: string; 
      ano: number; 
      mes: number 
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("frequencia_fechamento")
        .upsert({
          servidor_id,
          ano,
          mes,
          consolidado_rh: true,
          consolidado_rh_por: user.id,
          consolidado_rh_em: new Date().toISOString(),
          reaberto: false,
        }, { onConflict: "servidor_id,ano,mes" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ 
        queryKey: ["frequencia-fechamento", data.servidor_id, data.ano, data.mes] 
      });
      queryClient.invalidateQueries({ queryKey: ["frequencia-fechamentos", data.ano, data.mes] });
      toast.success("Frequência consolidada pelo RH!");
    },
    onError: (error) => {
      console.error("Erro ao consolidar:", error);
      toast.error("Erro ao consolidar frequência.");
    },
  });
}

// ============================================
// FECHAMENTO DA COMPETÊNCIA (fluxo chefia → RH)
// ============================================

/** Fechamentos individuais da competência, com o servidor embutido. */
export function useFechamentosCompetencia(ano: number, mes: number) {
  return useQuery({
    queryKey: ["frequencia-fechamentos", ano, mes],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("frequencia_fechamento")
        .select(`
          *,
          servidor:servidor_id(nome_completo, matricula, unidade_atual_id, unidade:unidade_atual_id(nome, sigla))
        `)
        .eq("ano", ano)
        .eq("mes", mes);

      if (error) throw error;
      return data as unknown as FrequenciaFechamento[];
    },
    enabled: ano > 0 && mes > 0,
  });
}

/** Consolida vários servidores de uma vez (N upserts numa chamada; sem atomicidade de RPC). */
export function useConsolidarFrequenciaLote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ servidorIds, ano, mes }: { servidorIds: string[]; ano: number; mes: number }) => {
      if (servidorIds.length === 0) return [];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const agora = new Date().toISOString();
      const linhas = servidorIds.map((servidor_id) => ({
        servidor_id,
        ano,
        mes,
        consolidado_rh: true,
        consolidado_rh_por: user.id,
        consolidado_rh_em: agora,
        reaberto: false,
      }));

      const { data, error } = await supabase
        .from("frequencia_fechamento")
        .upsert(linhas, { onConflict: "servidor_id,ano,mes" })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["frequencia-fechamentos", variables.ano, variables.mes] });
      queryClient.invalidateQueries({ queryKey: ["frequencia-fechamento"] });
      toast.success(`${variables.servidorIds.length} frequência(s) consolidada(s) pelo RH.`);
    },
    onError: (error) => {
      console.error("Erro ao consolidar em lote:", error);
      toast.error("Erro ao consolidar frequências.");
    },
  });
}

/** Reabre um fechamento consolidado; a justificativa é obrigatória. */
export function useReabrirFrequencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      servidorId,
      ano,
      mes,
      justificativa,
    }: {
      servidorId: string;
      ano: number;
      mes: number;
      justificativa: string;
    }) => {
      if (!justificativa.trim()) throw new Error("Justificativa obrigatória");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("frequencia_fechamento")
        .update({
          reaberto: true,
          reaberto_por: user.id,
          reaberto_em: new Date().toISOString(),
          justificativa_reabertura: justificativa.trim(),
        })
        .eq("servidor_id", servidorId)
        .eq("ano", ano)
        .eq("mes", mes)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["frequencia-fechamento", data.servidor_id, data.ano, data.mes] });
      queryClient.invalidateQueries({ queryKey: ["frequencia-fechamentos", data.ano, data.mes] });
      toast.success("Frequência reaberta.");
    },
    onError: (error) => {
      console.error("Erro ao reabrir:", error);
      toast.error("Erro ao reabrir frequência.");
    },
  });
}

/** Marca a competência como consolidada em `config_fechamento_frequencia`. */
export function useFecharCompetencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ ano, mes }: { ano: number; mes: number }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("config_fechamento_frequencia")
        .upsert(
          {
            ano,
            mes,
            status: "consolidado",
            consolidado_em: new Date().toISOString(),
            consolidado_por: user.id,
          },
          { onConflict: "ano,mes" },
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["config-fechamento", data.ano, data.mes] });
      toast.success("Competência consolidada.");
    },
    onError: (error) => {
      console.error("Erro ao fechar competência:", error);
      toast.error("Erro ao fechar a competência.");
    },
  });
}

// ============================================
// MINHA EQUIPE (chefia)
// ============================================

export interface MinhaEquipe {
  /** Unidades em que o usuário logado é o responsável (estrutura_organizacional.servidor_responsavel_id). */
  unidadeIds: string[];
  servidores: { id: string; nome_completo: string; matricula?: string | null; unidade_atual_id?: string | null }[];
}

/** Servidores das unidades chefiadas pelo usuário logado. Vazio para quem não chefia unidade. */
export function useMinhaEquipe() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["minha-equipe", user?.id],
    enabled: !!user?.id,
    queryFn: async (): Promise<MinhaEquipe> => {
      const { data: unidades, error: errUnidades } = await supabase
        .from("estrutura_organizacional")
        .select("id")
        .eq("servidor_responsavel_id", user!.id)
        .eq("ativo", true);

      if (errUnidades) throw errUnidades;
      const unidadeIds = (unidades || []).map((u) => u.id);
      if (unidadeIds.length === 0) return { unidadeIds, servidores: [] };

      const { data: servidores, error: errServidores } = await supabase
        .from("servidores")
        .select("id, nome_completo, matricula, unidade_atual_id")
        .in("unidade_atual_id", unidadeIds)
        .eq("ativo", true)
        .order("nome_completo");

      if (errServidores) throw errServidores;
      return { unidadeIds, servidores: servidores || [] };
    },
  });
}

// ============================================
// REGIME POR SERVIDOR
// ============================================

export function useServidorRegime(servidorId: string | undefined) {
  return useQuery({
    queryKey: ["servidor-regime", servidorId],
    queryFn: async () => {
      if (!servidorId) return null;

      const { data, error } = await supabase
        .from("servidor_regime")
        .select(`
          *,
          regime:regime_id(*),
          jornada:jornada_id(*)
        `)
        .eq("servidor_id", servidorId)
        .eq("ativo", true)
        .order("data_inicio", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as unknown as ServidorRegime | null;
    },
    enabled: !!servidorId,
  });
}

export function useSalvarServidorRegime() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (regime: Partial<ServidorRegime>) => {
      const { id, servidor, regime: _r, jornada, ...dados } = regime as any;

      if (id) {
        const { data, error } = await supabase
          .from("servidor_regime")
          .update(dados)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("servidor_regime")
          .insert(dados)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["servidor-regime", data.servidor_id] });
      toast.success("Regime do servidor salvo!");
    },
    onError: (error) => {
      console.error("Erro ao salvar regime:", error);
      toast.error("Erro ao salvar regime do servidor.");
    },
  });
}
