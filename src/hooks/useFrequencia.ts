import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface RegistroPonto {
  id: string;
  servidor_id: string;
  data: string;
  tipo: string;
  entrada1?: string;
  saida1?: string;
  entrada2?: string;
  saida2?: string;
  entrada3?: string;
  saida3?: string;
  horas_trabalhadas?: number;
  horas_extras?: number;
  status?: string;
  observacao?: string;
  justificativa?: string;
  created_at?: string;
}

export interface FrequenciaMensal {
  id: string;
  servidor_id: string;
  ano: number;
  mes: number;
  dias_uteis: number;
  dias_trabalhados: number;
  faltas: number;
  atestados: number;
  ferias: number;
  licencas: number;
  abonos: number;
  percentual_presenca: number;
  created_at?: string;
  updated_at?: string;
}

export interface FrequenciaServidorResumo {
  servidor_id: string;
  servidor_nome: string;
  servidor_matricula?: string;
  servidor_cpf?: string;
  servidor_cargo?: string;
  servidor_unidade?: string;
  dias_uteis: number;
  dias_trabalhados: number;
  faltas: number;
  atestados: number;
  ferias: number;
  licencas: number;
  abonos: number;
  percentual_presenca: number;
}

// Buscar resumo de frequência de todos os servidores para uma competência
export function useFrequenciaResumo(ano: number, mes: number) {
  return useQuery({
    queryKey: ["frequencia-resumo", ano, mes],
    queryFn: async () => {
      // Buscar servidores ativos
      const { data: servidores, error: errServidores } = await supabase
        .from("servidores")
        .select(`
          id,
          nome_completo,
          matricula,
          cpf,
          cargo_atual_id,
          unidade_atual_id,
          cargos:cargo_atual_id(nome),
          unidades:unidade_atual_id(nome, sigla)
        `)
        .eq("ativo", true)
        .eq("situacao", "ativo");

      if (errServidores) throw errServidores;

      // Buscar frequência mensal
      const { data: frequencias, error: errFreq } = await supabase
        .from("frequencia_mensal")
        .select("*")
        .eq("ano", ano)
        .eq("mes", mes);

      if (errFreq) throw errFreq;

      // Calcular dias úteis do mês
      const diasUteisMes = calcularDiasUteis(ano, mes);

      // Montar resumo por servidor
      const resumos: FrequenciaServidorResumo[] = (servidores || []).map((s) => {
        const freq = frequencias?.find((f) => f.servidor_id === s.id);
        
        const cargo = s.cargos as { nome: string } | null;
        const unidade = s.unidades as { nome: string; sigla: string } | null;
        
        return {
          servidor_id: s.id,
          servidor_nome: s.nome_completo,
          servidor_matricula: s.matricula,
          servidor_cpf: s.cpf,
          servidor_cargo: cargo?.nome || undefined,
          servidor_unidade: unidade ? `${unidade.sigla || ''} - ${unidade.nome}` : undefined,
          dias_uteis: diasUteisMes,
          dias_trabalhados: freq?.dias_trabalhados || 0,
          faltas: freq?.dias_falta || 0,
          atestados: freq?.dias_atestado || 0,
          ferias: freq?.dias_ferias || 0,
          licencas: freq?.dias_licenca || 0,
          abonos: freq?.dias_folga || 0,
          percentual_presenca: freq?.percentual_presenca || 0,
        };
      });

      return resumos;
    },
    enabled: ano > 0 && mes > 0,
  });
}

