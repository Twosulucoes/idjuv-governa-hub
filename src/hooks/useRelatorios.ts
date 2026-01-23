import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TipoRelatorio, ConfiguracaoRelatorio } from '@/types/relatorios';

// ================================================================
// HOOKS PARA BUSCAR DADOS PARA RELATÓRIOS
// ================================================================

interface DadosRelatorio {
  dados: Record<string, unknown>[];
  total: number;
}

// Hook genérico para buscar dados de relatório
export function useDadosRelatorio(tipo: TipoRelatorio, filtros: Record<string, unknown> = {}) {
  return useQuery({
    queryKey: ['relatorio-dados', tipo, filtros],
    queryFn: async (): Promise<DadosRelatorio> => {
      switch (tipo) {
        case 'portarias':
          return buscarDadosPortarias(filtros);
        case 'servidores':
        case 'folha_simplificada': // Usa mesmos dados de servidores
          return buscarDadosServidores(filtros);
        case 'cargos_vagas':
          return buscarDadosCargos(filtros);
        default:
          return { dados: [], total: 0 };
      }
    },
  });
}

async function buscarDadosPortarias(filtros: Record<string, unknown>): Promise<DadosRelatorio> {
  let query = supabase
    .from('documentos')
    .select(`
      id,
      numero,
      titulo,
      categoria,
      status,
      data_documento,
      ementa,
      servidores_ids,
      doe_numero,
      doe_data,
      data_vigencia_inicio,
      data_vigencia_fim,
      cargo:cargos(id, nome, sigla),
      unidade:estrutura_organizacional(id, nome, sigla)
    `)
    .eq('tipo', 'portaria')
    .order('data_documento', { ascending: false });

  // Aplicar filtros
  if (filtros.status && Array.isArray(filtros.status) && filtros.status.length > 0) {
    query = query.in('status', filtros.status);
  }
  if (filtros.categoria && Array.isArray(filtros.categoria) && filtros.categoria.length > 0) {
    query = query.in('categoria', filtros.categoria);
  }
  if (filtros.periodo && typeof filtros.periodo === 'object') {
    const periodo = filtros.periodo as { inicio?: string; fim?: string };
    if (periodo.inicio) {
      query = query.gte('data_documento', periodo.inicio);
    }
    if (periodo.fim) {
      query = query.lte('data_documento', periodo.fim);
    }
  }

  const { data, error } = await query;
  if (error) throw error;

  // Processar dados
  const dadosProcessados = (data || []).map((p) => ({
    ...p,
    servidores_count: p.servidores_ids?.length || 0,
    unidade_nome: p.unidade?.nome || '-',
    cargo_nome: p.cargo?.nome || '-',
    mes_ano: format(new Date(p.data_documento), 'MMMM yyyy', { locale: ptBR }),
  }));

  return { dados: dadosProcessados, total: dadosProcessados.length };
}

