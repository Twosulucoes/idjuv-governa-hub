import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface NovaCompeticaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  federacaoId: string;
  federacaoSigla: string;
  onSuccess: () => void;
}

const TIPOS_COMPETICAO = [
  "Campeonato Estadual",
  "Campeonato Regional",
  "Torneio",
  "Copa",
  "Festival",
  "Jogos Abertos",
  "Seletiva",
  "Amistoso",
  "Outro",
];

const STATUS_COMPETICAO = [
  { value: "planejado", label: "Planejado" },
  { value: "confirmado", label: "Confirmado" },
  { value: "em_andamento", label: "Em Andamento" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
];

export function NovaCompeticaoDialog({
  open,
  onOpenChange,
  federacaoId,
  federacaoSigla,
  onSuccess,
}: NovaCompeticaoDialogProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "",
    tipo: "Campeonato Estadual",
    data_inicio: "",
    data_fim: "",
    local: "",
    cidade: "",
    categorias: "",
    publico_estimado: "",
    descricao: "",
    observacoes: "",
    status: "planejado",
  });

  const resetForm = () => {
    setFormData({
      titulo: "",
      tipo: "Campeonato Estadual",
      data_inicio: "",
      data_fim: "",
      local: "",
      cidade: "",
      categorias: "",
      publico_estimado: "",
      descricao: "",
      observacoes: "",
      status: "planejado",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.titulo || !formData.data_inicio) {
      toast.error("Título e data de início são obrigatórios");
      return;
    }

    setSaving(true);
    
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase.from("calendario_federacao").insert({
        federacao_id: federacaoId,
        titulo: formData.titulo,
        tipo: formData.tipo,
        data_inicio: formData.data_inicio,
        data_fim: formData.data_fim || null,
        local: formData.local || null,
        cidade: formData.cidade || null,
        categorias: formData.categorias || null,
        publico_estimado: formData.publico_estimado ? parseInt(formData.publico_estimado) : null,
        descricao: formData.descricao || null,
        observacoes: formData.observacoes || null,
        status: formData.status,
        created_by: userData.user?.id,
      });

      if (error) throw error;

      toast.success("Competição cadastrada com sucesso!");
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Erro ao cadastrar competição:", error);
      toast.error(error.message || "Erro ao cadastrar competição");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Competição - {federacaoSigla}</DialogTitle>
          <DialogDescription>
            Cadastre uma competição ou campeonato no calendário da federação
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Título da Competição *</Label>
            <Input
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Ex: Campeonato Estadual de Futebol 2025"
              required
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Tipo de Competição *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(v) => setFormData({ ...formData, tipo: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_COMPETICAO.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_COMPETICAO.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Data de Início *</Label>
              <Input
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Data de Término</Label>
              <Input
                type="date"
                value={formData.data_fim}
                onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Local</Label>
              <Input
                value={formData.local}
                onChange={(e) => setFormData({ ...formData, local: e.target.value })}
                placeholder="Ex: Ginásio Poliesportivo"
              />
            </div>
            <div className="space-y-2">
              <Label>Cidade</Label>
              <Input
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                placeholder="Ex: Boa Vista"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Categorias Participantes</Label>
              <Input
                value={formData.categorias}
                onChange={(e) => setFormData({ ...formData, categorias: e.target.value })}
                placeholder="Ex: Sub-15, Sub-17, Adulto"
              />
            </div>
            <div className="space-y-2">
              <Label>Público Estimado</Label>
              <Input
                type="number"
                value={formData.publico_estimado}
                onChange={(e) => setFormData({ ...formData, publico_estimado: e.target.value })}
                placeholder="Número de pessoas"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição</Label>
            <Textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição detalhada da competição..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Observações</Label>
            <Textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Observações adicionais..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Cadastrar Competição"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
