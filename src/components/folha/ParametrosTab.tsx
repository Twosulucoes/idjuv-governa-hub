import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit2, Loader2 } from "lucide-react";
import { useParametrosFolha, useSaveParametro } from "@/hooks/useFolhaPagamento";
import { ParametroForm } from "./ParametroForm";
import type { ParametroFolha } from "@/types/folha";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function ParametrosTab() {
  const { data: parametros, isLoading } = useParametrosFolha();
  const [editingParametro, setEditingParametro] = useState<ParametroFolha | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleEdit = (param: ParametroFolha) => {
    setEditingParametro(param);
    setIsFormOpen(true);
  };

  const handleNew = () => {
    setEditingParametro(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingParametro(null);
  };

  const formatValue = (chave: string, valor: number) => {
    if (chave.includes("SALARIO") || chave.includes("TETO") || chave.includes("DEDUCAO")) {
      return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
    }
    if (chave.includes("ALIQUOTA") || chave.includes("PERCENTUAL")) {
      return `${valor}%`;
    }
    return valor.toString();
  };

  const isVigente = (param: ParametroFolha) => {
    const hoje = new Date();
    const inicio = new Date(param.vigencia_inicio);
    const fim = param.vigencia_fim ? new Date(param.vigencia_fim) : null;
    return hoje >= inicio && (!fim || hoje <= fim);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Parâmetros da Folha</CardTitle>
            <CardDescription>
              Configure valores de referência como salário mínimo, teto INSS, etc.
            </CardDescription>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNew}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Parâmetro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingParametro ? "Editar Parâmetro" : "Novo Parâmetro"}
                </DialogTitle>
                <DialogDescription>
                  Defina o valor e vigência do parâmetro
                </DialogDescription>
              </DialogHeader>
              <ParametroForm
                parametro={editingParametro}
                onSuccess={handleFormClose}
                onCancel={handleFormClose}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parâmetro</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Vigência</TableHead>
                  <TableHead className="w-[100px] text-center">Status</TableHead>
                  <TableHead className="w-[60px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parametros?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum parâmetro cadastrado
                    </TableCell>
                  </TableRow>
                ) : (
                  parametros?.map((param) => (
                    <TableRow key={param.id}>
                      <TableCell className="font-mono font-medium">
                        {param.chave}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {param.descricao || "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatValue(param.chave, param.valor)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(param.vigencia_inicio), "dd/MM/yyyy", { locale: ptBR })}
                        {param.vigencia_fim && (
                          <span>
                            {" → "}
                            {format(new Date(param.vigencia_fim), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={isVigente(param) ? "default" : "secondary"}>
                          {isVigente(param) ? "Vigente" : "Expirado"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(param)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
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
  );
}
