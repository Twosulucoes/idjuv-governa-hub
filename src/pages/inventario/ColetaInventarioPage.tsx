/**
 * PÁGINA: COLETA DE INVENTÁRIO
 * Interface para conferência de bens via busca ou QR Code
 * 
 * NOTA: Para coleta em campo, use o app mobile em /coleta-mobile
 */

import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, QrCode, Search, AlertTriangle,
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
import { EmptyState, PageHeader, StatusBadge, type TomStatus } from "@/components/design-system";
import { toast } from "sonner";
import { 
  useCampanhaInventario, 
  useColetasInventario, 
  useCreateColeta,
  useUnidadesLocaisPatrimonio 
} from "@/hooks/usePatrimonio";
import { useBuscarBemPorCodigo, type BemEncontrado } from "@/hooks/patrimonio/useBuscarBemPorCodigo";

const STATUS_COLETA_OPTIONS: { value: string; label: string; description: string; tom: TomStatus }[] = [
  { value: "conferido", label: "Conferido", description: "Bem localizado sem divergências", tom: "sucesso" },
  { value: "divergente", label: "Divergente", description: "Localização ou estado diferente do esperado", tom: "pendente" },
  { value: "nao_localizado", label: "Não localizado", description: "Bem não encontrado no local", tom: "erro" },
  { value: "avariado", label: "Avariado", description: "Bem localizado, mas danificado", tom: "pendente" },
  { value: "em_manutencao", label: "Em manutenção", description: "Bem fora do local por estar em manutenção", tom: "andamento" },
  { value: "sem_etiqueta", label: "Sem etiqueta", description: "Bem encontrado sem plaqueta", tom: "neutro" },
];

