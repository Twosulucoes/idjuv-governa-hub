/**
 * Favorecidos do Financeiro (tabela `fornecedores`): quem recebe os pagamentos e a conta de crédito usada na
 * remessa OBN600. Compras, Contratos e Financeiro leem, criam e editam (RLS, migração 20261025090000); excluir
 * continua só com Compras/Contratos. A auditoria é do gatilho `trg_audit_fornecedores`, no banco.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { Tables, TablesInsert } from '@/integrations/supabase/types';

export type Favorecido = Tables<'fornecedores'>;

export type FavorecidoInput = Pick<
  TablesInsert<'fornecedores'>,
  | 'tipo_pessoa'
  | 'cpf_cnpj'
  | 'razao_social'
  | 'nome_fantasia'
  | 'endereco_logradouro'
  | 'endereco_numero'
  | 'endereco_bairro'
  | 'endereco_cidade'
  | 'endereco_uf'
  | 'endereco_cep'
  | 'telefone'
  | 'email'
  | 'banco_codigo'
  | 'banco_nome'
  | 'agencia'
  | 'conta'
  | 'tipo_conta'
  | 'ativo'
>;

const CHAVE = ['fin_favorecidos'];

export function useFavorecidos() {
  return useQuery({
    queryKey: CHAVE,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fornecedores')
        .select('*')
        .order('razao_social', { ascending: true });
      if (error) throw error;
      return data as Favorecido[];
    },
  });
}

/** Cria (sem `id`) ou atualiza (com `id`) um favorecido. */
export function useSalvarFavorecido() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, dados }: { id?: string; dados: FavorecidoInput }) => {
      const consulta = id
        ? supabase.from('fornecedores').update(dados).eq('id', id)
        : supabase.from('fornecedores').insert(dados);
      const { data, error } = await consulta.select().single();
      if (error) {
        if (error.code === '23505') throw new Error('Já existe um favorecido com este CPF/CNPJ.');
        throw error;
      }
      return { data, novo: !id };
    },
    onSuccess: ({ novo }) => {
      queryClient.invalidateQueries({ queryKey: CHAVE });
      queryClient.invalidateQueries({ queryKey: ['fornecedores_select'] });
      toast({ title: novo ? 'Favorecido cadastrado' : 'Favorecido atualizado' });
    },
    onError: (error: Error) => {
      toast({ title: 'Erro ao salvar o favorecido', description: error.message, variant: 'destructive' });
    },
  });
}
