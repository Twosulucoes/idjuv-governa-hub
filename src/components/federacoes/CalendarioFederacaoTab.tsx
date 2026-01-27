import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Calendar, Loader2, MapPin, Users, Trash2 } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NovaCompeticaoDialog } from "./NovaCompeticaoDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CalendarioFederacaoTabProps {
  federacaoId: string;
  federacaoSigla: string;
}

interface Competicao {
  id: string;
  federacao_id: string;
  titulo: string;
  descricao: string | null;
  tipo: string;
  data_inicio: string;
  data_fim: string | null;
  local: string | null;
  cidade: string | null;
  publico_estimado: number | null;
  categorias: string | null;
  observacoes: string | null;
  status: string;
  created_at: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  planejado: { label: "Planejado", color: "bg-yellow-100 text-yellow-800" },
  confirmado: { label: "Confirmado", color: "bg-blue-100 text-blue-800" },
  em_andamento: { label: "Em Andamento", color: "bg-green-100 text-green-800" },
  concluido: { label: "Concluído", color: "bg-gray-100 text-gray-800" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-800" },
};

export function CalendarioFederacaoTab({ federacaoId, federacaoSigla }: CalendarioFederacaoTabProps) {
  const [competicoes, setCompeticoes] = useState<Competicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; competicao: Competicao | null }>({
    open: false,
    competicao: null,
  });

  useEffect(() => {
    if (federacaoId) {
      loadCompeticoes();
    }
  }, [federacaoId, currentMonth]);

  // Verificação de segurança - retorna null se não tiver os dados necessários
  if (!federacaoId) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Federação não selecionada
      </div>
    );
  }

  async function loadCompeticoes() {
    try {
      setLoading(true);
      const start = startOfMonth(currentMonth).toISOString().split('T')[0];
      const end = endOfMonth(currentMonth).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from("calendario_federacao")
        .select("*")
        .eq("federacao_id", federacaoId)
        .gte("data_inicio", start)
        .lte("data_inicio", end)
        .order("data_inicio");

      if (error) throw error;
      setCompeticoes(data as Competicao[]);
    } catch (error) {
      console.error("Erro ao carregar competições:", error);
      toast.error("Erro ao carregar calendário");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(competicao: Competicao) {
    try {
      const { error } = await supabase
        .from("calendario_federacao")
        .delete()
        .eq("id", competicao.id);

      if (error) throw error;

      toast.success("Competição excluída com sucesso!");
      setDeleteDialog({ open: false, competicao: null });
      loadCompeticoes();
    } catch (error: any) {
      console.error("Erro ao excluir competição:", error);
      toast.error(error.message || "Erro ao excluir competição");
    }
  }

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getCompeticoesForDay = (day: Date) => {
    return competicoes.filter((c) => isSameDay(parseISO(c.data_inicio), day));
  };

  const competicoesForSelectedDate = selectedDate ? getCompeticoesForDay(selectedDate) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Calendário de Competições
        </h3>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Competição
        </Button>
      </div>

      {/* Calendário */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              ←
            </Button>
            <CardTitle className="text-lg capitalize">
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
                const dayCompeticoes = getCompeticoesForDay(day);
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
                      {dayCompeticoes.slice(0, 2).map((c) => (
                        <div
                          key={c.id}
                          className={`text-xs truncate px-1 rounded ${STATUS_CONFIG[c.status]?.color || "bg-gray-100"}`}
                        >
                          {c.titulo}
                        </div>
                      ))}
                      {dayCompeticoes.length > 2 && (
                        <p className="text-xs text-muted-foreground">+{dayCompeticoes.length - 2}</p>
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
              Competições em {format(selectedDate, "d 'de' MMMM", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {competicoesForSelectedDate.length === 0 ? (
              <p className="text-muted-foreground">Nenhuma competição para este dia</p>
            ) : (
              <div className="space-y-4">
                {competicoesForSelectedDate.map((competicao) => (
                  <div key={competicao.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold">{competicao.titulo}</h4>
                          <Badge className={STATUS_CONFIG[competicao.status]?.color}>
                            {STATUS_CONFIG[competicao.status]?.label || competicao.status}
                          </Badge>
                          <Badge variant="outline">{competicao.tipo}</Badge>
                        </div>
                        
                        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                          {competicao.data_fim && (
                            <p>
                              <strong>Período:</strong> {format(parseISO(competicao.data_inicio), "dd/MM/yyyy")} 
                              {" - "} 
                              {format(parseISO(competicao.data_fim), "dd/MM/yyyy")}
                            </p>
                          )}
                          
                          {(competicao.local || competicao.cidade) && (
                            <p className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {[competicao.local, competicao.cidade].filter(Boolean).join(" - ")}
                            </p>
                          )}
                          
                          {competicao.categorias && (
                            <p><strong>Categorias:</strong> {competicao.categorias}</p>
                          )}
                          
                          {competicao.publico_estimado && (
                            <p className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              Público estimado: {competicao.publico_estimado.toLocaleString()}
                            </p>
                          )}
                          
                          {competicao.descricao && (
                            <p className="mt-2">{competicao.descricao}</p>
                          )}
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteDialog({ open: true, competicao })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Dialog de Nova Competição */}
      <NovaCompeticaoDialog
        open={showForm}
        onOpenChange={setShowForm}
        federacaoId={federacaoId}
        federacaoSigla={federacaoSigla}
        onSuccess={loadCompeticoes}
      />

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, competicao: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Competição</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a competição "{deleteDialog.competicao?.titulo}"?
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDialog.competicao && handleDelete(deleteDialog.competicao)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
