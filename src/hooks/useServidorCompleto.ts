import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { 
  TipoServidor, 
  TipoLotacao,
  StatusProvimento,
  Provimento,
  Cessao,
  LotacaoCompleta,
  ServidorSituacao 
} from "@/types/servidor";

// ============================================================
// QUERIES
// ============================================================

export function useServidoresSituacao() {
  return useQuery({
    queryKey: ["servidores-situacao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_servidores_situacao")
        .select("*")
        .order("nome_completo");
      if (error) throw error;
      return data as ServidorSituacao[];
    },
  });
}

export function useProvimentosServidor(servidorId: string | undefined) {
  return useQuery({
    queryKey: ["provimentos", servidorId],
    queryFn: async () => {
      if (!servidorId) return [];
      const { data, error } = await supabase
        .from("provimentos")
        .select(`*, cargo:cargos(id, nome, sigla, natureza), unidade:estrutura_organizacional(id, nome, sigla)`)
        .eq("servidor_id", servidorId)
        .order("data_nomeacao", { ascending: false });
      if (error) throw error;
      return data as Provimento[];
    },
    enabled: !!servidorId,
  });
}

export function useCessoesServidor(servidorId: string | undefined) {
  return useQuery({
    queryKey: ["cessoes", servidorId],
    queryFn: async () => {
      if (!servidorId) return [];
      const { data, error } = await supabase
        .from("cessoes")
        .select(`*, unidade_idjuv:estrutura_organizacional(id, nome, sigla)`)
        .eq("servidor_id", servidorId)
        .order("data_inicio", { ascending: false });
      if (error) throw error;
      return data as Cessao[];
    },
    enabled: !!servidorId,
  });
}

export function useLotacoesServidor(servidorId: string | undefined) {
  return useQuery({
    queryKey: ["lotacoes-servidor", servidorId],
    queryFn: async () => {
      if (!servidorId) return [];
      const { data, error } = await supabase
        .from("lotacoes")
        .select(`*, unidade:estrutura_organizacional(id, nome, sigla), cargo:cargos(id, nome, sigla)`)
        .eq("servidor_id", servidorId)
        .order("data_inicio", { ascending: false });
      if (error) throw error;
      return data as LotacaoCompleta[];
    },
    enabled: !!servidorId,
  });
}

// ============================================================
// HELPER: Invalidar todos os caches relacionados ao servidor
// ============================================================

function invalidateServidorCaches(queryClient: ReturnType<typeof useQueryClient>, servidorId: string) {
  queryClient.invalidateQueries({ queryKey: ["provimentos", servidorId] });
  queryClient.invalidateQueries({ queryKey: ["cessoes", servidorId] });
  queryClient.invalidateQueries({ queryKey: ["lotacoes-servidor", servidorId] });
  queryClient.invalidateQueries({ queryKey: ["historico-funcional", servidorId] });
  queryClient.invalidateQueries({ queryKey: ["portarias-servidor", servidorId] });
  queryClient.invalidateQueries({ queryKey: ["servidores-situacao"] });
  queryClient.invalidateQueries({ queryKey: ["servidores-rh"] });
  queryClient.invalidateQueries({ queryKey: ["portarias"] });
}

// ============================================================
// HELPER: Registrar no histórico funcional
// ============================================================

type TipoMovimentacao = "nomeacao" | "exoneracao" | "designacao" | "dispensa" | "promocao" | "transferencia" | "cessao" | "requisicao" | "redistribuicao" | "remocao" | "afastamento" | "retorno" | "aposentadoria" | "vacancia";

async function registrarHistoricoFuncional(params: {
  servidor_id: string;
  tipo: TipoMovimentacao;
  data_evento: string;
  cargo_anterior_id?: string | null;
  cargo_novo_id?: string | null;
  unidade_anterior_id?: string | null;
  unidade_nova_id?: string | null;
  portaria_numero?: string | null;
  portaria_data?: string | null;
  descricao?: string;
}) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("historico_funcional")
      .insert({
        servidor_id: params.servidor_id,
        tipo: params.tipo,
        data_evento: params.data_evento,
        data_vigencia_inicio: params.data_evento,
        cargo_anterior_id: params.cargo_anterior_id || null,
        cargo_novo_id: params.cargo_novo_id || null,
        unidade_anterior_id: params.unidade_anterior_id || null,
        unidade_nova_id: params.unidade_nova_id || null,
        portaria_numero: params.portaria_numero || null,
        portaria_data: params.portaria_data || null,
        descricao: params.descricao || null,
        created_by: userData?.user?.id,
      });
    
    if (error) {
      console.error("[Histórico Funcional] Erro ao registrar:", error);
    }
  } catch (e) {
    console.error("[Histórico Funcional] Erro inesperado:", e);
  }
}

