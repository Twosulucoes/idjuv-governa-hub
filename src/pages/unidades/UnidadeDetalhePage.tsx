import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ModuleLayout } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Edit, 
  Building2, 
  MapPin, 
  Clock, 
  Users,
  Package,
  Calendar,
  FileText,
  History,
  Loader2,
  UserCog,
} from "lucide-react";
import {
  UnidadeLocal,
  NomeacaoChefeUnidade,
  TIPO_UNIDADE_LABELS,
  STATUS_UNIDADE_LABELS,
  STATUS_UNIDADE_COLORS,
  TIPO_ATO_LABELS,
} from "@/types/unidadesLocais";
import { UnidadeLocalForm } from "@/components/unidades/UnidadeLocalForm";
import { PatrimonioTab } from "@/components/unidades/PatrimonioTab";
import { AgendaTab } from "@/components/unidades/AgendaTab";
import { TermosCessaoTab } from "@/components/unidades/TermosCessaoTab";

function UnidadeDetalheContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [unidade, setUnidade] = useState<UnidadeLocal | null>(null);
  const [chefeAtual, setChefeAtual] = useState<NomeacaoChefeUnidade | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("dados");

  useEffect(() => {
    if (id) {
      loadUnidade();
    }
  }, [id]);

  async function loadUnidade() {
    setLoading(true);
    try {
      // Load unidade
      const { data, error } = await supabase
        .from("unidades_locais")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setUnidade(data as UnidadeLocal);

      // Load chefe atual
      const { data: chefeData } = await supabase.rpc("get_chefe_unidade_atual", {
        p_unidade_id: id,
      });

      if (chefeData && chefeData.length > 0) {
        // Get full nomeacao details
        const { data: nomeacao } = await supabase
          .from("nomeacoes_chefe_unidade")
          .select(`
            *,
            servidor:servidores(id, nome_completo, cpf, foto_url)
          `)
          .eq("id", chefeData[0].nomeacao_id)
          .single();
        setChefeAtual(nomeacao as any);
      }
    } catch (error: any) {
      console.error("Erro ao carregar unidade:", error);
      toast.error("Erro ao carregar unidade");
      navigate("/unidades");
    } finally {
      setLoading(false);
    }
  }

  function handleEditSuccess() {
    setShowEditDialog(false);
    loadUnidade();
    toast.success("Unidade atualizada com sucesso!");
  }

  if (loading) {
    return (
      <ModuleLayout module="patrimonio">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ModuleLayout>
    );
  }

  if (!unidade) {
    return (
      <ModuleLayout module="patrimonio">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Unidade não encontrada</p>
          <Button variant="link" onClick={() => navigate("/unidades")}>
            Voltar para lista
          </Button>
        </div>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout module="patrimonio">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/unidades")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{unidade.nome_unidade}</h1>
                <Badge className={STATUS_UNIDADE_COLORS[unidade.status]}>
                  {STATUS_UNIDADE_LABELS[unidade.status]}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {TIPO_UNIDADE_LABELS[unidade.tipo_unidade]} • {unidade.municipio}
              </p>
            </div>
          </div>
          <Button onClick={() => setShowEditDialog(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar Unidade
          </Button>
        </div>

        {/* Chefe Atual em destaque */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserCog className="h-5 w-5 text-primary" />
              Chefe da Unidade (Responsável Atual)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chefeAtual ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    {chefeAtual.servidor?.foto_url ? (
                      <img
                        src={chefeAtual.servidor.foto_url}
                        alt={chefeAtual.servidor.nome_completo}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <Users className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{chefeAtual.servidor?.nome_completo}</p>
                    <p className="text-sm text-muted-foreground">{chefeAtual.cargo}</p>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <p className="text-muted-foreground">
                    Nomeado em: {new Date(chefeAtual.data_inicio).toLocaleDateString("pt-BR")}
                  </p>
                  <p className="text-muted-foreground">
                    {chefeAtual.ato_nomeacao_tipo.charAt(0).toUpperCase() + chefeAtual.ato_nomeacao_tipo.slice(1)} nº {chefeAtual.ato_numero}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground italic">
                  Nenhum chefe designado para esta unidade
                </p>
                <p className="text-xs text-muted-foreground">
                  A designação é feita pelo módulo RH, na ficha do servidor.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dados" className="flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              <span className="hidden sm:inline">Dados Gerais</span>
            </TabsTrigger>
            <TabsTrigger value="patrimonio" className="flex items-center gap-1">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Patrimônio</span>
            </TabsTrigger>
            <TabsTrigger value="agenda" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Agenda</span>
            </TabsTrigger>
            <TabsTrigger value="termos" className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Termos</span>
            </TabsTrigger>
            <TabsTrigger value="historico" className="flex items-center gap-1">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Histórico</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dados" className="mt-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Localização
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Município</p>
                    <p className="font-medium">{unidade.municipio}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Endereço</p>
                    <p className="font-medium">{unidade.endereco_completo || "-"}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Funcionamento
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Horário</p>
                    <p className="font-medium">{unidade.horario_funcionamento || "-"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Capacidade</p>
                    <p className="font-medium">
                      {unidade.capacidade ? `${unidade.capacidade} pessoas` : "-"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Áreas Disponíveis</CardTitle>
                </CardHeader>
                <CardContent>
                  {unidade.areas_disponiveis && unidade.areas_disponiveis.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {unidade.areas_disponiveis.map((area) => (
                        <Badge key={area} variant="secondary">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">Nenhuma área cadastrada</p>
                  )}
                </CardContent>
              </Card>

              {unidade.regras_de_uso && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Regras de Uso</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{unidade.regras_de_uso}</p>
                  </CardContent>
                </Card>
              )}

              {unidade.observacoes && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Observações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{unidade.observacoes}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>


          <TabsContent value="patrimonio" className="mt-6">
            <PatrimonioTab unidadeId={unidade.id} />
          </TabsContent>

          <TabsContent value="agenda" className="mt-6">
            <AgendaTab unidadeId={unidade.id} chefeAtualId={chefeAtual?.servidor_id} />
          </TabsContent>

          <TabsContent value="termos" className="mt-6">
            <TermosCessaoTab unidadeId={unidade.id} chefeNomeacaoId={chefeAtual?.id} />
          </TabsContent>

          <TabsContent value="historico" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Alterações</CardTitle>
                <CardDescription>
                  Registro de todas as modificações realizadas nesta unidade
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-l-2 border-primary pl-4 py-2">
                    <p className="text-sm text-muted-foreground">
                      {unidade.created_at
                        ? new Date(unidade.created_at).toLocaleString("pt-BR")
                        : "-"}
                    </p>
                    <p className="font-medium">Unidade cadastrada no sistema</p>
                  </div>
                  {unidade.updated_at && unidade.updated_at !== unidade.created_at && (
                    <div className="border-l-2 border-muted pl-4 py-2">
                      <p className="text-sm text-muted-foreground">
                        {new Date(unidade.updated_at).toLocaleString("pt-BR")}
                      </p>
                      <p className="font-medium">Última atualização</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog de Edição */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Unidade</DialogTitle>
            <DialogDescription>
              Atualize os dados da unidade local
            </DialogDescription>
          </DialogHeader>
          <UnidadeLocalForm
            unidade={unidade}
            onSuccess={handleEditSuccess}
            onCancel={() => setShowEditDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}

export default function UnidadeDetalhePage() {
  return (
    <ProtectedRoute requiredModule="patrimonio">
      <UnidadeDetalheContent />
    </ProtectedRoute>
  );
}
