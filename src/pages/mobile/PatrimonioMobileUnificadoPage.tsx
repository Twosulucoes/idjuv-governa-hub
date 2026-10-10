/**
 * PÁGINA: PATRIMÔNIO MOBILE UNIFICADO (PWA)
 * 
 * PWA unificado para todas as operações de patrimônio:
 * - Cadastro de Novo Produto
 * - Regularização de Bem Existente
 * - Coleta de Inventário
 * - Movimentação de Bens
 * - Baixa de Patrimônio
 * 
 * Foto obrigatória em todas as operações.
 * 
 * @version 2.0.0
 */

import { useState, useCallback, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { 
  Package, Plus, ClipboardList, Wifi, WifiOff, 
  ArrowLeft, Camera, CheckCircle2, Printer, X,
  Building2, Tag, Loader2, Info, ChevronRight, FileText,
  RefreshCw, MapPin, AlertTriangle, ArrowRightLeft, Trash2,
  QrCode, Search, Menu, CloudOff, Home, PackagePlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { CameraCapture } from "@/components/mobile/CameraCapture";
import { QRCodeScanner } from "@/components/mobile/QRCodeScanner";
import { VistoriaUnidade } from "@/components/mobile/VistoriaUnidade";
import { FaixaOffline } from "@/components/mobile/FaixaOffline";
import { supabase } from "@/integrations/supabase/client";
import {
  useCadastroBemSimplificado,
  CATEGORIAS_LABEL,
  ESTADOS_CONSERVACAO_LABEL,
  type CategoriaBem,
  type EstadoConservacao,
} from "@/hooks/patrimonio/useCadastroBemSimplificado";
import { 
  useCampanhasInventario, 
  useUnidadesLocaisPatrimonio,
  useColetasInventario 
} from "@/hooks/usePatrimonio";
import { useColetaOffline } from "@/hooks/useColetaOffline";
import { useBuscarBemPorCodigo, type BemEncontrado } from "@/hooks/patrimonio/useBuscarBemPorCodigo";
import { imprimirEtiquetas } from "@/lib/etiquetasPatrimonio";

// Tipos de operação
type TipoOperacao = "cadastro_novo" | "cadastro_existente" | "coleta" | "movimentacao" | "baixa" | "vistoria";
type Etapa = "menu" | "unidade" | "formulario" | "scan";

const OPERACOES = [
  { 
    id: "cadastro_novo" as TipoOperacao, 
    titulo: "Novo Produto", 
    descricao: "Cadastrar bem recém-adquirido",
    icon: Plus,
    cor: "bg-success text-success-foreground"
  },
  { 
    id: "cadastro_existente" as TipoOperacao, 
    titulo: "Bem Existente", 
    descricao: "Regularizar bem sem tombamento",
    icon: ClipboardList,
    cor: "bg-primary text-primary-foreground"
  },
  { 
    id: "coleta" as TipoOperacao, 
    titulo: "Coleta Inventário", 
    descricao: "Conferir bens em campanha",
    icon: QrCode,
    cor: "bg-warning text-warning-foreground"
  },
  { 
    id: "movimentacao" as TipoOperacao, 
    titulo: "Movimentação", 
    descricao: "Transferir bem entre unidades",
    icon: ArrowRightLeft,
    cor: "bg-info text-info-foreground"
  },
  { 
    id: "baixa" as TipoOperacao, 
    titulo: "Baixa", 
    descricao: "Solicitar baixa de bem",
    icon: Trash2,
    cor: "bg-destructive text-destructive-foreground"
  },
  { 
    id: "vistoria" as TipoOperacao, 
    titulo: "Vistoria de Unidade", 
    descricao: "Fotos georreferenciadas e situação da unidade",
    icon: MapPin,
    cor: "bg-secondary text-secondary-foreground"
  },
];

const CATEGORIAS_DISPONIVEIS: CategoriaBem[] = [
  "mobiliario",
  "informatica",
  "equipamento_esportivo",
  "veiculo",
  "eletrodomestico",
  "outros",
];

const DICAS_DESCRICAO: Record<CategoriaBem, string> = {
  mobiliario: "Ex: Mesa de escritório em MDF cor cinza, 4 gavetas",
  informatica: "Ex: Notebook Dell Latitude 5520, 16GB RAM, SSD 512GB",
  equipamento_esportivo: "Ex: Esteira ergométrica Movement LX-160",
  veiculo: "Ex: Carro Fiat Argo 1.0, ano 2023, cor prata",
  eletrodomestico: "Ex: Ar-condicionado Split 12.000 BTUs, Consul",
  outros: "Ex: Descrição detalhada do bem com características principais",
};

// Valores do enum status_coleta_inventario
type StatusColeta = "conferido" | "divergente" | "nao_localizado" | "sem_etiqueta";

const STATUS_COLETA: Array<{ value: StatusColeta; label: string; icon: typeof CheckCircle2; color: string }> = [
  { value: "conferido", label: "Conferido", icon: CheckCircle2, color: "bg-success text-success-foreground" },
  { value: "divergente", label: "Divergente", icon: AlertTriangle, color: "bg-warning text-warning-foreground" },
  { value: "nao_localizado", label: "Não Localizado", icon: X, color: "bg-destructive text-destructive-foreground" },
  { value: "sem_etiqueta", label: "Sem Etiqueta", icon: Package, color: "bg-muted text-muted-foreground" },
];

// Texto da faixa offline: só a coleta funciona sem internet (fila em useColetaOffline)
const MENSAGEM_OFFLINE =
  "Sem conexão. As coletas ficam salvas no aparelho e são enviadas quando a internet voltar. Cadastro, movimentação e baixa precisam de internet.";

// Valores do enum motivo_baixa_patrimonio. Extravio, furto/roubo e sinistro NÃO
// são baixa: são ocorrências a apurar antes (aviso exibido no formulário).
type MotivoBaixa = "inservivel" | "obsoleto" | "doacao" | "alienacao" | "perda";

const MOTIVOS_BAIXA: Array<{ value: MotivoBaixa; label: string }> = [
  { value: "inservivel", label: "Inservível" },
  { value: "obsoleto", label: "Obsoleto" },
  { value: "doacao", label: "Doação" },
  { value: "alienacao", label: "Alienação (venda/leilão)" },
  { value: "perda", label: "Perda" },
];

export default function PatrimonioMobileUnificadoPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { unidadesLocais, loadingUnidades, cadastrarBem, isSubmitting } = useCadastroBemSimplificado();
  
  // Estados de navegação
  const [operacao, setOperacao] = useState<TipoOperacao | null>(null);
  const [etapa, setEtapa] = useState<Etapa>("menu");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [countOperacoes, setCountOperacoes] = useState(0);
  const [resultadoOperacao, setResultadoOperacao] = useState<string>("");
  // Bem recém-cadastrado, para a etiqueta (os campos do formulário já foram limpos)
  const [bemEtiqueta, setBemEtiqueta] = useState<{ numero_patrimonio: string; descricao: string; codigo_qr: string | null } | null>(null);
  
  // Form - Unidade persistente
  const [unidadeLocalId, setUnidadeLocalId] = useState("");
  const [unidadeNome, setUnidadeNome] = useState("");
  
  // Form - Campos do bem
  const [categoria, setCategoria] = useState<CategoriaBem>("mobiliario");
  const [descricao, setDescricao] = useState("");
  const [estadoConservacao, setEstadoConservacao] = useState<EstadoConservacao>("bom");
  const [localizacao, setLocalizacao] = useState("");
  const [observacao, setObservacao] = useState("");
  const [tombamentoAnterior, setTombamentoAnterior] = useState("");
  const [fotoCapturada, setFotoCapturada] = useState<string | null>(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  
  // Estados para coleta
  const [campanhaId, setCampanhaId] = useState(searchParams.get("campanha") || "");
  const [busca, setBusca] = useState("");
  const [bemSelecionado, setBemSelecionado] = useState<BemEncontrado | null>(null);
  const [statusColeta, setStatusColeta] = useState<StatusColeta>("conferido");
  const [gpsLocation, setGpsLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Estados para movimentação
  const [unidadeDestino, setUnidadeDestino] = useState("");
  const [motivoMovimentacao, setMotivoMovimentacao] = useState("");
  
  // Estados para baixa
  const [motivoBaixa, setMotivoBaixa] = useState<MotivoBaixa | "">("");
  const [justificativaBaixa, setJustificativaBaixa] = useState("");
  
  // Hooks
  const { data: campanhas } = useCampanhasInventario(new Date().getFullYear());
  const { buscar: buscarBem, buscando: buscandoBem } = useBuscarBemPorCodigo();
  const { data: unidades } = useUnidadesLocaisPatrimonio();
  const { data: coletas, refetch: refetchColetas } = useColetasInventario(campanhaId);
  const { salvarColeta, pendingCount, syncColetas, isSyncing } = useColetaOffline(campanhaId);
  
  const campanhasAtivas = campanhas?.filter(c => c.status === "em_andamento") || [];

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Carregar unidade salva
  useEffect(() => {
    const savedUnidade = localStorage.getItem("patrimonio-mobile-unidade");
    if (savedUnidade) {
      try {
        const { id, nome } = JSON.parse(savedUnidade);
        setUnidadeLocalId(id);
        setUnidadeNome(nome);
      } catch (e) {
        console.error("Erro ao carregar unidade salva:", e);
      }
    }
  }, []);

  // Salvar unidade
  const handleSelectUnidade = (id: string) => {
    const unidade = unidadesLocais.find(u => u.id === id) || unidades?.find(u => u.id === id);
    if (unidade) {
      setUnidadeLocalId(id);
      setUnidadeNome(unidade.nome_unidade);
      localStorage.setItem("patrimonio-mobile-unidade", JSON.stringify({
        id,
        nome: unidade.nome_unidade,
      }));
    }
  };

  // Obter GPS
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
        },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  // Upload foto
  const uploadFoto = async (imageData: string, pasta: string): Promise<string | null> => {
    if (!isOnline) {
      toast.error("Sem conexão", { description: "Foto não pode ser enviada offline" });
      return null;
    }
    
    setUploadingFoto(true);
    try {
      const response = await fetch(imageData);
      const blob = await response.blob();
      
      if (blob.size > 5 * 1024 * 1024) {
        toast.error("Foto muito grande", { description: "Máximo 5MB" });
        return null;
      }
      
      const fileName = `${pasta}/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      
      const { data, error } = await supabase.storage
        .from("patrimonio-fotos")
        .upload(fileName, blob, { contentType: "image/jpeg" });
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from("patrimonio-fotos")
        .getPublicUrl(fileName);
      
      return publicUrl;
    } catch (err) {
      console.error("Erro upload:", err);
      toast.error("Erro ao enviar foto");
      return null;
    } finally {
      setUploadingFoto(false);
    }
  };

  // Captura de foto
  const handleCapturePhoto = useCallback((imageData: string) => {
    setFotoCapturada(imageData);
    setCameraOpen(false);
    toast.success("Foto capturada!");
  }, []);

  // Scan QR / código digitado: busca no servidor (número, QR ou tombamento anterior)
  const handleScan = useCallback(async (result: string) => {
    setScannerOpen(false);
    const codigo = result.trim();
    setBusca(codigo);
    if (!codigo) return;

    if (!navigator.onLine) {
      toast.error("Sem conexão", { description: "A busca do bem precisa de internet" });
      return;
    }

    const bem = await buscarBem(codigo).catch((err: unknown) => {
      console.error("Erro ao buscar bem:", err);
      toast.error("Erro ao buscar o bem");
      return undefined;
    });
    if (bem === undefined) return;

    if (bem) {
      if (operacao === "coleta") {
        const jaColetado = coletas?.find(c => c.bem_id === bem.id);
        if (jaColetado) {
          toast.warning("Bem já conferido nesta campanha");
          return;
        }
      }
      
      setBemSelecionado(bem);
      setUnidadeLocalId(bem.unidade_local_id || "");
      setEtapa("formulario");
      obterGPS();
    } else {
      toast.error("Bem não encontrado");
    }
  }, [buscarBem, coletas, operacao, obterGPS]);

  // Buscar bem
  const handleBuscar = useCallback(() => {
    if (!busca.trim()) return;
    handleScan(busca.trim());
    setBusca("");
  }, [busca, handleScan]);

  // Reset form
  const resetFormFields = () => {
    setDescricao("");
    setCategoria("mobiliario");
    setEstadoConservacao("bom");
    setLocalizacao("");
    setObservacao("");
    setTombamentoAnterior("");
    setFotoCapturada(null);
    setBemSelecionado(null);
    setStatusColeta("conferido");
    setUnidadeDestino("");
    setMotivoMovimentacao("");
    setMotivoBaixa("");
    setJustificativaBaixa("");
    setGpsLocation(null);
  };

  // Voltar ao menu
  const voltarMenu = () => {
    setOperacao(null);
    setEtapa("menu");
    resetFormFields();
  };

  // Validar foto obrigatória
  const validarFoto = (): boolean => {
    if (!fotoCapturada) {
      toast.error("Foto obrigatória", { description: "Tire uma foto para continuar" });
      return false;
    }
    return true;
  };

  // === SUBMIT CADASTRO ===
  const handleSubmitCadastro = async () => {
    if (!unidadeLocalId) {
      toast.error("Selecione a unidade");
      setEtapa("unidade");
      return;
    }
    if (!descricao.trim()) {
      toast.error("Informe a descrição do bem");
      return;
    }
    if (!validarFoto()) return;
    if (!isOnline) {
      toast.error("Sem conexão");
      return;
    }

    try {
      const fotoUrl = await uploadFoto(fotoCapturada!, "cadastro");

      // Tombamento anterior vai para patrimonio_anterior (via hook), não na observação
      let observacaoFinal = "";
      if (operacao === "cadastro_existente") {
        observacaoFinal = `Regularização de bem existente.`;
      }
      if (observacao.trim()) {
        observacaoFinal += observacaoFinal ? ` ${observacao.trim()}` : observacao.trim();
      }

      const resultado = await cadastrarBem({
        unidade_local_id: unidadeLocalId,
        descricao: descricao.trim(),
        categoria_bem: categoria,
        estado_conservacao: estadoConservacao,
        localizacao_especifica: localizacao || undefined,
        forma_aquisicao: operacao === "cadastro_novo" ? "compra" : "transferencia",
        possui_tombamento_externo: operacao === "cadastro_existente" && !!tombamentoAnterior.trim(),
        numero_patrimonio_externo: operacao === "cadastro_existente" ? tombamentoAnterior.trim() || undefined : undefined,
        observacao: observacaoFinal || undefined,
      });

      if (fotoUrl && resultado?.id) {
        await supabase
          .from("bens_patrimoniais")
          .update({ foto_bem_url: fotoUrl })
          .eq("id", resultado.id);
      }

      setResultadoOperacao(resultado.numero_patrimonio);
      setBemEtiqueta({
        numero_patrimonio: resultado.numero_patrimonio,
        descricao: resultado.descricao,
        codigo_qr: resultado.codigo_qr,
      });
      setCountOperacoes(prev => prev + 1);
      setSuccessDialogOpen(true);
      resetFormFields();
    } catch (error) {
      // Erro tratado pelo hook
    }
  };

  // === SUBMIT COLETA ===
  const handleSubmitColeta = async () => {
    if (!campanhaId || !bemSelecionado) {
      toast.error("Selecione uma campanha e um bem");
      return;
    }
    if (!validarFoto()) return;

    let fotoUrl = null;
    if (fotoCapturada) {
      fotoUrl = await uploadFoto(fotoCapturada, `coletas/${campanhaId}`);
    }

    const sucesso = await salvarColeta({
      campanha_id: campanhaId,
      bem_id: bemSelecionado.id,
      status_coleta: statusColeta,
      localizacao_encontrada_unidade_id: unidadeLocalId || null,
      localizacao_encontrada_sala: localizacao || null,
      localizacao_encontrada_detalhe: null,
      observacoes: observacao || null,
      foto_url: fotoUrl,
      foto_capturada: !!fotoCapturada,
      coordenadas_gps: gpsLocation,
      data_coleta: new Date().toISOString(),
    });

    if (sucesso) {
      setResultadoOperacao(`Coleta registrada: ${bemSelecionado.numero_patrimonio}`);
      setCountOperacoes(prev => prev + 1);
      setSuccessDialogOpen(true);
      resetFormFields();
      refetchColetas();
    }
  };

  // === SUBMIT MOVIMENTAÇÃO ===
  const handleSubmitMovimentacao = async () => {
    if (!bemSelecionado) {
      toast.error("Selecione um bem");
      return;
    }
    if (!unidadeDestino) {
      toast.error("Selecione a unidade de destino");
      return;
    }
    if (!validarFoto()) return;
    if (!isOnline) {
      toast.error("Sem conexão");
      return;
    }

    try {
      const fotoUrl = await uploadFoto(fotoCapturada!, "movimentacoes");

      // Fica pendente: o bem só muda de unidade quando a movimentação é aprovada
      // (RPC patrimonio_decidir_movimentacao).
      const { error } = await supabase
        .from("movimentacoes_patrimonio")
        .insert({
          bem_id: bemSelecionado.id,
          tipo: "transferencia_interna",
          unidade_local_origem_id: bemSelecionado.unidade_local_id,
          unidade_local_destino_id: unidadeDestino,
          motivo: motivoMovimentacao.trim() || "Transferência via app mobile",
          status: "pendente",
          documento_url: fotoUrl,
          solicitado_por: user?.id ?? null,
          data_movimentacao: new Date().toISOString().split("T")[0],
        });

      if (error) throw error;

      setResultadoOperacao(`Movimentação solicitada: ${bemSelecionado.numero_patrimonio}`);
      setCountOperacoes(prev => prev + 1);
      setSuccessDialogOpen(true);
      resetFormFields();
    } catch (error) {
      toast.error(`Erro: ${error instanceof Error ? error.message : (error as { message?: string })?.message ?? "falha ao salvar"}`);
    }
  };

  // === SUBMIT BAIXA ===
  const handleSubmitBaixa = async () => {
    if (!bemSelecionado) {
      toast.error("Selecione um bem");
      return;
    }
    if (!motivoBaixa) {
      toast.error("Selecione o motivo da baixa");
      return;
    }
    if (!justificativaBaixa.trim()) {
      toast.error("Informe a justificativa");
      return;
    }
    if (!validarFoto()) return;
    if (!isOnline) {
      toast.error("Sem conexão");
      return;
    }

    try {
      const fotoUrl = await uploadFoto(fotoCapturada!, "baixas");

      const { error } = await supabase
        .from("baixas_patrimonio")
        .insert({
          bem_id: bemSelecionado.id,
          motivo: motivoBaixa,
          justificativa: justificativaBaixa.trim(),
          data_solicitacao: new Date().toISOString().split("T")[0],
          status: "solicitada",
          laudo_tecnico_url: fotoUrl,
        });

      if (error) throw error;

      setResultadoOperacao(`Baixa solicitada: ${bemSelecionado.numero_patrimonio}`);
      setCountOperacoes(prev => prev + 1);
      setSuccessDialogOpen(true);
      resetFormFields();
    } catch (error) {
      toast.error(`Erro: ${error instanceof Error ? error.message : (error as { message?: string })?.message ?? "falha ao salvar"}`);
    }
  };

  // Handle submit genérico
  const handleSubmit = () => {
    switch (operacao) {
      case "cadastro_novo":
      case "cadastro_existente":
        handleSubmitCadastro();
        break;
      case "coleta":
        handleSubmitColeta();
        break;
      case "movimentacao":
        handleSubmitMovimentacao();
        break;
      case "baixa":
        handleSubmitBaixa();
        break;
    }
  };

  // Imprimir etiqueta (QR + número) do bem recém-cadastrado
  const handlePrint = async () => {
    if (!bemEtiqueta) return;
    try {
      await imprimirEtiquetas([bemEtiqueta]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível imprimir a etiqueta.");
    }
  };

  // === RENDER VISTORIA DE UNIDADE (fluxo próprio) ===
  if (operacao === "vistoria") {
    return <VistoriaUnidade onVoltar={voltarMenu} />;
  }

  // === RENDER MENU PRINCIPAL ===
  if (etapa === "menu") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between safe-area-inset-top">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6" aria-hidden="true" />
            <h1 className="font-semibold">Patrimônio Mobile</h1>
          </div>
          <div className="flex items-center gap-2">
            {countOperacoes > 0 && (
              <Badge variant="secondary" className="bg-primary-foreground/20">
                {countOperacoes} hoje
              </Badge>
            )}
            {isOnline ? (
              <Wifi className="w-5 h-5 text-primary-foreground/80" aria-hidden="true" />
            ) : (
              <WifiOff className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
            )}
          </div>
        </header>
        <FaixaOffline online={isOnline} mensagem={MENSAGEM_OFFLINE} />

        <main className="flex-1 p-4 space-y-3">
          <p className="text-center text-muted-foreground text-base mb-4">
            Selecione a operação
          </p>
          
          {OPERACOES.map((op) => {
            const Icon = op.icon;
            return (
              <button
                type="button"
                key={op.id}
                className="w-full min-h-11 rounded-lg border bg-card text-card-foreground text-left shadow-sm hover:border-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={() => {
                  setOperacao(op.id);
                  if (op.id === "vistoria") {
                    // Fluxo próprio: renderizado por <VistoriaUnidade />
                  } else if (op.id === "coleta") {
                    if (campanhaId) {
                      setEtapa("scan");
                    } else {
                      // Precisa selecionar campanha
                      setEtapa("unidade"); // Reutilizamos para campanha
                    }
                  } else if (op.id === "movimentacao" || op.id === "baixa") {
                    setEtapa("scan");
                  } else {
                    setEtapa(unidadeLocalId ? "formulario" : "unidade");
                  }
                }}
              >
                <span className="p-4 flex items-center gap-4">
                  <span className={`w-12 h-12 rounded-full ${op.cor} flex items-center justify-center shrink-0`}>
                    <Icon className="w-6 h-6" aria-hidden="true" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-medium">{op.titulo}</span>
                    <span className="block text-sm text-muted-foreground">{op.descricao}</span>
                  </span>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                </span>
              </button>
            );
          })}

          {/* Link para operações em lote (desktop/tablet) */}
          <Card className="mt-4 border-dashed">
            <Link to="/inventario/bens" className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <PackagePlus className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Cadastro em Lote</p>
                  <p className="text-sm text-muted-foreground">Acesse via desktop para operações em massa</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </CardContent>
            </Link>
          </Card>

          {unidadeLocalId && (
            <Alert className="mt-4">
              <Building2 className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span className="text-sm">
                  Unidade: <strong>{unidadeNome}</strong>
                </span>
                <Button variant="outline" className="min-h-11" onClick={() => {
                  setUnidadeLocalId("");
                  setUnidadeNome("");
                  localStorage.removeItem("patrimonio-mobile-unidade");
                }}>
                  Trocar
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {pendingCount > 0 && (
            <Alert>
              <CloudOff className="h-4 w-4" aria-hidden="true" />
              <AlertDescription className="space-y-3">
                <p className="text-base">
                  {pendingCount} coleta(s) salva(s) no aparelho aguardando envio
                </p>
                {isOnline && (
                  <Button 
                    className="w-full min-h-11"
                    onClick={syncColetas}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                    )}
                    {isSyncing ? "Sincronizando..." : `Sincronizar ${pendingCount} pendente(s)`}
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}
        </main>

        <footer className="p-4 border-t safe-area-inset-bottom">
          <Button asChild variant="ghost" className="w-full min-h-11">
            <Link to="/admin">
              <ArrowLeft className="w-4 h-4 mr-2" aria-hidden="true" />
              Voltar ao Sistema
            </Link>
          </Button>
        </footer>
      </div>
    );
  }

  // === RENDER SELEÇÃO DE UNIDADE/CAMPANHA ===
  if (etapa === "unidade") {
    const isCampanha = operacao === "coleta";
    
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between safe-area-inset-top">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/20 min-h-11 min-w-11"
              onClick={voltarMenu}
              aria-label="Voltar ao menu"
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </Button>
            <div>
              <h1 className="font-semibold text-base">
                {isCampanha ? "Selecionar Campanha" : "Selecionar Unidade"}
              </h1>
              <p className="text-xs opacity-80">
                {OPERACOES.find(o => o.id === operacao)?.titulo}
              </p>
            </div>
          </div>
        </header>
        <FaixaOffline online={isOnline} mensagem={MENSAGEM_OFFLINE} />

        <main className="flex-1 overflow-auto p-4">
          {isCampanha ? (
            // Seletor de Campanhas
            <div className="space-y-2">
              {campanhasAtivas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ClipboardList className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma campanha em andamento</p>
                </div>
              ) : (
                campanhasAtivas.map((campanha) => (
                  <button
                    type="button"
                    key={campanha.id}
                    aria-pressed={campanhaId === campanha.id}
                    className={`w-full min-h-11 rounded-lg border bg-card text-card-foreground text-left shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      campanhaId === campanha.id 
                        ? "border-primary bg-primary/5" 
                        : "hover:border-muted-foreground/50"
                    }`}
                    onClick={() => setCampanhaId(campanha.id)}
                  >
                    <span className="p-4 flex items-center justify-between">
                      <span>
                        <span className="block font-medium">{campanha.nome}</span>
                        <span className="block text-sm text-muted-foreground">
                          {campanha.total_conferidos || 0}/{campanha.total_bens_esperados || 0} bens
                        </span>
                      </span>
                      {campanhaId === campanha.id && (
                        <CheckCircle2 className="w-5 h-5 text-primary" aria-hidden="true" />
                      )}
                    </span>
                  </button>
                ))
              )}
            </div>
          ) : (
            // Seletor de Unidades
            <div className="space-y-2">
              {loadingUnidades ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" aria-hidden="true" />
                  <span className="sr-only">Carregando unidades...</span>
                </div>
              ) : (
                unidadesLocais.map((unidade) => (
                  <button
                    type="button"
                    key={unidade.id}
                    aria-pressed={unidadeLocalId === unidade.id}
                    className={`w-full min-h-11 rounded-lg border bg-card text-card-foreground text-left shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      unidadeLocalId === unidade.id 
                        ? "border-primary bg-primary/5" 
                        : "hover:border-muted-foreground/50"
                    }`}
                    onClick={() => handleSelectUnidade(unidade.id)}
                  >
                    <span className="p-4 flex items-center justify-between">
                      <span className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
                        <span>
                          <span className="block font-medium">{unidade.nome_unidade}</span>
                          <span className="block text-sm text-muted-foreground">
                            {unidade.codigo_unidade} • {unidade.municipio}
                          </span>
                        </span>
                      </span>
                      {unidadeLocalId === unidade.id && (
                        <CheckCircle2 className="w-5 h-5 text-primary" aria-hidden="true" />
                      )}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </main>

        <div className="p-4 border-t bg-background safe-area-inset-bottom">
          <Button 
            className="w-full h-14"
            disabled={isCampanha ? !campanhaId : !unidadeLocalId}
            onClick={() => setEtapa(isCampanha ? "scan" : "formulario")}
          >
            Continuar
            <ChevronRight className="w-5 h-5 ml-2" aria-hidden="true" />
          </Button>
        </div>
      </div>
    );
  }

  // === RENDER SCAN (para coleta/movimentação/baixa) ===
  if (etapa === "scan") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between safe-area-inset-top">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/20 min-h-11 min-w-11"
              onClick={voltarMenu}
              aria-label="Voltar ao menu"
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </Button>
            <div>
              <h1 className="font-semibold text-base">
                {OPERACOES.find(o => o.id === operacao)?.titulo}
              </h1>
              <p className="text-xs opacity-80">
                Escaneie ou busque o bem
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-primary-foreground/80" aria-hidden="true" />
            ) : (
              <WifiOff className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
            )}
          </div>
        </header>
        <FaixaOffline online={isOnline} mensagem={MENSAGEM_OFFLINE} />

        <div className="p-4 bg-muted/50 border-b">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleBuscar(); }}
            className="flex gap-2"
          >
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nº Patrimônio ou plaqueta antiga..."
              aria-label="Número do patrimônio"
              className="flex-1 h-12 text-lg"
              disabled={buscandoBem}
            />
            <Button 
              type="button" 
              size="icon" 
              className="h-12 w-12"
              onClick={() => setScannerOpen(true)}
              aria-label="Escanear QR Code"
            >
              <QrCode className="w-6 h-6" aria-hidden="true" />
            </Button>
          </form>
        </div>

        <main className="flex-1 overflow-auto p-4">
          {operacao === "coleta" && coletas && coletas.length > 0 && (
            <>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">
                Últimas Coletas
              </h2>
              <div className="space-y-2">
                {coletas.slice(0, 10).map((coleta) => {
                  const status = STATUS_COLETA.find(s => s.value === coleta.status_coleta);
                  const StatusIcon = status?.icon || CheckCircle2;
                  return (
                    <div 
                      key={coleta.id}
                      className="p-3 rounded-lg bg-card border flex items-center gap-3"
                    >
                      <div className={`w-10 h-10 rounded-full ${status?.color} flex items-center justify-center`}>
                        <StatusIcon className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="sr-only">{status?.label ?? coleta.status_coleta}</p>
                        <p className="font-mono font-medium">
                          {(coleta as any).bem?.numero_patrimonio}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {(coleta as any).bem?.descricao}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {(operacao === "movimentacao" || operacao === "baixa") && (
            <div className="text-center py-12 text-muted-foreground">
              <QrCode className="w-16 h-16 mx-auto mb-4 opacity-50" aria-hidden="true" />
              <p className="font-medium">Escaneie o QR Code do bem</p>
              <p className="text-base">ou digite o número do patrimônio</p>
            </div>
          )}
        </main>

        <div className="p-4 border-t bg-background safe-area-inset-bottom">
          <Button 
            className="w-full h-14 text-lg"
            onClick={() => setScannerOpen(true)}
          >
            <QrCode className="w-6 h-6 mr-2" aria-hidden="true" />
            Escanear QR Code
          </Button>
        </div>

        <QRCodeScanner 
          isOpen={scannerOpen}
          onScan={handleScan}
          onClose={() => setScannerOpen(false)}
        />
      </div>
    );
  }

  // === RENDER FORMULÁRIO ===
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between safe-area-inset-top">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/20 min-h-11 min-w-11"
            aria-label="Voltar"
            onClick={() => {
              if (operacao === "coleta" || operacao === "movimentacao" || operacao === "baixa") {
                setEtapa("scan");
                setBemSelecionado(null);
              } else {
                setEtapa("unidade");
              }
            }}
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
          </Button>
          <div>
            <h1 className="font-semibold text-base">
              {OPERACOES.find(o => o.id === operacao)?.titulo}
            </h1>
            <p className="text-xs opacity-80">
              {bemSelecionado ? bemSelecionado.numero_patrimonio : unidadeNome}
            </p>
          </div>
        </div>
        {isOnline ? (
          <Wifi className="w-5 h-5 text-primary-foreground/80" aria-hidden="true" />
        ) : (
          <WifiOff className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
        )}
      </header>
      <FaixaOffline online={isOnline} mensagem={MENSAGEM_OFFLINE} />

      <main className="flex-1 overflow-auto p-4 space-y-4 pb-24">
        {/* Dados do bem (se selecionado) */}
        {bemSelecionado && (
          <Card className="bg-muted/50">
            <CardContent className="p-3">
              <p className="font-mono font-bold">{bemSelecionado.numero_patrimonio}</p>
              <p className="text-sm text-muted-foreground">{bemSelecionado.descricao}</p>
            </CardContent>
          </Card>
        )}

        {/* === CAMPOS PARA CADASTRO === */}
        {(operacao === "cadastro_novo" || operacao === "cadastro_existente") && (
          <>
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaBem)}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS_DISPONIVEIS.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {CATEGORIAS_LABEL[cat]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descrição *</Label>
              <Textarea 
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder={DICAS_DESCRICAO[categoria]}
                rows={3}
                className="text-base"
              />
            </div>

            <div className="space-y-2">
              <Label>Estado de Conservação</Label>
              <Select value={estadoConservacao} onValueChange={(v) => setEstadoConservacao(v as EstadoConservacao)}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ESTADOS_CONSERVACAO_LABEL).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {operacao === "cadastro_existente" && (
              <div className="space-y-2">
                <Label>Tombamento anterior (plaqueta antiga)</Label>
                <Input 
                  value={tombamentoAnterior}
                  onChange={(e) => setTombamentoAnterior(e.target.value)}
                  placeholder="Número da plaqueta antiga, se existir"
                  className="h-12"
                />
                <p className="text-sm text-muted-foreground">
                  O sistema gera um número novo; a plaqueta antiga fica registrada e continua sendo encontrada na busca.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Local Específico</Label>
              <Input 
                value={localizacao}
                onChange={(e) => setLocalizacao(e.target.value)}
                placeholder="Ex: Sala 101, Depósito B"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea 
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Informações adicionais..."
                rows={2}
              />
            </div>
          </>
        )}

        {/* === CAMPOS PARA COLETA === */}
        {operacao === "coleta" && (
          <>
            <div className="space-y-2">
              <Label>Status da Coleta *</Label>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_COLETA.map((status) => {
                  const Icon = status.icon;
                  return (
                    <button
                      key={status.value}
                      type="button"
                      onClick={() => setStatusColeta(status.value)}
                      aria-pressed={statusColeta === status.value}
                      className={`min-h-11 p-3 rounded-lg border-2 flex items-center gap-2 transition-colors ${
                        statusColeta === status.value 
                          ? "border-primary bg-primary/10" 
                          : "border-border"
                      }`}
                    >
                      <Icon className="w-5 h-5" aria-hidden="true" />
                      <span className="text-base">{status.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Unidade Encontrada</Label>
              <Select value={unidadeLocalId} onValueChange={setUnidadeLocalId}>
                <SelectTrigger className="h-12">
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

            <div className="space-y-2">
              <Label>Sala/Local</Label>
              <Input 
                value={localizacao}
                onChange={(e) => setLocalizacao(e.target.value)}
                placeholder="Ex: Sala 101"
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea 
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                placeholder="Observações adicionais..."
                rows={2}
              />
            </div>
          </>
        )}

        {/* === CAMPOS PARA MOVIMENTAÇÃO === */}
        {operacao === "movimentacao" && (
          <>
            <div className="space-y-2">
              <Label>Unidade de Destino *</Label>
              <Select value={unidadeDestino} onValueChange={setUnidadeDestino}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione a unidade de destino..." />
                </SelectTrigger>
                <SelectContent>
                  {unidades?.filter(u => u.id !== bemSelecionado?.unidade_local_id).map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nome_unidade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Motivo da Transferência</Label>
              <Textarea 
                value={motivoMovimentacao}
                onChange={(e) => setMotivoMovimentacao(e.target.value)}
                placeholder="Descreva o motivo da transferência..."
                rows={3}
              />
            </div>
          </>
        )}

        {/* === CAMPOS PARA BAIXA === */}
        {operacao === "baixa" && (
          <>
            <div className="space-y-2">
              <Label>Motivo da Baixa *</Label>
              <Select value={motivoBaixa} onValueChange={(v) => setMotivoBaixa(v as MotivoBaixa)}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione o motivo..." />
                </SelectTrigger>
                <SelectContent>
                  {MOTIVOS_BAIXA.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Alert>
              <Info className="h-4 w-4" aria-hidden="true" />
              <AlertDescription className="text-sm">
                Extravio, furto/roubo ou sinistro não são baixa: comunique ao setor de patrimônio
                para registro da ocorrência e apuração.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Justificativa *</Label>
              <Textarea 
                value={justificativaBaixa}
                onChange={(e) => setJustificativaBaixa(e.target.value)}
                placeholder="Descreva detalhadamente o estado do bem e motivo da baixa..."
                rows={4}
              />
            </div>
          </>
        )}

        {/* === FOTO (OBRIGATÓRIA PARA TODOS) === */}
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            <Camera className="w-4 h-4" />
            Foto do Bem *
          </Label>
          
          {fotoCapturada ? (
            <div className="relative">
              <img 
                src={fotoCapturada} 
                alt="Foto capturada" 
                className="w-full h-48 object-cover rounded-lg border"
              />
              <Button
                variant="secondary"
                className="absolute bottom-2 right-2 min-h-11"
                onClick={() => setCameraOpen(true)}
              >
                <Camera className="w-4 h-4 mr-1" aria-hidden="true" />
                Tirar outra foto
              </Button>
            </div>
          ) : (
            <Button 
              type="button"
              variant="outline"
              className="w-full h-24 border-dashed"
              onClick={() => setCameraOpen(true)}
            >
              <div className="flex flex-col items-center gap-2">
                <Camera className="w-8 h-8 text-muted-foreground" aria-hidden="true" />
                <span>Tirar foto (obrigatório)</span>
              </div>
            </Button>
          )}
        </div>

        {/* GPS (opcional) */}
        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            className="flex-1 min-h-11"
            onClick={obterGPS}
          >
            <MapPin className="w-4 h-4 mr-2" aria-hidden="true" />
            {gpsLocation ? "Localização obtida" : "Obter localização"}
          </Button>
        </div>
      </main>

      {/* Footer com botões */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t safe-area-inset-bottom">
        <Button 
          className="w-full h-14 text-lg"
          onClick={handleSubmit}
          disabled={isSubmitting || uploadingFoto}
        >
          {(isSubmitting || uploadingFoto) ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Salvar
            </>
          )}
        </Button>
      </div>

      {/* Camera */}
      <CameraCapture
        isOpen={cameraOpen}
        onCapture={handleCapturePhoto}
        onClose={() => setCameraOpen(false)}
      />

      {/* QR Scanner */}
      <QRCodeScanner 
        isOpen={scannerOpen}
        onScan={handleScan}
        onClose={() => setScannerOpen(false)}
      />

      {/* Dialog de Sucesso */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader className="text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-success" />
            </div>
            <DialogTitle className="text-xl">Operação Realizada!</DialogTitle>
            <DialogDescription>
              {resultadoOperacao}
            </DialogDescription>
          </DialogHeader>
          
          {(operacao === "cadastro_novo" || operacao === "cadastro_existente") && (
            <div className="p-4 bg-muted rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Número de Tombamento</p>
              <p className="text-2xl font-mono font-bold tracking-wider">{resultadoOperacao}</p>
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            {(operacao === "cadastro_novo" || operacao === "cadastro_existente") && bemEtiqueta && (
              <Button variant="outline" className="w-full min-h-11" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Imprimir Etiqueta
              </Button>
            )}
            <Button 
              className="w-full min-h-11" 
              onClick={() => {
                setSuccessDialogOpen(false);
                if (operacao === "coleta" || operacao === "movimentacao" || operacao === "baixa") {
                  setEtapa("scan");
                }
                // Para cadastro, mantém na mesma unidade
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              {operacao === "coleta" ? "Próximo Bem" : 
               operacao === "movimentacao" || operacao === "baixa" ? "Continuar" :
               "Cadastrar Outro"}
            </Button>
            <Button variant="ghost" className="w-full min-h-11" onClick={voltarMenu}>
              <Home className="w-4 h-4 mr-2" />
              Menu Principal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
