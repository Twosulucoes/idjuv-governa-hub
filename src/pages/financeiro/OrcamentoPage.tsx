import { useState } from "react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
import { Search, Plus, PieChart, TrendingUp, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useDotacoes, useResumoOrcamentario } from "@/hooks/useFinanceiro";

export default function OrcamentoPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [exercicio, setExercicio] = useState(new Date().getFullYear().toString());
  
  const { data: dotacoes, isLoading } = useDotacoes(parseInt(exercicio));
  const { data: resumo } = useResumoOrcamentario(parseInt(exercicio));

  const filteredDotacoes = dotacoes?.filter((dot) => {
    return (
      dot.codigo_dotacao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dot.acao?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Usar dados do resumo centralizado em vez de recalcular
  const totalDotacao = resumo?.dotacao_atual || 0;
  const totalEmpenhado = resumo?.empenhado || 0;
  const saldoDisponivel = resumo?.saldo_disponivel || 0;
  const percentualExecutado = resumo?.percentual_executado || 0;

  return (
    <ModuleLayout module="financeiro">
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Orçamento</h1>
          <p className="text-muted-foreground">
            Gestão de dotações e execução orçamentária
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={exercicio} onValueChange={setExercicio}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
            </SelectContent>
          </Select>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Dotação
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Dotação Total</p>
            </div>
            <p className="text-2xl font-bold">
              {formatCurrency(totalDotacao)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <p className="text-sm text-muted-foreground">Empenhado</p>
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {formatCurrency(totalEmpenhado)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-green-500" />
              <p className="text-sm text-muted-foreground">Saldo Disponível</p>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(saldoDisponivel)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-2">Execução</p>
            <div className="space-y-2">
              <Progress value={percentualExecutado} className="h-2" />
              <p className="text-lg font-semibold">
                {percentualExecutado.toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Dotações Orçamentárias - {exercicio}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, descrição ou ação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando dotações...
            </div>
          ) : filteredDotacoes?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma dotação encontrada
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Ação/Programa</TableHead>
                    <TableHead>Natureza</TableHead>
                    <TableHead>Fonte</TableHead>
                    <TableHead className="text-right">Dotação</TableHead>
                    <TableHead className="text-right">Empenhado</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead>Exec.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDotacoes?.map((dot) => {
                    const execucao = dot.valor_atual > 0 
                      ? (dot.valor_empenhado / dot.valor_atual) * 100 
                      : 0;
                    
                    return (
                      <TableRow key={dot.id}>
                        <TableCell className="font-mono text-sm">
                          {dot.codigo_dotacao}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{dot.acao?.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {dot.programa?.nome}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {dot.natureza_despesa?.codigo}
                        </TableCell>
                        <TableCell>{dot.fonte_recurso?.codigo}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(dot.valor_atual)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-blue-600">
                          {formatCurrency(dot.valor_empenhado)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          <span className={dot.saldo_disponivel < 0 ? "text-destructive" : "text-green-600"}>
                            {formatCurrency(dot.saldo_disponivel)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={execucao > 90 ? "destructive" : execucao > 70 ? "secondary" : "outline"}
                          >
                            {execucao.toFixed(0)}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
