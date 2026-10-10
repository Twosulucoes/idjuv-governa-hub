/**
 * HOOK: COLETA OFFLINE
 * Gerencia coletas pendentes para sincronização quando offline
 *
 * Regras:
 * - Só cai na fila local quando o aparelho está offline ou a requisição não chegou ao
 *   servidor (erro de rede). Erro devolvido pelo banco (RLS, CHECK, FK, duplicidade...)
 *   é mostrado ao usuário e NÃO vira "salvo localmente".
 * - Na sincronização, o que foi gravado (ou já existia: 23505) sai do localStorage.
 * - Foto: o upload é feito por quem chama, antes de salvar. Se havia foto capturada mas
 *   não há URL (upload impossível sem conexão), a coleta é guardada sem foto e o usuário
 *   é avisado para fotografar de novo quando houver conexão.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ColetaPendente {
  id: string;
  campanha_id: string;
  bem_id: string;
  status_coleta: string;
  localizacao_encontrada_unidade_id?: string | null;
  localizacao_encontrada_sala?: string | null;
  localizacao_encontrada_detalhe?: string | null;
  observacoes?: string | null;
  foto_url?: string | null;
  coordenadas_gps?: { lat: number; lng: number } | null;
  data_coleta: string;
  created_at: string;
  synced: boolean;
  /** Última mensagem de erro do servidor ao sincronizar (item continua na fila). */
  ultimo_erro?: string | null;
}

type NovaColeta = Omit<ColetaPendente, "id" | "created_at" | "synced" | "ultimo_erro"> & {
  /** Informe true quando o usuário capturou uma foto; serve para avisar se ela não pôde ser enviada. */
  foto_capturada?: boolean;
};

interface ErroSupabase {
  message?: string;
  code?: string;
}

const STORAGE_KEY = "coletas_pendentes";

/** Código Postgres de violação de unicidade: a coleta deste bem já existe na campanha. */
const CODIGO_JA_EXISTE = "23505";

/**
 * Erro de rede = a requisição não chegou ao servidor (fetch falhou, sem resposta).
 * Nesse caso o PostgREST devolve status 0 e erro sem código Postgres.
 */
function ehErroDeRede(error: ErroSupabase | null | undefined, status?: number): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  if (status === 0) return true;
  if (!error) return false;
  if (error.code) return false;
  return /failed to fetch|fetch failed|networkerror|network request failed|load failed|timeout|aborted/i.test(
    error.message ?? "",
  );
}

function lerArmazenadas(): ColetaPendente[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? (parsed as ColetaPendente[]) : [];
  } catch (e) {
    console.error("Erro ao carregar coletas offline:", e);
    return [];
  }
}

function payloadColeta(coleta: Omit<ColetaPendente, "id" | "created_at" | "synced" | "ultimo_erro">) {
  return {
    campanha_id: coleta.campanha_id,
    bem_id: coleta.bem_id,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- types.ts não traz 'sem_etiqueta' no enum
    status_coleta: coleta.status_coleta as any,
    localizacao_encontrada_unidade_id: coleta.localizacao_encontrada_unidade_id,
    localizacao_encontrada_sala: coleta.localizacao_encontrada_sala,
    localizacao_encontrada_detalhe: coleta.localizacao_encontrada_detalhe,
    observacoes: coleta.observacoes,
    foto_url: coleta.foto_url,
    coordenadas_gps: coleta.coordenadas_gps,
    data_coleta: coleta.data_coleta,
  };
}

