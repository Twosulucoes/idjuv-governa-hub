import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { admitirServidor, desligarServidor, transferirServidor, type DesligarServidorParams, type TransferirServidorParams } from "@/lib/rhRpc";
import type { TipoLotacao } from "@/types/servidor";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Tipos para o sistema de gestão
export interface ServidorGestao {
  id: string;
  nome_completo: string;
  matricula?: string;
  tipo_servidor?: string;
  situacao: string;
  foto_url?: string;
  
  // Lotação ativa
  lotacao_id?: string;
  unidade_id?: string;
  unidade_nome?: string;
  unidade_sigla?: string;
  cargo_id?: string;
  cargo_nome?: string;
  cargo_sigla?: string;
  lotacao_inicio?: string;
  
  // Status calculado
  status_lotacao: 'lotado' | 'vagando' | 'exonerado';
}

export interface CargoVaga {
  id: string;
  nome: string;
  sigla?: string;
  natureza: string;
  quantidade_vagas: number;
  vagas_ocupadas: number;
  vagas_disponiveis: number;
}

export interface EstatisticasLotacao {
  total_servidores: number;
  servidores_lotados: number;
  servidores_vagando: number;
  servidores_exonerados: number;
  total_cargos: number;
  cargos_vagos: number;
  cargos_ocupados: number;
}

// Hook para buscar servidores com status de lotação
export function useServidoresGestao(filtros?: {
  status?: 'lotado' | 'vagando' | 'exonerado' | 'todos';
  unidadeId?: string;
  cargoId?: string;
  busca?: string;
}) {
  return useQuery({
    queryKey: ["servidores-gestao", filtros],
    queryFn: async () => {
      // Buscar servidores com lotação ativa (LEFT JOIN)
      const { data: servidores, error } = await supabase
        .from("servidores")
        .select(`
          id,
          nome_completo,
          matricula,
          tipo_servidor,
          situacao,
          foto_url
        `)
        .order("nome_completo");

      if (error) throw error;

      // Buscar lotações ativas separadamente
      const { data: lotacoes, error: lotError } = await supabase
        .from("lotacoes")
        .select(`
          id,
          servidor_id,
          unidade_id,
          cargo_id,
          data_inicio,
          unidade:estrutura_organizacional(id, nome, sigla),
          cargo:cargos(id, nome, sigla)
        `)
        .eq("ativo", true);

      if (lotError) throw lotError;

      // Mapear lotações por servidor
      const lotacaoPorServidor = new Map();
      lotacoes?.forEach((l: any) => {
        lotacaoPorServidor.set(l.servidor_id, l);
      });

      // Combinar dados
      let resultado: ServidorGestao[] = servidores.map((s) => {
        const lotacao = lotacaoPorServidor.get(s.id);
        
        // Determinar status
        let status_lotacao: 'lotado' | 'vagando' | 'exonerado' = 'vagando';
        if (s.situacao === 'exonerado' || s.situacao === 'inativo') {
          status_lotacao = 'exonerado';
        } else if (lotacao) {
          status_lotacao = 'lotado';
        }

        return {
          id: s.id,
          nome_completo: s.nome_completo,
          matricula: s.matricula,
          tipo_servidor: s.tipo_servidor,
          situacao: s.situacao,
          foto_url: s.foto_url,
          lotacao_id: lotacao?.id,
          unidade_id: lotacao?.unidade?.id,
          unidade_nome: lotacao?.unidade?.nome,
          unidade_sigla: lotacao?.unidade?.sigla,
          cargo_id: lotacao?.cargo?.id,
          cargo_nome: lotacao?.cargo?.nome,
          cargo_sigla: lotacao?.cargo?.sigla,
          lotacao_inicio: lotacao?.data_inicio,
          status_lotacao,
        };
      });

      // Aplicar filtros
      if (filtros?.status && filtros.status !== 'todos') {
        resultado = resultado.filter(s => s.status_lotacao === filtros.status);
      }
      if (filtros?.unidadeId) {
        resultado = resultado.filter(s => s.unidade_id === filtros.unidadeId);
      }
      if (filtros?.cargoId) {
        resultado = resultado.filter(s => s.cargo_id === filtros.cargoId);
      }
      if (filtros?.busca) {
        const termo = filtros.busca.toLowerCase();
        resultado = resultado.filter(s => 
          s.nome_completo.toLowerCase().includes(termo) ||
          s.matricula?.toLowerCase().includes(termo)
        );
      }

      return resultado;
    },
  });
}

