/**
 * Calendário de datas importantes. Junta quatro fontes num período:
 * - datas_importantes (prazos, eventos, reuniões — cadastradas no mural de avisos)
 * - dias_nao_uteis (feriados e pontos facultativos da Configuração de Frequência)
 * - BrasilAPI (feriados nacionais), só nas datas que o banco ainda não cobre
 * - RPC aniversariantes_do_mes (só nome e dia dos servidores ativos)
 *
 * Cada fonte que falhar é ignorada: o calendário mostra o que conseguiu carregar.
 * datas_importantes e a RPC ainda não estão nos tipos gerados, por isso o cliente `db` sem tipos.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { addMonths, eachMonthOfInterval, format, startOfMonth } from "date-fns";
import type { DataImportante, DataImportanteInput, EventoDataImportante } from "@/types/avisos";

const db = supabase as unknown as SupabaseClient;

const FMT = "yyyy-MM-dd";

/** Ocorrências de uma data recorrente (mês/dia) dentro do período, em cada ano coberto. */
function ocorrenciasAnuais(mes: number, dia: number, inicio: string, fim: string): string[] {
  const anos: number[] = [];
  for (let a = Number(inicio.slice(0, 4)); a <= Number(fim.slice(0, 4)); a++) anos.push(a);
  return anos
    .map((a) => `${a}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`)
    .filter((d) => d >= inicio && d <= fim);
}

interface FeriadoBrasilApi {
  date: string;
  name: string;
  type: string;
}

const feriadosNacionaisCache = new Map<number, Promise<FeriadoBrasilApi[]>>();

function feriadosNacionais(ano: number): Promise<FeriadoBrasilApi[]> {
  if (!feriadosNacionaisCache.has(ano)) {
    const req = fetch(`https://brasilapi.com.br/api/feriados/v1/${ano}`)
      .then((r) => (r.ok ? (r.json() as Promise<FeriadoBrasilApi[]>) : []))
      .catch(() => [] as FeriadoBrasilApi[]);
    req.then((lista) => {
      if (lista.length === 0) feriadosNacionaisCache.delete(ano); // tenta de novo depois
    });
    feriadosNacionaisCache.set(ano, req);
  }
  return feriadosNacionaisCache.get(ano)!;
}

async function buscarDatasCadastradas(inicio: string, fim: string): Promise<EventoDataImportante[]> {
  const { data, error } = await db
    .from("datas_importantes")
    .select("*")
    .eq("ativo", true)
    .or(`recorrente_anual.eq.true,and(data.lte.${fim},or(data_fim.gte.${inicio},and(data_fim.is.null,data.gte.${inicio})))`);
  if (error) throw error;

  return ((data || []) as unknown as DataImportante[]).flatMap((d) => {
    const base = { origem: "data_importante" as const, titulo: d.titulo, descricao: d.descricao, tipo: d.tipo };
    if (!d.recorrente_anual) return [{ ...base, id: d.id, data: d.data, dataFim: d.data_fim }];
    const [, mes, dia] = d.data.split("-").map(Number);
    return ocorrenciasAnuais(mes, dia, inicio, fim).map((data) => ({ ...base, id: `${d.id}-${data}`, data }));
  });
}

async function buscarFeriados(inicio: string, fim: string): Promise<EventoDataImportante[]> {
  const { data, error } = await supabase
    .from("dias_nao_uteis")
    .select("id, nome, data, tipo, recorrente, mes_recorrente, dia_recorrente, observacao")
    .eq("ativo", true)
    .or(`recorrente.eq.true,and(data.gte.${inicio},data.lte.${fim})`);

  const locais: EventoDataImportante[] = error
    ? []
    : (data || []).flatMap((d) => {
        const tipo = /facultativo/i.test(d.tipo) ? ("ponto_facultativo" as const) : ("feriado" as const);
        const base = { origem: "feriado" as const, titulo: d.nome, descricao: d.observacao, tipo };
        if (!d.recorrente) return [{ ...base, id: d.id, data: d.data }];
        const [, mesData, diaData] = d.data.split("-").map(Number);
        return ocorrenciasAnuais(d.mes_recorrente ?? mesData, d.dia_recorrente ?? diaData, inicio, fim).map(
          (data) => ({ ...base, id: `${d.id}-${data}`, data }),
        );
      });

  const cobertas = new Set(locais.map((f) => f.data));
  const anos = new Set([Number(inicio.slice(0, 4)), Number(fim.slice(0, 4))]);
  const nacionais = (await Promise.all([...anos].map(feriadosNacionais)))
    .flat()
    .filter((f) => f.date >= inicio && f.date <= fim && !cobertas.has(f.date))
    .map((f) => ({
      id: `brasilapi-${f.date}`,
      origem: "feriado" as const,
      titulo: f.name,
      descricao: "Feriado nacional",
      data: f.date,
      tipo: "feriado" as const,
    }));

  return [...locais, ...nacionais];
}

