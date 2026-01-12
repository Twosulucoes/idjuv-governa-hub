import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Loader2, Plus, Edit2, Trash2 } from "lucide-react";
import { useTabelaINSS, useTabelaIRRF, useDeleteFaixaINSS, useDeleteFaixaIRRF } from "@/hooks/useFolhaPagamento";
import { TabelaINSSForm } from "./TabelaINSSForm";
import { TabelaIRRFForm } from "./TabelaIRRFForm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FaixaINSSData {
  id: string;
  faixa_ordem: number;
  valor_minimo: number;
  valor_maximo: number;
  aliquota: number;
  vigencia_inicio: string;
  vigencia_fim?: string | null;
  descricao?: string | null;
}

interface FaixaIRRFData {
  id: string;
  faixa_ordem: number;
  valor_minimo: number;
  valor_maximo: number;
  aliquota: number;
  parcela_deduzir: number;
  vigencia_inicio: string;
  vigencia_fim?: string | null;
  descricao?: string | null;
}

export function TabelasImpostosTab() {
  const { data: tabelaINSS, isLoading: loadingINSS } = useTabelaINSS();
  const { data: tabelaIRRF, isLoading: loadingIRRF } = useTabelaIRRF();
  const deleteFaixaINSS = useDeleteFaixaINSS();
  const deleteFaixaIRRF = useDeleteFaixaIRRF();

  const [editingINSS, setEditingINSS] = useState<FaixaINSSData | null>(null);
  const [isINSSFormOpen, setIsINSSFormOpen] = useState(false);
  const [editingIRRF, setEditingIRRF] = useState<FaixaIRRFData | null>(null);
  const [isIRRFFormOpen, setIsIRRFFormOpen] = useState(false);

  const formatCurrency = (value: number | null | undefined) => {
    if (value == null) return "R$ 0,00";
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleNewINSS = () => {
    setEditingINSS(null);
    setIsINSSFormOpen(true);
  };

  const handleEditINSS = (faixa: FaixaINSSData) => {
    setEditingINSS(faixa);
    setIsINSSFormOpen(true);
  };

  const handleCloseINSS = () => {
    setIsINSSFormOpen(false);
    setEditingINSS(null);
  };

  const handleNewIRRF = () => {
    setEditingIRRF(null);
    setIsIRRFFormOpen(true);
  };

  const handleEditIRRF = (faixa: FaixaIRRFData) => {
    setEditingIRRF(faixa);
    setIsIRRFFormOpen(true);
  };

  const handleCloseIRRF = () => {
    setIsIRRFFormOpen(false);
    setEditingIRRF(null);
  };

  return (
    <div className="space-y-6">
      {/* Tabela INSS */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Tabela INSS Progressivo</CardTitle>
              <CardDescription>
                Faixas de contribuição previdenciária vigentes
              </CardDescription>
            </div>
            <Dialog open={isINSSFormOpen} onOpenChange={setIsINSSFormOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleNewINSS}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Faixa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingINSS ? "Editar Faixa INSS" : "Nova Faixa INSS"}
                  </DialogTitle>
                  <DialogDescription>
                    Configure os valores da faixa de contribuição
                  </DialogDescription>
                </DialogHeader>
                <TabelaINSSForm
                  faixa={editingINSS}
                  onSuccess={handleCloseINSS}
                  onCancel={handleCloseINSS}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loadingINSS ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Faixa</TableHead>
                    <TableHead className="text-right">De</TableHead>
                    <TableHead className="text-right">Até</TableHead>
                    <TableHead className="text-right">Alíquota</TableHead>
                    <TableHead>Vigência</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tabelaINSS?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhuma faixa cadastrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    tabelaINSS?.map((faixa, index) => (
                      <TableRow key={faixa.id}>
                        <TableCell className="font-medium">{index + 1}ª Faixa</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(faixa.valor_minimo)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {faixa.valor_maximo >= 99999999
                            ? "Sem limite"
                            : formatCurrency(faixa.valor_maximo)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {faixa.aliquota.toFixed(2)}%
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          A partir de{" "}
                          {format(new Date(faixa.vigencia_inicio), "MMM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditINSS(faixa as FaixaINSSData)}
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
                                  <AlertDialogTitle>Excluir Faixa INSS?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. A faixa será removida permanentemente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteFaixaINSS.mutate(faixa.id)}
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
          <p className="text-xs text-muted-foreground mt-4">
            O cálculo do INSS é feito de forma progressiva: cada faixa incide apenas sobre a parcela do salário 
            que está dentro dela, similar ao IRRF.
          </p>
        </CardContent>
      </Card>

      {/* Tabela IRRF */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Tabela IRRF</CardTitle>
              <CardDescription>
                Faixas do Imposto de Renda Retido na Fonte vigentes
              </CardDescription>
            </div>
            <Dialog open={isIRRFFormOpen} onOpenChange={setIsIRRFFormOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleNewIRRF}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Faixa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingIRRF ? "Editar Faixa IRRF" : "Nova Faixa IRRF"}
                  </DialogTitle>
                  <DialogDescription>
                    Configure os valores da faixa de imposto de renda
                  </DialogDescription>
                </DialogHeader>
                <TabelaIRRFForm
                  faixa={editingIRRF}
                  onSuccess={handleCloseIRRF}
                  onCancel={handleCloseIRRF}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loadingIRRF ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Faixa</TableHead>
                    <TableHead className="text-right">De</TableHead>
                    <TableHead className="text-right">Até</TableHead>
                    <TableHead className="text-right">Alíquota</TableHead>
                    <TableHead className="text-right">Dedução</TableHead>
                    <TableHead>Vigência</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tabelaIRRF?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhuma faixa cadastrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    tabelaIRRF?.map((faixa, index) => (
                      <TableRow key={faixa.id}>
                        <TableCell className="font-medium">
                          {index === 0 ? "Isento" : `${index}ª Faixa`}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(faixa.valor_minimo)}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {faixa.valor_maximo >= 99999999
                            ? "Sem limite"
                            : formatCurrency(faixa.valor_maximo)}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {faixa.aliquota.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(faixa.parcela_deduzir)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          A partir de{" "}
                          {format(new Date(faixa.vigencia_inicio), "MMM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditIRRF(faixa as FaixaIRRFData)}
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
                                  <AlertDialogTitle>Excluir Faixa IRRF?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. A faixa será removida permanentemente.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteFaixaIRRF.mutate(faixa.id)}
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
          <p className="text-xs text-muted-foreground mt-4">
            Fórmula: IRRF = (Base de Cálculo × Alíquota) - Dedução - (Nº Dependentes × Dedução por Dependente)
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
