/**
 * Tipos de espaço das Unidades Locais (Ginásio, Campo de futebol, Praça...), cadastrados em
 * Unidades Locais → Tipos de espaço (tabela unidades_locais_tipos_espaco, migração 20261125090000).
 * Ler: módulo Patrimônio; criar, editar e apagar: unidades.gerenciar (o banco também valida).
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TIPO_UNIDADE_LABELS, type TipoUnidadeLocal } from "@/types/unidadesLocais";

export interface TipoEspacoUnidade {
  id: string;
  codigo: string | null;
  nome: string;
  tipo_base: TipoUnidadeLocal;
  ativo: boolean;
  ordem: number;
}

export interface TipoEspacoForm {
  nome: string;
  tipo_base: TipoUnidadeLocal;
  ativo: boolean;
  ordem: number;
}

const CHAVE = ["unidades-locais-tipos-espaco"] as const;

export function useTiposEspacoUnidade() {
  return useQuery({
    queryKey: CHAVE,
    queryFn: async (): Promise<TipoEspacoUnidade[]> => {
      const { data, error } = await supabase
        .from("unidades_locais_tipos_espaco")
        .select("id, codigo, nome, tipo_base, ativo, ordem")
        .order("ordem")
        .order("nome");
      if (error) throw error;
      return (data ?? []) as TipoEspacoUnidade[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Nome do tipo de espaço da unidade; sem tipo cadastrado, cai no rótulo do tipo antigo. */
export function nomeTipoEspaco(
  unidade: { tipo_espaco_id?: string | null; tipo_unidade?: string | null },
  tipos: TipoEspacoUnidade[] | undefined,
): string {
  const tipo = unidade.tipo_espaco_id ? tipos?.find((t) => t.id === unidade.tipo_espaco_id) : undefined;
  if (tipo) return tipo.nome;
  const base = unidade.tipo_unidade as TipoUnidadeLocal | undefined;
  return (base && TIPO_UNIDADE_LABELS[base]) || base || "-";
}

function mensagemErro(error: { code?: string; message: string }): string {
  if (error.code === "23505") return "Já existe um tipo de espaço com esse nome.";
  if (error.code === "23503") return "Este tipo está em uso por alguma unidade. Desative-o em vez de excluir.";
  if (error.code === "42501") return "Sem permissão para alterar os tipos de espaço.";
  return error.message;
}

export function useSalvarTipoEspaco() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, dados }: { id?: string; dados: TipoEspacoForm }) => {
      const linha = { ...dados, nome: dados.nome.trim() };
      const { error } = id
        ? await supabase.from("unidades_locais_tipos_espaco").update(linha).eq("id", id)
        : await supabase.from("unidades_locais_tipos_espaco").insert(linha);
      if (error) throw new Error(mensagemErro(error));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CHAVE }),
  });
}

export function useExcluirTipoEspaco() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("unidades_locais_tipos_espaco").delete().eq("id", id);
      if (error) throw new Error(mensagemErro(error));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: CHAVE }),
  });
}
