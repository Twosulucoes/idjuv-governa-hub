/**
 * HOOK: CACHE OFFLINE DE BENS (app de campo)
 *
 * Guarda no aparelho (IndexedDB, sem dependências) uma cópia leve dos bens que o
 * usuário pode ver (a RLS do banco decide quais), para achar o bem pelo código
 * quando não há internet — sem isso a fila offline de coleta fica inalcançável.
 *
 * - Carregado quando há rede, em blocos de 1000, e renovado se estiver velho.
 * - Só os campos necessários para identificar o bem (sem valores nem dados pessoais).
 * - Busca local com a mesma regra do servidor (RPC patrimonio_buscar_bem_por_codigo):
 *   normaliza (trim + maiúsculas) e procura por número, depois codigo_qr, depois
 *   patrimonio_anterior.
 * - O cache é amarrado ao usuário: outro usuário no mesmo aparelho não o usa.
 *
 * Banco: 'patrimonio-cache-bens' · store: 'bens' · keyPath: 'id'.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type BemCacheado = Pick<
  Tables<"bens_patrimoniais">,
  | "id"
  | "numero_patrimonio"
  | "codigo_qr"
  | "patrimonio_anterior"
  | "descricao"
  | "unidade_local_id"
  | "situacao"
  | "estado_conservacao"
>;

/** Registro gravado: o bem + chaves normalizadas indexadas para a busca. */
interface RegistroCache extends BemCacheado {
  chave_numero: string;
  chave_qr: string;
  chave_anterior: string;
}

interface MetaCache {
  usuario_id: string;
  atualizado_em: string;
  total: number;
}

const DB_NOME = "patrimonio-cache-bens";
const DB_VERSAO = 1;
const STORE = "bens";
const META_KEY = "patrimonio-cache-bens-meta";
const TAMANHO_BLOCO = 1000;
/** Idade máxima antes de recarregar automaticamente (quando houver rede). */
const VALIDADE_MS = 6 * 60 * 60 * 1000;

const CAMPOS =
  "id, numero_patrimonio, codigo_qr, patrimonio_anterior, descricao, unidade_local_id, situacao, estado_conservacao";

/** Mesma normalização do servidor: trim + maiúsculas. */
export function normalizarCodigo(valor: string | null | undefined): string {
  return (valor ?? "").trim().toUpperCase();
}

/**
 * A falha foi de rede (a requisição não chegou ao servidor ou ele está indisponível)?
 * Nesses casos vale cair no cache local; erro com código Postgres não.
 */
export function ehFalhaDeRede(err: unknown): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  if (err instanceof TypeError) return true;
  const erro = (err ?? {}) as { code?: string; message?: string; status?: number };
  if (erro.code) return false;
  if (erro.status === 0 || erro.status === 408 || (typeof erro.status === "number" && erro.status >= 500)) {
    return true;
  }
  return /failed to fetch|fetch failed|networkerror|network request failed|load failed|timeout|aborted/i.test(
    erro.message ?? "",
  );
}

function abrirBanco(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("Este navegador não permite guardar dados offline."));
      return;
    }
    const req = indexedDB.open(DB_NOME, DB_VERSAO);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("chave_numero", "chave_numero", { unique: false });
        store.createIndex("chave_qr", "chave_qr", { unique: false });
        store.createIndex("chave_anterior", "chave_anterior", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("Falha ao abrir o armazenamento local."));
  });
}

function lerMeta(): MetaCache | null {
  try {
    const bruto = localStorage.getItem(META_KEY);
    return bruto ? (JSON.parse(bruto) as MetaCache) : null;
  } catch {
    return null;
  }
}

/** Substitui todo o conteúdo do cache numa única transação. */
async function substituirCache(bens: BemCacheado[]): Promise<void> {
  const db = await abrirBanco();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    store.clear();
    for (const bem of bens) {
      const registro: RegistroCache = {
        ...bem,
        chave_numero: normalizarCodigo(bem.numero_patrimonio),
        chave_qr: normalizarCodigo(bem.codigo_qr),
        chave_anterior: normalizarCodigo(bem.patrimonio_anterior),
      };
      store.put(registro);
    }
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error("Falha ao gravar o cache de bens."));
    };
    tx.onabort = () => {
      db.close();
      reject(tx.error ?? new Error("Gravação do cache de bens cancelada."));
    };
  });
}

