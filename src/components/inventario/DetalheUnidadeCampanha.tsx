/**
 * COMPONENTE: DETALHE DA UNIDADE NA CAMPANHA (painel de campo)
 * Dados da unidade, coordenadas, situação/observação e galeria de evidências.
 * Use `key={unidade.id}` no pai para reiniciar o formulário ao trocar de unidade.
 */

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, ExternalLink, ImageIcon, Loader2, MapPin, Save, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAtualizarSituacaoUnidade, useFotosUnidade } from "@/hooks/useVistoriaInventario";
import {
  SITUACAO_UNIDADE_CONFIG,
  SITUACOES_UNIDADE,
  type SituacaoUnidadeCampanha,
  type UnidadeCampanha,
} from "@/types/inventarioCampo";

interface DetalheUnidadeCampanhaProps {
  unidadeCampanha: UnidadeCampanha;
  /** Pode alterar situação/observação (patrimonio.tramitar) */
  podeEditar: boolean;
}

function formatarDataHora(iso: string | null | undefined): string {
  if (!iso) return "-";
  try {
    return format(new Date(iso), "dd/MM/yyyy HH:mm", { locale: ptBR });
  } catch {
    return "-";
  }
}

export function DetalheUnidadeCampanha({ unidadeCampanha, podeEditar }: DetalheUnidadeCampanhaProps) {
  const u = unidadeCampanha.unidade;
  const atualizar = useAtualizarSituacaoUnidade();
  const { data: fotos, isLoading: carregandoFotos } = useFotosUnidade(
    unidadeCampanha.campanha_id,
    unidadeCampanha.unidade_local_id,
  );

  const [situacao, setSituacao] = useState<SituacaoUnidadeCampanha>(unidadeCampanha.situacao);
  const [observacao, setObservacao] = useState(unidadeCampanha.observacao || "");
  const [equipe, setEquipe] = useState(unidadeCampanha.equipe || "");
  const [dataPrevista, setDataPrevista] = useState(unidadeCampanha.data_prevista || "");

  const temCoordenada = u?.latitude !== null && u?.latitude !== undefined && u?.longitude !== null && u?.longitude !== undefined;
  const cfg = SITUACAO_UNIDADE_CONFIG[unidadeCampanha.situacao] ?? SITUACAO_UNIDADE_CONFIG.a_visitar;

  const handleSalvar = () => {
    if (!podeEditar) return;
    atualizar.mutate({
      atual: unidadeCampanha,
      situacao,
      observacao,
      equipe,
      data_prevista: dataPrevista,
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="text-lg">{u?.nome_unidade || "Unidade"}</CardTitle>
            <CardDescription>
              {[u?.codigo_unidade, u?.municipio, u?.tipo_unidade].filter(Boolean).join(" · ") || "-"}
            </CardDescription>
          </div>
          <Badge variant="outline" className={`${cfg.badge} border-0`}>
            {cfg.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Dados e coordenadas */}
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          {u?.endereco_completo && (
            <div className="sm:col-span-2">
              <span className="text-muted-foreground">Endereço: </span>
              {u.endereco_completo}
            </div>
          )}
          {u?.area_construida_m2 !== null && u?.area_construida_m2 !== undefined && (
            <div>
              <span className="text-muted-foreground">Área construída: </span>
              {u.area_construida_m2.toLocaleString("pt-BR")} m²
            </div>
          )}
          <div>
            <span className="text-muted-foreground">Iniciada em: </span>
            {formatarDataHora(unidadeCampanha.iniciada_em)}
          </div>
          <div>
            <span className="text-muted-foreground">Concluída em: </span>
            {formatarDataHora(unidadeCampanha.concluida_em)}
          </div>
          {temCoordenada ? (
            <div className="flex items-center gap-1 sm:col-span-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-mono text-xs">
                {u!.latitude!.toFixed(6)}, {u!.longitude!.toFixed(6)}
              </span>
              {u?.poligono_geojson && <Badge variant="outline" className="ml-2 text-xs">com polígono</Badge>}
            </div>
          ) : (
            <Alert className="sm:col-span-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Unidade sem coordenada: ela não aparece no mapa. Use "Importar KML" para gravar a localização.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Situação */}
        {!podeEditar ? (
          <div className="grid gap-2 text-sm sm:grid-cols-3">
            <div>
              <span className="text-muted-foreground">Equipe: </span>
              {unidadeCampanha.equipe || "-"}
            </div>
            <div>
              <span className="text-muted-foreground">Data prevista: </span>
              {unidadeCampanha.data_prevista
                ? format(new Date(`${unidadeCampanha.data_prevista}T00:00:00`), "dd/MM/yyyy", { locale: ptBR })
                : "-"}
            </div>
            <div className="sm:col-span-3">
              <span className="text-muted-foreground">Observação: </span>
              <span className="whitespace-pre-wrap">{unidadeCampanha.observacao || "-"}</span>
            </div>
          </div>
        ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Situação</Label>
            <Select value={situacao} onValueChange={(v) => setSituacao(v as SituacaoUnidadeCampanha)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SITUACOES_UNIDADE.map((s) => (
                  <SelectItem key={s} value={s}>
                    {SITUACAO_UNIDADE_CONFIG[s].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="equipe-unidade">Equipe</Label>
            <Input id="equipe-unidade" value={equipe} onChange={(e) => setEquipe(e.target.value)} maxLength={200} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="data-prevista-unidade">Data prevista</Label>
            <Input
              id="data-prevista-unidade"
              type="date"
              value={dataPrevista}
              onChange={(e) => setDataPrevista(e.target.value)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-3">
            <Label htmlFor="observacao-unidade">Observação</Label>
            <Textarea
              id="observacao-unidade"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={3}
              maxLength={2000}
            />
          </div>
          <div className="sm:col-span-3">
            <Button onClick={handleSalvar} disabled={atualizar.isPending} className="w-full sm:w-auto">
              {atualizar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar
            </Button>
          </div>
        </div>
        )}

        {/* Galeria */}
        <div className="space-y-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            <ImageIcon className="h-4 w-4" />
            Fotos de evidência ({fotos?.length || 0})
          </h3>
          {carregandoFotos ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="aspect-square" />
              ))}
            </div>
          ) : !fotos || fotos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma foto enviada para esta unidade.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {fotos.map((f) => (
                <figure key={f.id} className="overflow-hidden rounded-md border bg-muted/30">
                  {f.url_assinada ? (
                    <a href={f.url_assinada} target="_blank" rel="noopener noreferrer" className="group relative block">
                      <img
                        src={f.url_assinada}
                        alt={f.legenda || "Foto de vistoria"}
                        loading="lazy"
                        className="aspect-square w-full object-cover"
                      />
                      <ExternalLink className="absolute right-1 top-1 h-4 w-4 text-white opacity-0 drop-shadow group-hover:opacity-100" />
                    </a>
                  ) : (
                    <div className="flex aspect-square items-center justify-center text-xs text-muted-foreground">
                      Imagem indisponível
                    </div>
                  )}
                  <figcaption className="space-y-0.5 p-2 text-xs">
                    {f.legenda && <p className="line-clamp-2 font-medium">{f.legenda}</p>}
                    <p className="text-muted-foreground">{formatarDataHora(f.capturada_em)}</p>
                    <p className="text-muted-foreground">
                      {f.precisao_m !== null ? `GPS ±${Math.round(f.precisao_m)} m` : "Sem GPS"}
                    </p>
                    {f.tem_pessoa && (
                      <Badge variant="outline" className="gap-1 text-[10px]">
                        <Users className="h-3 w-3" /> pessoa na foto
                      </Badge>
                    )}
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
