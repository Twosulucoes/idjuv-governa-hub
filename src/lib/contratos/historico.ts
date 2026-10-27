/**
 * Texto de cada registro da trilha do contrato (audit_log_licitacoes, gravada por gatilho em contratos, itens_contrato
 * e contrato_responsaveis): o que aconteceu e, nas alterações, cada campo "antes → depois".
 */

import { formatCurrency, formatDateBR } from "@/lib/formatters";
import { rotuloPapel, rotuloSituacaoContrato, rotuloTipoContrato, type RegistroHistorico } from "@/types/contratos";

type Dados = Record<string, unknown> | null;

/** Colunas técnicas ou calculadas pelo banco: não aparecem na trilha. */
const OCULTOS = new Set([
  "id", "contrato_id", "created_at", "created_by", "updated_at", "updated_by",
  "saldo_contrato", "valor_total", "saldo_quantidade", "gestor_id", "fiscal_id", "nome", "servidor_id",
]);

const ROTULOS: Record<string, string> = {
  numero_contrato: "Nº do contrato",
  ano: "Ano",
  status: "Situação",
  processo_sei: "Processo SEI",
  numero_pncp: "Nº no PNCP",
  fornecedor_id: "Contratado",
  objeto: "Objeto",
  objeto_resumido: "Objeto (resumo)",
  tipo_contrato: "Tipo",
  fundamento_legal: "Modalidade e fundamento",
  processo_licitatorio_id: "Processo de contratação",
  unidade_demandante_id: "Setor que pediu",
  valor_inicial: "Valor inicial",
  valor_atual: "Valor atual",
  valor_executado: "Valor executado",
  data_assinatura: "Assinatura",
  data_inicio: "Início da vigência",
  data_fim: "Fim da vigência",
  data_fim_atual: "Fim atual",
  prorrogavel: "Pode ser prorrogado",
  prazo_maximo_meses: "Prazo máximo (meses)",
  natureza_despesa: "Natureza da despesa",
  dotacao_orcamentaria: "Dotação",
  fonte_recurso: "Fonte",
  data_publicacao_doe: "Publicação no DOE",
  numero_doe: "Nº do DOE",
  garantia_tipo: "Garantia",
  garantia_valor: "Valor da garantia",
  garantia_vencimento: "Vencimento da garantia",
  controla_passagens: "Controla passagens",
  observacoes: "Observações",
  // itens
  numero_item: "Nº do item",
  descricao: "Descrição",
  unidade_medida: "Unidade",
  quantidade: "Quantidade",
  quantidade_entregue: "Quantidade entregue",
  valor_unitario: "Valor unitário",
  situacao: "Situação do item",
  item_ata_id: "Item da ata",
  // responsáveis
  papel: "Papel",
  portaria_numero: "Portaria",
  portaria_documento_sei: "Documento SEI da portaria",
  portaria_data: "Data da portaria",
  motivo_saida: "Motivo da saída",
};

/** Na designação, as datas são do exercício do servidor, não da vigência do contrato. */
const ROTULOS_DESIGNACAO: Record<string, string> = { data_inicio: "Início", data_fim: "Último dia" };

/** Campos que guardam um id: a trilha só diz que mudou (o nome está na ficha). */
const IDS = new Set(["fornecedor_id", "processo_licitatorio_id", "unidade_demandante_id", "item_ata_id"]);
const MOEDA = new Set(["valor_inicial", "valor_atual", "valor_executado", "garantia_valor", "valor_unitario"]);

function formatar(campo: string, v: unknown): string {
  if (v === null || v === undefined || v === "") return "vazio";
  if (typeof v === "boolean") return v ? "sim" : "não";
  if (MOEDA.has(campo)) return formatCurrency(Number(v));
  if (campo === "status") return rotuloSituacaoContrato(String(v));
  if (campo === "tipo_contrato") return rotuloTipoContrato(String(v));
  if (campo === "papel") return rotuloPapel(String(v));
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return formatDateBR(v);
  const texto = String(v);
  return texto.length > 80 ? `${texto.slice(0, 77)}…` : texto;
}

/** "Valor atual: R$ 100,00 → R$ 120,00" para cada campo alterado que interessa. */
export function mudancas(
  h: Pick<RegistroHistorico, "campos_alterados" | "dados_anteriores" | "dados_novos">,
  rotulos: Record<string, string> = {},
): string[] {
  const antes = h.dados_anteriores as Dados;
  const depois = h.dados_novos as Dados;
  return (h.campos_alterados ?? [])
    .filter((c) => !OCULTOS.has(c))
    .map((c) => {
      const rotulo = rotulos[c] ?? ROTULOS[c] ?? c;
      if (IDS.has(c)) return `${rotulo}: alterado`;
      return `${rotulo}: ${formatar(c, antes?.[c])} → ${formatar(c, depois?.[c])}`;
    });
}

export interface DescricaoHistorico {
  titulo: string;
  detalhes: string[];
}

export function descreverHistorico(h: RegistroHistorico): DescricaoHistorico {
  const antes = h.dados_anteriores as Dados;
  const depois = h.dados_novos as Dados;
  const d = (depois ?? antes ?? {}) as Record<string, unknown>;

  if (h.tabela_origem === "itens_contrato") {
    const item = `Item ${d.numero_item ?? "?"}`;
    if (h.acao === "INSERT") return { titulo: `${item} incluído`, detalhes: [`${formatar("descricao", d.descricao)} · ${formatCurrency(Number(d.valor_total ?? 0))}`] };
    if (h.acao === "DELETE") return { titulo: `${item} apagado`, detalhes: [formatar("descricao", d.descricao)] };
    return { titulo: `${item} alterado`, detalhes: mudancas(h) };
  }

  if (h.tabela_origem === "contrato_responsaveis") {
    const quem = `${d.nome ?? "Servidor"} (${rotuloPapel(d.papel as string)})`;
    if (h.acao === "INSERT") {
      const portaria = d.portaria_numero ? ` · ${d.portaria_numero}` : "";
      return { titulo: `${quem} designado`, detalhes: [`desde ${formatDateBR(d.data_inicio as string)}${portaria}`] };
    }
    if (h.acao === "DELETE") return { titulo: `Designação de ${quem} apagada`, detalhes: [] };
    if (!antes?.data_fim && depois?.data_fim) {
      return { titulo: `Designação de ${quem} encerrada`, detalhes: [`último dia ${formatDateBR(depois.data_fim as string)} · ${depois.motivo_saida ?? ""}`] };
    }
    return { titulo: `Designação de ${quem} alterada`, detalhes: mudancas(h, ROTULOS_DESIGNACAO) };
  }

  const numero = `${d.numero_contrato ?? "?"}/${d.ano ?? "?"}`;
  if (h.acao === "INSERT") return { titulo: `Contrato ${numero} cadastrado`, detalhes: [`situação ${rotuloSituacaoContrato(d.status as string).toLowerCase()}`] };
  if (h.acao === "DELETE") return { titulo: `Contrato ${numero} apagado`, detalhes: [] };
  return { titulo: "Contrato alterado", detalhes: mudancas(h) };
}
