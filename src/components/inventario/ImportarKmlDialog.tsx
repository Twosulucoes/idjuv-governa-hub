/**
 * DIALOG: IMPORTAR KML DE UNIDADES
 * Lê o arquivo no navegador, sugere a unidade de cada placemark pelo nome e
 * grava coordenadas/polígono após confirmação manual.
 */

import { useMemo, useState } from "react";
import { FileUp, Loader2, MapPin, Shapes } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUnidadesLocaisPatrimonio } from "@/hooks/usePatrimonio";
import { useAtualizarGeometriaUnidade, type AtualizacaoGeometriaUnidade } from "@/hooks/useVistoriaInventario";
import { centroide, parseKml, sugerirCorrespondencia } from "@/lib/kml";
import type { PlacemarkKml } from "@/types/inventarioCampo";

interface ImportarKmlDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const IGNORAR = "__ignorar";
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;

interface LinhaImportacao {
  placemark: PlacemarkKml;
  unidadeId: string;
}

export function ImportarKmlDialog({ open, onOpenChange }: ImportarKmlDialogProps) {
  const { data: unidades = [], isLoading: carregandoUnidades } = useUnidadesLocaisPatrimonio();
  const atualizarGeometria = useAtualizarGeometriaUnidade();

  const [nomeArquivo, setNomeArquivo] = useState<string | null>(null);
  const [linhas, setLinhas] = useState<LinhaImportacao[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const [lendo, setLendo] = useState(false);

  const limpar = () => {
    setNomeArquivo(null);
    setLinhas([]);
    setErro(null);
  };

  const handleArquivo = async (arquivo: File | undefined) => {
    limpar();
    if (!arquivo) return;
    if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
      setErro("Arquivo maior que 5 MB.");
      return;
    }
    setNomeArquivo(arquivo.name);
    setLendo(true);
    try {
      const placemarks = parseKml(await arquivo.text());
      if (placemarks.length === 0) {
        setErro("Nenhum ponto ou polígono válido encontrado no arquivo.");
        return;
      }
      setLinhas(
        placemarks.map((p) => ({
          placemark: p,
          unidadeId: sugerirCorrespondencia(p.nome, unidades, (u) => u.nome_unidade)?.id ?? IGNORAR,
        })),
      );
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível ler o arquivo.");
    } finally {
      setLendo(false);
    }
  };

  const selecionadas = useMemo(() => linhas.filter((l) => l.unidadeId !== IGNORAR), [linhas]);
  const unidadesRepetidas = useMemo(() => {
    const vistos = new Set<string>();
    let repetidas = 0;
    selecionadas.forEach((l) => {
      if (vistos.has(l.unidadeId)) repetidas++;
      vistos.add(l.unidadeId);
    });
    return repetidas;
  }, [selecionadas]);

  const handleAplicar = async () => {
    const porUnidade = new Map<string, AtualizacaoGeometriaUnidade>();
    for (const { placemark, unidadeId } of selecionadas) {
      if (porUnidade.has(unidadeId)) continue; // a primeira linha escolhida prevalece
      const ponto = placemark.ponto ?? (placemark.poligono ? centroide(placemark.poligono) : null);
      if (!ponto && !placemark.poligono) continue;
      porUnidade.set(unidadeId, {
        unidadeLocalId: unidadeId,
        latitude: ponto?.lat ?? null,
        longitude: ponto?.lon ?? null,
        poligono: placemark.poligono,
      });
    }
    if (porUnidade.size === 0) return;
    try {
      await atualizarGeometria.mutateAsync([...porUnidade.values()]);
    } catch {
      return; // o erro já é exibido pelo onError do hook; mantém o diálogo aberto
    }
    limpar();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) limpar();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importar KML</DialogTitle>
          <DialogDescription>
            Associe cada local do arquivo a uma unidade cadastrada. As sugestões são feitas pelo nome; confira antes de aplicar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="arquivo-kml">Arquivo .kml</Label>
            <Input
              id="arquivo-kml"
              type="file"
              accept=".kml,application/vnd.google-earth.kml+xml"
              disabled={carregandoUnidades || lendo}
              onChange={(e) => {
                void handleArquivo(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            {nomeArquivo && <p className="text-xs text-muted-foreground break-all">{nomeArquivo}</p>}
          </div>

          {(lendo || carregandoUnidades) && (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {lendo ? "Lendo arquivo..." : "Carregando unidades..."}
            </p>
          )}

          {erro && (
            <Alert variant="destructive">
              <AlertDescription>{erro}</AlertDescription>
            </Alert>
          )}

          {linhas.length > 0 && (
            <>
              <p className="text-sm text-muted-foreground">
                {linhas.length} local(is) no arquivo · {selecionadas.length} associado(s)
              </p>
              {unidadesRepetidas > 0 && (
                <Alert>
                  <AlertDescription>
                    {unidadesRepetidas} unidade(s) escolhida(s) mais de uma vez; vale a primeira linha.
                  </AlertDescription>
                </Alert>
              )}
              <ScrollArea className="h-[45vh] rounded-md border">
                <div className="divide-y">
                  {linhas.map((linha, i) => (
                    <div key={`${linha.placemark.nome}-${i}`} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{linha.placemark.nome}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {linha.placemark.ponto && (
                            <Badge variant="outline" className="gap-1 text-xs">
                              <MapPin className="h-3 w-3" /> Ponto
                            </Badge>
                          )}
                          {linha.placemark.poligono && (
                            <Badge variant="outline" className="gap-1 text-xs">
                              <Shapes className="h-3 w-3" /> Polígono
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Select
                        value={linha.unidadeId}
                        onValueChange={(v) =>
                          setLinhas((atual) => atual.map((l, j) => (j === i ? { ...l, unidadeId: v } : l)))
                        }
                      >
                        <SelectTrigger className="w-full sm:w-72">
                          <SelectValue placeholder="Escolha a unidade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={IGNORAR}>Ignorar</SelectItem>
                          {unidades.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.nome_unidade}
                              {u.municipio ? ` — ${u.municipio}` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => void handleAplicar()}
            disabled={selecionadas.length === 0 || atualizarGeometria.isPending}
          >
            {atualizarGeometria.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileUp className="mr-2 h-4 w-4" />
            )}
            Aplicar ({selecionadas.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
