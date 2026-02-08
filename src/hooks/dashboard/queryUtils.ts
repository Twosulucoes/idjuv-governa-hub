/**
 * Utilitário para queries de dashboard
 * Evita erros de "Type instantiation is excessively deep" do Supabase
 */

import { supabase } from "@/integrations/supabase/client";

type QueryResult = {
  count: number | null;
  data: any[] | null;
  error: any;
};

/**
 * Executa uma query de contagem simples
 */
export async function countQuery(
  table: string,
  filters: Record<string, any> = {}
): Promise<number> {
  let query = supabase.from(table as any).select("id", { count: "exact", head: true });
  
  for (const [key, value] of Object.entries(filters)) {
    if (value === null) {
      query = query.is(key, null);
    } else if (Array.isArray(value)) {
      query = query.in(key, value);
    } else if (typeof value === "object" && value.op) {
      // Suporta operadores especiais { op: 'gte', value: x }
      switch (value.op) {
        case "gte":
          query = query.gte(key, value.value);
          break;
        case "lte":
          query = query.lte(key, value.value);
          break;
        case "gt":
          query = query.gt(key, value.value);
          break;
        case "lt":
          query = query.lt(key, value.value);
          break;
        case "neq":
          query = query.neq(key, value.value);
          break;
      }
    } else {
      query = query.eq(key, value);
    }
  }
  
  const result = await query as unknown as QueryResult;
  return result.count || 0;
}

/**
 * Executa uma query de select simples
 */
export async function selectQuery<T>(
  table: string,
  columns: string,
  filters: Record<string, any> = {},
  options: { limit?: number; orderBy?: { column: string; ascending?: boolean } } = {}
): Promise<T[]> {
  let query = supabase.from(table as any).select(columns);
  
  for (const [key, value] of Object.entries(filters)) {
    if (value === null) {
      query = query.is(key, null);
    } else if (Array.isArray(value)) {
      query = query.in(key, value);
    } else if (typeof value === "object" && value.op) {
      switch (value.op) {
        case "gte":
          query = query.gte(key, value.value);
          break;
        case "lte":
          query = query.lte(key, value.value);
          break;
        case "gt":
          query = query.gt(key, value.value);
          break;
        case "lt":
          query = query.lt(key, value.value);
          break;
        case "neq":
          query = query.neq(key, value.value);
          break;
      }
    } else {
      query = query.eq(key, value);
    }
  }
  
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  if (options.orderBy) {
    query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true });
  }
  
  const result = await query as unknown as QueryResult;
  return (result.data || []) as T[];
}

/**
 * Operadores para filtros
 */
export const op = {
  gte: (value: any) => ({ op: "gte", value }),
  lte: (value: any) => ({ op: "lte", value }),
  gt: (value: any) => ({ op: "gt", value }),
  lt: (value: any) => ({ op: "lt", value }),
  neq: (value: any) => ({ op: "neq", value }),
};
