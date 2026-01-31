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
import { Plus, Edit2, Loader2, PenLine } from "lucide-react";
import { useConfigAssinatura, useSalvarAssinatura } from "@/hooks/useParametrizacoesFrequencia";
import type { ConfigAssinaturaFrequencia, TipoAssinatura, ValidadorFinal } from "@/types/frequencia";

const tipoAssinaturaOptions: { value: TipoAssinatura; label: string }[] = [
  { value: 'manual', label: 'Manual (impressa)' },
  { value: 'digital', label: 'Digital' },
  { value: 'ambas', label: 'Ambas' },
];

const validadorOptions: { value: ValidadorFinal; label: string }[] = [
  { value: 'servidor', label: 'Servidor' },
  { value: 'chefia', label: 'Chefia' },
  { value: 'rh', label: 'RH' },
];

export function AssinaturasTab() {
  const { data: configs, isLoading } = useConfigAssinatura();
  const salvar = useSalvarAssinatura();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editando, setEditando] = useState<Partial<ConfigAssinaturaFrequencia> | null>(null);

  const handleNova = () => {
    setEditando({
      nome: '',
      assinatura_servidor_obrigatoria: true,
      assinatura_chefia_obrigatoria: true,
      assinatura_rh_obrigatoria: false,
      tipo_assinatura: 'digital',
      ordem_assinaturas: ['servidor', 'chefia'],
      quem_valida_final: 'chefia',
      texto_declaracao: 'Declaro que as informações acima são verídicas e correspondem à minha efetiva jornada de trabalho no período.',
      ativo: true,
      padrao: false,
    });
    setDialogOpen(true);
  };

  const handleEditar = (config: ConfigAssinaturaFrequencia) => {
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
          Configure obrigatoriedade e tipo de assinaturas para validação da frequência.
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
                <TableHead>Tipo</TableHead>
                <TableHead className="text-center">Servidor</TableHead>
                <TableHead className="text-center">Chefia</TableHead>
                <TableHead className="text-center">RH</TableHead>
                <TableHead>Validação Final</TableHead>
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
                  <TableCell>
                    {tipoAssinaturaOptions.find(t => t.value === c.tipo_assinatura)?.label}
                  </TableCell>
                  <TableCell className="text-center">
                    {c.assinatura_servidor_obrigatoria ? '✓' : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    {c.assinatura_chefia_obrigatoria ? '✓' : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    {c.assinatura_rh_obrigatoria ? '✓' : '-'}
                  </TableCell>
                  <TableCell>
                    {validadorOptions.find(v => v.value === c.quem_valida_final)?.label}
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
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                    Nenhuma configuração de assinatura cadastrada.
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
              <PenLine className="h-5 w-5" />
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
                  placeholder="Ex: Assinatura Padrão"
                />
              </div>

              <div className="space-y-2">
                <Label>Tipo de Assinatura</Label>
                <Select
                  value={editando.tipo_assinatura || 'digital'}
                  onValueChange={(v) => setEditando({ ...editando, tipo_assinatura: v as TipoAssinatura })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {tipoAssinaturaOptions.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Assinaturas Obrigatórias</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editando.assinatura_servidor_obrigatoria !== false}
                    onCheckedChange={(v) => setEditando({ ...editando, assinatura_servidor_obrigatoria: v })}
                  />
                  <Label>Servidor</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editando.assinatura_chefia_obrigatoria !== false}
                    onCheckedChange={(v) => setEditando({ ...editando, assinatura_chefia_obrigatoria: v })}
                  />
                  <Label>Chefia</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editando.assinatura_rh_obrigatoria || false}
                    onCheckedChange={(v) => setEditando({ ...editando, assinatura_rh_obrigatoria: v })}
                  />
                  <Label>RH</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Quem valida documento final</Label>
                <Select
                  value={editando.quem_valida_final || 'chefia'}
                  onValueChange={(v) => setEditando({ ...editando, quem_valida_final: v as ValidadorFinal })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {validadorOptions.map((v) => (
                      <SelectItem key={v.value} value={v.value}>
                        {v.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Texto da Declaração</Label>
                <Textarea
                  value={editando.texto_declaracao || ''}
                  onChange={(e) => setEditando({ ...editando, texto_declaracao: e.target.value })}
                  rows={3}
                />
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
