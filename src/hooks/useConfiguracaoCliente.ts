/**
 * CONFIGURAÇÃO DO CLIENTE
 *
 * Leitura e gravação dos dados da instituição em `dados_oficiais` (nome, sigla,
 * CNPJ, endereço, dirigente, nome do sistema…). A lista de campos vem de
 * `CAMPOS_CLIENTE` (`@/core/tenant`). Gravar exige o papel admin (RLS
 * `publico_admin`); ler é público, porque o portal também mostra a identidade.
 *
 * Ver docs/CONFIGURACAO_CLIENTE.md.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CAMPOS_CLIENTE, recarregarIdentidadeDoBanco } from '@/core/tenant';

export interface DadoClienteGravado {
  chave: string;
  valor: string;
  ultima_alteracao_em: string | null;
}

const CHAVE_QUERY = ['configuracao-cliente'] as const;
const CHAVES = CAMPOS_CLIENTE.map((c) => c.chave);

/** Valores gravados no banco, por chave (só as chaves da configuração do cliente). */
export function useConfiguracaoCliente() {
  return useQuery({
    queryKey: CHAVE_QUERY,
    queryFn: async (): Promise<Record<string, DadoClienteGravado>> => {
      const { data, error } = await supabase
        .from('dados_oficiais')
        .select('chave, valor, ultima_alteracao_em')
        .in('chave', CHAVES);
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((d) => [d.chave, d]));
    },
  });
}

interface SalvarConfiguracaoCliente {
  /** Valores do formulário por chave; vazio apaga a chave (volta ao perfil). */
  valores: Record<string, string>;
  /** Valores hoje gravados, para gravar só o que mudou. */
  gravados: Record<string, DadoClienteGravado>;
  motivo?: string;
}

export function useSalvarConfiguracaoCliente() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ valores, gravados, motivo }: SalvarConfiguracaoCliente) => {
      // Chave nova leva a descrição; chave existente não (não sobrescreve a de quem cadastrou
      // antes). Upserts separados porque, num lote, coluna ausente vira NULL.
      const novas = [];
      const existentes = [];
      const apagar: string[] = [];

      for (const campo of CAMPOS_CLIENTE) {
        const novo = (valores[campo.chave] ?? '').trim();
        const atual = gravados[campo.chave]?.valor ?? null;
        if (novo === '' && atual !== null) apagar.push(campo.chave);
        else if (novo !== '' && novo !== atual) {
          const linha = {
            chave: campo.chave,
            valor: novo,
            categoria: campo.categoria,
            motivo_alteracao: motivo?.trim() || null,
          };
          if (atual === null) novas.push({ ...linha, descricao: campo.rotulo });
          else existentes.push(linha);
        }
      }

      for (const lote of [novas, existentes]) {
        if (lote.length === 0) continue;
        const { error } = await supabase.from('dados_oficiais').upsert(lote, { onConflict: 'chave' });
        if (error) throw error;
      }
      if (apagar.length > 0) {
        const { error } = await supabase.from('dados_oficiais').delete().in('chave', apagar);
        if (error) throw error;
      }
      return { alterados: novas.length + existentes.length + apagar.length };
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: CHAVE_QUERY });
      // A identidade do app inteiro (menu, aba, PDFs) passa a usar os novos valores.
      await recarregarIdentidadeDoBanco();
    },
  });
}
