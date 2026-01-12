import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search, Edit2, Trash2, Loader2 } from "lucide-react";
import { useRubricas, useDeleteRubrica } from "@/hooks/useFolhaPagamento";
import { RubricaForm } from "./RubricaForm";
import { TIPO_RUBRICA_LABELS, type TipoRubrica } from "@/types/folha";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const TIPO_COLORS: Record<TipoRubrica, string> = {
  provento: "bg-green-100 text-green-800",
  desconto: "bg-red-100 text-red-800",
  encargo: "bg-orange-100 text-orange-800",
  informativo: "bg-blue-100 text-blue-800",
};

interface RubricaData {
  id: string;
  codigo: string;
  descricao: string;
  tipo: TipoRubrica;
  incide_inss?: boolean;
  incide_irrf?: boolean;
  ativo?: boolean;
}

export function RubricasTab() {
  const { data: rubricas, isLoading } = useRubricas();
  const deleteRubrica = useDeleteRubrica();
  const [search, setSearch] = useState("");
  const [editingRubrica, setEditingRubrica] = useState<RubricaData | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filteredRubricas = rubricas?.filter(
    (r) =>
      r.codigo.toLowerCase().includes(search.toLowerCase()) ||
      r.descricao.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (rubrica: RubricaData) => {
    setEditingRubrica(rubrica);
    setIsFormOpen(true);
  };

  const handleNew = () => {
    setEditingRubrica(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingRubrica(null);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteRubrica.mutate(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Rubricas (Eventos)</CardTitle>
            <CardDescription>
              Gerencie os eventos de folha de pagamento (proventos e descontos)
            </CardDescription>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNew}>
                <Plus className="mr-2 h-4 w-4" />
                Nova Rubrica
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingRubrica ? "Editar Rubrica" : "Nova Rubrica"}
                </DialogTitle>
                <DialogDescription>
                  Preencha os dados do evento de folha de pagamento
                </DialogDescription>
              </DialogHeader>
              <RubricaForm 
                rubrica={editingRubrica} 
                onSuccess={handleFormClose}
                onCancel={handleFormClose}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por código ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Código</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="w-[120px]">Tipo</TableHead>
                  <TableHead className="w-[100px] text-center">INSS</TableHead>
                  <TableHead className="w-[100px] text-center">IRRF</TableHead>
                  <TableHead className="w-[80px] text-center">Ativo</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRubricas?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma rubrica encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRubricas?.map((rubrica) => (
                    <TableRow key={rubrica.id}>
                      <TableCell className="font-mono font-medium">
                        {rubrica.codigo}
                      </TableCell>
                      <TableCell>{rubrica.descricao}</TableCell>
                      <TableCell>
                        <Badge className={TIPO_COLORS[rubrica.tipo as TipoRubrica] || "bg-gray-100 text-gray-800"}>
                          {TIPO_RUBRICA_LABELS[rubrica.tipo as TipoRubrica] || rubrica.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {rubrica.incide_inss ? "✓" : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {rubrica.incide_irrf ? "✓" : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={rubrica.ativo ? "default" : "secondary"}>
                          {rubrica.ativo ? "Sim" : "Não"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(rubrica as RubricaData)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(rubrica.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta rubrica? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
