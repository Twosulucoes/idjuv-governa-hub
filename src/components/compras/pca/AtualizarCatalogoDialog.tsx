/**
 * Atualização do catálogo CATMAT/CATSER (cópia local dos tipos de material e dos serviços), página por página.
 * Mostra a data da última atualização de cada parte. Só para quem edita o PCA.
 */

import { useState } from "react";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSincronizacoesCatalogo, useSincronizarCatalogo } from "@/hooks/usePca";

const dataHora = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export function AtualizarCatalogoDialog() {
  const [aberto, setAberto] = useState(false);
  const [progresso, setProgresso] = useState("");
  const { data: sinc } = useSincronizacoesCatalogo();
  const sincronizar = useSincronizarCatalogo();
  const ultima = (tipo: string) => sinc?.find((s) => s.tipo === tipo);
  const vazio = !ultima("pdm") || !ultima("servico");

  const linha = (tipo: string, nome: string) => {
    const s = ultima(tipo);
    return (
      <li>
        <span className="font-medium">{nome}:</span>{" "}
        {s ? `${s.total.toLocaleString("pt-BR")} em ${dataHora(s.atualizado_em)}` : "ainda não baixado"}
      </li>
    );
  };

  return (
    <>
      <Button variant={vazio ? "default" : "outline"} onClick={() => setAberto(true)}>
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        {vazio ? "Baixar catálogo" : "Atualizar catálogo"}
      </Button>
      <Dialog open={aberto} onOpenChange={(o) => !sincronizar.isPending && setAberto(o)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Catálogo de materiais e serviços</DialogTitle>
            <DialogDescription>
              Cópia do CATMAT e do CATSER do governo federal (Compras.gov.br), usada para classificar os itens do PCA.
              Leva alguns minutos; deixe esta janela aberta.
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-1 text-sm">
            {linha("pdm", "Tipos de material")}
            {linha("servico", "Serviços")}
          </ul>
          {sincronizar.isPending && (
            <p className="flex items-center gap-2 text-sm" aria-live="polite">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              {progresso}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)} disabled={sincronizar.isPending}>Fechar</Button>
            <Button onClick={() => sincronizar.mutate(setProgresso)} disabled={sincronizar.isPending}>
              {vazio ? "Baixar agora" : "Atualizar agora"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
