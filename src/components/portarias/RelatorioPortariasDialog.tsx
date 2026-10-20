import { useState } from 'react';
import {
  FileText,
  Download,
  Settings2,
  BarChart3,
  Users,
  Building2,
  Calendar,
  Loader2,
  ChevronDown,
  ChevronUp,
  Check,
  Layers,
} from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { Portaria, STATUS_PORTARIA_LABELS, CategoriaPortaria, StatusPortaria } from '@/types/portaria';
import { toast } from 'sonner';
import {
  AGRUPAMENTO_ROTULOS,
  COLUNAS_RELATORIO_PORTARIAS as COLUNAS_DISPONIVEIS,
  filtrarPortarias,
  gerarRelatorioPortariasPDF,
  type AgrupamentoPortarias as AgrupamentoTipo,
  type ConfiguracaoRelatorioPortarias as ConfiguracaoRelatorio,
} from '@/lib/relatorioPortarias';

interface RelatorioPortariasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portarias: Portaria[];
}

const ICONES_AGRUPAMENTO: Record<AgrupamentoTipo, React.ReactNode> = {
  nenhum: <FileText className="h-4 w-4" />,
  status: <BarChart3 className="h-4 w-4" />,
  categoria: <Layers className="h-4 w-4" />,
  unidade: <Building2 className="h-4 w-4" />,
  mes: <Calendar className="h-4 w-4" />,
  servidor: <Users className="h-4 w-4" />,
};

const AGRUPAMENTOS = (Object.keys(AGRUPAMENTO_ROTULOS) as AgrupamentoTipo[]).map((value) => ({
  value,
  label: AGRUPAMENTO_ROTULOS[value],
  icon: ICONES_AGRUPAMENTO[value],
}));

