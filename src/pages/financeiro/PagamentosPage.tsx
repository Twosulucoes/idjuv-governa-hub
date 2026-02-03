/**
 * Página de Listagem de Pagamentos
 */

import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
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
import { Plus, Search, Eye, CreditCard, Filter } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { usePagamentos } from "@/hooks/useFinanceiro";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { STATUS_PAGAMENTO_LABELS } from "@/types/financeiro";

const statusColors: Record<string, string> = {
  programado: "bg-blue-100 text-blue-800",
  autorizado: "bg-cyan-100 text-cyan-800",
  pago: "bg-green-100 text-green-800",
  devolvido: "bg-orange-100 text-orange-800",
  estornado: "bg-red-100 text-red-800",
  cancelado: "bg-gray-100 text-gray-600",
};

export default function PagamentosPage() {
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get("status") || "";
  
  const [filtroStatus, setFiltroStatus] = useState(statusParam);
  const [busca, setBusca] = useState("");
  
  const { data: pagamentos, isLoading } = usePagamentos({ 
    status: filtroStatus || undefined 
  });
  
  const pagamentosFiltrados = pagamentos?.filter((p) => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      p.numero?.toLowerCase().includes(termo) ||
      (p.fornecedor as any)?.razao_social?.toLowerCase().includes(termo) ||
      (p.empenho as any)?.numero?.toLowerCase().includes(termo)
    );
  });

  // Calcular totais
  const totalProgramado = pagamentosFiltrados?.filter(p => p.status === 'programado')
    .reduce((acc, p) => acc + Number(p.valor_bruto), 0) || 0;
  const totalPago = pagamentosFiltrados?.filter(p => p.status === 'pago')
    .reduce((acc, p) => acc + Number(p.valor_bruto), 0) || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Pagamentos</h1>
            <p className="text-muted-foreground">
              Gestão de ordens de pagamento
            </p>
          </div>
          <Button asChild>
            <Link to="/financeiro/pagamentos/novo">
              <Plus className="h-4 w-4 mr-2" />
              Novo Pagamento
            </Link>
          </Button>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Programados</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(totalProgramado)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Pagos no Período</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalPago)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Total de Registros</div>
              <div className="text-2xl font-bold">
                {pagamentosFiltrados?.length || 0}
              </div>
            </CardContent>
          </Card>
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
                  placeholder="Buscar por número, fornecedor, empenho..."
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
                  <SelectItem value="">Todos os status</SelectItem>
                  <SelectItem value="programado">Programado</SelectItem>
                  <SelectItem value="autorizado">Autorizado</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="devolvido">Devolvido</SelectItem>
                  <SelectItem value="estornado">Estornado</SelectItem>
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
                  <TableHead>Empenho</TableHead>
                  <TableHead>Favorecido</TableHead>
                  <TableHead>Forma</TableHead>
                  <TableHead className="text-right">Valor Bruto</TableHead>
                  <TableHead className="text-right">Valor Líquido</TableHead>
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
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : pagamentosFiltrados?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      Nenhum pagamento encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  pagamentosFiltrados?.map((pag) => (
                    <TableRow key={pag.id}>
                      <TableCell className="font-mono font-medium">
                        {pag.numero}
                      </TableCell>
                      <TableCell>
                        {format(new Date(pag.data_pagamento), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {(pag.empenho as any)?.numero || "-"}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {(pag.fornecedor as any)?.razao_social || "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase text-xs">
                          {pag.forma_pagamento}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(Number(pag.valor_bruto))}
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        {formatCurrency(Number(pag.valor_liquido))}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[pag.status] || "bg-gray-100"}>
                          {STATUS_PAGAMENTO_LABELS[pag.status as keyof typeof STATUS_PAGAMENTO_LABELS] || pag.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/financeiro/pagamentos/${pag.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
