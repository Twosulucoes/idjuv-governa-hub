/**
 * Assistente de importação numa janela, aberto na tela do setor dono do arquivo.
 * `useImportadorDaUrl` liga a janela a `?importador=<id>`: os atalhos (painéis, histórico da Administração)
 * levam direto ao assistente, e só abre se o usuário tiver a permissão do importador.
 */

import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { obterImportador } from "@/lib/importacao/registro";
import type { Importador } from "@/lib/importacao/types";
import { ImportacaoWizard } from "./ImportacaoWizard";

interface Props {
  importador: Importador<unknown> | null;
  onFechar: () => void;
}

export function ImportacaoDialog({ importador, onFechar }: Props) {
  const [ocupado, setOcupado] = useState(false);
  return (
    <Dialog open={!!importador} onOpenChange={(aberto) => !aberto && !ocupado && onFechar()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Importar {importador?.titulo}</DialogTitle>
          <DialogDescription>{importador?.descricao}</DialogDescription>
        </DialogHeader>
        {importador && <ImportacaoWizard importador={importador} onOcupadoChange={setOcupado} />}
      </DialogContent>
    </Dialog>
  );
}

/** Importador aberto pela URL (`?importador=<id>`), restrito aos `ids` da tela e à permissão do usuário. */
export function useImportadorDaUrl(ids: string[]) {
  const { hasPermission } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const pedido = searchParams.get("importador");
  const importador = pedido && ids.includes(pedido) ? obterImportador(pedido) : undefined;
  const aberto = importador && hasPermission(importador.permissao) ? importador : null;

  const abrir = (id: string) =>
    setSearchParams((p) => { p.set("importador", id); return p; });
  // Tira o parâmetro para o assistente não reabrir ao recarregar a página
  const fechar = () =>
    setSearchParams((p) => { p.delete("importador"); return p; }, { replace: true });

  return { aberto, abrir, fechar };
}