export function RelatorioPortariasDialog({
  open,
  onOpenChange,
  portarias,
}: RelatorioPortariasDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [configOpen, setConfigOpen] = useState(true);
  
  // Cabeçalho, logos e rodapé vêm do motor de documentos (identidade do tenant); o subtítulo é opcional.
  const [config, setConfig] = useState<ConfiguracaoRelatorio>({
    titulo: 'RELATÓRIO DE PORTARIAS',
    subtitulo: '',
    agrupamento: 'status',
    colunasSelecionadas: ['numero', 'titulo', 'categoria', 'status', 'data_documento'],
    mostrarTotais: true,
    mostrarResumo: true,
    ordenacao: 'data',
    ordenacaoDir: 'desc',
  });

  const portariasFiltradas = filtrarPortarias(portarias, config);

  const handleColunaToggle = (colunaId: string) => {
    if (COLUNAS_DISPONIVEIS.find((c) => c.id === colunaId)?.obrigatoria) return;
    
    setConfig((prev) => ({
      ...prev,
      colunasSelecionadas: prev.colunasSelecionadas.includes(colunaId)
        ? prev.colunasSelecionadas.filter((c) => c !== colunaId)
        : [...prev.colunasSelecionadas, colunaId],
    }));
  };

  const handleGerarPDF = async () => {
    setIsGenerating(true);
    try {
      await gerarRelatorioPortariasPDF(portarias, config);
      toast.success('Relatório gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Gerar Relatório de Portarias
          </DialogTitle>
          <DialogDescription>
            Configure o relatório personalizado com agrupamentos, filtros e colunas
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-4">
            {/* Preview Count */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-lg font-semibold">{portariasFiltradas.length}</p>
                      <p className="text-sm text-muted-foreground">Portaria(s) no relatório</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    Agrupamento: {AGRUPAMENTOS.find((a) => a.value === config.agrupamento)?.label}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Configurações */}
            <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4" />
                    Configurações do Relatório
                  </span>
                  {configOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4 space-y-4">
                {/* Título e Subtítulo */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Título do Relatório</Label>
                    <Input
                      value={config.titulo}
                      onChange={(e) => setConfig((p) => ({ ...p, titulo: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subtítulo</Label>
                    <Input
                      value={config.subtitulo}
                      onChange={(e) => setConfig((p) => ({ ...p, subtitulo: e.target.value }))}
                    />
                  </div>
                </div>

                <Separator />

                {/* Agrupamento */}
                <div className="space-y-3">
                  <Label className="flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    Agrupar Por
                  </Label>
                  <RadioGroup
                    value={config.agrupamento}
                    onValueChange={(v) => setConfig((p) => ({ ...p, agrupamento: v as AgrupamentoTipo }))}
                    className="grid grid-cols-3 gap-2"
                  >
                    {AGRUPAMENTOS.map((ag) => (
                      <Label
                        key={ag.value}
                        htmlFor={ag.value}
                        className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                          config.agrupamento === ag.value
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <RadioGroupItem value={ag.value} id={ag.value} className="sr-only" />
                        {ag.icon}
                        <span className="text-sm">{ag.label}</span>
                        {config.agrupamento === ag.value && (
                          <Check className="h-4 w-4 ml-auto text-primary" />
                        )}
                      </Label>
                    ))}
                  </RadioGroup>
                </div>

                <Separator />

                {/* Colunas */}
                <div className="space-y-3">
                  <Label>Colunas do Relatório</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {COLUNAS_DISPONIVEIS.map((col) => (
                      <div
                        key={col.id}
                        className={`flex items-center gap-2 p-2 border rounded-lg ${
                          col.obrigatoria ? 'opacity-60' : 'cursor-pointer hover:bg-muted/50'
                        } ${config.colunasSelecionadas.includes(col.id) ? 'border-primary bg-primary/5' : ''}`}
                        onClick={() => handleColunaToggle(col.id)}
                      >
                        <Checkbox
                          checked={config.colunasSelecionadas.includes(col.id)}
                          disabled={col.obrigatoria}
                          onCheckedChange={() => handleColunaToggle(col.id)}
                        />
                        <span className="text-sm">{col.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Filtros */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Filtrar por Status</Label>
                    <Select
                      value={config.filtroStatus || 'todos'}
                      onValueChange={(v) =>
                        setConfig((p) => ({
                          ...p,
                          filtroStatus: v === 'todos' ? undefined : (v as StatusPortaria),
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todos os Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos os Status</SelectItem>
                        {Object.entries(STATUS_PORTARIA_LABELS).map(([v, l]) => (
                          <SelectItem key={v} value={v}>
                            {l}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Filtrar por Categoria</Label>
                    <Select
                      value={config.filtroCategoria || 'todas'}
                      onValueChange={(v) =>
                        setConfig((p) => ({
                          ...p,
                          filtroCategoria: v === 'todas' ? undefined : (v as CategoriaPortaria),
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Todas as Categorias" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas as Categorias</SelectItem>
                        <SelectItem value="nomeacao">Nomeação</SelectItem>
                        <SelectItem value="exoneracao">Exoneração</SelectItem>
                        <SelectItem value="designacao">Designação</SelectItem>
                        <SelectItem value="pessoal">Pessoal</SelectItem>
                        <SelectItem value="licenca">Licença</SelectItem>
                        <SelectItem value="ferias">Férias</SelectItem>
                        <SelectItem value="administrativa">Administrativa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Período Início</Label>
                    <Input
                      type="date"
                      value={config.periodoInicio || ''}
                      onChange={(e) =>
                        setConfig((p) => ({ ...p, periodoInicio: e.target.value || undefined }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Período Fim</Label>
                    <Input
                      type="date"
                      value={config.periodoFim || ''}
                      onChange={(e) =>
                        setConfig((p) => ({ ...p, periodoFim: e.target.value || undefined }))
                      }
                    />
                  </div>
                </div>

                <Separator />

                {/* Ordenação */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Ordenar Por</Label>
                    <Select
                      value={config.ordenacao}
                      onValueChange={(v) =>
                        setConfig((p) => ({ ...p, ordenacao: v as 'numero' | 'data' | 'status' | 'categoria' }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="data">Data</SelectItem>
                        <SelectItem value="numero">Número</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                        <SelectItem value="categoria">Categoria</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Direção</Label>
                    <Select
                      value={config.ordenacaoDir}
                      onValueChange={(v) => setConfig((p) => ({ ...p, ordenacaoDir: v as 'asc' | 'desc' }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asc">Crescente</SelectItem>
                        <SelectItem value="desc">Decrescente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Opções */}
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={config.mostrarTotais}
                      onCheckedChange={(v) => setConfig((p) => ({ ...p, mostrarTotais: v }))}
                    />
                    <Label>Mostrar Totais</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={config.mostrarResumo}
                      onCheckedChange={(v) => setConfig((p) => ({ ...p, mostrarResumo: v }))}
                    />
                    <Label>Mostrar Resumo</Label>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </ScrollArea>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleGerarPDF} disabled={isGenerating || portariasFiltradas.length === 0}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Gerar PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