// Hook para estatísticas
export function useEstatisticasLotacao() {
  return useQuery({
    queryKey: ["estatisticas-lotacao"],
    queryFn: async () => {
      // Contar servidores
      const { data: servidores, error: sErr } = await supabase
        .from("servidores")
        .select("id, situacao");
      if (sErr) throw sErr;

      // Contar lotações ativas
      const { data: lotacoes, error: lErr } = await supabase
        .from("lotacoes")
        .select("servidor_id")
        .eq("ativo", true);
      if (lErr) throw lErr;

      // Contar cargos e vagas
      const { data: cargos, error: cErr } = await supabase
        .from("cargos")
        .select("id, quantidade_vagas")
        .eq("ativo", true);
      if (cErr) throw cErr;

      // Contar ocupações por cargo
      const { data: ocupacoes, error: oErr } = await supabase
        .from("lotacoes")
        .select("cargo_id")
        .eq("ativo", true)
        .not("cargo_id", "is", null);
      if (oErr) throw oErr;

      const servidoresAtivos = servidores?.filter(s => s.situacao === 'ativo') || [];
      const servidorIdsLotados = new Set(lotacoes?.map(l => l.servidor_id) || []);
      
      const lotados = servidoresAtivos.filter(s => servidorIdsLotados.has(s.id)).length;
      const vagando = servidoresAtivos.filter(s => !servidorIdsLotados.has(s.id)).length;
      const exonerados = servidores?.filter(s => s.situacao === 'exonerado' || s.situacao === 'inativo').length || 0;

      const totalVagas = cargos?.reduce((acc, c) => acc + (c.quantidade_vagas || 0), 0) || 0;
      const ocupadas = ocupacoes?.length || 0;

      return {
        total_servidores: servidoresAtivos.length,
        servidores_lotados: lotados,
        servidores_vagando: vagando,
        servidores_exonerados: exonerados,
        total_cargos: cargos?.length || 0,
        cargos_ocupados: ocupadas,
        cargos_vagos: totalVagas - ocupadas,
      } as EstatisticasLotacao;
    },
  });
}

// Hook para buscar cargos com vagas disponíveis
export function useCargosVagos() {
  return useQuery({
    queryKey: ["cargos-vagos"],
    queryFn: async () => {
      // Buscar cargos
      const { data: cargos, error: cErr } = await supabase
        .from("cargos")
        .select("id, nome, sigla, natureza, quantidade_vagas")
        .eq("ativo", true)
        .order("nome");
      if (cErr) throw cErr;

      // Contar ocupações por cargo
      const { data: ocupacoes, error: oErr } = await supabase
        .from("lotacoes")
        .select("cargo_id")
        .eq("ativo", true)
        .not("cargo_id", "is", null);
      if (oErr) throw oErr;

      // Contar por cargo
      const ocupacaoPorCargo = new Map<string, number>();
      ocupacoes?.forEach((o: any) => {
        ocupacaoPorCargo.set(o.cargo_id, (ocupacaoPorCargo.get(o.cargo_id) || 0) + 1);
      });

      // Calcular vagas disponíveis
      const resultado: CargoVaga[] = cargos?.map((c: any) => {
        const ocupadas = ocupacaoPorCargo.get(c.id) || 0;
        return {
          id: c.id,
          nome: c.nome,
          sigla: c.sigla,
          natureza: c.natureza,
          quantidade_vagas: c.quantidade_vagas || 0,
          vagas_ocupadas: ocupadas,
          vagas_disponiveis: Math.max(0, (c.quantidade_vagas || 0) - ocupadas),
        };
      }) || [];

      // Ordenar: primeiro os com vagas
      return resultado.sort((a, b) => b.vagas_disponiveis - a.vagas_disponiveis);
    },
  });
}

