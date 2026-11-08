import { supabase } from "@/integrations/supabase/client";
import { hojeISO } from "@/lib/datas/hojeLocal";

// A matrícula é numerada pelo banco (trigger `gerar_matricula_servidor`, numérico e com trava): o cliente não gera mais.

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
 * Lotação vigente hoje (tabela `lotacoes`, a mesma da Gestão de Lotação e da FK `designacoes.lotacao_id`), com
 * cargo e unidade. Antes lia `vinculos_servidor` e mandava o id do vínculo como `lotacao_id`: o banco recusava
 * toda designação (23503, teste do RH de 06/11/2026, item 9). Lotação externa e agendada para o futuro ficam fora.
 */
export async function buscarLotacaoAtiva(servidorId: string, hoje: string = hojeISO()) {
  const { data, error } = await supabase
    .from("lotacoes")
    .select("id, servidor_id, unidade_id, cargo_id, data_inicio, data_fim, tipo_lotacao, unidade:estrutura_organizacional!lotacoes_unidade_id_fkey(id, nome, sigla), cargo:cargos(id, nome, sigla)")
    .eq("servidor_id", servidorId)
    .eq("ativo", true)
    .lte("data_inicio", hoje)
    .or(`data_fim.is.null,data_fim.gte.${hoje}`)
    .neq("tipo_lotacao", "lotacao_externa")
    .order("data_inicio", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar lotação vigente:", error);
    throw error;
  }
  return data;
}