export function useColetaOffline(campanhaId: string) {
  const [coletasPendentes, setColetasPendentes] = useState<ColetaPendente[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Carregar coletas do localStorage
  useEffect(() => {
    setColetasPendentes(lerArmazenadas().filter((c) => c.campanha_id === campanhaId && !c.synced));
  }, [campanhaId]);

  // Ref sempre apontando para a versão mais recente de syncColetas, para evitar
  // que o listener de "online" capture um closure obsoleto (com a lista de
  // coletas pendentes vazia do primeiro render) e nunca sincronize ao reconectar.
  const syncColetasRef = useRef<() => void>(() => {});

  // Monitorar status de conexão
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Conexão restaurada", { description: "Sincronizando coletas..." });
      syncColetasRef.current();
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.warning("Sem conexão", { description: "Coletas serão salvas localmente" });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Salvar coleta
  const salvarColeta = useCallback(async ({ foto_capturada, ...coleta }: NovaColeta) => {
    const fotoPerdida = !!foto_capturada && !coleta.foto_url;

    // Se online, tenta salvar diretamente
    if (isOnline && navigator.onLine) {
      let error: ErroSupabase | null = null;
      let status: number | undefined;
      try {
        const resposta = await supabase.from("coletas_inventario").insert(payloadColeta(coleta));
        error = resposta.error;
        status = resposta.status;
      } catch (err) {
        // fetch lançou: a requisição não chegou ao servidor
        error = { message: err instanceof Error ? err.message : String(err) };
        status = 0;
      }

      if (!error) {
        toast.success("Coleta registrada!");
        if (fotoPerdida) {
          toast.warning("A foto não foi enviada", {
            description: "A coleta foi registrada sem foto. Fotografe o bem de novo quando houver conexão.",
          });
        }
        return true;
      }

      if (!ehErroDeRede(error, status)) {
        // Erro do servidor: mostra e não guarda localmente (reenviar daria o mesmo erro).
        console.error("Erro ao salvar coleta:", error);
        toast.error("Coleta não registrada", {
          description:
            error.code === CODIGO_JA_EXISTE
              ? "Este bem já foi conferido nesta campanha."
              : error.message || "O servidor recusou a coleta.",
        });
        return false;
      }
      // Erro de rede: segue para a fila local.
    }

    const novaColeta: ColetaPendente = {
      ...coleta,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      synced: false,
    };

    try {
      const outras = lerArmazenadas().filter((c) => c.campanha_id !== campanhaId);
      const atualizadas = [...coletasPendentes, novaColeta];
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...outras, ...atualizadas]));
      setColetasPendentes(atualizadas);
    } catch (e) {
      console.error("Erro ao guardar coleta offline:", e);
      toast.error("Não foi possível guardar a coleta no aparelho", {
        description: "Sem conexão e sem espaço no armazenamento local.",
      });
      return false;
    }

    toast.info("Coleta salva localmente", {
      description: fotoPerdida
        ? "Será sincronizada quando houver conexão, mas sem a foto: fotografe o bem de novo depois."
        : "Será sincronizada quando houver conexão",
    });
    return true;
  }, [isOnline, campanhaId, coletasPendentes]);

  // Sincronizar coletas pendentes
  const syncColetas = useCallback(async () => {
    const pendentes = coletasPendentes.filter(c => !c.synced);
    if (pendentes.length === 0 || !isOnline) return;

    setIsSyncing(true);
    const sincronizadas = new Set<string>();
    const errosServidor = new Map<string, string>();

    for (const coleta of pendentes) {
      let error: ErroSupabase | null = null;
      let status: number | undefined;
      try {
        const resposta = await supabase.from("coletas_inventario").insert(payloadColeta(coleta));
        error = resposta.error;
        status = resposta.status;
      } catch (err) {
        error = { message: err instanceof Error ? err.message : String(err) };
        status = 0;
      }

      if (!error || error.code === CODIGO_JA_EXISTE) {
        // Gravada agora ou já existia no servidor: sai da fila.
        sincronizadas.add(coleta.id);
      } else if (ehErroDeRede(error, status)) {
        // Caiu a conexão: para e tenta de novo na próxima vez.
        break;
      } else {
        console.error("Erro ao sincronizar coleta:", error);
        errosServidor.set(coleta.id, error.message || "Recusada pelo servidor");
      }
    }

    // Atualiza estado e localStorage: remove as sincronizadas, anota o erro das recusadas.
    const atualizar = (c: ColetaPendente): ColetaPendente =>
      errosServidor.has(c.id) ? { ...c, ultimo_erro: errosServidor.get(c.id) } : c;

    const restantes = coletasPendentes.filter(c => !sincronizadas.has(c.id)).map(atualizar);
    setColetasPendentes(restantes);

    try {
      const remaining = lerArmazenadas()
        .filter((c) => !sincronizadas.has(c.id))
        .map(atualizar);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    } catch (e) {
      console.error("Erro ao atualizar coletas offline:", e);
    }

    setIsSyncing(false);

    if (sincronizadas.size > 0) {
      toast.success(`${sincronizadas.size} coleta(s) sincronizada(s)!`);
    }
    if (errosServidor.size > 0) {
      const [primeiro] = errosServidor.values();
      toast.error(`${errosServidor.size} coleta(s) recusada(s) pelo servidor`, {
        description: `Continuam guardadas no aparelho. Motivo: ${primeiro}`,
      });
    }
  }, [coletasPendentes, isOnline]);

  // Mantém a ref sincronizada com a última versão de syncColetas.
  useEffect(() => {
    syncColetasRef.current = syncColetas;
  }, [syncColetas]);

  return {
    coletasPendentes: coletasPendentes.filter(c => !c.synced),
    salvarColeta,
    syncColetas,
    isSyncing,
    isOnline,
    pendingCount: coletasPendentes.filter(c => !c.synced).length,
  };
}