// Hook para buscar unidades
export function useUnidadesGestao() {
  return useQuery({
    queryKey: ["unidades-gestao"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estrutura_organizacional")
        .select("id, nome, sigla, tipo")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });
}

// Hook para buscar unidades compatíveis com um cargo específico
// Usa a tabela composicao_cargos (do formulário de cargos) como referência principal
export function useUnidadesCompativeisCargo(cargoId: string | null) {
  return useQuery({
    queryKey: ["unidades-compativeis", cargoId],
    queryFn: async () => {
      if (!cargoId) return [];

      // 1. Buscar composição do cargo (definida no formulário de cargos)
      const { data: composicao, error: compErr } = await supabase
        .from("composicao_cargos")
        .select("unidade_id, quantidade_vagas")
        .eq("cargo_id", cargoId);

      if (compErr) throw compErr;

      // 2. Se há composição definida, retornar apenas essas unidades
      if (composicao && composicao.length > 0) {
        const unidadeIds = composicao.map((c: any) => c.unidade_id);
        
        const { data: unidades, error: unidErr } = await supabase
          .from("estrutura_organizacional")
          .select("id, nome, sigla, tipo")
          .eq("ativo", true)
          .in("id", unidadeIds)
          .order("nome");

        if (unidErr) throw unidErr;
        
        // Adicionar info de vagas por unidade
        return unidades?.map((u: any) => {
          const comp = composicao.find((c: any) => c.unidade_id === u.id);
          return {
            ...u,
            vagas_na_unidade: comp?.quantidade_vagas || 0,
          };
        }) || [];
      }

      // 3. Se não há composição, retornar todas as unidades (sem restrição)
      const { data, error } = await supabase
        .from("estrutura_organizacional")
        .select("id, nome, sigla, tipo")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      return data;
    },
    enabled: !!cargoId,
  });
}

// Hook para buscar portarias cadastradas para vincular ao ato
export function usePortariasParaAto() {
  return useQuery({
    queryKey: ["portarias-para-ato"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos")
        .select("id, numero, titulo, categoria, data_documento, status")
        .eq("tipo", "portaria")
        .order("data_documento", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });
}

// Mutation: Lotar servidor
// Vínculo + lotação + provimento + histórico + minuta de nomeação numa transação (rh_admitir_servidor).
// Antes eram cinco escritas soltas, as três últimas com `catch` mudo. Vaga do cargo e provimento duplicado
// são conferidos pelo banco (fn_validar_provimento).
export function useLotarServidor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      servidorId,
      unidadeId,
      cargoId,
      dataInicio,
      funcaoExercida,
      atoNumero,
      atoData,
      atoTipo,
      observacao,
    }: {
      servidorId: string;
      unidadeId: string;
      cargoId: string;
      dataInicio: string;
      tipoLotacao?: TipoLotacao;
      funcaoExercida?: string;
      atoNumero?: string;
      atoData?: string;
      atoTipo?: string;
      observacao?: string;
    }) => {
      const { data: cargo, error: cargoErr } = await supabase
        .from("cargos")
        .select("categoria")
        .eq("id", cargoId)
        .single();
      if (cargoErr) throw cargoErr;

      return admitirServidor({
        servidorId,
        tipo: cargo.categoria === "efetivo" ? "efetivo" : "comissionado",
        cargoId,
        unidadeId,
        dataInicio,
        atoTipo,
        atoNumero,
        atoData,
        funcaoExercida,
        observacao,
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["servidores-gestao"] });
      queryClient.invalidateQueries({ queryKey: ["estatisticas-lotacao"] });
      queryClient.invalidateQueries({ queryKey: ["cargos-vagos"] });
      queryClient.invalidateQueries({ queryKey: ["provimentos", variables.servidorId] });
      queryClient.invalidateQueries({ queryKey: ["historico-funcional", variables.servidorId] });
      queryClient.invalidateQueries({ queryKey: ["vinculos-servidor", variables.servidorId] });
      queryClient.invalidateQueries({ queryKey: ["portarias"] });
      queryClient.invalidateQueries({ queryKey: ["servidores-rh"] });
      toast.success(`Servidor lotado! Vínculo, provimento, histórico e minuta de portaria registrados. Protocolo ${data.protocolo}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao lotar servidor");
    },
  });
}

// Mutation: transferir/remover servidor de unidade, sem exonerar (rh_transferir_servidor)
export function useTransferirServidor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: TransferirServidorParams) => transferirServidor(params),
    onSuccess: (resultado, variaveis) => {
      queryClient.invalidateQueries({ queryKey: ["servidores-gestao"] });
      queryClient.invalidateQueries({ queryKey: ["estatisticas-lotacao"] });
      queryClient.invalidateQueries({ queryKey: ["servidores-rh"] });
      queryClient.invalidateQueries({ queryKey: ["historico-funcional", variaveis.servidorId] });
      queryClient.invalidateQueries({ queryKey: ["historico-lotacoes", variaveis.servidorId] });
      queryClient.invalidateQueries({ queryKey: ["vinculos-servidor", variaveis.servidorId] });
      queryClient.invalidateQueries({ queryKey: ["portarias"] });
      toast.success(`Servidor transferido! Protocolo ${resultado.protocolo}`, {
        description: resultado.avisos.join(" · ") || undefined,
        duration: 10000,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao transferir servidor");
    },
  });
}

// Mutation: desligar servidor (exoneração, aposentadoria, falecimento…)
// Uma transação no banco (rh_desligar_servidor): lotação, vínculos, provimento, cessões, designações, férias,
// licenças, viagens, chefia de unidade e comissões; histórico funcional; minuta de portaria; situação e
// data de desligamento. O ato e o DOE informados são gravados (antes eram descartados).
export function useExonerarServidor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: DesligarServidorParams) => desligarServidor(params),
    onSuccess: (resultado, variaveis) => {
      queryClient.invalidateQueries({ queryKey: ["servidores-gestao"] });
      queryClient.invalidateQueries({ queryKey: ["estatisticas-lotacao"] });
      queryClient.invalidateQueries({ queryKey: ["cargos-vagos"] });
      queryClient.invalidateQueries({ queryKey: ["servidores-rh"] });
      queryClient.invalidateQueries({ queryKey: ["historico-funcional", variaveis.servidorId] });
      queryClient.invalidateQueries({ queryKey: ["vinculos-servidor", variaveis.servidorId] });
      queryClient.invalidateQueries({ queryKey: ["portarias"] });
      toast.success(`Servidor desligado! Protocolo ${resultado.protocolo}`, {
        description: resultado.avisos.join(" · "),
        duration: 12000,
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao desligar servidor");
    },
  });
}

// Hook para histórico de lotações de um servidor
export function useHistoricoLotacoes(servidorId: string | null) {
  return useQuery({
    queryKey: ["historico-lotacoes", servidorId],
    queryFn: async () => {
      if (!servidorId) return [];

      const { data, error } = await supabase
        .from("lotacoes")
        .select(`
          id,
          data_inicio,
          data_fim,
          ativo,
          tipo_movimentacao,
          observacao,
          unidade:estrutura_organizacional(id, nome, sigla),
          cargo:cargos(id, nome, sigla)
        `)
        .eq("servidor_id", servidorId)
        .order("data_inicio", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!servidorId,
  });
}
