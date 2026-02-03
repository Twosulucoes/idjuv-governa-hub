/**
 * Página de Listagem de Empenhos
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
import { Plus, Search, Eye, Receipt, Filter } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useEmpenhos } from "@/hooks/useFinanceiro";
import { formatCurrency } from "@/lib/formatters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { STATUS_EMPENHO_LABELS, TIPO_EMPENHO_LABELS } from "@/types/financeiro";

const statusColors: Record<string, string> = {
  emitido: "bg-blue-100 text-blue-800",
  parcialmente_liquidado: "bg-yellow-100 text-yellow-800",
  liquidado: "bg-cyan-100 text-cyan-800",
  parcialmente_pago: "bg-orange-100 text-orange-800",
  pago: "bg-green-100 text-green-800",
  anulado: "bg-red-100 text-red-800",
};

export default function EmpenhosPage() {
  const [searchParams] = useSearchParams();
  const statusParam = searchParams.get("status") || "";
  
  const [filtroStatus, setFiltroStatus] = useState(statusParam);
  const [busca, setBusca] = useState("");
  
  const { data: empenhos, isLoading } = useEmpenhos({ 
    status: filtroStatus || undefined 
  });
  
  const empenhosFiltrados = empenhos?.filter((e) => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      e.numero?.toLowerCase().includes(termo) ||
      e.objeto?.toLowerCase().includes(termo) ||
      (e.fornecedor as any)?.razao_social?.toLowerCase().includes(termo)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Empenhos</h1>
            <p className="text-muted-foreground">
              Gestão de notas de empenho
            </p>
          </div>
          <Button asChild>
            <Link to="/financeiro/empenhos/novo">
              <Plus className="h-4 w-4 mr-2" />
              Novo Empenho
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
                  placeholder="Buscar por número, objeto, fornecedor..."
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
                  <SelectItem value="emitido">Emitido</SelectItem>
                  <SelectItem value="parcialmente_liquidado">Parc. Liquidado</SelectItem>
                  <SelectItem value="liquidado">Liquidado</SelectItem>
                  <SelectItem value="parcialmente_pago">Parc. Pago</SelectItem>
                  <SelectItem value="pago">Pago</SelectItem>
                  <SelectItem value="anulado">Anulado</SelectItem>
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
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Objeto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">Empenhado</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
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
                      <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-16" /></TableCell>
                    </TableRow>
                  ))
                ) : empenhosFiltrados?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      <Receipt className="h-12 w-12 mx-auto mb-2 opacity-30" />
                      Nenhum empenho encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  empenhosFiltrados?.map((emp) => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-mono font-medium">
                        {emp.numero}
                      </TableCell>
                      <TableCell>
                        {format(new Date(emp.data_empenho), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">
                          {(emp.fornecedor as any)?.razao_social || "-"}
                        </span>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {emp.objeto}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {TIPO_EMPENHO_LABELS[emp.tipo as keyof typeof TIPO_EMPENHO_LABELS] || emp.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(emp.valor_empenhado)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={Number(emp.saldo_liquidar) > 0 ? 'text-amber-600' : 'text-green-600'}>
                          {formatCurrency(Number(emp.saldo_liquidar))}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[emp.status] || "bg-gray-100"}>
                          {STATUS_EMPENHO_LABELS[emp.status as keyof typeof STATUS_EMPENHO_LABELS] || emp.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/financeiro/empenhos/${emp.id}`}>
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
