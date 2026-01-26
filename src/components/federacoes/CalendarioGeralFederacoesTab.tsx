import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, Loader2, MapPin, Users, ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CompeticaoGeral {
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
  federacao_nome?: string;
  federacao_sigla?: string;
}

interface Federacao {
  id: string;
  nome: string;
  sigla: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  planejado: { label: "Planejado", color: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  confirmado: { label: "Confirmado", color: "bg-blue-100 text-blue-800 border-blue-300" },
  em_andamento: { label: "Em Andamento", color: "bg-green-100 text-green-800 border-green-300" },
  concluido: { label: "Concluído", color: "bg-gray-100 text-gray-800 border-gray-300" },
  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-800 border-red-300" },
};

const TIPO_COLORS: Record<string, string> = {
  "Campeonato Estadual": "bg-purple-100 text-purple-800",
  "Campeonato Regional": "bg-indigo-100 text-indigo-800",
  "Torneio": "bg-cyan-100 text-cyan-800",
  "Copa": "bg-orange-100 text-orange-800",
  "Festival": "bg-pink-100 text-pink-800",
  "Jogos Abertos": "bg-teal-100 text-teal-800",
  "Seletiva": "bg-amber-100 text-amber-800",
  "Amistoso": "bg-lime-100 text-lime-800",
};

export function CalendarioGeralFederacoesTab() {
  const [competicoes, setCompeticoes] = useState<CompeticaoGeral[]>([]);
  const [federacoes, setFederacoes] = useState<Federacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filtroFederacao, setFiltroFederacao] = useState<string>("todas");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");

  useEffect(() => {
    loadFederacoes();
  }, []);

  useEffect(() => {
    loadCompeticoes();
  }, [currentMonth, filtroFederacao, filtroStatus]);

  async function loadFederacoes() {
    try {
      const { data, error } = await supabase
        .from("federacoes_esportivas")
        .select("id, nome, sigla")
        .eq("status", "ativo")
        .order("nome");

      if (error) throw error;
      setFederacoes(data || []);
    } catch (error) {
      console.error("Erro ao carregar federações:", error);
    }
  }

