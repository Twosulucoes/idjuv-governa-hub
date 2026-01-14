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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreatePortaria } from "@/hooks/usePortarias";
import { toast } from "sonner";
import { AlertCircle, FileText } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GerarPortariaManualDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servidor: {
    id: string;
    nome_completo: string;
    cpf: string;
    cargo_atual_id?: string;
    unidade_atual_id?: string;
    data_admissao?: string;
  };
  onSuccess?: () => void;
}

export function GerarPortariaManualDialog({
  open,
  onOpenChange,
  servidor,
  onSuccess,
}: GerarPortariaManualDialogProps) {
  const queryClient = useQueryClient();
  const createPortaria = useCreatePortaria();

  const [formData, setFormData] = useState({
    tipo_portaria: "nomeacao" as "nomeacao" | "exoneracao",
    cargo_id: "",
    unidade_id: "",
    data_documento: "",
    ementa: "",
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

  // Preencher dados do servidor ao abrir
  useEffect(() => {
    if (open && servidor) {
      const cargoNome = cargos.find((c) => c.id === servidor.cargo_atual_id)?.nome || "";
      
      setFormData({
        tipo_portaria: "nomeacao",
        cargo_id: servidor.cargo_atual_id || "",
        unidade_id: servidor.unidade_atual_id || "",
        data_documento: servidor.data_admissao || new Date().toISOString().split("T")[0],
        ementa: `Nomeia ${servidor.nome_completo} para cargo em comissão de ${cargoNome}.`,
      });
    }
  }, [open, servidor, cargos]);

  // Atualizar ementa quando cargo mudar
  useEffect(() => {
    if (formData.cargo_id && servidor) {
      const cargoNome = cargos.find((c) => c.id === formData.cargo_id)?.nome || "";
      const acao = formData.tipo_portaria === "nomeacao" ? "Nomeia" : "Exonera";
      setFormData((prev) => ({
        ...prev,
        ementa: `${acao} ${servidor.nome_completo} ${formData.tipo_portaria === "nomeacao" ? "para cargo em comissão de" : "do cargo de"} ${cargoNome}.`,
      }));
    }
  }, [formData.cargo_id, formData.tipo_portaria, servidor, cargos]);

  const handleSubmit = async () => {
    if (!formData.cargo_id || !formData.unidade_id) {
      toast.error("Selecione o cargo e a unidade");
      return;
    }

    try {
      // Criar portaria
      const portariaResult = await createPortaria.mutateAsync({
        titulo: `${formData.tipo_portaria === "nomeacao" ? "Nomeação" : "Exoneração"} - ${servidor.nome_completo}`,
        tipo: "portaria",
        categoria: formData.tipo_portaria,
        status: "minuta",
        data_documento: formData.data_documento,
        ementa: formData.ementa,
        servidores_ids: [servidor.id],
        cargo_id: formData.cargo_id,
        unidade_id: formData.unidade_id,
      });

      // Se for nomeação, criar provimento e histórico funcional também
      if (formData.tipo_portaria === "nomeacao" && portariaResult) {
        // Verificar se já existe provimento ativo
        const { data: provimentoExistente } = await supabase
          .from("provimentos")
          .select("id")
          .eq("servidor_id", servidor.id)
          .eq("status", "ativo")
          .maybeSingle();

        if (!provimentoExistente) {
          // Criar provimento
          await supabase.from("provimentos").insert([{
            servidor_id: servidor.id,
            cargo_id: formData.cargo_id,
            unidade_id: formData.unidade_id,
            data_nomeacao: formData.data_documento,
            status: "ativo",
            ato_nomeacao_numero: portariaResult.numero,
            ato_nomeacao_data: formData.data_documento,
            ato_nomeacao_tipo: "portaria",
          }]);
        }

        // Registrar no histórico funcional
        await supabase.from("historico_funcional").insert([{
          servidor_id: servidor.id,
          tipo: "nomeacao",
          data_evento: formData.data_documento,
          data_vigencia_inicio: formData.data_documento,
          cargo_novo_id: formData.cargo_id,
          unidade_nova_id: formData.unidade_id,
          portaria_numero: portariaResult.numero,
          portaria_data: formData.data_documento,
          observacoes: `Portaria de nomeação gerada manualmente. ID: ${portariaResult.id}`,
        }]);
      }

      toast.success(`Portaria de ${formData.tipo_portaria} gerada com sucesso!`);
      queryClient.invalidateQueries({ queryKey: ["portarias"] });
      queryClient.invalidateQueries({ queryKey: ["portarias-servidor"] });
      queryClient.invalidateQueries({ queryKey: ["provimentos"] });
      queryClient.invalidateQueries({ queryKey: ["historico-funcional"] });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao gerar portaria:", error);
      toast.error("Erro ao gerar portaria");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerar Portaria
          </DialogTitle>
          <DialogDescription>
            Servidor: {servidor?.nome_completo}
          </DialogDescription>
        </DialogHeader>

        <Alert variant="default" className="bg-primary/5 border-primary/20">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="text-sm">
            Esta ação irá criar uma portaria vinculada ao servidor, registrar no
            histórico funcional e criar o provimento (se nomeação).
          </AlertDescription>
        </Alert>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Tipo de Portaria</Label>
            <Select
              value={formData.tipo_portaria}
              onValueChange={(value: "nomeacao" | "exoneracao") =>
                setFormData((prev) => ({ ...prev, tipo_portaria: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nomeacao">Nomeação</SelectItem>
                <SelectItem value="exoneracao">Exoneração</SelectItem>
              </SelectContent>
            </Select>
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
            <Label>Cargo</Label>
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
            <Label>Unidade</Label>
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
                    {unidade.sigla
                      ? `${unidade.sigla} - ${unidade.nome}`
                      : unidade.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createPortaria.isPending || !formData.cargo_id || !formData.unidade_id}
          >
            {createPortaria.isPending ? "Gerando..." : "Gerar Portaria"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
