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
import { Search, Plus, Building2, Eye, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useContasBancarias } from "@/hooks/useFinanceiro";

const tipoContaLabels: Record<string, string> = {
  corrente: "Corrente",
  poupanca: "Poupança",
  aplicacao: "Aplicação",
  vinculada: "Vinculada",
};

export default function ContasBancariasPage() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: contas, isLoading } = useContasBancarias();

  const filteredContas = contas?.filter((conta) => {
    return (
      conta.nome_conta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conta.banco_nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conta.conta?.includes(searchTerm)
    );
  });

  const saldoTotal = contas?.reduce((acc, conta) => acc + (conta.saldo_atual || 0), 0) || 0;

  return (
    <ModuleLayout module="financeiro">
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contas Bancárias</h1>
          <p className="text-muted-foreground">
            Gestão de contas e saldos bancários
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar Saldos
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Conta
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Total de Contas</p>
            <p className="text-2xl font-bold">{contas?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Contas Ativas</p>
            <p className="text-2xl font-bold">
              {contas?.filter((c) => c.ativo).length || 0}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-primary/5">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">Saldo Total</p>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(saldoTotal)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Contas Cadastradas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, banco ou número..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando contas bancárias...
            </div>
          ) : filteredContas?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma conta encontrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Banco</TableHead>
                    <TableHead>Agência</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContas?.map((conta) => (
                    <TableRow key={conta.id}>
                      <TableCell className="font-medium">{conta.nome_conta}</TableCell>
                      <TableCell>{conta.banco_nome}</TableCell>
                      <TableCell>{conta.agencia}</TableCell>
                      <TableCell>{conta.conta}</TableCell>
                      <TableCell>
                        {tipoContaLabels[conta.tipo] || conta.tipo}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {formatCurrency(conta.saldo_atual)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={conta.ativo ? "default" : "secondary"}>
                          {conta.ativo ? "Ativa" : "Inativa"}
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
    </ModuleLayout>
  );
}
