import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit2, Loader2, Landmark } from "lucide-react";
import { useBancosCNAB, useContasAutarquia } from "@/hooks/useFolhaPagamento";
import { ContaAutarquiaForm } from "./ContaAutarquiaForm";
import type { ContaAutarquia } from "@/types/folha";

export function BancosContasTab() {
  const { data: bancos, isLoading: loadingBancos } = useBancosCNAB();
  const { data: contas, isLoading: loadingContas } = useContasAutarquia();
  const [editingConta, setEditingConta] = useState<ContaAutarquia | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleEdit = (conta: ContaAutarquia) => {
    setEditingConta(conta);
    setIsFormOpen(true);
  };

  const handleNew = () => {
    setEditingConta(null);
    setIsFormOpen(true);
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingConta(null);
  };

  return (
    <div className="space-y-6">
      {/* Bancos Disponíveis */}
      <Card>
        <CardHeader>
          <CardTitle>Bancos Disponíveis</CardTitle>
          <CardDescription>
            Instituições financeiras configuradas para geração de arquivos CNAB
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingBancos ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Código</TableHead>
                    <TableHead>Nome do Banco</TableHead>
                    <TableHead className="text-center">CNAB 240</TableHead>
                    <TableHead className="text-center">CNAB 400</TableHead>
                    <TableHead className="w-[80px] text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bancos?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum banco cadastrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    bancos?.map((banco) => (
                      <TableRow key={banco.id}>
                        <TableCell className="font-mono font-medium">
                          {banco.codigo_banco}
                        </TableCell>
                        <TableCell>{banco.nome}</TableCell>
                        <TableCell className="text-center">
                          {banco.layout_cnab240 ? (
                            <Badge variant="outline" className="bg-green-50">Sim</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {banco.layout_cnab400 ? (
                            <Badge variant="outline" className="bg-green-50">Sim</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={banco.ativo ? "default" : "secondary"}>
                            {banco.ativo ? "Ativo" : "Inativo"}
                          </Badge>
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

      {/* Contas da Autarquia */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5" />
                Contas Bancárias da Autarquia
              </CardTitle>
              <CardDescription>
                Contas para pagamento de folha e geração de arquivos CNAB
              </CardDescription>
            </div>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleNew}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Conta
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingConta ? "Editar Conta" : "Nova Conta Bancária"}
                  </DialogTitle>
                  <DialogDescription>
                    Configure os dados da conta para geração de arquivos
                  </DialogDescription>
                </DialogHeader>
                <ContaAutarquiaForm
                  conta={editingConta}
                  onSuccess={handleFormClose}
                  onCancel={handleFormClose}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loadingContas ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Banco</TableHead>
                    <TableHead>Agência</TableHead>
                    <TableHead>Conta</TableHead>
                    <TableHead>Uso</TableHead>
                    <TableHead className="w-[80px] text-center">Status</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contas?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhuma conta cadastrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    contas?.map((conta) => (
                      <TableRow key={conta.id}>
                        <TableCell className="font-medium">{conta.descricao}</TableCell>
                        <TableCell>
                          {conta.banco 
                            ? `${conta.banco.codigo_banco} - ${conta.banco.nome}` 
                            : "-"}
                        </TableCell>
                        <TableCell className="font-mono">
                          {conta.agencia}
                          {conta.agencia_digito && `-${conta.agencia_digito}`}
                        </TableCell>
                        <TableCell className="font-mono">
                          {conta.conta}
                          {conta.conta_digito && `-${conta.conta_digito}`}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {conta.uso_principal || "-"}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={conta.ativo ? "default" : "secondary"}>
                            {conta.ativo ? "Ativa" : "Inativa"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(conta)}
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
    </div>
  );
}
