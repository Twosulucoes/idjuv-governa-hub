/**
 * Tab de configuração de agrupamentos de unidades para impressão em lote
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  FolderPlus,
  Building2,
  Plus,
  Trash2,
  Edit2,
  GripVertical,
  X,
  Loader2,
  Info,
  Layers,
} from "lucide-react";
import { toast } from "sonner";

import {
  useAgrupamentosUnidades,
  useUnidadesDisponiveis,
  useCriarAgrupamento,
  useAtualizarAgrupamento,
  useExcluirAgrupamento,
  useVincularUnidade,
  useDesvincularUnidade,
  type AgrupamentoUnidade,
} from "@/hooks/useAgrupamentoUnidades";

export function AgrupamentosUnidadesTab() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<AgrupamentoUnidade | null>(null);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [cor, setCor] = useState("#3b82f6");

  const { data: agrupamentos, isLoading } = useAgrupamentosUnidades();
  const { data: unidadesDisponiveis } = useUnidadesDisponiveis();
  const criarAgrupamento = useCriarAgrupamento();
  const atualizarAgrupamento = useAtualizarAgrupamento();
  const excluirAgrupamento = useExcluirAgrupamento();
  const vincularUnidade = useVincularUnidade();
  const desvincularUnidade = useDesvincularUnidade();

  const handleNovoAgrupamento = () => {
    setEditando(null);
    setNome("");
    setDescricao("");
    setCor("#3b82f6");
    setDialogOpen(true);
  };

  const handleEditarAgrupamento = (agrupamento: AgrupamentoUnidade) => {
    setEditando(agrupamento);
    setNome(agrupamento.nome);
    setDescricao(agrupamento.descricao || "");
    setCor(agrupamento.cor || "#3b82f6");
    setDialogOpen(true);
  };

  const handleSalvar = async () => {
    if (!nome.trim()) {
      toast.error("Informe o nome do agrupamento");
      return;
    }

    if (editando) {
      await atualizarAgrupamento.mutateAsync({
        id: editando.id,
        nome,
        descricao,
        cor,
      });
    } else {
      await criarAgrupamento.mutateAsync({ nome, descricao, cor });
    }
    setDialogOpen(false);
  };

  const handleExcluir = async (id: string) => {
    await excluirAgrupamento.mutateAsync(id);
  };

  const handleVincular = async (agrupamentoId: string, unidadeId: string) => {
    await vincularUnidade.mutateAsync({
      agrupamento_id: agrupamentoId,
      unidade_id: unidadeId,
    });
  };

  const handleDesvincular = async (vinculoId: string) => {
    await desvincularUnidade.mutateAsync(vinculoId);
  };

  const CORES = [
    { value: "#3b82f6", label: "Azul" },
    { value: "#10b981", label: "Verde" },
    { value: "#f59e0b", label: "Amarelo" },
    { value: "#ef4444", label: "Vermelho" },
    { value: "#8b5cf6", label: "Roxo" },
    { value: "#6366f1", label: "Índigo" },
    { value: "#ec4899", label: "Rosa" },
    { value: "#64748b", label: "Cinza" },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Agrupamentos de Unidades</h3>
          <p className="text-sm text-muted-foreground">
            Configure grupos de unidades para impressão em lote de frequência
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNovoAgrupamento}>
              <FolderPlus className="mr-2 h-4 w-4" />
              Novo Agrupamento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editando ? "Editar Agrupamento" : "Novo Agrupamento"}
              </DialogTitle>
              <DialogDescription>
                Defina um grupo para organizar a impressão em lote
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome do Agrupamento *</Label>
                <Input
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Presidência e Assessorias"
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descrição do agrupamento..."
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Cor de Identificação</Label>
                <div className="flex gap-2 flex-wrap">
                  {CORES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCor(c.value)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        cor === c.value
                          ? "ring-2 ring-offset-2 ring-primary border-primary"
                          : "border-transparent hover:scale-110"
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSalvar}
                disabled={criarAgrupamento.isPending || atualizarAgrupamento.isPending}
              >
                {(criarAgrupamento.isPending || atualizarAgrupamento.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Salvar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Dica informativa */}
      <div className="flex items-start gap-2 rounded-lg border bg-muted/50 p-3">
        <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <p className="text-sm text-muted-foreground">
          Os agrupamentos permitem organizar as unidades administrativas para impressão em lote.
          Vincule as unidades desejadas a cada agrupamento para facilitar a geração de folhas de frequência.
        </p>
      </div>

      {/* Lista de Agrupamentos */}
      {(!agrupamentos || agrupamentos.length === 0) ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Layers className="h-12 w-12 mb-4 opacity-50" />
            <p>Nenhum agrupamento configurado</p>
            <Button variant="link" onClick={handleNovoAgrupamento}>
              Criar primeiro agrupamento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {agrupamentos.map((agrup) => (
            <AgrupamentoCard
              key={agrup.id}
              agrupamento={agrup}
              unidadesDisponiveis={unidadesDisponiveis || []}
              onEditar={() => handleEditarAgrupamento(agrup)}
              onExcluir={() => handleExcluir(agrup.id)}
              onVincular={(unidadeId) => handleVincular(agrup.id, unidadeId)}
              onDesvincular={handleDesvincular}
            />
          ))}
        </div>
      )}

      {/* Unidades não agrupadas */}
      {unidadesDisponiveis && unidadesDisponiveis.length > 0 && (
        <Card className="border-dashed">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unidades não agrupadas ({unidadesDisponiveis.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {unidadesDisponiveis.slice(0, 10).map((u) => (
                <Badge key={u.id} variant="outline" className="text-xs">
                  {u.sigla || u.nome}
                </Badge>
              ))}
              {unidadesDisponiveis.length > 10 && (
                <Badge variant="secondary" className="text-xs">
                  +{unidadesDisponiveis.length - 10} mais
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface AgrupamentoCardProps {
  agrupamento: AgrupamentoUnidade;
  unidadesDisponiveis: { id: string; nome: string; sigla?: string; tipo: string }[];
  onEditar: () => void;
  onExcluir: () => void;
  onVincular: (unidadeId: string) => void;
  onDesvincular: (vinculoId: string) => void;
}

function AgrupamentoCard({
  agrupamento,
  unidadesDisponiveis,
  onEditar,
  onExcluir,
  onVincular,
  onDesvincular,
}: AgrupamentoCardProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState("");

  const handleAdicionarUnidade = () => {
    if (unidadeSelecionada) {
      onVincular(unidadeSelecionada);
      setUnidadeSelecionada("");
      setAddDialogOpen(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-3 h-8 rounded-full"
              style={{ backgroundColor: agrupamento.cor || "#3b82f6" }}
            />
            <div>
              <CardTitle className="text-base">{agrupamento.nome}</CardTitle>
              {agrupamento.descricao && (
                <CardDescription>{agrupamento.descricao}</CardDescription>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-xs">
              {agrupamento.unidades.length} unidade{agrupamento.unidades.length !== 1 ? "s" : ""}
            </Badge>
            <Button variant="ghost" size="icon" onClick={onEditar}>
              <Edit2 className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir agrupamento?</AlertDialogTitle>
                  <AlertDialogDescription>
                    O agrupamento "{agrupamento.nome}" será excluído. As unidades vinculadas
                    não serão afetadas.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={onExcluir}>Excluir</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {agrupamento.unidades.length === 0 ? (
            <p className="text-sm text-muted-foreground italic py-2">
              Nenhuma unidade vinculada
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {agrupamento.unidades.map((u) => (
                <Badge
                  key={u.id}
                  variant="secondary"
                  className="pl-2 pr-1 py-1 flex items-center gap-1"
                >
                  <Building2 className="h-3 w-3" />
                  <span>{u.sigla || u.nome}</span>
                  <button
                    onClick={() => onDesvincular(u.id)}
                    className="ml-1 p-0.5 rounded hover:bg-destructive/20 hover:text-destructive transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <Separator className="my-2" />

          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Unidade
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Unidade ao Agrupamento</DialogTitle>
                <DialogDescription>
                  Selecione uma unidade para vincular a "{agrupamento.nome}"
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Select value={unidadeSelecionada} onValueChange={setUnidadeSelecionada}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma unidade..." />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="max-h-[300px]">
                      {unidadesDisponiveis.length === 0 ? (
                        <div className="py-4 text-center text-muted-foreground text-sm">
                          Todas as unidades já estão vinculadas
                        </div>
                      ) : (
                        unidadesDisponiveis.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span>{u.sigla ? `${u.sigla} - ${u.nome}` : u.nome}</span>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleAdicionarUnidade} disabled={!unidadeSelecionada}>
                  Adicionar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
