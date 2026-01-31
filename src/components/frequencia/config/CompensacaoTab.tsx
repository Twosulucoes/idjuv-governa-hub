import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit2, Loader2, Timer } from "lucide-react";
import { useConfigCompensacao, useSalvarCompensacao } from "@/hooks/useParametrizacoesFrequencia";
import type { ConfigCompensacao, AutorizadorCompensacao } from "@/types/frequencia";

const autorizadorOptions: { value: AutorizadorCompensacao; label: string }[] = [
  { value: 'chefia', label: 'Chefia Imediata' },
  { value: 'rh', label: 'RH' },
  { value: 'ambos', label: 'Chefia e RH' },
];

export function CompensacaoTab() {
  const { data: configs, isLoading } = useConfigCompensacao();
  const salvar = useSalvarCompensacao();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Partial<ConfigCompensacao> | null>(null);

  const handleNova = () => {
    setEditando({
      nome: '',
      permite_banco_horas: true,
      compensacao_automatica: false,
      compensacao_manual: true,
      prazo_compensar_dias: 90,
      limite_acumulo_horas: 40,
      limite_horas_extras_dia: 2,
      limite_horas_extras_mes: 40,
      quem_autoriza: 'chefia',
      exibe_na_frequencia: true,
      exibe_na_impressao: true,
      aplicar_a_todos: true,
      ativo: true,
      padrao: false,
    });
    setDialogOpen(true);
  };

  const handleEditar = (config: ConfigCompensacao) => {
    setEditando(config);
    setDialogOpen(true);
  };

  const handleSalvar = async () => {
    if (!editando?.nome) return;
    await salvar.mutateAsync(editando);
    setDialogOpen(false);
    setEditando(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Configure banco de horas, limites e regras de compensação.
        </p>
        <Button onClick={handleNova}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Configuração
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="text-center">Banco de Horas</TableHead>
                <TableHead className="text-center">Limite Acúmulo</TableHead>
                <TableHead className="text-center">Prazo Compensar</TableHead>
                <TableHead>Autorização</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {configs?.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">
                    {c.nome}
                    {c.padrao && <Badge variant="secondary" className="ml-2">Padrão</Badge>}
                  </TableCell>
                  <TableCell className="text-center">
                    {c.permite_banco_horas ? '✓' : '-'}
                  </TableCell>
                  <TableCell className="text-center">{c.limite_acumulo_horas}h</TableCell>
                  <TableCell className="text-center">{c.prazo_compensar_dias} dias</TableCell>
                  <TableCell>
                    {autorizadorOptions.find(a => a.value === c.quem_autoriza)?.label}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={c.ativo ? "default" : "secondary"}>
                      {c.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEditar(c)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!configs || configs.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhuma configuração de compensação cadastrada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5" />
              {editando?.id ? 'Editar Configuração' : 'Nova Configuração'}
            </DialogTitle>
          </DialogHeader>

          {editando && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome da Configuração</Label>
                <Input
                  value={editando.nome || ''}
                  onChange={(e) => setEditando({ ...editando, nome: e.target.value })}
                  placeholder="Ex: Compensação Padrão"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editando.permite_banco_horas !== false}
                    onCheckedChange={(v) => setEditando({ ...editando, permite_banco_horas: v })}
                  />
                  <Label>Permite banco de horas</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editando.compensacao_automatica || false}
                    onCheckedChange={(v) => setEditando({ ...editando, compensacao_automatica: v })}
                  />
                  <Label>Compensação automática pelo sistema</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editando.compensacao_manual !== false}
                    onCheckedChange={(v) => setEditando({ ...editando, compensacao_manual: v })}
                  />
                  <Label>Compensação manual (autorizada)</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prazo para compensar (dias)</Label>
                  <Input
                    type="number"
                    value={editando.prazo_compensar_dias || 90}
                    onChange={(e) => setEditando({ ...editando, prazo_compensar_dias: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Limite de acúmulo (horas)</Label>
                  <Input
                    type="number"
                    value={editando.limite_acumulo_horas || 40}
                    onChange={(e) => setEditando({ ...editando, limite_acumulo_horas: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Máx. horas extras/dia</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={editando.limite_horas_extras_dia || 2}
                    onChange={(e) => setEditando({ ...editando, limite_horas_extras_dia: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Máx. horas extras/mês</Label>
                  <Input
                    type="number"
                    value={editando.limite_horas_extras_mes || 40}
                    onChange={(e) => setEditando({ ...editando, limite_horas_extras_mes: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Quem autoriza compensação</Label>
                <Select
                  value={editando.quem_autoriza || 'chefia'}
                  onValueChange={(v) => setEditando({ ...editando, quem_autoriza: v as AutorizadorCompensacao })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {autorizadorOptions.map((a) => (
                      <SelectItem key={a.value} value={a.value}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editando.padrao || false}
                    onCheckedChange={(v) => setEditando({ ...editando, padrao: v })}
                  />
                  <Label>Configuração Padrão</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editando.ativo !== false}
                    onCheckedChange={(v) => setEditando({ ...editando, ativo: v })}
                  />
                  <Label>Ativo</Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} disabled={salvar.isPending || !editando?.nome}>
              {salvar.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
