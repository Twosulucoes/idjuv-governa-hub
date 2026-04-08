import { supabase } from "@/integrations/supabase/client";

/**
 * Gera uma matrícula automática no formato 0001, 0002, etc.
 */
export async function gerarMatricula(): Promise<string> {
  // Buscar a maior matrícula existente
  const { data, error } = await supabase
    .from("servidores")
    .select("matricula")
    .not("matricula", "is", null)
    .order("matricula", { ascending: false })
    .limit(1);
  
  if (error) {
    console.error("Erro ao buscar matrícula:", error);
    throw error;
  }
  
  let sequencial = 1;
  
  if (data && data.length > 0 && data[0].matricula) {
    // Extrair número da matrícula (pode ser formato antigo ou novo)
    const numeros = data[0].matricula.replace(/\D/g, '');
    if (numeros) {
      sequencial = parseInt(numeros, 10) + 1;
    }
  }
  
  return sequencial.toString().padStart(4, "0");
}

/**
 * Encerra o vínculo ativo anterior de um servidor e registra no histórico
 */
export async function encerrarLotacaoAnterior(
  servidorId: string,
  novaDataInicio: string,
  novoCargoId: string | null,
  novaUnidadeId: string
): Promise<{ hadPreviousLotacao: boolean; previousLotacao?: any }> {
  // Buscar vínculo ativo do servidor (fonte: vinculos_servidor)
  const { data: vinculoAtivo, error: fetchError } = await supabase
    .from("vinculos_servidor")
    .select("*")
    .eq("servidor_id", servidorId)
    .eq("ativo", true)
    .maybeSingle();
  
  if (fetchError) {
    console.error("Erro ao buscar vínculo ativo:", fetchError);
    throw fetchError;
  }
  
  if (!vinculoAtivo) {
    return { hadPreviousLotacao: false };
  }
  
  // Calcular data de fim (dia anterior à nova data)
  const dataFim = new Date(novaDataInicio);
  dataFim.setDate(dataFim.getDate() - 1);
  const dataFimStr = dataFim.toISOString().split("T")[0];
  
  // Encerrar o vínculo anterior
  const { error: updateError } = await supabase
    .from("vinculos_servidor")
    .update({
      ativo: false,
      data_fim: dataFimStr,
    })
    .eq("id", vinculoAtivo.id);
  
  if (updateError) {
    console.error("Erro ao encerrar vínculo anterior:", updateError);
    throw updateError;
  }
  
  // Registrar no histórico funcional
  const { error: historicoError } = await supabase
    .from("historico_funcional")
    .insert({
      servidor_id: servidorId,
      tipo: "transferencia",
      data_evento: novaDataInicio,
      data_vigencia_inicio: novaDataInicio,
      cargo_anterior_id: vinculoAtivo.cargo_id,
      cargo_novo_id: novoCargoId,
      unidade_anterior_id: vinculoAtivo.unidade_id,
      unidade_nova_id: novaUnidadeId,
      descricao: "Movimentação: encerramento automático de vínculo anterior",
    });
  
  if (historicoError) {
    console.error("Erro ao registrar histórico:", historicoError);
  }
  
  return { hadPreviousLotacao: true, previousLotacao: vinculoAtivo };
}

/**
 * Atualiza o cargo e unidade atual do servidor na tabela servidores
 */
export async function atualizarCargoAtualServidor(
  servidorId: string,
  cargoId: string | null,
  unidadeId: string
): Promise<void> {
  const { error } = await supabase
    .from("servidores")
    .update({
      cargo_atual_id: cargoId,
      unidade_atual_id: unidadeId,
    })
    .eq("id", servidorId);
  
  if (error) {
    console.error("Erro ao atualizar cargo atual:", error);
    throw error;
  }
}

/**
 * Buscar lotação ativa de um servidor
 */
export async function buscarLotacaoAtiva(servidorId: string) {
  const { data, error } = await supabase
    .from("vinculos_servidor")
    .select("*")
    .eq("servidor_id", servidorId)
    .eq("ativo", true)
    .order("data_inicio", { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (error) {
    console.error("Erro ao buscar vínculo ativo:", error);
    throw error;
  }
  
  if (!data) return null;

  // Buscar cargo e unidade
  const [cargoRes, unidadeRes] = await Promise.all([
    data.cargo_id ? supabase.from("cargos").select("id, nome, sigla").eq("id", data.cargo_id).maybeSingle() : Promise.resolve({ data: null }),
    data.unidade_id ? supabase.from("estrutura_organizacional").select("id, nome, sigla").eq("id", data.unidade_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);

  return {
    ...data,
    cargo: cargoRes.data,
    unidade: unidadeRes.data,
  };
}
