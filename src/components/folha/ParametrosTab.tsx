import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Edit2, Trash2, Loader2 } from "lucide-react";
import { useParametrosFolha, useDeleteParametro } from "@/hooks/useFolhaPagamento";
import { ParametroForm } from "./ParametroForm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ParametroData {
  id: string;
  tipo_parametro: string;
  valor: number;
  descricao?: string;
  vigencia_inicio: string;
  vigencia_fim?: string;
  ativo?: boolean;
}

export function ParametrosTab() {
  const { data: parametros, isLoading } = useParametrosFolha();
  const deleteParametro = useDeleteParametro();
  const [editingParametro, setEditingParametro] = useState<ParametroData | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleEdit = (param: ParametroData) => {
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

  const formatValue = (tipo: string, valor: number) => {
    if (tipo.includes("SALARIO") || tipo.includes("TETO") || tipo.includes("DEDUCAO")) {
      return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
    }
    if (tipo.includes("ALIQUOTA") || tipo.includes("PERCENTUAL")) {
      return `${valor}%`;
    }
    return valor.toString();
  };

  const isVigente = (param: ParametroData) => {
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
                  <TableHead className="w-[100px]"></TableHead>
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
                        {param.tipo_parametro}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {param.descricao || "-"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatValue(param.tipo_parametro, param.valor)}
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
                        <Badge variant={isVigente(param as ParametroData) ? "default" : "secondary"}>
                          {isVigente(param as ParametroData) ? "Vigente" : "Expirado"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(param as ParametroData)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir Parâmetro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. O parâmetro "{param.tipo_parametro}" será removido permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteParametro.mutate(param.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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
  );
}