export default function ColetaInventarioPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [busca, setBusca] = useState("");
  const [bemSelecionado, setBemSelecionado] = useState<BemEncontrado | null>(null);
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
  const { buscar: buscarBem, buscando } = useBuscarBemPorCodigo();
  const { data: unidades } = useUnidadesLocaisPatrimonio();
  const createColeta = useCreateColeta();

  // Auto-focus no input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleBuscar = async () => {
    const codigo = busca.trim();
    if (!codigo || buscando) return;

    // Busca no servidor (número, QR ou plaqueta antiga), sem carregar a lista inteira de bens.
    let bemEncontrado: BemEncontrado | null = null;
    try {
      bemEncontrado = await buscarBem(codigo);
    } catch (error) {
      toast.error("Erro ao buscar o bem", {
        description: error instanceof Error ? error.message : "Tente novamente.",
      });
      return;
    }
    
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
        <div role="status" aria-label="Carregando campanha">
          <Skeleton className="h-32 w-full" />
        </div>
      </ModuleLayout>
    );
  }

  if (!campanha) {
    return (
      <ModuleLayout module="patrimonio">
        <div className="space-y-6">
          <PageHeader
            migalhas={[{ rotulo: "Inventário", href: "/inventario" }, { rotulo: "Campanhas", href: "/inventario/campanhas" }, { rotulo: "Coleta" }]}
            titulo="Coleta de inventário"
          />
          <EmptyState
            icone={AlertTriangle}
            titulo="Campanha não encontrada"
            acao={
              <Button asChild>
                <Link to="/inventario/campanhas">Voltar para campanhas</Link>
              </Button>
            }
          />
        </div>
      </ModuleLayout>
    );
  }

  if (campanha.status !== "em_andamento") {
    return (
      <ModuleLayout module="patrimonio">
        <div className="space-y-6">
          <PageHeader
            migalhas={[{ rotulo: "Inventário", href: "/inventario" }, { rotulo: "Campanhas", href: "/inventario/campanhas" }, { rotulo: "Coleta" }]}
            titulo="Coleta de inventário"
          />
          <EmptyState
            icone={Clock}
            titulo="Campanha não está em andamento"
            descricao={`Esta campanha está com status "${campanha.status}". Inicie a campanha para realizar coletas.`}
            acao={
              <Button asChild>
                <Link to={`/inventario/campanhas/${id}`}>Ver detalhes</Link>
              </Button>
            }
          />
        </div>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout module="patrimonio">
      <div className="space-y-6">
        <PageHeader
          migalhas={[
            { rotulo: "Inventário", href: "/inventario" },
            { rotulo: "Campanhas", href: "/inventario/campanhas" },
            { rotulo: campanha.nome, href: `/inventario/campanhas/${id}` },
            { rotulo: "Coleta" },
          ]}
          titulo="Coleta de inventário"
          descricao={campanha.nome}
          status={
            <StatusBadge tom="sucesso">
              {campanha.total_conferidos || 0} conferidos
            </StatusBadge>
          }
          acoes={
            <Button variant="outline" asChild>
              <Link to={`/inventario/campanhas/${id}`}>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Voltar
              </Link>
            </Button>
          }
        />

        {/* Banner App Mobile */}
        <Alert>
          <Smartphone className="w-4 h-4" aria-hidden="true" />
          <AlertTitle>Coleta em campo?</AlertTitle>
          <AlertDescription className="flex items-center justify-between flex-wrap gap-2">
            <span>Use o app mobile para escanear QR Codes e trabalhar offline.</span>
            <Button asChild size="sm" variant="outline">
              <Link to={`/patrimonio-mobile?campanha=${id}`}>
                <Smartphone className="h-4 w-4" aria-hidden="true" />
                Abrir app mobile
              </Link>
            </Button>
          </AlertDescription>
        </Alert>

        {/* Área de Busca */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2 text-h3">
              <Search className="w-5 h-5" aria-hidden="true" />
              Buscar bem
            </CardTitle>
            <CardDescription id="busca-bem-ajuda">
              Digite o número do patrimônio ou escaneie o QR Code
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); void handleBuscar(); }} className="space-y-4">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Número do patrimônio ou código QR..."
                  aria-label="Número do patrimônio ou código QR"
                  aria-describedby="busca-bem-ajuda"
                  className="text-lg h-12"
                  autoComplete="off"
                />
                <Button type="submit" size="lg" className="px-6" aria-label="Buscar bem" disabled={buscando}>
                  <Search className="w-5 h-5" aria-hidden="true" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Pressione Enter para buscar
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Últimas Coletas */}
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-h3">Últimas coletas</CardTitle>
          </CardHeader>
          <CardContent>
            {!coletas?.length ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhuma coleta registrada ainda
              </p>
            ) : (
              <ul className="space-y-2">
                {coletas.slice(0, 5).map((coleta) => {
                  const st = STATUS_COLETA_OPTIONS.find(s => s.value === coleta.status_coleta);
                  return (
                    <li
                      key={coleta.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Package className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
                        <div>
                          <span className="font-mono text-sm">
                            {coleta.bem?.numero_patrimonio}
                          </span>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {coleta.bem?.descricao}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusBadge tom={st?.tom ?? "neutro"}>{st?.label ?? "Sem status"}</StatusBadge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(coleta.data_coleta), "HH:mm")}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Coleta */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" aria-hidden="true" />
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
                {bemSelecionado.unidade_local_id && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Loc. Esperada:</span>
                    <span>
                      {unidades?.find(u => u.id === bemSelecionado.unidade_local_id)?.nome_unidade ?? "Unidade não listada"}
                    </span>
                  </div>
                )}
              </div>

              {/* Status da Coleta */}
              <div className="space-y-2">
                <Label htmlFor="coleta-status">Status da Coleta *</Label>
                <Select value={statusColeta} onValueChange={setStatusColeta}>
                  <SelectTrigger id="coleta-status">
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
                  <Label htmlFor="coleta-unidade">Unidade Encontrada</Label>
                  <Select value={unidadeEncontrada} onValueChange={setUnidadeEncontrada}>
                    <SelectTrigger id="coleta-unidade">
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
                  <Label htmlFor="coleta-sala">Sala/Local</Label>
                  <Input 
                    id="coleta-sala"
                    value={salaEncontrada}
                    onChange={(e) => setSalaEncontrada(e.target.value)}
                    placeholder="Ex: Sala 101"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coleta-detalhe">Detalhe da Localização</Label>
                <Input 
                  id="coleta-detalhe"
                  value={detalheLocalizacao}
                  onChange={(e) => setDetalheLocalizacao(e.target.value)}
                  placeholder="Ex: Mesa próxima à janela"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="coleta-observacoes">Observações</Label>
                <Textarea 
                  id="coleta-observacoes"
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
              <X className="w-4 h-4 mr-2" aria-hidden="true" />
              Cancelar
            </Button>
            <Button onClick={handleRegistrarColeta} disabled={createColeta.isPending}>
              <Save className="w-4 h-4 mr-2" aria-hidden="true" />
              {createColeta.isPending ? "Salvando..." : "Registrar Coleta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
