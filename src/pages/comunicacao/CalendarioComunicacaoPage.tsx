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
import type { LucideIcon } from "lucide-react";
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
import { EmptyState, KpiCard, PageHeader } from "@/components/design-system";

import { useCalendarioComunicacao, TipoEventoCalendario, EventoCalendario } from "@/hooks/comunicacao/useCalendarioComunicacao";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Cor por tipo: série categórica de gráficos (--chart-*), segue o tema do tenant.
// `cor` é o ponto/legenda; `fundo` é o fundo suave do ícone (o ícone fica em text-foreground).
// Tipos sem entrada (aniversário de instituição/representante) caem em `bg-muted`, como antes.
const COR_TIPO = {
  demanda: { cor: "bg-[hsl(var(--chart-1))]", fundo: "bg-[hsl(var(--chart-1)/0.15)]" },
  aniversario: { cor: "bg-[hsl(var(--chart-2))]", fundo: "bg-[hsl(var(--chart-2)/0.15)]" },
  evento_federacao: { cor: "bg-[hsl(var(--chart-3))]", fundo: "bg-[hsl(var(--chart-3)/0.15)]" },
  publicacao: { cor: "bg-[hsl(var(--chart-4))]", fundo: "bg-[hsl(var(--chart-4)/0.15)]" },
  banner: { cor: "bg-[hsl(var(--chart-5))]", fundo: "bg-[hsl(var(--chart-5)/0.15)]" },
} satisfies Partial<Record<TipoEventoCalendario, { cor: string; fundo: string }>>;

