/**
 * COMPONENTE MOBILE: VISTORIA DE UNIDADE (inventário de campo)
 * Fluxo: campanha → unidade → GPS + fotos (fila offline) + situação.
 * As fotos ficam no aparelho até haver conexão; a situação só é salva online.
 */

import { useMemo, useRef, useState } from "react";
import {
  AlertTriangle, ArrowLeft, Camera, ChevronRight, CloudOff, Loader2,
  MapPin, RefreshCw, Save, Search, Upload, Wifi, WifiOff,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CameraCapture } from "@/components/mobile/CameraCapture";
import { useCampanhasInventario } from "@/hooks/usePatrimonio";
import { useAtualizarSituacaoUnidade, useUnidadesCampanha } from "@/hooks/useVistoriaInventario";
import { useFilaFotosVistoria } from "@/hooks/useFilaFotosVistoria";
import { posicaoAtual, useGeolocalizacao } from "@/hooks/useGeolocalizacao";
import { semAcento } from "@/lib/texto";
import {
  IDADE_MAXIMA_GPS_S,
  PRECISAO_GPS_LIMITE_M,
  SITUACAO_UNIDADE_CONFIG,
  SITUACOES_UNIDADE,
  type SituacaoUnidadeCampanha,
  type UnidadeCampanha,
} from "@/types/inventarioCampo";

interface VistoriaUnidadeProps {
  onVoltar: () => void;
}

const STATUS_CAMPANHA_ATIVOS = ["em_andamento", "planejada"];


export function VistoriaUnidade({ onVoltar }: VistoriaUnidadeProps) {
  const fila = useFilaFotosVistoria();
  const { data: campanhas, isLoading: carregandoCampanhas } = useCampanhasInventario(new Date().getFullYear());

  const [campanhaId, setCampanhaId] = useState<string | null>(null);
  const [unidadeCampanhaId, setUnidadeCampanhaId] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [confirmandoDescarte, setConfirmandoDescarte] = useState(false);

  const { data: unidades = [], isLoading: carregandoUnidades } = useUnidadesCampanha(campanhaId ?? undefined);

  const campanhasAtivas = useMemo(
    () => (campanhas || []).filter((c) => STATUS_CAMPANHA_ATIVOS.includes(c.status as string)),
    [campanhas],
  );
  const campanha = campanhasAtivas.find((c) => c.id === campanhaId);
  const unidadeAtual = unidades.find((u) => u.id === unidadeCampanhaId) || null;

  const unidadesFiltradas = useMemo(() => {
    const termo = semAcento(busca.trim());
    return unidades.filter(
      (u) =>
        u.situacao !== "excluida" &&
        (!termo ||
          semAcento(u.unidade?.nome_unidade).includes(termo) ||
          semAcento(u.unidade?.municipio).includes(termo)),
    );
  }, [unidades, busca]);

  const voltar = () => {
    if (unidadeCampanhaId) setUnidadeCampanhaId(null);
    else if (campanhaId) {
      setCampanhaId(null);
      setBusca("");
    } else onVoltar();
  };

  const titulo = unidadeAtual
    ? unidadeAtual.unidade?.nome_unidade || "Unidade"
    : campanha
      ? campanha.nome
      : "Vistoria de unidade";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between gap-2 safe-area-inset-top">
        <div className="flex items-center gap-2 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/20 shrink-0"
            onClick={voltar}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-semibold truncate">{titulo}</h1>
        </div>
        {fila.online ? (
          <Wifi className="w-5 h-5 text-primary-foreground/80 shrink-0" />
        ) : (
          <WifiOff className="w-5 h-5 text-destructive shrink-0" />
        )}
      </header>

      <main className="flex-1 p-4 space-y-3 pb-32">
        {fila.erroAmbiente && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{fila.erroAmbiente}</AlertDescription>
          </Alert>
        )}

        {fila.pendentesOutroUsuario > 0 && (
          <Alert>
            <CloudOff className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <p>
                {fila.pendentesOutroUsuario} foto(s) deste aparelho foram capturadas por outro usuário e só podem ser
                enviadas por ele.
              </p>
              {confirmandoDescarte ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">Apagar essas fotos do aparelho? Não há como desfazer.</span>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setConfirmandoDescarte(false);
                      void fila.descartarFotosOutroUsuario();
                    }}
                  >
                    Sim, apagar
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setConfirmandoDescarte(false)}>
                    Cancelar
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setConfirmandoDescarte(true)}>
                  Descartar fotos de outro usuário
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}

        {/* 1. Campanha */}
        {!campanhaId && (
          <>
            <p className="text-center text-muted-foreground text-sm">Selecione a campanha</p>
            {carregandoCampanhas ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : campanhasAtivas.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>Nenhuma campanha planejada ou em andamento neste ano.</AlertDescription>
              </Alert>
            ) : (
              campanhasAtivas.map((c) => (
                <Card
                  key={c.id}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => setCampanhaId(c.id)}
                >
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{c.nome}</p>
                      <p className="text-sm text-muted-foreground">
                        {c.status === "em_andamento" ? "Em andamento" : "Planejada"}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))
            )}
          </>
        )}

        {/* 2. Unidades da campanha */}
        {campanhaId && !unidadeAtual && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar unidade ou município"
                className="pl-9 h-12"
              />
            </div>
            {carregandoUnidades ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : unidadesFiltradas.length === 0 ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {unidades.length === 0
                    ? "Nenhuma unidade incluída nesta campanha. Peça à coordenação para incluir pelo painel de campo."
                    : "Nenhuma unidade encontrada."}
                </AlertDescription>
              </Alert>
            ) : (
              unidadesFiltradas.map((u) => {
                const cfg = SITUACAO_UNIDADE_CONFIG[u.situacao] ?? SITUACAO_UNIDADE_CONFIG.a_visitar;
                const pendentes = fila.pendentesDaUnidade(u.campanha_id, u.unidade_local_id);
                return (
                  <Card
                    key={u.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setUnidadeCampanhaId(u.id)}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{u.unidade?.nome_unidade || "Unidade"}</p>
                        <p className="text-sm text-muted-foreground truncate">{u.unidade?.municipio || "-"}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <Badge variant="outline" className={`${cfg.badge} border-0 text-xs`}>
                            {cfg.label}
                          </Badge>
                          {pendentes > 0 && (
                            <Badge variant="outline" className="gap-1 text-xs">
                              <CloudOff className="h-3 w-3" /> {pendentes} a enviar
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
                    </CardContent>
                  </Card>
                );
              })
            )}
          </>
        )}

        {/* 3. Unidade */}
        {unidadeAtual && (
          <TelaUnidade
            key={unidadeAtual.id}
            unidadeCampanha={unidadeAtual}
            online={fila.online}
            pendentes={fila.pendentesDaUnidade(unidadeAtual.campanha_id, unidadeAtual.unidade_local_id)}
            adicionarFoto={fila.adicionarFoto}
            bloqueado={!!fila.erroAmbiente}
          />
        )}
      </main>

      {/* Barra de envio */}
      <footer className="fixed bottom-0 inset-x-0 border-t bg-background p-3 safe-area-inset-bottom">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0 text-sm">
            <p className="font-medium">
              {fila.pendentes === 0 ? "Nenhuma foto aguardando envio" : `${fila.pendentes} foto(s) aguardando envio`}
            </p>
            {fila.ultimoErro && <p className="text-xs text-destructive truncate">{fila.ultimoErro}</p>}
            {!fila.online && <p className="text-xs text-muted-foreground">Sem conexão: envio automático ao reconectar.</p>}
          </div>
          <Button
            size="lg"
            className="h-12"
            onClick={() => void fila.enviarPendentes()}
            disabled={!fila.online || fila.enviando || fila.pendentes === 0}
          >
            {fila.enviando ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Upload className="w-5 h-5 mr-2" />}
            Enviar agora
          </Button>
        </div>
      </footer>
    </div>
  );
}