/** Procura pela chave normalizada em um índice; devolve o primeiro registro ou null. */
async function buscarPorIndice(indice: string, chave: string): Promise<RegistroCache | null> {
  const db = await abrirBanco();
  return new Promise<RegistroCache | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).index(indice).get(chave);
    let resultado: RegistroCache | null = null;
    req.onsuccess = () => {
      resultado = (req.result as RegistroCache | undefined) ?? null;
    };
    tx.oncomplete = () => {
      db.close();
      resolve(resultado);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? req.error ?? new Error("Falha ao ler o cache de bens."));
    };
  });
}

/** Baixa do servidor (RLS aplicada) todos os bens visíveis, em blocos. */
async function baixarBensVisiveis(): Promise<BemCacheado[]> {
  const todos: BemCacheado[] = [];
  for (let inicio = 0; ; inicio += TAMANHO_BLOCO) {
    const { data, error } = await supabase
      .from("bens_patrimoniais")
      .select(CAMPOS)
      .order("id", { ascending: true })
      .range(inicio, inicio + TAMANHO_BLOCO - 1);
    if (error) throw error;
    const bloco = (data ?? []) as BemCacheado[];
    todos.push(...bloco);
    if (bloco.length < TAMANHO_BLOCO) break;
  }
  return todos;
}

export function useCacheBensOffline(usuarioId: string | null | undefined) {
  const [meta, setMeta] = useState<MetaCache | null>(() => lerMeta());
  const [atualizando, setAtualizando] = useState(false);
  const atualizandoRef = useRef(false);

  /** Recarrega o cache a partir do servidor. Silencioso: falha só é registrada no console. */
  const atualizarCache = useCallback(async (): Promise<boolean> => {
    if (!usuarioId || !navigator.onLine || atualizandoRef.current) return false;
    atualizandoRef.current = true;
    setAtualizando(true);
    try {
      const bens = await baixarBensVisiveis();
      await substituirCache(bens);
      const novaMeta: MetaCache = {
        usuario_id: usuarioId,
        atualizado_em: new Date().toISOString(),
        total: bens.length,
      };
      localStorage.setItem(META_KEY, JSON.stringify(novaMeta));
      setMeta(novaMeta);
      return true;
    } catch (err) {
      console.error("Erro ao atualizar o cache offline de bens:", err);
      return false;
    } finally {
      atualizandoRef.current = false;
      setAtualizando(false);
    }
  }, [usuarioId]);

  // Carrega/renova quando há rede: ao abrir e ao reconectar, se o cache for de outro
  // usuário, não existir ou estiver velho.
  useEffect(() => {
    if (!usuarioId) return;
    const renovarSePreciso = () => {
      const atual = lerMeta();
      const velho =
        !atual ||
        atual.usuario_id !== usuarioId ||
        Date.now() - new Date(atual.atualizado_em).getTime() > VALIDADE_MS;
      if (velho) void atualizarCache();
    };
    renovarSePreciso();
    window.addEventListener("online", renovarSePreciso);
    return () => window.removeEventListener("online", renovarSePreciso);
  }, [usuarioId, atualizarCache]);

  /**
   * Busca no cache local (número, depois codigo_qr, depois patrimonio_anterior).
   * Devolve null se não achar ou se o cache não for deste usuário.
   */
  const buscarNoCache = useCallback(
    async (codigo: string): Promise<BemCacheado | null> => {
      const chave = normalizarCodigo(codigo);
      if (!chave || !usuarioId) return null;
      const atual = lerMeta();
      if (!atual || atual.usuario_id !== usuarioId) return null;

      for (const indice of ["chave_numero", "chave_qr", "chave_anterior"]) {
        const achado = await buscarPorIndice(indice, chave);
        if (achado) {
          return {
            id: achado.id,
            numero_patrimonio: achado.numero_patrimonio,
            codigo_qr: achado.codigo_qr,
            patrimonio_anterior: achado.patrimonio_anterior,
            descricao: achado.descricao,
            unidade_local_id: achado.unidade_local_id,
            situacao: achado.situacao,
            estado_conservacao: achado.estado_conservacao,
          };
        }
      }
      return null;
    },
    [usuarioId],
  );

  const cacheValido = !!meta && !!usuarioId && meta.usuario_id === usuarioId;

  return {
    buscarNoCache,
    atualizarCache,
    atualizandoCache: atualizando,
    /** Quantidade de bens no cache deste usuário (0 se não houver). */
    totalEmCache: cacheValido ? meta.total : 0,
    cacheAtualizadoEm: cacheValido ? meta.atualizado_em : null,
  };
}
