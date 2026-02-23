/**
 * Serviço de dados para relatórios de Gestores Escolares
 * Somente SELECT - sem INSERT, UPDATE, DELETE
 */

import { supabase } from '@/integrations/supabase/client';

export interface GestorRelatorio {
  id: string;
  nome: string;
  email: string;
  cpf: string;
  celular: string;
  status: string;
  created_at: string;
  escola?: {
    nome: string;
    municipio: string | null;
  };
}

export interface FiltrosGestores {
  nome?: string;
  municipio?: string;
  status?: string;
  dataInicio?: string;
  dataFim?: string;
}

export interface MunicipioContagem {
  municipio: string;
  quantidade: number;
}

/**
 * Buscar gestores com filtros e paginação
 */
export async function buscarGestoresPaginado(
  filtros: FiltrosGestores,
  pagina: number = 1,
  porPagina: number = 50
) {
  const offset = (pagina - 1) * porPagina;

  let query = supabase
    .from('gestores_escolares')
    .select(`
      id, nome, email, cpf, celular, status, created_at,
      escola:escolas_jer!gestores_escolares_escola_id_fkey(nome, municipio)
    `, { count: 'exact' });

  if (filtros.nome) {
    query = query.ilike('nome', `%${filtros.nome}%`);
  }

  if (filtros.status) {
    query = query.eq('status', filtros.status);
  }

  if (filtros.dataInicio) {
    query = query.gte('created_at', filtros.dataInicio);
  }

  if (filtros.dataFim) {
    query = query.lte('created_at', `${filtros.dataFim}T23:59:59`);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + porPagina - 1);

  if (error) throw error;

  // Filtrar por município (join filter)
  let resultado = (data || []) as unknown as GestorRelatorio[];
  if (filtros.municipio) {
    resultado = resultado.filter(
      (g) => g.escola?.municipio?.toLowerCase().includes(filtros.municipio!.toLowerCase())
    );
  }

  return {
    gestores: resultado,
    total: count || 0,
    pagina,
    totalPaginas: Math.ceil((count || 0) / porPagina),
  };
}

/**
 * Buscar todos os gestores (para exportação)
 */
export async function buscarTodosGestores(filtros: FiltrosGestores) {
  let query = supabase
    .from('gestores_escolares')
    .select(`
      id, nome, email, cpf, celular, status, created_at,
      escola:escolas_jer!gestores_escolares_escola_id_fkey(nome, municipio)
    `);

  if (filtros.nome) {
    query = query.ilike('nome', `%${filtros.nome}%`);
  }
  if (filtros.status) {
    query = query.eq('status', filtros.status);
  }
  if (filtros.dataInicio) {
    query = query.gte('created_at', filtros.dataInicio);
  }
  if (filtros.dataFim) {
    query = query.lte('created_at', `${filtros.dataFim}T23:59:59`);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;

  let resultado = (data || []) as unknown as GestorRelatorio[];
  if (filtros.municipio) {
    resultado = resultado.filter(
      (g) => g.escola?.municipio?.toLowerCase().includes(filtros.municipio!.toLowerCase())
    );
  }

  return resultado;
}

/**
 * Contagem por município
 */
export async function contarPorMunicipio(): Promise<MunicipioContagem[]> {
  const { data, error } = await supabase
    .from('gestores_escolares')
    .select(`
      escola:escolas_jer!gestores_escolares_escola_id_fkey(municipio)
    `);

  if (error) throw error;

  const contagem: Record<string, number> = {};
  ((data || []) as unknown as { escola?: { municipio: string | null } }[]).forEach((g) => {
    const mun = g.escola?.municipio || 'Não informado';
    contagem[mun] = (contagem[mun] || 0) + 1;
  });

  return Object.entries(contagem)
    .map(([municipio, quantidade]) => ({ municipio, quantidade }))
    .sort((a, b) => b.quantidade - a.quantidade);
}

/**
 * Lista de municípios únicos para filtros
 */
export async function listarMunicipios(): Promise<string[]> {
  const { data, error } = await supabase
    .from('escolas_jer')
    .select('municipio')
    .not('municipio', 'is', null);

  if (error) throw error;

  const unicos = [...new Set((data || []).map((e) => e.municipio).filter(Boolean))] as string[];
  return unicos.sort();
}
