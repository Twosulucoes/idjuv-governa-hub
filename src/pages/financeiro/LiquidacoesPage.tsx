import { useState } from "react";
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
import { Search, Plus, FileCheck, Eye, Paperclip } from "lucide-react";
import { formatCurrency, formatDateBR } from "@/lib/formatters";
import { useLiquidacoes } from "@/hooks/useFinanceiro";

const statusColors: Record<string, string> = {
  pendente: "bg-yellow-100 text-yellow-800",
  em_analise: "bg-blue-100 text-blue-800",
  aprovada: "bg-green-100 text-green-800",
  rejeitada: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  pendente: "Pendente",
  em_analise: "Em Análise",
  aprovada: "Aprovada",
  rejeitada: "Rejeitada",
};

export default function LiquidacoesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  
  const { data: liquidacoes, isLoading } = useLiquidacoes();

  const filteredLiquidacoes = liquidacoes?.filter((liq) => {
    const matchesSearch = 
      liq.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      liq.empenho?.numero?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todos" || liq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Liquidações</h1>
          <p className="text-muted-foreground">
            Gestão de liquidações e atesto de despesas
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Liquidação
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5" />
            Liquidações Registradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em_analise">Em Análise</SelectItem>
                <SelectItem value="aprovada">Aprovada</SelectItem>
                <SelectItem value="rejeitada">Rejeitada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando liquidações...
            </div>
          ) : filteredLiquidacoes?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma liquidação encontrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Empenho</TableHead>
                    <TableHead>Data Atesto</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Anexos</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLiquidacoes?.map((liq) => (
                    <TableRow key={liq.id}>
                      <TableCell className="font-medium">
                        {liq.numero}
                      </TableCell>
                      <TableCell>{liq.empenho?.numero}</TableCell>
                      <TableCell>{formatDateBR(liq.atestado_em)}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(liq.valor_liquidado)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[liq.status] || ""}>
                          {statusLabels[liq.status] || liq.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {liq.historico_status && liq.historico_status.length > 0 && (
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
