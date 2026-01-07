import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Search, UserCog, Loader2, FileText } from "lucide-react";
import {
  NomeacaoChefeUnidade,
  TipoAtoNomeacao,
  TIPO_ATO_LABELS,
  STATUS_NOMEACAO_LABELS,
  STATUS_NOMEACAO_COLORS,
} from "@/types/unidadesLocais";

interface NomeacoesTabProps {
  unidadeId: string;
  onUpdate: () => void;
}

interface Servidor {
  id: string;
  nome_completo: string;
  cpf: string;
}

export function NomeacoesTab({ unidadeId, onUpdate }: NomeacoesTabProps) {
  const [nomeacoes, setNomeacoes] = useState<NomeacaoChefeUnidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [servidores, setServidores] = useState<Servidor[]>([]);
  const [searchServidor, setSearchServidor] = useState("");
  const [selectedServidor, setSelectedServidor] = useState<Servidor | null>(null);
  
  const [formData, setFormData] = useState({
    ato_nomeacao_tipo: "portaria" as TipoAtoNomeacao,
    ato_numero: "",
    ato_data_publicacao: "",
    ato_doe_numero: "",
    ato_doe_data: "",
    data_inicio: "",
    observacoes: "",
  });

  useEffect(() => {
    loadNomeacoes();
    loadServidores();
  }, [unidadeId]);

  async function loadNomeacoes() {
    try {
      const { data, error } = await supabase
        .from("nomeacoes_chefe_unidade")
        .select(`
          *,
          servidor:servidores(id, nome_completo, cpf, foto_url)
        `)
        .eq("unidade_local_id", unidadeId)
        .order("data_inicio", { ascending: false });

      if (error) throw error;
      setNomeacoes(data as any);
    } catch (error) {
      console.error("Erro ao carregar nomeações:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadServidores() {
    try {
      const { data, error } = await supabase
        .from("servidores")
        .select("id, nome_completo, cpf")
        .eq("ativo", true)
        .order("nome_completo");

      if (error) throw error;
      setServidores(data || []);
    } catch (error) {
      console.error("Erro ao carregar servidores:", error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedServidor) {
      toast.error("Selecione um servidor");
      return;
    }

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase.from("nomeacoes_chefe_unidade").insert({
        unidade_local_id: unidadeId,
        servidor_id: selectedServidor.id,
        cargo: "Chefe de Unidade Local",
        ato_nomeacao_tipo: formData.ato_nomeacao_tipo,
        ato_numero: formData.ato_numero,
        ato_data_publicacao: formData.ato_data_publicacao,
        ato_doe_numero: formData.ato_doe_numero || null,
        ato_doe_data: formData.ato_doe_data || null,
        data_inicio: formData.data_inicio,
        status: "ativo",
        observacoes: formData.observacoes || null,
        created_by: userData.user?.id,
      });

      if (error) throw error;

      toast.success("Chefe nomeado com sucesso!");
      setShowForm(false);
      resetForm();
      loadNomeacoes();
      onUpdate();
    } catch (error: any) {
      console.error("Erro ao nomear chefe:", error);
      toast.error(error.message || "Erro ao nomear chefe");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setSelectedServidor(null);
    setSearchServidor("");
    setFormData({
      ato_nomeacao_tipo: "portaria",
      ato_numero: "",
      ato_data_publicacao: "",
      ato_doe_numero: "",
      ato_doe_data: "",
      data_inicio: "",
      observacoes: "",
    });
  }

  const filteredServidores = servidores.filter(
    (s) =>
      s.nome_completo.toLowerCase().includes(searchServidor.toLowerCase()) ||
      s.cpf.includes(searchServidor)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          Histórico de Nomeações
        </h3>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nomear Chefe
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : nomeacoes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma nomeação registrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Servidor</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Ato</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nomeacoes.map((nomeacao) => (
                  <TableRow key={nomeacao.id}>
                    <TableCell className="font-medium">
                      {nomeacao.servidor?.nome_completo}
                    </TableCell>
                    <TableCell>{nomeacao.cargo}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>
                          {TIPO_ATO_LABELS[nomeacao.ato_nomeacao_tipo]} nº{" "}
                          {nomeacao.ato_numero}
                        </p>
                        <p className="text-muted-foreground">
                          {new Date(nomeacao.ato_data_publicacao).toLocaleDateString(
                            "pt-BR"
                          )}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>
                          Início:{" "}
                          {new Date(nomeacao.data_inicio).toLocaleDateString("pt-BR")}
                        </p>
                        {nomeacao.data_fim && (
                          <p className="text-muted-foreground">
                            Fim:{" "}
                            {new Date(nomeacao.data_fim).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_NOMEACAO_COLORS[nomeacao.status]}>
                        {STATUS_NOMEACAO_LABELS[nomeacao.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Nova Nomeação */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nomear Chefe de Unidade</DialogTitle>
            <DialogDescription>
              Selecione um servidor do cadastro para nomear como chefe da unidade.
              O chefe anterior será automaticamente encerrado.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Busca de Servidor */}
            <div className="space-y-2">
              <Label>Servidor *</Label>
              {selectedServidor ? (
                <div className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                  <div>
                    <p className="font-medium">{selectedServidor.nome_completo}</p>
                    <p className="text-sm text-muted-foreground">
                      CPF: {selectedServidor.cpf}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedServidor(null)}
                  >
                    Alterar
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou CPF..."
                      className="pl-8"
                      value={searchServidor}
                      onChange={(e) => setSearchServidor(e.target.value)}
                    />
                  </div>
                  {searchServidor && (
                    <div className="border rounded-md max-h-48 overflow-y-auto">
                      {filteredServidores.length === 0 ? (
                        <p className="p-3 text-sm text-muted-foreground">
                          Nenhum servidor encontrado
                        </p>
                      ) : (
                        filteredServidores.slice(0, 10).map((servidor) => (
                          <button
                            key={servidor.id}
                            type="button"
                            className="w-full p-3 text-left hover:bg-muted/50 border-b last:border-0"
                            onClick={() => {
                              setSelectedServidor(servidor);
                              setSearchServidor("");
                            }}
                          >
                            <p className="font-medium">{servidor.nome_completo}</p>
                            <p className="text-sm text-muted-foreground">
                              CPF: {servidor.cpf}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Dados do Ato */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de Ato *</Label>
                <Select
                  value={formData.ato_nomeacao_tipo}
                  onValueChange={(v) =>
                    setFormData({ ...formData, ato_nomeacao_tipo: v as TipoAtoNomeacao })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_ATO_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Número do Ato *</Label>
                <Input
                  value={formData.ato_numero}
                  onChange={(e) =>
                    setFormData({ ...formData, ato_numero: e.target.value })
                  }
                  placeholder="Ex: 001/2025"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Data de Publicação *</Label>
                <Input
                  type="date"
                  value={formData.ato_data_publicacao}
                  onChange={(e) =>
                    setFormData({ ...formData, ato_data_publicacao: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Data Início Efetivo *</Label>
                <Input
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) =>
                    setFormData({ ...formData, data_inicio: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>DOE Número</Label>
                <Input
                  value={formData.ato_doe_numero}
                  onChange={(e) =>
                    setFormData({ ...formData, ato_doe_numero: e.target.value })
                  }
                  placeholder="Número do DOE"
                />
              </div>

              <div className="space-y-2">
                <Label>DOE Data</Label>
                <Input
                  type="date"
                  value={formData.ato_doe_data}
                  onChange={(e) =>
                    setFormData({ ...formData, ato_doe_data: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) =>
                  setFormData({ ...formData, observacoes: e.target.value })
                }
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
              <Button type="submit" disabled={saving || !selectedServidor}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Nomear Chefe
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
