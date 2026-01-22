import { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Users,
  Briefcase,
  Settings2,
  Download,
  Loader2,
  ChevronDown,
  ChevronUp,
  Check,
  Layers,
  ArrowUpDown,
  Filter,
  Save,
  Trash2,
  Plus,
  Minus,
  GripVertical,
  RotateCcw,
  DollarSign,
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import {
  TipoRelatorio,
  ConfiguracaoRelatorio,
  CampoRelatorio,
  NivelAgrupamento,
  CAMPOS_POR_TIPO,
  TIPO_RELATORIO_LABELS,
  CONFIG_PADRAO,
  FILTROS_POR_TIPO,
  FiltroRelatorio,
} from '@/types/relatorios';
import { useDadosRelatorio, useUnidadesParaFiltro, useTemplatesRelatorio } from '@/hooks/useRelatorios';
import { gerarRelatorioPDF } from '@/lib/pdfRelatorioAvancado';
import { gerarRelatorioFolhaSimplificado } from '@/lib/pdfRelatorioFolhaSimplificado';
import { toast } from 'sonner';

// Ícones por tipo
const TIPO_ICONS: Record<TipoRelatorio, React.ReactNode> = {
  portarias: <FileText className="h-5 w-5" />,
  servidores: <Users className="h-5 w-5" />,
  cargos_vagas: <Briefcase className="h-5 w-5" />,
  folha_simplificada: <DollarSign className="h-5 w-5" />,
};

interface CentralRelatoriosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tipoInicial?: TipoRelatorio;
}