// ========== TELA DA UNIDADE ==========

interface TelaUnidadeProps {
  unidadeCampanha: UnidadeCampanha;
  online: boolean;
  pendentes: number;
  adicionarFoto: ReturnType<typeof useFilaFotosVistoria>["adicionarFoto"];
  /** Ambiente sem os recursos necessários (ex.: sem HTTPS) */
  bloqueado: boolean;
}

function TelaUnidade({ unidadeCampanha, online, pendentes, adicionarFoto, bloqueado }: TelaUnidadeProps) {
  const gps = useGeolocalizacao();
  const atualizarSituacao = useAtualizarSituacaoUnidade();

  const [cameraAberta, setCameraAberta] = useState(false);
  // Foto sem coordenada escolhida explicitamente (GPS ausente ou desatualizado)
  const semCoordenadaRef = useRef(false);
  const [salvandoFoto, setSalvandoFoto] = useState(false);
  const [legenda, setLegenda] = useState("");
  const [codigoObjeto, setCodigoObjeto] = useState("");
  const [temPessoa, setTemPessoa] = useState(false);
  const [situacao, setSituacao] = useState<SituacaoUnidadeCampanha>(unidadeCampanha.situacao);
  const [observacao, setObservacao] = useState(unidadeCampanha.observacao || "");

  const precisaoRuim = !!gps.posicao && !gps.desatualizada && gps.posicao.precisao > PRECISAO_GPS_LIMITE_M;
  const gpsValido = !!gps.posicao && !gps.desatualizada;

  const abrirCamera = (semCoordenada: boolean) => {
    semCoordenadaRef.current = semCoordenada;
    setCameraAberta(true);
  };

  const handleCapturar = async (dataUrl: string) => {
    setSalvandoFoto(true);
    // Nunca grava coordenada velha: a leitura é conferida no momento da captura
    const posicao = semCoordenadaRef.current ? null : posicaoAtual(gps.posicao);
    try {
      await adicionarFoto({
        campanhaId: unidadeCampanha.campanha_id,
        unidadeLocalId: unidadeCampanha.unidade_local_id,
        dataUrl,
        posicao,
        legenda,
        temPessoa,
        codigoObjeto,
      });
      if (posicao) toast.success("Foto guardada na fila de envio");
      else if (semCoordenadaRef.current) toast.success("Foto guardada sem coordenada de GPS");
      else toast.warning("O GPS ficou desatualizado durante a captura: foto guardada sem coordenada.");
      setLegenda("");
      setCodigoObjeto("");
      setTemPessoa(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Não foi possível guardar a foto");
    } finally {
      setSalvandoFoto(false);
    }
  };

  const handleSalvarSituacao = () => {
    if (!online) return;
    atualizarSituacao.mutate({ atual: unidadeCampanha, situacao, observacao });
  };

  return (
    <div className="space-y-4">
      {/* GPS */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium flex items-center gap-2">
              <MapPin className="w-4 h-4" /> GPS
            </p>
            <Button variant="outline" size="sm" onClick={gps.atualizar} disabled={gps.carregando}>
              {gps.carregando ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span className="ml-2">Atualizar</span>
            </Button>
          </div>
          {gps.posicao ? (
            <>
              <p className="font-mono text-sm">
                {gps.posicao.lat.toFixed(6)}, {gps.posicao.lon.toFixed(6)}
              </p>
              <p className={`text-sm ${gps.desatualizada ? "text-muted-foreground" : precisaoRuim ? "text-warning" : "text-success"}`}>
                Precisão: ±{Math.round(gps.posicao.precisao)} m
                {gps.idadeSegundos !== null && ` · leitura de ${gps.idadeSegundos} s atrás`}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {gps.carregando ? "Obtendo localização..." : "Localização ainda não obtida."}
            </p>
          )}
          {gps.desatualizada && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Leitura do GPS desatualizada (mais de {IDADE_MAXIMA_GPS_S} s). Toque em "Atualizar" ou fotografe sem
                coordenada.
              </AlertDescription>
            </Alert>
          )}
          {precisaoRuim && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Precisão acima de {PRECISAO_GPS_LIMITE_M} m. Se possível, vá para área aberta e aguarde alguns segundos.
              </AlertDescription>
            </Alert>
          )}
          {gps.erro && (
            <Alert variant="destructive">
              <AlertDescription>{gps.erro}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Foto */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="legenda-foto">Legenda</Label>
            <Input
              id="legenda-foto"
              value={legenda}
              onChange={(e) => setLegenda(e.target.value)}
              placeholder="Ex.: fachada, quadra, vestiário"
              maxLength={300}
              className="h-12"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="codigo-objeto-foto">Código do objeto (opcional)</Label>
            <Input
              id="codigo-objeto-foto"
              value={codigoObjeto}
              onChange={(e) => setCodigoObjeto(e.target.value)}
              maxLength={100}
              className="h-12"
            />
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              id="tem-pessoa-foto"
              checked={temPessoa}
              onCheckedChange={(v) => setTemPessoa(v === true)}
              className="h-6 w-6"
            />
            <Label htmlFor="tem-pessoa-foto" className="text-base">Aparece pessoa na foto</Label>
          </div>
          <Button
            size="lg"
            className="w-full h-14 text-base"
            onClick={() => abrirCamera(false)}
            disabled={salvandoFoto || bloqueado || !gpsValido}
          >
            {salvandoFoto ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Camera className="w-5 h-5 mr-2" />}
            Fotografar
          </Button>
          {!gpsValido && (
            <Button
              size="lg"
              variant="outline"
              className="w-full h-12"
              onClick={() => abrirCamera(true)}
              disabled={salvandoFoto || bloqueado}
            >
              Fotografar sem coordenada
            </Button>
          )}
          {pendentes > 0 && (
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <CloudOff className="w-4 h-4" /> {pendentes} foto(s) desta unidade aguardando envio
            </p>
          )}
        </CardContent>
      </Card>

      {/* Situação */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="space-y-1.5">
            <Label>Situação da unidade</Label>
            <Select value={situacao} onValueChange={(v) => setSituacao(v as SituacaoUnidadeCampanha)}>
              <SelectTrigger className="h-12">
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
            <Label htmlFor="observacao-vistoria">Observação</Label>
            <Textarea
              id="observacao-vistoria"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={3}
              maxLength={2000}
            />
          </div>
          {!online && (
            <Alert>
              <WifiOff className="h-4 w-4" />
              <AlertDescription>
                Sem conexão: a situação só pode ser salva com internet. As fotos continuam guardadas no aparelho.
              </AlertDescription>
            </Alert>
          )}
          <Button
            size="lg"
            variant="secondary"
            className="w-full h-14 text-base"
            onClick={handleSalvarSituacao}
            disabled={!online || atualizarSituacao.isPending}
          >
            {atualizarSituacao.isPending ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
            Salvar situação
          </Button>
        </CardContent>
      </Card>

      {cameraAberta && (
        <CameraCapture
          isOpen
          onCapture={(dataUrl) => void handleCapturar(dataUrl)}
          onClose={() => setCameraAberta(false)}
        />
      )}
    </div>
  );
}
