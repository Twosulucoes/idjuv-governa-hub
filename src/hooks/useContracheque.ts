/**
 * Hook para gestão de contracheques
 * Acesso segmentado: servidor vê apenas os próprios, RH vê todos
 */
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { registrarEvento } from '@/hooks/useTrilhaAuditoria';
import {
  montarFichaContracheque,
  unidadeValida,
  type FichaContrachequeLinha,
} from '@/lib/contrachequeDados';
import type { FichaContracheque } from '@/lib/documentos/modelos/folha/contracheque';
import { generateContracheque, generateContrachequeEmLote } from '@/lib/pdfContracheque';

// Tipos de retorno
interface FichaFinanceiraComServidor {
  id: string;
  servidor_id: string;
  competencia_ano: number;
  competencia_mes: number;
  cargo_nome: string | null;
  unidade_nome: string | null;
  total_proventos: number | null;
  total_descontos: number | null;
  valor_liquido: number | null;
  base_inss: number | null;
  valor_inss: number | null;
  base_irrf: number | null;
  valor_irrf: number | null;
  quantidade_dependentes: number | null;
  created_at: string | null;
  servidor: {
    id: string;
    nome_completo: string;
    cpf: string | null;
    matricula: string | null;
    pis_pasep: string | null;
  } | null;
}

interface ItemFichaFinanceira {
  id: string;
  ficha_id: string;
  rubrica_id: string | null;
  descricao: string;
  tipo: string;
  referencia: string | null;
  valor: number;
  percentual: number | null;
  base_calculo: number | null;
  ordem: number | null;
}

// Hook para buscar contracheques do servidor logado
export function useMeusContracheques() {
  const { user } = useAuth();
  // Vínculo pelo profiles.servidor_id, a mesma chave da RLS (meu_servidor_id()).
  const servidorId = user?.servidorId;
  
  return useQuery({
    queryKey: ['meus-contracheques', servidorId],
    queryFn: async () => {
      if (!servidorId) return [];
      
      // Buscar fichas financeiras do servidor
      const { data, error } = await supabase
        .from('fichas_financeiras')
        .select(`
          id,
          servidor_id,
          competencia_ano,
          competencia_mes,
          cargo_nome,
          unidade_nome,
          total_proventos,
          total_descontos,
          valor_liquido,
          base_inss,
          valor_inss,
          base_irrf,
          valor_irrf,
          quantidade_dependentes,
          created_at,
          servidor:servidores(id, nome_completo, cpf, matricula, pis_pasep),
          folhas_pagamento!inner(status)
        `)
        .eq('servidor_id', servidorId)
        // Só folha fechada vira contracheque: prévia, aberta, em processamento
        // ou reaberta ainda podem mudar e não devem aparecer para o servidor.
        .eq('folhas_pagamento.status', 'fechada')
        .order('competencia_ano', { ascending: false })
        .order('competencia_mes', { ascending: false });
      
      if (error) throw error;
      return (data || []) as unknown as FichaFinanceiraComServidor[];
    },
    enabled: !!servidorId,
  });
}