// ============================================================
// HELPER: Gerar minuta de portaria na tabela documentos
// ============================================================

type CategoriaPortaria = "estruturante" | "normativa" | "pessoal" | "delegacao" | "nomeacao" | "exoneracao" | "designacao" | "dispensa" | "cessao" | "ferias" | "licenca";

async function gerarMinutaPortaria(params: {
  titulo: string;
  ementa: string;
  categoria: CategoriaPortaria;
  servidores_ids: string[];
  cargo_id?: string;
  unidade_id?: string;
  data_documento?: string;
  provimento_id?: string;
}) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const dataDoc = params.data_documento || new Date().toISOString().split("T")[0];
    const ano = new Date(dataDoc).getFullYear();

    // Gerar número automático
    let numero = `PENDENTE/${ano}`;
    try {
      const { data: numData } = await supabase.rpc("gerar_numero_portaria", { p_ano: ano });
      if (numData) numero = numData as string;
    } catch {
      // keep default
    }

    const { data, error } = await supabase
      .from("documentos")
      .insert({
        tipo: "portaria" as const,
        categoria: params.categoria,
        status: "minuta" as const,
        titulo: params.titulo,
        ementa: params.ementa,
        numero,
        data_documento: dataDoc,
        servidores_ids: params.servidores_ids,
        cargo_id: params.cargo_id || null,
        unidade_id: params.unidade_id || null,
        provimento_id: params.provimento_id || null,
        created_by: userData?.user?.id,
      })
      .select("id, numero")
      .single();

    if (error) {
      console.error("[Portaria] Erro ao gerar minuta:", error);
      return null;
    }
    
    return data;
  } catch (e) {
    console.error("[Portaria] Erro inesperado:", e);
    return null;
  }
}

// ============================================================
// MUTATIONS
// ============================================================

/**
 * Criar provimento - SINCRONIZADO
 * 1. Insere provimento
 * 2. Registra no histórico funcional
 * 3. Gera minuta de portaria de nomeação
 */
