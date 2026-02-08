/**
 * Página de Listagem de Solicitações de Despesa
 */

import { useState } from "react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Eye, FileText, Filter } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useSolicitacoes } from "@/hooks/useFinanceiro";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { STATUS_WORKFLOW_LABELS, PRIORIDADE_OPTIONS } from "@/types/financeiro";

const statusColors: Record<string, string> = {
  rascunho: "bg-gray-100 text-gray-800",
  pendente_analise: "bg-yellow-100 text-yellow-800",
  em_analise: "bg-blue-100 text-blue-800",
  aprovado: "bg-green-100 text-green-800",
  rejeitado: "bg-red-100 text-red-800",
  cancelado: "bg-gray-100 text-gray-600",
  executado: "bg-emerald-100 text-emerald-800",
  estornado: "bg-purple-100 text-purple-800",
};

export default function SolicitacoesPage() {
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get("status") || "";
  
  const [filtroStatus, setFiltroStatus] = useState(statusParam);
  const [busca, setBusca] = useState("");
  
  const { data: solicitacoes, isLoading } = useSolicitacoes({ 
    status: filtroStatus && filtroStatus !== "todos" ? filtroStatus : undefined 
  });
  
  const solicitacoesFiltradas = solicitacoes?.filter((s) => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      s.numero?.toLowerCase().includes(termo) ||
      s.objeto?.toLowerCase().includes(termo) ||
      (s.unidade_solicitante as any)?.nome?.toLowerCase().includes(termo) ||
      (s.fornecedor as any)?.razao_social?.toLowerCase().includes(termo)
    );
  });

  return (
    <ModuleLayout module="financeiro">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Solicitações de Despesa</h1>
            <p className="text-muted-foreground">
              Gerencie as solicitações de despesa do IDJuv
            </p>
          </div>
          <Button asChild>
            <Link to="/financeiro/solicitacoes?acao=nova">
              <Plus className="h-4 w-4 mr-2" />
              Nova Solicitação
            </Link>
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número, objeto, unidade..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os status</SelectItem>
                  <SelectItem value="rascunho">Rascunho</SelectItem>
                  <SelectItem value="pendente_analise">Pendente de Análise</SelectItem>
                  <SelectItem value="em_analise">Em Análise</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="rejeitado">Rejeitado</SelectItem>
                  <SelectItem value="executado">Executado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tabela */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Unidade</TableHead>
                  <TableHead>Objeto</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : solicitacoesFiltradas?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      Nenhuma solicitação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  solicitacoesFiltradas?.map((sol) => {
                    const prioridade = PRIORIDADE_OPTIONS.find(p => p.value === sol.prioridade);
                    return (
                      <TableRow key={sol.id}>
                        <TableCell className="font-mono font-medium">
                          {sol.numero}
                        </TableCell>
                        <TableCell>
                          {format(new Date(sol.data_solicitacao), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">
                            {(sol.unidade_solicitante as any)?.sigla || (sol.unidade_solicitante as any)?.nome || "-"}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {sol.objeto}
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(sol.valor_estimado)}
                        </TableCell>
                        <TableCell>
                          <Badge className={prioridade?.color || "bg-gray-100 text-gray-800"}>
                            {prioridade?.label || sol.prioridade}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[sol.status] || "bg-gray-100"}>
                            {STATUS_WORKFLOW_LABELS[sol.status as keyof typeof STATUS_WORKFLOW_LABELS] || sol.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/financeiro/solicitacoes/${sol.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
