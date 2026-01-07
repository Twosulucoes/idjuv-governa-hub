import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Plus, Package, Loader2, Edit, Trash2 } from "lucide-react";
import {
  PatrimonioUnidade,
  EstadoConservacao,
  SituacaoPatrimonio,
  ESTADO_CONSERVACAO_LABELS,
  SITUACAO_PATRIMONIO_LABELS,
} from "@/types/unidadesLocais";

interface PatrimonioTabProps {
  unidadeId: string;
}

const CATEGORIAS_PATRIMONIO = [
  "Equipamento Esportivo",
  "Mobiliário",
  "Equipamento de Áudio/Vídeo",
  "Equipamento de Informática",
  "Veículo",
  "Máquinas e Equipamentos",
  "Outros",
];

export function PatrimonioTab({ unidadeId }: PatrimonioTabProps) {
  const [itens, setItens] = useState<PatrimonioUnidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<PatrimonioUnidade | null>(null);
  
  const [formData, setFormData] = useState({
    item: "",
    numero_tombo: "",
    categoria: "",
    quantidade: "1",
    estado_conservacao: "bom" as EstadoConservacao,
    situacao: "em_uso" as SituacaoPatrimonio,
    descricao: "",
    valor_estimado: "",
    data_aquisicao: "",
    observacoes: "",
  });

  useEffect(() => {
    loadPatrimonio();
  }, [unidadeId]);

  async function loadPatrimonio() {
    try {
      const { data, error } = await supabase
        .from("patrimonio_unidade")
        .select("*")
        .eq("unidade_local_id", unidadeId)
        .order("item");

      if (error) throw error;
      setItens(data as PatrimonioUnidade[]);
    } catch (error) {
      console.error("Erro ao carregar patrimônio:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: userData } = await supabase.auth.getUser();

      const payload = {
        unidade_local_id: unidadeId,
        item: formData.item,
        numero_tombo: formData.numero_tombo || null,
        categoria: formData.categoria || null,
        quantidade: parseInt(formData.quantidade) || 1,
        estado_conservacao: formData.estado_conservacao,
        situacao: formData.situacao,
        descricao: formData.descricao || null,
        valor_estimado: formData.valor_estimado ? parseFloat(formData.valor_estimado) : null,
        data_aquisicao: formData.data_aquisicao || null,
        observacoes: formData.observacoes || null,
        updated_by: userData.user?.id,
      };

      if (editingItem) {
        const { error } = await supabase
          .from("patrimonio_unidade")
          .update(payload)
          .eq("id", editingItem.id);
        if (error) throw error;
        toast.success("Item atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("patrimonio_unidade")
          .insert({ ...payload, created_by: userData.user?.id });
        if (error) throw error;
        toast.success("Item cadastrado com sucesso!");
      }

      setShowForm(false);
      resetForm();
      loadPatrimonio();
    } catch (error: any) {
      console.error("Erro ao salvar item:", error);
      toast.error(error.message || "Erro ao salvar item");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: PatrimonioUnidade) {
    if (!confirm(`Deseja realmente excluir "${item.item}"?`)) return;

    try {
      const { error } = await supabase
        .from("patrimonio_unidade")
        .delete()
        .eq("id", item.id);

      if (error) throw error;
      toast.success("Item excluído com sucesso!");
      loadPatrimonio();
    } catch (error: any) {
      console.error("Erro ao excluir item:", error);
      toast.error(error.message || "Erro ao excluir item");
    }
  }

  function handleEdit(item: PatrimonioUnidade) {
    setEditingItem(item);
    setFormData({
      item: item.item,
      numero_tombo: item.numero_tombo || "",
      categoria: item.categoria || "",
      quantidade: item.quantidade.toString(),
      estado_conservacao: item.estado_conservacao,
      situacao: item.situacao,
      descricao: item.descricao || "",
      valor_estimado: item.valor_estimado?.toString() || "",
      data_aquisicao: item.data_aquisicao || "",
      observacoes: item.observacoes || "",
    });
    setShowForm(true);
  }

  function resetForm() {
    setEditingItem(null);
    setFormData({
      item: "",
      numero_tombo: "",
      categoria: "",
      quantidade: "1",
      estado_conservacao: "bom",
      situacao: "em_uso",
      descricao: "",
      valor_estimado: "",
      data_aquisicao: "",
      observacoes: "",
    });
  }

  const getEstadoColor = (estado: EstadoConservacao) => {
    const colors: Record<EstadoConservacao, string> = {
      otimo: "bg-success text-success-foreground",
      bom: "bg-info text-info-foreground",
      regular: "bg-warning text-warning-foreground",
      ruim: "bg-destructive/80 text-destructive-foreground",
      inservivel: "bg-destructive text-destructive-foreground",
    };
    return colors[estado];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Package className="h-5 w-5" />
          Patrimônio da Unidade
        </h3>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Item
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : itens.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum item de patrimônio cadastrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Tombo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {itens.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.item}</TableCell>
                    <TableCell>{item.numero_tombo || "-"}</TableCell>
                    <TableCell>{item.categoria || "-"}</TableCell>
                    <TableCell>{item.quantidade}</TableCell>
                    <TableCell>
                      <Badge className={getEstadoColor(item.estado_conservacao)}>
                        {ESTADO_CONSERVACAO_LABELS[item.estado_conservacao]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {SITUACAO_PATRIMONIO_LABELS[item.situacao]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Formulário */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Editar Item" : "Novo Item de Patrimônio"}
            </DialogTitle>
            <DialogDescription>
              Cadastre os bens patrimoniais da unidade
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Item/Descrição *</Label>
                <Input
                  value={formData.item}
                  onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                  placeholder="Ex: Mesa de Escritório"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Número de Tombo</Label>
                <Input
                  value={formData.numero_tombo}
                  onChange={(e) => setFormData({ ...formData, numero_tombo: e.target.value })}
                  placeholder="Ex: 12345"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={formData.categoria}
                  onValueChange={(v) => setFormData({ ...formData, categoria: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS_PATRIMONIO.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quantidade</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.quantidade}
                  onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Valor Estimado (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.valor_estimado}
                  onChange={(e) => setFormData({ ...formData, valor_estimado: e.target.value })}
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Estado de Conservação</Label>
                <Select
                  value={formData.estado_conservacao}
                  onValueChange={(v) =>
                    setFormData({ ...formData, estado_conservacao: v as EstadoConservacao })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ESTADO_CONSERVACAO_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Situação</Label>
                <Select
                  value={formData.situacao}
                  onValueChange={(v) =>
                    setFormData({ ...formData, situacao: v as SituacaoPatrimonio })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(SITUACAO_PATRIMONIO_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Data de Aquisição</Label>
                <Input
                  type="date"
                  value={formData.data_aquisicao}
                  onChange={(e) => setFormData({ ...formData, data_aquisicao: e.target.value })}
                />
              </div>
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

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingItem ? "Salvar Alterações" : "Cadastrar Item"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
