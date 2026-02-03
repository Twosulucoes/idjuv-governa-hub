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
import { Search, Plus, Wallet, Eye, AlertTriangle } from "lucide-react";
import { formatCurrency, formatDateBR } from "@/lib/formatters";
import { useAdiantamentos } from "@/hooks/useFinanceiro";

const statusColors: Record<string, string> = {
  solicitado: "bg-yellow-100 text-yellow-800",
  autorizado: "bg-blue-100 text-blue-800",
  liberado: "bg-green-100 text-green-800",
  em_comprovacao: "bg-orange-100 text-orange-800",
  comprovado: "bg-emerald-100 text-emerald-800",
  pendente_devolucao: "bg-red-100 text-red-800",
  encerrado: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<string, string> = {
  solicitado: "Solicitado",
  autorizado: "Autorizado",
  liberado: "Liberado",
  em_comprovacao: "Em Comprovação",
  comprovado: "Comprovado",
  pendente_devolucao: "Pendente Devolução",
  encerrado: "Encerrado",
};

export default function AdiantamentosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  
  const { data: adiantamentos, isLoading } = useAdiantamentos();

  const filteredAdiantamentos = adiantamentos?.filter((adi) => {
    const matchesSearch = 
      adi.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adi.finalidade?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "todos" || adi.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const adiantamentosVencendo = adiantamentos?.filter(
    (adi) => adi.status === "liberado" && adi.prazo_prestacao_contas
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Adiantamentos</h1>
          <p className="text-muted-foreground">
            Suprimento de fundos e prestação de contas
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Adiantamento
        </Button>
      </div>

      {adiantamentosVencendo && adiantamentosVencendo.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <p className="text-yellow-800">
                <strong>{adiantamentosVencendo.length}</strong> adiantamento(s) 
                aguardando prestação de contas
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Adiantamentos Registrados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por número ou responsável..."
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
                <SelectItem value="solicitado">Solicitado</SelectItem>
                <SelectItem value="autorizado">Autorizado</SelectItem>
                <SelectItem value="liberado">Liberado</SelectItem>
                <SelectItem value="em_comprovacao">Em Comprovação</SelectItem>
                <SelectItem value="comprovado">Comprovado</SelectItem>
                <SelectItem value="pendente_devolucao">Pendente Devolução</SelectItem>
                <SelectItem value="encerrado">Encerrado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando adiantamentos...
            </div>
          ) : filteredAdiantamentos?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum adiantamento encontrado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Prazo Comprovação</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdiantamentos?.map((adi) => (
                    <TableRow key={adi.id}>
                      <TableCell className="font-medium">
                        {adi.numero}
                      </TableCell>
                      <TableCell>{adi.finalidade}</TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(adi.valor_aprovado || adi.valor_solicitado)}
                      </TableCell>
                      <TableCell>
                        {formatDateBR(adi.prazo_prestacao_contas)}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[adi.status] || ""}>
                          {statusLabels[adi.status] || adi.status}
                        </Badge>
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