// Hook para buscar todos os contracheques (RH)
export function useContrachequesRH(filtros?: {
  ano?: number;
  mes?: number;
  servidorId?: string;
  unidade?: string;
}) {
  return useQuery({
    queryKey: ['contracheques-rh', filtros],
    queryFn: async () => {
      let query = supabase
        .from('fichas_financeiras')
        .select(`
          id,
          servidor_id,
          competencia_ano,
          competencia_mes,
          cargo_nome,
          unidade_nome,
          total_proventos,
          total_descontos,
          valor_liquido,
          base_inss,
          valor_inss,
          base_irrf,
          valor_irrf,
          quantidade_dependentes,
          created_at,
          servidor:servidores(id, nome_completo, cpf, matricula, pis_pasep)
        `)
        .order('competencia_ano', { ascending: false })
        .order('competencia_mes', { ascending: false });
      
      if (filtros?.ano) {
        query = query.eq('competencia_ano', filtros.ano);
      }
      if (filtros?.mes) {
        query = query.eq('competencia_mes', filtros.mes);
      }
      if (filtros?.servidorId) {
        query = query.eq('servidor_id', filtros.servidorId);
      }
      if (filtros?.unidade) {
        query = query.ilike('unidade_nome', `%${filtros.unidade}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as unknown as FichaFinanceiraComServidor[];
    },
  });
}

// Hook para buscar um contracheque específico com itens
export function useContrachequeDetalhe(fichaId?: string) {
  return useQuery({
    queryKey: ['contracheque-detalhe', fichaId],
    queryFn: async () => {
      if (!fichaId) return null;
      
      // Buscar ficha financeira
      const { data: ficha, error: fichaError } = await supabase
        .from('fichas_financeiras')
        .select(`
          *,
          servidor:servidores(id, nome_completo, cpf, matricula, pis_pasep, data_nascimento)
        `)
        .eq('id', fichaId)
        .single();
      
      if (fichaError) throw fichaError;
      
      // Buscar itens da ficha
      const { data: itens, error: itensError } = await supabase
        .from('itens_ficha_financeira')
        .select('*')
        .eq('ficha_id', fichaId)
        .order('tipo', { ascending: true })
        .order('ordem', { ascending: true, nullsFirst: false })
        .order('descricao', { ascending: true });
      
      if (itensError) throw itensError;
      
      return {
        ficha: ficha as unknown as FichaFinanceiraComServidor,
        itens: (itens || []) as unknown as ItemFichaFinanceira[],
      };
    },
    enabled: !!fichaId,
  });
}

// Hook para registrar acesso ao contracheque na trilha do RH (RPC registrar_evento, onda E2).
// visualizar = view; imprimir = download. Quem não tem o módulo rh só registra o próprio contracheque
// (a RPC confere a ficha). Para imprimir, use mutateAsync ANTES de gerar o PDF: se o registro falhar,
// a promessa rejeita e o arquivo não deve ser entregue. Para visualizar, mutate (sem bloquear a tela).
export function useLogAcessoContracheque() {
  return useMutation({
    mutationFn: async ({
      fichaId,
      servidorId,
      acao,
    }: {
      fichaId: string;
      /** Servidor da ficha: liga o evento à aba de histórico do servidor. */
      servidorId?: string | null;
      acao: 'visualizar' | 'imprimir';
    }) => {
      await registrarEvento({
        acao: acao === 'imprimir' ? 'download' : 'view',
        entidade: 'contracheque',
        entidadeId: fichaId,
        descricao: acao === 'imprimir' ? 'Contracheque impresso/baixado' : 'Contracheque visualizado',
        metadados: {
          acao,
          formato: acao === 'imprimir' ? 'pdf' : 'tela',
          ...(servidorId ? { servidor_id: servidorId } : {}),
        },
      });
    },
    onError: (error) => {
      console.warn('Não foi possível registrar o acesso ao contracheque:', error);
    },
  });
}

/** Lote de contracheques (RH): um registro na trilha antes de gerar o PDF; lança se falhar. */
export async function registrarLoteContracheques(params: {
  quantidade: number;
  /** Filtros como vieram da tela ('todos' quando não filtrado). */
  ano: number | 'todos';
  mes: number | 'todos';
  fichaIds: string[];
}) {
  await registrarEvento({
    acao: 'download',
    entidade: 'contracheque',
    descricao: `Contracheques em lote impressos/baixados (${params.quantidade})`,
    metadados: {
      lote: true,
      formato: 'pdf',
      quantidade: params.quantidade,
      ano: params.ano,
      mes: params.mes,
      // até 80 ids cabem no limite de 4000 caracteres dos metadados
      ficha_ids: params.fichaIds.slice(0, 80),
      ficha_ids_cortado: params.fichaIds.length > 80,
    },
  });
}

// Hook para verificar se usuário é servidor
export function useServidorLogado() {
  const { user } = useAuth();
  // Vínculo pelo profiles.servidor_id, a mesma chave da RLS (meu_servidor_id()).
  const servidorId = user?.servidorId;
  
  return useQuery({
    queryKey: ['servidor-logado', servidorId],
    queryFn: async () => {
      if (!servidorId) return null;
      
      const { data, error } = await supabase
        .from('servidores')
        .select('id, nome_completo, cpf, matricula')
        .eq('id', servidorId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!servidorId,
  });
}

// ============== DADOS DO PDF ==============
// Iguais em todas as telas que imprimem o contracheque (ficha financeira, detalhe da folha, consulta e Meu
// Contracheque): ficha, itens com o código da rubrica, servidor (admissão, vínculo, regime e conta), situação
// da folha e, se a ficha não guardou a unidade, a lotação vigente no fim da competência. A montagem é a regra
// pura de `@/lib/contrachequeDados` (teste do RH de 06/11/2026, itens 2, 3, 4 e 8).
const SELECT_FICHA = `
  id, servidor_id, competencia_ano, competencia_mes, cargo_nome, unidade_nome,
  total_proventos, total_descontos, valor_liquido, base_inss, valor_inss, base_irrf, valor_irrf,
  quantidade_dependentes, inss_patronal, rat, total_encargos,
  banco_codigo, banco_nome, banco_agencia, banco_conta, tem_inconsistencia,
  folha:folhas_pagamento!fichas_financeiras_folha_id_fkey(status),
  servidor:servidores!fichas_financeiras_servidor_id_fkey(
    nome_completo, cpf, matricula, pis_pasep, data_admissao, vinculo, contribui_rpps_origem,
    banco_codigo, banco_nome, banco_agencia, banco_conta
  ),
  itens:itens_ficha_financeira(descricao, tipo, valor, referencia, percentual, ordem,
    rubrica:rubricas!itens_ficha_financeira_rubrica_id_fkey(codigo))
`;

type LinhaComCompetencia = FichaContrachequeLinha & { competencia_ano: number | null; competencia_mes: number | null };

const fimDaCompetencia = (ano: number, mes: number) => new Date(Date.UTC(ano, mes, 0)).toISOString().slice(0, 10);

/** Lotação vigente no fim da competência, para as fichas que não guardaram a unidade. Falha aqui não impede o PDF. */
async function lotacoesVigentes(linhas: LinhaComCompetencia[]): Promise<Map<string, string>> {
  const resultado = new Map<string, string>();
  const faltando = linhas.filter((l) => !unidadeValida(l.unidade_nome) && l.servidor_id && l.competencia_ano && l.competencia_mes);
  if (faltando.length === 0) return resultado;
  const { data, error } = await supabase
    .from('lotacoes')
    .select('servidor_id, data_inicio, data_fim, tipo_lotacao, unidade:estrutura_organizacional!lotacoes_unidade_id_fkey(sigla, nome)')
    .in('servidor_id', [...new Set(faltando.map((l) => l.servidor_id!))])
    .eq('ativo', true);
  if (error || !data) return resultado;
  for (const l of faltando) {
    const fim = fimDaCompetencia(l.competencia_ano!, l.competencia_mes!);
    const vigente = data
      .filter((x) => x.servidor_id === l.servidor_id && x.tipo_lotacao !== 'lotacao_externa'
        && x.data_inicio <= fim && (!x.data_fim || x.data_fim >= fim))
      .sort((a, b) => b.data_inicio.localeCompare(a.data_inicio))[0];
    const u = vigente?.unidade as { sigla: string | null; nome: string } | null | undefined;
    if (u?.nome) resultado.set(l.id, u.sigla ? `${u.sigla} - ${u.nome}` : u.nome);
  }
  return resultado;
}

/** Fichas prontas para o contracheque, na ordem dos ids pedidos. */
export async function carregarContracheques(fichaIds: string[]): Promise<FichaContracheque[]> {
  if (fichaIds.length === 0) return [];
  const { data, error } = await supabase.from('fichas_financeiras').select(SELECT_FICHA).in('id', fichaIds);
  if (error) throw error;
  const linhas = (data ?? []) as unknown as LinhaComCompetencia[];
  const lotacoes = await lotacoesVigentes(linhas);
  const porId = new Map(linhas.map((l) => [l.id, montarFichaContracheque(l, lotacoes.get(l.id))]));
  return fichaIds.map((id) => porId.get(id)).filter((f): f is FichaContracheque => !!f);
}

/**
 * Gera o PDF do contracheque (um id) ou do lote (vários, uma página por servidor) a partir das fichas do banco.
 * Quem chama registra a impressão na trilha antes. Ficha não encontrada (sem acesso) é erro, não PDF vazio.
 */
export async function imprimirContracheques(fichaIds: string[], competencia: string): Promise<number> {
  const fichas = await carregarContracheques(fichaIds);
  if (fichas.length === 0) throw new Error('Nenhuma ficha encontrada para o contracheque.');
  if (fichas.length === 1 && fichaIds.length === 1) {
    await generateContracheque({ ficha: fichas[0], competencia });
  } else {
    await generateContrachequeEmLote(fichas, competencia);
  }
  return fichas.length;
}

export type { FichaFinanceiraComServidor, ItemFichaFinanceira };
