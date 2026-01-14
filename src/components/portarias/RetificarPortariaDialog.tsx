import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreatePortaria } from "@/hooks/usePortarias";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RetificarPortariaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portariaOriginal: any;
  onSuccess?: () => void;
}

export function RetificarPortariaDialog({
  open,
  onOpenChange,
  portariaOriginal,
  onSuccess,
}: RetificarPortariaDialogProps) {
  const queryClient = useQueryClient();
  const createPortaria = useCreatePortaria();

  const [retificacoes, setRetificacoes] = useState({
    cargo: false,
    unidade: false,
    nome: false,
    data: false,
  });

  const [formData, setFormData] = useState({
    cargo_id: "",
    unidade_id: "",
    nome_correto: "",
    data_correta: "",
    justificativa: "",
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

  // Reset ao abrir
  useEffect(() => {
    if (open) {
      setRetificacoes({
        cargo: false,
        unidade: false,
        nome: false,
        data: false,
      });
      setFormData({
        cargo_id: "",
        unidade_id: "",
        nome_correto: "",
        data_correta: "",
        justificativa: "",
      });
    }
  }, [open]);

  const hasRetificacoes = Object.values(retificacoes).some(Boolean);

  const gerarEmentaRetificacao = () => {
    const alteracoes: string[] = [];
    
    if (retificacoes.cargo) {
      const cargoNovo = cargos.find((c) => c.id === formData.cargo_id);
      alteracoes.push(`cargo para ${cargoNovo?.nome || "novo cargo"}`);
    }
    if (retificacoes.unidade) {
      const unidadeNova = unidades.find((u) => u.id === formData.unidade_id);
      alteracoes.push(`unidade para ${unidadeNova?.nome || "nova unidade"}`);
    }
    if (retificacoes.nome) {
      alteracoes.push(`nome para ${formData.nome_correto}`);
    }
    if (retificacoes.data) {
      alteracoes.push(`data para ${formData.data_correta}`);
    }

    return `Retifica a Portaria nº ${portariaOriginal?.numero}, publicada no DOE nº ${portariaOriginal?.doe_numero || "___"} de ${portariaOriginal?.doe_data || "___"}, para alterar: ${alteracoes.join("; ")}.`;
  };

  const handleSubmit = async () => {
    if (!hasRetificacoes) {
      toast.error("Selecione pelo menos uma retificação");
      return;
    }

    try {
      const dataAtual = new Date().toISOString().split("T")[0];
      const ementa = gerarEmentaRetificacao();

      await createPortaria.mutateAsync({
        titulo: `Retificação - Portaria nº ${portariaOriginal?.numero}`,
        tipo: "portaria",
        categoria: "normativa", // Retificação usa categoria normativa
        status: "minuta",
        data_documento: dataAtual,
        ementa,
        observacoes: `[RETIFICAÇÃO] Portaria original ID: ${portariaOriginal?.id}. Justificativa: ${formData.justificativa}`,
        servidores_ids: portariaOriginal?.servidores_ids || [],
        cargo_id: retificacoes.cargo ? formData.cargo_id : portariaOriginal?.cargo_id,
        unidade_id: retificacoes.unidade ? formData.unidade_id : portariaOriginal?.unidade_id,
      });

      toast.success("Portaria de retificação criada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["portarias"] });
      queryClient.invalidateQueries({ queryKey: ["portarias-servidor"] });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Erro ao criar portaria de retificação");
    }
  };

  const canRetify =
    portariaOriginal?.status === "publicado" ||
    portariaOriginal?.status === "vigente";

  if (!canRetify) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retificação não disponível</DialogTitle>
            <DialogDescription>
              A retificação só é possível para portarias já publicadas no DOE.
              Para alterar uma portaria em minuta, utilize a opção de Edição.
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Retificar Portaria</DialogTitle>
          <DialogDescription>
            Portaria nº {portariaOriginal?.numero} - DOE nº{" "}
            {portariaOriginal?.doe_numero}
          </DialogDescription>
        </DialogHeader>

        <Alert variant="default" className="bg-warning/10 border-warning/50">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-sm">
            Será criada uma nova portaria de retificação que deverá seguir o
            mesmo fluxo de assinatura e publicação no DOE.
          </AlertDescription>
        </Alert>

        <div className="space-y-4 py-4">
          <p className="text-sm font-medium">O que será retificado?</p>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="ret-cargo"
                checked={retificacoes.cargo}
                onCheckedChange={(checked) =>
                  setRetificacoes((prev) => ({ ...prev, cargo: !!checked }))
                }
              />
              <Label htmlFor="ret-cargo" className="font-normal">
                Cargo
              </Label>
            </div>
            {retificacoes.cargo && (
              <Select
                value={formData.cargo_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, cargo_id: value }))
                }
              >
                <SelectTrigger className="ml-6">
                  <SelectValue placeholder="Novo cargo" />
                </SelectTrigger>
                <SelectContent>
                  {cargos.map((cargo) => (
                    <SelectItem key={cargo.id} value={cargo.id}>
                      {cargo.sigla ? `${cargo.sigla} - ${cargo.nome}` : cargo.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="flex items-center space-x-3">
              <Checkbox
                id="ret-unidade"
                checked={retificacoes.unidade}
                onCheckedChange={(checked) =>
                  setRetificacoes((prev) => ({ ...prev, unidade: !!checked }))
                }
              />
              <Label htmlFor="ret-unidade" className="font-normal">
                Unidade
              </Label>
            </div>
            {retificacoes.unidade && (
              <Select
                value={formData.unidade_id}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, unidade_id: value }))
                }
              >
                <SelectTrigger className="ml-6">
                  <SelectValue placeholder="Nova unidade" />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((unidade) => (
                    <SelectItem key={unidade.id} value={unidade.id}>
                      {unidade.sigla
                        ? `${unidade.sigla} - ${unidade.nome}`
                        : unidade.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <div className="flex items-center space-x-3">
              <Checkbox
                id="ret-nome"
                checked={retificacoes.nome}
                onCheckedChange={(checked) =>
                  setRetificacoes((prev) => ({ ...prev, nome: !!checked }))
                }
              />
              <Label htmlFor="ret-nome" className="font-normal">
                Nome do servidor
              </Label>
            </div>
            {retificacoes.nome && (
              <Input
                className="ml-6"
                placeholder="Nome correto do servidor"
                value={formData.nome_correto}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, nome_correto: e.target.value }))
                }
              />
            )}

            <div className="flex items-center space-x-3">
              <Checkbox
                id="ret-data"
                checked={retificacoes.data}
                onCheckedChange={(checked) =>
                  setRetificacoes((prev) => ({ ...prev, data: !!checked }))
                }
              />
              <Label htmlFor="ret-data" className="font-normal">
                Data de vigência
              </Label>
            </div>
            {retificacoes.data && (
              <Input
                className="ml-6"
                type="date"
                value={formData.data_correta}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, data_correta: e.target.value }))
                }
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="justificativa">Justificativa da retificação</Label>
            <Textarea
              id="justificativa"
              placeholder="Descreva o motivo da retificação..."
              value={formData.justificativa}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, justificativa: e.target.value }))
              }
              rows={2}
            />
          </div>

          {hasRetificacoes && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-xs font-medium mb-1">Prévia da ementa:</p>
              <p className="text-xs text-muted-foreground italic">
                {gerarEmentaRetificacao()}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createPortaria.isPending || !hasRetificacoes}
          >
            {createPortaria.isPending ? "Criando..." : "Criar Retificação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
