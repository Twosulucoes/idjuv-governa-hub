/**
 * Service layer para administração de cadastro de árbitros
 */
import { supabase } from "@/integrations/supabase/client";

export interface ArbitroCadastro {
  id: string;
  protocolo: string | null;
  status: string;
  nome: string;
  nacionalidade: string;
  sexo: string;
  data_nascimento: string;
  categoria: string;
  tipo_sanguineo: string | null;
  fator_rh: string | null;
  cpf: string;
  rg: string | null;
  rne: string | null;
  validade_rne: string | null;
  pis_pasep: string | null;
  cep: string | null;
  endereco: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  email: string;
  celular: string;
  modalidade: string;
  local_trabalho: string | null;
  funcao: string | null;
  esfera: string | null;
  banco: string | null;
  agencia: string | null;
  conta_corrente: string | null;
  foto_url: string | null;
  documentos_urls: string[] | null;
  created_at: string;
  updated_at: string;
}

export async function fetchArbitros(filters?: {
  status?: string;
  categoria?: string;
  modalidade?: string;
  uf?: string;
  busca?: string;
}) {
  let query = supabase
    .from("cadastro_arbitros" as any)
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "todos") {
    query = query.eq("status", filters.status);
  }
  if (filters?.categoria && filters.categoria !== "todos") {
    query = query.eq("categoria", filters.categoria);
  }
  if (filters?.uf && filters.uf !== "todos") {
    query = query.eq("uf", filters.uf);
  }
  if (filters?.modalidade && filters.modalidade !== "todos") {
    query = query.ilike("modalidade", `%${filters.modalidade}%`);
  }
  if (filters?.busca) {
    query = query.or(
      `nome.ilike.%${filters.busca}%,cpf.ilike.%${filters.busca}%,protocolo.ilike.%${filters.busca}%,email.ilike.%${filters.busca}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as ArbitroCadastro[];
}

export async function updateArbitroStatus(id: string, status: string) {
  const { error } = await supabase
    .from("cadastro_arbitros" as any)
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function fetchArbitroById(id: string) {
  const { data, error } = await supabase
    .from("cadastro_arbitros" as any)
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as ArbitroCadastro;
}

export interface EstatisticasArbitros {
  total: number;
  pendentes: number;
  aprovados: number;
  rejeitados: number;
  porCategoria: { categoria: string; count: number }[];
  porModalidade: { modalidade: string; count: number }[];
  porUF: { uf: string; count: number }[];
  porMes: { mes: string; count: number }[];
  porSexo: { sexo: string; count: number }[];
}

export async function fetchEstatisticas(): Promise<EstatisticasArbitros> {
  const { data, error } = await supabase
    .from("cadastro_arbitros" as any)
    .select("*");
  if (error) throw error;

  const arbitros = (data || []) as ArbitroCadastro[];
  const total = arbitros.length;
  const pendentes = arbitros.filter((a) => a.status === "pendente").length;
  const aprovados = arbitros.filter((a) => a.status === "aprovado").length;
  const rejeitados = arbitros.filter((a) => a.status === "rejeitado").length;

  // Por categoria
  const catMap = new Map<string, number>();
  arbitros.forEach((a) => {
    catMap.set(a.categoria, (catMap.get(a.categoria) || 0) + 1);
  });
  const porCategoria = Array.from(catMap, ([categoria, count]) => ({ categoria, count }));

  // Por modalidade
  const modMap = new Map<string, number>();
  arbitros.forEach((a) => {
    const m = a.modalidade?.trim() || "Não informado";
    modMap.set(m, (modMap.get(m) || 0) + 1);
  });
  const porModalidade = Array.from(modMap, ([modalidade, count]) => ({ modalidade, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Por UF
  const ufMap = new Map<string, number>();
  arbitros.forEach((a) => {
    const u = a.uf || "N/I";
    ufMap.set(u, (ufMap.get(u) || 0) + 1);
  });
  const porUF = Array.from(ufMap, ([uf, count]) => ({ uf, count })).sort((a, b) => b.count - a.count);

  // Por mês
  const mesMap = new Map<string, number>();
  arbitros.forEach((a) => {
    const d = new Date(a.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    mesMap.set(key, (mesMap.get(key) || 0) + 1);
  });
  const porMes = Array.from(mesMap, ([mes, count]) => ({ mes, count })).sort((a, b) =>
    a.mes.localeCompare(b.mes)
  );

  // Por sexo
  const sexoMap = new Map<string, number>();
  arbitros.forEach((a) => {
    const s = a.sexo === "M" ? "Masculino" : "Feminino";
    sexoMap.set(s, (sexoMap.get(s) || 0) + 1);
  });
  const porSexo = Array.from(sexoMap, ([sexo, count]) => ({ sexo, count }));

  return { total, pendentes, aprovados, rejeitados, porCategoria, porModalidade, porUF, porMes, porSexo };
}
