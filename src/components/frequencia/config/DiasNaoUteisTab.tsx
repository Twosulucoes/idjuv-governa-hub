import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Loader2, Calendar } from "lucide-react";
import { useDiasNaoUteis, useSalvarDiaNaoUtil, useExcluirDiaNaoUtil } from "@/hooks/useParametrizacoesFrequencia";
import type { DiaNaoUtil, TipoDiaNaoUtil } from "@/types/frequencia";
import { TIPO_DIA_NAO_UTIL_LABELS } from "@/types/frequencia";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const tipoOptions: TipoDiaNaoUtil[] = [
  'feriado_nacional', 'feriado_estadual', 'feriado_municipal',
  'ponto_facultativo', 'recesso', 'suspensao_expediente', 'expediente_reduzido'
];

export function DiasNaoUteisTab() {
  const anoAtual = new Date().getFullYear();
  const [ano, setAno] = useState(anoAtual);
  
  const { data: dias, isLoading } = useDiasNaoUteis(ano);
  const salvar = useSalvarDiaNaoUtil();
  const excluir = useExcluirDiaNaoUtil();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Partial<DiaNaoUtil> | null>(null);

  const handleNovo = () => {
    setEditando({
      data: format(new Date(), 'yyyy-MM-dd'),
      nome: '',
      tipo: 'feriado_nacional',
      conta_frequencia: false,
      exige_compensacao: false,
      recorrente: false,
      abrangencia: 'todas',
      ativo: true,
    });
    setDialogOpen(true);
  };

  const handleEditar = (dia: DiaNaoUtil) => {
    setEditando(dia);
    setDialogOpen(true);
  };

  const handleSalvar = async () => {
    if (!editando?.nome || !editando?.data) return;
    await salvar.mutateAsync(editando);
    setDialogOpen(false);
    setEditando(null);
  };

  const handleExcluir = async (id: string) => {
    if (confirm('Deseja realmente excluir este dia não útil?')) {
      await excluir.mutateAsync(id);
    }
  };

  const anos = Array.from({ length: 5 }, (_, i) => anoAtual + 1 - i);

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
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Feriados, recessos, pontos facultativos e outros dias não úteis.
          </p>
          <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {anos.map((a) => (
                <SelectItem key={a} value={String(a)}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleNovo}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Dia
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-center">Conta Frequência</TableHead>
                <TableHead className="text-center">Exige Compensação</TableHead>
                <TableHead className="text-center">Recorrente</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dias?.filter(d => d.ativo).map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono">
                    {format(new Date(d.data + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell className="font-medium">{d.nome}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{TIPO_DIA_NAO_UTIL_LABELS[d.tipo]}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {d.conta_frequencia ? '✓' : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    {d.exige_compensacao ? '✓' : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    {d.recorrente ? '✓' : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEditar(d)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleExcluir(d.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!dias || dias.filter(d => d.ativo).length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum dia não útil cadastrado para {ano}.
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
              <Calendar className="h-5 w-5" />
              {editando?.id ? 'Editar Dia Não Útil' : 'Novo Dia Não Útil'}
            </DialogTitle>
          </DialogHeader>

          {editando && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data</Label>
                  <Input
                    type="date"
                    value={editando.data || ''}
                    onChange={(e) => setEditando({ ...editando, data: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={editando.tipo || 'feriado_nacional'}
                    onValueChange={(v) => setEditando({ ...editando, tipo: v as TipoDiaNaoUtil })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tipoOptions.map((t) => (
                        <SelectItem key={t} value={t}>
                          {TIPO_DIA_NAO_UTIL_LABELS[t]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Nome / Descrição</Label>
                <Input
                  value={editando.nome || ''}
                  onChange={(e) => setEditando({ ...editando, nome: e.target.value })}
                  placeholder="Ex: Dia da Independência"
                />
              </div>

              {editando.tipo === 'expediente_reduzido' && (
                <div className="space-y-2">
                  <Label>Horas de Expediente</Label>
                  <Input
                    type="number"
                    step="0.5"
                    value={editando.horas_expediente || 4}
                    onChange={(e) => setEditando({ ...editando, horas_expediente: Number(e.target.value) })}
                  />
                </div>
              )}

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editando.conta_frequencia || false}
                    onCheckedChange={(v) => setEditando({ ...editando, conta_frequencia: v })}
                  />
                  <Label>Conta como dia trabalhado na frequência</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editando.exige_compensacao || false}
                    onCheckedChange={(v) => setEditando({ ...editando, exige_compensacao: v })}
                  />
                  <Label>Exige compensação posterior</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editando.recorrente || false}
                    onCheckedChange={(v) => setEditando({ ...editando, recorrente: v })}
                  />
                  <Label>Recorrente (repete todo ano)</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Observação</Label>
                <Textarea
                  value={editando.observacao || ''}
                  onChange={(e) => setEditando({ ...editando, observacao: e.target.value })}
                  placeholder="Observações adicionais..."
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} disabled={salvar.isPending || !editando?.nome || !editando?.data}>
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
