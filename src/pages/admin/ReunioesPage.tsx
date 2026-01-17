import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Video,
  ChevronRight,
  FileText,
  Filter
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { NovaReuniaoDialog } from "@/components/reunioes/NovaReuniaoDialog";
import { ReuniaoDetailSheet } from "@/components/reunioes/ReuniaoDetailSheet";
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
  tipo_reuniao: "ordinaria" | "extraordinaria" | "emergencial" | "informativa";
  status: StatusReuniao;
  participantes_count?: number;
}

const statusConfig: Record<StatusReuniao, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  agendada: { label: "Agendada", variant: "secondary" },
  confirmada: { label: "Confirmada", variant: "secondary" },
  em_andamento: { label: "Em andamento", variant: "default" },
  realizada: { label: "Realizada", variant: "outline" },
  cancelada: { label: "Cancelada", variant: "destructive" },
  adiada: { label: "Adiada", variant: "outline" },
};

const tipoConfig = {
  ordinaria: { label: "Ordinária", icon: Calendar },
  extraordinaria: { label: "Extraordinária", icon: Clock },
  emergencial: { label: "Emergencial", icon: Users },
  informativa: { label: "Informativa", icon: FileText },
};

export default function ReunioesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedReuniao, setSelectedReuniao] = useState<Reuniao | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: reunioes, isLoading, refetch } = useQuery({
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

  const filteredReunioes = reunioes?.filter((r) =>
    r.titulo.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <AdminLayout 
      title="Reuniões" 
      description="Gerencie as reuniões e convocações"
    >
      {/* Mobile-first sticky header com busca */}
      <div className="sticky top-0 z-10 -mx-4 -mt-4 lg:-mx-6 lg:-mt-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4 py-3 lg:px-6 lg:py-4 mb-4 lg:mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar reuniões..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="shrink-0">
              <Filter className="h-4 w-4" />
            </Button>
            <Button onClick={() => setDialogOpen(true)} className="flex-1 sm:flex-none">
              <Plus className="h-4 w-4 mr-2" />
              <span className="sm:inline">Nova Reunião</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de reuniões - Cards mobile-friendly */}
      <div className="space-y-6">
        {/* Próximas reuniões */}
        <section>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Próximas Reuniões
          </h2>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          ) : proximasReunioes?.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">Nenhuma reunião agendada</p>
                <Button 
                  variant="link" 
                  className="mt-2"
                  onClick={() => setDialogOpen(true)}
                >
                  Agendar primeira reunião
                </Button>
              </CardContent>
            </Card>
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
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2 text-muted-foreground">
              <Clock className="h-5 w-5" />
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
    </AdminLayout>
  );
}

interface ReuniaoCardProps {
  reuniao: Reuniao;
  onClick: () => void;
  muted?: boolean;
}

function ReuniaoCard({ reuniao, onClick, muted }: ReuniaoCardProps) {
  const TipoIcon = tipoConfig[reuniao.tipo_reuniao]?.icon || Calendar;
  const dataReuniao = new Date(reuniao.data_reuniao + "T00:00:00");
  
  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md active:scale-[0.99] ${
        muted ? "opacity-70" : ""
      }`}
      onClick={onClick}
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
              <Badge variant={statusConfig[reuniao.status]?.variant || "secondary"} className="shrink-0">
                {statusConfig[reuniao.status]?.label || reuniao.status}
              </Badge>
            </div>
            
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {reuniao.hora_inicio}
              </span>
              <span className="flex items-center gap-1">
                <TipoIcon className="h-3.5 w-3.5" />
                {tipoConfig[reuniao.tipo_reuniao]?.label || reuniao.tipo_reuniao}
              </span>
              {reuniao.participantes_count && reuniao.participantes_count > 0 && (
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {reuniao.participantes_count}
                </span>
              )}
            </div>
            
            {reuniao.local && (
              <p className="mt-1 text-sm text-muted-foreground truncate flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {reuniao.local}
              </p>
            )}
          </div>
          
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 self-center" />
        </div>
      </CardContent>
    </Card>
  );
}
