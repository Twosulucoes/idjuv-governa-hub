import { useState } from "react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FileText, Loader2, Eye, Users, History, Lock, Unlock } from "lucide-react";
import { useFolhasPagamento } from "@/hooks/useFolhaPagamento";
import { usePermissoesFolha, useEnviarConferencia } from "@/hooks/useFechamentoFolha";
import { NovaFolhaForm } from "@/components/folha/NovaFolhaForm";
import { FecharFolhaDialog } from "@/components/folha/FecharFolhaDialog";
import { ReabrirFolhaDialog } from "@/components/folha/ReabrirFolhaDialog";
import { HistoricoStatusFolhaDialog } from "@/components/folha/HistoricoStatusFolhaDialog";
import { StatusFolhaIndicator } from "@/components/folha/StatusFolhaIndicator";
import { MESES, type StatusFolha } from "@/types/folha";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

interface FolhaSelecionada {
  id: string;
  ano: number;
  mes: number;
  status: StatusFolha;
}

export default function GestaoFolhaPagamentoPage() {
  const navigate = useNavigate();
  const [anoFiltro, setAnoFiltro] = useState<number>(currentYear);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [folhaFechar, setFolhaFechar] = useState<FolhaSelecionada | null>(null);
  const [folhaReabrir, setFolhaReabrir] = useState<FolhaSelecionada | null>(null);
  const [folhaHistorico, setFolhaHistorico] = useState<FolhaSelecionada | null>(null);
  
  const { data: folhas, isLoading } = useFolhasPagamento(anoFiltro);
  const { data: permissoes } = usePermissoesFolha();
  const enviarConferencia = useEnviarConferencia();

  const formatCurrency = (value: number | null | undefined) => {
    return (value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleView = (id: string) => {
    navigate(`/folha/${id}`);
  };

  const handleEnviarConferencia = (folhaId: string) => {
    enviarConferencia.mutate(folhaId);
  };

  return (
    <ModuleLayout module="rh">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Folha de Pagamento</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as competências de pagamento dos servidores
            </p>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="mr-2 h-4 w-4" />
                Nova Competência
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Folha</DialogTitle>
                <DialogDescription>
                  Selecione o mês e ano da folha a ser criada
                </DialogDescription>
              </DialogHeader>
              <NovaFolhaForm onSuccess={() => setIsFormOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Folhas Abertas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {folhas?.filter(f => !["fechada"].includes(f.status)).length || 0}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Bruto ({anoFiltro})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {formatCurrency(folhas?.reduce((sum, f) => sum + (f.total_bruto || 0), 0))}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Descontos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(folhas?.reduce((sum, f) => sum + (f.total_descontos || 0), 0))}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Líquido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(folhas?.reduce((sum, f) => sum + (f.total_liquido || 0), 0))}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filtro e Tabela */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Competências</CardTitle>
              <Select
                value={anoFiltro.toString()}
                onValueChange={(v) => setAnoFiltro(Number(v))}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Competência</TableHead>
                      <TableHead className="text-center">Servidores</TableHead>
                      <TableHead className="text-right">Bruto</TableHead>
                      <TableHead className="text-right">Descontos</TableHead>
                      <TableHead className="text-right">Líquido</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {folhas?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Nenhuma folha cadastrada para {anoFiltro}</p>
                          <Button 
                            variant="outline" 
                            className="mt-4"
                            onClick={() => setIsFormOpen(true)}
                          >
                            Criar primeira folha
                          </Button>
                        </TableCell>
                      </TableRow>
                    ) : (
                      folhas?.map((folha) => (
                        <TableRow key={folha.id}>
                          <TableCell className="font-medium">
                            {MESES[folha.competencia_mes - 1]}/{folha.competencia_ano}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              {folha.quantidade_servidores || 0}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(folha.total_bruto)}
                          </TableCell>
                          <TableCell className="text-right font-mono text-warning">
                            {formatCurrency(folha.total_descontos)}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium text-success">
                            {formatCurrency(folha.total_liquido)}
                          </TableCell>
                          <TableCell className="text-center">
                            <StatusFolhaIndicator
                              status={folha.status as StatusFolha}
                              fechadoEm={folha.data_fechamento}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleView(folha.id)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Ver detalhes</TooltipContent>
                              </Tooltip>
                              
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setFolhaHistorico({
                                      id: folha.id,
                                      ano: folha.competencia_ano,
                                      mes: folha.competencia_mes,
                                      status: folha.status as StatusFolha,
                                    })}
                                  >
                                    <History className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Histórico</TooltipContent>
                              </Tooltip>

                              {/* Ação de enviar para conferência */}
                              {['aberta', 'reaberta'].includes(folha.status) && permissoes?.podeFechar && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => handleEnviarConferencia(folha.id)}
                                      disabled={enviarConferencia.isPending}
                                    >
                                      {enviarConferencia.isPending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                      ) : (
                                        <FileText className="h-4 w-4 text-blue-600" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Enviar para conferência</TooltipContent>
                                </Tooltip>
                              )}

                              {/* Ação de fechar folha */}
                              {['processando', 'aberta'].includes(folha.status) && permissoes?.podeFechar && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setFolhaFechar({
                                        id: folha.id,
                                        ano: folha.competencia_ano,
                                        mes: folha.competencia_mes,
                                        status: folha.status as StatusFolha,
                                      })}
                                    >
                                      <Lock className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Fechar folha</TooltipContent>
                                </Tooltip>
                              )}

                              {/* Ação de reabrir folha (super_admin) */}
                              {folha.status === 'fechada' && permissoes?.podeReabrir && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setFolhaReabrir({
                                        id: folha.id,
                                        ano: folha.competencia_ano,
                                        mes: folha.competencia_mes,
                                        status: folha.status as StatusFolha,
                                      })}
                                    >
                                      <Unlock className="h-4 w-4 text-purple-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Reabrir folha</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs de ações */}
      {folhaFechar && (
        <FecharFolhaDialog
          open={!!folhaFechar}
          onOpenChange={(open) => !open && setFolhaFechar(null)}
          folhaId={folhaFechar.id}
          competenciaAno={folhaFechar.ano}
          competenciaMes={folhaFechar.mes}
        />
      )}

      {folhaReabrir && (
        <ReabrirFolhaDialog
          open={!!folhaReabrir}
          onOpenChange={(open) => !open && setFolhaReabrir(null)}
          folhaId={folhaReabrir.id}
          competenciaAno={folhaReabrir.ano}
          competenciaMes={folhaReabrir.mes}
        />
      )}

      {folhaHistorico && (
        <HistoricoStatusFolhaDialog
          open={!!folhaHistorico}
          onOpenChange={(open) => !open && setFolhaHistorico(null)}
          folhaId={folhaHistorico.id}
          competenciaAno={folhaHistorico.ano}
          competenciaMes={folhaHistorico.mes}
        />
      )}
    </ModuleLayout>
  );
}
