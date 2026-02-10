import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
export function useLotarServidor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      servidorId,
      unidadeId,
      cargoId,
      dataInicio,
      tipoLotacao = 'lotacao_interna',
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
      // 1. Verificar se servidor já está lotado
      const { data: lotacaoExistente, error: checkErr } = await supabase
        .from("lotacoes")
        .select("id")
        .eq("servidor_id", servidorId)
        .eq("ativo", true)
        .maybeSingle();

      if (checkErr) throw checkErr;
      if (lotacaoExistente) {
        throw new Error("Servidor já possui lotação ativa. Exonere primeiro.");
      }

      // 2. Verificar se cargo ainda tem vagas
      const { data: cargo, error: cargoErr } = await supabase
        .from("cargos")
        .select("id, quantidade_vagas")
        .eq("id", cargoId)
        .single();

      if (cargoErr) throw cargoErr;

      const { data: ocupacoes, error: ocupErr } = await supabase
        .from("lotacoes")
        .select("id")
        .eq("cargo_id", cargoId)
        .eq("ativo", true);

      if (ocupErr) throw ocupErr;

      const vagasDisponiveis = (cargo.quantidade_vagas || 0) - (ocupacoes?.length || 0);
      if (vagasDisponiveis <= 0) {
        throw new Error("Este cargo não possui mais vagas disponíveis. Selecione outro cargo.");
      }

      // 3. Criar lotação
      const { data, error } = await supabase
        .from("lotacoes")
        .insert({
          servidor_id: servidorId,
          unidade_id: unidadeId,
          cargo_id: cargoId,
          data_inicio: dataInicio,
          tipo_lotacao: tipoLotacao,
          funcao_exercida: funcaoExercida,
          ato_numero: atoNumero,
          ato_data: atoData,
          ato_tipo: atoTipo,
          observacao: observacao,
          tipo_movimentacao: 'lotacao_inicial',
          ativo: true,
        })
        .select()
        .single();

      if (error) throw error;

      // 4. Criar provimento automático
      try {
        await supabase.from("provimentos").insert({
          servidor_id: servidorId,
          cargo_id: cargoId,
          unidade_id: unidadeId,
          status: 'ativo',
          data_nomeacao: dataInicio,
          data_posse: dataInicio,
          data_exercicio: dataInicio,
          ato_nomeacao_numero: atoNumero || null,
          ato_nomeacao_data: atoData || null,
          ato_nomeacao_tipo: atoTipo || null,
        });
      } catch (provErr) {
        console.error("[Lotação] Erro ao criar provimento:", provErr);
      }

      // 5. Registrar no histórico funcional
      try {
        const { data: userData } = await supabase.auth.getUser();
        
        // Buscar nomes do cargo e unidade para descrição
        const [cargoRes, unidadeRes, servidorRes] = await Promise.all([
          supabase.from("cargos").select("nome, sigla").eq("id", cargoId).maybeSingle(),
          supabase.from("estrutura_organizacional").select("nome, sigla").eq("id", unidadeId).maybeSingle(),
          supabase.from("servidores").select("nome_completo").eq("id", servidorId).maybeSingle(),
        ]);

        const cargoNome = cargoRes.data?.sigla 
          ? `${cargoRes.data.sigla} - ${cargoRes.data.nome}` 
          : cargoRes.data?.nome || 'N/A';
        const unidadeSigla = unidadeRes.data?.sigla || unidadeRes.data?.nome || '';

        await supabase.from("historico_funcional").insert({
          servidor_id: servidorId,
          tipo: "nomeacao",
          data_evento: dataInicio,
          data_vigencia_inicio: dataInicio,
          cargo_novo_id: cargoId,
          unidade_nova_id: unidadeId,
          portaria_numero: atoNumero || null,
          portaria_data: atoData || null,
          descricao: `Lotação e nomeação para cargo ${cargoNome}${unidadeSigla ? ` na ${unidadeSigla}` : ''}`,
          created_by: userData?.user?.id,
        });

        // 6. Gerar minuta de portaria
        const nomeServidor = servidorRes.data?.nome_completo || 'Servidor';
        const dataDoc = dataInicio;
        const ano = new Date(dataDoc).getFullYear();

        let numero = `PENDENTE/${ano}`;
        try {
          const { data: numData } = await supabase.rpc("gerar_numero_portaria", { p_ano: ano });
          if (numData) numero = numData as string;
        } catch { /* keep default */ }

        await supabase.from("documentos").insert({
          tipo: "portaria",
          categoria: "nomeacao",
          status: "minuta",
          titulo: `Portaria de Nomeação - ${nomeServidor}`,
          ementa: `Nomeia ${nomeServidor} para o cargo de ${cargoNome}${unidadeSigla ? ` na ${unidadeSigla}` : ''}.`,
          numero,
          data_documento: dataDoc,
          servidores_ids: [servidorId],
          cargo_id: cargoId,
          unidade_id: unidadeId,
          created_by: userData?.user?.id,
        });
      } catch (histErr) {
        console.error("[Lotação] Erro ao registrar histórico/portaria:", histErr);
      }

      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["servidores-gestao"] });
      queryClient.invalidateQueries({ queryKey: ["estatisticas-lotacao"] });
      queryClient.invalidateQueries({ queryKey: ["cargos-vagos"] });
      queryClient.invalidateQueries({ queryKey: ["provimentos", variables.servidorId] });
      queryClient.invalidateQueries({ queryKey: ["historico-funcional", variables.servidorId] });
      queryClient.invalidateQueries({ queryKey: ["portarias"] });
      queryClient.invalidateQueries({ queryKey: ["servidores-rh"] });
      toast.success("Servidor lotado com sucesso! Provimento e histórico registrados.");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao lotar servidor");
    },
  });
}

// Mutation: Exonerar servidor (encerrar lotação)
export function useExonerarServidor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      lotacaoId,
      dataExoneracao,
      atoNumero,
      atoData,
      atoTipo,
      observacao,
    }: {
      lotacaoId: string;
      dataExoneracao: string;
      atoNumero?: string;
      atoData?: string;
      atoTipo?: string;
      observacao?: string;
    }) => {
      // Encerrar lotação
      const { data, error } = await supabase
        .from("lotacoes")
        .update({
          ativo: false,
          data_fim: dataExoneracao,
          observacao: observacao 
            ? `Exoneração: ${observacao}` 
            : `Exonerado em ${dataExoneracao}`,
        })
        .eq("id", lotacaoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servidores-gestao"] });
      queryClient.invalidateQueries({ queryKey: ["estatisticas-lotacao"] });
      queryClient.invalidateQueries({ queryKey: ["cargos-vagos"] });
      toast.success("Servidor exonerado! Lotação encerrada e cargo liberado.");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao exonerar servidor");
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
