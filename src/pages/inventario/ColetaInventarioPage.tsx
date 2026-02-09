/**
 * PÁGINA: COLETA DE INVENTÁRIO
 * Interface para conferência de bens via busca ou QR Code
 * 
 * NOTA: Para coleta em campo, use o app mobile em /coleta-mobile
 */

import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, QrCode, Search, CheckCircle2, AlertTriangle,
  Package, MapPin, User, Camera, Save, X, Clock, Smartphone
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { toast } from "sonner";
import { 
  useCampanhaInventario, 
  useColetasInventario, 
  useCreateColeta,
  useBensPatrimoniais,
  useUnidadesLocaisPatrimonio 
} from "@/hooks/usePatrimonio";

const STATUS_COLETA_OPTIONS = [
  { value: "conferido", label: "Conferido", description: "Bem localizado sem divergências" },
  { value: "divergente", label: "Divergente", description: "Localização ou estado diferente do esperado" },
  { value: "nao_localizado", label: "Não Localizado", description: "Bem não encontrado no local" },
  { value: "sem_etiqueta", label: "Sem Etiqueta", description: "Bem encontrado sem plaqueta" },
];

export default function ColetaInventarioPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [busca, setBusca] = useState("");
  const [bemSelecionado, setBemSelecionado] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form state
  const [statusColeta, setStatusColeta] = useState("conferido");
  const [unidadeEncontrada, setUnidadeEncontrada] = useState("");
  const [salaEncontrada, setSalaEncontrada] = useState("");
  const [detalheLocalizacao, setDetalheLocalizacao] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  
  const { data: campanha, isLoading } = useCampanhaInventario(id);
  const { data: coletas, refetch: refetchColetas } = useColetasInventario(id || "");
  const { data: bens } = useBensPatrimoniais();
  const { data: unidades } = useUnidadesLocaisPatrimonio();
  const createColeta = useCreateColeta();

  // Auto-focus no input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleBuscar = () => {
    if (!busca.trim()) return;
    
    const bemEncontrado = bens?.find(b => 
      b.numero_patrimonio?.toLowerCase() === busca.toLowerCase() ||
      b.codigo_qr?.toLowerCase() === busca.toLowerCase()
    );
    
    if (bemEncontrado) {
      // Verificar se já foi coletado
      const jaColetado = coletas?.find(c => c.bem_id === bemEncontrado.id);
      if (jaColetado) {
        toast.warning("Este bem já foi conferido nesta campanha", {
          description: `Coletado em ${format(new Date(jaColetado.data_coleta), "dd/MM/yyyy HH:mm")}`
        });
        setBusca("");
        return;
      }
      
      setBemSelecionado(bemEncontrado);
      setUnidadeEncontrada(bemEncontrado.unidade_local_id || "");
      setSalaEncontrada(bemEncontrado.sala || "");
      setDialogOpen(true);
    } else {
      toast.error("Bem não encontrado", {
        description: "Verifique o número do patrimônio ou código QR"
      });
    }
    setBusca("");
  };

  const handleRegistrarColeta = async () => {
    if (!id || !bemSelecionado) return;

    try {
      await createColeta.mutateAsync({
        campanha_id: id,
        bem_id: bemSelecionado.id,
        status_coleta: statusColeta as any,
        localizacao_encontrada_unidade_id: unidadeEncontrada || null,
        localizacao_encontrada_sala: salaEncontrada || null,
        localizacao_encontrada_detalhe: detalheLocalizacao || null,
        observacoes: observacoes || null,
        data_coleta: new Date().toISOString(),
      });
      
      // Reset form
      setDialogOpen(false);
      setBemSelecionado(null);
      setStatusColeta("conferido");
      setUnidadeEncontrada("");
      setSalaEncontrada("");
      setDetalheLocalizacao("");
      setObservacoes("");
      
      refetchColetas();
      inputRef.current?.focus();
    } catch (error) {
      // Erro tratado pelo hook
    }
  };

  if (isLoading) {
    return (
      <ModuleLayout module="patrimonio">
        <section className="py-6">
          <div className="container mx-auto px-4">
            <Skeleton className="h-32 w-full" />
          </div>
        </section>
      </ModuleLayout>
    );
  }

  if (!campanha) {
    return (
      <ModuleLayout module="patrimonio">
        <section className="py-12">
          <div className="container mx-auto px-4 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Campanha não encontrada</h2>
            <Button asChild className="mt-4">
              <Link to="/inventario/campanhas">Voltar para Campanhas</Link>
            </Button>
          </div>
        </section>
      </ModuleLayout>
    );
  }

  if (campanha.status !== "em_andamento") {
    return (
      <ModuleLayout module="patrimonio">
        <section className="py-12">
          <div className="container mx-auto px-4 text-center">
            <Clock className="w-12 h-12 mx-auto mb-4 text-warning" />
            <h2 className="text-xl font-semibold mb-2">Campanha não está em andamento</h2>
            <p className="text-muted-foreground mb-4">
              Esta campanha está com status "{campanha.status}". 
              Inicie a campanha para realizar coletas.
            </p>
            <Button asChild>
              <Link to={`/inventario/campanhas/${id}`}>Ver Detalhes</Link>
            </Button>
          </div>
        </section>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout module="patrimonio">
      {/* Header */}
      <section className="bg-secondary text-secondary-foreground py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm mb-3 opacity-80">
            <Link to="/inventario" className="hover:underline">Inventário</Link>
            <span>/</span>
            <Link to="/inventario/campanhas" className="hover:underline">Campanhas</Link>
            <span>/</span>
            <Link to={`/inventario/campanhas/${id}`} className="hover:underline">
              {campanha.nome}
            </Link>
            <span>/</span>
            <span>Coleta</span>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <QrCode className="w-8 h-8" />
              <div>
                <h1 className="font-serif text-2xl font-bold">Coleta de Inventário</h1>
                <p className="opacity-90 text-sm">{campanha.nome}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/20">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                {campanha.total_conferidos || 0} conferidos
              </Badge>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/inventario/campanhas/${id}`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Banner App Mobile */}
      <section className="py-4 border-b bg-primary/5">
        <div className="container mx-auto px-4">
          <Alert>
            <Smartphone className="w-4 h-4" />
            <AlertTitle>Coleta em campo?</AlertTitle>
            <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
              <span>Use o app mobile para escanear QR Codes e trabalhar offline.</span>
              <Button asChild size="sm" variant="outline">
                <Link to={`/patrimonio-mobile?campanha=${id}`}>
                  <Smartphone className="w-4 h-4 mr-2" />
                  Abrir App Mobile
                </Link>
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </section>

      {/* Área de Busca */}
      <section className="py-6">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2">
                <Search className="w-5 h-5" />
                Buscar Bem
              </CardTitle>
              <CardDescription>
                Digite o número do patrimônio ou escaneie o QR Code
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => { e.preventDefault(); handleBuscar(); }} className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Número do patrimônio ou código QR..."
                    className="text-lg h-12"
                    autoComplete="off"
                  />
                  <Button type="submit" size="lg" className="px-6">
                    <Search className="w-5 h-5" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Pressione Enter para buscar
                </p>
              </form>
            </CardContent>
          </Card>

          {/* Últimas Coletas */}
          <Card className="max-w-2xl mx-auto mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Últimas Coletas</CardTitle>
            </CardHeader>
            <CardContent>
              {coletas?.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhuma coleta registrada ainda
                </p>
              ) : (
                <div className="space-y-2">
                  {coletas?.slice(0, 5).map((coleta) => (
                    <div 
                      key={coleta.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <span className="font-mono text-sm">
                            {(coleta as any).bem?.numero_patrimonio}
                          </span>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {(coleta as any).bem?.descricao}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant="outline" 
                          className={
                            coleta.status_coleta === "conferido" ? "bg-success/10 text-success" :
                            coleta.status_coleta === "divergente" ? "bg-warning/10 text-warning" :
                            "bg-destructive/10 text-destructive"
                          }
                        >
                          {STATUS_COLETA_OPTIONS.find(s => s.value === coleta.status_coleta)?.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(coleta.data_coleta), "HH:mm")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Dialog de Coleta */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Registrar Coleta
            </DialogTitle>
            <DialogDescription>
              Confirme as informações do bem encontrado
            </DialogDescription>
          </DialogHeader>

          {bemSelecionado && (
            <div className="space-y-4">
              {/* Info do Bem */}
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Patrimônio:</span>
                  <span className="font-mono font-bold">{bemSelecionado.numero_patrimonio}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Descrição:</span>
                  <span className="text-right max-w-[200px] truncate">{bemSelecionado.descricao}</span>
                </div>
                {bemSelecionado.unidade_local && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Loc. Esperada:</span>
                    <span>{(bemSelecionado as any).unidade_local?.nome_unidade}</span>
                  </div>
                )}
              </div>

              {/* Status da Coleta */}
              <div className="space-y-2">
                <Label>Status da Coleta *</Label>
                <Select value={statusColeta} onValueChange={setStatusColeta}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_COLETA_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div>
                          <span className="font-medium">{opt.label}</span>
                          <p className="text-xs text-muted-foreground">{opt.description}</p>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Localização Encontrada */}
              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <Label>Sala/Local</Label>
                  <Input 
                    value={salaEncontrada}
                    onChange={(e) => setSalaEncontrada(e.target.value)}
                    placeholder="Ex: Sala 101"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Detalhe da Localização</Label>
                <Input 
                  value={detalheLocalizacao}
                  onChange={(e) => setDetalheLocalizacao(e.target.value)}
                  placeholder="Ex: Mesa próxima à janela"
                />
              </div>

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
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={handleRegistrarColeta} disabled={createColeta.isPending}>
              <Save className="w-4 h-4 mr-2" />
              {createColeta.isPending ? "Salvando..." : "Registrar Coleta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
