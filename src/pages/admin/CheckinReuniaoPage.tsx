import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ModuleLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Search,
  UserCheck,
  UserX,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Loader2,
  Calendar,
  MapPin,
  RefreshCw,
  AlertCircle,
  Undo2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, KpiCard, PageHeader, StatusBadge, type TomStatus } from "@/components/design-system";

type StatusParticipante = "pendente" | "confirmado" | "recusado" | "ausente" | "presente";

const STATUS_PARTICIPANTE: Partial<Record<StatusParticipante, { label: string; tom: TomStatus }>> = {
  presente: { label: "Presente", tom: "sucesso" },
  ausente: { label: "Ausente", tom: "pendente" },
  confirmado: { label: "Confirmado", tom: "andamento" },
};

const MIGALHAS_REUNIOES = [
  { rotulo: "Administração", href: "/admin" },
  { rotulo: "Reuniões", href: "/admin/reunioes" },
];

interface Participante {
  id: string;
  status: StatusParticipante;
  nome_externo?: string | null;
  email_externo?: string | null;
  telefone_externo?: string | null;
  cargo_funcao?: string | null;
  instituicao_externa?: string | null;
  data_assinatura?: string | null;
  assinatura_presenca?: boolean | null;
  justificativa_ausencia?: string | null;
  servidor?: {
    id: string;
    nome_completo: string;
    foto_url?: string | null;
  } | null;
}

