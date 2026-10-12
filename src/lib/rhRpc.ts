/**
 * Chamadas às RPCs atômicas do RH (migração 20261012100000_rh_correcoes_auditoria).
 *
 * Admissão e desligamento mexem em vínculo, lotação, provimento, cessão, designação, férias, licença, viagem,
 * histórico e portaria. Feitos em várias chamadas do navegador, qualquer falha no meio deixava o servidor pela
 * metade (e o `catch` mudo escondia). Aqui é uma transação no banco: ou tudo, ou nada com a mensagem do erro.
 *
 * `types.ts` é gerado e ainda não conhece estas funções; por isso a chamada tipada à mão.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type TipoVinculoServidor = Database["public"]["Enums"]["tipo_vinculo_servidor"];

interface RpcResposta {
  data: unknown;
  error: { message: string; code?: string } | null;
}

async function chamar<T>(nome: string, args: Record<string, unknown>): Promise<T> {
  const cliente = supabase as unknown as { rpc: (n: string, a: Record<string, unknown>) => PromiseLike<RpcResposta> };
  const { data, error } = await cliente.rpc(nome, args);
  if (error) throw new Error(error.message);
  return data as T;
}

/** Ato que fundamenta o movimento (todos opcionais; a minuta de portaria nasce depois). */
export interface AtoFuncional {
  atoTipo?: string;
  atoNumero?: string;
  atoData?: string;
  atoDoeNumero?: string;
  atoDoeData?: string;
}

export interface AdmitirServidorParams extends AtoFuncional {
  servidorId: string;
  tipo: TipoVinculoServidor;
  cargoId?: string | null;
  unidadeId: string;
  dataInicio: string;
  /** Obrigatório para `cedido_entrada`. */
  orgaoOrigem?: string;
  /** Padrão: gera a minuta de portaria de nomeação quando há cargo. */
  gerarMinuta?: boolean;
  funcaoExercida?: string;
  observacao?: string;
}

export interface AdmitirServidorResultado {
  /** Protocolo do ato (RH-AAAA-NNNNNN): todas as gravações e a trilha levam este número. */
  protocolo: string;
  vinculo_id: string;
  lotacao_id: string;
  provimento_id: string | null;
  minuta_id: string | null;
  minuta_numero: string | null;
}

/** Vínculo + lotação + provimento (ou cessão) + histórico + minuta, numa transação. */
export function admitirServidor(p: AdmitirServidorParams): Promise<AdmitirServidorResultado> {
  return chamar<AdmitirServidorResultado>("rh_admitir_servidor", {
    p_servidor_id: p.servidorId,
    p_tipo: p.tipo,
    p_cargo_id: p.cargoId || null,
    p_unidade_id: p.unidadeId,
    p_data_inicio: p.dataInicio,
    p_orgao_origem: p.orgaoOrigem || null,
    p_ato_tipo: p.atoTipo || null,
    p_ato_numero: p.atoNumero || null,
    p_ato_data: p.atoData || null,
    p_ato_doe_numero: p.atoDoeNumero || null,
    p_ato_doe_data: p.atoDoeData || null,
    p_gerar_minuta: p.gerarMinuta ?? true,
    p_funcao_exercida: p.funcaoExercida || null,
    p_observacao: p.observacao || null,
  });
}

export const MOTIVOS_DESLIGAMENTO = [
  { value: "exoneracao_pedido", label: "Exoneração a pedido" },
  { value: "exoneracao_oficio", label: "Exoneração de ofício" },
  { value: "termino_mandato", label: "Término de mandato / do contrato" },
  { value: "demissao", label: "Demissão" },
  { value: "aposentadoria", label: "Aposentadoria" },
  { value: "falecimento", label: "Falecimento" },
  { value: "vacancia", label: "Vacância (outros casos)" },
] as const;

export type MotivoDesligamento = (typeof MOTIVOS_DESLIGAMENTO)[number]["value"] | "exoneracao";

/** Motivos de `MOTIVOS_ENCERRAMENTO` (painel de vínculos) que encerram a vida funcional, não só um vínculo. */
export const MOTIVOS_QUE_DESLIGAM: readonly string[] = [
  "exoneracao",
  "exoneracao_pedido",
  "exoneracao_oficio",
  "termino_mandato",
  "demissao",
  "aposentadoria",
  "falecimento",
  "vacancia",
];

export interface DesligarServidorParams extends AtoFuncional {
  servidorId: string;
  data: string;
  motivo: MotivoDesligamento;
  observacao?: string;
  gerarMinuta?: boolean;
}

export interface DesligarServidorResultado {
  /** Protocolo do ato (RH-AAAA-NNNNNN). */
  protocolo: string;
  situacao: "exonerado" | "aposentado" | "falecido";
  minuta_numero: string | null;
  avisos: string[];
  encerrados: Record<string, number>;
}

/** Encerra lotação, vínculos, provimentos, cessões, designações, férias, licenças, viagens, chefias e comissões. */
export function desligarServidor(p: DesligarServidorParams): Promise<DesligarServidorResultado> {
  return chamar<DesligarServidorResultado>("rh_desligar_servidor", {
    p_servidor_id: p.servidorId,
    p_data: p.data,
    p_motivo: p.motivo,
    p_observacao: p.observacao || null,
    p_ato_tipo: p.atoTipo || null,
    p_ato_numero: p.atoNumero || null,
    p_ato_data: p.atoData || null,
    p_ato_doe_numero: p.atoDoeNumero || null,
    p_ato_doe_data: p.atoDoeData || null,
    p_gerar_minuta: p.gerarMinuta ?? true,
  });
}

export const MOTIVOS_TRANSFERENCIA = [
  { value: "transferencia", label: "Transferência" },
  { value: "remocao", label: "Remoção" },
] as const;

export type MotivoTransferencia = (typeof MOTIVOS_TRANSFERENCIA)[number]["value"];

export interface TransferirServidorParams extends AtoFuncional {
  servidorId: string;
  unidadeId: string;
  data: string;
  motivo: MotivoTransferencia;
  observacao?: string;
  gerarMinuta?: boolean;
}

export interface TransferirServidorResultado {
  protocolo: string;
  lotacao_id: string;
  minuta_numero: string | null;
  unidade_anterior_id: string;
  avisos: string[];
}

/** Muda de unidade sem exonerar: encerra a lotação atual, abre a nova, move provimento e vínculos, histórico e minuta. */
export function transferirServidor(p: TransferirServidorParams): Promise<TransferirServidorResultado> {
  return chamar<TransferirServidorResultado>("rh_transferir_servidor", {
    p_servidor_id: p.servidorId,
    p_unidade_id: p.unidadeId,
    p_data: p.data,
    p_motivo: p.motivo,
    p_observacao: p.observacao || null,
    p_ato_tipo: p.atoTipo || null,
    p_ato_numero: p.atoNumero || null,
    p_ato_data: p.atoData || null,
    p_ato_doe_numero: p.atoDoeNumero || null,
    p_ato_doe_data: p.atoDoeData || null,
    p_gerar_minuta: p.gerarMinuta ?? true,
  });
}
