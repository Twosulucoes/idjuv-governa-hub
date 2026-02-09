/**
 * CALENDÁRIO INTEGRADO - MÓDULO COMUNICAÇÃO
 * Consolida demandas, aniversariantes, eventos e publicações em uma visão unificada
 */

import { useState, useMemo } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Cake,
  Trophy,
  Newspaper,
  Image,
  Filter,
  List,
  Grid3X3,
  ExternalLink,
} from "lucide-react";
import { Link } from "react-router-dom";

import { ModuleLayout } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { useCalendarioComunicacao, TipoEventoCalendario, EventoCalendario } from "@/hooks/comunicacao/useCalendarioComunicacao";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const TIPOS_EVENTO: { tipo: TipoEventoCalendario; label: string; icon: React.ElementType; cor: string }[] = [
  { tipo: "demanda", label: "Demandas", icon: ClipboardList, cor: "bg-primary" },
  { tipo: "aniversario", label: "Aniversários", icon: Cake, cor: "bg-pink-500" },
  { tipo: "evento_federacao", label: "Eventos", icon: Trophy, cor: "bg-green-500" },
  { tipo: "publicacao", label: "Publicações", icon: Newspaper, cor: "bg-blue-500" },
  { tipo: "banner", label: "Banners", icon: Image, cor: "bg-orange-500" },
];

