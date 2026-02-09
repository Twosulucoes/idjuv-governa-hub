/**
 * PÁGINA: COLETA MOBILE
 * Interface simplificada mobile-first para conferência de bens em campo
 */

import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { 
  QrCode, Search, Camera, MapPin, CheckCircle2, AlertTriangle,
  Package, Wifi, WifiOff, CloudOff, RefreshCw, Menu, X, ArrowLeft,
  ClipboardCheck, ChevronRight, Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { QRCodeScanner } from "@/components/mobile/QRCodeScanner";
import { CameraCapture } from "@/components/mobile/CameraCapture";
import { useColetaOffline } from "@/hooks/useColetaOffline";
import { 
  useCampanhasInventario, 
  useBensPatrimoniais,
  useUnidadesLocaisPatrimonio,
  useColetasInventario 
} from "@/hooks/usePatrimonio";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const STATUS_COLETA = [
  { value: "conferido", label: "Conferido", icon: CheckCircle2, color: "bg-success" },
  { value: "divergente", label: "Divergente", icon: AlertTriangle, color: "bg-warning" },
  { value: "nao_localizado", label: "Não Localizado", icon: X, color: "bg-destructive" },
  { value: "sem_etiqueta", label: "Sem Etiqueta", icon: Package, color: "bg-muted" },
];

export default function ColetaMobilePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  
  // Estados principais
  const [campanhaId, setCampanhaId] = useState(searchParams.get("campanha") || "");
  const [busca, setBusca] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  
  // Bem selecionado
  const [bemSelecionado, setBemSelecionado] = useState<any>(null);
  
  // Form state
  const [statusColeta, setStatusColeta] = useState("conferido");
  const [unidadeEncontrada, setUnidadeEncontrada] = useState("");
  const [salaEncontrada, setSalaEncontrada] = useState("");
  const [detalhe, setDetalhe] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [fotoCapturada, setFotoCapturada] = useState<string | null>(null);
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Hooks
  const { data: campanhas } = useCampanhasInventario(new Date().getFullYear());
  const { data: bens } = useBensPatrimoniais();
  const { data: unidades } = useUnidadesLocaisPatrimonio();
  const { data: coletas, refetch: refetchColetas } = useColetasInventario(campanhaId);
  
  const { 
    salvarColeta, 
    isOnline, 
    pendingCount, 
    syncColetas, 
    isSyncing 
  } = useColetaOffline(campanhaId);

  // Campanhas em andamento
  const campanhasAtivas = campanhas?.filter(c => c.status === "em_andamento") || [];
  const campanhaAtual = campanhas?.find(c => c.id === campanhaId);

  // Atualizar URL quando campanha mudar
  useEffect(() => {
    if (campanhaId) {
      setSearchParams({ campanha: campanhaId });
    }
  }, [campanhaId]);

  // Obter localização GPS
  const obterGPS = useCallback(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          toast.success("Localização obtida");
        },
        (error) => {
          console.error("Erro GPS:", error);
          toast.error("Não foi possível obter localização");
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // Buscar bem
  const handleBuscar = useCallback(() => {
    if (!busca.trim()) return;
    
    const bem = bens?.find(b => 
      b.numero_patrimonio?.toLowerCase() === busca.toLowerCase() ||
      b.codigo_qr?.toLowerCase() === busca.toLowerCase()
    );
    
    if (bem) {
      // Verificar se já coletado
      const jaColetado = coletas?.find(c => c.bem_id === bem.id);
      if (jaColetado) {
        toast.warning("Bem já conferido nesta campanha");
        setBusca("");
        return;
      }
      
      setBemSelecionado(bem);
      setUnidadeEncontrada(bem.unidade_local_id || "");
      setSalaEncontrada(bem.sala || "");
      setFormOpen(true);
      obterGPS();
    } else {
      toast.error("Bem não encontrado");
    }
    setBusca("");
  }, [busca, bens, coletas, obterGPS]);

  // Scan QR
  const handleScan = useCallback((result: string) => {
    setScannerOpen(false);
    setBusca(result);
    
    const bem = bens?.find(b => 
      b.numero_patrimonio?.toLowerCase() === result.toLowerCase() ||
      b.codigo_qr?.toLowerCase() === result.toLowerCase()
    );
    
    if (bem) {
      const jaColetado = coletas?.find(c => c.bem_id === bem.id);
      if (jaColetado) {
        toast.warning("Bem já conferido nesta campanha");
        return;
      }
      
      setBemSelecionado(bem);
      setUnidadeEncontrada(bem.unidade_local_id || "");
      setSalaEncontrada(bem.sala || "");
      setFormOpen(true);
      obterGPS();
    } else {
      toast.error("Bem não encontrado");
    }
  }, [bens, coletas, obterGPS]);

  // Capturar foto
  const handleCapturePhoto = useCallback((imageData: string) => {
    setFotoCapturada(imageData);
    setCameraOpen(false);
    toast.success("Foto capturada");
  }, []);

  // Upload de foto para storage
  const uploadFoto = async (imageData: string): Promise<string | null> => {
    if (!isOnline) return null;
    
    try {
      // Converter base64 para blob
      const response = await fetch(imageData);
      const blob = await response.blob();
      
      const fileName = `coletas/${campanhaId}/${bemSelecionado?.id || "temp"}_${Date.now()}.jpg`;
      
      const { data, error } = await supabase.storage
        .from("inventario-fotos")
        .upload(fileName, blob, { contentType: "image/jpeg" });
      
      if (error) throw error;
      
      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from("inventario-fotos")
        .getPublicUrl(fileName);
      
      return publicUrl;
    } catch (err) {
      console.error("Erro ao fazer upload:", err);
      return null;
    }
  };

  // Salvar coleta
  const handleSalvar = async () => {
    if (!campanhaId || !bemSelecionado) {
      toast.error("Selecione uma campanha e um bem");
      return;
    }

    let fotoUrl = null;
    if (fotoCapturada) {
      fotoUrl = await uploadFoto(fotoCapturada);
    }

    const sucesso = await salvarColeta({
      campanha_id: campanhaId,
      bem_id: bemSelecionado.id,
      status_coleta: statusColeta,
      localizacao_encontrada_unidade_id: unidadeEncontrada || null,
      localizacao_encontrada_sala: salaEncontrada || null,
      localizacao_encontrada_detalhe: detalhe || null,
      observacoes: observacoes || null,
      foto_url: fotoUrl,
      coordenadas_gps: gpsLocation,
      data_coleta: new Date().toISOString(),
    });

    if (sucesso) {
      // Reset form
      setFormOpen(false);
      setBemSelecionado(null);
      setStatusColeta("conferido");
      setUnidadeEncontrada("");
      setSalaEncontrada("");
      setDetalhe("");
      setObservacoes("");
      setFotoCapturada(null);
      setGpsLocation(null);
      refetchColetas();
    }
  };

  // Se não há campanha selecionada, mostrar seletor
  if (!campanhaId) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between safe-area-inset-top">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6" />
            <h1 className="font-semibold">Coleta de Inventário</h1>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-success" />
            ) : (
              <WifiOff className="w-5 h-5 text-warning" />
            )}
          </div>
        </header>

        {/* Seletor de Campanha */}
        <main className="flex-1 p-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Selecionar Campanha</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {campanhasAtivas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma campanha em andamento</p>
                  <Button asChild className="mt-4" variant="outline">
                    <Link to="/inventario/campanhas">
                      Gerenciar Campanhas
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {campanhasAtivas.map((campanha) => (
                    <button
                      key={campanha.id}
                      onClick={() => setCampanhaId(campanha.id)}
                      className="w-full p-4 rounded-lg border bg-card hover:bg-accent transition-colors text-left flex items-center justify-between"
                    >
                      <div>
                        <p className="font-medium">{campanha.nome}</p>
                        <p className="text-sm text-muted-foreground">
                          {campanha.total_conferidos || 0} de {campanha.total_bens_esperados || 0} bens
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        {/* Link para área administrativa */}
        <footer className="p-4 border-t safe-area-inset-bottom">
          <Button asChild variant="ghost" className="w-full">
            <Link to="/inventario">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Sistema
            </Link>
          </Button>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between safe-area-inset-top">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/20"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="font-semibold text-sm truncate max-w-[200px]">
              {campanhaAtual?.nome || "Coleta"}
            </h1>
            <p className="text-xs opacity-80">
              {campanhaAtual?.total_conferidos || 0}/{campanhaAtual?.total_bens_esperados || 0}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Badge variant="secondary" className="bg-warning text-warning-foreground">
              <CloudOff className="w-3 h-3 mr-1" />
              {pendingCount}
            </Badge>
          )}
          {isOnline ? (
            <Wifi className="w-5 h-5 text-success" />
          ) : (
            <WifiOff className="w-5 h-5 text-warning" />
          )}
        </div>
      </header>

      {/* Search Area */}
      <div className="p-4 bg-muted/50 border-b">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleBuscar(); }}
          className="flex gap-2"
        >
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Nº Patrimônio..."
            className="flex-1 h-12 text-lg"
          />
          <Button 
            type="button" 
            size="icon" 
            className="h-12 w-12"
            onClick={() => setScannerOpen(true)}
          >
            <QrCode className="w-6 h-6" />
          </Button>
        </form>
      </div>

      {/* Main Content - últimas coletas */}
      <main className="flex-1 overflow-auto p-4">
        <h2 className="text-sm font-medium text-muted-foreground mb-3">
          Últimas Coletas
        </h2>
        
        {coletas?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma coleta ainda</p>
            <p className="text-sm">Escaneie um QR Code para começar</p>
          </div>
        ) : (
          <div className="space-y-2">
            {coletas?.slice(0, 20).map((coleta) => {
              const status = STATUS_COLETA.find(s => s.value === coleta.status_coleta);
              const StatusIcon = status?.icon || CheckCircle2;
              return (
                <div 
                  key={coleta.id}
                  className="p-3 rounded-lg bg-card border flex items-center gap-3"
                >
                  <div className={`w-10 h-10 rounded-full ${status?.color} flex items-center justify-center`}>
                    <StatusIcon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-medium">
                      {(coleta as any).bem?.numero_patrimonio}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {(coleta as any).bem?.descricao}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(coleta.data_coleta), "HH:mm")}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom Actions */}
      <div className="p-4 border-t bg-background safe-area-inset-bottom">
        <div className="flex gap-2">
          <Button 
            className="flex-1 h-14 text-lg"
            onClick={() => setScannerOpen(true)}
          >
            <QrCode className="w-6 h-6 mr-2" />
            Escanear
          </Button>
          {pendingCount > 0 && isOnline && (
            <Button 
              variant="outline"
              size="icon"
              className="h-14 w-14"
              onClick={syncColetas}
              disabled={isSyncing}
            >
              <RefreshCw className={`w-6 h-6 ${isSyncing ? "animate-spin" : ""}`} />
            </Button>
          )}
        </div>
      </div>

      {/* Menu Lateral */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-80">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              onClick={() => { setCampanhaId(""); setMenuOpen(false); }}
            >
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Trocar Campanha
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              asChild
            >
              <Link to={`/inventario/campanhas/${campanhaId}`}>
                <Package className="w-4 h-4 mr-2" />
                Ver Detalhes da Campanha
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start"
              asChild
            >
              <Link to="/inventario">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Sistema
              </Link>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* QR Scanner */}
      <QRCodeScanner 
        isOpen={scannerOpen}
        onScan={handleScan}
        onClose={() => setScannerOpen(false)}
      />

      {/* Camera Capture */}
      <CameraCapture
        isOpen={cameraOpen}
        onCapture={handleCapturePhoto}
        onClose={() => setCameraOpen(false)}
      />

      {/* Form Sheet */}
      <Sheet open={formOpen} onOpenChange={setFormOpen}>
        <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
          <SheetHeader>
            <SheetTitle>Registrar Coleta</SheetTitle>
            <SheetDescription>
              {bemSelecionado?.numero_patrimonio} - {bemSelecionado?.descricao?.slice(0, 50)}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-4 space-y-4 overflow-auto max-h-[calc(85vh-180px)]">
            {/* Status */}
            <div className="space-y-2">
              <Label>Status *</Label>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_COLETA.map((status) => {
                  const Icon = status.icon;
                  return (
                    <button
                      key={status.value}
                      type="button"
                      onClick={() => setStatusColeta(status.value)}
                      className={`p-3 rounded-lg border-2 flex items-center gap-2 transition-colors ${
                        statusColeta === status.value 
                          ? "border-primary bg-primary/10" 
                          : "border-border"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">{status.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Unidade */}
            <div className="space-y-2">
              <Label>Unidade Encontrada</Label>
              <Select value={unidadeEncontrada} onValueChange={setUnidadeEncontrada}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {unidades?.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nome_unidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sala */}
            <div className="space-y-2">
              <Label>Sala/Local</Label>
              <Input 
                value={salaEncontrada}
                onChange={(e) => setSalaEncontrada(e.target.value)}
                placeholder="Ex: Sala 101"
              />
            </div>

            {/* Foto e GPS */}
            <div className="flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={() => setCameraOpen(true)}
              >
                <Camera className="w-4 h-4 mr-2" />
                {fotoCapturada ? "Alterar Foto" : "Tirar Foto"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="flex-1"
                onClick={obterGPS}
              >
                <MapPin className="w-4 h-4 mr-2" />
                {gpsLocation ? "GPS ✓" : "Obter GPS"}
              </Button>
            </div>

            {fotoCapturada && (
              <img 
                src={fotoCapturada} 
                alt="Foto do bem" 
                className="w-full h-32 object-cover rounded-lg"
              />
            )}

            {/* Observações */}
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea 
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações adicionais..."
                rows={2}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t safe-area-inset-bottom">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setFormOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1"
                onClick={handleSalvar}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