// Buscar registros de ponto de um servidor para uma competência
export function useRegistrosPonto(servidorId: string | undefined, ano: number, mes: number) {
  return useQuery({
    queryKey: ["registros-ponto", servidorId, ano, mes],
    queryFn: async () => {
      if (!servidorId) return [];

      const dataInicio = `${ano}-${String(mes).padStart(2, "0")}-01`;
      const ultimoDia = new Date(ano, mes, 0).getDate();
      const dataFim = `${ano}-${String(mes).padStart(2, "0")}-${ultimoDia}`;

      const { data, error } = await supabase
        .from("registros_ponto")
        .select("*")
        .eq("servidor_id", servidorId)
        .gte("data", dataInicio)
        .lte("data", dataFim)
        .order("data", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!servidorId && ano > 0 && mes > 0,
  });
}

// Buscar frequência mensal de um servidor
export function useFrequenciaMensal(servidorId: string | undefined, ano: number, mes: number) {
  return useQuery({
    queryKey: ["frequencia-mensal", servidorId, ano, mes],
    queryFn: async () => {
      if (!servidorId) return null;

      const { data, error } = await supabase
        .from("frequencia_mensal")
        .select("*")
        .eq("servidor_id", servidorId)
        .eq("ano", ano)
        .eq("mes", mes)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!servidorId && ano > 0 && mes > 0,
  });
}

// Lançar registro de ponto (falta, atestado, etc.)
export function useLancarRegistroPonto() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (registro: Omit<RegistroPonto, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("registros_ponto")
        .upsert(
          {
            servidor_id: registro.servidor_id,
            data: registro.data,
            tipo: registro.tipo as "normal" | "falta" | "atestado" | "ferias" | "licenca" | "folga" | "feriado",
            entrada1: registro.entrada1,
            saida1: registro.saida1,
            entrada2: registro.entrada2,
            saida2: registro.saida2,
            observacao: registro.observacao,
          },
          { onConflict: "servidor_id,data" }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      const data = new Date(variables.data);
      queryClient.invalidateQueries({
        queryKey: ["registros-ponto", variables.servidor_id, data.getFullYear(), data.getMonth() + 1],
      });
      queryClient.invalidateQueries({
        queryKey: ["frequencia-resumo"],
      });
      toast.success("Registro salvo com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao salvar registro:", error);
      toast.error("Erro ao salvar registro de ponto.");
    },
  });
}

// Lançar falta em lote
export function useLancarFaltaEmLote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      servidor_id,
      datas,
      tipo,
      justificativa,
    }: {
      servidor_id: string;
      datas: string[];
      tipo: string;
      justificativa?: string;
    }) => {
      const tipoValido = tipo as "normal" | "falta" | "atestado" | "ferias" | "licenca" | "folga" | "feriado";
      const registros = datas.map((data) => ({
        servidor_id,
        data,
        tipo: tipoValido,
        observacao: justificativa,
      }));

      const { data, error } = await supabase
        .from("registros_ponto")
        .upsert(registros, { onConflict: "servidor_id,data" })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registros-ponto"] });
      queryClient.invalidateQueries({ queryKey: ["frequencia-resumo"] });
      toast.success("Registros salvos com sucesso!");
    },
    onError: (error) => {
      console.error("Erro ao salvar registros:", error);
      toast.error("Erro ao salvar registros de ponto.");
    },
  });
}

// Recalcular frequência mensal de um servidor
export function useRecalcularFrequencia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      servidor_id,
      ano,
      mes,
    }: {
      servidor_id: string;
      ano: number;
      mes: number;
    }) => {
      const dataInicio = `${ano}-${String(mes).padStart(2, "0")}-01`;
      const ultimoDia = new Date(ano, mes, 0).getDate();
      const dataFim = `${ano}-${String(mes).padStart(2, "0")}-${ultimoDia}`;

      // Buscar registros do mês
      const { data: registros, error: errReg } = await supabase
        .from("registros_ponto")
        .select("*")
        .eq("servidor_id", servidor_id)
        .gte("data", dataInicio)
        .lte("data", dataFim);

      if (errReg) throw errReg;

      // Calcular totais
      const diasUteis = calcularDiasUteis(ano, mes);
      let diasTrabalhados = 0;
      let faltas = 0;
      let atestados = 0;
      let ferias = 0;
      let licencas = 0;
      let abonos = 0;

      (registros || []).forEach((r) => {
        switch (r.tipo) {
          case "normal":
            diasTrabalhados++;
            break;
          case "falta":
            faltas++;
            break;
          case "atestado":
            atestados++;
            break;
          case "ferias":
            ferias++;
            break;
          case "licenca":
            licencas++;
            break;
          case "folga":
            abonos++;
            diasTrabalhados++;
            break;
          default:
            break;
        }
      });

      const percentualPresenca =
        diasUteis > 0
          ? ((diasTrabalhados + atestados + ferias + licencas + abonos) / diasUteis) * 100
          : 0;

      // Upsert na tabela frequencia_mensal - usando nomes corretos das colunas
      const { data, error } = await supabase
        .from("frequencia_mensal")
        .upsert(
          {
            servidor_id,
            ano,
            mes,
            dias_trabalhados: diasTrabalhados,
            dias_falta: faltas,
            dias_atestado: atestados,
            dias_ferias: ferias,
            dias_licenca: licencas,
            dias_folga: abonos,
            percentual_presenca: Math.round(percentualPresenca * 10) / 10,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "servidor_id,ano,mes" }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["frequencia-mensal", variables.servidor_id, variables.ano, variables.mes],
      });
      queryClient.invalidateQueries({ queryKey: ["frequencia-resumo", variables.ano, variables.mes] });
      toast.success("Frequência recalculada!");
    },
    onError: (error) => {
      console.error("Erro ao recalcular frequência:", error);
      toast.error("Erro ao recalcular frequência.");
    },
  });
}

// Helper: calcular dias úteis de um mês
function calcularDiasUteis(ano: number, mes: number): number {
  let diasUteis = 0;
  const ultimoDia = new Date(ano, mes, 0).getDate();

  for (let dia = 1; dia <= ultimoDia; dia++) {
    const data = new Date(ano, mes - 1, dia);
    const diaSemana = data.getDay();
    // 0 = Domingo, 6 = Sábado
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasUteis++;
    }
  }

  return diasUteis;
}

// Exportar helper
export { calcularDiasUteis };