const TIPOS_EVENTO: { tipo: TipoEventoCalendario; label: string; icon: LucideIcon; cor: string }[] = [
  { tipo: "demanda", label: "Demandas", icon: ClipboardList, cor: COR_TIPO.demanda.cor },
  { tipo: "aniversario", label: "Aniversários", icon: Cake, cor: COR_TIPO.aniversario.cor },
  { tipo: "evento_federacao", label: "Eventos", icon: Trophy, cor: COR_TIPO.evento_federacao.cor },
  { tipo: "publicacao", label: "Publicações", icon: Newspaper, cor: COR_TIPO.publicacao.cor },
  { tipo: "banner", label: "Banners", icon: Image, cor: COR_TIPO.banner.cor },
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
          <PageHeader
            migalhas={[{ rotulo: "Comunicação", href: "/comunicacao" }, { rotulo: "Calendário" }]}
            titulo="Calendário de comunicação"
            descricao="Visão integrada de demandas, aniversários, eventos e publicações"
            acoes={
              <>
                {/* Navegação do mês */}
                <div className="flex items-center gap-2" role="group" aria-label="Mês exibido">
                  <Button variant="outline" size="icon" aria-label="Mês anterior" onClick={() => navegarMes(-1)}>
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </Button>

                  <Button
                    variant="outline"
                    onClick={irParaHoje}
                    className="min-w-[180px] capitalize"
                    aria-label={`${format(dataAtual, "MMMM yyyy", { locale: ptBR })}: ir para hoje`}
                  >
                    <CalendarIcon className="h-4 w-4 mr-2" aria-hidden="true" />
                    {format(dataAtual, "MMMM yyyy", { locale: ptBR })}
                  </Button>

                  <Button variant="outline" size="icon" aria-label="Próximo mês" onClick={() => navegarMes(1)}>
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>

                {/* Filtros */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="icon" aria-label="Filtrar por tipo de evento">
                      <Filter className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="end">
                    <div className="space-y-3">
                      <p className="font-medium text-body">Filtrar por tipo</p>
                      {TIPOS_EVENTO.map(({ tipo, label, icon: Icon, cor }) => (
                        <label
                          key={tipo}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Checkbox
                            checked={tiposFiltro.includes(tipo)}
                            onCheckedChange={() => toggleTipoFiltro(tipo)}
                          />
                          <div className={cn("w-3 h-3 rounded-full", cor)} aria-hidden="true" />
                          <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                          <span className="text-body">{label}</span>
                        </label>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Alternar visualização */}
                <div className="flex border rounded-lg" role="group" aria-label="Modo de visualização">
                  <Button
                    variant={visualizacao === "calendario" ? "default" : "ghost"}
                    size="icon"
                    className="rounded-r-none"
                    aria-label="Ver em calendário"
                    aria-pressed={visualizacao === "calendario"}
                    onClick={() => setVisualizacao("calendario")}
                  >
                    <Grid3X3 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant={visualizacao === "lista" ? "default" : "ghost"}
                    size="icon"
                    className="rounded-l-none"
                    aria-label="Ver em lista"
                    aria-pressed={visualizacao === "lista"}
                    onClick={() => setVisualizacao("lista")}
                  >
                    <List className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </>
            }
          />

          {/* Indicadores por tipo (clique liga/desliga o filtro do tipo) */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {TIPOS_EVENTO.map(({ tipo, label, icon: Icon, cor }) => {
              const valor =
                estatisticas[tipo === "evento_federacao" ? "eventosFederacao" : `${tipo}s` as keyof typeof estatisticas] || 0;
              const ativo = tiposFiltro.includes(tipo);
              return (
                // Botão cobrindo o cartão: evita <div> dentro de <button> e mantém o cartão inteiro clicável.
                <div
                  key={tipo}
                  className={cn("relative rounded-lg transition-all", ativo && "ring-2 ring-primary")}
                >
                  <KpiCard
                    rotulo={label}
                    valor={valor}
                    icone={Icon}
                    carregando={isLoading}
                    detalhe={
                      <span className="inline-flex items-center gap-1.5">
                        <span className={cn("h-2.5 w-2.5 rounded-full", cor)} aria-hidden="true" />
                        {ativo ? "Exibindo" : "Oculto"}
                      </span>
                    }
                    className="h-full"
                  />
                  <button
                    type="button"
                    aria-pressed={ativo}
                    aria-label={`Mostrar ${label.toLowerCase()} no calendário (${valor})`}
                    className="absolute inset-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => toggleTipoFiltro(tipo)}
                  />
                </div>
              );
            })}
          </div>

          {/* Conteúdo principal */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendário ou Lista */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-h3">
                  {visualizacao === "calendario" ? "Calendário mensal" : "Lista de eventos"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="py-20 text-center text-muted-foreground" role="status">
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
                          className="text-center text-caption font-medium text-muted-foreground py-2"
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
                            type="button"
                            onClick={() => setDiaSelecionado(dia)}
                            aria-pressed={!!selecionado}
                            aria-current={ehHoje ? "date" : undefined}
                            aria-label={`${format(dia, "d 'de' MMMM", { locale: ptBR })}${
                              ehHoje ? ", hoje" : ""
                            }: ${eventosNoDia.length === 0 ? "nenhum evento" : `${eventosNoDia.length} evento(s)`}`}
                            className={cn(
                              "aspect-square p-1 rounded-lg text-body relative transition-all",
                              "hover:bg-muted/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                              selecionado && "bg-primary text-primary-foreground",
                              ehHoje && !selecionado && "ring-2 ring-primary",
                              !isSameMonth(dia, dataAtual) && "text-muted-foreground/50"
                            )}
                          >
                            <span className="font-medium">{format(dia, "d")}</span>

                            {/* Indicadores de eventos */}
                            {temEventos && (
                              <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5" aria-hidden="true">
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
                        <EmptyState icone={CalendarIcon} titulo="Nenhum evento neste mês" />
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
                <CardTitle className="text-h3">
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
                    <EmptyState icone={CalendarIcon} titulo="Selecione um dia para ver os eventos" />
                  ) : eventosDoDiaSelecionado.length === 0 ? (
                    <EmptyState icone={CalendarIcon} titulo="Nenhum evento neste dia" />
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
                  <div key={tipo} className="flex items-center gap-2 text-body">
                    <div className={cn("w-3 h-3 rounded-full", cor)} aria-hidden="true" />
                    <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
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

  const corClasse = COR_TIPO[evento.tipo as keyof typeof COR_TIPO]?.fundo ?? "bg-muted";

  const baseClassName = cn(
    "flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors",
    evento.link && "cursor-pointer"
  );

  const content = (
    <>
      <div className={cn("p-2 rounded-lg text-foreground shrink-0", corClasse)}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("font-medium truncate", compact ? "text-body" : "")}>
            {evento.titulo}
          </p>
          {evento.link && (
            <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" aria-hidden="true" />
          )}
        </div>

        {evento.descricao && (
          <p className="text-caption text-muted-foreground truncate">
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
