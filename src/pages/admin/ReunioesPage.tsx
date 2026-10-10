import { useState } from "react";
import { ModuleLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, PageHeader, StatusBadge, type TomStatus } from "@/components/design-system";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  ChevronRight,
  FileText,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NovaReuniaoDialog } from "@/components/reunioes/NovaReuniaoDialog";
import { ReuniaoDetailSheet } from "@/components/reunioes/ReuniaoDetailSheet";
import { FiltrosReuniaoDialog, filtrosIniciais, type FiltrosReuniao } from "@/components/reunioes/FiltrosReuniaoDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

type StatusReuniao = "agendada" | "em_andamento" | "realizada" | "cancelada" | "adiada" | "confirmada";

interface Reuniao {
  id: string;
  titulo: string;
  data_reuniao: string;
  hora_inicio: string;
  hora_fim: string | null;
  local: string | null;
  tipo: "ordinaria" | "extraordinaria" | "audiencia" | "sessao_solene" | "reuniao_trabalho";
  status: StatusReuniao;
  observacoes: string | null;
  participantes_count?: number;
}

const statusConfig: Record<StatusReuniao, { label: string; tom: TomStatus }> = {
  agendada: { label: "Agendada", tom: "pendente" },
  confirmada: { label: "Confirmada", tom: "sucesso" },
  em_andamento: { label: "Em andamento", tom: "andamento" },
  realizada: { label: "Realizada", tom: "neutro" },
  cancelada: { label: "Cancelada", tom: "erro" },
  adiada: { label: "Adiada", tom: "pendente" },
};

const tipoConfig = {
  ordinaria: { label: "Ordinária", icon: Calendar },
  extraordinaria: { label: "Extraordinária", icon: Clock },
  audiencia: { label: "Audiência", icon: Users },
  sessao_solene: { label: "Sessão solene", icon: FileText },
  reuniao_trabalho: { label: "Reunião de trabalho", icon: FileText },
};

