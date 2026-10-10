import { useState } from "react";
import { ModuleLayout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { DataTable, KpiCard, PageHeader, StatusBadge, type ColunaTabela, type TomStatus } from "@/components/design-system";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  MessageSquare,
  FileText,
  Shield,
  TrendingUp,
  Users,
  Calendar,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAtualizarDenuncia, useDenuncias } from "@/hooks/useDenuncias";
import { labelTipoDenuncia, type Denuncia, type StatusDenuncia } from "@/types/integridade";

function resumoDenuncia(descricao: string, tamanho = 90): string {
  if (descricao.length <= tamanho) return descricao;
  return `${descricao.slice(0, tamanho).trim()}…`;
}

const statusConfig: Record<StatusDenuncia, { label: string; tom: TomStatus }> = {
  pendente: { label: "Pendente", tom: "pendente" },
  em_analise: { label: "Em análise", tom: "andamento" },
  em_investigacao: { label: "Em investigação", tom: "andamento" },
  concluida: { label: "Concluída", tom: "sucesso" },
  arquivada: { label: "Arquivada", tom: "neutro" },
};

const GestaoDenunciasPage = () => {
  const { toast } = useToast();
  const { data: denuncias = [], isLoading, isError, refetch } = useDenuncias();
  const atualizarDenuncia = useAtualizarDenuncia();
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [tipoFilter, setTipoFilter] = useState<string>("todos");
  const [selectedDenuncia, setSelectedDenuncia] = useState<Denuncia | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isUpdateOpen, setIsUpdateOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<StatusDenuncia>("pendente");
  const [parecer, setParecer] = useState("");
  const [responsavel, setResponsavel] = useState("");

  // Calculate stats
  const stats = {
    total: denuncias.length,
    pendentes: denuncias.filter(d => d.status === "pendente").length,
    emAndamento: denuncias.filter(d => ["em_analise", "em_investigacao"].includes(d.status)).length,
    concluidas: denuncias.filter(d => d.status === "concluida").length,
    arquivadas: denuncias.filter(d => d.status === "arquivada").length
  };

  const tiposUnicos = [...new Set(denuncias.map(d => d.tipo))];

  const handleViewDetails = (denuncia: Denuncia) => {
    setSelectedDenuncia(denuncia);
    setIsDetailOpen(true);
  };

  const handleUpdateStatus = (denuncia: Denuncia) => {
    setSelectedDenuncia(denuncia);
    setNewStatus(denuncia.status);
    setParecer(denuncia.parecer || "");
    setResponsavel(denuncia.responsavel || "");
    setIsUpdateOpen(true);
  };

  const saveStatusUpdate = () => {
    if (!selectedDenuncia) return;

    atualizarDenuncia.mutate(
      { id: selectedDenuncia.id, status: newStatus, parecer, responsavel },
      {
        onSuccess: () => {
          setIsUpdateOpen(false);
          toast({
            title: "Status atualizado",
            description: `Denúncia ${selectedDenuncia.protocolo} atualizada com sucesso.`
          });
        },
        onError: (error) => {
          toast({
            title: "Erro ao atualizar",
            description: error instanceof Error ? error.message : "Tente novamente.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const colunas: ColunaTabela<Denuncia>[] = [
    {
      id: "protocolo",
      cabecalho: "Protocolo",
      celula: (d) => <span className="font-mono font-medium text-primary">{d.protocolo}</span>,
      ordenarPor: (d) => d.protocolo,
      buscarPor: (d) => d.protocolo,
      mobile: "titulo",
    },
    {
      id: "tipo",
      cabecalho: "Tipo",
      celula: (d) => labelTipoDenuncia(d.tipo),
      ordenarPor: (d) => labelTipoDenuncia(d.tipo),
      buscarPor: (d) => labelTipoDenuncia(d.tipo),
    },
    {
      id: "resumo",
      cabecalho: "Resumo",
      celula: (d) => resumoDenuncia(d.descricao),
      buscarPor: (d) => d.descricao,
      className: "max-w-xs truncate",
    },
    {
      id: "data",
      cabecalho: "Data",
      celula: (d) => <span className="text-muted-foreground">{new Date(d.created_at).toLocaleDateString('pt-BR')}</span>,
      ordenarPor: (d) => new Date(d.created_at),
    },
    {
      id: "status",
      cabecalho: "Situação",
      celula: (d) => <StatusBadge tom={statusConfig[d.status].tom}>{statusConfig[d.status].label}</StatusBadge>,
      ordenarPor: (d) => statusConfig[d.status].label,
    },
    {
      id: "anonima",
      cabecalho: "Anônima",
      celula: (d) => (d.anonima ? <Badge variant="secondary">Sim</Badge> : <Badge variant="outline">Não</Badge>),
      ordenarPor: (d) => d.anonima,
    },
  ];

  const denunciasFiltradas = denuncias.filter(d =>
    (statusFilter === "todos" || d.status === statusFilter) &&
    (tipoFilter === "todos" || d.tipo === tipoFilter)
  );

  const indicadores = [
    { rotulo: "Total", valor: stats.total, icone: FileText },
    { rotulo: "Pendentes", valor: stats.pendentes, icone: Clock },
    { rotulo: "Em andamento", valor: stats.emAndamento, icone: TrendingUp },
    { rotulo: "Concluídas", valor: stats.concluidas, icone: CheckCircle2 },
    { rotulo: "Arquivadas", valor: stats.arquivadas, icone: XCircle },
  ];

  return (
    <ModuleLayout module="integridade">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Integridade", href: "/integridade" }, { rotulo: "Gestão de denúncias" }]}
          titulo="Gestão de denúncias"
          descricao="Acompanhamento e tratamento de denúncias recebidas"
        />

        {/* Indicadores */}
        <section aria-labelledby="denuncias-indicadores">
          <h2 id="denuncias-indicadores" className="sr-only">Indicadores</h2>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-5">
            {indicadores.map((ind) => (
              <li key={ind.rotulo}>
                <KpiCard
                  rotulo={ind.rotulo}
                  valor={isError ? "—" : ind.valor}
                  icone={ind.icone}
                  carregando={isLoading}
                  className="h-full"
                />
              </li>
            ))}
          </ul>
        </section>

        <DataTable
          rotulo="Denúncias"
          dados={denunciasFiltradas}
          colunas={colunas}
          chaveLinha={(d) => d.id}
          carregando={isLoading}
          erro={isError ? "Não foi possível carregar as denúncias. Verifique sua permissão de acesso." : null}
          aoTentarNovamente={() => refetch()}
          busca={{ placeholder: "Buscar por protocolo, resumo..." }}
          filtros={
            <>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-44" aria-label="Situação">
                  <SelectValue placeholder="Situação" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas as situações</SelectItem>
                  {(Object.keys(statusConfig) as StatusDenuncia[]).map(s => (
                    <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="w-full sm:w-44" aria-label="Tipo">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os tipos</SelectItem>
                  {tiposUnicos.map(tipo => (
                    <SelectItem key={tipo} value={tipo}>{labelTipoDenuncia(tipo)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
          vazio={{ icone: Shield, titulo: "Nenhuma denúncia encontrada", descricao: "Ajuste os filtros ou aguarde novos registros." }}
          acoesLinha={(denuncia) => (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Ver detalhes da denúncia ${denuncia.protocolo}`}
                onClick={() => handleViewDetails(denuncia)}
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Atualizar situação da denúncia ${denuncia.protocolo}`}
                onClick={() => handleUpdateStatus(denuncia)}
              >
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          )}
        />

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" aria-hidden="true" />
              Detalhes da denúncia
            </DialogTitle>
            <DialogDescription>
              Protocolo: {selectedDenuncia?.protocolo}
            </DialogDescription>
          </DialogHeader>
          
          {selectedDenuncia && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Tipo</p>
                  <p className="font-medium">{labelTipoDenuncia(selectedDenuncia.tipo)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Situação</p>
                  <StatusBadge tom={statusConfig[selectedDenuncia.status].tom} className="mt-1">
                    {statusConfig[selectedDenuncia.status].label}
                  </StatusBadge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data do Registro</p>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" aria-hidden="true" />
                    {new Date(selectedDenuncia.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Denúncia Anônima</p>
                  <p className="font-medium flex items-center gap-1">
                    <Users className="h-4 w-4" aria-hidden="true" />
                    {selectedDenuncia.anonima ? "Sim" : "Não"}
                  </p>
                </div>
              </div>

              {!selectedDenuncia.anonima && (selectedDenuncia.nome_denunciante || selectedDenuncia.email_denunciante) && (
                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                  {selectedDenuncia.nome_denunciante && (
                    <div>
                      <p className="text-sm text-muted-foreground">Denunciante</p>
                      <p className="font-medium">{selectedDenuncia.nome_denunciante}</p>
                    </div>
                  )}
                  {selectedDenuncia.email_denunciante && (
                    <div>
                      <p className="text-sm text-muted-foreground">Contato</p>
                      <p className="font-medium">{selectedDenuncia.email_denunciante}{selectedDenuncia.telefone_denunciante ? ` · ${selectedDenuncia.telefone_denunciante}` : ""}</p>
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="text-sm text-muted-foreground mb-1">Descrição Detalhada</p>
                <p className="text-sm bg-muted/50 p-3 rounded-lg">{selectedDenuncia.descricao}</p>
              </div>

              {selectedDenuncia.envolvidos && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Envolvidos</p>
                  <p className="font-medium">{selectedDenuncia.envolvidos}</p>
                </div>
              )}

              {selectedDenuncia.local_ocorrencia && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Localização</p>
                  <p className="font-medium">{selectedDenuncia.local_ocorrencia}</p>
                </div>
              )}

              {selectedDenuncia.data_ocorrencia && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Data/Período da Ocorrência</p>
                  <p className="font-medium">{selectedDenuncia.data_ocorrencia}</p>
                </div>
              )}

              {selectedDenuncia.evidencias && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Evidências relatadas</p>
                  <p className="font-medium">{selectedDenuncia.evidencias}</p>
                </div>
              )}

              {selectedDenuncia.parecer && (
                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-1">Parecer</p>
                  <p className="text-sm bg-success/10 p-3 rounded-lg border border-success/30">
                    {selectedDenuncia.parecer}
                  </p>
                  {selectedDenuncia.responsavel && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Responsável: {selectedDenuncia.responsavel}
                    </p>
                  )}
                </div>
              )}

              <div className="text-xs text-muted-foreground border-t pt-4">
                Última atualização: {new Date(selectedDenuncia.updated_at).toLocaleDateString('pt-BR')}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Update Status Dialog */}
      <Dialog open={isUpdateOpen} onOpenChange={setIsUpdateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar situação</DialogTitle>
            <DialogDescription>
              Atualize o status e adicione um parecer para a denúncia {selectedDenuncia?.protocolo}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="denuncia-novo-status" className="text-sm font-medium mb-2 block">Nova situação</label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as StatusDenuncia)}>
                <SelectTrigger id="denuncia-novo-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(statusConfig) as StatusDenuncia[]).map(s => (
                    <SelectItem key={s} value={s}>{statusConfig[s].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="denuncia-parecer" className="text-sm font-medium mb-2 block">Parecer / observações</label>
              <Textarea
                id="denuncia-parecer"
                placeholder="Adicione observações sobre o andamento ou conclusão..."
                value={parecer}
                onChange={(e) => setParecer(e.target.value)}
                rows={4}
              />
            </div>

            <div>
              <label htmlFor="denuncia-responsavel" className="text-sm font-medium mb-2 block">Responsável pela apuração</label>
              <Input
                id="denuncia-responsavel"
                placeholder="Ex: Comissão de Ética, Ouvidoria..."
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveStatusUpdate} disabled={atualizarDenuncia.isPending}>
              {atualizarDenuncia.isPending ? "Salvando..." : "Salvar alterações"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </ModuleLayout>
  );
};

export default GestaoDenunciasPage;
