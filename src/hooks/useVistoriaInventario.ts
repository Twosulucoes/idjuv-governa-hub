/**
 * HOOK: VISTORIA DE UNIDADES EM CAMPANHA DE INVENTÁRIO (fase 1)
 *
 * Situação de cada unidade na campanha, fotos de evidência (URL assinada)
 * e geometria das unidades (importação de KML).
 *
 * As tabelas novas ainda não estão em src/integrations/supabase/types.ts
 * (gerado); por isso o acesso usa `(supabase as any)` com tipos locais.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  BUCKET_EVIDENCIAS_INVENTARIO,
  type FotoVistoria,
  type PoligonoGeoJson,
  type SituacaoUnidadeCampanha,
  type UnidadeCampanha,
  type UnidadeLocalGeo,
} from "@/types/inventarioCampo";

/** Validade das URLs assinadas das fotos (segundos) */
const VALIDADE_URL_ASSINADA_S = 600;

function numeroOuNulo(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// ========== UNIDADES DA CAMPANHA ==========

interface LinhaUnidadeCampanha extends Omit<UnidadeCampanha, "unidade"> {
  unidade: (Omit<UnidadeLocalGeo, "latitude" | "longitude" | "area_construida_m2"> & {
    latitude: number | string | null;
    longitude: number | string | null;
    area_construida_m2: number | string | null;
  }) | null;
}

export function useUnidadesCampanha(campanhaId: string | undefined) {
  return useQuery<UnidadeCampanha[]>({
    queryKey: ["unidades-campanha", campanhaId],
    queryFn: async (): Promise<UnidadeCampanha[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (supabase as any)
        .from("campanhas_inventario_unidades")
        .select(`
          id, campanha_id, unidade_local_id, situacao, equipe, data_prevista,
          iniciada_em, concluida_em, observacao, created_at, updated_at,
          unidade:unidades_locais(
            id, codigo_unidade, nome_unidade, municipio, tipo_unidade, endereco_completo,
            latitude, longitude, poligono_geojson, area_construida_m2
          )
        `)
        .eq("campanha_id", campanhaId);
      if (response.error) throw response.error;
      const linhas = (response.data || []) as LinhaUnidadeCampanha[];
      return linhas
        .map((l) => ({
          ...l,
          unidade: l.unidade
            ? {
                ...l.unidade,
                latitude: numeroOuNulo(l.unidade.latitude),
                longitude: numeroOuNulo(l.unidade.longitude),
                area_construida_m2: numeroOuNulo(l.unidade.area_construida_m2),
              }
            : null,
        }))
        .sort((a, b) => (a.unidade?.nome_unidade || "").localeCompare(b.unidade?.nome_unidade || "", "pt-BR"));
    },
    enabled: !!campanhaId,
  });
}

export interface AtualizarSituacaoUnidadeInput {
  atual: UnidadeCampanha;
  situacao: SituacaoUnidadeCampanha;
  observacao?: string | null;
  equipe?: string | null;
  data_prevista?: string | null;
}

export function useAtualizarSituacaoUnidade() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ atual, situacao, observacao, equipe, data_prevista }: AtualizarSituacaoUnidadeInput) => {
      const agora = new Date().toISOString();
      const patch: Record<string, unknown> = {
        situacao,
        updated_at: agora,
      };
      if (user?.id) patch.updated_by = user.id;
      if (observacao !== undefined) patch.observacao = observacao?.trim() || null;
      if (equipe !== undefined) patch.equipe = equipe?.trim() || null;
      if (data_prevista !== undefined) patch.data_prevista = data_prevista || null;

      if ((situacao === "em_vistoria" || situacao === "concluida") && !atual.iniciada_em) {
        patch.iniciada_em = agora;
      }
      if (situacao === "concluida") {
        patch.concluida_em = atual.concluida_em ?? agora;
      } else if (atual.concluida_em) {
        // Reaberta: deixa de constar como concluída
        patch.concluida_em = null;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (supabase as any)
        .from("campanhas_inventario_unidades")
        .update(patch)
        .eq("id", atual.id)
        .select("id")
        .single();
      if (response.error) throw response.error;
      return response.data as { id: string };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["unidades-campanha", variables.atual.campanha_id] });
      toast.success("Situação da unidade atualizada");
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar situação: ${error.message}`);
    },
  });
}

export function useIncluirUnidadesNaCampanha() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ campanhaId, unidadeIds }: { campanhaId: string; unidadeIds: string[] }) => {
      if (unidadeIds.length === 0) return 0;
      const linhas = unidadeIds.map((unidadeId) => ({
        campanha_id: campanhaId,
        unidade_local_id: unidadeId,
        situacao: "a_visitar" as SituacaoUnidadeCampanha,
        ...(user?.id ? { created_by: user.id } : {}),
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (supabase as any)
        .from("campanhas_inventario_unidades")
        .upsert(linhas, { onConflict: "campanha_id,unidade_local_id", ignoreDuplicates: true })
        .select("id");
      if (response.error) throw response.error;
      // Com ignoreDuplicates, só as linhas realmente inseridas voltam
      return ((response.data || []) as { id: string }[]).length;
    },
    onSuccess: (quantidade, variables) => {
      queryClient.invalidateQueries({ queryKey: ["unidades-campanha", variables.campanhaId] });
      const jaEstavam = variables.unidadeIds.length - quantidade;
      toast.success(
        `${quantidade} unidade(s) incluída(s) na campanha` + (jaEstavam > 0 ? ` (${jaEstavam} já estavam)` : ""),
      );
    },
    onError: (error: Error) => {
      toast.error(`Erro ao incluir unidades: ${error.message}`);
    },
  });
}

// ========== FOTOS ==========

type LinhaFoto = Omit<FotoVistoria, "url_assinada">;

export function useFotosUnidade(campanhaId: string | undefined, unidadeLocalId: string | undefined) {
  return useQuery<FotoVistoria[]>({
    queryKey: ["fotos-vistoria", campanhaId, unidadeLocalId],
    queryFn: async (): Promise<FotoVistoria[]> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await (supabase as any)
        .from("fotos_vistoria_inventario")
        .select(
          "id, campanha_id, unidade_local_id, bem_id, codigo_objeto, legenda, storage_path, hash_sha256, latitude, longitude, precisao_m, capturada_em, enviada_em, mime_type, tamanho_bytes, tem_pessoa, usuario_id",
        )
        .eq("campanha_id", campanhaId)
        .eq("unidade_local_id", unidadeLocalId)
        .order("capturada_em", { ascending: false });
      if (response.error) throw response.error;
      const fotos = (response.data || []) as LinhaFoto[];
      if (fotos.length === 0) return [];

      const { data: assinadas, error: erroAssinatura } = await supabase.storage
        .from(BUCKET_EVIDENCIAS_INVENTARIO)
        .createSignedUrls(
          fotos.map((f) => f.storage_path),
          VALIDADE_URL_ASSINADA_S,
        );
      if (erroAssinatura) throw erroAssinatura;
      const urlPorCaminho = new Map<string, string>();
      (assinadas || []).forEach((a) => {
        if (a.path && a.signedUrl) urlPorCaminho.set(a.path, a.signedUrl);
      });

      return fotos.map((f) => ({
        ...f,
        latitude: numeroOuNulo(f.latitude),
        longitude: numeroOuNulo(f.longitude),
        precisao_m: numeroOuNulo(f.precisao_m),
        url_assinada: urlPorCaminho.get(f.storage_path) ?? null,
      }));
    },
    enabled: !!campanhaId && !!unidadeLocalId,
    // Renova antes de a URL assinada expirar
    staleTime: 4 * 60 * 1000,
    refetchInterval: 8 * 60 * 1000,
  });
}

export interface ContagemFotosCampanha {
  total: number;
  porUnidade: Record<string, number>;
}

export function useContagemFotosCampanha(campanhaId: string | undefined) {
  return useQuery<ContagemFotosCampanha>({
    queryKey: ["contagem-fotos-campanha", campanhaId],
    queryFn: async (): Promise<ContagemFotosCampanha> => {
      const porUnidade: Record<string, number> = {};
      let total = 0;
      const pagina = 1000;
      for (let inicio = 0; ; inicio += pagina) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await (supabase as any)
          .from("fotos_vistoria_inventario")
          .select("unidade_local_id")
          .eq("campanha_id", campanhaId)
          .order("id")
          .range(inicio, inicio + pagina - 1);
        if (response.error) throw response.error;
        const linhas = (response.data || []) as { unidade_local_id: string }[];
        linhas.forEach((l) => {
          porUnidade[l.unidade_local_id] = (porUnidade[l.unidade_local_id] || 0) + 1;
        });
        total += linhas.length;
        if (linhas.length < pagina) break;
      }
      return { total, porUnidade };
    },
    enabled: !!campanhaId,
  });
}

// ========== GEOMETRIA DAS UNIDADES ==========

export interface AtualizacaoGeometriaUnidade {
  unidadeLocalId: string;
  latitude: number | null;
  longitude: number | null;
  poligono: PoligonoGeoJson | null;
}

export function useAtualizarGeometriaUnidade() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (itens: AtualizacaoGeometriaUnidade[]) => {
      let atualizadas = 0;
      const falhas: string[] = [];
      for (const item of itens) {
        const patch: Record<string, unknown> = {
          latitude: item.latitude,
          longitude: item.longitude,
          fonte_geometria: "kml",
          geometria_atualizada_em: new Date().toISOString(),
        };
        // Só substitui o polígono quando o KML trouxe um
        if (item.poligono) patch.poligono_geojson = item.poligono;
        if (user?.id) patch.geometria_atualizada_por = user.id;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const response = await (supabase as any)
          .from("unidades_locais")
          .update(patch)
          .eq("id", item.unidadeLocalId)
          .select("id");
        if (response.error) falhas.push(response.error.message as string);
        else if (!response.data || response.data.length === 0) {
          // RLS pode filtrar o UPDATE sem erro: 0 linhas = não gravou
          falhas.push("sem permissão para alterar a unidade ou unidade não encontrada");
        } else atualizadas++;
      }
      if (atualizadas === 0 && falhas.length > 0) throw new Error(falhas[0]);
      return { atualizadas, falhas };
    },
    onSuccess: ({ atualizadas, falhas }) => {
      queryClient.invalidateQueries({ queryKey: ["unidades-campanha"] });
      if (falhas.length > 0) {
        toast.warning(`${atualizadas} unidade(s) atualizada(s); ${falhas.length} falharam: ${falhas[0]}`);
      } else {
        toast.success(`Geometria de ${atualizadas} unidade(s) atualizada`);
      }
    },
    onError: (error: Error) => {
      toast.error(`Erro ao gravar geometria: ${error.message}`);
    },
  });
}
