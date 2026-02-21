import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Building2, Loader2, FileDown } from "lucide-react";
import {
  TipoAtoNomeacao,
  TIPO_ATO_LABELS,
  STATUS_NOMEACAO_LABELS,
  STATUS_NOMEACAO_COLORS,
} from "@/types/unidadesLocais";
import { generateMemorandoDesignacao } from "@/lib/pdf/rh/memorandoDesignacao";

interface DesignacoesUnidadeTabProps {
  servidorId: string;
  servidorNome: string;
}

interface Designacao {
  id: string;
  unidade_local_id: string;
  servidor_id: string;
  cargo: string;
  ato_nomeacao_tipo: string;
  ato_numero: string;
  ato_data_publicacao: string;
  ato_doe_numero?: string;
  ato_doe_data?: string;
  data_inicio: string;
  data_fim?: string;
  status: string;
  observacoes?: string;
  unidade?: { id: string; nome_unidade: string; municipio: string };
}

interface UnidadeLocal {
  id: string;
  nome_unidade: string;
  municipio: string;
}

export function DesignacoesUnidadeTab({ servidorId, servidorNome }: DesignacoesUnidadeTabProps) {
  const [designacoes, setDesignacoes] = useState<Designacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [unidades, setUnidades] = useState<UnidadeLocal[]>([]);
  const [selectedUnidade, setSelectedUnidade] = useState<string>("");

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
    loadDesignacoes();
    loadUnidades();
  }, [servidorId]);

  async function loadDesignacoes() {
    try {
      const { data, error } = await supabase
        .from("nomeacoes_chefe_unidade")
        .select(`
          *,
          unidade:unidades_locais!nomeacoes_chefe_unidade_unidade_local_id_fkey(id, nome_unidade, municipio)
        `)
        .eq("servidor_id", servidorId)
        .order("data_inicio", { ascending: false });

      if (error) throw error;
      setDesignacoes((data || []) as any);
    } catch (error) {
      console.error("Erro ao carregar designações:", error);
    } finally {
      setLoading(false);
    }
  }

  async function loadUnidades() {
    try {
      const { data, error } = await supabase
        .from("unidades_locais")
        .select("id, nome_unidade, municipio")
        .eq("status", "ativa")
        .order("nome_unidade");

      if (error) throw error;
      setUnidades(data || []);
    } catch (error) {
      console.error("Erro ao carregar unidades:", error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUnidade) {
      toast.error("Selecione uma unidade local");
      return;
    }

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase.from("nomeacoes_chefe_unidade").insert({
        unidade_local_id: selectedUnidade,
        servidor_id: servidorId,
        cargo: "Chefe de Unidade Local",
        ato_nomeacao_tipo: formData.ato_nomeacao_tipo,
        ato_numero: formData.ato_numero.trim(),
        ato_data_publicacao: formData.ato_data_publicacao,
        ato_doe_numero: formData.ato_doe_numero.trim() || null,
        ato_doe_data: formData.ato_doe_data || null,
        data_inicio: formData.data_inicio,
        status: "ativo",
        observacoes: formData.observacoes.trim() || null,
        created_by: userData.user?.id,
      });

      if (error) throw error;

      // Gerar memorando PDF
      const unidadeSelecionada = unidades.find(u => u.id === selectedUnidade);
      if (unidadeSelecionada) {
        generateMemorandoDesignacao({
          servidorNome,
          cargo: "Chefe de Unidade Local",
          unidadeNome: unidadeSelecionada.nome_unidade,
          unidadeMunicipio: unidadeSelecionada.municipio,
          tipoAto: formData.ato_nomeacao_tipo,
          numeroAto: formData.ato_numero,
          dataPublicacao: formData.ato_data_publicacao,
          dataInicio: formData.data_inicio,
        });
      }

      toast.success("Designação registrada com sucesso! Memorando gerado.");
      setShowForm(false);
      resetForm();
      loadDesignacoes();
    } catch (error: any) {
      console.error("Erro ao registrar designação:", error);
      toast.error(error.message || "Erro ao registrar designação");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setSelectedUnidade("");
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

  function handleDownloadMemorando(designacao: Designacao) {
    generateMemorandoDesignacao({
      servidorNome,
      cargo: designacao.cargo,
      unidadeNome: designacao.unidade?.nome_unidade || "Unidade",
      unidadeMunicipio: designacao.unidade?.municipio || "",
      tipoAto: designacao.ato_nomeacao_tipo,
      numeroAto: designacao.ato_numero,
      dataPublicacao: designacao.ato_data_publicacao,
      dataInicio: designacao.data_inicio,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Designações de Chefia em Unidades Locais
        </h3>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Designação
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : designacoes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma designação de chefia registrada para este servidor
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Unidade Local</TableHead>
                  <TableHead>Ato</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]">Memorando</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {designacoes.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{d.unidade?.nome_unidade}</p>
                        <p className="text-xs text-muted-foreground">{d.unidade?.municipio}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{TIPO_ATO_LABELS[d.ato_nomeacao_tipo as TipoAtoNomeacao]} nº {d.ato_numero}</p>
                        <p className="text-muted-foreground">
                          {new Date(d.ato_data_publicacao).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>Início: {new Date(d.data_inicio).toLocaleDateString("pt-BR")}</p>
                        {d.data_fim && (
                          <p className="text-muted-foreground">
                            Fim: {new Date(d.data_fim).toLocaleDateString("pt-BR")}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_NOMEACAO_COLORS[d.status as keyof typeof STATUS_NOMEACAO_COLORS]}>
                        {STATUS_NOMEACAO_LABELS[d.status as keyof typeof STATUS_NOMEACAO_LABELS]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDownloadMemorando(d)} title="Baixar Memorando">
                        <FileDown className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Nova Designação */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nova Designação de Chefia</DialogTitle>
            <DialogDescription>
              Designe este servidor como chefe de uma unidade local.
              O chefe anterior será automaticamente encerrado.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seleção de Unidade */}
            <div className="space-y-2">
              <Label>Unidade Local *</Label>
              <Select value={selectedUnidade} onValueChange={setSelectedUnidade}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a unidade local..." />
                </SelectTrigger>
                <SelectContent>
                  {unidades.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nome_unidade} - {u.municipio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dados do Ato */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de Ato *</Label>
                <Select
                  value={formData.ato_nomeacao_tipo}
                  onValueChange={(v) => setFormData({ ...formData, ato_nomeacao_tipo: v as TipoAtoNomeacao })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(TIPO_ATO_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Número do Ato *</Label>
                <Input
                  value={formData.ato_numero}
                  onChange={(e) => setFormData({ ...formData, ato_numero: e.target.value })}
                  placeholder="Ex: 001/2025"
                  required
                  maxLength={30}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Data de Publicação *</Label>
                <Input type="date" value={formData.ato_data_publicacao} onChange={(e) => setFormData({ ...formData, ato_data_publicacao: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Data Início Efetivo *</Label>
                <Input type="date" value={formData.data_inicio} onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })} required />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>DOE Número</Label>
                <Input value={formData.ato_doe_numero} onChange={(e) => setFormData({ ...formData, ato_doe_numero: e.target.value })} placeholder="Número do DOE" maxLength={20} />
              </div>
              <div className="space-y-2">
                <Label>DOE Data</Label>
                <Input type="date" value={formData.ato_doe_data} onChange={(e) => setFormData({ ...formData, ato_doe_data: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações adicionais..."
                rows={2}
                maxLength={1000}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving || !selectedUnidade}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar Designação
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
