import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
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
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type StatusParticipante = "pendente" | "confirmado" | "recusado" | "ausente" | "presente";

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
      const action = variables.status === "presente" ? "Check-in realizado" : "Marcado como ausente";
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
    switch (status) {
      case "presente":
        return <Badge className="bg-emerald-100 text-emerald-700 border-0"><CheckCircle className="h-3 w-3 mr-1" />Presente</Badge>;
      case "ausente":
        return <Badge className="bg-orange-100 text-orange-700 border-0"><XCircle className="h-3 w-3 mr-1" />Ausente</Badge>;
      case "confirmado":
        return <Badge className="bg-blue-100 text-blue-700 border-0"><Clock className="h-3 w-3 mr-1" />Confirmado</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Aguardando</Badge>;
    }
  };

  if (loadingReuniao) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!reuniao) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Reunião não encontrada</h2>
          <p className="text-muted-foreground mb-4">A reunião solicitada não existe ou foi removida.</p>
          <Link to="/admin/reunioes">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Reuniões
            </Button>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const dataReuniao = new Date(reuniao.data_reuniao + "T00:00:00");

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mb-2 -ml-2"
              onClick={() => navigate("/admin/reunioes")}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <UserCheck className="h-6 w-6 text-primary" />
              Check-in de Participantes
            </h1>
            <p className="text-muted-foreground mt-1">
              {reuniao.titulo}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => refetch()}
            title="Atualizar lista"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Info da Reunião */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <span className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                {format(dataReuniao, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </span>
              <span className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {reuniao.hora_inicio}{reuniao.hora_fim ? ` - ${reuniao.hora_fim}` : ""}
              </span>
              {reuniao.local && (
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {reuniao.local}
                </span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-5 w-5 mx-auto mb-1 text-emerald-600" />
              <p className="text-2xl font-bold text-emerald-700">{stats.presentes}</p>
              <p className="text-xs text-emerald-600">Presentes</p>
            </CardContent>
          </Card>
          <Card className="border-orange-200 bg-orange-50/50">
            <CardContent className="p-4 text-center">
              <XCircle className="h-5 w-5 mx-auto mb-1 text-orange-600" />
              <p className="text-2xl font-bold text-orange-700">{stats.ausentes}</p>
              <p className="text-xs text-orange-600">Ausentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
              <p className="text-2xl font-bold">{stats.pendentes}</p>
              <p className="text-xs text-muted-foreground">Aguardando</p>
            </CardContent>
          </Card>
        </div>

        {/* Barra de progresso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progresso do Check-in</span>
            <span className="font-medium">
              {stats.total > 0 
                ? Math.round(((stats.presentes + stats.ausentes) / stats.total) * 100) 
                : 0}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full flex">
              <div 
                className="bg-emerald-500 transition-all duration-500"
                style={{ width: `${stats.total > 0 ? (stats.presentes / stats.total) * 100 : 0}%` }}
              />
              <div 
                className="bg-orange-500 transition-all duration-500"
                style={{ width: `${stats.total > 0 ? (stats.ausentes / stats.total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar participante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lista de participantes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
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
              <div className="p-8 text-center text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{searchTerm ? "Nenhum participante encontrado" : "Nenhum participante na reunião"}</p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredParticipantes.map((p) => {
                  const nome = getNome(p);
                  const isPendente = p.status !== "presente" && p.status !== "ausente";
                  
                  return (
                    <div 
                      key={p.id} 
                      className={`p-4 flex items-center gap-4 transition-colors ${
                        p.status === "presente" ? "bg-emerald-50/50" : 
                        p.status === "ausente" ? "bg-orange-50/50" : ""
                      }`}
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={p.servidor?.foto_url || undefined} />
                        <AvatarFallback className={`text-sm ${
                          p.status === "presente" ? "bg-emerald-100 text-emerald-700" :
                          p.status === "ausente" ? "bg-orange-100 text-orange-700" :
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
                          <p className="text-xs text-emerald-600 mt-0.5">
                            Check-in: {format(new Date(p.data_assinatura), "HH:mm", { locale: ptBR })}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {getStatusBadge(p.status)}
                        
                        {isPendente && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => handleCheckin(p.id)}
                              disabled={updateStatusMutation.isPending}
                              className="bg-emerald-600 hover:bg-emerald-700"
                            >
                              <UserCheck className="h-4 w-4 mr-1" />
                              Presente
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAusencia(p.id)}
                              disabled={updateStatusMutation.isPending}
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </div>
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
            <AlertDialogTitle>Registrar Ausência</AlertDialogTitle>
            <AlertDialogDescription>
              Informe a justificativa para a ausência do participante (opcional).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            placeholder="Justificativa..."
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            rows={3}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarAusencia}>
              Confirmar Ausência
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
