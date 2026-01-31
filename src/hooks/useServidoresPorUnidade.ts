/**
 * Hook para buscar servidores agrupados por unidade administrativa
 * Com integração de situações administrativas (licenças, cessões, etc.)
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SituacaoAdministrativa {
  tipo: 'licenca' | 'cessao' | 'ferias' | 'afastamento';
  subtipo?: string;
  data_inicio: string;
  data_fim?: string;
  descricao: string;
  fundamentacao?: string;
  dispensa_frequencia: boolean;
}

export interface ServidorComSituacao {
  id: string;
  nome_completo: string;
  matricula?: string;
  cpf?: string;
  cargo_id?: string;
  cargo_nome?: string;
  unidade_id?: string;
  unidade_nome?: string;
  unidade_sigla?: string;
  regime?: string;
  carga_horaria_diaria?: number;
  carga_horaria_semanal?: number;
  situacoes_mes: SituacaoAdministrativa[];
  // Calculados
  dias_dispensados: number;
  dispensa_total: boolean;
  observacao_automatica?: string;
}

export interface UnidadeComServidores {
  id: string;
  nome: string;
  sigla?: string;
  servidores: ServidorComSituacao[];
  total_servidores: number;
  servidores_dispensados: number;
  servidores_parciais: number;
  servidores_normais: number;
}

// Buscar unidades administrativas
export function useUnidadesAdministrativas() {
  return useQuery({
    queryKey: ["unidades-administrativas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estrutura_organizacional")
        .select("id, nome, sigla, tipo, nivel")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      return data || [];
    },
  });
}

// Buscar servidores de uma unidade com situações administrativas
export function useServidoresUnidadeFrequencia(
  unidadeId: string | undefined,
  ano: number,
  mes: number
) {
  return useQuery({
    queryKey: ["servidores-unidade-frequencia", unidadeId, ano, mes],
    queryFn: async () => {
      if (!unidadeId) return null;

      // Calcular período do mês
      const primeiroDia = `${ano}-${String(mes).padStart(2, "0")}-01`;
      const ultimoDiaMes = new Date(ano, mes, 0).getDate();
      const ultimoDia = `${ano}-${String(mes).padStart(2, "0")}-${ultimoDiaMes}`;

      // Buscar servidores da unidade
      const { data: servidores, error: errServ } = await supabase
        .from("servidores")
        .select(`
          id,
          nome_completo,
          matricula,
          cpf,
          cargo_atual_id,
          unidade_atual_id,
          cargos:cargo_atual_id(nome),
          unidades:unidade_atual_id(id, nome, sigla)
        `)
        .eq("unidade_atual_id", unidadeId)
        .eq("ativo", true)
        .eq("situacao", "ativo")
        .order("nome_completo");

      if (errServ) throw errServ;

      // Buscar licenças/afastamentos do período
      const { data: licencas, error: errLic } = await supabase
        .from("licencas_afastamentos")
        .select("*")
        .in("servidor_id", servidores?.map(s => s.id) || [])
        .lte("data_inicio", ultimoDia)
        .or(`data_fim.gte.${primeiroDia},data_fim.is.null`)
        .eq("status", "aprovado");

      if (errLic && errLic.code !== 'PGRST116') {
        console.warn("Erro ao buscar licenças:", errLic);
      }

      // Buscar cessões do período (cedidos PARA outros órgãos)
      const { data: cessoes, error: errCes } = await supabase
        .from("cessoes")
        .select("*")
        .in("servidor_id", servidores?.map(s => s.id) || [])
        .eq("tipo", "cedido")
        .eq("ativa", true)
        .lte("data_inicio", ultimoDia)
        .or(`data_fim.gte.${primeiroDia},data_fim.is.null`);

      if (errCes && errCes.code !== 'PGRST116') {
        console.warn("Erro ao buscar cessões:", errCes);
      }

      // Montar resultado com situações
      const servidoresComSituacao: ServidorComSituacao[] = (servidores || []).map(s => {
        const cargo = s.cargos as { nome: string } | null;
        const unidade = s.unidades as { id: string; nome: string; sigla: string } | null;
        
        const situacoes: SituacaoAdministrativa[] = [];

        // Adicionar licenças/afastamentos
        const licencasServidor = (licencas || []).filter(l => l.servidor_id === s.id);
        licencasServidor.forEach(lic => {
          const tipoLabel = lic.tipo_licenca || lic.tipo_afastamento || 'Afastamento';
          situacoes.push({
            tipo: lic.tipo_licenca ? 'licenca' : 'afastamento',
            subtipo: tipoLabel,
            data_inicio: lic.data_inicio,
            data_fim: lic.data_fim,
            descricao: formatarDescricaoLicenca(tipoLabel, lic.fundamentacao_legal),
            fundamentacao: lic.fundamentacao_legal,
            dispensa_frequencia: true,
          });
        });

        // Adicionar cessões
        const cessoesServidor = (cessoes || []).filter(c => c.servidor_id === s.id);
        cessoesServidor.forEach(ces => {
          situacoes.push({
            tipo: 'cessao',
            subtipo: 'Cedido para outro órgão',
            data_inicio: ces.data_inicio,
            data_fim: ces.data_fim,
            descricao: `Cessão para ${ces.orgao_destino || 'outro órgão'}`,
            fundamentacao: ces.fundamentacao_legal,
            dispensa_frequencia: true,
          });
        });

        // Calcular dias dispensados no mês
        const { diasDispensados, dispensaTotal, observacao } = calcularDispensaNoMes(
          situacoes,
          ano,
          mes,
          ultimoDiaMes
        );

        return {
          id: s.id,
          nome_completo: s.nome_completo,
          matricula: s.matricula,
          cpf: s.cpf,
          cargo_id: s.cargo_atual_id,
          cargo_nome: cargo?.nome,
          unidade_id: unidade?.id,
          unidade_nome: unidade?.nome,
          unidade_sigla: unidade?.sigla,
          regime: 'Presencial',
          carga_horaria_diaria: 8,
          carga_horaria_semanal: 40,
          situacoes_mes: situacoes,
          dias_dispensados: diasDispensados,
          dispensa_total: dispensaTotal,
          observacao_automatica: observacao,
        };
      });

      // Montar unidade com estatísticas
      const primeiroServidor = servidoresComSituacao[0];
      const resultado: UnidadeComServidores = {
        id: unidadeId,
        nome: primeiroServidor?.unidade_nome || '',
        sigla: primeiroServidor?.unidade_sigla,
        servidores: servidoresComSituacao,
        total_servidores: servidoresComSituacao.length,
        servidores_dispensados: servidoresComSituacao.filter(s => s.dispensa_total).length,
        servidores_parciais: servidoresComSituacao.filter(s => !s.dispensa_total && s.dias_dispensados > 0).length,
        servidores_normais: servidoresComSituacao.filter(s => s.dias_dispensados === 0).length,
      };

      return resultado;
    },
    enabled: !!unidadeId && ano > 0 && mes > 0,
  });
}

// Helpers

function formatarDescricaoLicenca(tipo: string, fundamentacao?: string | null): string {
  const tipoFormatado = tipo
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());
  
  if (fundamentacao) {
    return `${tipoFormatado}, conforme ${fundamentacao}`;
  }
  return tipoFormatado;
}

function calcularDispensaNoMes(
  situacoes: SituacaoAdministrativa[],
  ano: number,
  mes: number,
  ultimoDiaMes: number
): { diasDispensados: number; dispensaTotal: boolean; observacao?: string } {
  if (situacoes.length === 0) {
    return { diasDispensados: 0, dispensaTotal: false };
  }

  const primeiroDiaMes = new Date(ano, mes - 1, 1);
  const ultimoDia = new Date(ano, mes - 1, ultimoDiaMes);
  
  let diasDispensados = 0;
  const observacoes: string[] = [];

  situacoes.forEach(sit => {
    if (!sit.dispensa_frequencia) return;

    const inicio = new Date(sit.data_inicio);
    const fim = sit.data_fim ? new Date(sit.data_fim) : ultimoDia;

    // Calcular interseção com o mês
    const inicioEfetivo = inicio < primeiroDiaMes ? primeiroDiaMes : inicio;
    const fimEfetivo = fim > ultimoDia ? ultimoDia : fim;

    if (inicioEfetivo <= fimEfetivo) {
      // Contar dias úteis dispensados
      let diasNoIntervalo = 0;
      const dataAtual = new Date(inicioEfetivo);
      while (dataAtual <= fimEfetivo) {
        const diaSemana = dataAtual.getDay();
        if (diaSemana !== 0 && diaSemana !== 6) {
          diasNoIntervalo++;
        }
        dataAtual.setDate(dataAtual.getDate() + 1);
      }
      diasDispensados += diasNoIntervalo;

      // Montar observação
      const inicioStr = formatarData(inicioEfetivo);
      const fimStr = formatarData(fimEfetivo);
      const periodo = inicioStr === fimStr ? inicioStr : `${inicioStr} a ${fimStr}`;
      observacoes.push(`${sit.descricao}, no período de ${periodo}. Dispensa de controle de frequência no período.`);
    }
  });

  // Calcular dias úteis do mês
  let diasUteisMes = 0;
  for (let dia = 1; dia <= ultimoDiaMes; dia++) {
    const data = new Date(ano, mes - 1, dia);
    const diaSemana = data.getDay();
    if (diaSemana !== 0 && diaSemana !== 6) {
      diasUteisMes++;
    }
  }

  return {
    diasDispensados,
    dispensaTotal: diasDispensados >= diasUteisMes,
    observacao: observacoes.length > 0 ? observacoes.join('\n') : undefined,
  };
}

function formatarData(data: Date): string {
  return `${String(data.getDate()).padStart(2, '0')}/${String(data.getMonth() + 1).padStart(2, '0')}/${data.getFullYear()}`;
}
