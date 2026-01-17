import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Edit, Trash2, FileText, Loader2 } from "lucide-react";
import { PreviewMensagem } from "./PreviewMensagem";

interface ModeloMensagem {
  id: string;
  tipo: string;
  nome: string;
  assunto: string;
  conteudo_html: string;
  ativo: boolean;
  padrao: boolean;
}

const tiposModelo = [
  { value: "convite", label: "Convite" },
  { value: "lembrete", label: "Lembrete" },
  { value: "cancelamento", label: "Cancelamento" },
  { value: "alteracao", label: "Alteração" },
];

export function ModelosMensagemTab() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingModelo, setEditingModelo] = useState<ModeloMensagem | null>(null);
  const [modeloToDelete, setModeloToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    tipo: "convite",
    nome: "",
    assunto: "",
    conteudo_html: "",
    ativo: true,
    padrao: false,
  });

  const queryClient = useQueryClient();

  const { data: modelos, isLoading } = useQuery({
    queryKey: ["modelos-mensagem"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("modelos_mensagem_reuniao")
        .select("*")
        .order("tipo")
        .order("nome");
      if (error) throw error;
      return data as ModeloMensagem[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingModelo) {
        const { error } = await supabase
          .from("modelos_mensagem_reuniao")
          .update(data)
          .eq("id", editingModelo.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("modelos_mensagem_reuniao")
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modelos-mensagem"] });
      toast.success(editingModelo ? "Modelo atualizado!" : "Modelo criado!");
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("modelos_mensagem_reuniao")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["modelos-mensagem"] });
      toast.success("Modelo excluído!");
      setDeleteDialogOpen(false);
      setModeloToDelete(null);
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    },
  });

  const handleOpenDialog = (modelo?: ModeloMensagem) => {
    if (modelo) {
      setEditingModelo(modelo);
      setFormData({
        tipo: modelo.tipo,
        nome: modelo.nome,
        assunto: modelo.assunto,
        conteudo_html: modelo.conteudo_html,
        ativo: modelo.ativo,
        padrao: modelo.padrao,
      });
    } else {
      setEditingModelo(null);
      setFormData({
        tipo: "convite",
        nome: "",
        assunto: "",
        conteudo_html: "",
        ativo: true,
        padrao: false,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingModelo(null);
    setFormData({
      tipo: "convite",
      nome: "",
      assunto: "",
      conteudo_html: "",
      ativo: true,
      padrao: false,
    });
  };

  const handleSave = () => {
    if (!formData.nome || !formData.assunto || !formData.conteudo_html) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    saveMutation.mutate(formData);
  };

  const getTipoLabel = (tipo: string) => {
    return tiposModelo.find(t => t.value === tipo)?.label || tipo;
  };

  const getTipoBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case "convite": return "default";
      case "lembrete": return "secondary";
      case "cancelamento": return "destructive";
      case "alteracao": return "outline";
      default: return "default";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Modelos de Mensagem</h3>
          <p className="text-sm text-muted-foreground">
            Configure os modelos de mensagem para convites e comunicações
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Modelo
        </Button>
      </div>

      {modelos?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhum modelo cadastrado</p>
            <Button variant="outline" className="mt-3" onClick={() => handleOpenDialog()}>
              Criar primeiro modelo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {modelos?.map((modelo) => (
            <Card key={modelo.id} className={!modelo.ativo ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{modelo.nome}</h4>
                      <Badge variant={getTipoBadgeVariant(modelo.tipo) as any}>
                        {getTipoLabel(modelo.tipo)}
                      </Badge>
                      {modelo.padrao && (
                        <Badge variant="outline" className="text-xs">
                          Padrão
                        </Badge>
                      )}
                      {!modelo.ativo && (
                        <Badge variant="secondary" className="text-xs">
                          Inativo
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {modelo.assunto}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(modelo)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setModeloToDelete(modelo.id);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialog de Edição/Criação */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingModelo ? "Editar Modelo" : "Novo Modelo de Mensagem"}
            </DialogTitle>
            <DialogDescription>
              Configure o modelo de mensagem para envio de convites
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => setFormData({ ...formData, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposModelo.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nome do Modelo *</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Convite Padrão"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assunto do Email *</Label>
              <Input
                value={formData.assunto}
                onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
                placeholder="Ex: Convite: {titulo}"
              />
            </div>

            <div className="space-y-2">
              <Label>Corpo da Mensagem *</Label>
              <Textarea
                value={formData.conteudo_html}
                onChange={(e) => setFormData({ ...formData, conteudo_html: e.target.value })}
                placeholder="Digite a mensagem..."
                rows={8}
              />
            </div>

            <PreviewMensagem
              assunto={formData.assunto}
              corpo={formData.conteudo_html}
              canal="email"
            />

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
                <Label htmlFor="ativo">Modelo ativo</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="padrao"
                  checked={formData.padrao}
                  onCheckedChange={(checked) => setFormData({ ...formData, padrao: checked })}
                />
                <Label htmlFor="padrao">Definir como padrão</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingModelo ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir modelo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O modelo será permanentemente excluído.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => modeloToDelete && deleteMutation.mutate(modeloToDelete)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
