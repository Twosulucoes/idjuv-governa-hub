import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit2, Loader2, Briefcase } from "lucide-react";
import { useRegimesTrabalho, useSalvarRegime } from "@/hooks/useParametrizacoesFrequencia";
import type { RegimeTrabalho, TipoRegime } from "@/types/frequencia";
import { TIPO_REGIME_LABELS, DIAS_SEMANA_SIGLA } from "@/types/frequencia";

const tipoOptions: TipoRegime[] = ['presencial', 'teletrabalho', 'hibrido', 'plantao', 'escala'];

export function RegimesTab() {
  const { data: regimes, isLoading } = useRegimesTrabalho();
  const salvar = useSalvarRegime();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Partial<RegimeTrabalho> | null>(null);

  const handleNovo = () => {
    setEditando({
      codigo: '',
      nome: '',
      tipo: 'presencial',
      dias_trabalho: [1, 2, 3, 4, 5],
      exige_registro_ponto: true,
      exige_assinatura_servidor: true,
      exige_validacao_chefia: true,
      permite_ponto_remoto: false,
      ativo: true,
    });
    setDialogOpen(true);
  };

  const handleEditar = (regime: RegimeTrabalho) => {
    setEditando(regime);
    setDialogOpen(true);
  };

  const handleSalvar = async () => {
    if (!editando?.nome || !editando?.codigo) return;
    await salvar.mutateAsync(editando);
    setDialogOpen(false);
    setEditando(null);
  };

  const toggleDia = (dia: number) => {
    const dias = editando?.dias_trabalho || [];
    const novos = dias.includes(dia)
      ? dias.filter(d => d !== dia)
      : [...dias, dia].sort();
    setEditando({ ...editando, dias_trabalho: novos });
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
          Configure regimes de trabalho: presencial, teletrabalho, híbrido, plantão, etc.
        </p>
        <Button onClick={handleNovo}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Regime
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Dias de Trabalho</TableHead>
                <TableHead className="text-center">Requisitos</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regimes?.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono">{r.codigo}</TableCell>
                  <TableCell className="font-medium">{r.nome}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{TIPO_REGIME_LABELS[r.tipo]}</Badge>
                  </TableCell>
                  <TableCell>
                    {r.dias_trabalho?.map(d => DIAS_SEMANA_SIGLA[d]).join(', ')}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {r.exige_registro_ponto && <Badge variant="secondary" className="mr-1">Ponto</Badge>}
                    {r.permite_ponto_remoto && <Badge variant="secondary">Remoto</Badge>}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={r.ativo ? "default" : "secondary"}>
                      {r.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEditar(r)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!regimes || regimes.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum regime configurado.
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
              <Briefcase className="h-5 w-5" />
              {editando?.id ? 'Editar Regime' : 'Novo Regime'}
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
                    placeholder="PRESENCIAL"
                    maxLength={20}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={editando.nome || ''}
                    onChange={(e) => setEditando({ ...editando, nome: e.target.value })}
                    placeholder="Presencial"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tipo de Regime</Label>
                <Select
                  value={editando.tipo || 'presencial'}
                  onValueChange={(v) => setEditando({ ...editando, tipo: v as TipoRegime })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tipoOptions.map((t) => (
                      <SelectItem key={t} value={t}>
                        {TIPO_REGIME_LABELS[t]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Dias de Trabalho</Label>
                <div className="flex gap-2 flex-wrap">
                  {[0, 1, 2, 3, 4, 5, 6].map((dia) => (
                    <div key={dia} className="flex items-center gap-1">
                      <Checkbox
                        checked={editando.dias_trabalho?.includes(dia)}
                        onCheckedChange={() => toggleDia(dia)}
                      />
                      <Label className="text-sm">{DIAS_SEMANA_SIGLA[dia]}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Requisitos</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editando.exige_registro_ponto !== false}
                      onCheckedChange={(v) => setEditando({ ...editando, exige_registro_ponto: v })}
                    />
                    <Label>Exige registro de ponto</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editando.exige_assinatura_servidor !== false}
                      onCheckedChange={(v) => setEditando({ ...editando, exige_assinatura_servidor: v })}
                    />
                    <Label>Exige assinatura do servidor</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editando.exige_validacao_chefia !== false}
                      onCheckedChange={(v) => setEditando({ ...editando, exige_validacao_chefia: v })}
                    />
                    <Label>Exige validação da chefia</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editando.permite_ponto_remoto || false}
                      onCheckedChange={(v) => setEditando({ ...editando, permite_ponto_remoto: v })}
                    />
                    <Label>Permite ponto remoto</Label>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={editando.ativo !== false}
                  onCheckedChange={(v) => setEditando({ ...editando, ativo: v })}
                />
                <Label>Ativo</Label>
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
