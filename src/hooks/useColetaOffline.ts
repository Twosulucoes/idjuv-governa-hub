/**
 * HOOK: COLETA OFFLINE
 * Gerencia coletas pendentes para sincronização quando offline
 *
 * Regras:
 * - Só cai na fila local quando o aparelho está offline ou a falha é transitória
 *   (requisição não chegou ao servidor, timeout 408 ou erro 5xx sem código Postgres).
 *   Erro devolvido pelo banco (RLS, CHECK, FK, duplicidade...) é mostrado ao usuário e
 *   NÃO vira "salvo localmente".
 * - A fila vive no localStorage, que é a fonte da verdade: toda gravação parte de
 *   `lerArmazenadas()` (não do estado React, que pode estar desatualizado).
 * - Na sincronização, o que foi gravado (ou já existia: 23505) sai do localStorage.
 *   O que o servidor recusou fica com `ultimo_erro` e é exposto em `coletasComErro`
 *   para o usuário decidir (`descartarColeta`).
 * - Foto: o upload é feito por quem chama, antes de salvar. Se havia foto capturada mas
 *   não há URL, a coleta é guardada sem foto e o usuário é avisado (sem conexão x falha
 *   no envio) para fotografar de novo.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ColetaPendente {
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
  /** Identificação do bem para exibir na fila (ex.: número de tombamento). Não vai ao banco. */
  rotulo?: string | null;
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
 * Falha transitória = vale tentar de novo depois (fila local):
 * - aparelho offline ou a requisição não chegou ao servidor (status 0, fetch falhou);
 * - timeout (408) ou erro de infraestrutura (5xx) sem código Postgres.
 * Erro com código Postgres (RLS, CHECK, FK...) é definitivo.
 */
