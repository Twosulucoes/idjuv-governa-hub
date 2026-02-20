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
      cargo_id,
      unidade_id
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
  const dadosProcessados = (data || []).map((p: any) => ({
    ...p,
    servidores_count: p.servidores_ids?.length || 0,
    unidade_nome: '-',
    cargo_nome: '-',
    mes_ano: format(new Date(p.data_documento), 'MMMM yyyy', { locale: ptBR }),
  }));

  return { dados: dadosProcessados, total: dadosProcessados.length };
}

async function buscarDadosServidores(filtros: Record<string, unknown>): Promise<DadosRelatorio> {
  // Buscar dados da view v_servidores_situacao
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

  const { data: viewData, error } = await query;
  if (error) throw error;

  // Buscar dados adicionais (rg, data_nascimento, etc.) diretamente da tabela servidores
  const servidorIds = (viewData || []).map((s) => s.id);
  
  let servidoresExtras: Record<string, { 
    rg: string | null; 
    data_nascimento: string | null;
    rg_orgao_expedidor: string | null;
    rg_uf: string | null;
    sexo: string | null;
    estado_civil: string | null;
    email_institucional: string | null;
    email_pessoal: string | null;
    telefone_celular: string | null;
  }> = {};
  
  // Mapa para portarias de nomeação
  let portariasNomeacao: Record<string, { numero: string | null; data_documento: string | null }> = {};
  
  // Mapa para provimentos (datas funcionais)
  let provimentosMap: Record<string, { data_nomeacao: string | null; data_posse: string | null; data_exercicio: string | null }> = {};
  
  if (servidorIds.length > 0) {
    // Buscar dados extras do servidor
    const { data: servidoresData } = await supabase
      .from('servidores')
      .select('id, rg, data_nascimento, rg_orgao_expedidor, rg_uf, sexo, estado_civil, email_institucional, email_pessoal, telefone_celular')
      .in('id', servidorIds);
    
    if (servidoresData) {
      servidoresExtras = servidoresData.reduce((acc, s) => {
        acc[s.id] = {
          rg: s.rg,
          data_nascimento: s.data_nascimento,
          rg_orgao_expedidor: s.rg_orgao_expedidor,
          rg_uf: s.rg_uf,
          sexo: s.sexo,
          estado_civil: s.estado_civil,
          email_institucional: s.email_institucional,
          email_pessoal: s.email_pessoal,
          telefone_celular: s.telefone_celular,
        };
        return acc;
      }, {} as typeof servidoresExtras);
    }
    
    // Buscar portarias de nomeação vinculadas aos servidores
    const { data: portarias } = await supabase
      .from('documentos')
      .select('numero, data_documento, servidores_ids')
      .eq('tipo', 'portaria')
      .eq('categoria', 'nomeacao');
    
    if (portarias) {
      // Para cada servidor, encontrar a portaria de nomeação correspondente
      for (const servidorId of servidorIds) {
        const portaria = portarias.find((p) => 
          p.servidores_ids && Array.isArray(p.servidores_ids) && p.servidores_ids.includes(servidorId)
        );
        if (portaria) {
          portariasNomeacao[servidorId] = {
            numero: portaria.numero,
            data_documento: portaria.data_documento,
          };
        }
      }
    }
    
    // Buscar dados de provimento (datas funcionais)
    const { data: provimentos } = await supabase
      .from('provimentos')
      .select('servidor_id, data_nomeacao, data_posse, data_exercicio')
      .in('servidor_id', servidorIds)
      .eq('status', 'ativo');
    
    if (provimentos) {
      provimentosMap = provimentos.reduce((acc, p) => {
        if (p.servidor_id) {
          acc[p.servidor_id] = {
            data_nomeacao: p.data_nomeacao,
            data_posse: p.data_posse,
            data_exercicio: p.data_exercicio,
          };
        }
        return acc;
      }, {} as typeof provimentosMap);
    }
  }

  // Buscar vencimento_base dos cargos para enriquecer os dados
  const cargoIds = [...new Set((viewData || []).map((s) => s.cargo_id).filter(Boolean))];
  
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

  // Tipo para os dados extras
  type ServidorExtras = {
    rg: string | null;
    data_nascimento: string | null;
    rg_orgao_expedidor: string | null;
    rg_uf: string | null;
    sexo: string | null;
    estado_civil: string | null;
    email_institucional: string | null;
    email_pessoal: string | null;
    telefone_celular: string | null;
  };

  const defaultExtras: ServidorExtras = {
    rg: null,
    data_nascimento: null,
    rg_orgao_expedidor: null,
    rg_uf: null,
    sexo: null,
    estado_civil: null,
    email_institucional: null,
    email_pessoal: null,
    telefone_celular: null,
  };

  // Função auxiliar para formatar datas YYYY-MM-DD sem fuso
  const formatarDataLocal = (dataStr: string | null): string | null => {
    if (!dataStr) return null;
    const [ano, mes, dia] = dataStr.split('-').map(Number);
    if (ano && mes && dia) {
      return `${String(dia).padStart(2, '0')}/${String(mes).padStart(2, '0')}/${ano}`;
    }
    return dataStr;
  };

  // Enriquecer dados com vencimento_base, rg, data_nascimento, portaria e demais campos
  const dadosEnriquecidos = (viewData || []).map((servidor) => {
    const extras: ServidorExtras = servidoresExtras[servidor.id] || defaultExtras;
    const portaria = portariasNomeacao[servidor.id];
    const provimento = provimentosMap[servidor.id];
    
    return {
      ...servidor,
      vencimento_base: servidor.cargo_id ? cargosMap[servidor.cargo_id]?.vencimento_base || 0 : 0,
      cargo_sigla: servidor.cargo_sigla || (servidor.cargo_id ? cargosMap[servidor.cargo_id]?.sigla : null),
      rg: extras.rg,
      rg_orgao_expedidor: extras.rg_orgao_expedidor,
      rg_uf: extras.rg_uf,
      data_nascimento: formatarDataLocal(extras.data_nascimento),
      sexo: extras.sexo,
      estado_civil: extras.estado_civil,
      email_institucional: extras.email_institucional,
      email_pessoal: extras.email_pessoal,
      telefone_celular: extras.telefone_celular,
      // Portaria de nomeação
      portaria_nomeacao_numero: portaria?.numero || null,
      portaria_nomeacao_data: formatarDataLocal(portaria?.data_documento || null),
      // Datas funcionais do provimento
      data_nomeacao: formatarDataLocal(provimento?.data_nomeacao || null),
      data_posse: formatarDataLocal(provimento?.data_posse || null),
      data_exercicio: formatarDataLocal(provimento?.data_exercicio || null),
    };
  });

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
