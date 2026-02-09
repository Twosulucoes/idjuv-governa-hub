/**
 * PÁGINA: CADASTRO DE BENS MOBILE (PWA)
 * 
 * Interface mobile-first para cadastramento simplificado de bens
 * Dois fluxos: Novo Produto e Bem Existente
 * 
 * Melhorias:
 * - Seleção de unidade persistente entre cadastros
 * - Ordem inteligente: Categoria → Descrição
 * - Campo de observações
 * - Dicas de preenchimento para padronização
 * 
 * @version 1.1.0
 */

import { useState, useCallback, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Package, Plus, ClipboardList, Wifi, WifiOff, 
  ArrowLeft, Camera, CheckCircle2, Printer, X,
  Building2, Tag, Loader2, Info, ChevronRight, FileText
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { CameraCapture } from "@/components/mobile/CameraCapture";
import { supabase } from "@/integrations/supabase/client";
import {
  useCadastroBemSimplificado,
  CATEGORIAS_LABEL,
  ESTADOS_CONSERVACAO_LABEL,
  type CategoriaBem,
  type EstadoConservacao,
} from "@/hooks/patrimonio/useCadastroBemSimplificado";

type TipoCadastro = "novo" | "existente";
type Etapa = "unidade" | "formulario";

const CATEGORIAS_DISPONIVEIS: CategoriaBem[] = [
  "mobiliario",
  "informatica",
  "equipamento_esportivo",
  "veiculo",
  "eletrodomestico",
  "outros",
];

// Dicas de preenchimento por categoria
const DICAS_DESCRICAO: Record<CategoriaBem, string> = {
  mobiliario: "Ex: Mesa de escritório em MDF cor cinza, 4 gavetas",
  informatica: "Ex: Notebook Dell Latitude 5520, 16GB RAM, SSD 512GB",
  equipamento_esportivo: "Ex: Esteira ergométrica Movement LX-160",
  veiculo: "Ex: Carro Fiat Argo 1.0, ano 2023, cor prata",
  eletrodomestico: "Ex: Ar-condicionado Split 12.000 BTUs, Consul",
  outros: "Ex: Descrição detalhada do bem com características principais",
};

const DICAS_CATEGORIA: Record<CategoriaBem, string> = {
  mobiliario: "Mesas, cadeiras, armários, estantes, gaveteiros",
  informatica: "Computadores, notebooks, impressoras, projetores",
  equipamento_esportivo: "Aparelhos de ginástica, bolas, redes, tatames",
  veiculo: "Carros, motos, vans, ônibus",
  eletrodomestico: "Ar-condicionado, geladeira, micro-ondas, bebedouro",
  outros: "Itens que não se enquadram nas demais categorias",
};

export default function CadastroBemMobilePage() {
  const { user } = useAuth();
  const { unidadesLocais, loadingUnidades, cadastrarBem, isSubmitting } = useCadastroBemSimplificado();
  
  // Estados de navegação
  const [tipoCadastro, setTipoCadastro] = useState<TipoCadastro | null>(null);
  const [etapa, setEtapa] = useState<Etapa>("unidade");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [tombamentoGerado, setTombamentoGerado] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [countCadastrados, setCountCadastrados] = useState(0);
  
  // Form - Unidade persistente entre cadastros
  const [unidadeLocalId, setUnidadeLocalId] = useState("");
  const [unidadeNome, setUnidadeNome] = useState("");
  
  // Form - Campos do bem (ordem: categoria → descrição → detalhes)
  const [categoria, setCategoria] = useState<CategoriaBem>("mobiliario");
  const [descricao, setDescricao] = useState("");
  const [estadoConservacao, setEstadoConservacao] = useState<EstadoConservacao>("bom");
  const [localizacao, setLocalizacao] = useState("");
  const [observacao, setObservacao] = useState("");
  
  // Form - Campos exclusivos de "Bem Existente"
  const [tombamentoAnterior, setTombamentoAnterior] = useState("");
  const [fotoCapturada, setFotoCapturada] = useState<string | null>(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);

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

  // Carregar unidade salva do localStorage
  useEffect(() => {
    const savedUnidade = localStorage.getItem("cadastro-mobile-unidade");
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

  // Salvar unidade no localStorage
  const handleSelectUnidade = (id: string) => {
    const unidade = unidadesLocais.find(u => u.id === id);
    if (unidade) {
      setUnidadeLocalId(id);
      setUnidadeNome(unidade.nome_unidade);
      localStorage.setItem("cadastro-mobile-unidade", JSON.stringify({
        id: unidade.id,
        nome: unidade.nome_unidade,
      }));
    }
  };

  // Upload foto para storage
  const uploadFoto = async (imageData: string): Promise<string | null> => {
    if (!isOnline) {
      toast.error("Sem conexão", { description: "Foto não pode ser enviada offline" });
      return null;
    }
    
    setUploadingFoto(true);
    try {
      const response = await fetch(imageData);
      const blob = await response.blob();
      
      // Verificar tamanho (max 5MB)
      if (blob.size > 5 * 1024 * 1024) {
        toast.error("Foto muito grande", { description: "Máximo 5MB" });
        return null;
      }
      
      const fileName = `cadastro/${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      
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

  // Reset form (mantém unidade)
  const resetFormFields = () => {
    setDescricao("");
    setCategoria("mobiliario");
    setEstadoConservacao("bom");
    setLocalizacao("");
    setObservacao("");
    setTombamentoAnterior("");
    setFotoCapturada(null);
  };

  // Submeter cadastro
  const handleSubmit = async () => {
    // Validações
    if (!unidadeLocalId) {
      toast.error("Selecione a unidade");
      setEtapa("unidade");
      return;
    }
    if (!descricao.trim()) {
      toast.error("Informe a descrição do bem");
      return;
    }
    
    // Validações específicas para bem existente
    if (tipoCadastro === "existente" && !fotoCapturada) {
      toast.error("Foto obrigatória", { description: "Tire uma foto do bem para comprovação" });
      return;
    }

    if (!isOnline) {
      toast.error("Sem conexão", { description: "Conecte-se à internet para cadastrar" });
      return;
    }

    try {
      // Upload da foto se houver
      let fotoUrl: string | null = null;
      if (fotoCapturada) {
        fotoUrl = await uploadFoto(fotoCapturada);
      }

      // Montar observação completa
      let observacaoFinal = "";
      if (tipoCadastro === "existente") {
        observacaoFinal = `Regularização de bem existente.`;
        if (tombamentoAnterior) {
          observacaoFinal += ` Tombamento anterior: ${tombamentoAnterior}.`;
        }
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
        forma_aquisicao: tipoCadastro === "novo" ? "compra" : "transferencia",
        possui_tombamento_externo: !!tombamentoAnterior,
        numero_patrimonio_externo: tombamentoAnterior || undefined,
        observacao: observacaoFinal || undefined,
      });

      // Atualizar foto do bem se foi enviada
      if (fotoUrl && resultado?.id) {
        await supabase
          .from("bens_patrimoniais")
          .update({ foto_bem_url: fotoUrl })
          .eq("id", resultado.id);
      }

      setTombamentoGerado(resultado.numero_patrimonio);
      setCountCadastrados(prev => prev + 1);
      setSuccessDialogOpen(true);
      resetFormFields();
    } catch (error) {
      // Erro tratado pelo hook
    }
  };

  // Imprimir etiqueta
  const handlePrint = () => {
    const printContent = `
      <html>
        <head>
          <title>Etiqueta Patrimônio</title>
          <style>
            body { font-family: Arial; text-align: center; padding: 20px; }
            .tombamento { font-size: 32px; font-weight: bold; letter-spacing: 2px; }
            .descricao { font-size: 14px; margin-top: 10px; color: #666; }
            .unidade { font-size: 12px; margin-top: 5px; color: #888; }
          </style>
        </head>
        <body>
          <div class="tombamento">${tombamentoGerado}</div>
          <div class="descricao">${descricao}</div>
          <div class="unidade">${unidadeNome}</div>
        </body>
      </html>
    `;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Trocar unidade
  const handleChangeUnidade = () => {
    setEtapa("unidade");
  };

  // Tela inicial - Seleção do tipo
  if (!tipoCadastro) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between safe-area-inset-top">
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6" />
            <h1 className="font-semibold">Cadastro de Patrimônio</h1>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-primary-foreground/80" />
            ) : (
              <WifiOff className="w-5 h-5 text-destructive-foreground" />
            )}
          </div>
        </header>

        {/* Seleção do tipo de cadastro */}
        <main className="flex-1 p-4 flex flex-col gap-4">
          <p className="text-center text-muted-foreground">
            Selecione o tipo de cadastro
          </p>
          
          <Card 
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => {
              setTipoCadastro("novo");
              setEtapa(unidadeLocalId ? "formulario" : "unidade");
            }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="w-5 h-5 text-primary" />
                Novo Produto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Cadastrar bem recém-adquirido. Campos básicos: descrição, categoria e unidade.
              </CardDescription>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => {
              setTipoCadastro("existente");
              setEtapa(unidadeLocalId ? "formulario" : "unidade");
            }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ClipboardList className="w-5 h-5 text-primary" />
                Bem Existente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Regularizar bem que já existe na unidade. Requer foto obrigatória e estado de conservação.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Unidade selecionada anteriormente */}
          {unidadeLocalId && (
            <Alert className="mt-4">
              <Building2 className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span className="text-sm">
                  Unidade: <strong>{unidadeNome}</strong>
                </span>
                <Button variant="link" size="sm" onClick={() => {
                  setUnidadeLocalId("");
                  setUnidadeNome("");
                  localStorage.removeItem("cadastro-mobile-unidade");
                }}>
                  Trocar
                </Button>
              </AlertDescription>
            </Alert>
          )}
        </main>

        {/* Footer */}
        <footer className="p-4 border-t safe-area-inset-bottom">
          <Button asChild variant="ghost" className="w-full">
            <Link to="/admin">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Sistema
            </Link>
          </Button>
        </footer>
      </div>
    );
  }

  // Etapa 1 - Seleção de Unidade
  if (etapa === "unidade") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between safe-area-inset-top">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setTipoCadastro(null)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-sm">Selecionar Unidade</h1>
              <p className="text-xs opacity-80">
                {tipoCadastro === "novo" ? "Novo Produto" : "Bem Existente"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-primary-foreground/80" />
            ) : (
              <WifiOff className="w-5 h-5 text-destructive-foreground" />
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4">
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription>
              Selecione a unidade onde os bens serão cadastrados. Esta seleção será mantida para os próximos cadastros.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            {loadingUnidades ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              unidadesLocais.map((unidade) => (
                <Card 
                  key={unidade.id}
                  className={`cursor-pointer transition-colors ${
                    unidadeLocalId === unidade.id 
                      ? "border-primary bg-primary/5" 
                      : "hover:border-muted-foreground/50"
                  }`}
                  onClick={() => handleSelectUnidade(unidade.id)}
                >
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{unidade.nome_unidade}</p>
                        <p className="text-xs text-muted-foreground">
                          {unidade.codigo_unidade} • {unidade.municipio}
                        </p>
                      </div>
                    </div>
                    {unidadeLocalId === unidade.id && (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </main>

        {/* Footer */}
        <div className="p-4 border-t bg-background safe-area-inset-bottom">
          <Button 
            className="w-full h-14"
            disabled={!unidadeLocalId}
            onClick={() => setEtapa("formulario")}
          >
            Continuar para Cadastro
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  // Etapa 2 - Formulário de cadastro
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 safe-area-inset-top">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              className="text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setTipoCadastro(null)}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-sm">
                {tipoCadastro === "novo" ? "Novo Produto" : "Bem Existente"}
              </h1>
              <p className="text-xs opacity-80">Cadastro de Patrimônio</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {countCadastrados > 0 && (
              <Badge className="bg-primary-foreground text-primary">
                {countCadastrados} cadastrado{countCadastrados > 1 ? "s" : ""}
              </Badge>
            )}
            {isOnline ? (
              <Wifi className="w-5 h-5 text-primary-foreground/80" />
            ) : (
              <WifiOff className="w-5 h-5 text-destructive-foreground" />
            )}
          </div>
        </div>
        
        {/* Unidade selecionada */}
        <div className="mt-3 flex items-center justify-between bg-primary-foreground/10 rounded-lg p-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            <span className="text-sm font-medium">{unidadeNome}</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary-foreground hover:bg-primary-foreground/20 h-7 text-xs"
            onClick={handleChangeUnidade}
          >
            Trocar
          </Button>
        </div>
      </header>

      {/* Formulário */}
      <main className="flex-1 overflow-auto p-4 space-y-5">
        
        {/* 1. CATEGORIA (primeiro para guiar descrição) */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-base font-semibold">
            <Tag className="w-4 h-4" />
            1. Categoria do Bem *
          </Label>
          <RadioGroup 
            value={categoria} 
            onValueChange={(v) => setCategoria(v as CategoriaBem)}
            className="grid grid-cols-2 gap-2"
          >
            {CATEGORIAS_DISPONIVEIS.map((cat) => (
              <Label
                key={cat}
                htmlFor={cat}
                className={`
                  flex flex-col p-3 rounded-lg border cursor-pointer transition-colors text-center
                  ${categoria === cat ? "border-primary bg-primary/5" : "border-border"}
                `}
              >
                <RadioGroupItem value={cat} id={cat} className="sr-only" />
                <span className="font-medium text-sm">{CATEGORIAS_LABEL[cat]}</span>
              </Label>
            ))}
          </RadioGroup>
          <p className="text-xs text-muted-foreground flex items-start gap-1">
            <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
            {DICAS_CATEGORIA[categoria]}
          </p>
        </div>

        {/* 2. DESCRIÇÃO */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">2. Descrição do Bem *</Label>
          <Textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder={DICAS_DESCRICAO[categoria]}
            className="min-h-[100px] text-base"
          />
          <Alert className="py-2">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <strong>Dica de padronização:</strong> Informe tipo + marca + modelo + características principais (cor, tamanho, material).
            </AlertDescription>
          </Alert>
        </div>

        {/* 3. ESTADO DE CONSERVAÇÃO */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">3. Estado de Conservação *</Label>
          <Select value={estadoConservacao} onValueChange={(v) => setEstadoConservacao(v as EstadoConservacao)}>
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ESTADOS_CONSERVACAO_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 4. LOCALIZAÇÃO ESPECÍFICA */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">4. Localização Específica</Label>
          <Input
            value={localizacao}
            onChange={(e) => setLocalizacao(e.target.value)}
            placeholder="Ex: Sala 201, próximo à janela"
            className="h-12"
          />
          <p className="text-xs text-muted-foreground">
            Onde exatamente o bem está dentro da unidade (sala, andar, setor).
          </p>
        </div>

        {/* Campos exclusivos para Bem Existente */}
        {tipoCadastro === "existente" && (
          <>
            {/* 5. TOMBAMENTO ANTERIOR */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">5. Tombamento Anterior (se tiver)</Label>
              <Input
                value={tombamentoAnterior}
                onChange={(e) => setTombamentoAnterior(e.target.value)}
                placeholder="Ex: PAT-12345 ou número antigo"
                className="h-12"
              />
              <p className="text-xs text-muted-foreground">
                Informe o número de patrimônio antigo, se o bem já possuía.
              </p>
            </div>

            {/* 6. FOTO OBRIGATÓRIA */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-base font-semibold">
                <Camera className="w-4 h-4" />
                6. Foto do Bem * (Obrigatória)
              </Label>
              
              {fotoCapturada ? (
                <div className="relative">
                  <img 
                    src={fotoCapturada} 
                    alt="Foto do bem" 
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={() => setFotoCapturada(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-24 border-dashed border-2"
                  onClick={() => setCameraOpen(true)}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Camera className="w-8 h-8 text-muted-foreground" />
                    <span className="text-muted-foreground">Tirar Foto</span>
                  </div>
                </Button>
              )}
              <p className="text-xs text-muted-foreground">
                A foto é obrigatória para comprovação de bens existentes.
              </p>
            </div>
          </>
        )}

        {/* OBSERVAÇÕES (campo novo) */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2 text-base font-semibold">
            <FileText className="w-4 h-4" />
            {tipoCadastro === "existente" ? "7. Observações" : "5. Observações"}
          </Label>
          <Textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Informações adicionais sobre o bem..."
            className="min-h-[80px]"
          />
          <p className="text-xs text-muted-foreground">
            Opcional. Registre informações relevantes como defeitos, pendências ou histórico.
          </p>
        </div>
      </main>

      {/* Botão de Cadastrar */}
      <div className="p-4 border-t bg-background safe-area-inset-bottom">
        <Button 
          className="w-full h-14 text-lg"
          onClick={handleSubmit}
          disabled={isSubmitting || uploadingFoto || !isOnline}
        >
          {isSubmitting || uploadingFoto ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {uploadingFoto ? "Enviando foto..." : "Cadastrando..."}
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Cadastrar Bem
            </>
          )}
        </Button>
      </div>

      {/* Camera Capture */}
      <CameraCapture
        isOpen={cameraOpen}
        onCapture={handleCapturePhoto}
        onClose={() => setCameraOpen(false)}
      />

      {/* Dialog de Sucesso */}
      <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary">
              <CheckCircle2 className="w-5 h-5" />
              Bem Cadastrado!
            </DialogTitle>
            <DialogDescription>
              O bem foi cadastrado com sucesso no sistema.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 bg-muted rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-2">Número de Tombamento</p>
            <p className="text-3xl font-mono font-bold tracking-wider">
              {tombamentoGerado}
            </p>
            <p className="text-xs text-muted-foreground mt-2">{unidadeNome}</p>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={handlePrint} variant="outline" className="w-full">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir Etiqueta
            </Button>
            <Button 
              onClick={() => {
                setSuccessDialogOpen(false);
                // Mantém na mesma unidade para cadastrar outro
              }} 
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Outro na Mesma Unidade
            </Button>
            <Button 
              variant="ghost"
              onClick={() => {
                setSuccessDialogOpen(false);
                setTipoCadastro(null);
              }} 
              className="w-full"
            >
              Voltar ao Início
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
