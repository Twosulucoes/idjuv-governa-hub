import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface RelatorioPortariasDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portarias: Portaria[];
}

type AgrupamentoTipo = 'nenhum' | 'status' | 'categoria' | 'unidade' | 'mes' | 'servidor';

const AGRUPAMENTOS: { value: AgrupamentoTipo; label: string; icon: React.ReactNode }[] = [
  { value: 'nenhum', label: 'Sem Agrupamento', icon: <FileText className="h-4 w-4" /> },
  { value: 'status', label: 'Por Status', icon: <BarChart3 className="h-4 w-4" /> },
  { value: 'categoria', label: 'Por Categoria', icon: <Layers className="h-4 w-4" /> },
  { value: 'unidade', label: 'Por Unidade', icon: <Building2 className="h-4 w-4" /> },
  { value: 'mes', label: 'Por Mês', icon: <Calendar className="h-4 w-4" /> },
  { value: 'servidor', label: 'Por Servidor', icon: <Users className="h-4 w-4" /> },
];

const COLUNAS_DISPONIVEIS = [
  { id: 'numero', label: 'Número', obrigatoria: true },
  { id: 'titulo', label: 'Título', obrigatoria: false },
  { id: 'categoria', label: 'Categoria', obrigatoria: false },
  { id: 'status', label: 'Status', obrigatoria: false },
  { id: 'data_documento', label: 'Data', obrigatoria: false },
  { id: 'ementa', label: 'Ementa', obrigatoria: false },
  { id: 'servidores', label: 'Servidores', obrigatoria: false },
  { id: 'unidade', label: 'Unidade', obrigatoria: false },
  { id: 'cargo', label: 'Cargo', obrigatoria: false },
  { id: 'doe_numero', label: 'DOE', obrigatoria: false },
  { id: 'doe_data', label: 'Data DOE', obrigatoria: false },
];

interface ConfiguracaoRelatorio {
  titulo: string;
  subtitulo: string;
  agrupamento: AgrupamentoTipo;
  colunasSelecionadas: string[];
  mostrarTotais: boolean;
  mostrarResumo: boolean;
  ordenacao: 'numero' | 'data' | 'status' | 'categoria';
  ordenacaoDir: 'asc' | 'desc';
  incluirLogos: boolean;
  filtroStatus?: StatusPortaria;
  filtroCategoria?: CategoriaPortaria;
  periodoInicio?: string;
  periodoFim?: string;
}

