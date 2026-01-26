import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TableInfo {
  name: string;
  schema: string;
  columns: ColumnInfo[];
  rowCount: number;
  category: string;
  hasRLS: boolean;
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  isFK: boolean;
  referencedTable: string | null;
}

interface RelationshipInfo {
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  type: 'explicit' | 'implicit';
  exists: boolean;
}

// ============================================
// TABELAS DE SISTEMA A IGNORAR
// ============================================
const EXCLUDED_TABLES = [
  '_realtime_subscription',
  'schema_migrations',
  'supabase_functions_migrations',
  'supabase_functions_hooks',
];

// ============================================
// CATEGORIZAÇÃO DINÂMICA POR PADRÕES DE NOME
// ============================================
function categorizeTable(tableName: string): string {
  const categories: Record<string, string[]> = {
    'Pessoas': ['servidor', 'profile', 'user', 'participante', 'dependente', 'pensoes'],
    'Estrutura': ['cargo', 'unidade', 'estrutura', 'organograma', 'composicao', 'lotacao', 'centros_custo'],
    'RH': ['ferias', 'licenca', 'frequencia', 'designacao', 'provimento', 'cessao', 'vinculo', 'nomeacao', 'historico_funcional', 'ocorrencias', 'pre_cadastro'],
    'Financeiro': ['folha', 'ficha', 'pagamento', 'inss', 'irrf', 'rubrica', 'consigna', 'remessa', 'banco', 'conta', 'parametro', 'esocial', 'exportacoes', 'lancamentos_folha', 'itens_ficha', 'itens_retorno', 'retornos'],
    'Ponto': ['ponto', 'jornada', 'horarios_jornada', 'justificativas', 'solicitacoes_ajuste', 'banco_horas', 'lancamentos_banco', 'feriados'],
    'Documentos': ['documento', 'portaria', 'memorando', 'ata', 'termo'],
    'Reuniões': ['reunia', 'reunio', 'convite', 'modelo', 'historico_convite'],
    'Unidades Locais': ['unidade_local', 'patrimonio_unidade', 'agenda_unidade', 'cedencia', 'termos_cessao'],
    'Federações': ['federac', 'calendario_federacao'],
    'ASCOM': ['demandas_ascom', 'ascom_anexo', 'ascom_comentario', 'ascom_entregav'],
    'Sistema': ['audit', 'backup', 'config', 'role', 'permission', 'approval', 'perfis', 'funcoes_sistema', 'perfil_funcoes', 'usuario_perfis', 'module_access'],
  };

  const lowerName = tableName.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(kw => lowerName.includes(kw))) {
      return category;
    }
  }
  
  return 'Outros';
}

function inferTargetTable(columnName: string): string | null {
  if (!columnName.endsWith('_id') || columnName === 'id') return null;
  
  const baseName = columnName.replace(/_id$/, '');
  
  const specialMappings: Record<string, string> = {
    'servidor': 'servidores',
    'cargo': 'cargos',
    'unidade': 'estrutura_organizacional',
    'unidade_destino': 'estrutura_organizacional',
    'unidade_origem': 'estrutura_organizacional',
    'unidade_local': 'unidades_locais',
    'superior': 'estrutura_organizacional',
    'user': 'profiles',
    'created_by': 'profiles',
    'updated_by': 'profiles',
    'aprovador': 'servidores',
    'aprovado_por': 'profiles',
    'requester': 'profiles',
    'approver': 'profiles',
    'delegate': 'profiles',
    'delegator': 'profiles',
    'folha': 'folhas_pagamento',
    'rubrica': 'rubricas',
    'banco': 'bancos_cnab',
    'conta_autarquia': 'contas_autarquia',
    'reuniao': 'reunioes',
    'provimento': 'provimentos',
    'lotacao': 'lotacoes',
    'designacao': 'designacoes',
    'cargo_chefe': 'cargos',
    'cargo_atual': 'cargos',
    'unidade_atual': 'estrutura_organizacional',
    'unidade_idjuv': 'estrutura_organizacional',
    'agenda': 'agenda_unidade',
    'backup': 'backup_history',
    'org_unit': 'estrutura_organizacional',
    'requester_org_unit': 'estrutura_organizacional',
  };

  return specialMappings[baseName] || `${baseName}s`;
}

// ============================================
// DESCOBERTA DINÂMICA DE TABELAS
// ============================================
interface DiscoveredTable {
  table_name: string;
  row_count: number;
}

// deno-lint-ignore no-explicit-any
async function discoverTables(supabase: SupabaseClient<any, any, any>): Promise<DiscoveredTable[]> {
  console.log('[DISCOVERY] Consultando catálogo PostgreSQL...');
  
  const { data, error } = await supabase.rpc('list_public_tables');
  
  if (error) {
    console.error('[DISCOVERY] Erro ao listar tabelas:', error);
    throw new Error(`Falha na descoberta de tabelas: ${error.message}`);
  }
  
  // Filtrar tabelas excluídas
  const rawData = data as DiscoveredTable[] | null;
  const tables = (rawData || []).filter(
    (t: DiscoveredTable) => !EXCLUDED_TABLES.includes(t.table_name)
  );
  
  console.log(`[DISCOVERY] ${tables.length} tabelas descobertas automaticamente`);
  
  return tables;
}

