import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Edit2, Loader2, Clock } from "lucide-react";
import { useConfigJornadas, useSalvarJornada } from "@/hooks/useParametrizacoesFrequencia";
import type { ConfigJornadaPadrao, EscopoJornada } from "@/types/frequencia";
import { ESCOPO_JORNADA_LABELS } from "@/types/frequencia";

const escopoOptions: EscopoJornada[] = ['orgao', 'unidade', 'cargo', 'servidor'];

export function JornadaTab() {
  const { data: jornadas, isLoading } = useConfigJornadas();
  const salvar = useSalvarJornada();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Partial<ConfigJornadaPadrao> | null>(null);

  const isJornadaCurta = (carga?: number) => (carga ?? 8) <= 6;

  const aplicarRegraJornadaCurta = (base: Partial<ConfigJornadaPadrao>) => {
    // REGRA: jornada <= 6h não tem 2º turno e não tem intervalo.
    if (!isJornadaCurta(base.carga_horaria_diaria)) return base;
    return {
      ...base,
      entrada_tarde: undefined,
      saida_tarde: undefined,
      intervalo_minimo: 0,
      intervalo_maximo: 0,
      intervalo_obrigatorio: false,
    };
  };

  const handleNova = () => {
    setEditando(aplicarRegraJornadaCurta({
      nome: '',
      carga_horaria_diaria: 8,
      carga_horaria_semanal: 40,
      entrada_manha: '08:00',
      saida_manha: '12:00',
      entrada_tarde: '14:00',
      saida_tarde: '18:00',
      intervalo_minimo: 60,
      intervalo_maximo: 120,
      intervalo_obrigatorio: true,
      tolerancia_atraso: 10,
      tolerancia_saida_antecipada: 10,
      escopo: 'orgao',
      ativo: true,
      padrao: false,
    }));
    setDialogOpen(true);
  };

  const handleEditar = (jornada: ConfigJornadaPadrao) => {
    setEditando(aplicarRegraJornadaCurta(jornada));
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
          Configure jornadas de trabalho por órgão, unidade, cargo ou servidor.
        </p>
        <Button onClick={handleNova}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Jornada
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Escopo</TableHead>
                <TableHead className="text-center">Carga Diária</TableHead>
                <TableHead className="text-center">Carga Semanal</TableHead>
                <TableHead>Horário</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jornadas?.map((j) => (
                <TableRow key={j.id}>
                  <TableCell className="font-medium">
                    {j.nome}
                    {j.padrao && (
                      <Badge variant="secondary" className="ml-2">Padrão</Badge>
                    )}
                  </TableCell>
                  <TableCell>{ESCOPO_JORNADA_LABELS[j.escopo]}</TableCell>
                  <TableCell className="text-center">{j.carga_horaria_diaria}h</TableCell>
                  <TableCell className="text-center">{j.carga_horaria_semanal}h</TableCell>
                  <TableCell className="text-sm">
                    {isJornadaCurta(j.carga_horaria_diaria)
                      ? `${j.entrada_manha?.slice(0, 5)} - ${j.saida_manha?.slice(0, 5)}`
                      : `${j.entrada_manha?.slice(0, 5)} - ${j.saida_manha?.slice(0, 5)} / ${j.entrada_tarde?.slice(0, 5)} - ${j.saida_tarde?.slice(0, 5)}`}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={j.ativo ? "default" : "secondary"}>
                      {j.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEditar(j)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {(!jornadas || jornadas.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhuma jornada configurada.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {editando?.id ? 'Editar Jornada' : 'Nova Jornada'}
            </DialogTitle>
          </DialogHeader>

          {editando && (
            <div className="space-y-6">
              {isJornadaCurta(editando.carga_horaria_diaria) && (
                <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                  Regra aplicada: jornada ≤ 6h não possui 2º turno e nem intervalo.
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label>Nome da Configuração</Label>
                  <Input
                    value={editando.nome || ''}
                    onChange={(e) => setEditando({ ...editando, nome: e.target.value })}
                    placeholder="Ex: Jornada Padrão"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Escopo de Aplicação</Label>
                  <Select
                    value={editando.escopo || 'orgao'}
                    onValueChange={(v) => setEditando({ ...editando, escopo: v as EscopoJornada })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {escopoOptions.map((e) => (
                        <SelectItem key={e} value={e}>
                          {ESCOPO_JORNADA_LABELS[e]}
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
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Carga Horária Diária (horas)</Label>
                  <Input
                    type="number"
                    value={editando.carga_horaria_diaria || 8}
                    onChange={(e) => {
                      const carga = Number(e.target.value);
                      setEditando(aplicarRegraJornadaCurta({ ...editando, carga_horaria_diaria: carga }));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Carga Horária Semanal (horas)</Label>
                  <Input
                    type="number"
                    value={editando.carga_horaria_semanal || 40}
                    onChange={(e) => setEditando({ ...editando, carga_horaria_semanal: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>{isJornadaCurta(editando.carga_horaria_diaria) ? 'Entrada' : 'Entrada Manhã'}</Label>
                  <Input
                    type="time"
                    value={editando.entrada_manha || '08:00'}
                    onChange={(e) => setEditando({ ...editando, entrada_manha: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{isJornadaCurta(editando.carga_horaria_diaria) ? 'Saída' : 'Saída Manhã'}</Label>
                  <Input
                    type="time"
                    value={editando.saida_manha || '12:00'}
                    onChange={(e) => setEditando({ ...editando, saida_manha: e.target.value })}
                  />
                </div>
                {!isJornadaCurta(editando.carga_horaria_diaria) && (
                  <>
                    <div className="space-y-2">
                      <Label>Entrada Tarde</Label>
                      <Input
                        type="time"
                        value={editando.entrada_tarde || '14:00'}
                        onChange={(e) => setEditando({ ...editando, entrada_tarde: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Saída Tarde</Label>
                      <Input
                        type="time"
                        value={editando.saida_tarde || '18:00'}
                        onChange={(e) => setEditando({ ...editando, saida_tarde: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                {!isJornadaCurta(editando.carga_horaria_diaria) && (
                  <div className="space-y-2">
                    <Label>Intervalo Mínimo (min)</Label>
                    <Input
                      type="number"
                      value={editando.intervalo_minimo ?? 60}
                      onChange={(e) => setEditando({ ...editando, intervalo_minimo: Number(e.target.value) })}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Tolerância Atraso (min)</Label>
                  <Input
                    type="number"
                    value={editando.tolerancia_atraso || 10}
                    onChange={(e) => setEditando({ ...editando, tolerancia_atraso: Number(e.target.value) })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tolerância Saída (min)</Label>
                  <Input
                    type="number"
                    value={editando.tolerancia_saida_antecipada || 10}
                    onChange={(e) => setEditando({ ...editando, tolerancia_saida_antecipada: Number(e.target.value) })}
                  />
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
