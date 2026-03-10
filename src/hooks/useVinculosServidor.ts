/**
 * Hook consolidado para gerenciar vínculos de um servidor
 * Fonte única de verdade — substitui provimentos + lotações + vínculos antigos
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Tipos
export type TipoVinculoServidor =
  | "efetivo"
  | "comissionado"
  | "cedido_entrada"
  | "requisitado"
  | "federal"
  | "temporario"
  | "estagiario";

export type OrigemVinculo =
  | "idjuv"
  | "estado_rr"
  | "federal"
  | "municipal"
  | "outro_orgao";

export interface VinculoServidor {
  id: string;
  servidor_id: string;
  tipo: TipoVinculoServidor;
  origem: OrigemVinculo;
  orgao_nome?: string;
  cargo_id?: string;
  unidade_id?: string;
  funcao_exercida?: string;
  onus?: "origem" | "destino" | "compartilhado";
  data_inicio: string;
  data_fim?: string;
  data_posse?: string;
  data_exercicio?: string;
  motivo_encerramento?: string;
  ativo: boolean;
  ato_tipo?: string;
  ato_numero?: string;
  ato_data?: string;
  ato_doe_numero?: string;
  ato_doe_data?: string;
  ato_url?: string;
  remuneracao_bruta?: number;
  gratificacoes?: number;
  observacoes?: string;
  created_at?: string;
  // Joins
  cargo?: { id: string; nome: string; sigla?: string };
  unidade?: { id: string; nome: string; sigla?: string };
}

export interface ServidorTipoDerivado {
  servidor_id: string;
  nome_completo: string;
  matricula?: string;
  tipo_derivado: string;
  total_vinculos_ativos: number;
  tipos_ativos: string[] | null;
}

// Labels para exibição
export const TIPO_VINCULO_LABELS: Record<TipoVinculoServidor, string> = {
  efetivo: "Efetivo",
  comissionado: "Comissionado",
  cedido_entrada: "Cedido (Entrada)",
  requisitado: "Requisitado",
  federal: "Federal",
  temporario: "Temporário",
  estagiario: "Estagiário",
};

export const TIPO_DERIVADO_LABELS: Record<string, string> = {
  efetivo: "Efetivo",
  comissionado: "Comissionado",
  efetivo_comissionado: "Efetivo + Comissionado",
  cedido_entrada: "Cedido (Entrada)",
  cedido_comissionado: "Cedido + Comissionado",
  federal: "Federal",
  federal_comissionado: "Federal + Comissionado",
  requisitado: "Requisitado",
  nao_classificado: "Não classificado",
};

export const TIPO_DERIVADO_COLORS: Record<string, string> = {
  efetivo: "bg-success/20 text-success border-success/30",
  comissionado: "bg-primary/20 text-primary border-primary/30",
  efetivo_comissionado: "bg-emerald-500/20 text-emerald-600 border-emerald-500/30",
  cedido_entrada: "bg-info/20 text-info border-info/30",
  cedido_comissionado: "bg-cyan-500/20 text-cyan-600 border-cyan-500/30",
  federal: "bg-violet-500/20 text-violet-600 border-violet-500/30",
  federal_comissionado: "bg-purple-500/20 text-purple-600 border-purple-500/30",
  requisitado: "bg-warning/20 text-warning border-warning/30",
  nao_classificado: "bg-muted text-muted-foreground border-muted",
};

export const ORIGEM_LABELS: Record<OrigemVinculo, string> = {
  idjuv: "IDJuv",
  estado_rr: "Estado de Roraima",
  federal: "Federal",
  municipal: "Municipal",
  outro_orgao: "Outro Órgão",
};

// Hook: Buscar vínculos de um servidor
export function useVinculosServidor(servidorId?: string) {
  return useQuery({
    queryKey: ["vinculos-servidor", servidorId],
    enabled: !!servidorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vinculos_servidor")
        .select("*")
        .eq("servidor_id", servidorId!)
        .order("ativo", { ascending: false })
        .order("data_inicio", { ascending: false });
      if (error) throw error;

      const cargoIds = [...new Set((data || []).map(v => v.cargo_id).filter(Boolean))];
      const unidadeIds = [...new Set((data || []).map(v => v.unidade_id).filter(Boolean))];

      const [cargos, unidades] = await Promise.all([
        cargoIds.length > 0
          ? supabase.from("cargos").select("id, nome, sigla").in("id", cargoIds).then(r => r.data || [])
          : Promise.resolve([]),
        unidadeIds.length > 0
          ? supabase.from("estrutura_organizacional").select("id, nome, sigla").in("id", unidadeIds).then(r => r.data || [])
          : Promise.resolve([]),
      ]);

      const cargosMap = new Map<string, any>(cargos.map((c: any) => [c.id, c] as [string, any]));
      const unidadesMap = new Map<string, any>(unidades.map((u: any) => [u.id, u] as [string, any]));

      return (data || []).map(v => ({
        ...v,
        cargo: v.cargo_id ? cargosMap.get(v.cargo_id) : undefined,
        unidade: v.unidade_id ? unidadesMap.get(v.unidade_id) : undefined,
      })) as VinculoServidor[];
    },
  });
}

// Hook: Buscar tipos derivados para listagem
export function useServidoresTipoDerivado() {
  return useQuery({
    queryKey: ["servidores-tipo-derivado"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_servidor_tipo_derivado")
        .select("*");
      if (error) throw error;
      return (data || []) as ServidorTipoDerivado[];
    },
  });
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
    await supabase.from("historico_funcional").insert({
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
  } catch (e) {
    console.error("[Histórico Funcional] Erro:", e);
  }
}

// ============================================================
// HELPER: Gerar minuta de portaria
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
}) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const dataDoc = params.data_documento || new Date().toISOString().split("T")[0];
    const ano = new Date(dataDoc).getFullYear();

    let numero = `PENDENTE/${ano}`;
    try {
      const { data: numData } = await supabase.rpc("gerar_numero_portaria", { p_ano: ano });
      if (numData) numero = numData as string;
    } catch { /* keep default */ }

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
        created_by: userData?.user?.id,
      })
      .select("id, numero")
      .single();

    if (error) {
      console.error("[Portaria] Erro:", error);
      return null;
    }
    return data;
  } catch (e) {
    console.error("[Portaria] Erro:", e);
    return null;
  }
}

