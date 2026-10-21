import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AgendaUnidade, TermoCessao } from '@/types/unidadesLocais';
import { statusTermoPeloSei, textoOuNulo, type RegistroSei } from '@/lib/registroSei';

// O termo de cessão é feito no SEI; aqui só se registra e acompanha o ciclo (processo SEI, número, assinatura, DOE).
const CHAVE = 'termos-cessao';

/** Termos de cessão da unidade local, mais recentes primeiro. */
export function useTermosCessao(unidadeId: string) {
  return useQuery({
    queryKey: [CHAVE, unidadeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('termos_cessao')
        .select('*, agenda:agenda_unidade(*)')
        .eq('unidade_local_id', unidadeId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as TermoCessao[];
    },
    enabled: !!unidadeId,
  });
}

/** Reservas aprovadas da unidade que ainda não têm termo registrado. */
export function useReservasSemTermo(unidadeId: string) {
  return useQuery({
    queryKey: [CHAVE, 'reservas-sem-termo', unidadeId],
    queryFn: async () => {
      const { data: termos, error: erroTermos } = await supabase
        .from('termos_cessao')
        .select('agenda_id')
        .eq('unidade_local_id', unidadeId);
      if (erroTermos) throw erroTermos;
      const comTermo = new Set((termos || []).map((t) => t.agenda_id));

      const { data, error } = await supabase
        .from('agenda_unidade')
        .select('*')
        .eq('unidade_local_id', unidadeId)
        .eq('status', 'aprovado')
        .order('data_inicio');
      if (error) throw error;
      return ((data || []) as AgendaUnidade[]).filter((r) => !comTermo.has(r.id));
    },
    enabled: !!unidadeId,
  });
}

/** Colunas do ciclo do SEI a partir do formulário; a etapa (status) segue o que já aconteceu no SEI. */
function colunasSei(v: RegistroSei & { cancelado?: boolean }) {
  return {
    processo_sei: textoOuNulo(v.processoSei),
    numero_termo: textoOuNulo(v.numero),
    data_assinatura: textoOuNulo(v.dataAssinatura),
    doe_numero: textoOuNulo(v.doeNumero),
    doe_data: textoOuNulo(v.doeData),
    status: statusTermoPeloSei(v),
  };
}

interface RegistrarTermo {
  reserva: AgendaUnidade;
  unidadeId: string;
  chefeNomeacaoId?: string;
  sei: RegistroSei;
}

/** Registra o termo de uma reserva aprovada; sem número do SEI ele nasce "pendente" (aguardando SEI). */
export function useRegistrarTermoCessao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reserva, unidadeId, chefeNomeacaoId, sei }: RegistrarTermo) => {
      const colunas = colunasSei(sei);
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase.from('termos_cessao').insert({
        agenda_id: reserva.id,
        unidade_local_id: unidadeId,
        ano: new Date().getFullYear(),
        cessionario_nome: reserva.solicitante_nome,
        cessionario_documento: reserva.solicitante_documento,
        cessionario_telefone: reserva.solicitante_telefone,
        finalidade: reserva.tipo_uso,
        periodo_inicio: reserva.data_inicio,
        periodo_fim: reserva.data_fim,
        chefe_responsavel_id: chefeNomeacaoId || null,
        ...colunas,
        // data em que o termo recebeu número no SEI (registrada junto com o número)
        data_emissao: colunas.numero_termo ? new Date().toISOString() : null,
        created_by: userData.user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CHAVE] }),
  });
}

/** Atualiza o registro do SEI de um termo já cadastrado (processo, número, assinatura, DOE, cancelamento). */
export function useAtualizarRegistroSeiTermo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ termo, sei }: { termo: TermoCessao; sei: RegistroSei & { cancelado?: boolean } }) => {
      const colunas = colunasSei(sei);
      const { data: userData } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('termos_cessao')
        .update({
          ...colunas,
          data_emissao: colunas.numero_termo ? termo.data_emissao || new Date().toISOString() : null,
          updated_by: userData.user?.id,
        })
        .eq('id', termo.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [CHAVE] }),
  });
}
