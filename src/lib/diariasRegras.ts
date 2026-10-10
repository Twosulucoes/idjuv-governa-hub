/**
 * Regras de negócio de viagens a serviço e diárias — funções puras, sem React
 * nem Supabase (testáveis isoladamente).
 *
 * Base: regra geral da administração pública (Decreto federal 5.992/2006,
 * replicado nos estados): uma diária por pernoite fora da sede e meia diária
 * no dia do retorno; deslocamento sem pernoite vale meia diária. Os VALORES da
 * diária vêm da tabela do perfil do tenant (`rh.diarias`), por categoria/nível
 * do cargo e faixa de destino. Datas sempre no formato `YYYY-MM-DD`.
 */

import { format } from "date-fns";
import type { FaixaDestino, TabelaDiariasConfig } from "@/core/tenant";
import {
  VIAGEM_STATUS_LABELS,
  type CargoParaDiaria,
  type StatusViagemDiaria,
  type TipoOnus,
  type ViagemDiaria,
} from "@/types/rh";

/** Opções de status, na ordem do fluxo, com rótulo (fonte: `VIAGEM_STATUS_LABELS`). */
export const STATUS_VIAGEM: { value: StatusViagemDiaria; label: string }[] = (
  Object.keys(VIAGEM_STATUS_LABELS) as StatusViagemDiaria[]
).map((value) => ({ value, label: VIAGEM_STATUS_LABELS[value] }));

export const FAIXA_DESTINO_LABELS: Record<FaixaDestino, string> = {
  intermunicipal: "Intermunicipal (dentro da UF da sede)",
  interestadual: "Interestadual",
  internacional: "Internacional",
};

/** UF gravada quando o destino é no exterior (código usado pela Receita Federal). */
export const UF_EXTERIOR = "EX";

const MS_POR_DIA = 86_400_000;