export function useCreateProvimento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (provimento: Omit<Provimento, 'id' | 'created_at' | 'cargo' | 'unidade'>) => {
      // 1. Inserir provimento
      const { data, error } = await supabase
        .from("provimentos")
        .insert(provimento)
        .select(`*, cargo:cargos(id, nome, sigla), unidade:estrutura_organizacional(id, nome, sigla)`)
        .single();
      
      if (error) throw error;

      // 2. Registrar no histórico funcional
      await registrarHistoricoFuncional({
        servidor_id: data.servidor_id,
        tipo: "nomeacao",
        data_evento: data.data_nomeacao,
        cargo_novo_id: data.cargo_id,
        unidade_nova_id: data.unidade_id || null,
        descricao: `Nomeação para cargo ${data.cargo?.nome || 'N/A'}${data.unidade?.sigla ? ` na ${data.unidade.sigla}` : ''}`,
      });

      // 3. Gerar minuta de portaria de nomeação
      const cargoNome = data.cargo?.sigla 
        ? `${data.cargo.sigla} - ${data.cargo.nome}` 
        : data.cargo?.nome || 'N/A';
      
      const { data: servidor } = await supabase
        .from("servidores")
        .select("nome_completo")
        .eq("id", data.servidor_id)
        .maybeSingle();

      const nomeServidor = servidor?.nome_completo || 'Servidor';

      const portaria = await gerarMinutaPortaria({
        titulo: `Nomeação - ${nomeServidor}`,
        ementa: `Nomeia ${nomeServidor} para o cargo de ${cargoNome}.`,
        categoria: "nomeacao",
        servidores_ids: [data.servidor_id],
        cargo_id: data.cargo_id,
        unidade_id: data.unidade_id || undefined,
        data_documento: data.data_nomeacao,
        provimento_id: data.id,
      });

      return { provimento: data, portaria };
    },
    onSuccess: (result) => {
      invalidateServidorCaches(queryClient, result.provimento.servidor_id);
      
      const msg = result.portaria
        ? `Nomeação registrada! Minuta de Portaria nº ${result.portaria.numero} gerada automaticamente.`
        : "Nomeação registrada com sucesso!";
      toast.success(msg);
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar provimento: ${error.message}`);
    },
  });
}

/**
 * Encerrar provimento - SINCRONIZADO
 * 1. Busca dados atuais do provimento
 * 2. Atualiza provimento para encerrado
 * 3. Encerra lotação ativa correspondente
 * 4. Registra no histórico funcional
 * 5. Gera minuta de portaria de exoneração
 */
export function useEncerrarProvimento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      provimentoId, 
      motivo, 
      dataEncerramento,
      atoTipo,
      atoNumero,
      atoData 
    }: { 
      provimentoId: string; 
      motivo: string;
      dataEncerramento: string;
      atoTipo?: string;
      atoNumero?: string;
      atoData?: string;
    }) => {
      // 1. Buscar dados completos do provimento
      const { data: provimentoAtual, error: fetchError } = await supabase
        .from("provimentos")
        .select(`*, cargo:cargos(id, nome, sigla), unidade:estrutura_organizacional(id, nome, sigla)`)
        .eq("id", provimentoId)
        .single();
      
      if (fetchError) throw fetchError;

      // 2. Encerrar provimento
      const { data, error } = await supabase
        .from("provimentos")
        .update({
          status: 'encerrado' as StatusProvimento,
          data_encerramento: dataEncerramento,
          motivo_encerramento: motivo,
          ato_encerramento_tipo: atoTipo,
          ato_encerramento_numero: atoNumero,
          ato_encerramento_data: atoData,
        })
        .eq("id", provimentoId)
        .select()
        .single();
      
      if (error) throw error;

      // 3. Encerrar lotação ativa do servidor
      try {
        await supabase
          .from("lotacoes")
          .update({ ativo: false, data_fim: dataEncerramento })
          .eq("servidor_id", data.servidor_id)
          .eq("ativo", true);
      } catch (e) {
        console.error("[Lotação] Erro ao encerrar lotação ativa:", e);
      }

      // 4. Registrar no histórico funcional
      const cargoNome = provimentoAtual.cargo?.nome || 'N/A';
      await registrarHistoricoFuncional({
        servidor_id: data.servidor_id,
        tipo: "exoneracao",
        data_evento: dataEncerramento,
        cargo_anterior_id: data.cargo_id,
        unidade_anterior_id: provimentoAtual.unidade_id || null,
        portaria_numero: atoNumero || null,
        portaria_data: atoData || null,
        descricao: `Exoneração do cargo ${cargoNome}. Motivo: ${motivo}`,
      });

      // 5. Gerar minuta de portaria de exoneração
      const { data: servidor } = await supabase
        .from("servidores")
        .select("nome_completo")
        .eq("id", data.servidor_id)
        .maybeSingle();

      const nomeServidor = servidor?.nome_completo || 'Servidor';
      const motivoLabel = motivo === 'exoneracao' ? 'a pedido' : motivo;

      const portaria = await gerarMinutaPortaria({
        titulo: `Exoneração - ${nomeServidor}`,
        ementa: `Exonera, ${motivoLabel}, ${nomeServidor} do cargo de ${cargoNome}.`,
        categoria: "exoneracao",
        servidores_ids: [data.servidor_id],
        cargo_id: data.cargo_id,
        unidade_id: provimentoAtual.unidade_id || undefined,
        data_documento: dataEncerramento,
      });

      return { provimento: data, portaria };
    },
    onSuccess: (result) => {
      invalidateServidorCaches(queryClient, result.provimento.servidor_id);
      
      const msg = result.portaria
        ? `Provimento encerrado! Minuta de Portaria nº ${result.portaria.numero} gerada. Lotação ativa encerrada.`
        : "Provimento encerrado com sucesso!";
      toast.success(msg);
    },
    onError: (error: any) => {
      toast.error(`Erro ao encerrar provimento: ${error.message}`);
    },
  });
}

/**
 * Criar cessão - SINCRONIZADO
 * 1. Insere cessão
 * 2. Registra no histórico funcional
 */
export function useCreateCessao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (cessao: Omit<Cessao, 'id' | 'created_at' | 'unidade_idjuv'>) => {
      const { data, error } = await supabase
        .from("cessoes")
        .insert(cessao)
        .select()
        .single();
      
      if (error) throw error;

      // Buscar nome do servidor
      const { data: servidor } = await supabase
        .from("servidores")
        .select("nome_completo")
        .eq("id", data.servidor_id)
        .maybeSingle();

      const nomeServidor = servidor?.nome_completo || 'Servidor';
      const orgao = data.tipo === 'entrada' ? data.orgao_origem : data.orgao_destino;
      const direcao = data.tipo === 'entrada' ? 'proveniente de' : 'cedido para';

      await registrarHistoricoFuncional({
        servidor_id: data.servidor_id,
        tipo: "cessao",
        data_evento: data.data_inicio,
        descricao: `Cessão de ${data.tipo}: ${nomeServidor} ${direcao} ${orgao || 'outro órgão'}`,
      });

      return data;
    },
    onSuccess: (data) => {
      invalidateServidorCaches(queryClient, data.servidor_id);
      toast.success("Cessão registrada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar cessão: ${error.message}`);
    },
  });
}

/**
 * Encerrar cessão (retorno) - SINCRONIZADO
 * 1. Busca dados da cessão
 * 2. Atualiza cessão para encerrada
 * 3. Registra retorno no histórico funcional
 */
