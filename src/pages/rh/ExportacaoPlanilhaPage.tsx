import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ModuleLayout } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { 
  FileSpreadsheet, 
  Download, 
  Search, 
  ChevronDown, 
  ChevronRight,
  CheckSquare,
  Square,
  Eye,
  Filter,
  Columns3,
  Table as TableIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  CAMPOS_EXPORTACAO,
  CATEGORIAS_CAMPOS,
  CAMPOS_PADRAO,
  exportarParaExcel,
  exportarParaCSV,
} from "@/lib/exportarPlanilha";
import { 
  VINCULO_LABELS, 
  SITUACAO_LABELS,
  type VinculoFuncional,
  type SituacaoFuncional,
} from "@/types/rh";

export default function ExportacaoPlanilhaPage() {
  const [camposSelecionados, setCamposSelecionados] = useState<string[]>(CAMPOS_PADRAO);
  const [formato, setFormato] = useState<'xlsx' | 'csv'>('xlsx');
  const [filtroUnidade, setFiltroUnidade] = useState<string>("all");
  const [filtroVinculo, setFiltroVinculo] = useState<string>("all");
  const [filtroSituacao, setFiltroSituacao] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoriasAbertas, setCategoriasAbertas] = useState<string[]>(['Dados Pessoais', 'Dados Funcionais']);
  const [isExporting, setIsExporting] = useState(false);
  const [showColumnSelector, setShowColumnSelector] = useState(true);

  // Fetch unidades
  const { data: unidades = [] } = useQuery({
    queryKey: ["unidades-export-planilha"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estrutura_organizacional")
        .select("id, nome, sigla")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Fetch servidores com filtros
  const { data: servidores = [], isLoading } = useQuery({
    queryKey: ["servidores-planilha", filtroUnidade, filtroVinculo, filtroSituacao],
    queryFn: async () => {
      let query = supabase
        .from("servidores")
        .select(`
          *,
          cargo:cargos!servidores_cargo_atual_id_fkey(id, nome, sigla),
          unidade:estrutura_organizacional!servidores_unidade_atual_id_fkey(id, nome, sigla)
        `)
        .eq("ativo", true);

      if (filtroUnidade !== "all") {
        query = query.eq("unidade_atual_id", filtroUnidade);
      }
      if (filtroVinculo !== "all") {
        query = query.eq("vinculo", filtroVinculo as VinculoFuncional);
      }
      if (filtroSituacao !== "all") {
        query = query.eq("situacao", filtroSituacao as SituacaoFuncional);
      }

      const { data, error } = await query.order("nome_completo");
      if (error) throw error;
      
      const servidorIds = (data || []).map(s => s.id);
      
      // Buscar provimentos ativos
      let provimentosMap: Record<string, { data_nomeacao: string | null; data_posse: string | null; data_exercicio: string | null }> = {};
      if (servidorIds.length > 0) {
        const { data: provimentos } = await supabase
          .from("provimentos")
          .select("servidor_id, data_nomeacao, data_posse, data_exercicio")
          .in("servidor_id", servidorIds)
          .eq("status", "ativo");
        
        if (provimentos) {
          provimentosMap = provimentos.reduce((acc, p) => {
            acc[p.servidor_id] = {
              data_nomeacao: p.data_nomeacao,
              data_posse: p.data_posse,
              data_exercicio: p.data_exercicio,
            };
            return acc;
          }, {} as typeof provimentosMap);
        }
      }
      
      // Buscar portarias de nomeação vinculadas aos servidores
      let portariasMap: Record<string, { numero: string; data_documento: string }> = {};
      if (servidorIds.length > 0) {
        const { data: portarias } = await supabase
          .from("documentos")
          .select("numero, data_documento, servidores_ids")
          .eq("tipo", "portaria")
          .in("categoria", ["nomeacao", "pessoal"])
          .not("servidores_ids", "is", null);
        
        if (portarias) {
          portarias.forEach(p => {
            if (p.servidores_ids && Array.isArray(p.servidores_ids)) {
              p.servidores_ids.forEach((servId: string) => {
                // Pegar a portaria mais recente para cada servidor
                if (!portariasMap[servId] || p.data_documento > portariasMap[servId].data_documento) {
                  portariasMap[servId] = {
                    numero: p.numero,
                    data_documento: p.data_documento,
                  };
                }
              });
            }
          });
        }
      }
      
      // Adicionar labels, provimentos e portarias
      return (data || []).map(s => ({
        ...s,
        vinculo_label: s.vinculo ? (VINCULO_LABELS[s.vinculo as VinculoFuncional] || s.vinculo) : '',
        situacao_label: s.situacao ? (SITUACAO_LABELS[s.situacao as SituacaoFuncional] || s.situacao) : '',
        provimento: provimentosMap[s.id] || null,
        portaria_nomeacao: portariasMap[s.id] || null,
      }));
    },
  });

  // Filtrar por busca
  const servidoresFiltrados = useMemo(() => {
    if (!searchTerm) return servidores;
    const termo = searchTerm.toLowerCase();
    return servidores.filter(s => 
      s.nome_completo?.toLowerCase().includes(termo) ||
      s.cpf?.includes(termo) ||
      s.matricula?.toLowerCase().includes(termo)
    );
  }, [servidores, searchTerm]);

  // Campos selecionados para exibição
  const camposVisiveis = useMemo(() => {
    return CAMPOS_EXPORTACAO.filter(c => camposSelecionados.includes(c.id));
  }, [camposSelecionados]);

  const toggleCategoria = (categoria: string) => {
    setCategoriasAbertas(prev => 
      prev.includes(categoria) 
        ? prev.filter(c => c !== categoria)
        : [...prev, categoria]
    );
  };

  const toggleCampo = (campoId: string) => {
    setCamposSelecionados(prev =>
      prev.includes(campoId)
        ? prev.filter(c => c !== campoId)
        : [...prev, campoId]
    );
  };

  const marcarTodosCategoria = (categoria: string) => {
    const camposCategoria = CATEGORIAS_CAMPOS[categoria].map(c => c.id);
    setCamposSelecionados(prev => {
      const outros = prev.filter(c => !camposCategoria.includes(c));
      return [...outros, ...camposCategoria];
    });
  };

  const desmarcarTodosCategoria = (categoria: string) => {
    const camposCategoria = CATEGORIAS_CAMPOS[categoria].map(c => c.id);
    setCamposSelecionados(prev => prev.filter(c => !camposCategoria.includes(c)));
  };

  const marcarTodos = () => {
    setCamposSelecionados(CAMPOS_EXPORTACAO.map(c => c.id));
  };

  const desmarcarTodos = () => {
    setCamposSelecionados([]);
  };

  const handleExportar = async () => {
    if (camposSelecionados.length === 0) {
      toast.error("Selecione pelo menos um campo para exportar");
      return;
    }

    if (servidoresFiltrados.length === 0) {
      toast.error("Nenhum servidor para exportar com os filtros selecionados");
      return;
    }

    setIsExporting(true);
    try {
      if (formato === 'xlsx') {
        exportarParaExcel(servidoresFiltrados, camposSelecionados);
        toast.success(`Planilha Excel gerada com ${servidoresFiltrados.length} registros`);
      } else {
        exportarParaCSV(servidoresFiltrados, camposSelecionados);
        toast.success(`Arquivo CSV gerado com ${servidoresFiltrados.length} registros`);
      }
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error("Erro ao gerar arquivo de exportação");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <ProtectedRoute requiredModule="rh">
      <ModuleLayout module="rh">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileSpreadsheet className="h-6 w-6 text-primary" />
                Exportação de Planilha
              </h1>
              <p className="text-muted-foreground">
                Selecione as colunas, visualize os dados e exporte para Excel ou CSV
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={formato} onValueChange={(v: 'xlsx' | 'csv') => setFormato(v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                  <SelectItem value="csv">CSV (.csv)</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleExportar} 
                disabled={isExporting || camposSelecionados.length === 0 || servidoresFiltrados.length === 0}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                {isExporting ? "Gerando..." : "Exportar"}
              </Button>
            </div>
          </div>

          {/* Estatísticas */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Registros</p>
                    <p className="text-2xl font-bold">{servidoresFiltrados.length}</p>
                  </div>
                  <TableIcon className="h-8 w-8 text-muted-foreground/30" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Colunas Selecionadas</p>
                    <p className="text-2xl font-bold">{camposSelecionados.length}</p>
                  </div>
                  <Columns3 className="h-8 w-8 text-muted-foreground/30" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Campos Disponíveis</p>
                    <p className="text-2xl font-bold">{CAMPOS_EXPORTACAO.length}</p>
                  </div>
                  <CheckSquare className="h-8 w-8 text-muted-foreground/30" />
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Formato</p>
                    <p className="text-2xl font-bold uppercase">{formato}</p>
                  </div>
                  <FileSpreadsheet className="h-8 w-8 text-muted-foreground/30" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-12 gap-4">
            {/* Seletor de Colunas */}
            <div className={showColumnSelector ? "col-span-3" : "col-span-1"}>
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Columns3 className="h-4 w-4" />
                      {showColumnSelector && "Colunas"}
                    </CardTitle>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowColumnSelector(!showColumnSelector)}
                    >
                      {showColumnSelector ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </CardHeader>
                {showColumnSelector && (
                  <CardContent className="flex-1 overflow-hidden p-2">
                    <div className="flex gap-2 mb-3">
                      <Button variant="outline" size="sm" onClick={marcarTodos} className="flex-1 text-xs">
                        <CheckSquare className="h-3 w-3 mr-1" />
                        Todos
                      </Button>
                      <Button variant="outline" size="sm" onClick={desmarcarTodos} className="flex-1 text-xs">
                        <Square className="h-3 w-3 mr-1" />
                        Nenhum
                      </Button>
                    </div>
                    <ScrollArea className="h-[480px] pr-2">
                      <div className="space-y-2">
                        {Object.entries(CATEGORIAS_CAMPOS).map(([categoria, campos]) => {
                          const selecionadosCategoria = campos.filter(c => camposSelecionados.includes(c.id)).length;
                          const isOpen = categoriasAbertas.includes(categoria);
                          
                          return (
                            <Collapsible key={categoria} open={isOpen} onOpenChange={() => toggleCategoria(categoria)}>
                              <CollapsibleTrigger className="w-full">
                                <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 border">
                                  <div className="flex items-center gap-2">
                                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                    <span className="text-sm font-medium">{categoria}</span>
                                  </div>
                                  <Badge variant="secondary" className="text-xs">
                                    {selecionadosCategoria}/{campos.length}
                                  </Badge>
                                </div>
                              </CollapsibleTrigger>
                              <CollapsibleContent className="pl-4 pt-1">
                                <div className="flex gap-1 mb-2">
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => marcarTodosCategoria(categoria)}
                                    className="text-xs h-6 px-2"
                                  >
                                    Marcar
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => desmarcarTodosCategoria(categoria)}
                                    className="text-xs h-6 px-2"
                                  >
                                    Desmarcar
                                  </Button>
                                </div>
                                <div className="space-y-1">
                                  {campos.map(campo => (
                                    <label 
                                      key={campo.id}
                                      className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/30 cursor-pointer"
                                    >
                                      <Checkbox
                                        checked={camposSelecionados.includes(campo.id)}
                                        onCheckedChange={() => toggleCampo(campo.id)}
                                      />
                                      <span className="text-xs">{campo.label}</span>
                                    </label>
                                  ))}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </CardContent>
                )}
              </Card>
            </div>

            {/* Preview da Tabela */}
            <div className={showColumnSelector ? "col-span-9" : "col-span-11"}>
              <Card className="h-[600px] flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Preview dos Dados
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <div className="relative w-60">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Buscar por nome, CPF ou matrícula..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8 h-9"
                        />
                      </div>
                      <Select value={filtroUnidade} onValueChange={setFiltroUnidade}>
                        <SelectTrigger className="w-[160px] h-9">
                          <Filter className="h-3 w-3 mr-1" />
                          <SelectValue placeholder="Unidade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas Unidades</SelectItem>
                          {unidades.map((u) => (
                            <SelectItem key={u.id} value={u.id}>
                              {u.sigla || u.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={filtroVinculo} onValueChange={setFiltroVinculo}>
                        <SelectTrigger className="w-[130px] h-9">
                          <SelectValue placeholder="Vínculo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos Vínculos</SelectItem>
                          {Object.entries(VINCULO_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={filtroSituacao} onValueChange={setFiltroSituacao}>
                        <SelectTrigger className="w-[130px] h-9">
                          <SelectValue placeholder="Situação" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todas Situações</SelectItem>
                          {Object.entries(SITUACAO_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <CardDescription>
                    Visualização prévia dos {servidoresFiltrados.length} registros que serão exportados
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-2">
                  {camposSelecionados.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <Columns3 className="h-12 w-12 mx-auto mb-2 opacity-30" />
                        <p>Selecione ao menos uma coluna para visualizar os dados</p>
                      </div>
                    </div>
                  ) : isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : servidoresFiltrados.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <div className="text-center">
                        <TableIcon className="h-12 w-12 mx-auto mb-2 opacity-30" />
                        <p>Nenhum servidor encontrado com os filtros aplicados</p>
                      </div>
                    </div>
                  ) : (
                    <ScrollArea className="h-full">
                      <div className="min-w-max">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[50px] sticky left-0 bg-background z-10">#</TableHead>
                              {camposVisiveis.map(campo => (
                                <TableHead key={campo.id} className="whitespace-nowrap">
                                  {campo.label}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {servidoresFiltrados.slice(0, 100).map((servidor, index) => (
                              <TableRow key={servidor.id}>
                                <TableCell className="font-medium sticky left-0 bg-background z-10">
                                  {index + 1}
                                </TableCell>
                                {camposVisiveis.map(campo => (
                                  <TableCell key={campo.id} className="whitespace-nowrap">
                                    {campo.getValue(servidor) ?? '-'}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                  )}
                  {servidoresFiltrados.length > 100 && (
                    <div className="text-center text-sm text-muted-foreground py-2 border-t">
                      Exibindo 100 de {servidoresFiltrados.length} registros. Todos serão incluídos na exportação.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </ModuleLayout>
    </ProtectedRoute>
  );
}
