import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { 
  TipoRelatorioFederacao, 
  ConfiguracaoRelatorioFederacao 
} from '@/types/federacoesRelatorio';

// ================================================================
// TIPOS
// ================================================================

interface DadosRelatorioFederacao {
  dados: Record<string, unknown>[];
  total: number;
}

interface Dirigente {
  federacao_id: string;
  federacao_nome: string;
  federacao_sigla: string;
  cargo: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  instagram: string | null;
  facebook: string | null;
  data_nascimento: string | null;
}

// ================================================================
// HOOK PRINCIPAL
// ================================================================

export function useDadosFederacoes(
  tipo: TipoRelatorioFederacao, 
  filtros: Record<string, unknown> = {}
) {
  return useQuery({
    queryKey: ['relatorio-federacoes', tipo, filtros],
    queryFn: async (): Promise<DadosRelatorioFederacao> => {
      try {
        switch (tipo) {
          case 'federacoes':
            return await buscarDadosFederacoes(filtros);
          case 'dirigentes':
            return await buscarDadosDirigentes(filtros);
          default:
            return { dados: [], total: 0 };
        }
      } catch (error) {
        console.error('Erro ao buscar dados de federações:', error);
        return { dados: [], total: 0 };
      }
    },
  });
}

// ================================================================
// BUSCAR FEDERAÇÕES
// ================================================================

