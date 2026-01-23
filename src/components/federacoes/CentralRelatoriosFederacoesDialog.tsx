import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  FileText,
  Users,
  Download,
  FileSpreadsheet,
  Save,
  Trash2,
  Settings2,
  Filter,
  Eye,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Building2,
  RotateCcw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

import { useDadosFederacoes, useTemplatesFederacaoRelatorio } from '@/hooks/useFederacoesRelatorio';
import { gerarRelatorioFederacoesPDF } from '@/lib/pdfRelatorioFederacoes';
import { exportarFederacoesExcel, exportarFederacoesCSV } from '@/lib/exportarFederacoes';
import {
  TipoRelatorioFederacao,
  ConfiguracaoRelatorioFederacao,
  CAMPOS_POR_TIPO_FEDERACAO,
  FILTROS_POR_TIPO_FEDERACAO,
  CONFIG_PADRAO_FEDERACAO,
  TIPO_RELATORIO_FEDERACAO_LABELS,
  GRUPOS_CAMPOS,
  STATUS_FEDERACAO_LABELS,
} from '@/types/federacoesRelatorio';

// ================================================================
// PROPS
// ================================================================

interface CentralRelatoriosFederacoesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ================================================================
// COMPONENTE PRINCIPAL
// ================================================================

export function CentralRelatoriosFederacoesDialog({
  open,
  onOpenChange,
}: CentralRelatoriosFederacoesDialogProps) {
  // ================================================================
  // ESTADO
  // ================================================================

  const [tipoSelecionado, setTipoSelecionado] = useState<TipoRelatorioFederacao>('federacoes');
  const [config, setConfig] = useState<ConfiguracaoRelatorioFederacao>({
    nome: '',
    tipo: 'federacoes',
    titulo: CONFIG_PADRAO_FEDERACAO.federacoes.titulo || '',
    subtitulo: CONFIG_PADRAO_FEDERACAO.federacoes.subtitulo,
    incluirLogos: true,
    orientacao: 'paisagem',
    camposSelecionados: CONFIG_PADRAO_FEDERACAO.federacoes.camposSelecionados || [],
    filtros: {},
    ordenacao: CONFIG_PADRAO_FEDERACAO.federacoes.ordenacao || { campo: 'nome', direcao: 'asc' },
  });

  const [templateSelecionado, setTemplateSelecionado] = useState<string>('');
  const [nomeNovoTemplate, setNomeNovoTemplate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    campos: true,
    filtros: true,
    opcoes: false,
  });

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Ordenação da tabela
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // ================================================================
  // HOOKS
  // ================================================================

  const { getTemplates, saveTemplate, deleteTemplate } = useTemplatesFederacaoRelatorio();
  const templates = getTemplates();

  const { data: dadosRelatorio, isLoading } = useDadosFederacoes(tipoSelecionado, config.filtros);

  const camposDisponiveis = CAMPOS_POR_TIPO_FEDERACAO[tipoSelecionado];
  const filtrosDisponiveis = FILTROS_POR_TIPO_FEDERACAO[tipoSelecionado];

  // Agrupar campos por grupo
  const camposPorGrupo = useMemo(() => {
    const grupos: Record<string, typeof camposDisponiveis> = {};
    camposDisponiveis.forEach((campo) => {
      if (!grupos[campo.grupo]) {
        grupos[campo.grupo] = [];
      }
      grupos[campo.grupo].push(campo);
    });
    return grupos;
  }, [camposDisponiveis]);

  // Dados ordenados e paginados
  const dadosOrdenados = useMemo(() => {
    if (!dadosRelatorio?.dados) return [];
    
    let dados = [...dadosRelatorio.dados];
    
    if (sortColumn) {
      dados.sort((a, b) => {
        const aVal = String(a[sortColumn] || '');
        const bVal = String(b[sortColumn] || '');
        const comparison = aVal.localeCompare(bVal, 'pt-BR');
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    return dados;
  }, [dadosRelatorio?.dados, sortColumn, sortDirection]);

  const dadosPaginados = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return dadosOrdenados.slice(start, start + itemsPerPage);
  }, [dadosOrdenados, currentPage]);

  const totalPages = Math.ceil((dadosOrdenados.length || 0) / itemsPerPage);

  // ================================================================
  // EFEITOS
  // ================================================================

  useEffect(() => {
    if (open) {
      // Reset ao abrir
      setCurrentPage(1);
      setSortColumn('');
      setSortDirection('asc');
    }
  }, [open]);

  useEffect(() => {
    // Atualizar config quando mudar tipo
    const padrao = CONFIG_PADRAO_FEDERACAO[tipoSelecionado];
    setConfig((prev) => ({
      ...prev,
      tipo: tipoSelecionado,
      titulo: padrao.titulo || '',
      subtitulo: padrao.subtitulo,
      camposSelecionados: padrao.camposSelecionados || [],
      ordenacao: padrao.ordenacao || { campo: 'nome', direcao: 'asc' },
      filtros: {},
    }));
    setCurrentPage(1);
  }, [tipoSelecionado]);

  // ================================================================
  // HANDLERS
  // ================================================================

  const handleCampoToggle = (campoId: string) => {
    setConfig((prev) => ({
      ...prev,
      camposSelecionados: prev.camposSelecionados.includes(campoId)
        ? prev.camposSelecionados.filter((c) => c !== campoId)
        : [...prev.camposSelecionados, campoId],
    }));
  };

  const handleSelecionarTodosCampos = (grupo: string) => {
    const camposGrupo = camposPorGrupo[grupo]?.map((c) => c.id) || [];
    const todosJaSelecionados = camposGrupo.every((id) =>
      config.camposSelecionados.includes(id)
    );

    if (todosJaSelecionados) {
      setConfig((prev) => ({
        ...prev,
        camposSelecionados: prev.camposSelecionados.filter(
          (c) => !camposGrupo.includes(c)
        ),
      }));
    } else {
      setConfig((prev) => ({
        ...prev,
        camposSelecionados: [
          ...new Set([...prev.camposSelecionados, ...camposGrupo]),
        ],
      }));
    }
  };

  const handleFiltroChange = (filtroId: string, valor: unknown) => {
    setConfig((prev) => ({
      ...prev,
      filtros: {
        ...prev.filtros,
        [filtroId]: valor,
      },
    }));
    setCurrentPage(1);
  };

  const handleSort = (campo: string) => {
    if (sortColumn === campo) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortColumn(campo);
      setSortDirection('asc');
    }
  };

  const handleSalvarTemplate = () => {
    if (!nomeNovoTemplate.trim()) {
      toast.error('Informe um nome para o modelo');
      return;
    }

    saveTemplate({
      ...config,
      nome: nomeNovoTemplate,
    });

    toast.success('Modelo salvo com sucesso!');
    setNomeNovoTemplate('');
  };

  const handleAplicarTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setTipoSelecionado(template.tipo);
      setConfig(template);
      setTemplateSelecionado(templateId);
      toast.success('Modelo aplicado!');
    }
  };

  const handleDeletarTemplate = (templateId: string) => {
    deleteTemplate(templateId);
    if (templateSelecionado === templateId) {
      setTemplateSelecionado('');
    }
    toast.success('Modelo excluído!');
  };

  const handleReset = () => {
    const padrao = CONFIG_PADRAO_FEDERACAO[tipoSelecionado];
    setConfig({
      nome: '',
      tipo: tipoSelecionado,
      titulo: padrao.titulo || '',
      subtitulo: padrao.subtitulo,
      incluirLogos: true,
      orientacao: 'paisagem',
      camposSelecionados: padrao.camposSelecionados || [],
      filtros: {},
      ordenacao: padrao.ordenacao || { campo: 'nome', direcao: 'asc' },
    });
    setTemplateSelecionado('');
    setCurrentPage(1);
  };

  const handleExportPDF = async () => {
    if (!dadosRelatorio?.dados.length) {
      toast.error('Não há dados para exportar');
      return;
    }

    if (config.camposSelecionados.length === 0) {
      toast.error('Selecione pelo menos um campo');
      return;
    }

    setIsGenerating(true);
    try {
      await gerarRelatorioFederacoesPDF(config, dadosRelatorio.dados, camposDisponiveis);
      toast.success('PDF gerado com sucesso!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao gerar PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportExcel = () => {
    if (!dadosRelatorio?.dados.length) {
      toast.error('Não há dados para exportar');
      return;
    }

    const camposSelecionadosObj = camposDisponiveis.filter((c) =>
      config.camposSelecionados.includes(c.id)
    );

    exportarFederacoesExcel(
      dadosRelatorio.dados,
      camposSelecionadosObj,
      `relatorio-${tipoSelecionado}`
    );
    toast.success('Excel gerado com sucesso!');
  };

  const handleExportCSV = () => {
    if (!dadosRelatorio?.dados.length) {
      toast.error('Não há dados para exportar');
      return;
    }

    const camposSelecionadosObj = camposDisponiveis.filter((c) =>
      config.camposSelecionados.includes(c.id)
    );

    exportarFederacoesCSV(
      dadosRelatorio.dados,
      camposSelecionadosObj,
      `relatorio-${tipoSelecionado}`
    );
    toast.success('CSV gerado com sucesso!');
  };

  // ================================================================
  // RENDER
  // ================================================================

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Central de Relatórios - Federações
          </DialogTitle>
          <DialogDescription>
            Gere relatórios personalizados sobre Federações Esportivas e seus dirigentes
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="configurar" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-6 grid w-auto grid-cols-3 max-w-md">
            <TabsTrigger value="configurar">Configurar</TabsTrigger>
            <TabsTrigger value="visualizar">Visualizar</TabsTrigger>
            <TabsTrigger value="modelos">Modelos Salvos</TabsTrigger>
          </TabsList>

          {/* TAB: CONFIGURAR */}
          <TabsContent value="configurar" className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-full px-6">
              <div className="space-y-6 pb-6">
                {/* Tipo de Relatório */}
                <div className="grid grid-cols-2 gap-4">
                  <Card
                    className={`cursor-pointer transition-all ${
                      tipoSelecionado === 'federacoes'
                        ? 'ring-2 ring-primary'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setTipoSelecionado('federacoes')}
                  >
                    <CardContent className="pt-4 flex items-center gap-3">
                      <Building2 className="h-8 w-8 text-primary" />
                      <div>
                        <div className="font-medium">Federações</div>
                        <div className="text-sm text-muted-foreground">
                          Dados das federações esportivas
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card
                    className={`cursor-pointer transition-all ${
                      tipoSelecionado === 'dirigentes'
                        ? 'ring-2 ring-primary'
                        : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setTipoSelecionado('dirigentes')}
                  >
                    <CardContent className="pt-4 flex items-center gap-3">
                      <Users className="h-8 w-8 text-primary" />
                      <div>
                        <div className="font-medium">Dirigentes</div>
                        <div className="text-sm text-muted-foreground">
                          Presidente, Vice e Diretor Técnico
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Preview contador */}
                <Card className="bg-muted/30">
                  <CardContent className="pt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {isLoading ? (
                          'Carregando...'
                        ) : (
                          <>
                            <strong>{dadosRelatorio?.total || 0}</strong> registros encontrados
                          </>
                        )}
                      </span>
                    </div>
                    <Badge variant="secondary">
                      {config.camposSelecionados.length} campos selecionados
                    </Badge>
                  </CardContent>
                </Card>

                {/* Campos */}
                <Collapsible
                  open={expandedSections.campos}
                  onOpenChange={(open) =>
                    setExpandedSections((prev) => ({ ...prev, campos: open }))
                  }
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                      <div className="flex items-center gap-2">
                        <Settings2 className="h-4 w-4" />
                        <span className="font-medium">Campos do Relatório</span>
                      </div>
                      {expandedSections.campos ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-2">
                    {Object.entries(camposPorGrupo).map(([grupo, campos]) => (
                      <div key={grupo} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <Label className="font-medium">
                            {GRUPOS_CAMPOS[grupo] || grupo}
                          </Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSelecionarTodosCampos(grupo)}
                          >
                            {campos.every((c) =>
                              config.camposSelecionados.includes(c.id)
                            )
                              ? 'Desmarcar todos'
                              : 'Selecionar todos'}
                          </Button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {campos.map((campo) => (
                            <label
                              key={campo.id}
                              className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-2 rounded"
                            >
                              <Checkbox
                                checked={config.camposSelecionados.includes(campo.id)}
                                onCheckedChange={() => handleCampoToggle(campo.id)}
                              />
                              {campo.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>

                {/* Filtros */}
                <Collapsible
                  open={expandedSections.filtros}
                  onOpenChange={(open) =>
                    setExpandedSections((prev) => ({ ...prev, filtros: open }))
                  }
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        <span className="font-medium">Filtros</span>
                      </div>
                      {expandedSections.filtros ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-2 border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filtrosDisponiveis.map((filtro) => (
                        <div key={filtro.id} className="space-y-2">
                          <Label>{filtro.label}</Label>
                          {filtro.tipo === 'multiselect' && filtro.opcoes && (
                            <Select
                              value={
                                Array.isArray(config.filtros[filtro.id])
                                  ? (config.filtros[filtro.id] as string[])[0] || ''
                                  : ''
                              }
                              onValueChange={(value) =>
                                handleFiltroChange(filtro.id, value ? [value] : [])
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Todos</SelectItem>
                                {filtro.opcoes.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                          {filtro.tipo === 'boolean' && (
                            <Select
                              value={
                                config.filtros[filtro.id] === true
                                  ? 'sim'
                                  : config.filtros[filtro.id] === false
                                  ? 'nao'
                                  : ''
                              }
                              onValueChange={(value) =>
                                handleFiltroChange(
                                  filtro.id,
                                  value === 'sim' ? true : value === 'nao' ? false : undefined
                                )
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Indiferente" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Indiferente</SelectItem>
                                <SelectItem value="sim">Sim</SelectItem>
                                <SelectItem value="nao">Não</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                          {filtro.tipo === 'periodo' && (
                            <div className="grid grid-cols-2 gap-2">
                              <Input
                                type="date"
                                placeholder="Início"
                                onChange={(e) => {
                                  const atual =
                                    (config.filtros[filtro.id] as { inicio?: string; fim?: string }) || {};
                                  handleFiltroChange(filtro.id, {
                                    ...atual,
                                    inicio: e.target.value,
                                  });
                                }}
                              />
                              <Input
                                type="date"
                                placeholder="Fim"
                                onChange={(e) => {
                                  const atual =
                                    (config.filtros[filtro.id] as { inicio?: string; fim?: string }) || {};
                                  handleFiltroChange(filtro.id, {
                                    ...atual,
                                    fim: e.target.value,
                                  });
                                }}
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {/* Opções */}
                <Collapsible
                  open={expandedSections.opcoes}
                  onOpenChange={(open) =>
                    setExpandedSections((prev) => ({ ...prev, opcoes: open }))
                  }
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-4 h-auto">
                      <div className="flex items-center gap-2">
                        <Settings2 className="h-4 w-4" />
                        <span className="font-medium">Opções do PDF</span>
                      </div>
                      {expandedSections.opcoes ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 pt-2 border rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Título do Relatório</Label>
                        <Input
                          value={config.titulo}
                          onChange={(e) =>
                            setConfig((prev) => ({ ...prev, titulo: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Subtítulo</Label>
                        <Input
                          value={config.subtitulo || ''}
                          onChange={(e) =>
                            setConfig((prev) => ({ ...prev, subtitulo: e.target.value }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Orientação</Label>
                        <Select
                          value={config.orientacao}
                          onValueChange={(value: 'retrato' | 'paisagem') =>
                            setConfig((prev) => ({ ...prev, orientacao: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="retrato">Retrato</SelectItem>
                            <SelectItem value="paisagem">Paisagem</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <Label>Incluir logos institucionais</Label>
                        <Switch
                          checked={config.incluirLogos}
                          onCheckedChange={(checked) =>
                            setConfig((prev) => ({ ...prev, incluirLogos: checked }))
                          }
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </ScrollArea>
          </TabsContent>

          {/* TAB: VISUALIZAR */}
          <TabsContent value="visualizar" className="flex-1 min-h-0 mt-4 flex flex-col">
            <div className="px-6 flex-1 min-h-0 flex flex-col">
              {/* Barra de info */}
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-muted-foreground">
                  Mostrando {dadosPaginados.length} de {dadosOrdenados.length} registros
                </div>
                <div className="text-sm text-muted-foreground">
                  Clique nos cabeçalhos para ordenar
                </div>
              </div>

              {/* Tabela */}
              <div className="flex-1 min-h-0 border rounded-lg overflow-hidden">
                <ScrollArea className="h-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {config.camposSelecionados.map((campoId) => {
                          const campo = camposDisponiveis.find((c) => c.id === campoId);
                          if (!campo) return null;
                          return (
                            <TableHead
                              key={campoId}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleSort(campoId)}
                            >
                              <div className="flex items-center gap-1">
                                {campo.label}
                                <ArrowUpDown className="h-3 w-3" />
                              </div>
                            </TableHead>
                          );
                        })}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell
                            colSpan={config.camposSelecionados.length}
                            className="text-center py-8"
                          >
                            Carregando...
                          </TableCell>
                        </TableRow>
                      ) : dadosPaginados.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={config.camposSelecionados.length}
                            className="text-center py-8 text-muted-foreground"
                          >
                            Nenhum registro encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        dadosPaginados.map((item, idx) => (
                          <TableRow key={idx}>
                            {config.camposSelecionados.map((campoId) => {
                              const campo = camposDisponiveis.find((c) => c.id === campoId);
                              if (!campo) return null;
                              const valor = item[campoId];

                              // Renderização especial para status
                              if (campo.id === 'status' && campo.tipo === 'badge') {
                                return (
                                  <TableCell key={campoId}>
                                    <Badge
                                      variant={
                                        valor === 'ativo'
                                          ? 'default'
                                          : valor === 'em_analise'
                                          ? 'secondary'
                                          : 'outline'
                                      }
                                    >
                                      {STATUS_FEDERACAO_LABELS[String(valor)] || String(valor)}
                                    </Badge>
                                  </TableCell>
                                );
                              }

                              return (
                                <TableCell key={campoId} className="max-w-[200px] truncate">
                                  {valor === null || valor === undefined || valor === ''
                                    ? '-'
                                    : campo.tipo === 'data'
                                    ? (() => {
                                        try {
                                          return format(new Date(String(valor)), 'dd/MM/yyyy', {
                                            locale: ptBR,
                                          });
                                        } catch {
                                          return String(valor);
                                        }
                                      })()
                                    : String(valor)}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="py-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNum)}
                              isActive={currentPage === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB: MODELOS SALVOS */}
          <TabsContent value="modelos" className="flex-1 min-h-0 mt-4">
            <ScrollArea className="h-full px-6">
              <div className="space-y-6 pb-6">
                {/* Salvar novo modelo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Salvar Modelo Atual</CardTitle>
                    <CardDescription>
                      Salve a configuração atual para reutilização futura
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Nome do modelo..."
                        value={nomeNovoTemplate}
                        onChange={(e) => setNomeNovoTemplate(e.target.value)}
                      />
                      <Button onClick={handleSalvarTemplate}>
                        <Save className="h-4 w-4 mr-2" />
                        Salvar
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Lista de modelos */}
                <div className="space-y-2">
                  <Label className="text-base font-medium">Modelos Salvos</Label>
                  {templates.length === 0 ? (
                    <Card>
                      <CardContent className="py-8 text-center text-muted-foreground">
                        Nenhum modelo salvo ainda
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-2">
                      {templates.map((template) => (
                        <Card key={template.id} className="hover:bg-muted/50">
                          <CardContent className="py-3 flex items-center justify-between">
                            <div>
                              <div className="font-medium">{template.nome}</div>
                              <div className="text-sm text-muted-foreground">
                                {TIPO_RELATORIO_FEDERACAO_LABELS[template.tipo]} •{' '}
                                {template.camposSelecionados.length} campos •{' '}
                                {template.atualizadoEm
                                  ? format(new Date(template.atualizadoEm), "dd/MM/yyyy 'às' HH:mm", {
                                      locale: ptBR,
                                    })
                                  : ''}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleAplicarTemplate(template.id!)}
                              >
                                Aplicar
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeletarTemplate(template.id!)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t flex-wrap gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Resetar
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={handleExportCSV} disabled={isLoading || !dadosRelatorio?.total}>
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
          <Button variant="outline" onClick={handleExportExcel} disabled={isLoading || !dadosRelatorio?.total}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button onClick={handleExportPDF} disabled={isLoading || isGenerating || !dadosRelatorio?.total}>
            <FileText className="h-4 w-4 mr-2" />
            {isGenerating ? 'Gerando...' : 'Gerar PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