export default function CalendarioComunicacaoPage() {
  const [dataAtual, setDataAtual] = useState(new Date());
  const [tiposFiltro, setTiposFiltro] = useState<TipoEventoCalendario[]>(["demanda", "aniversario", "evento_federacao", "publicacao", "banner"]);
  const [visualizacao, setVisualizacao] = useState<"calendario" | "lista">("calendario");
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);

  const mes = dataAtual.getMonth();
  const ano = dataAtual.getFullYear();

  const { eventos, eventosPorDia, estatisticas, isLoading, cores } = useCalendarioComunicacao({ mes, ano });

  // Filtrar eventos por tipo selecionado
  const eventosFiltrados = useMemo(() => {
    return eventos.filter((e) => tiposFiltro.includes(e.tipo));
  }, [eventos, tiposFiltro]);

  // Dias do mês para o calendário
  const diasDoMes = useMemo(() => {
    const inicio = startOfMonth(dataAtual);
    const fim = endOfMonth(dataAtual);
    const dias = eachDayOfInterval({ start: inicio, end: fim });

    // Preencher dias vazios no início (para alinhar com dia da semana)
    const primeiroDia = getDay(inicio);
    const diasVaziosInicio = Array(primeiroDia).fill(null);

    return [...diasVaziosInicio, ...dias];
  }, [dataAtual]);

  const navegarMes = (direcao: number) => {
    setDataAtual((prev) => (direcao > 0 ? addMonths(prev, 1) : subMonths(prev, 1)));
    setDiaSelecionado(null);
  };

  const irParaHoje = () => {
    setDataAtual(new Date());
    setDiaSelecionado(new Date());
  };

  const toggleTipoFiltro = (tipo: TipoEventoCalendario) => {
    setTiposFiltro((prev) =>
      prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo]
    );
  };

  const getEventosDoDia = (dia: Date | null) => {
    if (!dia) return [];
    const diaStr = format(dia, "yyyy-MM-dd");
    return (eventosPorDia[diaStr] || []).filter((e) => tiposFiltro.includes(e.tipo));
  };

  const getIconePorTipo = (tipo: TipoEventoCalendario) => {
    const config = TIPOS_EVENTO.find((t) => t.tipo === tipo);
    return config?.icon || CalendarIcon;
  };

  const getCorPorTipo = (tipo: TipoEventoCalendario) => {
    const config = TIPOS_EVENTO.find((t) => t.tipo === tipo);
    return config?.cor || "bg-muted";
  };

  const eventosDoDiaSelecionado = diaSelecionado ? getEventosDoDia(diaSelecionado) : [];

  return (
    <ProtectedRoute>
      <ModuleLayout module="comunicacao">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <CalendarIcon className="h-7 w-7 text-primary" />
                Calendário de Comunicação
              </h1>
              <p className="text-muted-foreground mt-1">
                Visão integrada de demandas, aniversários, eventos e publicações
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Navegação do mês */}
              <Button variant="outline" size="icon" onClick={() => navegarMes(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Button variant="outline" onClick={irParaHoje} className="min-w-[180px]">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {format(dataAtual, "MMMM yyyy", { locale: ptBR })}
              </Button>

              <Button variant="outline" size="icon" onClick={() => navegarMes(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>

              {/* Filtros */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="end">
                  <div className="space-y-3">
                    <p className="font-medium text-sm">Filtrar por tipo</p>
                    {TIPOS_EVENTO.map(({ tipo, label, icon: Icon, cor }) => (
                      <label
                        key={tipo}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <Checkbox
                          checked={tiposFiltro.includes(tipo)}
                          onCheckedChange={() => toggleTipoFiltro(tipo)}
                        />
                        <div className={cn("w-3 h-3 rounded-full", cor)} />
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>

              {/* Alternar visualização */}
              <div className="flex border rounded-lg">
                <Button
                  variant={visualizacao === "calendario" ? "default" : "ghost"}
                  size="icon"
                  className="rounded-r-none"
                  onClick={() => setVisualizacao("calendario")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={visualizacao === "lista" ? "default" : "ghost"}
                  size="icon"
                  className="rounded-l-none"
                  onClick={() => setVisualizacao("lista")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Cards de estatísticas */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {TIPOS_EVENTO.map(({ tipo, label, icon: Icon, cor }) => (
              <Card
                key={tipo}
                className={cn(
                  "cursor-pointer transition-all",
                  tiposFiltro.includes(tipo) ? "ring-2 ring-primary" : "opacity-60"
                )}
                onClick={() => toggleTipoFiltro(tipo)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", cor, "text-white")}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {estatisticas[tipo === "evento_federacao" ? "eventosFederacao" : `${tipo}s` as keyof typeof estatisticas] || 0}
                      </p>
                      <p className="text-xs text-muted-foreground">{label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Conteúdo principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendário ou Lista */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {visualizacao === "calendario" ? "Calendário Mensal" : "Lista de Eventos"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-20 text-center text-muted-foreground">
                    Carregando eventos...
                  </div>
                ) : visualizacao === "calendario" ? (
                  /* Visualização Calendário */
                  <div>
                    {/* Cabeçalho dias da semana */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {DIAS_SEMANA.map((dia) => (
                        <div
                          key={dia}
                          className="text-center text-xs font-medium text-muted-foreground py-2"
                        >
                          {dia}
                        </div>
                      ))}
                    </div>

                    {/* Grid de dias */}
                    <div className="grid grid-cols-7 gap-1">
                      {diasDoMes.map((dia, index) => {
                        if (!dia) {
                          return <div key={`empty-${index}`} className="aspect-square" />;
                        }

                        const eventosNoDia = getEventosDoDia(dia);
                        const temEventos = eventosNoDia.length > 0;
                        const selecionado = diaSelecionado && isSameDay(dia, diaSelecionado);
                        const ehHoje = isToday(dia);

                        return (
                          <button
                            key={dia.toISOString()}
                            onClick={() => setDiaSelecionado(dia)}
                            className={cn(
                              "aspect-square p-1 rounded-lg text-sm relative transition-all",
                              "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary",
                              selecionado && "bg-primary text-primary-foreground",
                              ehHoje && !selecionado && "ring-2 ring-primary",
                              !isSameMonth(dia, dataAtual) && "text-muted-foreground/50"
                            )}
                          >
                            <span className="font-medium">{format(dia, "d")}</span>

                            {/* Indicadores de eventos */}
                            {temEventos && (
                              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                                {eventosNoDia.slice(0, 3).map((evento, i) => (
                                  <div
                                    key={i}
                                    className={cn(
                                      "w-1.5 h-1.5 rounded-full",
                                      getCorPorTipo(evento.tipo)
                                    )}
                                  />
                                ))}
                                {eventosNoDia.length > 3 && (
                                  <span className="text-[8px] text-muted-foreground">
                                    +{eventosNoDia.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* Visualização Lista */
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {eventosFiltrados.length === 0 ? (
                        <div className="text-center py-10 text-muted-foreground">
                          Nenhum evento neste mês
                        </div>
                      ) : (
                        eventosFiltrados.map((evento) => (
                          <EventoCard key={evento.id} evento={evento} />
                        ))
                      )}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {/* Painel lateral - Eventos do dia */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {diaSelecionado
                    ? format(diaSelecionado, "d 'de' MMMM", { locale: ptBR })
                    : "Selecione um dia"}
                </CardTitle>
                <CardDescription>
                  {diaSelecionado
                    ? `${eventosDoDiaSelecionado.length} evento(s)`
                    : "Clique em um dia do calendário"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  {!diaSelecionado ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>Selecione um dia para ver os eventos</p>
                    </div>
                  ) : eventosDoDiaSelecionado.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                      <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-30" />
                      <p>Nenhum evento neste dia</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {eventosDoDiaSelecionado.map((evento) => (
                        <EventoCard key={evento.id} evento={evento} compact />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Legenda */}
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-wrap items-center justify-center gap-6">
                {TIPOS_EVENTO.map(({ tipo, label, icon: Icon, cor }) => (
                  <div key={tipo} className="flex items-center gap-2 text-sm">
                    <div className={cn("w-3 h-3 rounded-full", cor)} />
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </ModuleLayout>
    </ProtectedRoute>
  );
}

// Componente de card de evento
function EventoCard({ evento, compact = false }: { evento: EventoCalendario; compact?: boolean }) {
  const Icon = (() => {
    switch (evento.tipo) {
      case "demanda": return ClipboardList;
      case "aniversario": return Cake;
      case "evento_federacao": return Trophy;
      case "publicacao": return Newspaper;
      case "banner": return Image;
      default: return CalendarIcon;
    }
  })();

  const corClasse = (() => {
    switch (evento.tipo) {
      case "demanda": return "bg-primary";
      case "aniversario": return "bg-pink-500";
      case "evento_federacao": return "bg-green-500";
      case "publicacao": return "bg-blue-500";
      case "banner": return "bg-orange-500";
      default: return "bg-muted";
    }
  })();

  const baseClassName = cn(
    "flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors",
    evento.link && "cursor-pointer"
  );

  const content = (
    <>
      <div className={cn("p-2 rounded-lg text-white shrink-0", corClasse)}>
        <Icon className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("font-medium truncate", compact ? "text-sm" : "")}>
            {evento.titulo}
          </p>
          {evento.link && (
            <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
        </div>

        {evento.descricao && (
          <p className="text-xs text-muted-foreground truncate">
            {evento.descricao}
          </p>
        )}

        {!compact && (
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {format(evento.data, "dd/MM")}
            </Badge>
            {evento.metadata?.status && (
              <Badge variant="secondary" className="text-xs">
                {evento.metadata.status}
              </Badge>
            )}
          </div>
        )}
      </div>
    </>
  );

  if (evento.link) {
    return (
      <Link to={evento.link} className={baseClassName}>
        {content}
      </Link>
    );
  }

  return (
    <div className={baseClassName}>
      {content}
    </div>
  );
}