export function useEncerrarCessao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      cessaoId, 
      dataRetorno,
      atoRetornoNumero,
      atoRetornoData 
    }: { 
      cessaoId: string; 
      dataRetorno: string;
      atoRetornoNumero?: string;
      atoRetornoData?: string;
    }) => {
      // Buscar dados da cessão
      const { data: cessaoAtual, error: fetchError } = await supabase
        .from("cessoes")
        .select("*")
        .eq("id", cessaoId)
        .single();
      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from("cessoes")
        .update({
          ativa: false,
          data_fim: dataRetorno,
          data_retorno: dataRetorno,
          ato_retorno_numero: atoRetornoNumero,
          ato_retorno_data: atoRetornoData,
        })
        .eq("id", cessaoId)
        .select()
        .single();
      
      if (error) throw error;

      // Buscar nome do servidor
      const { data: servidor } = await supabase
        .from("servidores")
        .select("nome_completo")
        .eq("id", data.servidor_id)
        .maybeSingle();

      const nomeServidor = servidor?.nome_completo || 'Servidor';
      const orgao = cessaoAtual.tipo === 'entrada' ? cessaoAtual.orgao_origem : cessaoAtual.orgao_destino;

      await registrarHistoricoFuncional({
        servidor_id: data.servidor_id,
        tipo: "retorno",
        data_evento: dataRetorno,
        portaria_numero: atoRetornoNumero || null,
        portaria_data: atoRetornoData || null,
        descricao: `Retorno de cessão de ${cessaoAtual.tipo}: ${nomeServidor} retorna de ${orgao || 'outro órgão'}`,
      });

      return data;
    },
    onSuccess: (data) => {
      invalidateServidorCaches(queryClient, data.servidor_id);
      toast.success("Cessão encerrada - Servidor retornou!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao encerrar cessão: ${error.message}`);
    },
  });
}

/**
 * Criar lotação - SINCRONIZADO
 * 1. Encerra lotação ativa anterior
 * 2. Insere nova lotação
 * 3. Registra no histórico funcional
 */
export function useCreateLotacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (lotacao: {
      servidor_id: string;
      unidade_id: string;
      cargo_id?: string;
      tipo_lotacao: TipoLotacao;
      data_inicio: string;
      funcao_exercida?: string;
      orgao_externo?: string;
      ato_tipo?: string;
      ato_numero?: string;
      ato_data?: string;
      ato_doe_numero?: string;
      ato_doe_data?: string;
      tipo_movimentacao?: string;
      observacao?: string;
    }) => {
      // 1. Encerrar lotação ativa anterior (se houver)
      const { data: lotacaoAtiva } = await supabase
        .from("lotacoes")
        .select("id, unidade_id")
        .eq("servidor_id", lotacao.servidor_id)
        .eq("ativo", true)
        .maybeSingle();

      if (lotacaoAtiva) {
        await supabase
          .from("lotacoes")
          .update({ ativo: false, data_fim: lotacao.data_inicio })
          .eq("id", lotacaoAtiva.id);
      }

      // 2. Inserir nova lotação
      const { data, error } = await supabase
        .from("lotacoes")
        .insert({ ...lotacao, ativo: true })
        .select(`*, unidade:estrutura_organizacional(id, nome, sigla)`)
        .single();
      
      if (error) throw error;

      // 3. Registrar no histórico funcional
      await registrarHistoricoFuncional({
        servidor_id: lotacao.servidor_id,
        tipo: "transferencia",
        data_evento: lotacao.data_inicio,
        unidade_anterior_id: lotacaoAtiva?.unidade_id || null,
        unidade_nova_id: lotacao.unidade_id,
        descricao: `Lotação em ${data.unidade?.sigla || data.unidade?.nome || 'unidade'}`,
      });

      return data;
    },
    onSuccess: (data) => {
      invalidateServidorCaches(queryClient, data.servidor_id);
      toast.success("Lotação criada com sucesso!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao criar lotação: ${error.message}`);
    },
  });
}

/**
 * Atualizar tipo_servidor
 */
export function useUpdateTipoServidor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      servidorId, 
      tipoServidor,
      orgaoOrigem,
      orgaoDestino,
      funcaoExercida
    }: { 
      servidorId: string; 
      tipoServidor: TipoServidor;
      orgaoOrigem?: string;
      orgaoDestino?: string;
      funcaoExercida?: string;
    }) => {
      const { data, error } = await supabase
        .from("servidores")
        .update({
          tipo_servidor: tipoServidor,
          orgao_origem: orgaoOrigem,
          orgao_destino_cessao: orgaoDestino,
          funcao_exercida: funcaoExercida,
        })
        .eq("id", servidorId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      invalidateServidorCaches(queryClient, vars.servidorId);
      toast.success("Tipo de servidor atualizado!");
    },
    onError: (error: any) => {
      toast.error(`Erro ao atualizar tipo: ${error.message}`);
    },
  });
}
