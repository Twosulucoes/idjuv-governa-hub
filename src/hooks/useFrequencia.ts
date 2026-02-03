/**
 * ============================================
 * HOOK DE FREQUÊNCIA - VERSÃO PARAMETRIZADA
 * ============================================
 * 
 * Gerencia registros de ponto e frequência mensal.
 * Agora consome configurações do banco de dados via
 * frequenciaCalculoService.
 * 
 * COMPATIBILIDADE:
 * - Mantém todas as interfaces públicas existentes
 * - Cálculos agora usam configurações parametrizadas
 * - Fallback automático para valores legados
 * 
 * @author Sistema IDJUV
 * @version 2.0.0 - Refatorado para parametrização
 * @date 02/02/2026
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  calcularResumoMensalParametrizado,
  calcularDiasUteisParametrizado,
} from "@/lib/frequenciaCalculoService";

// ============================================
// INTERFACES (mantidas para compatibilidade)
// ============================================

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

// ============================================
// HOOKS DE CONSULTA
// ============================================

/**
 * Busca resumo de frequência de todos os servidores para uma competência.
 * REFATORADO: Agora usa calcularDiasUteisParametrizado com dias não úteis do banco.
 */
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

      // PARAMETRIZADO: Buscar dias não úteis do banco
      const dataInicio = `${ano}-${String(mes).padStart(2, "0")}-01`;
      const ultimoDia = new Date(ano, mes, 0).getDate();
      const dataFim = `${ano}-${String(mes).padStart(2, "0")}-${ultimoDia}`;

      const { data: diasNaoUteis } = await supabase
        .from("dias_nao_uteis")
        .select("*")
        .gte("data", dataInicio)
        .lte("data", dataFim)
        .eq("ativo", true);

      // PARAMETRIZADO: Calcular dias úteis usando função parametrizada
      // Cast para DiaNaoUtil[] - necessário pois o banco retorna strings para enums
      const diasNaoUteisTipados = (diasNaoUteis || []) as unknown as import("@/types/frequencia").DiaNaoUtil[];

      const diasUteisMes = calcularDiasUteisParametrizado(
        ano, 
        mes, 
        diasNaoUteisTipados,
        [1, 2, 3, 4, 5] // Dias de trabalho padrão (seg-sex)
      );

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

/**
 * Busca registros de ponto de um servidor para uma competência.
 */
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

/**
 * Busca frequência mensal de um servidor.
 */
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

// ============================================
// MUTATIONS
// ============================================

/**
 * Lança registro de ponto (falta, atestado, etc.).
 */
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

/**
 * Lança falta em lote.
 */
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

/**
 * Recalcula frequência mensal de um servidor.
 * REFATORADO: Agora usa calcularResumoMensalParametrizado com configurações do banco.
 */
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

      // PARAMETRIZADO: Usar serviço de cálculo parametrizado
      const resultado = await calcularResumoMensalParametrizado(
        servidor_id,
        ano,
        mes,
        (registros || []).map(r => ({
          data: r.data,
          tipo: r.tipo,
          entrada1: r.entrada1 || undefined,
          saida1: r.saida1 || undefined,
          entrada2: r.entrada2 || undefined,
          saida2: r.saida2 || undefined,
          observacao: r.observacao || undefined,
        }))
      );

      // Log técnico se usou fallback
      if (resultado.config.usouFallback) {
        console.warn(
          '[FREQUENCIA] Cálculo usou fallback para:',
          resultado.config.fallbackDetalhes.join(', ')
        );
      }

      // Upsert na tabela frequencia_mensal
      const { data, error } = await supabase
        .from("frequencia_mensal")
        .upsert(
          {
            servidor_id,
            ano,
            mes,
            dias_trabalhados: resultado.diasTrabalhados,
            dias_falta: resultado.faltas,
            dias_atestado: resultado.abonos['ATESTADO'] || resultado.abonos['atestado'] || 0,
            dias_ferias: resultado.abonos['FERIAS'] || resultado.abonos['ferias'] || 0,
            dias_licenca: resultado.abonos['LICENCA_MEDICA'] || resultado.abonos['licenca'] || 0,
            dias_folga: resultado.abonos['DISPENSA_HORARIO'] || resultado.abonos['folga'] || 0,
            percentual_presenca: resultado.percentualPresenca,
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

// ============================================
// HELPERS LEGADOS (mantidos para compatibilidade)
// ============================================

/**
 * Calcula dias úteis de um mês (versão legada sem feriados).
 * 
 * @deprecated Use calcularDiasUteisParametrizado para incluir feriados
 */
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

// Exportar helper legado para compatibilidade
export { calcularDiasUteis };

// Exportar nova função parametrizada
export { calcularDiasUteisParametrizado };
