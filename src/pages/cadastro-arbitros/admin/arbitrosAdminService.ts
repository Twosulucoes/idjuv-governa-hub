/**
 * Service layer para administração de cadastro de árbitros
 */
import { supabase } from "@/integrations/supabase/client";

export interface ArbitroModalidade {
  id: string;
  modalidade: string;
  categoria: string;
  status: string;
  documentos_urls: string[];
  created_at: string;
}

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
  // Multi-modalidade
  modalidades_lista?: ArbitroModalidade[];
}

export async function fetchArbitros(filters?: {
  status?: string;
  categoria?: string;
  modalidade?: string;
  uf?: string;
  busca?: string;
}) {
  // Se filtro de modalidade ou categoria, buscar IDs da tabela filha primeiro
  let modalidadeFilterIds: string[] | null = null;

  if ((filters?.modalidade && filters.modalidade !== "todos") || (filters?.categoria && filters.categoria !== "todos")) {
    let modQuery = supabase
      .from("cadastro_arbitros_modalidades" as any)
      .select("arbitro_id");

    if (filters?.modalidade && filters.modalidade !== "todos") {
      modQuery = modQuery.ilike("modalidade", `%${filters.modalidade}%`);
    }
    if (filters?.categoria && filters.categoria !== "todos") {
      modQuery = modQuery.eq("categoria", filters.categoria);
    }

    const { data: modIds } = await modQuery;
    modalidadeFilterIds = [...new Set((modIds || []).map((m: any) => m.arbitro_id))];

    if (modalidadeFilterIds.length === 0) return [];
  }

  let query = supabase
    .from("cadastro_arbitros" as any)
    .select("*")
    .order("created_at", { ascending: false });

  if (modalidadeFilterIds) {
    query = query.in("id", modalidadeFilterIds);
  }

  if (filters?.status && filters.status !== "todos") {
    query = query.eq("status", filters.status);
  }
  if (filters?.uf && filters.uf !== "todos") {
    query = query.eq("uf", filters.uf);
  }
  if (filters?.busca) {
    query = query.or(
      `nome.ilike.%${filters.busca}%,cpf.ilike.%${filters.busca}%,protocolo.ilike.%${filters.busca}%,email.ilike.%${filters.busca}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;

  const arbitros = (data || []) as unknown as ArbitroCadastro[];

  // Buscar modalidades da tabela filha
  if (arbitros.length > 0) {
    const ids = arbitros.map(a => a.id);
    const { data: modalidadesData } = await supabase
      .from("cadastro_arbitros_modalidades" as any)
      .select("*")
      .in("arbitro_id", ids);

    if (modalidadesData) {
      const modMap = new Map<string, ArbitroModalidade[]>();
      (modalidadesData as any[]).forEach(m => {
        const list = modMap.get(m.arbitro_id) || [];
        list.push({
          id: m.id,
          modalidade: m.modalidade,
          categoria: m.categoria,
          status: m.status,
          documentos_urls: Array.isArray(m.documentos_urls) ? m.documentos_urls : [],
          created_at: m.created_at,
        });
        modMap.set(m.arbitro_id, list);
      });

      arbitros.forEach(a => {
        a.modalidades_lista = modMap.get(a.id) || [];
      });
    }
  }

  return arbitros;
}

export async function updateArbitroStatus(id: string, status: string) {
  const { error } = await supabase
    .from("cadastro_arbitros" as any)
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function updateModalidadeStatus(id: string, status: string) {
  const { error } = await supabase
    .from("cadastro_arbitros_modalidades" as any)
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function updateArbitro(id: string, dados: Partial<ArbitroCadastro>) {
  const { error } = await supabase
    .from("cadastro_arbitros" as any)
    .update({ ...dados, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteArbitro(id: string) {
  const { error } = await supabase
    .from("cadastro_arbitros" as any)
    .delete()
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

  const arbitro = data as unknown as ArbitroCadastro;

  // Buscar modalidades
  const { data: mods } = await supabase
    .from("cadastro_arbitros_modalidades" as any)
    .select("*")
    .eq("arbitro_id", id);

  arbitro.modalidades_lista = ((mods || []) as any[]).map(m => ({
    id: m.id,
    modalidade: m.modalidade,
    categoria: m.categoria,
    status: m.status,
    documentos_urls: Array.isArray(m.documentos_urls) ? m.documentos_urls : [],
    created_at: m.created_at,
  }));

  return arbitro;
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

  const arbitros = (data || []) as unknown as ArbitroCadastro[];

  // Buscar todas as modalidades
  const { data: modsData } = await supabase
    .from("cadastro_arbitros_modalidades" as any)
    .select("*");
  const allMods = (modsData || []) as any[];

  const total = arbitros.length;
  const pendentes = arbitros.filter((a) => a.status === "pendente" || a.status === "enviado").length;
  const aprovados = arbitros.filter((a) => a.status === "aprovado").length;
  const rejeitados = arbitros.filter((a) => a.status === "rejeitado").length;

  // Por categoria (da tabela de modalidades)
  const catMap = new Map<string, number>();
  if (allMods.length > 0) {
    allMods.forEach((m: any) => {
      catMap.set(m.categoria, (catMap.get(m.categoria) || 0) + 1);
    });
  } else {
    arbitros.forEach((a) => {
      if (a.categoria) catMap.set(a.categoria, (catMap.get(a.categoria) || 0) + 1);
    });
  }
  const porCategoria = Array.from(catMap, ([categoria, count]) => ({ categoria, count }));

  // Por modalidade (da tabela de modalidades)
  const modMap = new Map<string, number>();
  if (allMods.length > 0) {
    allMods.forEach((m: any) => {
      const name = m.modalidade?.trim() || "Não informado";
      modMap.set(name, (modMap.get(name) || 0) + 1);
    });
  } else {
    arbitros.forEach((a) => {
      const m = a.modalidade?.trim() || "Não informado";
      modMap.set(m, (modMap.get(m) || 0) + 1);
    });
  }
  const porModalidade = Array.from(modMap, ([modalidade, count]) => ({ modalidade, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

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