async function buscarDadosFederacoes(
  filtros: Record<string, unknown>
): Promise<DadosRelatorioFederacao> {
  let query = supabase
    .from('federacoes_esportivas')
    .select('*')
    .order('nome', { ascending: true });

  // Aplicar filtros
  if (filtros.status && Array.isArray(filtros.status) && filtros.status.length > 0) {
    query = query.in('status', filtros.status);
  }

  if (filtros.municipio && Array.isArray(filtros.municipio) && filtros.municipio.length > 0) {
    // Buscar por município no endereço
    const municipios = filtros.municipio as string[];
    const orConditions = municipios.map(m => `endereco.ilike.%${m}%`).join(',');
    query = query.or(orConditions);
  }

  if (filtros.periodo_mandato && typeof filtros.periodo_mandato === 'object') {
    const periodo = filtros.periodo_mandato as { inicio?: string; fim?: string };
    if (periodo.inicio) {
      query = query.gte('mandato_inicio', periodo.inicio);
    }
    if (periodo.fim) {
      query = query.lte('mandato_fim', periodo.fim);
    }
  }

  if (filtros.possui_instagram === true) {
    query = query.not('instagram', 'is', null);
  } else if (filtros.possui_instagram === false) {
    query = query.is('instagram', null);
  }

  if (filtros.possui_facebook === true) {
    query = query.not('facebook', 'is', null);
  } else if (filtros.possui_facebook === false) {
    query = query.is('facebook', null);
  }

  if (filtros.possui_diretor_tecnico === true) {
    query = query.not('diretor_tecnico_nome', 'is', null);
  } else if (filtros.possui_diretor_tecnico === false) {
    query = query.is('diretor_tecnico_nome', null);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Processar dados
  const dadosProcessados = (data || []).map((fed) => ({
    ...fed,
    status_label: getStatusLabel(fed.status),
    data_criacao_formatada: fed.data_criacao 
      ? format(new Date(fed.data_criacao), 'dd/MM/yyyy', { locale: ptBR })
      : '-',
    mandato_inicio_formatado: fed.mandato_inicio
      ? format(new Date(fed.mandato_inicio), 'dd/MM/yyyy', { locale: ptBR })
      : '-',
    mandato_fim_formatado: fed.mandato_fim
      ? format(new Date(fed.mandato_fim), 'dd/MM/yyyy', { locale: ptBR })
      : '-',
    periodo_mandato: fed.mandato_inicio && fed.mandato_fim
      ? `${format(new Date(fed.mandato_inicio), 'dd/MM/yyyy')} - ${format(new Date(fed.mandato_fim), 'dd/MM/yyyy')}`
      : '-',
  }));

  return { dados: dadosProcessados, total: dadosProcessados.length };
}

// ================================================================
// BUSCAR DIRIGENTES (visão expandida)
// ================================================================

async function buscarDadosDirigentes(
  filtros: Record<string, unknown>
): Promise<DadosRelatorioFederacao> {
  let query = supabase
    .from('federacoes_esportivas')
    .select('*')
    .order('nome', { ascending: true });

  // Filtrar por status da federação
  if (filtros.status_federacao && Array.isArray(filtros.status_federacao) && filtros.status_federacao.length > 0) {
    query = query.in('status', filtros.status_federacao);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Expandir para lista de dirigentes
  const dirigentes: Dirigente[] = [];
  const cargosFiltro = (filtros.cargo as string[]) || [];
  const filtrarCargos = cargosFiltro.length > 0;

  (data || []).forEach((fed) => {
    // Presidente
    if (!filtrarCargos || cargosFiltro.includes('presidente')) {
      dirigentes.push({
        federacao_id: fed.id,
        federacao_nome: fed.nome,
        federacao_sigla: fed.sigla,
        cargo: 'Presidente',
        nome: fed.presidente_nome,
        telefone: fed.presidente_telefone,
        email: fed.presidente_email,
        instagram: fed.presidente_instagram,
        facebook: fed.presidente_facebook,
        data_nascimento: fed.presidente_nascimento,
      });
    }

    // Vice-Presidente
    if (fed.vice_presidente_nome && (!filtrarCargos || cargosFiltro.includes('vice_presidente'))) {
      dirigentes.push({
        federacao_id: fed.id,
        federacao_nome: fed.nome,
        federacao_sigla: fed.sigla,
        cargo: 'Vice-Presidente',
        nome: fed.vice_presidente_nome,
        telefone: fed.vice_presidente_telefone,
        email: null,
        instagram: fed.vice_presidente_instagram,
        facebook: fed.vice_presidente_facebook,
        data_nascimento: fed.vice_presidente_data_nascimento,
      });
    }

    // Diretor Técnico
    if (fed.diretor_tecnico_nome && (!filtrarCargos || cargosFiltro.includes('diretor_tecnico'))) {
      dirigentes.push({
        federacao_id: fed.id,
        federacao_nome: fed.nome,
        federacao_sigla: fed.sigla,
        cargo: 'Diretor Técnico',
        nome: fed.diretor_tecnico_nome,
        telefone: fed.diretor_tecnico_telefone,
        email: null,
        instagram: fed.diretor_tecnico_instagram,
        facebook: fed.diretor_tecnico_facebook,
        data_nascimento: fed.diretor_tecnico_data_nascimento,
      });
    }
  });

  // Filtrar por possui instagram
  let resultado = dirigentes;
  if (filtros.possui_instagram === true) {
    resultado = resultado.filter(d => d.instagram);
  } else if (filtros.possui_instagram === false) {
    resultado = resultado.filter(d => !d.instagram);
  }

  // Processar datas
  const dadosProcessados = resultado.map((d) => ({
    ...d,
    data_nascimento_formatada: d.data_nascimento
      ? format(new Date(d.data_nascimento), 'dd/MM/yyyy', { locale: ptBR })
      : '-',
  }));

  return { dados: dadosProcessados, total: dadosProcessados.length };
}

// ================================================================
// HELPERS
// ================================================================

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    em_analise: 'Em Análise',
    ativo: 'Ativa',
    inativo: 'Inativa',
    rejeitado: 'Rejeitada',
  };
  return labels[status] || status;
}

// ================================================================
// TEMPLATES SALVOS (localStorage)
// ================================================================

export function useTemplatesFederacaoRelatorio() {
  const getTemplates = (): ConfiguracaoRelatorioFederacao[] => {
    try {
      const stored = localStorage.getItem('relatorio_federacoes_templates');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveTemplate = (template: ConfiguracaoRelatorioFederacao) => {
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

    localStorage.setItem('relatorio_federacoes_templates', JSON.stringify(templates));
    return newTemplate;
  };

  const deleteTemplate = (id: string) => {
    const templates = getTemplates().filter((t) => t.id !== id);
    localStorage.setItem('relatorio_federacoes_templates', JSON.stringify(templates));
  };

  return { getTemplates, saveTemplate, deleteTemplate };
}