// deno-lint-ignore no-explicit-any
async function processTable(
  supabase: SupabaseClient<any, any, any>,
  tableName: string,
  rowCount: number,
  allTableNames: string[]
): Promise<{ table: TableInfo; rels: RelationshipInfo[] } | null> {
  try {
    const category = categorizeTable(tableName);
    const columns: ColumnInfo[] = [];
    const rels: RelationshipInfo[] = [];

    // Buscar amostra para inferir colunas
    const { data: sampleResult } = await supabase.from(tableName).select('*').limit(1);

    if (sampleResult && sampleResult.length > 0) {
      const sample = sampleResult[0];
      for (const [colName, value] of Object.entries(sample)) {
        const isFK = colName.endsWith('_id') && colName !== 'id';
        const targetTable = inferTargetTable(colName);

        columns.push({
          name: colName,
          type: typeof value === 'number' ? 'number' :
                typeof value === 'boolean' ? 'boolean' :
                Array.isArray(value) ? 'array' :
                typeof value === 'object' && value !== null ? 'jsonb' : 'text',
          nullable: value === null,
          defaultValue: null,
          isFK,
          referencedTable: targetTable,
        });

        if (isFK && targetTable) {
          rels.push({
            sourceTable: tableName,
            sourceColumn: colName,
            targetTable,
            type: 'implicit',
            exists: allTableNames.includes(targetTable),
          });
        }
      }
    }

    return {
      table: {
        name: tableName,
        schema: 'public',
        columns,
        rowCount,
        category,
        hasRLS: true,
      },
      rels
    };
  } catch (e) {
    console.error(`[PROCESS] Erro ao processar tabela ${tableName}:`, e);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ============================================
    // DESCOBERTA AUTOMÁTICA DE TABELAS
    // ============================================
    const discoveredTables = await discoverTables(supabase);
    const allTableNames = discoveredTables.map(t => t.table_name);
    const discoveredAt = new Date().toISOString();

    console.log(`[SCHEMA] Processando ${discoveredTables.length} tabelas...`);

    // Processar TODAS as tabelas em paralelo para máxima velocidade
    const results = await Promise.all(
      discoveredTables.map(t => processTable(supabase, t.table_name, t.row_count, allTableNames))
    );

    const tables: TableInfo[] = [];
    const relationships: RelationshipInfo[] = [];

    for (const result of results) {
      if (result) {
        tables.push(result.table);
        relationships.push(...result.rels);
      }
    }

    // Estatísticas
    const stats = {
      totalTables: tables.length,
      tablesWithData: tables.filter(t => t.rowCount > 0).length,
      emptyTables: tables.filter(t => t.rowCount === 0).length,
      totalRelationships: relationships.length,
      implicitRelationships: relationships.filter(r => r.type === 'implicit').length,
      explicitRelationships: relationships.filter(r => r.type === 'explicit').length,
      categoryCounts: {} as Record<string, number>,
    };

    for (const table of tables) {
      stats.categoryCounts[table.category] = (stats.categoryCounts[table.category] || 0) + 1;
    }

    // Diagnósticos
    const diagnostics: Array<{ type: 'warning' | 'error' | 'info'; message: string; table?: string }> = [];

    const criticalTables = ['fichas_financeiras', 'designacoes', 'portarias_servidor', 'historico_cargo_servidor'];
    for (const table of tables) {
      if (criticalTables.includes(table.name) && table.rowCount === 0) {
        diagnostics.push({
          type: 'warning',
          message: `Tabela crítica "${table.name}" está vazia`,
          table: table.name,
        });
      }
    }

    for (const rel of relationships) {
      if (!rel.exists) {
        diagnostics.push({
          type: 'error',
          message: `Relacionamento de "${rel.sourceTable}.${rel.sourceColumn}" aponta para tabela inexistente "${rel.targetTable}"`,
          table: rel.sourceTable,
        });
      }
    }

    for (const table of tables) {
      if (table.columns.length > 50) {
        diagnostics.push({
          type: 'info',
          message: `Tabela "${table.name}" tem ${table.columns.length} colunas - considere normalização`,
          table: table.name,
        });
      }
    }

    console.log(`[SCHEMA] Concluído: ${tables.length} tabelas, ${relationships.length} relacionamentos`);

    return new Response(
      JSON.stringify({ 
        tables, 
        relationships, 
        stats, 
        diagnostics,
        discovery: {
          mode: 'automatic',
          discoveredAt,
          source: 'information_schema.tables'
        }
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro:", error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