export function CentralRelatoriosDialog({
  open,
  onOpenChange,
  tipoInicial,
}: CentralRelatoriosDialogProps) {
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoRelatorio>('portarias');
  const [isGenerating, setIsGenerating] = useState(false);
  const [configOpen, setConfigOpen] = useState(true);
  const [filtrosOpen, setFiltrosOpen] = useState(false);
  
  const { getTemplates, saveTemplate, deleteTemplate } = useTemplatesRelatorio();
  const [templates, setTemplates] = useState<ConfiguracaoRelatorio[]>([]);
  const [templateSelecionado, setTemplateSelecionado] = useState<string | null>(null);

  // Configuração atual
  const [config, setConfig] = useState<ConfiguracaoRelatorio>(() => ({
    nome: 'Novo Relatório',
    tipo: 'portarias',
    titulo: 'RELATÓRIO DE PORTARIAS',
    subtitulo: 'Instituto de Desenvolvimento da Juventude - IDJUV',
    incluirLogos: true,
    orientacao: 'retrato',
    camposSelecionados: ['numero', 'titulo', 'categoria', 'status', 'data_documento'],
    agrupamentos: [{ campo: 'status', ordem: 'asc', mostrarContagem: true }],
    ordenacao: { campo: 'data_documento', direcao: 'desc' },
    filtros: {},
    mostrarTotais: true,
    mostrarResumo: true,
  }));

  // Buscar dados
  const { data: dadosRelatorio, isLoading: isLoadingDados, refetch } = useDadosRelatorio(
    tipoSelecionado,
    config.filtros
  );
  const { data: unidades = [] } = useUnidadesParaFiltro();

  // Campos disponíveis para o tipo atual
  const camposDisponiveis = useMemo(
    () => CAMPOS_POR_TIPO[tipoSelecionado],
    [tipoSelecionado]
  );

  // Campos agrupaveis
  const camposAgrupaveis = useMemo(
    () => camposDisponiveis.filter((c) => c.agrupavel),
    [camposDisponiveis]
  );

  // Filtros disponíveis
  const filtrosDisponiveis = useMemo(
    () => FILTROS_POR_TIPO[tipoSelecionado],
    [tipoSelecionado]
  );

  // Carregar templates e aplicar tipo inicial
  useEffect(() => {
    setTemplates(getTemplates());
    if (tipoInicial && open) {
      setTipoSelecionado(tipoInicial);
    }
  }, [open, tipoInicial]);

  // Quando muda tipo, resetar para config padrão
  useEffect(() => {
    const padrao = CONFIG_PADRAO[tipoSelecionado];
    setConfig((prev) => ({
      ...prev,
      tipo: tipoSelecionado,
      titulo: padrao.titulo || `RELATÓRIO DE ${TIPO_RELATORIO_LABELS[tipoSelecionado].toUpperCase()}`,
      camposSelecionados: padrao.camposSelecionados || [],
      agrupamentos: padrao.agrupamentos || [],
      ordenacao: padrao.ordenacao || { campo: 'id', direcao: 'asc' },
      filtros: {},
    }));
    setTemplateSelecionado(null);
  }, [tipoSelecionado]);

  // Aplicar template
  const aplicarTemplate = (template: ConfiguracaoRelatorio) => {
    setTipoSelecionado(template.tipo);
    setConfig(template);
    setTemplateSelecionado(template.id || null);
  };

  // Salvar como template
  const handleSalvarTemplate = () => {
    const saved = saveTemplate(config);
    setTemplates(getTemplates());
    setTemplateSelecionado(saved.id || null);
    toast.success('Template salvo com sucesso!');
  };

  // Deletar template
  const handleDeletarTemplate = (id: string) => {
    deleteTemplate(id);
    setTemplates(getTemplates());
    if (templateSelecionado === id) {
      setTemplateSelecionado(null);
    }
    toast.success('Template removido');
  };

  // Toggle campo selecionado
  const handleCampoToggle = (campoId: string) => {
    const campo = camposDisponiveis.find((c) => c.id === campoId);
    if (campo?.obrigatorio) return;

    setConfig((prev) => ({
      ...prev,
      camposSelecionados: prev.camposSelecionados.includes(campoId)
        ? prev.camposSelecionados.filter((c) => c !== campoId)
        : [...prev.camposSelecionados, campoId],
    }));
  };

  // Adicionar agrupamento
  const addAgrupamento = () => {
    if (config.agrupamentos.length >= 3) return;
    
    const camposUsados = config.agrupamentos.map((a) => a.campo);
    const campoDisponivel = camposAgrupaveis.find((c) => !camposUsados.includes(c.id));
    
    if (campoDisponivel) {
      setConfig((prev) => ({
        ...prev,
        agrupamentos: [
          ...prev.agrupamentos,
          { campo: campoDisponivel.id, ordem: 'asc', mostrarContagem: true },
        ],
      }));
    }
  };

  // Remover agrupamento
  const removeAgrupamento = (index: number) => {
    setConfig((prev) => ({
      ...prev,
      agrupamentos: prev.agrupamentos.filter((_, i) => i !== index),
    }));
  };

  // Atualizar agrupamento
  const updateAgrupamento = (index: number, updates: Partial<NivelAgrupamento>) => {
    setConfig((prev) => ({
      ...prev,
      agrupamentos: prev.agrupamentos.map((a, i) =>
        i === index ? { ...a, ...updates } : a
      ),
    }));
  };

  // Atualizar filtro
  const updateFiltro = (filtroId: string, valor: unknown) => {
    setConfig((prev) => ({
      ...prev,
      filtros: {
        ...prev.filtros,
        [filtroId]: valor as string | string[] | { inicio?: string; fim?: string },
      },
    }));
  };

  // Gerar PDF
  const handleGerarPDF = async () => {
    if (!dadosRelatorio?.dados || dadosRelatorio.dados.length === 0) {
      toast.error('Nenhum dado encontrado para gerar o relatório');
      return;
    }

    setIsGenerating(true);
    try {
      // Usar gerador específico para folha simplificada
      if (tipoSelecionado === 'folha_simplificada') {
        await gerarRelatorioFolhaSimplificado(dadosRelatorio.dados, {
          titulo: config.titulo,
          subtitulo: config.subtitulo,
          incluirLogos: config.incluirLogos,
        });
      } else {
        await gerarRelatorioPDF(config, dadosRelatorio.dados);
      }
      toast.success('Relatório gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setIsGenerating(false);
    }
  };

  // Resetar configuração
  const resetConfig = () => {
    const padrao = CONFIG_PADRAO[tipoSelecionado];
    setConfig({
      nome: 'Novo Relatório',
      tipo: tipoSelecionado,
      titulo: padrao.titulo || `RELATÓRIO DE ${TIPO_RELATORIO_LABELS[tipoSelecionado].toUpperCase()}`,
      subtitulo: 'Instituto de Desenvolvimento da Juventude - IDJUV',
      incluirLogos: true,
      orientacao: 'retrato',
      camposSelecionados: padrao.camposSelecionados || [],
      agrupamentos: padrao.agrupamentos || [],
      ordenacao: padrao.ordenacao || { campo: 'id', direcao: 'asc' },
      filtros: {},
      mostrarTotais: true,
      mostrarResumo: true,
    });
    setTemplateSelecionado(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Central de Relatórios Avançada
          </DialogTitle>
          <DialogDescription>
            Configure relatórios personalizados com campos, agrupamentos multinível e filtros
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="configurar" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="configurar">Configurar Relatório</TabsTrigger>
            <TabsTrigger value="templates">
              Templates Salvos ({templates.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="configurar" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-[calc(70vh-120px)] pr-4">
              <div className="space-y-4">
                {/* Tipo de Relatório */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">Tipo de Relatório</Label>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {(Object.keys(TIPO_RELATORIO_LABELS) as TipoRelatorio[]).map((tipo) => (
                      <Card
                        key={tipo}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          tipoSelecionado === tipo
                            ? 'border-primary ring-2 ring-primary/20'
                            : ''
                        }`}
                        onClick={() => setTipoSelecionado(tipo)}
                      >
                        <CardHeader className="p-4 pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            {TIPO_ICONS[tipo]}
                            {TIPO_RELATORIO_LABELS[tipo]}
                            {tipoSelecionado === tipo && (
                              <Check className="h-4 w-4 ml-auto text-primary" />
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <p className="text-xs text-muted-foreground">
                            {CAMPOS_POR_TIPO[tipo].length} campos disponíveis
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Preview de quantidade */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {TIPO_ICONS[tipoSelecionado]}
                        <div>
                          <p className="text-lg font-semibold">
                            {isLoadingDados ? '...' : dadosRelatorio?.total || 0}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Registro(s) no relatório
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {config.agrupamentos.length > 0 && (
                          <Badge variant="secondary">
                            {config.agrupamentos.length} nível(is) de agrupamento
                          </Badge>
                        )}
                        <Badge variant="outline">
                          {config.camposSelecionados.length} campo(s)
                        </Badge>
                      </div>
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
                    {/* Nome e Título */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome do Relatório</Label>
                        <Input
                          value={config.nome}
                          onChange={(e) => setConfig((p) => ({ ...p, nome: e.target.value }))}
                          placeholder="Ex: Relatório Mensal"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Título no PDF</Label>
                        <Input
                          value={config.titulo}
                          onChange={(e) => setConfig((p) => ({ ...p, titulo: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Subtítulo</Label>
                        <Input
                          value={config.subtitulo || ''}
                          onChange={(e) => setConfig((p) => ({ ...p, subtitulo: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Orientação</Label>
                        <Select
                          value={config.orientacao}
                          onValueChange={(v) => setConfig((p) => ({ ...p, orientacao: v as 'retrato' | 'paisagem' }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="retrato">Retrato (Vertical)</SelectItem>
                            <SelectItem value="paisagem">Paisagem (Horizontal)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    {/* Campos Selecionados */}
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4" />
                        Campos do Relatório
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {camposDisponiveis.map((campo) => (
                          <TooltipProvider key={campo.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div
                                  className={`flex items-center gap-2 p-2 border rounded-lg transition-colors ${
                                    campo.obrigatorio
                                      ? 'opacity-70 cursor-not-allowed bg-muted/50'
                                      : 'cursor-pointer hover:bg-muted/50'
                                  } ${
                                    config.camposSelecionados.includes(campo.id)
                                      ? 'border-primary bg-primary/5'
                                      : ''
                                  }`}
                                  onClick={() => handleCampoToggle(campo.id)}
                                >
                                  <Checkbox
                                    checked={config.camposSelecionados.includes(campo.id)}
                                    disabled={campo.obrigatorio}
                                    onCheckedChange={() => handleCampoToggle(campo.id)}
                                  />
                                  <span className="text-sm truncate">{campo.label}</span>
                                  {campo.agrupavel && (
                                    <Badge variant="outline" className="ml-auto text-[10px] px-1">
                                      Agrupável
                                    </Badge>
                                  )}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {campo.label} ({campo.tipo})
                                  {campo.obrigatorio && ' - Obrigatório'}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Agrupamentos Multinível */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <Layers className="h-4 w-4" />
                          Agrupamentos (até 3 níveis)
                        </Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addAgrupamento}
                          disabled={config.agrupamentos.length >= 3}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar Nível
                        </Button>
                      </div>

                      {config.agrupamentos.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4 border rounded-lg bg-muted/20">
                          Nenhum agrupamento. Clique em "Adicionar Nível" para agrupar os dados.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {config.agrupamentos.map((agrup, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2 p-3 border rounded-lg bg-muted/20"
                            >
                              <Badge variant="secondary" className="min-w-[24px] justify-center">
                                {index + 1}
                              </Badge>
                              
                              <Select
                                value={agrup.campo}
                                onValueChange={(v) => updateAgrupamento(index, { campo: v })}
                              >
                                <SelectTrigger className="flex-1">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {camposAgrupaveis.map((campo) => (
                                    <SelectItem
                                      key={campo.id}
                                      value={campo.id}
                                      disabled={
                                        config.agrupamentos.some((a, i) => i !== index && a.campo === campo.id)
                                      }
                                    >
                                      {campo.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Select
                                value={agrup.ordem}
                                onValueChange={(v) => updateAgrupamento(index, { ordem: v as 'asc' | 'desc' })}
                              >
                                <SelectTrigger className="w-[120px]">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="asc">A → Z</SelectItem>
                                  <SelectItem value="desc">Z → A</SelectItem>
                                </SelectContent>
                              </Select>

                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={agrup.mostrarContagem}
                                  onCheckedChange={(v) =>
                                    updateAgrupamento(index, { mostrarContagem: !!v })
                                  }
                                />
                                <Label className="text-xs">Contagem</Label>
                              </div>

                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => removeAgrupamento(index)}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Separator />

                    {/* Ordenação */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <ArrowUpDown className="h-4 w-4" />
                          Ordenar Por
                        </Label>
                        <Select
                          value={config.ordenacao.campo}
                          onValueChange={(v) =>
                            setConfig((p) => ({
                              ...p,
                              ordenacao: { ...p.ordenacao, campo: v },
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {camposDisponiveis.map((campo) => (
                              <SelectItem key={campo.id} value={campo.id}>
                                {campo.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Direção</Label>
                        <Select
                          value={config.ordenacao.direcao}
                          onValueChange={(v) =>
                            setConfig((p) => ({
                              ...p,
                              ordenacao: { ...p.ordenacao, direcao: v as 'asc' | 'desc' },
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="asc">Crescente (A-Z, 1-9)</SelectItem>
                            <SelectItem value="desc">Decrescente (Z-A, 9-1)</SelectItem>
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
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={config.incluirLogos}
                          onCheckedChange={(v) => setConfig((p) => ({ ...p, incluirLogos: v }))}
                        />
                        <Label>Incluir Logos</Label>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Filtros */}
                <Collapsible open={filtrosOpen} onOpenChange={setFiltrosOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filtros de Dados
                        {Object.keys(config.filtros).length > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {Object.keys(config.filtros).length} ativo(s)
                          </Badge>
                        )}
                      </span>
                      {filtrosOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="pt-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {filtrosDisponiveis.map((filtro) => (
                        <div key={filtro.id} className="space-y-2">
                          <Label>{filtro.label}</Label>
                          {filtro.tipo === 'select' && (
                            <Select
                              value={String(config.filtros[filtro.id] || 'all')}
                              onValueChange={(v) => updateFiltro(filtro.id, v === 'all' ? undefined : v)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Todos" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {filtro.opcoes?.map((op) => (
                                  <SelectItem key={op.value} value={op.value}>
                                    {op.label}
                                  </SelectItem>
                                ))}
                                {filtro.id === 'unidade' &&
                                  unidades.map((u) => (
                                    <SelectItem key={u.id} value={u.id}>
                                      {u.sigla ? `${u.sigla} - ${u.nome}` : u.nome}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          )}
                          {filtro.tipo === 'multiselect' && (
                            <div className="flex flex-wrap gap-1 p-2 border rounded-lg min-h-[40px]">
                              {filtro.opcoes?.map((op) => {
                                const selecionados = (config.filtros[filtro.id] as string[]) || [];
                                const isSelected = selecionados.includes(op.value);
                                return (
                                  <Badge
                                    key={op.value}
                                    variant={isSelected ? 'default' : 'outline'}
                                    className="cursor-pointer"
                                    onClick={() => {
                                      const novos = isSelected
                                        ? selecionados.filter((v) => v !== op.value)
                                        : [...selecionados, op.value];
                                      updateFiltro(filtro.id, novos.length > 0 ? novos : undefined);
                                    }}
                                  >
                                    {op.label}
                                    {isSelected && <Check className="h-3 w-3 ml-1" />}
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                          {filtro.tipo === 'periodo' && (
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                type="date"
                                placeholder="Início"
                                value={
                                  (config.filtros[filtro.id] as { inicio?: string })?.inicio || ''
                                }
                                onChange={(e) =>
                                  updateFiltro(filtro.id, {
                                    ...(config.filtros[filtro.id] as object),
                                    inicio: e.target.value || undefined,
                                  })
                                }
                              />
                              <Input
                                type="date"
                                placeholder="Fim"
                                value={
                                  (config.filtros[filtro.id] as { fim?: string })?.fim || ''
                                }
                                onChange={(e) =>
                                  updateFiltro(filtro.id, {
                                    ...(config.filtros[filtro.id] as object),
                                    fim: e.target.value || undefined,
                                  })
                                }
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setConfig((p) => ({ ...p, filtros: {} }));
                        refetch();
                      }}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Limpar Filtros
                    </Button>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="templates" className="flex-1 overflow-hidden mt-4">
            <ScrollArea className="h-[calc(70vh-120px)] pr-4">
              {templates.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Save className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum template salvo</p>
                  <p className="text-sm">Configure um relatório e salve como template para reutilizar</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {templates.map((template) => (
                    <Card
                      key={template.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        templateSelecionado === template.id ? 'border-primary ring-2 ring-primary/20' : ''
                      }`}
                      onClick={() => aplicarTemplate(template)}
                    >
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            {TIPO_ICONS[template.tipo]}
                            <CardTitle className="text-sm">{template.nome}</CardTitle>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletarTemplate(template.id!);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <CardDescription className="text-xs">
                          {TIPO_RELATORIO_LABELS[template.tipo]}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-[10px]">
                            {template.camposSelecionados.length} campos
                          </Badge>
                          {template.agrupamentos.length > 0 && (
                            <Badge variant="secondary" className="text-[10px]">
                              {template.agrupamentos.length} agrupamento(s)
                            </Badge>
                          )}
                        </div>
                        {template.atualizadoEm && (
                          <p className="text-[10px] text-muted-foreground mt-2">
                            Atualizado: {new Date(template.atualizadoEm).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="pt-4 border-t gap-2">
          <Button variant="outline" size="sm" onClick={resetConfig}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetar
          </Button>
          <Button variant="outline" onClick={handleSalvarTemplate}>
            <Save className="h-4 w-4 mr-2" />
            Salvar Template
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleGerarPDF}
            disabled={isGenerating || isLoadingDados || (dadosRelatorio?.total || 0) === 0}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Gerar PDF ({dadosRelatorio?.total || 0})
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