function ehErroTransitorio(error: ErroSupabase | null | undefined, status?: number): boolean {
  if (typeof navigator !== "undefined" && !navigator.onLine) return true;
  if (status === 0) return true;
  if (!error) return false;
  if (error.code) return false;
  if (status === 408 || (typeof status === "number" && status >= 500)) return true;
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

/** Grava a fila inteira (lança se o armazenamento falhar, ex.: cota cheia). */
function gravarArmazenadas(lista: ColetaPendente[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
}

function pendentesDaCampanha(campanhaId: string): ColetaPendente[] {
  return lerArmazenadas().filter((c) => c.campanha_id === campanhaId && !c.synced);
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

/** Envia uma coleta; nunca lança (erro de fetch vira status 0). */
async function enviarColeta(
  coleta: Omit<ColetaPendente, "id" | "created_at" | "synced" | "ultimo_erro">,
): Promise<{ error: ErroSupabase | null; status?: number }> {
  try {
    const resposta = await supabase.from("coletas_inventario").insert(payloadColeta(coleta));
    return { error: resposta.error, status: resposta.status };
  } catch (err) {
    // fetch lançou: a requisição não chegou ao servidor
    return { error: { message: err instanceof Error ? err.message : String(err) }, status: 0 };
  }
}

export function useColetaOffline(campanhaId: string) {
  const [coletasPendentes, setColetasPendentes] = useState<ColetaPendente[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  // Trava de reentrada: evita dois syncs simultâneos (botão + evento "online").
  const sincronizandoRef = useRef(false);

  // Carregar coletas do localStorage
  useEffect(() => {
    setColetasPendentes(pendentesDaCampanha(campanhaId));
  }, [campanhaId]);

  // Ref sempre apontando para a versão mais recente de syncColetas, para o listener
  // de "online" não usar um closure obsoleto.
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
    // Sem conexão no momento do envio da foto x foto que falhou com conexão.
    const fotoSemConexao = !navigator.onLine;

    // Se online, tenta salvar diretamente
    if (isOnline && navigator.onLine) {
      const { error, status } = await enviarColeta(coleta);

      if (!error) {
        toast.success("Coleta registrada!");
        if (fotoPerdida) {
          toast.warning("Falha no envio da foto", {
            description: "A coleta foi registrada sem foto. Fotografe o bem de novo e tente enviar outra vez.",
          });
        }
        return true;
      }

      if (!ehErroTransitorio(error, status)) {
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
      // Falha transitória: segue para a fila local.
    }

    const novaColeta: ColetaPendente = {
      ...coleta,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      synced: false,
    };

    try {
      // Parte sempre do que está gravado (outras abas/syncs podem ter mudado a fila).
      gravarArmazenadas([...lerArmazenadas(), novaColeta]);
    } catch (e) {
      console.error("Erro ao guardar coleta offline:", e);
      toast.error("Não foi possível guardar a coleta no aparelho", {
        description: "Sem conexão e sem espaço no armazenamento local.",
      });
      return false;
    }
    if (novaColeta.campanha_id === campanhaId) {
      setColetasPendentes((prev) => [...prev, novaColeta]);
    }

    toast.info("Coleta salva localmente", {
      description: fotoPerdida
        ? fotoSemConexao
          ? "Será sincronizada quando houver conexão, mas sem a foto (sem conexão): fotografe o bem de novo depois."
          : "Será sincronizada quando houver conexão, mas sem a foto (falha no envio): fotografe o bem de novo depois."
        : "Será sincronizada quando houver conexão",
    });
    return true;
  }, [isOnline, campanhaId]);

  // Sincronizar coletas pendentes
  const syncColetas = useCallback(async () => {
    if (sincronizandoRef.current) return;
    if (!navigator.onLine) return;

    const pendentes = pendentesDaCampanha(campanhaId);
    if (pendentes.length === 0) return;

    sincronizandoRef.current = true;
    setIsSyncing(true);
    const sincronizadas = new Set<string>();
    const errosServidor = new Map<string, string>();

    try {
      for (const coleta of pendentes) {
        const { error, status } = await enviarColeta(coleta);

        if (!error || error.code === CODIGO_JA_EXISTE) {
          // Gravada agora ou já existia no servidor: sai da fila.
          sincronizadas.add(coleta.id);
        } else if (ehErroTransitorio(error, status)) {
          // Caiu a conexão / servidor indisponível: para e tenta de novo na próxima vez.
          break;
        } else {
          console.error("Erro ao sincronizar coleta:", error);
          errosServidor.set(coleta.id, error.message || "Recusada pelo servidor");
        }
      }

      // Remove as sincronizadas e anota o erro das recusadas (no armazenamento e no estado).
      const atualizar = (c: ColetaPendente): ColetaPendente =>
        errosServidor.has(c.id) ? { ...c, ultimo_erro: errosServidor.get(c.id) } : c;

      try {
        gravarArmazenadas(
          lerArmazenadas()
            .filter((c) => !sincronizadas.has(c.id))
            .map(atualizar),
        );
      } catch (e) {
        console.error("Erro ao atualizar coletas offline:", e);
      }
      setColetasPendentes((prev) => prev.filter((c) => !sincronizadas.has(c.id)).map(atualizar));
    } finally {
      sincronizandoRef.current = false;
      setIsSyncing(false);
    }

    if (sincronizadas.size > 0) {
      toast.success(`${sincronizadas.size} coleta(s) sincronizada(s)!`);
    }
    if (errosServidor.size > 0) {
      const [primeiro] = errosServidor.values();
      toast.error(`${errosServidor.size} coleta(s) recusada(s) pelo servidor`, {
        description: `Continuam guardadas no aparelho. Motivo: ${primeiro}`,
      });
    }
  }, [campanhaId]);

  /** Remove da fila uma coleta (ex.: recusada pelo servidor e que não vale reenviar). */
  const descartarColeta = useCallback((id: string) => {
    try {
      gravarArmazenadas(lerArmazenadas().filter((c) => c.id !== id));
    } catch (e) {
      console.error("Erro ao descartar coleta offline:", e);
      toast.error("Não foi possível descartar a coleta");
      return;
    }
    setColetasPendentes((prev) => prev.filter((c) => c.id !== id));
    toast.success("Coleta descartada");
  }, []);

  // Mantém a ref sincronizada com a última versão de syncColetas.
  useEffect(() => {
    syncColetasRef.current = syncColetas;
  }, [syncColetas]);

  const pendentes = coletasPendentes.filter((c) => !c.synced);

  return {
    coletasPendentes: pendentes,
    /** Pendentes que o servidor recusou na última sincronização (com o motivo em `ultimo_erro`). */
    coletasComErro: pendentes.filter((c) => !!c.ultimo_erro),
    salvarColeta,
    syncColetas,
    descartarColeta,
    isSyncing,
    isOnline,
    pendingCount: pendentes.length,
  };
}
