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
import { Plus, Edit, Trash2, Signature, Loader2, Star } from "lucide-react";

interface ConfigAssinatura {
  id: string;
  nome_configuracao: string;
  nome_assinante_1: string | null;
  cargo_assinante_1: string | null;
  nome_assinante_2: string | null;
  cargo_assinante_2: string | null;
  texto_cabecalho: string | null;
  texto_rodape: string | null;
  ativo: boolean;
  padrao: boolean;
}

export function AssinaturaConfigTab() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ConfigAssinatura | null>(null);
  const [configToDelete, setConfigToDelete] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    nome_configuracao: "",
    nome_assinante_1: "",
    cargo_assinante_1: "",
    nome_assinante_2: "",
    cargo_assinante_2: "",
    texto_cabecalho: "",
    texto_rodape: "",
    ativo: true,
    padrao: false,
  });

  const queryClient = useQueryClient();

  const { data: configs, isLoading } = useQuery({
    queryKey: ["config-assinatura"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("config_assinatura_reuniao")
        .select("*")
        .order("nome_configuracao");
      if (error) throw error;
      return data as ConfigAssinatura[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (editingConfig) {
        const { error } = await supabase
          .from("config_assinatura_reuniao")
          .update(data)
          .eq("id", editingConfig.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("config_assinatura_reuniao")
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config-assinatura"] });
      toast.success(editingConfig ? "Configuração atualizada!" : "Configuração criada!");
      handleCloseDialog();
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("config_assinatura_reuniao")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["config-assinatura"] });
      toast.success("Configuração excluída!");
      setDeleteDialogOpen(false);
      setConfigToDelete(null);
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    },
  });

  const handleOpenDialog = (config?: ConfigAssinatura) => {
    if (config) {
      setEditingConfig(config);
      setFormData({
        nome_configuracao: config.nome_configuracao,
        nome_assinante_1: config.nome_assinante_1 || "",
        cargo_assinante_1: config.cargo_assinante_1 || "",
        nome_assinante_2: config.nome_assinante_2 || "",
        cargo_assinante_2: config.cargo_assinante_2 || "",
        texto_cabecalho: config.texto_cabecalho || "",
        texto_rodape: config.texto_rodape || "",
        ativo: config.ativo,
        padrao: config.padrao,
      });
    } else {
      setEditingConfig(null);
      setFormData({
        nome_configuracao: "",
        nome_assinante_1: "",
        cargo_assinante_1: "",
        nome_assinante_2: "",
        cargo_assinante_2: "",
        texto_cabecalho: "",
        texto_rodape: "",
        ativo: true,
        padrao: false,
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingConfig(null);
  };

  const handleSave = () => {
    if (!formData.nome_configuracao || !formData.nome_assinante_1 || !formData.cargo_assinante_1) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }
    saveMutation.mutate(formData);
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
          <h3 className="text-lg font-medium">Assinaturas Institucionais</h3>
          <p className="text-sm text-muted-foreground">
            Configure as assinaturas para rodapé dos convites
          </p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Assinatura
        </Button>
      </div>

      {configs?.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-muted-foreground">
            <Signature className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma assinatura configurada</p>
            <Button variant="outline" className="mt-3" onClick={() => handleOpenDialog()}>
              Criar primeira assinatura
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {configs?.map((config) => (
            <Card key={config.id} className={!config.ativo ? "opacity-60" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{config.nome_configuracao}</h4>
                      {config.padrao && (
                        <Badge variant="default" className="gap-1">
                          <Star className="h-3 w-3" />
                          Padrão
                        </Badge>
                      )}
                      {!config.ativo && (
                        <Badge variant="secondary">Inativa</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-0.5">
                      <p>{config.nome_assinante_1} - {config.cargo_assinante_1}</p>
                      {config.nome_assinante_2 && (
                        <p>{config.nome_assinante_2} - {config.cargo_assinante_2}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(config)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setConfigToDelete(config.id);
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
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingConfig ? "Editar Assinatura" : "Nova Assinatura Institucional"}
            </DialogTitle>
            <DialogDescription>
              Configure os dados da assinatura para rodapé dos convites
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nome da Configuração *</Label>
              <Input
                value={formData.nome_configuracao}
                onChange={(e) => setFormData({ ...formData, nome_configuracao: e.target.value })}
                placeholder="Ex: Assinatura Presidência"
              />
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-medium text-sm">Assinante Principal</h4>
              
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={formData.nome_assinante_1}
                  onChange={(e) => setFormData({ ...formData, nome_assinante_1: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label>Cargo *</Label>
                <Input
                  value={formData.cargo_assinante_1}
                  onChange={(e) => setFormData({ ...formData, cargo_assinante_1: e.target.value })}
                  placeholder="Ex: Presidente do IDJUV"
                />
              </div>
            </div>

            <div className="border rounded-lg p-4 space-y-4">
              <h4 className="font-medium text-sm">Segundo Assinante (opcional)</h4>
              
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={formData.nome_assinante_2}
                  onChange={(e) => setFormData({ ...formData, nome_assinante_2: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>

              <div className="space-y-2">
                <Label>Cargo</Label>
                <Input
                  value={formData.cargo_assinante_2}
                  onChange={(e) => setFormData({ ...formData, cargo_assinante_2: e.target.value })}
                  placeholder="Ex: Diretor Administrativo"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Texto do Rodapé (opcional)</Label>
              <Textarea
                value={formData.texto_rodape}
                onChange={(e) => setFormData({ ...formData, texto_rodape: e.target.value })}
                placeholder="Ex: Instituto de Desenvolvimento da Juventude de Roraima"
                rows={2}
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="ativo"
                  checked={formData.ativo}
                  onCheckedChange={(checked) => setFormData({ ...formData, ativo: checked })}
                />
                <Label htmlFor="ativo">Ativa</Label>
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

            {/* Preview */}
            <Card className="bg-muted/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Pré-visualização</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="border-t pt-3 mt-2">
                  <p className="font-medium">{formData.nome_assinante_1 || "Nome do Assinante"}</p>
                  <p className="text-muted-foreground">{formData.cargo_assinante_1 || "Cargo"}</p>
                  {formData.nome_assinante_2 && (
                    <>
                      <p className="font-medium mt-2">{formData.nome_assinante_2}</p>
                      <p className="text-muted-foreground">{formData.cargo_assinante_2}</p>
                    </>
                  )}
                  {formData.texto_rodape && (
                    <p className="text-xs text-muted-foreground mt-3 italic">
                      {formData.texto_rodape}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingConfig ? "Salvar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir configuração?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A configuração será permanentemente excluída.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => configToDelete && deleteMutation.mutate(configToDelete)}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
