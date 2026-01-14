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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdatePortaria } from "@/hooks/usePortarias";
import { toast } from "sonner";

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

  const [formData, setFormData] = useState({
    titulo: "",
    ementa: "",
    data_documento: "",
    cargo_id: "",
    unidade_id: "",
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

  // Carregar dados da portaria ao abrir
  useEffect(() => {
    if (portaria && open) {
      setFormData({
        titulo: portaria.titulo || "",
        ementa: portaria.ementa || "",
        data_documento: portaria.data_documento || "",
        cargo_id: portaria.cargo_id || "",
        unidade_id: portaria.unidade_id || "",
      });
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
        },
      });

      toast.success("Portaria atualizada com sucesso!");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Erro ao atualizar portaria");
    }
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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Portaria</DialogTitle>
          <DialogDescription>
            Portaria nº {portaria?.numero} - Edição permitida enquanto em minuta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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

        <DialogFooter>
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
