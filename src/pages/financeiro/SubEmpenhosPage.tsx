/**
 * Página de Sub-Empenhos (Reforço / Anulação)
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, TrendingUp, TrendingDown, Search } from 'lucide-react';
import { ModuleLayout } from '@/components/layout';
import { useEmpenhos } from '@/hooks/useFinanceiro';
import { useSubEmpenhos, useCriarSubEmpenho } from '@/hooks/useSubEmpenhos';
import { TIPO_SUB_EMPENHO_LABELS } from '@/types/financeiro';

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

export default function SubEmpenhosPage() {
  const [empenhoSelecionado, setEmpenhoSelecionado] = useState<string>('');
  const [busca, setBusca] = useState('');
  const [novoDialog, setNovoDialog] = useState(false);
  const [tipo, setTipo] = useState<'reforco' | 'anulacao'>('reforco');
  const [valor, setValor] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [docReferencia, setDocReferencia] = useState('');

  const { data: empenhos } = useEmpenhos();
  const { data: subEmpenhos, isLoading } = useSubEmpenhos(empenhoSelecionado || undefined);
  const criarSubEmpenho = useCriarSubEmpenho();

  const empenhosFiltrados = empenhos?.filter((e) =>
    !busca || e.numero.toLowerCase().includes(busca.toLowerCase()) || e.objeto.toLowerCase().includes(busca.toLowerCase())
  );

  const empenhoAtual = empenhos?.find((e) => e.id === empenhoSelecionado);

  const handleCriar = () => {
    if (!empenhoSelecionado || !valor || !justificativa) return;
    criarSubEmpenho.mutate({
      empenho_id: empenhoSelecionado,
      tipo,
      valor: Number(valor),
      justificativa,
      documento_referencia: docReferencia || undefined,
    }, {
      onSuccess: () => {
        setNovoDialog(false);
        setValor('');
        setJustificativa('');
        setDocReferencia('');
      },
    });
  };

  const totalReforcos = subEmpenhos?.filter(s => s.tipo === 'reforco').reduce((sum, s) => sum + s.valor, 0) || 0;
  const totalAnulacoes = subEmpenhos?.filter(s => s.tipo === 'anulacao').reduce((sum, s) => sum + s.valor, 0) || 0;

  return (
    <ModuleLayout module="financeiro">
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sub-Empenhos</h1>
        <p className="text-muted-foreground">Reforço e anulação de empenhos</p>
      </div>

      {/* Seleção do Empenho */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Selecionar Empenho</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por número ou objeto..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="max-h-48 overflow-y-auto border rounded-md">
            {empenhosFiltrados?.slice(0, 20).map((e) => (
              <button
                key={e.id}
                onClick={() => setEmpenhoSelecionado(e.id)}
                className={`w-full text-left px-4 py-2 hover:bg-muted/50 border-b last:border-b-0 text-sm ${
                  e.id === empenhoSelecionado ? 'bg-primary/10 font-medium' : ''
                }`}
              >
                <span className="font-mono">{e.numero}</span>
                <span className="mx-2 text-muted-foreground">•</span>
                <span className="text-muted-foreground truncate">{e.objeto}</span>
                <span className="float-right">{formatCurrency(e.valor_empenhado)}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {empenhoAtual && (
        <>
          {/* Info do Empenho + Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground">Valor Original</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{formatCurrency(empenhoAtual.valor_empenhado)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-green-500" /> Reforços
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-green-600">{formatCurrency(totalReforcos)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-1">
                  <TrendingDown className="h-4 w-4 text-red-500" /> Anulações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold text-red-600">{formatCurrency(totalAnulacoes)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Botão + Tabela */}
          <div className="flex justify-end">
            <Button onClick={() => setNovoDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Sub-Empenho
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Justificativa</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Carregando...</TableCell>
                    </TableRow>
                  ) : !subEmpenhos?.length ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhum sub-empenho registrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    subEmpenhos.map((se) => (
                      <TableRow key={se.id}>
                        <TableCell className="font-mono text-sm">{se.numero}</TableCell>
                        <TableCell>
                          <Badge className={se.tipo === 'reforco' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {TIPO_SUB_EMPENHO_LABELS[se.tipo]}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(se.data_registro).toLocaleDateString('pt-BR')}</TableCell>
                        <TableCell className="text-right font-mono">{formatCurrency(se.valor)}</TableCell>
                        <TableCell className="max-w-xs truncate">{se.justificativa}</TableCell>
                        <TableCell>
                          <Badge variant={se.status === 'ativo' ? 'default' : 'secondary'}>{se.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Dialog Novo Sub-Empenho */}
      <Dialog open={novoDialog} onOpenChange={setNovoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Sub-Empenho</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tipo *</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reforco">Reforço</SelectItem>
                  <SelectItem value="anulacao">Anulação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor (R$) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
              />
            </div>
            <div>
              <Label>Justificativa *</Label>
              <Textarea
                value={justificativa}
                onChange={(e) => setJustificativa(e.target.value)}
                placeholder="Informe a justificativa..."
                rows={3}
              />
            </div>
            <div>
              <Label>Documento de Referência</Label>
              <Input
                value={docReferencia}
                onChange={(e) => setDocReferencia(e.target.value)}
                placeholder="Ex: Ofício nº 123/2026"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNovoDialog(false)}>Cancelar</Button>
            <Button
              onClick={handleCriar}
              disabled={!valor || !justificativa || criarSubEmpenho.isPending}
            >
              {criarSubEmpenho.isPending ? 'Registrando...' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </ModuleLayout>
  );
}