// Mutations
export function useVinculoMutations(servidorId?: string) {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["vinculos-servidor", servidorId] });
    queryClient.invalidateQueries({ queryKey: ["servidores-tipo-derivado"] });
    queryClient.invalidateQueries({ queryKey: ["servidores-rh"] });
    queryClient.invalidateQueries({ queryKey: ["historico-funcional", servidorId] });
    queryClient.invalidateQueries({ queryKey: ["servidores-situacao"] });
  };

  const criar = useMutation({
    mutationFn: async (vinculo: Omit<VinculoServidor, "id" | "created_at" | "cargo" | "unidade">) => {
      const { data, error } = await supabase
        .from("vinculos_servidor")
        .insert(vinculo as any)
        .select()
        .single();
      if (error) throw error;

      // Buscar nome do servidor e cargo para histórico/portaria
      const [servidorRes, cargoRes] = await Promise.all([
        supabase.from("servidores").select("nome_completo").eq("id", data.servidor_id).maybeSingle(),
        data.cargo_id ? supabase.from("cargos").select("id, nome, sigla").eq("id", data.cargo_id).maybeSingle() : Promise.resolve({ data: null }),
      ]);

      const nomeServidor = servidorRes.data?.nome_completo || 'Servidor';
      const cargoNome = cargoRes.data?.sigla ? `${cargoRes.data.sigla} - ${cargoRes.data.nome}` : cargoRes.data?.nome || '';

      // Registrar histórico funcional
      await registrarHistoricoFuncional({
        servidor_id: data.servidor_id,
        tipo: "nomeacao",
        data_evento: data.data_inicio,
        cargo_novo_id: data.cargo_id,
        unidade_nova_id: data.unidade_id || null,
        descricao: cargoNome
          ? `Nomeação para ${cargoNome}`
          : `Novo vínculo: ${data.tipo}`,
      });

      // Gerar portaria se tem cargo
      let portaria = null;
      if (data.cargo_id) {
        portaria = await gerarMinutaPortaria({
          titulo: `Nomeação - ${nomeServidor}`,
          ementa: `Nomeia ${nomeServidor} para o cargo de ${cargoNome}.`,
          categoria: "nomeacao",
          servidores_ids: [data.servidor_id],
          cargo_id: data.cargo_id,
          unidade_id: data.unidade_id || undefined,
          data_documento: data.data_inicio,
        });
      }

      return { vinculo: data, portaria };
    },
    onSuccess: (result) => {
      const msg = result.portaria
        ? `Vínculo criado! Minuta de Portaria nº ${result.portaria.numero} gerada automaticamente.`
        : "Vínculo criado com sucesso!";
      toast.success(msg);
      invalidate();
    },
    onError: (err: any) => toast.error("Erro ao criar vínculo: " + err.message),
  });

  const atualizar = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<VinculoServidor> & { id: string }) => {
      const { cargo, unidade, ...cleanUpdates } = updates as any;
      const { data, error } = await supabase
        .from("vinculos_servidor")
        .update(cleanUpdates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Vínculo atualizado");
      invalidate();
    },
    onError: (err: any) => toast.error("Erro ao atualizar: " + err.message),
  });

  const encerrar = useMutation({
    mutationFn: async ({ id, dataFim, motivo }: { id: string; dataFim: string; motivo?: string }) => {
      // Buscar dados do vínculo antes de encerrar
      const { data: vinculoAtual } = await supabase
        .from("vinculos_servidor")
        .select("*")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("vinculos_servidor")
        .update({ ativo: false, data_fim: dataFim, motivo_encerramento: motivo || null })
        .eq("id", id);
      if (error) throw error;

      if (vinculoAtual) {
        // Verificar se o servidor ainda tem outros vínculos ativos
        const { data: outrosVinculos } = await supabase
          .from("vinculos_servidor")
          .select("id")
          .eq("servidor_id", vinculoAtual.servidor_id)
          .eq("ativo", true)
          .neq("id", id);

        const temOutrosVinculos = (outrosVinculos || []).length > 0;

        if (!temOutrosVinculos) {
          // Sem vínculos ativos → marcar servidor como inativo
          await supabase
            .from("servidores")
            .update({
              situacao: "inativo",
              ativo: false,
              cargo_atual_id: null,
              unidade_atual_id: null,
            })
            .eq("id", vinculoAtual.servidor_id);
        } else {
          // Ainda tem outros vínculos → limpar cargo/unidade se era deste vínculo
          const { data: servidorAtual } = await supabase
            .from("servidores")
            .select("cargo_atual_id, unidade_atual_id")
            .eq("id", vinculoAtual.servidor_id)
            .maybeSingle();

          if (servidorAtual) {
            const updates: any = {};
            if (servidorAtual.cargo_atual_id === vinculoAtual.cargo_id) {
              // Buscar cargo do próximo vínculo ativo
              const { data: proximoVinculo } = await supabase
                .from("vinculos_servidor")
                .select("cargo_id, unidade_id")
                .eq("servidor_id", vinculoAtual.servidor_id)
                .eq("ativo", true)
                .neq("id", id)
                .limit(1)
                .maybeSingle();
              updates.cargo_atual_id = proximoVinculo?.cargo_id || null;
              updates.unidade_atual_id = proximoVinculo?.unidade_id || null;
            }
            if (Object.keys(updates).length > 0) {
              await supabase.from("servidores").update(updates).eq("id", vinculoAtual.servidor_id);
            }
          }
        }
        // Buscar nome do servidor e cargo
        const [servidorRes, cargoRes] = await Promise.all([
          supabase.from("servidores").select("nome_completo").eq("id", vinculoAtual.servidor_id).maybeSingle(),
          vinculoAtual.cargo_id ? supabase.from("cargos").select("id, nome, sigla").eq("id", vinculoAtual.cargo_id).maybeSingle() : Promise.resolve({ data: null }),
        ]);

        const nomeServidor = servidorRes.data?.nome_completo || 'Servidor';
        const cargoNome = cargoRes.data?.sigla ? `${cargoRes.data.sigla} - ${cargoRes.data.nome}` : cargoRes.data?.nome || '';

        // Registrar histórico
        await registrarHistoricoFuncional({
          servidor_id: vinculoAtual.servidor_id,
          tipo: "exoneracao",
          data_evento: dataFim,
          cargo_anterior_id: vinculoAtual.cargo_id,
          unidade_anterior_id: vinculoAtual.unidade_id || null,
          descricao: cargoNome
            ? `Encerramento do vínculo: ${cargoNome}. Motivo: ${motivo || 'N/A'}`
            : `Encerramento do vínculo: ${vinculoAtual.tipo}`,
        });

        // Gerar portaria de exoneração se tem cargo
        if (vinculoAtual.cargo_id) {
          await gerarMinutaPortaria({
            titulo: `Exoneração - ${nomeServidor}`,
            ementa: `Exonera ${nomeServidor} do cargo de ${cargoNome}.`,
            categoria: "exoneracao",
            servidores_ids: [vinculoAtual.servidor_id],
            cargo_id: vinculoAtual.cargo_id,
            unidade_id: vinculoAtual.unidade_id || undefined,
            data_documento: dataFim,
          });
        }
      }
    },
    onSuccess: () => {
      toast.success("Vínculo encerrado. Portaria de exoneração gerada.");
      invalidate();
    },
    onError: (err: any) => toast.error("Erro ao encerrar: " + err.message),
  });

  return { criar, atualizar, encerrar };
}
