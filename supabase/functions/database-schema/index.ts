import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

function categorizeTable(tableName: string): string {
  const categories: Record<string, string[]> = {
    'Pessoas': ['servidor', 'profile', 'user', 'participante', 'dependente'],
    'Estrutura': ['cargo', 'unidade', 'estrutura', 'organograma', 'composicao', 'lotacao'],
    'RH': ['ferias', 'licenca', 'frequencia', 'designacao', 'provimento', 'cessao', 'vinculo', 'nomeacao'],
    'Financeiro': ['folha', 'ficha', 'pagamento', 'inss', 'irrf', 'rubrica', 'consigna', 'remessa', 'banco', 'conta', 'parametro'],
    'Documentos': ['documento', 'portaria', 'memorando', 'ata', 'termo'],
    'Reuniões': ['reunia', 'reunio', 'convite', 'pauta'],
    'Unidades Locais': ['unidade_local', 'patrimonio_unidade', 'agenda_unidade', 'cedencia'],
    'Sistema': ['audit', 'backup', 'config', 'role', 'permission', 'approval', 'indicacao'],
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

const KNOWN_TABLES = [
  'agenda_unidade', 'approval_delegations', 'approval_requests', 'audit_logs',
  'backup_config', 'backup_history', 'backup_integrity_checks', 'banco_horas',
  'bancos_cnab', 'cargo_unidade_compatibilidade', 'cargos', 'centros_custo',
  'cessoes', 'composicao_cargos', 'config_assinatura_reuniao', 'config_autarquia',
  'configuracao_jornada', 'consignacoes', 'contas_autarquia', 'dependentes_irrf',
  'designacoes', 'documentos', 'documentos_cedencia', 'estrutura_organizacional',
  'ferias_servidor', 'fichas_financeiras', 'folhas_pagamento', 'frequencia_mensal',
  'historico_cargo_servidor', 'historico_lotacao', 'indicacoes', 'licencas_afastamentos',
  'lotacoes', 'memorandos_lotacao', 'modelos_mensagem_reuniao', 'nomeacoes_chefe_unidade',
  'parametros_folha', 'participantes_reuniao', 'patrimonio_unidade', 'pautas_reuniao',
  'portarias_servidor', 'pre_cadastros', 'profiles', 'provimentos',
  'registro_ponto', 'remessas_bancarias', 'reunioes', 'role_permissions',
  'rubricas', 'servidores', 'tabela_inss', 'tabela_irrf',
  'unidades_locais', 'user_org_units', 'user_permissions', 'user_roles',
  'user_security_settings', 'viagens_diarias', 'vinculos_funcionais'
];

async function processTable(
  supabase: any,
  tableName: string
): Promise<{ table: TableInfo; rels: RelationshipInfo[] } | null> {
  try {
    // Buscar contagem e amostra em paralelo
    const [countResult, sampleResult] = await Promise.all([
      supabase.from(tableName).select('*', { count: 'exact', head: true }),
      supabase.from(tableName).select('*').limit(1)
    ]);

    if (countResult.error) {
      console.warn(`Erro ao contar ${tableName}:`, countResult.error.message);
      return null;
    }

    const rowCount = countResult.count ?? 0;
    const category = categorizeTable(tableName);
    const columns: ColumnInfo[] = [];
    const rels: RelationshipInfo[] = [];

    if (sampleResult.data && sampleResult.data.length > 0) {
      const sample = sampleResult.data[0];
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
            exists: KNOWN_TABLES.includes(targetTable),
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
    console.error(`Erro ao processar tabela ${tableName}:`, e);
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

    // Processar TODAS as tabelas em paralelo para máxima velocidade
    const results = await Promise.all(
      KNOWN_TABLES.map(tableName => processTable(supabase, tableName))
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

    return new Response(
      JSON.stringify({ tables, relationships, stats, diagnostics }),
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
