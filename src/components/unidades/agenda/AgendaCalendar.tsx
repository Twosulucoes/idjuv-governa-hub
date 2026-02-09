import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import {
  AgendaUnidade,
  StatusAgenda,
  STATUS_AGENDA_LABELS,
  STATUS_AGENDA_COLORS,
} from "@/types/unidadesLocais";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
} from "date-fns";
import { ptBR } from "date-fns/locale";

interface AgendaCalendarProps {
  reservas: AgendaUnidade[];
  loading: boolean;
  currentMonth: Date;
  selectedDate: Date | null;
  statusFilter: StatusAgenda | "todos";
  onMonthChange: (month: Date) => void;
  onSelectDate: (date: Date) => void;
  onStatusFilterChange: (status: StatusAgenda | "todos") => void;
}

const STATUS_OPTIONS: { value: StatusAgenda | "todos"; label: string; color: string }[] = [
  { value: "todos", label: "Todos", color: "bg-muted text-muted-foreground" },
  { value: "solicitado", label: "Solicitados", color: STATUS_AGENDA_COLORS.solicitado },
  { value: "aprovado", label: "Aprovados", color: STATUS_AGENDA_COLORS.aprovado },
  { value: "rejeitado", label: "Rejeitados", color: STATUS_AGENDA_COLORS.rejeitado },
  { value: "concluido", label: "Concluídos", color: STATUS_AGENDA_COLORS.concluido },
  { value: "cancelado", label: "Cancelados", color: STATUS_AGENDA_COLORS.cancelado },
];

export function AgendaCalendar({
  reservas,
  loading,
  currentMonth,
  selectedDate,
  statusFilter,
  onMonthChange,
  onSelectDate,
  onStatusFilterChange,
}: AgendaCalendarProps) {
  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const filteredReservas = statusFilter === "todos"
    ? reservas
    : reservas.filter((r) => r.status === statusFilter);

  const getReservasForDay = (day: Date) =>
    filteredReservas.filter((r) => {
      const inicio = parseISO(r.data_inicio);
      const fim = parseISO(r.data_fim);
      return day >= new Date(inicio.toDateString()) && day <= new Date(fim.toDateString());
    });

  // Contadores por status
  const counts = reservas.reduce(
    (acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      acc.todos++;
      return acc;
    },
    { todos: 0 } as Record<string, number>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => onMonthChange(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-lg capitalize">
            {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => onMonthChange(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Filtros de status */}
        <div className="flex flex-wrap gap-2 mt-3">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onStatusFilterChange(opt.value)}
              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
                statusFilter === opt.value
                  ? `${opt.color} ring-2 ring-ring ring-offset-1`
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {opt.label}
              {counts[opt.value] ? ` (${counts[opt.value]})` : ""}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia) => (
                <div key={dia} className="text-center text-xs font-semibold text-muted-foreground py-2 uppercase tracking-wider">
                  {dia}
                </div>
              ))}

              {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24" />
              ))}

              {daysInMonth.map((day) => {
                const dayReservas = getReservasForDay(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const today = isToday(day);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => onSelectDate(day)}
                    className={`h-24 p-1.5 border rounded-lg text-left transition-all hover:shadow-sm ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30"
                        : today
                        ? "border-accent bg-accent/10"
                        : "border-border/50 hover:border-border hover:bg-muted/30"
                    }`}
                  >
                    <p className={`text-sm font-medium ${today ? "text-primary font-bold" : ""}`}>
                      {format(day, "d")}
                    </p>
                    <div className="mt-1 space-y-0.5 overflow-hidden">
                      {dayReservas.slice(0, 2).map((r) => (
                        <div
                          key={r.id}
                          className={`text-[10px] leading-tight truncate px-1 py-0.5 rounded ${STATUS_AGENDA_COLORS[r.status]}`}
                        >
                          {r.titulo}
                        </div>
                      ))}
                      {dayReservas.length > 2 && (
                        <p className="text-[10px] text-muted-foreground font-medium">
                          +{dayReservas.length - 2} mais
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legenda */}
            <div className="flex flex-wrap gap-3 mt-4 pt-3 border-t">
              <span className="text-xs text-muted-foreground font-medium">Legenda:</span>
              {STATUS_OPTIONS.filter((o) => o.value !== "todos").map((opt) => (
                <div key={opt.value} className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${opt.color.split(" ")[0]}`} />
                  <span className="text-xs text-muted-foreground">{opt.label}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
