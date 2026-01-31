import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit2, Loader2, FileCheck } from "lucide-react";
import { useTiposAbono, useSalvarTipoAbono } from "@/hooks/useParametrizacoesFrequencia";
import type { TipoAbono } from "@/types/frequencia";

export function TiposAbonoTab() {
  const { data: tipos, isLoading } = useTiposAbono();
  const salvar = useSalvarTipoAbono();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Partial<TipoAbono> | null>(null);

  const handleNovo = () => {
    setEditando({
      codigo: '',
      nome: '',
      descricao: '',
      conta_como_presenca: true,
      exige_documento: false,
      exige_aprovacao_chefia: true,
      exige_aprovacao_rh: false,
      impacto_horas: 'neutro',
      ativo: true,
      ordem: 0,
    });
    setDialogOpen(true);
  };

  const handleEditar = (tipo: TipoAbono) => {
    setEditando(tipo);
    setDialogOpen(true);
  };

  const handleSalvar = async () => {
    if (!editando?.nome || !editando?.codigo) return;
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
          Configure os tipos de abono e justificativa aceitos pelo órgão.
        </p>
        <Button onClick={handleNovo}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Tipo
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead className="text-center">Conta Presença</TableHead>
                <TableHead className="text-center">Exige Documento</TableHead>
                <TableHead className="text-center">Aprovação Chefia</TableHead>
                <TableHead className="text-center">Aprovação RH</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tipos?.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono">{t.codigo}</TableCell>
                  <TableCell className="font-medium">{t.nome}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={t.conta_como_presenca ? "default" : "secondary"}>
                      {t.conta_como_presenca ? 'Sim' : 'Não'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {t.exige_documento ? '✓' : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    {t.exige_aprovacao_chefia ? '✓' : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    {t.exige_aprovacao_rh ? '✓' : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEditar(t)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!tipos || tipos.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum tipo de abono cadastrado.
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
              <FileCheck className="h-5 w-5" />
              {editando?.id ? 'Editar Tipo de Abono' : 'Novo Tipo de Abono'}
            </DialogTitle>
          </DialogHeader>

          {editando && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Código</Label>
                  <Input
                    value={editando.codigo || ''}
                    onChange={(e) => setEditando({ ...editando, codigo: e.target.value.toUpperCase() })}
                    placeholder="CAPACITACAO"
                    maxLength={20}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={editando.nome || ''}
                    onChange={(e) => setEditando({ ...editando, nome: e.target.value })}
                    placeholder="Capacitação"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  value={editando.descricao || ''}
                  onChange={(e) => setEditando({ ...editando, descricao: e.target.value })}
                  placeholder="Descreva quando este abono deve ser utilizado..."
                  rows={2}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editando.conta_como_presenca !== false}
                    onCheckedChange={(v) => setEditando({ ...editando, conta_como_presenca: v })}
                  />
                  <Label>Conta como dia de presença</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editando.exige_documento || false}
                    onCheckedChange={(v) => setEditando({ ...editando, exige_documento: v })}
                  />
                  <Label>Exige documento comprobatório</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editando.exige_aprovacao_chefia !== false}
                    onCheckedChange={(v) => setEditando({ ...editando, exige_aprovacao_chefia: v })}
                  />
                  <Label>Exige aprovação da chefia</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editando.exige_aprovacao_rh || false}
                    onCheckedChange={(v) => setEditando({ ...editando, exige_aprovacao_rh: v })}
                  />
                  <Label>Exige aprovação do RH</Label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Máx. horas/dia (opcional)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={editando.max_horas_dia || ''}
                    onChange={(e) => setEditando({ ...editando, max_horas_dia: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Ex: 4"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Máx. ocorrências/mês (opcional)</Label>
                  <Input
                    type="number"
                    value={editando.max_ocorrencias_mes || ''}
                    onChange={(e) => setEditando({ ...editando, max_ocorrencias_mes: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="Ex: 2"
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} disabled={salvar.isPending || !editando?.nome || !editando?.codigo}>
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
