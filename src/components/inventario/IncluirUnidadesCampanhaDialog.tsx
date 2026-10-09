/**
 * DIALOG: INCLUIR UNIDADES NA CAMPANHA
 * Multisseleção das unidades locais que a equipe de campo deve vistoriar.
 */

import { useMemo, useState } from "react";
import { Loader2, Plus, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useUnidadesLocaisPatrimonio } from "@/hooks/usePatrimonio";
import { useIncluirUnidadesNaCampanha } from "@/hooks/useVistoriaInventario";
import { normalizarNome } from "@/lib/kml";
import { semAcento } from "@/lib/texto";

interface IncluirUnidadesCampanhaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campanhaId: string;
  /** unidade_local_id das unidades que já estão na campanha */
  idsJaIncluidos: string[];
}


export function IncluirUnidadesCampanhaDialog({
  open,
  onOpenChange,
  campanhaId,
  idsJaIncluidos,
}: IncluirUnidadesCampanhaDialogProps) {
  const { data: unidades = [], isLoading } = useUnidadesLocaisPatrimonio();
  const incluir = useIncluirUnidadesNaCampanha();
  const [busca, setBusca] = useState("");
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set());

  const jaIncluidas = useMemo(() => new Set(idsJaIncluidos), [idsJaIncluidos]);

  const disponiveis = useMemo(() => {
    const termo = semAcento(busca.trim());
    return unidades
      .filter((u) => !jaIncluidas.has(u.id))
      .filter((u) => {
        if (!termo) return true;
        return (
          semAcento(u.nome_unidade).includes(termo) ||
          semAcento(u.municipio).includes(termo) ||
          semAcento(u.codigo_unidade).includes(termo) ||
          normalizarNome(u.nome_unidade).includes(normalizarNome(busca))
        );
      });
  }, [unidades, jaIncluidas, busca]);

  const alternar = (id: string, marcado: boolean) => {
    setSelecionadas((atual) => {
      const novo = new Set(atual);
      if (marcado) novo.add(id);
      else novo.delete(id);
      return novo;
    });
  };

  const todasFiltradasMarcadas = disponiveis.length > 0 && disponiveis.every((u) => selecionadas.has(u.id));

  const alternarTodas = () => {
    setSelecionadas((atual) => {
      const novo = new Set(atual);
      disponiveis.forEach((u) => (todasFiltradasMarcadas ? novo.delete(u.id) : novo.add(u.id)));
      return novo;
    });
  };

  const fechar = (v: boolean) => {
    if (!v) {
      setBusca("");
      setSelecionadas(new Set());
    }
    onOpenChange(v);
  };

  const handleIncluir = async () => {
    try {
      await incluir.mutateAsync({ campanhaId, unidadeIds: [...selecionadas] });
    } catch {
      return; // o erro já é exibido pelo onError do hook; mantém o diálogo aberto
    }
    fechar(false);
  };

  return (
    <Dialog open={open} onOpenChange={fechar}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Incluir unidades na campanha</DialogTitle>
          <DialogDescription>
            Selecione as unidades que serão vistoriadas. Unidades já incluídas não aparecem na lista.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome, município ou código"
              className="pl-9"
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {disponiveis.length} disponível(is) · {selecionadas.size} selecionada(s)
            </span>
            <Button variant="link" size="sm" onClick={alternarTodas} disabled={disponiveis.length === 0}>
              {todasFiltradasMarcadas ? "Desmarcar filtradas" : "Marcar filtradas"}
            </Button>
          </div>

          <ScrollArea className="h-[50vh] rounded-md border">
            {isLoading ? (
              <p className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando unidades...
              </p>
            ) : disponiveis.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">Nenhuma unidade disponível.</p>
            ) : (
              <div className="divide-y">
                {disponiveis.map((u) => {
                  const idCampo = `incluir-unidade-${u.id}`;
                  return (
                    <label key={u.id} htmlFor={idCampo} className="flex cursor-pointer items-start gap-3 p-3 hover:bg-muted/50">
                      <Checkbox
                        id={idCampo}
                        checked={selecionadas.has(u.id)}
                        onCheckedChange={(v) => alternar(u.id, v === true)}
                        className="mt-0.5"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{u.nome_unidade}</p>
                        <p className="text-xs text-muted-foreground">
                          {[u.codigo_unidade, u.municipio, u.tipo_unidade].filter(Boolean).join(" · ")}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => fechar(false)}>
            Cancelar
          </Button>
          <Button onClick={() => void handleIncluir()} disabled={selecionadas.size === 0 || incluir.isPending}>
            {incluir.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Incluir ({selecionadas.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
