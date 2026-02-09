import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Building2, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { InstituicaoSelector } from "@/components/instituicoes/InstituicaoSelector";
import { InstituicaoFormDialog } from "@/components/instituicoes/InstituicaoFormDialog";
import {
  TIPOS_EVENTO,
  CATEGORIAS_EVENTO,
  isTipoEsportivo,
} from "@/types/unidadesLocais";
import { ModalidadesSelector } from "../ModalidadesSelector";

interface FederacaoOption {
  id: string;
  nome: string;
  sigla: string;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
}

interface AgendaReservaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unidadeId: string;
  onSuccess: () => void;
}

const INITIAL_FORM = {
  titulo: "",
  descricao: "",
  tipo_uso: "",
  modalidades_esportivas: [] as string[],
  solicitante_nome: "",
  solicitante_documento: "",
  solicitante_telefone: "",
  solicitante_email: "",
  data_inicio: "",
  hora_inicio: "",
  data_fim: "",
  hora_fim: "",
  area_utilizada: "",
  publico_estimado: "",
  observacoes: "",
};

export function AgendaReservaForm({
  open,
  onOpenChange,
  unidadeId,
  onSuccess,
}: AgendaReservaFormProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ ...INITIAL_FORM });
  const [isFederacao, setIsFederacao] = useState(false);
  const [selectedFederacaoId, setSelectedFederacaoId] = useState("");
  const [isInstituicao, setIsInstituicao] = useState(false);
  const [selectedInstituicaoId, setSelectedInstituicaoId] = useState("");
  const [showInstituicaoForm, setShowInstituicaoForm] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const { data: federacoes = [] } = useQuery({
    queryKey: ["federacoes-ativas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("federacoes_esportivas")
        .select("id, nome, sigla, cnpj, telefone, email")
        .eq("status", "ativo")
        .order("sigla");
      if (error) throw error;
      return (data || []) as FederacaoOption[];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Auto-fill from federation
  useEffect(() => {
    if (isFederacao && selectedFederacaoId) {
      const fed = federacoes.find((f) => f.id === selectedFederacaoId);
      if (fed) {
        setFormData((prev) => ({
          ...prev,
          solicitante_nome: fed.nome,
          solicitante_documento: fed.cnpj || "",
          solicitante_telefone: fed.telefone || "",
          solicitante_email: fed.email || "",
        }));
      }
    } else if (!isFederacao && !isInstituicao) {
      clearSolicitante();
      setSelectedFederacaoId("");
    }
  }, [isFederacao, selectedFederacaoId, federacoes]);

  useEffect(() => {
    if (!isInstituicao && !isFederacao) {
      clearSolicitante();
      setSelectedInstituicaoId("");
    }
  }, [isInstituicao, isFederacao]);

  function clearSolicitante() {
    setFormData((prev) => ({
      ...prev,
      solicitante_nome: "",
      solicitante_documento: "",
      solicitante_telefone: "",
      solicitante_email: "",
    }));
  }

  function resetForm() {
    setFormData({ ...INITIAL_FORM });
    setIsFederacao(false);
    setSelectedFederacaoId("");
    setIsInstituicao(false);
    setSelectedInstituicaoId("");
    setValidationErrors([]);
  }

  function validate(): string[] {
    const errors: string[] = [];
    if (!formData.titulo.trim()) errors.push("Título é obrigatório");
    if (!formData.tipo_uso) errors.push("Tipo de uso é obrigatório");
    if (!formData.solicitante_nome.trim()) errors.push("Nome do solicitante é obrigatório");
    if (!formData.data_inicio || !formData.hora_inicio)
      errors.push("Data e hora de início são obrigatórios");
    if (!formData.data_fim || !formData.hora_fim)
      errors.push("Data e hora de fim são obrigatórios");

    if (formData.data_inicio && formData.hora_inicio && formData.data_fim && formData.hora_fim) {
      const inicio = new Date(`${formData.data_inicio}T${formData.hora_inicio}`);
      const fim = new Date(`${formData.data_fim}T${formData.hora_fim}`);
      if (fim <= inicio) errors.push("Data/hora de fim deve ser posterior ao início");
      if (inicio < new Date()) errors.push("Data de início não pode ser no passado");
    }

    if (isTipoEsportivo(formData.tipo_uso) && formData.modalidades_esportivas.length === 0) {
      errors.push("Selecione ao menos uma modalidade esportiva");
    }

    return errors;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errors = validate();
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error(errors[0]);
      return;
    }
    setValidationErrors([]);
    setSaving(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const dataInicio = `${formData.data_inicio}T${formData.hora_inicio}:00`;
      const dataFim = `${formData.data_fim}T${formData.hora_fim}:00`;

      // Check conflicts
      const { data: conflitos } = await supabase
        .from("agenda_unidade")
        .select("id, titulo")
        .eq("unidade_local_id", unidadeId)
        .neq("status", "cancelado")
        .neq("status", "rejeitado")
        .or(`and(data_inicio.lte.${dataFim},data_fim.gte.${dataInicio})`);

      if (conflitos && conflitos.length > 0) {
        toast.error(
          `Conflito de horário com "${conflitos[0].titulo}". Escolha outro período.`
        );
        setSaving(false);
        return;
      }

      const { error } = await supabase.from("agenda_unidade").insert({
        unidade_local_id: unidadeId,
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        tipo_uso: formData.tipo_uso,
        modalidades_esportivas: isTipoEsportivo(formData.tipo_uso)
          ? formData.modalidades_esportivas
          : [],
        solicitante_nome: formData.solicitante_nome,
        solicitante_documento: formData.solicitante_documento || null,
        solicitante_telefone: formData.solicitante_telefone || null,
        solicitante_email: formData.solicitante_email || null,
        data_inicio: dataInicio,
        data_fim: dataFim,
        area_utilizada: formData.area_utilizada || null,
        publico_estimado: formData.publico_estimado
          ? parseInt(formData.publico_estimado)
          : null,
        status: "solicitado",
        observacoes: formData.observacoes || null,
        created_by: userData.user?.id,
        federacao_id:
          isFederacao && selectedFederacaoId ? selectedFederacaoId : null,
        instituicao_id:
          isInstituicao && selectedInstituicaoId ? selectedInstituicaoId : null,
      } as any);

      if (error) throw error;

      toast.success("Reserva solicitada com sucesso!");
      onOpenChange(false);
      resetForm();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar reserva");
    } finally {
      setSaving(false);
    }
  }

  const solicitanteLocked =
    (isFederacao && !!selectedFederacaoId) ||
    (isInstituicao && !!selectedInstituicaoId);

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) resetForm();
          onOpenChange(v);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Reserva de Espaço</DialogTitle>
            <DialogDescription>
              Preencha os dados para solicitar o uso da unidade
            </DialogDescription>
          </DialogHeader>

          {validationErrors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 space-y-1">
              <p className="text-sm font-medium text-destructive flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4" /> Corrija os seguintes erros:
              </p>
              {validationErrors.map((err, i) => (
                <p key={i} className="text-xs text-destructive pl-6">• {err}</p>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seção: Evento */}
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-foreground border-b pb-1 w-full">
                📋 Dados do Evento
              </legend>

              <div className="space-y-2">
                <Label>Título do Evento *</Label>
                <Input
                  value={formData.titulo}
                  onChange={(e) =>
                    setFormData({ ...formData, titulo: e.target.value })
                  }
                  placeholder="Ex: Campeonato Municipal de Vôlei"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo de Uso *</Label>
                  <Select
                    value={formData.tipo_uso}
                    onValueChange={(v) =>
                      setFormData({
                        ...formData,
                        tipo_uso: v,
                        modalidades_esportivas: isTipoEsportivo(v)
                          ? formData.modalidades_esportivas
                          : [],
                      })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CATEGORIAS_EVENTO).map(([key, label]) => {
                        const tiposCategoria = TIPOS_EVENTO.filter(
                          (t) => t.categoria === key
                        );
                        if (tiposCategoria.length === 0) return null;
                        return (
                          <SelectGroup key={key}>
                            <SelectLabel className="text-xs font-semibold text-muted-foreground">
                              {label}
                            </SelectLabel>
                            {tiposCategoria.map((tipo) => (
                              <SelectItem key={tipo.value} value={tipo.value}>
                                {tipo.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Público Estimado</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.publico_estimado}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        publico_estimado: e.target.value,
                      })
                    }
                    placeholder="Nº de pessoas"
                  />
                </div>
              </div>

              {isTipoEsportivo(formData.tipo_uso) && (
                <ModalidadesSelector
                  value={formData.modalidades_esportivas}
                  onChange={(m) =>
                    setFormData({ ...formData, modalidades_esportivas: m })
                  }
                />
              )}
            </fieldset>

            {/* Seção: Período */}
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-foreground border-b pb-1 w-full">
                📅 Período de Uso
              </legend>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Data Início *</Label>
                    <Input
                      type="date"
                      value={formData.data_inicio}
                      onChange={(e) =>
                        setFormData({ ...formData, data_inicio: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hora *</Label>
                    <Input
                      type="time"
                      value={formData.hora_inicio}
                      onChange={(e) =>
                        setFormData({ ...formData, hora_inicio: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Data Fim *</Label>
                    <Input
                      type="date"
                      value={formData.data_fim}
                      onChange={(e) =>
                        setFormData({ ...formData, data_fim: e.target.value })
                      }
                      min={formData.data_inicio || undefined}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hora *</Label>
                    <Input
                      type="time"
                      value={formData.hora_fim}
                      onChange={(e) =>
                        setFormData({ ...formData, hora_fim: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Área/Espaço Utilizado</Label>
                <Input
                  value={formData.area_utilizada}
                  onChange={(e) =>
                    setFormData({ ...formData, area_utilizada: e.target.value })
                  }
                  placeholder="Ex: Quadra Poliesportiva, Piscina..."
                />
              </div>
            </fieldset>

            {/* Seção: Solicitante */}
            <fieldset className="space-y-4">
              <legend className="text-sm font-semibold text-foreground border-b pb-1 w-full">
                👤 Dados do Solicitante
              </legend>

              {/* Toggle Federação */}
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Switch
                  id="is-federacao"
                  checked={isFederacao}
                  onCheckedChange={(v) => {
                    setIsFederacao(v);
                    if (v) setIsInstituicao(false);
                  }}
                />
                <Label htmlFor="is-federacao" className="cursor-pointer flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Federação Esportiva
                </Label>
              </div>

              {isFederacao && (
                <div className="space-y-2">
                  <Label>Selecione a Federação *</Label>
                  <Select
                    value={selectedFederacaoId}
                    onValueChange={setSelectedFederacaoId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma federação..." />
                    </SelectTrigger>
                    <SelectContent>
                      {federacoes.map((fed) => (
                        <SelectItem key={fed.id} value={fed.id}>
                          {fed.sigla} - {fed.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Toggle Instituição */}
              {!isFederacao && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Switch
                    id="is-instituicao"
                    checked={isInstituicao}
                    onCheckedChange={(v) => {
                      setIsInstituicao(v);
                      if (v) setIsFederacao(false);
                    }}
                  />
                  <Label htmlFor="is-instituicao" className="cursor-pointer flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Instituição Cadastrada
                  </Label>
                </div>
              )}

              {isInstituicao && !isFederacao && (
                <InstituicaoSelector
                  value={selectedInstituicaoId}
                  onChange={(id, inst) => {
                    setSelectedInstituicaoId(id || "");
                    if (inst) {
                      setFormData((prev) => ({
                        ...prev,
                        solicitante_nome: inst.nome_razao_social,
                        solicitante_documento:
                          inst.cnpj || inst.responsavel_cpf || "",
                        solicitante_telefone:
                          inst.responsavel_telefone || "",
                        solicitante_email: inst.responsavel_email || "",
                      }));
                    } else {
                      clearSolicitante();
                    }
                  }}
                  onAddNew={() => setShowInstituicaoForm(true)}
                />
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    value={formData.solicitante_nome}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        solicitante_nome: e.target.value,
                      })
                    }
                    placeholder="Nome completo"
                    required
                    disabled={solicitanteLocked}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CPF/CNPJ</Label>
                  <Input
                    value={formData.solicitante_documento}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        solicitante_documento: e.target.value,
                      })
                    }
                    placeholder="Documento"
                    disabled={solicitanteLocked}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={formData.solicitante_telefone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        solicitante_telefone: e.target.value,
                      })
                    }
                    placeholder="(00) 00000-0000"
                    disabled={solicitanteLocked}
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={formData.solicitante_email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        solicitante_email: e.target.value,
                      })
                    }
                    placeholder="email@exemplo.com"
                    disabled={solicitanteLocked}
                  />
                </div>
              </div>
            </fieldset>

            {/* Observações */}
            <div className="space-y-2">
              <Label>Descrição/Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) =>
                  setFormData({ ...formData, observacoes: e.target.value })
                }
                placeholder="Detalhes adicionais sobre a reserva..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  resetForm();
                }}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Solicitar Reserva
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <InstituicaoFormDialog
        open={showInstituicaoForm}
        onOpenChange={setShowInstituicaoForm}
        onSuccess={() => setShowInstituicaoForm(false)}
      />
    </>
  );
}
