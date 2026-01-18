import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TableInfo {
  name: string;
  schema: string;
  columns: ColumnInfo[];
  rowCount: number;
  category: string;
  hasRLS: boolean;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  isFK: boolean;
  referencedTable: string | null;
}

export interface RelationshipInfo {
  sourceTable: string;
  sourceColumn: string;
  targetTable: string;
  type: 'explicit' | 'implicit';
  exists: boolean;
}

export interface DiagnosticInfo {
  type: 'warning' | 'error' | 'info';
  message: string;
  table?: string;
}

export interface DatabaseSchemaData {
  tables: TableInfo[];
  relationships: RelationshipInfo[];
  stats: {
    totalTables: number;
    tablesWithData: number;
    emptyTables: number;
    totalRelationships: number;
    implicitRelationships: number;
    explicitRelationships: number;
    categoryCounts: Record<string, number>;
  };
  diagnostics: DiagnosticInfo[];
}

async function fetchDatabaseSchema(): Promise<DatabaseSchemaData> {
  // Chamar a edge function que processa tudo no servidor
  const { data, error } = await supabase.functions.invoke('database-schema');

  if (error) {
    console.error('Erro ao buscar schema:', error);
    throw new Error('Falha ao carregar schema do banco de dados');
  }

  return data as DatabaseSchemaData;
}

export function useDatabaseSchema() {
  return useQuery({
    queryKey: ['database-schema'],
    queryFn: fetchDatabaseSchema,
    staleTime: 10 * 60 * 1000, // 10 minutos de cache
    gcTime: 60 * 60 * 1000, // 1 hora no garbage collector
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

// Cores por categoria para o diagrama
export const CATEGORY_COLORS: Record<string, string> = {
  'Pessoas': '#3b82f6',
  'Estrutura': '#22c55e',
  'RH': '#f59e0b',
  'Financeiro': '#f97316',
  'Documentos': '#8b5cf6',
  'Reuniões': '#ec4899',
  'Unidades Locais': '#06b6d4',
  'Sistema': '#6b7280',
  'Outros': '#a1a1aa',
};