async function buscarAniversariantes(meses: Date[], inicio: string, fim: string): Promise<EventoDataImportante[]> {
  const listas = await Promise.all(
    meses.map(async (m) => {
      const { data, error } = await db.rpc("aniversariantes_do_mes", { p_mes: m.getMonth() + 1 });
      if (error) return [];
      return ((data || []) as { nome: string; dia: number }[]).map((a, i) => {
        const dataStr = `${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, "0")}-${String(a.dia).padStart(2, "0")}`;
        return {
          id: `aniv-${dataStr}-${i}`,
          origem: "aniversario" as const,
          titulo: a.nome,
          data: dataStr,
          tipo: "aniversario" as const,
        };
      });
    }),
  );
  return listas.flat().filter((a) => a.data >= inicio && a.data <= fim);
}

interface UseDatasImportantesOptions {
  inicio: Date;
  fim: Date;
  incluirAniversarios?: boolean;
}

export function useDatasImportantes({ inicio, fim, incluirAniversarios = true }: UseDatasImportantesOptions) {
  const inicioStr = format(inicio, FMT);
  const fimStr = format(fim, FMT);

  return useQuery({
    queryKey: ["datas-importantes", "calendario", inicioStr, fimStr, incluirAniversarios],
    queryFn: async (): Promise<EventoDataImportante[]> => {
      const meses = eachMonthOfInterval({ start: startOfMonth(inicio), end: fim });
      const [cadastradas, feriados, aniversarios] = await Promise.all([
        buscarDatasCadastradas(inicioStr, fimStr).catch(() => []),
        buscarFeriados(inicioStr, fimStr).catch(() => []),
        incluirAniversarios ? buscarAniversariantes(meses, inicioStr, fimStr).catch(() => []) : [],
      ]);
      return [...cadastradas, ...feriados, ...aniversarios].sort(
        (a, b) => a.data.localeCompare(b.data) || a.titulo.localeCompare(b.titulo),
      );
    },
  });
}

/** Próximas datas (hoje + N dias), sem aniversários — usado no sino. */
export function useProximasDatas(dias = 30) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const fim = new Date(hoje);
  fim.setDate(fim.getDate() + dias);
  return useDatasImportantes({ inicio: hoje, fim, incluirAniversarios: false });
}

export function useDatasImportantesGestao(habilitado: boolean) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["datas-importantes", "gestao"],
    enabled: habilitado,
    queryFn: async (): Promise<DataImportante[]> => {
      const desde = format(addMonths(new Date(), -12), FMT);
      const { data, error } = await db
        .from("datas_importantes")
        .select("*")
        .or(`recorrente_anual.eq.true,data.gte.${desde}`)
        .order("data", { ascending: true })
        .limit(500);
      if (error) throw error;
      return (data || []) as unknown as DataImportante[];
    },
  });

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ["datas-importantes"] });

  const salvar = useMutation({
    mutationFn: async ({ id, ...input }: DataImportanteInput & { id?: string }) => {
      const { error } = id
        ? await db.from("datas_importantes").update(input).eq("id", id)
        : await db.from("datas_importantes").insert(input);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      invalidar();
      toast.success(vars.id ? "Data atualizada" : "Data cadastrada");
    },
    onError: (error: Error) => toast.error("Erro ao salvar data: " + error.message),
  });

  const excluir = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("datas_importantes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidar();
      toast.success("Data excluída");
    },
    onError: (error: Error) => toast.error("Erro ao excluir data: " + error.message),
  });

  return { ...query, datas: query.data ?? [], salvar, excluir };
}