async function buscarDadosServidores(filtros: Record<string, unknown>): Promise<DadosRelatorio> {
  let query = supabase
    .from('v_servidores_situacao')
    .select('*')
    .order('nome_completo', { ascending: true });

  // Aplicar filtros
  if (filtros.tipo_servidor && Array.isArray(filtros.tipo_servidor) && filtros.tipo_servidor.length > 0) {
    query = query.in('tipo_servidor', filtros.tipo_servidor);
  }
  if (filtros.situacao && Array.isArray(filtros.situacao) && filtros.situacao.length > 0) {
    query = query.in('situacao', filtros.situacao);
  }
  if (filtros.unidade && typeof filtros.unidade === 'string' && filtros.unidade !== 'all') {
    query = query.eq('unidade_id', filtros.unidade);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Buscar vencimento_base dos cargos para enriquecer os dados
  const cargoIds = [...new Set((data || []).map((s) => s.cargo_id).filter(Boolean))];
  
  let cargosMap: Record<string, { vencimento_base: number | null; sigla: string | null }> = {};
  
  if (cargoIds.length > 0) {
    const { data: cargos } = await supabase
      .from('cargos')
      .select('id, vencimento_base, sigla')
      .in('id', cargoIds);
    
    if (cargos) {
      cargosMap = cargos.reduce((acc, c) => {
        acc[c.id] = { vencimento_base: c.vencimento_base, sigla: c.sigla };
        return acc;
      }, {} as Record<string, { vencimento_base: number | null; sigla: string | null }>);
    }
  }

  // Enriquecer dados com vencimento_base
  const dadosEnriquecidos = (data || []).map((servidor) => ({
    ...servidor,
    vencimento_base: servidor.cargo_id ? cargosMap[servidor.cargo_id]?.vencimento_base || 0 : 0,
    cargo_sigla: servidor.cargo_sigla || (servidor.cargo_id ? cargosMap[servidor.cargo_id]?.sigla : null),
  }));

  return { dados: dadosEnriquecidos, total: dadosEnriquecidos.length };
}

async function buscarDadosCargos(filtros: Record<string, unknown>): Promise<DadosRelatorio> {
  // Buscar cargos com contagem de ocupação
  const { data: cargos, error: cargosError } = await supabase
    .from('cargos')
    .select('*')
    .order('nome', { ascending: true });

  if (cargosError) throw cargosError;

  // Buscar provimentos ativos para contar vagas ocupadas
  const { data: provimentos, error: provError } = await supabase
    .from('provimentos')
    .select('cargo_id')
    .eq('status', 'ativo');

  if (provError) throw provError;

  // Contar ocupação por cargo
  const ocupacaoPorCargo: Record<string, number> = {};
  (provimentos || []).forEach((p) => {
    if (p.cargo_id) {
      ocupacaoPorCargo[p.cargo_id] = (ocupacaoPorCargo[p.cargo_id] || 0) + 1;
    }
  });

  // Processar dados
  let dadosProcessados = (cargos || []).map((c) => {
    const vagasOcupadas = ocupacaoPorCargo[c.id] || 0;
    const vagasPrevistas = c.quantidade_vagas || 0;
    const vagasDisponiveis = Math.max(0, vagasPrevistas - vagasOcupadas);
    const percentualOcupacao = vagasPrevistas > 0 
      ? Math.round((vagasOcupadas / vagasPrevistas) * 100) 
      : 0;

    return {
      ...c,
      vagas_ocupadas: vagasOcupadas,
      vagas_disponiveis: vagasDisponiveis,
      percentual_ocupacao: percentualOcupacao,
      lei_criacao: c.lei_criacao_numero 
        ? `${c.lei_criacao_numero}${c.lei_criacao_data ? ` de ${format(new Date(c.lei_criacao_data), 'dd/MM/yyyy')}` : ''}`
        : '-',
    };
  });

  // Aplicar filtros
  if (filtros.categoria && Array.isArray(filtros.categoria) && filtros.categoria.length > 0) {
    dadosProcessados = dadosProcessados.filter((c) => 
      filtros.categoria && (filtros.categoria as string[]).includes(c.categoria)
    );
  }
  if (filtros.natureza && Array.isArray(filtros.natureza) && filtros.natureza.length > 0) {
    dadosProcessados = dadosProcessados.filter((c) => 
      filtros.natureza && c.natureza && (filtros.natureza as string[]).includes(c.natureza)
    );
  }
  if (filtros.ativo && filtros.ativo !== 'all') {
    const ativoFilter = filtros.ativo === 'true';
    dadosProcessados = dadosProcessados.filter((c) => c.ativo === ativoFilter);
  }

  return { dados: dadosProcessados, total: dadosProcessados.length };
}

// Hook para buscar unidades (para filtros)
export function useUnidadesParaFiltro() {
  return useQuery({
    queryKey: ['unidades-filtro'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('estrutura_organizacional')
        .select('id, nome, sigla')
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      return data || [];
    },
  });
}

// Hook para templates salvos (localStorage por enquanto)
export function useTemplatesRelatorio() {
  const getTemplates = (): ConfiguracaoRelatorio[] => {
    try {
      const stored = localStorage.getItem('relatorio_templates');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveTemplate = (template: ConfiguracaoRelatorio) => {
    const templates = getTemplates();
    const id = template.id || `template_${Date.now()}`;
    const newTemplate = { 
      ...template, 
      id,
      criadoEm: template.criadoEm || new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    
    const existingIndex = templates.findIndex((t) => t.id === id);
    if (existingIndex >= 0) {
      templates[existingIndex] = newTemplate;
    } else {
      templates.push(newTemplate);
    }
    
    localStorage.setItem('relatorio_templates', JSON.stringify(templates));
    return newTemplate;
  };

  const deleteTemplate = (id: string) => {
    const templates = getTemplates().filter((t) => t.id !== id);
    localStorage.setItem('relatorio_templates', JSON.stringify(templates));
  };

  return { getTemplates, saveTemplate, deleteTemplate };
}
