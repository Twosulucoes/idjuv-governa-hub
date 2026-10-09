/**
 * PÁGINA: PAINEL DE CAMPO DA CAMPANHA DE INVENTÁRIO
 * Mapa (satélite/ruas), contadores por situação, lista filtrável das unidades
 * e detalhe com fotos de evidência.
 */

import { useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, ImageIcon, Layers, MapPin, Plus, Search, Upload } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapaUnidadesCampanha } from "@/components/inventario/MapaUnidadesCampanha";
import { DetalheUnidadeCampanha } from "@/components/inventario/DetalheUnidadeCampanha";
import { ImportarKmlDialog } from "@/components/inventario/ImportarKmlDialog";
import { IncluirUnidadesCampanhaDialog } from "@/components/inventario/IncluirUnidadesCampanhaDialog";
import { useAuth } from "@/contexts/AuthContext";
import { useCampanhaInventario } from "@/hooks/usePatrimonio";
import { useContagemFotosCampanha, useUnidadesCampanha } from "@/hooks/useVistoriaInventario";
import { semAcento } from "@/lib/texto";
import {
  SITUACAO_UNIDADE_CONFIG,
  SITUACOES_UNIDADE,
  type SituacaoUnidadeCampanha,
} from "@/types/inventarioCampo";

const TODAS = "todas";


