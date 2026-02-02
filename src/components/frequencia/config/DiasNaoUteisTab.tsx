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
import { Plus, Edit2, Trash2, Loader2, Calendar, MapPin, FileText, Filter } from "lucide-react";
import { useDiasNaoUteis, useSalvarDiaNaoUtil, useExcluirDiaNaoUtil } from "@/hooks/useParametrizacoesFrequencia";
import type { DiaNaoUtil, TipoDiaNaoUtil, EsferaDiaNaoUtil } from "@/types/frequencia";
import { TIPO_DIA_NAO_UTIL_LABELS, ESFERA_DIA_NAO_UTIL_LABELS } from "@/types/frequencia";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const tipoOptions: TipoDiaNaoUtil[] = [
  'feriado_nacional', 'feriado_estadual', 'feriado_municipal',
  'ponto_facultativo', 'recesso', 'suspensao_expediente', 'expediente_reduzido'
];

const esferaOptions: EsferaDiaNaoUtil[] = ['nacional', 'estadual', 'municipal', 'institucional'];

const UF_OPTIONS = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
];

export function DiasNaoUteisTab() {
  const anoAtual = new Date().getFullYear();
  const [ano, setAno] = useState(anoAtual);
  const [filtroEsfera, setFiltroEsfera] = useState<string>('todas');
  const [filtroTipo, setFiltroTipo] = useState<string>('todos');
  
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
      esfera: 'nacional',
      uf: 'RR',
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
    if (confirm('Deseja realmente inativar este dia não útil? O registro será mantido para fins de histórico.')) {
      await excluir.mutateAsync(id);
    }
  };

  const anos = Array.from({ length: 5 }, (_, i) => anoAtual + 1 - i);

  // Aplicar filtros
  const diasFiltrados = dias?.filter(d => {
    if (!d.ativo) return false;
    if (filtroEsfera !== 'todas' && d.esfera !== filtroEsfera) return false;
    if (filtroTipo !== 'todos' && d.tipo !== filtroTipo) return false;
    return true;
  });

  // Agrupar por mês para melhor visualização
  const diasPorMes = diasFiltrados?.reduce((acc, dia) => {
    const mes = new Date(dia.data + 'T12:00:00').getMonth();
    if (!acc[mes]) acc[mes] = [];
    acc[mes].push(dia);
    return acc;
  }, {} as Record<number, DiaNaoUtil[]>);

  const getEsferaBadgeVariant = (esfera?: EsferaDiaNaoUtil) => {
    switch (esfera) {
      case 'nacional': return 'default';
      case 'estadual': return 'secondary';
      case 'municipal': return 'outline';
      default: return 'outline';
    }
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
      {/* Cabeçalho com filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-3">
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

          <Select value={filtroEsfera} onValueChange={setFiltroEsfera}>
            <SelectTrigger className="w-[140px]">
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Esfera" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas esferas</SelectItem>
              {esferaOptions.map((e) => (
                <SelectItem key={e} value={e}>{ESFERA_DIA_NAO_UTIL_LABELS[e]}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filtroTipo} onValueChange={setFiltroTipo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              {tipoOptions.map((t) => (
                <SelectItem key={t} value={t}>{TIPO_DIA_NAO_UTIL_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleNovo}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Dia
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">
              {dias?.filter(d => d.ativo && d.esfera === 'nacional').length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Feriados Nacionais</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-secondary-foreground">
              {dias?.filter(d => d.ativo && d.esfera === 'estadual').length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Feriados Estaduais</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-muted-foreground">
              {dias?.filter(d => d.ativo && d.tipo === 'ponto_facultativo').length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Pontos Facultativos</div>
          </CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">
              {diasFiltrados?.length || 0}
            </div>
            <div className="text-sm text-muted-foreground">Total no Filtro</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Esfera</TableHead>
                <TableHead className="text-center">Frequência</TableHead>
                <TableHead className="text-center">Recorrente</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {diasFiltrados?.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-mono">
                    {format(new Date(d.data + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">{d.nome}</span>
                      {d.fundamentacao_legal && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <FileText className="h-3 w-3" />
                          <span className="truncate max-w-[200px]">{d.fundamentacao_legal}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{TIPO_DIA_NAO_UTIL_LABELS[d.tipo]}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getEsferaBadgeVariant(d.esfera)}>
                      {d.esfera ? ESFERA_DIA_NAO_UTIL_LABELS[d.esfera] : 'N/A'}
                    </Badge>
                    {(d.esfera === 'estadual' || d.esfera === 'municipal') && d.uf && (
                      <span className="ml-1 text-xs text-muted-foreground">({d.uf})</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    {d.conta_frequencia ? '✓' : '-'}
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
              {(!diasFiltrados || diasFiltrados.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum dia não útil cadastrado para {ano} com os filtros selecionados.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Edição */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {editando?.id ? 'Editar Dia Não Útil' : 'Novo Dia Não Útil'}
            </DialogTitle>
          </DialogHeader>

          {editando && (
            <div className="space-y-6">
              {/* Dados básicos */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Data *</Label>
                  <Input
                    type="date"
                    value={editando.data || ''}
                    onChange={(e) => setEditando({ ...editando, data: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select
                    value={editando.tipo || 'feriado_nacional'}
                    onValueChange={(v) => {
                      const tipo = v as TipoDiaNaoUtil;
                      // Auto-selecionar esfera baseado no tipo
                      let esfera = editando.esfera;
                      if (tipo === 'feriado_nacional') esfera = 'nacional';
                      else if (tipo === 'feriado_estadual') esfera = 'estadual';
                      else if (tipo === 'feriado_municipal') esfera = 'municipal';
                      setEditando({ ...editando, tipo, esfera });
                    }}
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
                <Label>Nome / Descrição *</Label>
                <Input
                  value={editando.nome || ''}
                  onChange={(e) => setEditando({ ...editando, nome: e.target.value })}
                  placeholder="Ex: Dia da Independência"
                />
              </div>

              {/* Esfera e Localidade */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Esfera
                  </Label>
                  <Select
                    value={editando.esfera || 'nacional'}
                    onValueChange={(v) => setEditando({ ...editando, esfera: v as EsferaDiaNaoUtil })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {esferaOptions.map((e) => (
                        <SelectItem key={e} value={e}>
                          {ESFERA_DIA_NAO_UTIL_LABELS[e]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {(editando.esfera === 'estadual' || editando.esfera === 'municipal') && (
                  <div className="space-y-2">
                    <Label>UF</Label>
                    <Select
                      value={editando.uf || 'RR'}
                      onValueChange={(v) => setEditando({ ...editando, uf: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UF_OPTIONS.map((uf) => (
                          <SelectItem key={uf.value} value={uf.value}>
                            {uf.value} - {uf.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {editando.esfera === 'municipal' && (
                  <div className="space-y-2">
                    <Label>Município</Label>
                    <Input
                      value={editando.municipio || ''}
                      onChange={(e) => setEditando({ ...editando, municipio: e.target.value })}
                      placeholder="Ex: Boa Vista"
                    />
                  </div>
                )}
              </div>

              {/* Expediente reduzido */}
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

              {/* Opções */}
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
                  <Label>Recorrente (repete todo ano na mesma data)</Label>
                </div>
              </div>

              {/* Fundamentação Legal */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Fundamentação Legal
                </Label>
                <Input
                  value={editando.fundamentacao_legal || ''}
                  onChange={(e) => setEditando({ ...editando, fundamentacao_legal: e.target.value })}
                  placeholder="Ex: Lei Federal nº 662/1949"
                />
                <p className="text-xs text-muted-foreground">
                  Informe a lei, decreto ou portaria que fundamenta este dia não útil
                </p>
              </div>

              {/* Observação */}
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
