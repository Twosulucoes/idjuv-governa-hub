/**
 * PÁGINA: CADASTRO DE BENS MOBILE (PWA)
 * 
 * Interface mobile-first para cadastramento simplificado de bens
 * Dois fluxos: Novo Produto e Bem Existente
 * 
 * @version 1.0.0
 */

import { useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
  Package, Plus, ClipboardList, Wifi, WifiOff, 
  ArrowLeft, Camera, CheckCircle2, Printer, X,
  Building2, Tag, Loader2
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

const CATEGORIAS_DISPONIVEIS: CategoriaBem[] = [
  "mobiliario",
  "informatica",
  "veiculo",
];

export default function CadastroBemMobilePage() {
  const { user } = useAuth();
  const { unidadesLocais, loadingUnidades, cadastrarBem, isSubmitting } = useCadastroBemSimplificado();
  
  // Estados
  const [tipoCadastro, setTipoCadastro] = useState<TipoCadastro | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [tombamentoGerado, setTombamentoGerado] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Form - Campos comuns
  const [unidadeLocalId, setUnidadeLocalId] = useState("");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState<CategoriaBem>("mobiliario");
  const [estadoConservacao, setEstadoConservacao] = useState<EstadoConservacao>("bom");
  const [localizacao, setLocalizacao] = useState("");
  
  // Form - Campos exclusivos de "Bem Existente"
  const [tombamentoAnterior, setTombamentoAnterior] = useState("");
  const [fotoCapturada, setFotoCapturada] = useState<string | null>(null);
  const [uploadingFoto, setUploadingFoto] = useState(false);

  // Monitor online status
  useState(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  });

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

  // Reset form
  const resetForm = () => {
    setDescricao("");
    setCategoria("mobiliario");
    setEstadoConservacao("bom");
    setLocalizacao("");
    setTombamentoAnterior("");
    setFotoCapturada(null);
  };

  // Submeter cadastro
  const handleSubmit = async () => {
    // Validações
    if (!unidadeLocalId) {
      toast.error("Selecione a unidade");
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

      const resultado = await cadastrarBem({
        unidade_local_id: unidadeLocalId,
        descricao: descricao.trim(),
        categoria_bem: categoria,
        estado_conservacao: estadoConservacao,
        localizacao_especifica: localizacao || undefined,
        forma_aquisicao: tipoCadastro === "novo" ? "compra" : "transferencia",
        possui_tombamento_externo: !!tombamentoAnterior,
        numero_patrimonio_externo: tombamentoAnterior || undefined,
        observacao: tipoCadastro === "existente" 
          ? `Regularização de bem existente.${tombamentoAnterior ? ` Tombamento anterior: ${tombamentoAnterior}` : ""}` 
          : undefined,
      });

      // Atualizar foto do bem se foi enviada
      if (fotoUrl && resultado?.id) {
        await supabase
          .from("bens_patrimoniais")
          .update({ foto_bem_url: fotoUrl })
          .eq("id", resultado.id);
      }

      setTombamentoGerado(resultado.numero_patrimonio);
      setSuccessDialogOpen(true);
      resetForm();
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
          </style>
        </head>
        <body>
          <div class="tombamento">${tombamentoGerado}</div>
          <div class="descricao">${descricao}</div>
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
              <Wifi className="w-5 h-5 text-success" />
            ) : (
              <WifiOff className="w-5 h-5 text-warning" />
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
            onClick={() => setTipoCadastro("novo")}
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
            onClick={() => setTipoCadastro("existente")}
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

  // Formulário de cadastro
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
            <h1 className="font-semibold text-sm">
              {tipoCadastro === "novo" ? "Novo Produto" : "Bem Existente"}
            </h1>
            <p className="text-xs opacity-80">Cadastro de Patrimônio</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-5 h-5 text-success" />
          ) : (
            <WifiOff className="w-5 h-5 text-warning" />
          )}
        </div>
      </header>

      {/* Formulário */}
      <main className="flex-1 overflow-auto p-4 space-y-4">
        {/* Unidade Local */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Unidade Local *
          </Label>
          <Select value={unidadeLocalId} onValueChange={setUnidadeLocalId}>
            <SelectTrigger className="h-12">
              <SelectValue placeholder="Selecione a unidade..." />
            </SelectTrigger>
            <SelectContent>
              {loadingUnidades ? (
                <div className="p-4 text-center text-muted-foreground">
                  Carregando...
                </div>
              ) : (
                unidadesLocais.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.nome_unidade}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <Label>Descrição do Bem *</Label>
          <Textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex: Mesa de escritório em MDF, cor cinza..."
            className="min-h-[80px]"
          />
        </div>

        {/* Categoria */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Categoria *
          </Label>
          <RadioGroup 
            value={categoria} 
            onValueChange={(v) => setCategoria(v as CategoriaBem)}
            className="grid grid-cols-1 gap-2"
          >
            {CATEGORIAS_DISPONIVEIS.map((cat) => (
              <Label
                key={cat}
                htmlFor={cat}
                className={`
                  flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                  ${categoria === cat ? "border-primary bg-primary/5" : "border-border"}
                `}
              >
                <RadioGroupItem value={cat} id={cat} />
                <span>{CATEGORIAS_LABEL[cat]}</span>
              </Label>
            ))}
          </RadioGroup>
        </div>

        {/* Estado de Conservação (sempre visível, mas destaque para existente) */}
        <div className="space-y-2">
          <Label>Estado de Conservação *</Label>
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

        {/* Localização Específica */}
        <div className="space-y-2">
          <Label>Localização Específica</Label>
          <Input
            value={localizacao}
            onChange={(e) => setLocalizacao(e.target.value)}
            placeholder="Ex: Sala 201, próximo à janela"
            className="h-12"
          />
        </div>

        {/* Campos exclusivos para Bem Existente */}
        {tipoCadastro === "existente" && (
          <>
            {/* Tombamento Anterior */}
            <div className="space-y-2">
              <Label>Tombamento Anterior (se tiver)</Label>
              <Input
                value={tombamentoAnterior}
                onChange={(e) => setTombamentoAnterior(e.target.value)}
                placeholder="Ex: PAT-12345 ou número antigo"
                className="h-12"
              />
            </div>

            {/* Foto Obrigatória */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Camera className="w-4 h-4" />
                Foto do Bem *
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
                  className="w-full h-24 border-dashed"
                  onClick={() => setCameraOpen(true)}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Camera className="w-8 h-8 text-muted-foreground" />
                    <span className="text-muted-foreground">Tirar Foto</span>
                  </div>
                </Button>
              )}
            </div>
          </>
        )}
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
            <DialogTitle className="flex items-center gap-2 text-success">
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
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button onClick={handlePrint} variant="outline" className="w-full">
              <Printer className="w-4 h-4 mr-2" />
              Imprimir Etiqueta
            </Button>
            <Button 
              onClick={() => {
                setSuccessDialogOpen(false);
                setTipoCadastro(null);
              }} 
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Cadastrar Outro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