export function RelatorioPortariasDialog({
  open,
  onOpenChange,
  portarias,
}: RelatorioPortariasDialogProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [configOpen, setConfigOpen] = useState(true);
  
  const [config, setConfig] = useState<ConfiguracaoRelatorio>({
    titulo: 'RELATÓRIO DE PORTARIAS',
    subtitulo: 'Instituto de Desenvolvimento da Juventude',
    agrupamento: 'status',
    colunasSelecionadas: ['numero', 'titulo', 'categoria', 'status', 'data_documento'],
    mostrarTotais: true,
    mostrarResumo: true,
    ordenacao: 'data',
    ordenacaoDir: 'desc',
    incluirLogos: true,
  });

  const portariasFiltradas = portarias.filter((p) => {
    if (config.filtroStatus && p.status !== config.filtroStatus) return false;
    if (config.filtroCategoria && p.categoria !== config.filtroCategoria) return false;
    if (config.periodoInicio && new Date(p.data_documento) < new Date(config.periodoInicio)) return false;
    if (config.periodoFim && new Date(p.data_documento) > new Date(config.periodoFim)) return false;
    return true;
  });

  const handleColunaToggle = (colunaId: string) => {
    if (COLUNAS_DISPONIVEIS.find((c) => c.id === colunaId)?.obrigatoria) return;
    
    setConfig((prev) => ({
      ...prev,
      colunasSelecionadas: prev.colunasSelecionadas.includes(colunaId)
        ? prev.colunasSelecionadas.filter((c) => c !== colunaId)
        : [...prev.colunasSelecionadas, colunaId],
    }));
  };

  const agruparPortarias = () => {
    const sorted = [...portariasFiltradas].sort((a, b) => {
      let aVal: string | Date;
      let bVal: string | Date;
      
      switch (config.ordenacao) {
        case 'numero':
          aVal = a.numero;
          bVal = b.numero;
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'categoria':
          aVal = a.categoria || '';
          bVal = b.categoria || '';
          break;
        default:
          aVal = new Date(a.data_documento);
          bVal = new Date(b.data_documento);
      }
      
      const comp = String(aVal).localeCompare(String(bVal));
      return config.ordenacaoDir === 'asc' ? comp : -comp;
    });

    if (config.agrupamento === 'nenhum') {
      return [{ key: 'todas', label: 'Todas as Portarias', items: sorted }];
    }

    const grupos: Record<string, Portaria[]> = {};

    sorted.forEach((p) => {
      let key: string;
      
      switch (config.agrupamento) {
        case 'status':
          key = p.status;
          break;
        case 'categoria':
          key = p.categoria || 'sem_categoria';
          break;
        case 'unidade':
          key = p.unidade?.nome || 'Sem Unidade';
          break;
        case 'mes':
          key = format(new Date(p.data_documento), 'MMMM yyyy', { locale: ptBR });
          break;
        case 'servidor':
          key = String(p.servidores_ids?.length || 0) + ' servidor(es)';
          break;
        default:
          key = 'outros';
      }

      if (!grupos[key]) grupos[key] = [];
      grupos[key].push(p);
    });

    return Object.entries(grupos).map(([key, items]) => ({
      key,
      label: config.agrupamento === 'status'
        ? STATUS_PORTARIA_LABELS[key as StatusPortaria] || key
        : key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      items,
    }));
  };

  const handleGerarPDF = async () => {
    setIsGenerating(true);
    try {
      const grupos = agruparPortarias();
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      // Carregar logos se habilitado
      let logoGov: HTMLImageElement | null = null;
      let logoIdjuv: HTMLImageElement | null = null;
      
      if (config.incluirLogos) {
        try {
          const loadImg = (src: string): Promise<HTMLImageElement> =>
            new Promise((resolve, reject) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => resolve(img);
              img.onerror = reject;
              img.src = src;
            });
          
          [logoGov, logoIdjuv] = await Promise.all([
            loadImg('/assets/logo-governo-roraima.jpg').catch(() => null),
            loadImg('/assets/logo-idjuv-oficial.png').catch(() => null),
          ]);
        } catch {
          // Continua sem logos
        }
      }

      // Header
      const addHeader = () => {
        y = margin;
        
        if (config.incluirLogos && logoGov && logoIdjuv) {
          doc.addImage(logoGov, 'JPEG', margin, y, 30, 15);
          doc.addImage(logoIdjuv, 'PNG', pageWidth - margin - 30, y, 30, 15);
          y += 20;
        }
        
        doc.setFillColor(0, 100, 60);
        doc.rect(margin, y, contentWidth, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(config.titulo, pageWidth / 2, y + 8, { align: 'center' });
        y += 14;
        
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(config.subtitulo, pageWidth / 2, y + 4, { align: 'center' });
        y += 10;
        
        doc.setFontSize(8);
        doc.text(
          `Gerado em: ${format(new Date(), 'dd/MM/yyyy HH:mm')} | Total: ${portariasFiltradas.length} portaria(s)`,
          pageWidth / 2,
          y + 3,
          { align: 'center' }
        );
        y += 10;
      };

      // Footer
      const addFooter = (pageNum: number) => {
        doc.setFillColor(0, 100, 60);
        doc.rect(0, pageHeight - 12, pageWidth, 12, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text('Sistema de Gestão de Portarias - IDJUV', margin, pageHeight - 5);
        doc.text(`Página ${pageNum}`, pageWidth - margin - 15, pageHeight - 5);
      };

      // Calcular larguras das colunas
      const colunasAtivas = COLUNAS_DISPONIVEIS.filter((c) =>
        config.colunasSelecionadas.includes(c.id)
      );
      const colWidth = contentWidth / colunasAtivas.length;

      const checkPageBreak = (neededHeight: number): void => {
        if (y + neededHeight > pageHeight - 20) {
          addFooter(doc.getNumberOfPages());
          doc.addPage();
          addHeader();
        }
      };

      // Render
      addHeader();

      // Resumo se habilitado
      if (config.mostrarResumo) {
        checkPageBreak(40);
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, y, contentWidth, 25, 'F');
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('RESUMO', margin + 3, y + 6);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        let resumoX = margin + 3;
        const statusCounts: Record<string, number> = {};
        portariasFiltradas.forEach((p) => {
          statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
        });
        
        let resumoY = y + 13;
        Object.entries(statusCounts).forEach(([status, count]) => {
          const label = `${STATUS_PORTARIA_LABELS[status as StatusPortaria] || status}: ${count}`;
          doc.text(label, resumoX, resumoY);
          resumoX += 40;
          if (resumoX > pageWidth - margin - 40) {
            resumoX = margin + 3;
            resumoY += 5;
          }
        });
        
        y += 30;
      }

      // Grupos
      grupos.forEach((grupo) => {
        checkPageBreak(30);
        
        // Header do grupo
        doc.setFillColor(0, 100, 60);
        doc.rect(margin, y, contentWidth, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`${grupo.label} (${grupo.items.length})`, margin + 3, y + 5.5);
        y += 10;

        // Table header
        doc.setFillColor(220, 220, 220);
        doc.rect(margin, y, contentWidth, 6, 'F');
        doc.setTextColor(60, 60, 60);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        
        colunasAtivas.forEach((col, i) => {
          doc.text(col.label.toUpperCase(), margin + i * colWidth + 2, y + 4);
        });
        y += 8;

        // Rows
        doc.setFont('helvetica', 'normal');
        grupo.items.forEach((portaria, rowIdx) => {
          checkPageBreak(8);
          
          if (rowIdx % 2 === 0) {
            doc.setFillColor(250, 250, 250);
            doc.rect(margin, y - 2, contentWidth, 6, 'F');
          }
          
          doc.setTextColor(40, 40, 40);
          doc.setFontSize(7);
          
          colunasAtivas.forEach((col, i) => {
            let valor = '';
            switch (col.id) {
              case 'numero':
                valor = portaria.numero;
                break;
              case 'titulo':
                valor = (portaria.titulo || '').substring(0, 25);
                break;
              case 'categoria':
                valor = (portaria.categoria || '-').substring(0, 15);
                break;
              case 'status':
                valor = STATUS_PORTARIA_LABELS[portaria.status] || portaria.status;
                break;
              case 'data_documento':
                valor = format(new Date(portaria.data_documento), 'dd/MM/yyyy');
                break;
              case 'ementa':
                valor = (portaria.ementa || '-').substring(0, 30);
                break;
              case 'servidores':
                valor = String(portaria.servidores_ids?.length || 0);
                break;
              case 'unidade':
                valor = (portaria.unidade?.sigla || portaria.unidade?.nome || '-').substring(0, 12);
                break;
              case 'cargo':
                valor = (portaria.cargo?.sigla || portaria.cargo?.nome || '-').substring(0, 12);
                break;
              case 'doe_numero':
                valor = portaria.doe_numero || '-';
                break;
              case 'doe_data':
                valor = portaria.doe_data ? format(new Date(portaria.doe_data), 'dd/MM/yy') : '-';
                break;
            }
            doc.text(valor, margin + i * colWidth + 2, y + 2);
          });
          
          y += 6;
        });

        // Subtotal do grupo
        if (config.mostrarTotais) {
          doc.setFillColor(240, 240, 240);
          doc.rect(margin, y, contentWidth, 5, 'F');
          doc.setFontSize(7);
          doc.setFont('helvetica', 'italic');
          doc.setTextColor(80, 80, 80);
          doc.text(`Subtotal: ${grupo.items.length} portaria(s)`, margin + 3, y + 3.5);
          y += 8;
        }
        
        y += 5;
      });

      // Total geral
      if (config.mostrarTotais) {
        checkPageBreak(15);
        doc.setFillColor(0, 100, 60);
        doc.rect(margin, y, contentWidth, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text(`TOTAL GERAL: ${portariasFiltradas.length} portaria(s)`, margin + 3, y + 5.5);
      }

      addFooter(doc.getNumberOfPages());

      // Salvar
      const filename = `Relatorio_Portarias_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`;
      doc.save(filename);
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