export default function CheckinReuniaoPage() {
  const { reuniaoId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [justificativaDialogOpen, setJustificativaDialogOpen] = useState(false);
  const [justificativa, setJustificativa] = useState("");
  const [participanteAusente, setParticipanteAusente] = useState<string | null>(null);

  // Buscar reunião
  const { data: reuniao, isLoading: loadingReuniao } = useQuery({
    queryKey: ["reuniao-checkin", reuniaoId],
    queryFn: async () => {
      if (!reuniaoId) return null;
      const { data, error } = await supabase
        .from("reunioes")
        .select("*")
        .eq("id", reuniaoId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!reuniaoId,
  });

  // Buscar participantes
  const { data: participantes = [], isLoading: loadingParticipantes, refetch } = useQuery({
    queryKey: ["participantes-checkin", reuniaoId],
    queryFn: async () => {
      if (!reuniaoId) return [];
      const { data, error } = await supabase
        .from("participantes_reuniao")
        .select(`
          *,
          servidor:servidor_id(id, nome_completo, foto_url)
        `)
        .eq("reuniao_id", reuniaoId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as Participante[];
    },
    enabled: !!reuniaoId,
    refetchInterval: 10000, // Atualiza a cada 10 segundos
  });

  // Mutation para atualizar status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, justificativa }: { id: string; status: StatusParticipante; justificativa?: string }) => {
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === "presente") {
        updateData.assinatura_presenca = true;
        updateData.data_assinatura = new Date().toISOString();
      }
      if (status === "ausente" && justificativa) {
        updateData.justificativa_ausencia = justificativa;
      }

      const { error } = await supabase
        .from("participantes_reuniao")
        .update(updateData)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["participantes-checkin", reuniaoId] });
      let action = "Check-in realizado";
      if (variables.status === "ausente") action = "Marcado como ausente";
      else if (variables.status === "confirmado") action = "Check-in desfeito";
      toast.success(action);
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    },
  });

  // Filtrar e ordenar participantes alfabeticamente
  const filteredParticipantes = useMemo(() => {
    let lista = participantes;
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      lista = participantes.filter((p) => {
        const nome = p.nome_externo || p.servidor?.nome_completo || "";
        const instituicao = p.instituicao_externa || "";
        return nome.toLowerCase().includes(term) || instituicao.toLowerCase().includes(term);
      });
    }
    
    // Ordenar alfabeticamente pelo nome
    return [...lista].sort((a, b) => {
      const nomeA = (a.nome_externo || a.servidor?.nome_completo || "").toLowerCase();
      const nomeB = (b.nome_externo || b.servidor?.nome_completo || "").toLowerCase();
      return nomeA.localeCompare(nomeB, 'pt-BR', { sensitivity: 'base' });
    });
  }, [participantes, searchTerm]);

  // Estatísticas
  const stats = useMemo(() => ({
    total: participantes.length,
    presentes: participantes.filter(p => p.status === "presente").length,
    ausentes: participantes.filter(p => p.status === "ausente").length,
    pendentes: participantes.filter(p => p.status !== "presente" && p.status !== "ausente").length,
  }), [participantes]);

  const getInitials = (name?: string | null) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  };

  const getNome = (p: Participante) => p.nome_externo || p.servidor?.nome_completo || "Sem nome";

  const handleCheckin = (participanteId: string) => {
    updateStatusMutation.mutate({ id: participanteId, status: "presente" });
  };

  const handleAusencia = (participanteId: string) => {
    setParticipanteAusente(participanteId);
    setJustificativaDialogOpen(true);
  };

  const handleDesfazerCheckin = (participanteId: string) => {
    updateStatusMutation.mutate({ id: participanteId, status: "confirmado" });
  };

  const confirmarAusencia = () => {
    if (participanteAusente) {
      updateStatusMutation.mutate({ 
        id: participanteAusente, 
        status: "ausente", 
        justificativa 
      });
    }
    setJustificativaDialogOpen(false);
    setJustificativa("");
    setParticipanteAusente(null);
  };

  const getStatusBadge = (status: StatusParticipante) => {
    const config = STATUS_PARTICIPANTE[status] ?? { label: "Aguardando", tom: "neutro" as TomStatus };
    return <StatusBadge tom={config.tom}>{config.label}</StatusBadge>;
  };

  if (loadingReuniao) {
    return (
      <ModuleLayout module="admin">
        <div className="flex items-center justify-center min-h-[60vh]" role="status" aria-label="Carregando reunião">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      </ModuleLayout>
    );
  }

  if (!reuniao) {
    return (
      <ModuleLayout module="admin">
        <div className="space-y-6">
          <PageHeader
            migalhas={[...MIGALHAS_REUNIOES, { rotulo: "Check-in" }]}
            titulo="Reunião não encontrada"
          />
          <EmptyState
            icone={AlertCircle}
            titulo="Reunião não encontrada"
            descricao="A reunião solicitada não existe ou foi removida."
            acao={
              <Button variant="outline" asChild>
                <Link to="/admin/reunioes">
                  <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                  Voltar para reuniões
                </Link>
              </Button>
            }
          />
        </div>
      </ModuleLayout>
    );
  }

  const dataReuniao = new Date(reuniao.data_reuniao + "T00:00:00");

  return (
    <ModuleLayout module="admin">
      <div className="max-w-4xl mx-auto space-y-6">
        <PageHeader
          migalhas={[...MIGALHAS_REUNIOES, { rotulo: "Check-in" }]}
          titulo="Check-in de participantes"
          descricao={reuniao.titulo}
          acoes={
            <>
              <Button variant="outline" onClick={() => navigate("/admin/reunioes")}>
                <ArrowLeft className="h-4 w-4 mr-1" aria-hidden="true" />
                Voltar
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => refetch()}
                title="Atualizar lista"
                aria-label="Atualizar lista de participantes"
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
              </Button>
            </>
          }
        />

        {/* Info da Reunião */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {format(dataReuniao, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {reuniao.hora_inicio}{reuniao.hora_fim ? ` - ${reuniao.hora_fim}` : ""}
              </span>
              {reuniao.local && (
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  {reuniao.local}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard rotulo="Total" valor={stats.total} icone={Users} carregando={loadingParticipantes} />
          <KpiCard rotulo="Presentes" valor={stats.presentes} icone={CheckCircle} carregando={loadingParticipantes} />
          <KpiCard rotulo="Ausentes" valor={stats.ausentes} icone={XCircle} carregando={loadingParticipantes} />
          <KpiCard rotulo="Aguardando" valor={stats.pendentes} icone={Clock} carregando={loadingParticipantes} />
        </div>

        {/* Barra de progresso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground" id="progresso-checkin">Progresso do check-in</span>
            <span className="font-medium">
              {stats.total > 0 
                ? Math.round(((stats.presentes + stats.ausentes) / stats.total) * 100) 
                : 0}%
            </span>
          </div>
          <div
            className="h-2 bg-muted rounded-full overflow-hidden"
            role="progressbar"
            aria-labelledby="progresso-checkin"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={stats.total > 0 ? Math.round(((stats.presentes + stats.ausentes) / stats.total) * 100) : 0}
          >
            <div className="h-full flex">
              <div 
                className="bg-success transition-all duration-500"
                style={{ width: `${stats.total > 0 ? (stats.presentes / stats.total) * 100 : 0}%` }}
              />
              <div 
                className="bg-warning transition-all duration-500"
                style={{ width: `${stats.total > 0 ? (stats.ausentes / stats.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Buscar participante..."
            aria-label="Buscar participante por nome ou instituição"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lista de participantes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Users className="h-4 w-4" aria-hidden="true" />
              Participantes
              <Badge variant="secondary" className="ml-2">{filteredParticipantes.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loadingParticipantes ? (
              <div className="divide-y">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-40 mb-2" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-9 w-24" />
                  </div>
                ))}
              </div>
            ) : filteredParticipantes.length === 0 ? (
              <EmptyState
                icone={Users}
                titulo={searchTerm ? "Nenhum participante encontrado" : "Nenhum participante na reunião"}
                className="border-0"
              />
            ) : (
              <div className="divide-y">
                {filteredParticipantes.map((p) => {
                  const nome = getNome(p);
                  const isPendente = p.status !== "presente" && p.status !== "ausente";
                  
                  return (
                    <div 
                      key={p.id} 
                      className={`p-4 flex items-center gap-4 transition-colors ${
                        p.status === "presente" ? "bg-success/5" : 
                        p.status === "ausente" ? "bg-warning/5" : ""
                      }`}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={p.servidor?.foto_url || undefined} alt="" />
                        <AvatarFallback className={`text-sm ${
                          p.status === "presente" ? "bg-success/15 text-success" :
                          p.status === "ausente" ? "bg-warning/15 text-warning" :
                          "bg-primary/10"
                        }`}>
                          {getInitials(nome)}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium">{nome}</p>
                          {!p.servidor && (
                            <Badge variant="outline" className="text-xs">Externo</Badge>
                          )}
                        </div>
                        {(p.cargo_funcao || p.instituicao_externa) && (
                          <p className="text-sm text-muted-foreground truncate">
                            {[p.cargo_funcao, p.instituicao_externa].filter(Boolean).join(" • ")}
                          </p>
                        )}
                        {p.data_assinatura && p.status === "presente" && (
                          <p className="text-xs text-success mt-0.5">
                            Check-in: {format(new Date(p.data_assinatura), "HH:mm", { locale: ptBR })}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {getStatusBadge(p.status)}
                        
                        {isPendente ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => handleCheckin(p.id)}
                              disabled={updateStatusMutation.isPending}
                              className="bg-success text-success-foreground hover:bg-success/90"
                              aria-label={`Marcar ${nome} como presente`}
                            >
                              <UserCheck className="h-4 w-4 mr-1" aria-hidden="true" />
                              Presente
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAusencia(p.id)}
                              disabled={updateStatusMutation.isPending}
                              aria-label={`Marcar ${nome} como ausente`}
                              title="Marcar como ausente"
                            >
                              <UserX className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDesfazerCheckin(p.id)}
                            disabled={updateStatusMutation.isPending}
                            className="text-muted-foreground hover:text-foreground"
                            title="Desfazer check-in"
                            aria-label={`Desfazer check-in de ${nome}`}
                          >
                            <Undo2 className="h-4 w-4 mr-1" aria-hidden="true" />
                            Desfazer
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Justificativa */}
      <AlertDialog open={justificativaDialogOpen} onOpenChange={setJustificativaDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Registrar ausência</AlertDialogTitle>
            <AlertDialogDescription>
              Informe a justificativa para a ausência do participante (opcional).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Justificativa..."
            aria-label="Justificativa da ausência"
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            rows={3}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarAusencia}>
              Confirmar ausência
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModuleLayout>
  );
}