export default function PainelCampoInventarioPage() {
  const { id } = useParams<{ id: string }>();
  const { hasPermission } = useAuth();
  // Escrita (situação, inclusão de unidades, KML) exige tramitar; a RLS é a barreira real
  const podeEditar = hasPermission("patrimonio.tramitar");
  const { data: campanha, isLoading: carregandoCampanha } = useCampanhaInventario(id);
  const { data: unidades = [], isLoading: carregandoUnidades } = useUnidadesCampanha(id);
  const { data: contagemFotos } = useContagemFotosCampanha(id);

  const [selecionadaId, setSelecionadaId] = useState<string | null>(null);
  const [filtroSituacao, setFiltroSituacao] = useState<SituacaoUnidadeCampanha | typeof TODAS>(TODAS);
  const [busca, setBusca] = useState("");
  const [incluirAberto, setIncluirAberto] = useState(false);
  const [kmlAberto, setKmlAberto] = useState(false);
  const detalheRef = useRef<HTMLDivElement>(null);

  const contadores = useMemo(() => {
    const c = Object.fromEntries(SITUACOES_UNIDADE.map((s) => [s, 0])) as Record<SituacaoUnidadeCampanha, number>;
    unidades.forEach((u) => {
      c[u.situacao] = (c[u.situacao] || 0) + 1;
    });
    return c;
  }, [unidades]);

  const consideradas = unidades.length - contadores.excluida;
  const percentualConcluidas = consideradas > 0 ? (contadores.concluida / consideradas) * 100 : 0;
  const semCoordenada = unidades.filter(
    (u) => !u.unidade || u.unidade.latitude === null || u.unidade.longitude === null,
  ).length;

  const filtradas = useMemo(() => {
    const termo = semAcento(busca.trim());
    return unidades.filter((u) => {
      if (filtroSituacao !== TODAS && u.situacao !== filtroSituacao) return false;
      if (!termo) return true;
      return (
        semAcento(u.unidade?.nome_unidade).includes(termo) ||
        semAcento(u.unidade?.municipio).includes(termo) ||
        semAcento(u.unidade?.codigo_unidade).includes(termo)
      );
    });
  }, [unidades, filtroSituacao, busca]);

  const selecionada = unidades.find((u) => u.id === selecionadaId) || null;

  const selecionar = (unidadeCampanhaId: string) => {
    setSelecionadaId(unidadeCampanhaId);
    // Em telas estreitas (abaixo de lg) o detalhe fica abaixo do mapa e da lista
    if (window.matchMedia("(max-width: 1023px)").matches) {
      requestAnimationFrame(() => detalheRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  if (carregandoCampanha) {
    return (
      <ModuleLayout module="patrimonio">
        <section className="py-6">
          <div className="container mx-auto space-y-4 px-4">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-[360px] w-full" />
          </div>
        </section>
      </ModuleLayout>
    );
  }

  if (!campanha || !id) {
    return (
      <ModuleLayout module="patrimonio">
        <section className="py-12">
          <div className="container mx-auto px-4 text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold">Campanha não encontrada</h2>
            <Button asChild>
              <Link to="/inventario/campanhas">Voltar para Campanhas</Link>
            </Button>
          </div>
        </section>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout module="patrimonio">
      {/* Cabeçalho */}
      <section className="bg-secondary py-6 text-secondary-foreground">
        <div className="container mx-auto px-4">
          <div className="mb-3 flex flex-wrap items-center gap-2 text-sm opacity-80">
            <Link to="/inventario" className="hover:underline">Inventário</Link>
            <span>/</span>
            <Link to="/inventario/campanhas" className="hover:underline">Campanhas</Link>
            <span>/</span>
            <Link to={`/inventario/campanhas/${id}`} className="hover:underline">Detalhes</Link>
            <span>/</span>
            <span>Painel de campo</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Layers className="h-8 w-8" />
              <div>
                <h1 className="font-serif text-2xl font-bold">{campanha.nome}</h1>
                <p className="text-sm opacity-90">Painel de campo · vistoria das unidades</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {podeEditar && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setIncluirAberto(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Incluir unidades
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setKmlAberto(true)}>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar KML
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" asChild>
                <Link to={`/inventario/campanhas/${id}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Voltar
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Contadores */}
      <section className="py-4">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {SITUACOES_UNIDADE.map((s) => {
              const cfg = SITUACAO_UNIDADE_CONFIG[s];
              const ativo = filtroSituacao === s;
              return (
                <Card
                  key={s}
                  role="button"
                  tabIndex={0}
                  onClick={() => setFiltroSituacao(ativo ? TODAS : s)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") setFiltroSituacao(ativo ? TODAS : s);
                  }}
                  className={`cursor-pointer transition-colors ${ativo ? "border-primary" : "hover:border-primary/50"}`}
                >
                  <CardContent className="p-3">
                    <p className="text-xs text-muted-foreground">{cfg.label}</p>
                    <p className={`text-2xl font-bold ${cfg.texto}`}>{contadores[s]}</p>
                  </CardContent>
                </Card>
              );
            })}
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">Concluídas</p>
                <p className="text-2xl font-bold">{percentualConcluidas.toFixed(0)}%</p>
                <Progress value={percentualConcluidas} className="mt-1 h-1.5" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ImageIcon className="h-3 w-3" /> Fotos
                </p>
                <p className="text-2xl font-bold">{contagemFotos?.total ?? 0}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Mapa + lista */}
      <section className="pb-4">
        <div className="container mx-auto grid gap-4 px-4 lg:grid-cols-3">
          <div className="space-y-2 lg:col-span-2">
            <MapaUnidadesCampanha
              unidades={filtradas}
              selecionadaId={selecionadaId}
              onSelecionar={selecionar}
              className="h-[360px] md:h-[520px]"
            />
            {semCoordenada > 0 && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                {semCoordenada} unidade(s) sem coordenada não aparecem no mapa.
              </p>
            )}
          </div>

          <Card className="flex flex-col">
            <CardHeader className="space-y-3 pb-3">
              <div>
                <CardTitle className="text-base">Unidades ({filtradas.length}/{unidades.length})</CardTitle>
                <CardDescription>Toque para ver o detalhe</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar unidade ou município"
                  className="pl-9"
                />
              </div>
              <Select
                value={filtroSituacao}
                onValueChange={(v) => setFiltroSituacao(v as SituacaoUnidadeCampanha | typeof TODAS)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TODAS}>Todas as situações</SelectItem>
                  {SITUACOES_UNIDADE.map((s) => (
                    <SelectItem key={s} value={s}>
                      {SITUACAO_UNIDADE_CONFIG[s].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[360px] md:h-[400px]">
                {carregandoUnidades ? (
                  <div className="space-y-2 p-4">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </div>
                ) : unidades.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    <p>Nenhuma unidade incluída nesta campanha.</p>
                    {podeEditar && (
                      <Button size="sm" className="mt-3" onClick={() => setIncluirAberto(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Incluir unidades
                      </Button>
                    )}
                  </div>
                ) : filtradas.length === 0 ? (
                  <p className="p-6 text-center text-sm text-muted-foreground">Nenhuma unidade com esses filtros.</p>
                ) : (
                  <ul className="divide-y">
                    {filtradas.map((u) => {
                      const cfg = SITUACAO_UNIDADE_CONFIG[u.situacao] ?? SITUACAO_UNIDADE_CONFIG.a_visitar;
                      const fotos = contagemFotos?.porUnidade[u.unidade_local_id] || 0;
                      const semCoord = !u.unidade || u.unidade.latitude === null || u.unidade.longitude === null;
                      return (
                        <li key={u.id}>
                          <button
                            type="button"
                            onClick={() => selecionar(u.id)}
                            className={`flex w-full items-start justify-between gap-2 px-4 py-3 text-left hover:bg-muted/50 ${
                              u.id === selecionadaId ? "bg-muted" : ""
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{u.unidade?.nome_unidade || "Unidade"}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                {u.unidade?.municipio || "-"}
                                {fotos > 0 ? ` · ${fotos} foto(s)` : ""}
                                {semCoord ? " · sem coordenada" : ""}
                              </p>
                            </div>
                            <Badge variant="outline" className={`${cfg.badge} shrink-0 border-0 text-xs`}>
                              {cfg.label}
                            </Badge>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Detalhe */}
      <section className="pb-8">
        <div ref={detalheRef} className="container mx-auto scroll-mt-4 px-4">
          {selecionada ? (
            <DetalheUnidadeCampanha key={selecionada.id} unidadeCampanha={selecionada} podeEditar={podeEditar} />
          ) : (
            unidades.length > 0 && (
              <p className="text-center text-sm text-muted-foreground">
                Selecione uma unidade no mapa ou na lista para ver o detalhe.
              </p>
            )
          )}
        </div>
      </section>

      {podeEditar && (
        <>
          <IncluirUnidadesCampanhaDialog
            open={incluirAberto}
            onOpenChange={setIncluirAberto}
            campanhaId={id}
            idsJaIncluidos={unidades.map((u) => u.unidade_local_id)}
          />
          <ImportarKmlDialog open={kmlAberto} onOpenChange={setKmlAberto} />
        </>
      )}
    </ModuleLayout>
  );
}
