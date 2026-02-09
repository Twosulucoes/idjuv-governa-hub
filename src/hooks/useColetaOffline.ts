/**
 * HOOK: COLETA OFFLINE
 * Gerencia coletas pendentes para sincronização quando offline
 */

import { useState, useEffect, useCallback } from "react";
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
}

const STORAGE_KEY = "coletas_pendentes";

export function useColetaOffline(campanhaId: string) {
  const [coletasPendentes, setColetasPendentes] = useState<ColetaPendente[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Carregar coletas do localStorage
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setColetasPendentes(parsed.filter((c: ColetaPendente) => c.campanha_id === campanhaId));
      } catch (e) {
        console.error("Erro ao carregar coletas offline:", e);
      }
    }
  }, [campanhaId]);

  // Monitorar status de conexão
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success("Conexão restaurada", { description: "Sincronizando coletas..." });
      syncColetas();
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
  const salvarColeta = useCallback(async (coleta: Omit<ColetaPendente, "id" | "created_at" | "synced">) => {
    const novaColeta: ColetaPendente = {
      ...coleta,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
      synced: false,
    };

    // Se online, tenta salvar diretamente
    if (isOnline) {
      try {
        const { error } = await supabase.from("coletas_inventario").insert({
          campanha_id: coleta.campanha_id,
          bem_id: coleta.bem_id,
          status_coleta: coleta.status_coleta as any,
          localizacao_encontrada_unidade_id: coleta.localizacao_encontrada_unidade_id,
          localizacao_encontrada_sala: coleta.localizacao_encontrada_sala,
          localizacao_encontrada_detalhe: coleta.localizacao_encontrada_detalhe,
          observacoes: coleta.observacoes,
          foto_url: coleta.foto_url,
          coordenadas_gps: coleta.coordenadas_gps,
          data_coleta: coleta.data_coleta,
        });

        if (error) throw error;

        toast.success("Coleta registrada!");
        return true;
      } catch (error) {
        console.error("Erro ao salvar coleta:", error);
        // Fallback para offline
      }
    }

    // Salva localmente
    const updated = [...coletasPendentes, novaColeta];
    setColetasPendentes(updated);
    
    // Persist all campaigns' pending collections
    const allStored = localStorage.getItem(STORAGE_KEY);
    const allColetas = allStored ? JSON.parse(allStored) : [];
    const otherColetas = allColetas.filter((c: ColetaPendente) => c.campanha_id !== campanhaId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...otherColetas, ...updated]));

    toast.info("Coleta salva localmente", { description: "Será sincronizada quando houver conexão" });
    return true;
  }, [isOnline, campanhaId, coletasPendentes]);

  // Sincronizar coletas pendentes
  const syncColetas = useCallback(async () => {
    const pendentes = coletasPendentes.filter(c => !c.synced);
    if (pendentes.length === 0 || !isOnline) return;

    setIsSyncing(true);
    let syncedCount = 0;

    for (const coleta of pendentes) {
      try {
        const { error } = await supabase.from("coletas_inventario").insert({
          campanha_id: coleta.campanha_id,
          bem_id: coleta.bem_id,
          status_coleta: coleta.status_coleta as any,
          localizacao_encontrada_unidade_id: coleta.localizacao_encontrada_unidade_id,
          localizacao_encontrada_sala: coleta.localizacao_encontrada_sala,
          localizacao_encontrada_detalhe: coleta.localizacao_encontrada_detalhe,
          observacoes: coleta.observacoes,
          foto_url: coleta.foto_url,
          coordenadas_gps: coleta.coordenadas_gps,
          data_coleta: coleta.data_coleta,
        });

        if (!error) {
          coleta.synced = true;
          syncedCount++;
        }
      } catch (err) {
        console.error("Erro ao sincronizar coleta:", err);
      }
    }

    // Atualiza estado local
    const updated = coletasPendentes.map(c => 
      pendentes.find(p => p.id === c.id)?.synced ? { ...c, synced: true } : c
    );
    setColetasPendentes(updated.filter(c => !c.synced));
    
    // Atualiza localStorage
    const allStored = localStorage.getItem(STORAGE_KEY);
    const allColetas = allStored ? JSON.parse(allStored) : [];
    const remaining = allColetas.filter((c: ColetaPendente) => 
      c.campanha_id !== campanhaId || !c.synced
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));

    setIsSyncing(false);

    if (syncedCount > 0) {
      toast.success(`${syncedCount} coleta(s) sincronizada(s)!`);
    }
  }, [coletasPendentes, isOnline, campanhaId]);

  return {
    coletasPendentes: coletasPendentes.filter(c => !c.synced),
    salvarColeta,
    syncColetas,
    isSyncing,
    isOnline,
    pendingCount: coletasPendentes.filter(c => !c.synced).length,
  };
}