  async function loadCompeticoes() {
    try {
      setLoading(true);
      const start = startOfMonth(currentMonth).toISOString().split('T')[0];
      const end = endOfMonth(currentMonth).toISOString().split('T')[0];

      // Buscar competições
      let query = supabase
        .from("calendario_federacao")
        .select("*")
        .gte("data_inicio", start)
        .lte("data_inicio", end)
        .order("data_inicio");

      if (filtroFederacao !== "todas") {
        query = query.eq("federacao_id", filtroFederacao);
      }

      if (filtroStatus !== "todos") {
        query = query.eq("status", filtroStatus);
      }

      const { data: competicoesData, error } = await query;
      if (error) throw error;

      // Buscar nomes das federações
      const { data: fedsData } = await supabase
        .from("federacoes_esportivas")
        .select("id, nome, sigla");

      const fedsMap = new Map((fedsData || []).map(f => [f.id, f]));

      const competicoesComFederacao = (competicoesData || []).map(c => ({
        ...c,
        federacao_nome: fedsMap.get(c.federacao_id)?.nome || "Desconhecida",
        federacao_sigla: fedsMap.get(c.federacao_id)?.sigla || "?",
      }));

      setCompeticoes(competicoesComFederacao as CompeticaoGeral[]);
    } catch (error) {
      console.error("Erro ao carregar competições:", error);
      toast.error("Erro ao carregar calendário geral");
    } finally {
      setLoading(false);
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

  // Estatísticas do mês
  const totalCompeticoes = competicoes.length;
  const competicoesPorStatus = competicoes.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header com Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Calendário Geral de Competições
        </h3>
        <div className="flex flex-wrap gap-2">
          <Select value={filtroFederacao} onValueChange={setFiltroFederacao}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Todas Federações" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas Federações</SelectItem>
              {federacoes.map((fed) => (
                <SelectItem key={fed.id} value={fed.id}>
                  {fed.sigla} - {fed.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Todos Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Status</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="bg-primary/10">
          <CardContent className="p-3 text-center">
            <p className="text-2xl font-bold text-primary">{totalCompeticoes}</p>
            <p className="text-xs text-muted-foreground">Total no Mês</p>
          </CardContent>
        </Card>
        {Object.entries(STATUS_CONFIG).slice(0, 4).map(([status, config]) => (
          <Card key={status} className={config.color.replace("text-", "").split(" ")[0]}>
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold">{competicoesPorStatus[status] || 0}</p>
              <p className="text-xs">{config.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Calendário */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Anterior
            </Button>
            <CardTitle className="text-lg capitalize">
              {format(currentMonth, "MMMM 'de' yyyy", { locale: ptBR })}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              Próximo
              <ChevronRight className="h-4 w-4 ml-1" />
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
                <div key={dia} className="text-center text-sm font-medium text-muted-foreground py-2 border-b">
                  {dia}
                </div>
              ))}
              
              {/* Dias vazios antes do primeiro dia do mês */}
              {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                <div key={`empty-${i}`} className="h-24" />
              ))}
              
              {daysInMonth.map((day) => {
                const dayCompeticoes = getCompeticoesForDay(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);
                
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`h-24 p-1 border rounded-md text-left transition-colors hover:bg-muted/50 relative ${
                      isSelected ? "border-primary border-2 bg-primary/5" : ""
                    } ${isTodayDate ? "ring-2 ring-primary/50" : ""}`}
                  >
                    <p className={`text-sm font-medium ${isTodayDate ? "text-primary font-bold" : ""}`}>
                      {format(day, "d")}
                    </p>
                    <div className="mt-1 space-y-0.5 overflow-hidden">
                      {dayCompeticoes.slice(0, 2).map((c) => (
                        <div
                          key={c.id}
                          className={`text-[10px] truncate px-1 rounded border ${STATUS_CONFIG[c.status]?.color || "bg-gray-100"}`}
                          title={`${c.federacao_sigla}: ${c.titulo}`}
                        >
                          <span className="font-semibold">{c.federacao_sigla}</span>: {c.titulo}
                        </div>
                      ))}
                      {dayCompeticoes.length > 2 && (
                        <p className="text-[10px] text-muted-foreground text-center">
                          +{dayCompeticoes.length - 2} mais
                        </p>
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
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Competições em {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {competicoesForSelectedDate.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">Nenhuma competição programada para este dia</p>
            ) : (
              <div className="space-y-4">
                {competicoesForSelectedDate.map((competicao) => (
                  <div key={competicao.id} className="border rounded-lg p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <Badge variant="outline" className="font-semibold">
                            {competicao.federacao_sigla}
                          </Badge>
                          <h4 className="font-semibold">{competicao.titulo}</h4>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <Badge className={STATUS_CONFIG[competicao.status]?.color}>
                            {STATUS_CONFIG[competicao.status]?.label || competicao.status}
                          </Badge>
                          <Badge className={TIPO_COLORS[competicao.tipo] || "bg-gray-100 text-gray-800"}>
                            {competicao.tipo}
                          </Badge>
                        </div>
                        
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p className="font-medium text-foreground">
                            {competicao.federacao_nome}
                          </p>
                          
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
                            <p className="mt-2 text-foreground">{competicao.descricao}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Lista de Próximos Eventos */}
      {!selectedDate && competicoes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Competições do Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {competicoes.slice(0, 10).map((competicao) => (
                <div
                  key={competicao.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => setSelectedDate(parseISO(competicao.data_inicio))}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[50px]">
                      <p className="text-lg font-bold text-primary">
                        {format(parseISO(competicao.data_inicio), "dd")}
                      </p>
                      <p className="text-xs text-muted-foreground uppercase">
                        {format(parseISO(competicao.data_inicio), "MMM", { locale: ptBR })}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">{competicao.titulo}</p>
                      <p className="text-sm text-muted-foreground">{competicao.federacao_nome}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={STATUS_CONFIG[competicao.status]?.color}>
                      {STATUS_CONFIG[competicao.status]?.label}
                    </Badge>
                  </div>
                </div>
              ))}
              {competicoes.length > 10 && (
                <p className="text-center text-sm text-muted-foreground">
                  E mais {competicoes.length - 10} competições...
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
