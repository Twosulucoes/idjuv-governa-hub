import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Calendar, Loader2, Check, X, Clock, Building2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
 import { InstituicaoSelector } from "@/components/instituicoes/InstituicaoSelector";
 import { InstituicaoFormDialog } from "@/components/instituicoes/InstituicaoFormDialog";
 import type { TipoInstituicao } from "@/types/instituicoes";
 import { SEI_PLACEHOLDER } from "@/types/instituicoes";

interface FederacaoOption {
  id: string;
  nome: string;
  sigla: string;
  cnpj: string | null;
  telefone: string | null;
  email: string | null;
}
import {
  AgendaUnidade,
  StatusAgenda,
  STATUS_AGENDA_LABELS,
  STATUS_AGENDA_COLORS,
} from "@/types/unidadesLocais";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AgendaTabProps {
  unidadeId: string;
  chefeAtualId?: string;
}

const TIPOS_USO = [
  "Evento Esportivo",
  "Treinamento",
  "Competição",
  "Evento Cultural",
  "Reunião",
  "Aula",
  "Cerimônia",
  "Outro",
];

export function AgendaTab({ unidadeId, chefeAtualId }: AgendaTabProps) {
  const [reservas, setReservas] = useState<AgendaUnidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isFederacao, setIsFederacao] = useState(false);
  const [selectedFederacaoId, setSelectedFederacaoId] = useState<string>("");
   const [isInstituicao, setIsInstituicao] = useState(false);
   const [selectedInstituicaoId, setSelectedInstituicaoId] = useState<string>("");
   const [showInstituicaoForm, setShowInstituicaoForm] = useState(false);
  
  // Query para buscar federações ativas
  const { data: federacoes = [] } = useQuery({
    queryKey: ['federacoes-ativas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('federacoes_esportivas')
        .select('id, nome, sigla, cnpj, telefone, email')
        .eq('status', 'ativa')
        .order('sigla');
      
      if (error) throw error;
      return (data || []) as FederacaoOption[];
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
  
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    tipo_uso: "",
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
  });

  // Auto-preencher dados quando selecionar federação
  useEffect(() => {
    if (isFederacao && selectedFederacaoId) {
      const federacao = federacoes.find(f => f.id === selectedFederacaoId);
      if (federacao) {
        setFormData(prev => ({
          ...prev,
          solicitante_nome: federacao.nome,
          solicitante_documento: federacao.cnpj || '',
          solicitante_telefone: federacao.telefone || '',
          solicitante_email: federacao.email || '',
        }));
      }
    } else if (!isFederacao) {
      // Limpar dados do solicitante se desmarcar federação
      setFormData(prev => ({
        ...prev,
        solicitante_nome: '',
        solicitante_documento: '',
        solicitante_telefone: '',
        solicitante_email: '',
      }));
      setSelectedFederacaoId('');
    }
  }, [isFederacao, selectedFederacaoId, federacoes]);

  useEffect(() => {
    loadReservas();
  }, [unidadeId, currentMonth]);

  async function loadReservas() {
    try {
      const start = startOfMonth(currentMonth).toISOString();
      const end = endOfMonth(currentMonth).toISOString();

      const { data, error } = await supabase
        .from("agenda_unidade")
        .select("*")
        .eq("unidade_local_id", unidadeId)
        .gte("data_inicio", start)
        .lte("data_inicio", end)
        .order("data_inicio");

      if (error) throw error;
      setReservas(data as AgendaUnidade[]);
    } catch (error) {
      console.error("Erro ao carregar reservas:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    try {
      const { data: userData } = await supabase.auth.getUser();

      const dataInicio = `${formData.data_inicio}T${formData.hora_inicio}:00`;
      const dataFim = `${formData.data_fim}T${formData.hora_fim}:00`;

      // Verificar conflitos de horário
      const { data: conflitos } = await supabase
        .from("agenda_unidade")
        .select("id, titulo")
        .eq("unidade_local_id", unidadeId)
        .neq("status", "cancelado")
        .neq("status", "rejeitado")
        .or(`and(data_inicio.lte.${dataFim},data_fim.gte.${dataInicio})`);

      if (conflitos && conflitos.length > 0) {
        toast.error("Conflito de horário detectado! Já existe reserva para este período.");
        setSaving(false);
        return;
      }

      const { error } = await supabase.from("agenda_unidade").insert({
        unidade_local_id: unidadeId,
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        tipo_uso: formData.tipo_uso,
        solicitante_nome: formData.solicitante_nome,
        solicitante_documento: formData.solicitante_documento || null,
        solicitante_telefone: formData.solicitante_telefone || null,
        solicitante_email: formData.solicitante_email || null,
        data_inicio: dataInicio,
        data_fim: dataFim,
        area_utilizada: formData.area_utilizada || null,
        publico_estimado: formData.publico_estimado ? parseInt(formData.publico_estimado) : null,
        status: "solicitado",
        observacoes: formData.observacoes || null,
        created_by: userData.user?.id,
        federacao_id: isFederacao && selectedFederacaoId ? selectedFederacaoId : null,
         instituicao_id: isInstituicao && selectedInstituicaoId ? selectedInstituicaoId : null,
      });

      if (error) throw error;

      toast.success("Reserva solicitada com sucesso!");
      setShowForm(false);
      resetForm();
      loadReservas();
    } catch (error: any) {
      console.error("Erro ao criar reserva:", error);
      toast.error(error.message || "Erro ao criar reserva");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateStatus(reserva: AgendaUnidade, novoStatus: StatusAgenda) {
    try {
      const { data: userData } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("agenda_unidade")
        .update({
          status: novoStatus as any,
          aprovador_id: chefeAtualId,
          data_aprovacao: new Date().toISOString(),
          updated_by: userData.user?.id,
        })
        .eq("id", reserva.id);

      if (error) throw error;

      toast.success(`Reserva ${STATUS_AGENDA_LABELS[novoStatus]?.toLowerCase() || novoStatus}!`);
      loadReservas();
    } catch (error: any) {
      console.error("Erro ao atualizar status:", error);
      toast.error(error.message || "Erro ao atualizar status");
    }
  }

  function resetForm() {
    setFormData({
      titulo: "",
      descricao: "",
      tipo_uso: "",
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
    });
    setIsFederacao(false);
    setSelectedFederacaoId("");
     setIsInstituicao(false);
     setSelectedInstituicaoId("");
  }

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getReservasForDay = (day: Date) => {
    return reservas.filter((r) => isSameDay(parseISO(r.data_inicio), day));
  };

  const reservasForSelectedDate = selectedDate ? getReservasForDay(selectedDate) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Agenda de Uso
        </h3>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Reserva
        </Button>
      </div>

      {/* Calendário */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              ←
            </Button>
            <CardTitle className="text-lg">
              {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
            </CardTitle>
            <Button variant="ghost" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              →
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia) => (
                <div key={dia} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {dia}
                </div>
              ))}
              
              {/* Dias vazios antes do primeiro dia do mês */}
              {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="h-20" />
              ))}
              
              {daysInMonth.map((day) => {
                const dayReservas = getReservasForDay(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`h-20 p-1 border rounded-md text-left transition-colors hover:bg-muted/50 ${
                      isSelected ? "border-primary bg-primary/10" : ""
                    }`}
                  >
                    <p className="text-sm font-medium">{format(day, "d")}</p>
                    <div className="mt-1 space-y-0.5">
                      {dayReservas.slice(0, 2).map((r) => (
                        <div
                          key={r.id}
                          className={`text-xs truncate px-1 rounded ${STATUS_AGENDA_COLORS[r.status]}`}
                        >
                          {r.titulo}
                        </div>
                      ))}
                      {dayReservas.length > 2 && (
                        <p className="text-xs text-muted-foreground">+{dayReservas.length - 2}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalhes do dia selecionado */}
      {selectedDate && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Reservas em {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reservasForSelectedDate.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma reserva para este dia</p>
            ) : (
              <div className="space-y-4">
                {reservasForSelectedDate.map((reserva) => (
                  <div key={reserva.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{reserva.titulo}</h4>
                          <Badge className={STATUS_AGENDA_COLORS[reserva.status]}>
                            {STATUS_AGENDA_LABELS[reserva.status]}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          <Clock className="inline h-3 w-3 mr-1" />
                          {format(parseISO(reserva.data_inicio), "HH:mm")} - {format(parseISO(reserva.data_fim), "HH:mm")}
                        </p>
                        <p className="text-sm mt-1">
                          <strong>Solicitante:</strong> {reserva.solicitante_nome}
                        </p>
                        <p className="text-sm">
                          <strong>Tipo:</strong> {reserva.tipo_uso}
                        </p>
                      </div>
                      
                      {reserva.status === "solicitado" && chefeAtualId && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-success"
                            onClick={() => handleUpdateStatus(reserva, "aprovado")}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-destructive"
                            onClick={() => handleUpdateStatus(reserva, "rejeitado")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog de Nova Reserva */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nova Reserva</DialogTitle>
            <DialogDescription>
              Solicite uma reserva para uso da unidade
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Título do Evento *</Label>
              <Input
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Ex: Campeonato Municipal de Vôlei"
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de Uso *</Label>
                <Select
                  value={formData.tipo_uso}
                  onValueChange={(v) => setFormData({ ...formData, tipo_uso: v })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_USO.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>
                        {tipo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Data Início *</Label>
                <Input
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Hora Início *</Label>
                <Input
                  type="time"
                  value={formData.hora_inicio}
                  onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Data Fim *</Label>
                <Input
                  type="date"
                  value={formData.data_fim}
                  onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Hora Fim *</Label>
                <Input
                  type="time"
                  value={formData.hora_fim}
                  onChange={(e) => setFormData({ ...formData, hora_fim: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Dados do Solicitante</h4>
              
              {/* Toggle para Federação */}
              <div className="flex items-center gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
                <Switch
                  id="is-federacao"
                  checked={isFederacao}
                  onCheckedChange={setIsFederacao}
                />
                <Label htmlFor="is-federacao" className="cursor-pointer flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Solicitante é uma Federação Esportiva
                </Label>
              </div>
              
              {/* Seletor de Federação */}
              {isFederacao && (
                <div className="space-y-2 mb-4">
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
               
               {/* Toggle para Instituição */}
               {!isFederacao && (
                 <div className="flex items-center gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
                   <Switch
                     id="is-instituicao"
                     checked={isInstituicao}
                     onCheckedChange={setIsInstituicao}
                   />
                   <Label htmlFor="is-instituicao" className="cursor-pointer flex items-center gap-2">
                     <Building2 className="h-4 w-4" />
                     Solicitante é uma Instituição Cadastrada
                   </Label>
                 </div>
               )}
               
               {/* Seletor de Instituição */}
               {isInstituicao && !isFederacao && (
                 <div className="mb-4">
                   <InstituicaoSelector
                     value={selectedInstituicaoId}
                     onChange={(id, inst) => {
                       setSelectedInstituicaoId(id || '');
                       if (inst) {
                         setFormData(prev => ({
                           ...prev,
                           solicitante_nome: inst.nome_razao_social,
                           solicitante_documento: inst.cnpj || '',
                         }));
                       }
                     }}
                     onAddNew={() => setShowInstituicaoForm(true)}
                   />
                 </div>
               )}
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    value={formData.solicitante_nome}
                    onChange={(e) => setFormData({ ...formData, solicitante_nome: e.target.value })}
                    placeholder="Nome completo"
                    required
                    disabled={isFederacao && !!selectedFederacaoId}
                  />
                </div>
                <div className="space-y-2">
                  <Label>CPF/CNPJ</Label>
                  <Input
                    value={formData.solicitante_documento}
                    onChange={(e) => setFormData({ ...formData, solicitante_documento: e.target.value })}
                    placeholder="Documento"
                    disabled={isFederacao && !!selectedFederacaoId}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 mt-4">
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={formData.solicitante_telefone}
                    onChange={(e) => setFormData({ ...formData, solicitante_telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                    disabled={isFederacao && !!selectedFederacaoId}
                  />
                </div>
                <div className="space-y-2">
                  <Label>E-mail</Label>
                  <Input
                    type="email"
                    value={formData.solicitante_email}
                    onChange={(e) => setFormData({ ...formData, solicitante_email: e.target.value })}
                    placeholder="email@exemplo.com"
                    disabled={isFederacao && !!selectedFederacaoId}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição/Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Detalhes adicionais sobre a reserva..."
                rows={3}
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
                Solicitar Reserva
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
       
       {/* Dialog de Nova Instituição */}
       <InstituicaoFormDialog
         open={showInstituicaoForm}
         onOpenChange={setShowInstituicaoForm}
         onSuccess={() => {
           setShowInstituicaoForm(false);
         }}
       />
    </div>
  );
}
