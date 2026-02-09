import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Calendar } from "lucide-react";
import { AgendaUnidade, StatusAgenda } from "@/types/unidadesLocais";
import { AgendaCalendar } from "./agenda/AgendaCalendar";
import { AgendaDayDetail } from "./agenda/AgendaDayDetail";
import { AgendaReservaForm } from "./agenda/AgendaReservaForm";
import {
  startOfMonth,
  endOfMonth,
  isSameDay,
  parseISO,
} from "date-fns";

interface AgendaTabProps {
  unidadeId: string;
  chefeAtualId?: string;
}

export function AgendaTab({ unidadeId, chefeAtualId }: AgendaTabProps) {
  const [reservas, setReservas] = useState<AgendaUnidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusAgenda | "todos">("todos");

  const loadReservas = useCallback(async () => {
    try {
      setLoading(true);
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
  }, [unidadeId, currentMonth]);

  useEffect(() => {
    loadReservas();
  }, [loadReservas]);

  const reservasForSelectedDate = selectedDate
    ? reservas.filter((r) => {
        const inicio = parseISO(r.data_inicio);
        const fim = parseISO(r.data_fim);
        const day = selectedDate;
        return day >= new Date(inicio.toDateString()) && day <= new Date(fim.toDateString());
      })
    : [];

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

      <AgendaCalendar
        reservas={reservas}
        loading={loading}
        currentMonth={currentMonth}
        selectedDate={selectedDate}
        statusFilter={statusFilter}
        onMonthChange={setCurrentMonth}
        onSelectDate={setSelectedDate}
        onStatusFilterChange={setStatusFilter}
      />

      {selectedDate && (
        <AgendaDayDetail
          selectedDate={selectedDate}
          reservas={reservasForSelectedDate}
          chefeAtualId={chefeAtualId}
          onStatusUpdated={loadReservas}
        />
      )}

      <AgendaReservaForm
        open={showForm}
        onOpenChange={setShowForm}
        unidadeId={unidadeId}
        onSuccess={loadReservas}
      />
    </div>
  );
}