/** Normaliza texto para comparação: sem acentos, minúsculo, sem espaços nas pontas. */
function normalizar(texto?: string | null): string {
  return (texto ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

/** País considerado nacional (vazio = Brasil, que é o default da coluna). */
export function ehBrasil(pais?: string | null): boolean {
  const n = normalizar(pais);
  return n === "" || n === "brasil" || n === "brazil";
}

/**
 * Faixa de destino: país diferente do Brasil → internacional; UF diferente da
 * UF da sede do órgão → interestadual; senão intermunicipal. Sem UF da sede
 * configurada não dá para afirmar que é a mesma UF: cai em interestadual.
 */
export function classificarDestino(
  uf?: string | null,
  pais?: string | null,
  ufSede?: string | null,
): FaixaDestino {
  if (!ehBrasil(pais)) return "internacional";
  const destino = normalizar(uf);
  const sede = normalizar(ufSede);
  if (sede && destino === sede) return "intermunicipal";
  return "interestadual";
}

/** `YYYY-MM-DD` → milissegundos da meia-noite UTC desse dia (sem fuso). `null` se inválida. */
function diaUTC(data?: string | null): number | null {
  if (!data) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(data);
  if (!m) return null;
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const ms = Date.UTC(ano, mes - 1, dia);
  const d = new Date(ms);
  // Rejeita datas como 2026-02-31 (o Date.UTC "transborda" para março).
  if (d.getUTCFullYear() !== ano || d.getUTCMonth() !== mes - 1 || d.getUTCDate() !== dia) return null;
  return ms;
}

/**
 * Pernoites fora da sede = dias corridos entre saída e retorno (sem fuso).
 * `null` se alguma data for inválida ou o retorno anteceder a saída.
 */
export function contarPernoites(dataSaida?: string | null, dataRetorno?: string | null): number | null {
  const saida = diaUTC(dataSaida);
  const retorno = diaUTC(dataRetorno);
  if (saida === null || retorno === null || retorno < saida) return null;
  return Math.round((retorno - saida) / MS_POR_DIA);
}

/** Erro do período informado (mensagem para o formulário) ou `null` se válido. */
export function validarPeriodo(dataSaida?: string | null, dataRetorno?: string | null): string | null {
  if (!dataSaida || !dataRetorno) return "Informe as datas de saída e retorno.";
  if (diaUTC(dataSaida) === null || diaUTC(dataRetorno) === null) return "Data inválida.";
  if (contarPernoites(dataSaida, dataRetorno) === null) return "A data de retorno não pode ser anterior à saída.";
  return null;
}

export interface OpcoesContagem {
  tipoOnus: TipoOnus;
  /** Conta meia diária no dia do retorno (padrão da regra federal). */
  meiaDiariaNoRetorno?: boolean;
}

/**
 * Quantidade de diárias:
 * - `sem_onus` → 0;
 * - sem pernoite (saída e retorno no mesmo dia) → 0,5;
 * - n pernoites → n + 0,5 (meia diária no retorno) ou n, se a regra estiver desligada;
 * - datas inválidas ou retorno antes da saída → `null`.
 */
export function calcularQuantidadeDiarias(
  dataSaida: string | null | undefined,
  dataRetorno: string | null | undefined,
  { tipoOnus, meiaDiariaNoRetorno = true }: OpcoesContagem,
): number | null {
  if (tipoOnus === "sem_onus") return 0;
  const pernoites = contarPernoites(dataSaida, dataRetorno);
  if (pernoites === null) return null;
  if (pernoites === 0) return 0.5;
  return meiaDiariaNoRetorno ? pernoites + 0.5 : pernoites;
}

/**
 * Valor unitário da diária: primeira linha da tabela cujas `categorias` incluem a
 * categoria do cargo e cujo intervalo de nível (quando informado) contém o nível
 * do servidor. `null` quando não há tabela, cargo ou linha que case.
 */
export function valorDiariaPorTabela(
  tabela: TabelaDiariasConfig | null | undefined,
  cargo: CargoParaDiaria | null | undefined,
  faixa: FaixaDestino,
): number | null {
  if (!tabela || !cargo) return null;
  const nivel = cargo.nivel_hierarquico ?? null;
  const linha = tabela.linhas.find((l) => {
    if (!l.categorias.includes(cargo.categoria)) return false;
    if (l.nivelMinimo != null && (nivel === null || nivel < l.nivelMinimo)) return false;
    if (l.nivelMaximo != null && (nivel === null || nivel > l.nivelMaximo)) return false;
    return true;
  });
  const valor = linha?.valores[faixa];
  return typeof valor === "number" && Number.isFinite(valor) ? valor : null;
}

/** Total = quantidade × valor unitário, com 2 casas (valores ausentes contam 0). */
export function calcularTotalDiarias(quantidade?: number | null, valor?: number | null): number {
  const q = Number(quantidade) || 0;
  const v = Number(valor) || 0;
  return Math.round(q * v * 100) / 100;
}

/**
 * Transições de status permitidas a partir do status atual (inclui o próprio):
 * `solicitada → autorizada → em_andamento → concluida`; `cancelada` só a partir
 * de `solicitada`/`autorizada`; `concluida` e `cancelada` são finais.
 */
export function statusPermitidos(atual?: string | null): StatusViagemDiaria[] {
  switch (atual) {
    case "autorizada":
      return ["autorizada", "em_andamento", "cancelada"];
    case "em_andamento":
      return ["em_andamento", "concluida"];
    case "concluida":
      return ["concluida"];
    case "cancelada":
      return ["cancelada"];
    default:
      return ["solicitada", "autorizada", "cancelada"];
  }
}

/** Campos do formulário de viagem sujeitos a bloqueio por status. */
export type CampoViagem =
  | "servidor_id"
  | "tipo_onus"
  | "data_saida"
  | "data_retorno"
  | "destino_cidade"
  | "destino_uf"
  | "destino_pais"
  | "finalidade"
  | "justificativa"
  | "portaria_numero"
  | "portaria_data"
  | "meio_transporte"
  | "quantidade_diarias"
  | "valor_diaria"
  | "observacoes";

export const TODOS_CAMPOS_VIAGEM: CampoViagem[] = [
  "servidor_id",
  "tipo_onus",
  "data_saida",
  "data_retorno",
  "destino_cidade",
  "destino_uf",
  "destino_pais",
  "finalidade",
  "justificativa",
  "portaria_numero",
  "portaria_data",
  "meio_transporte",
  "quantidade_diarias",
  "valor_diaria",
  "observacoes",
];

const CAMPOS_EM_ANDAMENTO: CampoViagem[] = ["portaria_numero", "portaria_data", "meio_transporte", "observacoes"];

/**
 * Campos editáveis em cada status: `solicitada` (ou sem status) → todos;
 * `autorizada` → todos menos o servidor; `em_andamento` → portaria, meio de
 * transporte e observações; `concluida`/`cancelada` → nenhum. (Relatório/prestação
 * de contas ainda não tem tela — fica para o item de prestação de contas.)
 */
export function camposEditaveisPorStatus(status?: string | null): CampoViagem[] {
  if (!status || status === "solicitada") return TODOS_CAMPOS_VIAGEM;
  if (status === "autorizada") return TODOS_CAMPOS_VIAGEM.filter((c) => c !== "servidor_id");
  if (status === "em_andamento") return CAMPOS_EM_ANDAMENTO;
  return [];
}

/** Há algo a editar neste status? */
export function podeEditarRegistro(status?: string | null): boolean {
  return camposEditaveisPorStatus(status).length > 0;
}

/**
 * Ônus não pode mais mudar depois que a DIRAF abriu o processo (nº do SEI ou etapa
 * além de `pendente`): trocar para `sem_onus` deixaria SEI/etapas órfãos.
 */
export function onusBloqueado(viagem: Pick<ViagemDiaria, "numero_sei_diarias" | "workflow_diraf_status">): boolean {
  if (viagem.numero_sei_diarias?.trim()) return true;
  return !!viagem.workflow_diraf_status && viagem.workflow_diraf_status !== "pendente";
}

/** "Cidade/UF" ou, no exterior (`destino_uf = "EX"`), "Cidade, País". */
export function descreverDestino(v: Pick<ViagemDiaria, "destino_cidade" | "destino_uf" | "destino_pais">): string {
  if (v.destino_uf === UF_EXTERIOR) return `${v.destino_cidade}, ${v.destino_pais?.trim() || "exterior"}`;
  return `${v.destino_cidade}/${v.destino_uf}`;
}

/**
 * Quantidade e valor ficam travados quando a DIRAF já concluiu o workflow
 * (processo SEI de pagamento aberto), em qualquer status.
 */
export function valoresBloqueados(viagem: Pick<ViagemDiaria, "workflow_diraf_status">): boolean {
  return viagem.workflow_diraf_status === "concluido";
}

/** Cancelar só antes de a viagem começar: `solicitada` ou `autorizada`. */
export function podeCancelar(viagem: Pick<ViagemDiaria, "status">): boolean {
  return statusPermitidos(viagem.status).includes("cancelada") && viagem.status !== "cancelada";
}

/**
 * Exclusão física é exceção (registro de diária é contábil; o normal é cancelar):
 * só super admin, com status `solicitada`, sem processo SEI e sem portaria.
 */
export function podeExcluir(
  viagem: Pick<ViagemDiaria, "status" | "numero_sei_diarias" | "portaria_numero">,
  isSuperAdmin: boolean,
): boolean {
  if (!isSuperAdmin) return false;
  if ((viagem.status ?? "solicitada") !== "solicitada") return false;
  if (viagem.numero_sei_diarias?.trim()) return false;
  if (viagem.portaria_numero?.trim()) return false;
  return true;
}

/**
 * Texto gravado em `observacoes` ao cancelar (não há coluna própria):
 * "Cancelada em dd/mm/aaaa: motivo", seguido das observações anteriores.
 */
export function textoCancelamento(motivo: string, hoje: Date, observacoesAtuais?: string | null): string {
  const cabecalho = `Cancelada em ${format(hoje, "dd/MM/yyyy")}: ${motivo.trim()}`;
  const anteriores = observacoesAtuais?.trim();
  return anteriores ? `${cabecalho}\n\n${anteriores}` : cabecalho;
}
