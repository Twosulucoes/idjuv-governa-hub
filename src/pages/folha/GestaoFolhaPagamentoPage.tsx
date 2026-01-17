import { useState } from "react";
import { AdminLayout } from "@/components/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FileText, Check, Loader2, Eye, Users } from "lucide-react";
import { useFolhasPagamento, useUpdateFolhaStatus } from "@/hooks/useFolhaPagamento";
import { NovaFolhaForm } from "@/components/folha/NovaFolhaForm";
import { STATUS_FOLHA_LABELS, STATUS_FOLHA_COLORS, MESES, type StatusFolha } from "@/types/folha";
import { useNavigate } from "react-router-dom";

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

export default function GestaoFolhaPagamentoPage() {
  const navigate = useNavigate();
  const [anoFiltro, setAnoFiltro] = useState<number>(currentYear);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const { data: folhas, isLoading } = useFolhasPagamento(anoFiltro);
  const updateStatus = useUpdateFolhaStatus();

  const formatCurrency = (value: number | null | undefined) => {
    return (value || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleView = (id: string) => {
    navigate(`/folha/${id}`);
  };

  const canAdvanceStatus = (status: StatusFolha) => {
    return ["previa", "aberta", "processando"].includes(status);
  };

  const getNextStatus = (current: StatusFolha): StatusFolha | null => {
    const flow: Record<StatusFolha, StatusFolha | null> = {
      previa: "aberta",
      aberta: "processando",
      processando: "fechada",
      fechada: null,
      reaberta: "aberta",
    };
    return flow[current];
  };

  const handleAdvanceStatus = (id: string, currentStatus: StatusFolha) => {
    const nextStatus = getNextStatus(currentStatus);
    if (nextStatus) {
      updateStatus.mutate({ id, status: nextStatus });
    }
  };

  return (
    <AdminLayout>
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
                            <Badge className={STATUS_FOLHA_COLORS[folha.status as StatusFolha] || "bg-gray-100"}>
                              {STATUS_FOLHA_LABELS[folha.status as StatusFolha] || folha.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleView(folha.id)}
                                title="Visualizar"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {canAdvanceStatus(folha.status as StatusFolha) && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleAdvanceStatus(folha.id, folha.status as StatusFolha)}
                                  title="Avançar status"
                                  disabled={updateStatus.isPending}
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
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
    </AdminLayout>
  );
}
