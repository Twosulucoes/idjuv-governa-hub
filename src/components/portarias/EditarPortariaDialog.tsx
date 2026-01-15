import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdatePortaria } from "@/hooks/usePortarias";
import { toast } from "sonner";
import { ClipboardList, Users, User, X, Plus } from "lucide-react";
import { SelecionarServidoresTable } from "./SelecionarServidoresTable";

interface EditarPortariaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portaria: any | null;
  onSuccess?: () => void;
}

export function EditarPortariaDialog({
  open,
  onOpenChange,
  portaria,
  onSuccess,
}: EditarPortariaDialogProps) {
  const updatePortaria = useUpdatePortaria();
  const [activeTab, setActiveTab] = useState("dados");
  const [showSelecionarServidores, setShowSelecionarServidores] = useState(false);

  const [formData, setFormData] = useState({
    titulo: "",
    ementa: "",
    data_documento: "",
    cargo_id: "",
    unidade_id: "",
    servidores_ids: [] as string[],
  });

  // Buscar cargos
  const { data: cargos = [] } = useQuery({
    queryKey: ["cargos-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cargos")
        .select("id, nome, sigla")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Buscar unidades
  const { data: unidades = [] } = useQuery({
    queryKey: ["unidades-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estrutura_organizacional")
        .select("id, nome, sigla")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Buscar dados dos servidores vinculados
  const { data: servidoresVinculados = [] } = useQuery({
    queryKey: ["servidores-portaria", portaria?.id, formData.servidores_ids],
    queryFn: async () => {
      if (!formData.servidores_ids || formData.servidores_ids.length === 0) return [];
      
      const { data, error } = await supabase
        .from("v_servidores_situacao")
        .select("id, nome_completo, cpf, foto_url, cargo_nome, cargo_sigla")
        .in("id", formData.servidores_ids);
      
      if (error) throw error;
      return data;
    },
    enabled: open && formData.servidores_ids.length > 0,
  });

  // Carregar dados da portaria ao abrir
  useEffect(() => {
    if (portaria && open) {
      setFormData({
        titulo: portaria.titulo || "",
        ementa: portaria.ementa || "",
        data_documento: portaria.data_documento || "",
        cargo_id: portaria.cargo_id || "",
        unidade_id: portaria.unidade_id || "",
        servidores_ids: portaria.servidores_ids || [],
      });
      setActiveTab("dados");
      setShowSelecionarServidores(false);
    }
  }, [portaria, open]);

  const handleSubmit = async () => {
    try {
      await updatePortaria.mutateAsync({
        id: portaria.id,
        dados: {
          titulo: formData.titulo,
          ementa: formData.ementa,
          data_documento: formData.data_documento,
          cargo_id: formData.cargo_id || null,
          unidade_id: formData.unidade_id || null,
          servidores_ids: formData.servidores_ids.length > 0 ? formData.servidores_ids : null,
        },
      });

      toast.success("Portaria atualizada com sucesso!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Erro ao atualizar portaria");
    }
  };

  const handleRemoverServidor = (servidorId: string) => {
    setFormData(prev => ({
      ...prev,
      servidores_ids: prev.servidores_ids.filter(id => id !== servidorId),
    }));
  };

  const handleAdicionarServidores = (ids: string[]) => {
    setFormData(prev => ({
      ...prev,
      servidores_ids: [...new Set([...prev.servidores_ids, ...ids])],
    }));
    setShowSelecionarServidores(false);
  };

  const formatCPF = (cpf: string) => {
    if (!cpf) return '';
    const numeros = cpf.replace(/\D/g, '');
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  // Se não tiver portaria, não renderiza nada
  if (!portaria) {
    return null;
  }

  const canEdit = portaria.status === "minuta" || portaria.status === "aguardando_assinatura";

  if (!canEdit) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edição não permitida</DialogTitle>
            <DialogDescription>
              Esta portaria já foi assinada ou publicada e não pode mais ser editada diretamente.
              Para corrigir informações, utilize a opção de Retificação.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Editar Portaria</DialogTitle>
          <DialogDescription>
            Portaria nº {portaria?.numero} - Edição permitida enquanto em minuta
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dados" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Dados da Portaria
            </TabsTrigger>
            <TabsTrigger value="servidores" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Servidores ({formData.servidores_ids.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="flex-1 overflow-y-auto space-y-4 mt-4 pr-2">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, titulo: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ementa">Ementa</Label>
              <Textarea
                id="ementa"
                value={formData.ementa}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, ementa: e.target.value }))
                }
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_documento">Data do Documento</Label>
              <Input
                id="data_documento"
                type="date"
                value={formData.data_documento}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, data_documento: e.target.value }))
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cargo">Cargo</Label>
                <Select
                  value={formData.cargo_id}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, cargo_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent>
                    {cargos.map((cargo) => (
                      <SelectItem key={cargo.id} value={cargo.id}>
                        {cargo.sigla ? `${cargo.sigla} - ${cargo.nome}` : cargo.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unidade">Unidade</Label>
                <Select
                  value={formData.unidade_id}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, unidade_id: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {unidades.map((unidade) => (
                      <SelectItem key={unidade.id} value={unidade.id}>
                        {unidade.sigla ? `${unidade.sigla} - ${unidade.nome}` : unidade.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="servidores" className="flex-1 overflow-hidden flex flex-col mt-4">
            {!showSelecionarServidores ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium">Servidores Vinculados</h4>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowSelecionarServidores(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Servidores
                  </Button>
                </div>

                <ScrollArea className="flex-1 border rounded-lg">
                  {servidoresVinculados.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Nenhum servidor vinculado a esta portaria</p>
                      <Button 
                        variant="link" 
                        className="mt-2"
                        onClick={() => setShowSelecionarServidores(true)}
                      >
                        Clique para adicionar servidores
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {servidoresVinculados.map((servidor) => (
                        <div
                          key={servidor.id}
                          className="flex items-center gap-3 p-3 hover:bg-muted/30"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={servidor.foto_url || undefined} />
                            <AvatarFallback>
                              <User className="h-5 w-5" />
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{servidor.nome_completo}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCPF(servidor.cpf)} • {servidor.cargo_nome}
                            </p>
                          </div>
                          <Badge variant="outline" className="font-mono text-xs">
                            {servidor.cargo_sigla || '-'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoverServidor(servidor.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium">Selecionar Servidores para Adicionar</h4>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowSelecionarServidores(false)}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </div>
                
                <SelecionarServidoresTableWrapper
                  excludeIds={formData.servidores_ids}
                  onConfirm={handleAdicionarServidores}
                  onCancel={() => setShowSelecionarServidores(false)}
                />
              </>
            )}
          </TabsContent>
        </Tabs>

        <DialogFooter className="pt-4 border-t mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={updatePortaria.isPending || !formData.titulo}
          >
            {updatePortaria.isPending ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Componente auxiliar para seleção com confirmação
function SelecionarServidoresTableWrapper({
  excludeIds,
  onConfirm,
  onCancel,
}: {
  excludeIds: string[];
  onConfirm: (ids: string[]) => void;
  onCancel: () => void;
}) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden">
        <SelecionarServidoresTable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          maxHeight="300px"
        />
      </div>
      <div className="flex justify-end gap-2 pt-3 mt-3 border-t">
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button 
          size="sm" 
          onClick={() => onConfirm(selectedIds)}
          disabled={selectedIds.length === 0}
        >
          Adicionar {selectedIds.length} servidor(es)
        </Button>
      </div>
    </div>
  );
}
