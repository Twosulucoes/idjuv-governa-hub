/**
 * Trilha de auditoria (tabela `audit_logs`) — consulta e registro de ações sem gravação.
 *
 * Desde a onda E1 do RH (migração 20261011000000_rh_autoria_trilha.sql) cada linha leva o servidor responsável
 * (retrato: servidor_id, servidor_nome, servidor_matricula), a origem (usuario, usuario_sem_vinculo, sistema,
 * anonimo), os campos alterados, a transação e a `sequencia` (ordem de gravação). Quem lê:
 *   - papel admin: tudo (policy admin_only_select);
 *   - quem tem o módulo rh e a permissão `rh.auditoria.visualizar`: só as linhas do módulo 'rh'
 *     (policy audit_logs_rh_auditoria_select, migração 20261011000100).
 * A RLS é a fronteira; a tela só escolhe o que pedir.
 *
 * A lista é paginada e filtrada no servidor e nunca traz before_data/after_data (podem ser grandes); o detalhe de
 * uma linha (diff campo a campo, valores já mascarados pelo banco) é lido ao abrir.
 *
 * `registrar_evento` (RPC da E1) grava ver/exportar/baixar (imprimir = baixar) no módulo 'rh', com listas fechadas
 * de ação e entidade; usuário, servidor, origem, IP e user agent são do banco.
 *
 * As colunas novas e a RPC ainda não estão em types.ts (gerado): consulta sem tipagem do client.
 */

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import type { SupabaseClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { AuditAction } from "@/types/auth";

const db = supabase as unknown as SupabaseClient;

// ============================================================================
// Tipos
// ============================================================================

export type OrigemTrilha = "usuario" | "usuario_sem_vinculo" | "sistema" | "anonimo";

export const ORIGEM_TRILHA_LABELS: Record<OrigemTrilha, string> = {
  usuario: "Servidor",
  usuario_sem_vinculo: "Usuário sem servidor vinculado",
  sistema: "Sistema",
  anonimo: "Anônimo (formulário público)",
};

/** Linha da lista (sem antes/depois nem metadados). */
export interface LinhaTrilha {
  id: string;
  timestamp: string;
  sequencia: number | null;
  action: AuditAction;
  entity_type: string | null;
  entity_id: string | null;
  module_name: string | null;
  user_id: string | null;
  servidor_id: string | null;
  servidor_nome: string | null;
  servidor_matricula: string | null;
  origem: OrigemTrilha | null;
  role_at_time: string | null;
  description: string | null;
  campos_alterados: string[] | null;
  /** metadata.fonte: storage, registrar_evento, log_audit (nulo nas linhas dos triggers de tabela). */
  fonte?: string | null;
  /** metadata.trigger: "true" nas linhas gravadas pelos triggers de tabela (fn_audit_trigger). */
  gatilho?: string | null;
  /** Nome do perfil (profiles.full_name) quando não há servidor vinculado; o que a RLS não liberar fica vazio. */
  usuario_nome?: string | null;
}

/** De onde veio a linha (metadata.fonte / metadata.trigger), para exibir. */
export function fonteTrilha(l: Pick<LinhaTrilha, "fonte" | "gatilho">): string | null {
  if (l.fonte === "storage") return "Arquivo (Storage)";
  if (l.fonte === "registrar_evento") return "Ação na tela";
  if (l.fonte === "log_audit") return "Registro avulso (log_audit)";
  if (l.gatilho === "true") return "Gravação no banco";
  return l.fonte ?? null;
}

/** Linha completa (detalhe). */
export interface DetalheTrilha extends LinhaTrilha {
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  transacao: number | null;
  org_unit_id: string | null;
  org_unit?: { nome: string | null } | null;
}

/**
 * Recorte de uma ficha: as linhas de uma entidade e das tabelas ligadas a ela.
 *  - servidor: a linha em `servidores` e toda linha cujo antes/depois aponte para o servidor (servidor_id) —
 *    vínculos, lotações, férias, licenças, viagens, frequência, documentos, fichas financeiras...; os eventos
 *    registrados com metadados.servidor_id; e os arquivos do Storage do servidor (metadados.servidor_alvo_id, aceito
 *    só nas linhas com metadados.fonte = 'storage', que só o trigger do Storage grava: um evento mandado pela tela não
 *    "planta" arquivo na ficha de outro servidor).
 *  - folha: a linha em `folhas_pagamento` e toda linha com folha_id (fichas, remessas, eventos do eSocial,
 *    exportações) e os eventos com metadados.folha_id, nos módulos 'rh' e 'folha' (fechar_folha/reabrir_folha antigas
 *    gravaram 'folha'). Itens de ficha (ficha_id) não entram.
 */
export type EscopoTrilha = { tipo: "servidor"; servidorId: string } | { tipo: "folha"; folhaId: string };

export interface FiltrosTrilha {
  /** Data inicial (yyyy-MM-dd), inclusiva, no fuso do navegador. */
  inicio?: string;
  /** Data final (yyyy-MM-dd), inclusiva. */
  fim?: string;
  modulo?: string;
  acao?: AuditAction;
  origem?: OrigemTrilha;
  /** Tabela/entidade (entity_type), exata. */
  entidade?: string;
  /** ID do registro (entity_id). */
  registroId?: string;
  /** ID do usuário (auth) que agiu. */
  usuarioId?: string;
  /** Servidor responsável: nome ou matrícula (parcial). */
  responsavel?: string;
  /** ID do servidor responsável. */
  servidorId?: string;
  escopo?: EscopoTrilha;
}

const COLUNAS_LISTA =
  "id, timestamp, sequencia, action, entity_type, entity_id, module_name, user_id, servidor_id, servidor_nome, " +
  "servidor_matricula, origem, role_at_time, description, campos_alterados, fonte:metadata->>fonte, " +
  "gatilho:metadata->>trigger";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const ehUuid = (v: string | undefined | null): v is string => !!v && UUID.test(v.trim());

/** Texto livre usado dentro de `or()`/`ilike` do PostgREST: os caracteres da sintaxe viram curinga. */
const limparTexto = (v: string) =>
  v
    .trim()
    .replace(/[,()*%\\:"'.]/g, "*")
    .replace(/\*+/g, "*");

/** Início do dia (local) em ISO; `fimDoDia` devolve o início do dia seguinte (limite exclusivo). */
function inicioDoDia(data: string, fimDoDia = false): string | null {
  const d = new Date(`${data}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  if (fimDoDia) d.setDate(d.getDate() + 1);
  return d.toISOString();
}

// Consulta de audit_logs (builder do PostgREST sem tipagem).
const consultaTrilha = () => db.from("audit_logs").select(COLUNAS_LISTA);
type ConsultaTrilha = ReturnType<typeof consultaTrilha>;

function aplicarFiltros(query: ConsultaTrilha, f: FiltrosTrilha): ConsultaTrilha {
  let q = query;
  if (f.inicio) {
    const v = inicioDoDia(f.inicio);
    if (v) q = q.gte("timestamp", v);
  }
  if (f.fim) {
    const v = inicioDoDia(f.fim, true);
    if (v) q = q.lt("timestamp", v);
  }
  if (f.modulo) q = q.eq("module_name", f.modulo);
  if (f.acao) q = q.eq("action", f.acao);
  if (f.origem) q = q.eq("origem", f.origem);
  if (f.entidade?.trim()) q = q.eq("entity_type", f.entidade.trim());
  if (ehUuid(f.registroId)) q = q.eq("entity_id", f.registroId.trim());
  if (ehUuid(f.usuarioId)) q = q.eq("user_id", f.usuarioId.trim());
  if (ehUuid(f.servidorId)) q = q.eq("servidor_id", f.servidorId.trim());
  // Grupos "ou": um só parâmetro `or` na URL (vários grupos viram and(or(...),or(...))).
  const grupos: string[] = [];
  const resp = f.responsavel ? limparTexto(f.responsavel) : "";
  if (resp && resp !== "*") grupos.push(`servidor_nome.ilike.*${resp}*,servidor_matricula.ilike.*${resp}*`);
  if (f.escopo?.tipo === "servidor" && ehUuid(f.escopo.servidorId)) {
    const s = f.escopo.servidorId;
    q = q.eq("module_name", "rh");
    grupos.push(
      `and(entity_type.eq.servidores,entity_id.eq.${s}),after_data->>servidor_id.eq.${s},` +
        `before_data->>servidor_id.eq.${s},metadata->>servidor_id.eq.${s},` +
        `and(metadata->>fonte.eq.storage,metadata->>servidor_alvo_id.eq.${s})`,
    );
  } else if (f.escopo?.tipo === "folha" && ehUuid(f.escopo.folhaId)) {
    const id = f.escopo.folhaId;
    q = q.in("module_name", ["rh", "folha"]);
    grupos.push(
      `and(entity_type.eq.folhas_pagamento,entity_id.eq.${id}),after_data->>folha_id.eq.${id},` +
        `before_data->>folha_id.eq.${id},metadata->>folha_id.eq.${id}`,
    );
  }
  if (grupos.length === 1) q = q.or(grupos[0]);
  else if (grupos.length > 1) q = q.or(`and(${grupos.map((g) => `or(${g})`).join(",")})`);
  return q;
}

/** Completa o nome de quem agiu sem servidor vinculado (profiles; o que a RLS não liberar fica sem nome). */
async function completarNomes(linhas: LinhaTrilha[]) {
  const ids = [...new Set(linhas.filter((l) => !l.servidor_nome && l.user_id).map((l) => l.user_id as string))];
  if (!ids.length) return;
  const { data } = await supabase.from("profiles").select("id, full_name").in("id", ids);
  const nomes = new Map((data ?? []).map((p) => [p.id, p.full_name]));
  linhas.forEach((l) => {
    if (l.user_id && !l.servidor_nome) l.usuario_nome = nomes.get(l.user_id) ?? null;
  });
}

/** Nome para exibir de quem agiu. */
export function responsavelTrilha(l: Pick<LinhaTrilha, "servidor_nome" | "servidor_matricula" | "usuario_nome" | "origem" | "user_id">) {
  if (l.servidor_nome) return l.servidor_matricula ? `${l.servidor_nome} (mat. ${l.servidor_matricula})` : l.servidor_nome;
  if (l.usuario_nome) return l.usuario_nome;
  if (l.origem === "sistema" || (!l.user_id && l.origem !== "anonimo")) return "Sistema";
  if (l.origem === "anonimo") return "Anônimo";
  return "Usuário sem servidor vinculado";
}

// ============================================================================
// Consultas
// ============================================================================

export interface PaginaTrilha {
  linhas: LinhaTrilha[];
  temProxima: boolean;
  /** `sequencia` da última linha: cursor da próxima página. */
  proximoCursor: number | null;
}

/** Uma página a partir do cursor (sequencia < cursor), na ordem sequencia desc; lê `tamanho + 1` para saber se há mais. */
async function lerPagina(filtros: FiltrosTrilha, cursor: number | null, tamanho: number) {
  let query = aplicarFiltros(consultaTrilha(), filtros);
  if (cursor != null) query = query.lt("sequencia", cursor);
  const { data, error } = await query.order("sequencia", { ascending: false }).limit(tamanho + 1);
  if (error) throw error;
  const todas = (data ?? []) as unknown as LinhaTrilha[];
  const linhas = todas.slice(0, tamanho);
  const ultima = linhas[linhas.length - 1];
  return { linhas, temProxima: todas.length > tamanho, proximoCursor: ultima?.sequencia ?? null };
}

/**
 * Lista paginada no servidor por cursor na `sequencia` (sem offset: o índice desce direto ao ponto). `cursor` nulo é a
 * primeira página; a tela guarda a pilha de cursores para voltar.
 */
export function useTrilhaAuditoria(filtros: FiltrosTrilha, cursor: number | null, tamanho = 50, habilitado = true) {
  return useQuery({
    queryKey: ["trilha-auditoria", filtros, cursor, tamanho],
    enabled: habilitado,
    placeholderData: (anterior) => anterior,
    queryFn: async (): Promise<PaginaTrilha> => {
      const pagina = await lerPagina(filtros, cursor, tamanho);
      await completarNomes(pagina.linhas);
      return pagina;
    },
  });
}

/** Linha completa, com antes/depois e metadados, para o diff. */
export function useDetalheTrilha(id: string | null) {
  return useQuery({
    queryKey: ["trilha-auditoria-detalhe", id],
    enabled: !!id,
    queryFn: async (): Promise<DetalheTrilha | null> => {
      const { data, error } = await db
        .from("audit_logs")
        .select("*, org_unit:estrutura_organizacional!audit_logs_org_unit_id_fkey(nome)")
        .eq("id", id as string)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const linha = data as unknown as DetalheTrilha;
      await completarNomes([linha]);
      return linha;
    },
  });
}

/** Máximo de linhas no CSV da trilha (o filtro reduz; o arquivo diz quando cortou). */
export const LIMITE_EXPORTACAO_TRILHA = 5000;

/** Todas as linhas do filtro (até o limite), sem antes/depois, para o CSV. */
export async function buscarTrilhaParaExportar(filtros: FiltrosTrilha): Promise<LinhaTrilha[]> {
  const linhas: LinhaTrilha[] = [];
  let cursor: number | null = null;
  while (linhas.length < LIMITE_EXPORTACAO_TRILHA) {
    const lote = Math.min(1000, LIMITE_EXPORTACAO_TRILHA - linhas.length);
    const pagina = await lerPagina(filtros, cursor, lote);
    linhas.push(...pagina.linhas);
    if (!pagina.temProxima || pagina.proximoCursor == null) break;
    cursor = pagina.proximoCursor;
  }
  await completarNomes(linhas);
  return linhas;
}

// ============================================================================
// Diff
// ============================================================================

export interface CampoDiff {
  campo: string;
  antes: unknown;
  depois: unknown;
  alterado: boolean;
}

const ehObjeto = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);

/** Carimbos que todo UPDATE mexe; a trilha não os põe em campos_alterados. */
const CARIMBOS_ATUALIZACAO = new Set(["updated_at", "updated_by", "updated_by_servidor_id"]);

/**
 * Campo a campo entre antes e depois (valores como vieram do banco, já mascarados). Na atualização, `alterado`
 * segue campos_alterados (inclui as colunas mascaradas, cujo valor guardado é igual dos dois lados) e os carimbos
 * updated_* ficam de fora quando não estão em campos_alterados.
 */
export function calcularDiff(linha: Pick<DetalheTrilha, "before_data" | "after_data" | "campos_alterados">): CampoDiff[] {
  const antes = ehObjeto(linha.before_data) ? linha.before_data : {};
  const depois = ehObjeto(linha.after_data) ? linha.after_data : {};
  const alterados = new Set(linha.campos_alterados ?? []);
  const ehAtualizacao = ehObjeto(linha.before_data) && ehObjeto(linha.after_data);
  const chaves = [...new Set([...Object.keys(antes), ...Object.keys(depois)])]
    .filter((campo) => !(ehAtualizacao && CARIMBOS_ATUALIZACAO.has(campo) && !alterados.has(campo)))
    .sort((a, b) => a.localeCompare(b));
  return chaves.map((campo) => {
    const a = antes[campo];
    const d = depois[campo];
    const diferente = JSON.stringify(a ?? null) !== JSON.stringify(d ?? null);
    const alterado = ehAtualizacao ? alterados.has(campo) || diferente : true;
    return { campo, antes: a, depois: d, alterado };
  });
}

/** Valor como texto (nunca HTML): nulo vira "—", objeto vira JSON. */
export function valorComoTexto(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "sim" : "não";
  if (typeof v === "object") return JSON.stringify(v, null, 2);
  return String(v);
}

// ============================================================================
// registrar_evento
// ============================================================================

/** Ações aceitas pela RPC (imprimir = download). */
export type AcaoEvento = "view" | "export" | "download";

/** Entidades aceitas pela RPC além das tabelas do RH (lista fechada no banco). */
export type EntidadeEvento =
  | "servidores"
  | "fichas_financeiras"
  | "folhas_pagamento"
  | "frequencia_mensal"
  | "frequencia_pacotes"
  | "ferias_servidor"
  | "licencas_afastamentos"
  | "viagens_diarias"
  | "documentos"
  | "documentos_requerimento_servidor"
  | "portarias_servidor"
  | "nomeacoes_chefe_unidade"
  | "eventos_esocial"
  | "remessas_bancarias"
  | "contracheque"
  | "relatorio_rh"
  | "exportacao_rh"
  | "arquivo_esocial"
  | "arquivo_cnab"
  | "trilha_auditoria";

export interface EventoTrilha {
  acao: AcaoEvento;
  entidade: EntidadeEvento;
  entidadeId?: string | null;
  /** Texto curto (até 500 caracteres no banco). Sem dado pessoal (CPF, endereço...). */
  descricao?: string;
  /** Objeto de até 4000 caracteres: filtros, formato, quantidade, ids. Sem dado pessoal. */
  metadados?: Record<string, unknown>;
}

/** Chama a RPC; lança o erro do banco. */
export async function registrarEvento(ev: EventoTrilha): Promise<string | null> {
  const { data, error } = await db.rpc("registrar_evento", {
    p_acao: ev.acao,
    p_entidade: ev.entidade,
    p_entidade_id: ev.entidadeId ?? null,
    p_descricao: ev.descricao ?? null,
    p_metadados: ev.metadados ?? {},
  });
  if (error) throw error;
  return (data as string | null) ?? null;
}

export const MSG_FALHA_REGISTRO =
  "Não foi possível registrar a ação na trilha de auditoria. O arquivo não foi entregue; tente novamente.";

/**
 * Registro na trilha a partir da tela.
 *  - `registrarAntes`: para exportações, impressões e arquivos (CNAB, eSocial). Espera o banco; se falhar, mostra
 *    o erro e devolve false — quem chama NÃO entrega o arquivo.
 *  - `registrarSemBloquear`: para visualização; não espera e não interrompe a tela se falhar.
 * Registro feito no navegador é de melhor esforço (premissa 3 da spec da E2).
 */
export function useRegistrarEvento() {
  const registrarAntes = useCallback(async (ev: EventoTrilha): Promise<boolean> => {
    try {
      await registrarEvento(ev);
      return true;
    } catch (erro) {
      console.error("registrar_evento falhou:", erro);
      toast.error(MSG_FALHA_REGISTRO);
      return false;
    }
  }, []);

  const registrarSemBloquear = useCallback((ev: EventoTrilha) => {
    registrarEvento(ev).catch((erro) => console.warn("registrar_evento (visualização) falhou:", erro));
  }, []);

  return { registrarAntes, registrarSemBloquear };
}