export default function ReunioesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filtrosOpen, setFiltrosOpen] = useState(false);
  const [filtros, setFiltros] = useState<FiltrosReuniao>(filtrosIniciais);
  const [selectedReuniao, setSelectedReuniao] = useState<Reuniao | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: reunioes, isLoading, isError, refetch } = useQuery({
    queryKey: ["reunioes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reunioes")
        .select(`
          *,
          participantes_reuniao(count)
        `)
        .order("data_reuniao", { ascending: true });

      if (error) throw error;
      
      return (data || []).map((r: any) => ({
        ...r,
        participantes_count: r.participantes_reuniao?.[0]?.count || 0,
      })) as Reuniao[];
    },
  });

  const filteredReunioes = reunioes?.filter((r) => {
    // Filtro de busca
    const matchSearch = r.titulo.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtros avançados
    const matchDataInicio = !filtros.dataInicio || r.data_reuniao >= filtros.dataInicio;
    const matchDataFim = !filtros.dataFim || r.data_reuniao <= filtros.dataFim;
    const matchStatus = !filtros.status || r.status === filtros.status;
    const matchTipo = !filtros.tipo || r.tipo === filtros.tipo;
    
    return matchSearch && matchDataInicio && matchDataFim && matchStatus && matchTipo;
  });

  const temFiltrosAtivos = filtros.dataInicio || filtros.dataFim || filtros.status || filtros.tipo;

  const handleReuniaoClick = (reuniao: Reuniao) => {
    setSelectedReuniao(reuniao);
    setDetailOpen(true);
  };

  const proximasReunioes = filteredReunioes?.filter(
    (r) => r.status === "agendada" || r.status === "em_andamento" || r.status === "confirmada"
  );
  const reunioesPassadas = filteredReunioes?.filter(
    (r) => r.status === "realizada" || r.status === "cancelada" || r.status === "adiada"
  );

  return (
    <ModuleLayout module="admin">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Administração", href: "/admin" }, { rotulo: "Reuniões" }]}
          titulo="Reuniões"
          descricao="Agenda de reuniões, convites e controle de presença"
          acoes={
            <>
              <Button
                variant="outline"
                onClick={() => setFiltrosOpen(true)}
              >
                <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
                Filtros
                {temFiltrosAtivos && <StatusBadge tom="andamento" icone={false} className="ml-2">Ativos</StatusBadge>}
              </Button>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                Nova reunião
              </Button>
            </>
          }
        />

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Buscar reuniões..."
            aria-label="Buscar reuniões por título"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Próximas reuniões */}
        <section>
          <h2 className="text-h3 mb-3 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" aria-hidden="true" />
            Próximas reuniões
          </h2>
          
          {isLoading ? (
            <div className="space-y-3" role="status" aria-label="Carregando reuniões">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : isError ? (
            <EmptyState
              titulo="Não foi possível carregar as reuniões"
              descricao="Verifique sua conexão e tente novamente."
              acao={<Button variant="outline" onClick={() => refetch()}>Tentar novamente</Button>}
            />
          ) : proximasReunioes?.length === 0 ? (
            <EmptyState
              icone={Calendar}
              titulo="Nenhuma reunião agendada"
              acao={<Button variant="outline" onClick={() => setDialogOpen(true)}>Agendar primeira reunião</Button>}
            />
          ) : (
            <div className="space-y-3">
              {proximasReunioes?.map((reuniao) => (
                <ReuniaoCard
                  key={reuniao.id}
                  reuniao={reuniao}
                  onClick={() => handleReuniaoClick(reuniao)}
                />
              ))}
            </div>
          )}
        </section>

        {/* Reuniões passadas */}
        {reunioesPassadas && reunioesPassadas.length > 0 && (
          <section>
            <h2 className="text-h3 mb-3 flex items-center gap-2 text-muted-foreground">
              <Clock className="h-5 w-5" aria-hidden="true" />
              Histórico
            </h2>
            <div className="space-y-3">
              {reunioesPassadas.map((reuniao) => (
                <ReuniaoCard
                  key={reuniao.id}
                  reuniao={reuniao}
                  onClick={() => handleReuniaoClick(reuniao)}
                  muted
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Dialogs */}
      <NovaReuniaoDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen}
        onSuccess={() => {
          refetch();
          setDialogOpen(false);
        }}
      />
      
      <ReuniaoDetailSheet
        open={detailOpen}
        onOpenChange={setDetailOpen}
        reuniaoId={selectedReuniao?.id}
        onUpdate={refetch}
      />

      <FiltrosReuniaoDialog
        open={filtrosOpen}
        onOpenChange={setFiltrosOpen}
        filtros={filtros}
        onAplicar={setFiltros}
        onLimpar={() => setFiltros(filtrosIniciais)}
      />
    </ModuleLayout>
  );
}

interface ReuniaoCardProps {
  reuniao: Reuniao;
  onClick: () => void;
  muted?: boolean;
}

function ReuniaoCard({ reuniao, onClick, muted }: ReuniaoCardProps) {
  const TipoIcon = tipoConfig[reuniao.tipo]?.icon || Calendar;
  // Adiciona T12:00:00 para evitar problemas de fuso horário
  const dataReuniao = new Date(reuniao.data_reuniao + "T12:00:00");
  const status = statusConfig[reuniao.status];
  
  return (
    <Card 
      role="button"
      tabIndex={0}
      className={`cursor-pointer transition-all hover:shadow-md active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        muted ? "opacity-70" : ""
      }`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Data destacada - mobile friendly */}
          <div className="flex flex-col items-center justify-center min-w-[50px] bg-primary/10 rounded-lg p-2 text-center">
            <span className="text-xs font-medium text-primary uppercase">
              {format(dataReuniao, "MMM", { locale: ptBR })}
            </span>
            <span className="text-2xl font-bold text-primary">
              {format(dataReuniao, "dd")}
            </span>
          </div>
          
          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium truncate">{reuniao.titulo}</h3>
              <StatusBadge tom={status?.tom ?? "neutro"} className="shrink-0">
                {status?.label || reuniao.status}
              </StatusBadge>
            </div>
            
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                {reuniao.hora_inicio}
              </span>
              <span className="flex items-center gap-1">
                <TipoIcon className="h-3.5 w-3.5" aria-hidden="true" />
                {tipoConfig[reuniao.tipo]?.label || reuniao.tipo}
              </span>
              {reuniao.participantes_count && reuniao.participantes_count > 0 && (
                <span className="flex items-center gap-1" title="Participantes">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" />
                  <span className="sr-only">Participantes:</span>
                  {reuniao.participantes_count}
                </span>
              )}
            </div>
            
            {reuniao.local && (
              <p className="mt-1 text-sm text-muted-foreground truncate flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {reuniao.local}
              </p>
            )}
          </div>
          
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 self-center" aria-hidden="true" />
        </div>
      </CardContent>
    </Card>
  );
}
