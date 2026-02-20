import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  Loader2, 
  ChevronDown, 
  ChevronRight,
  CheckSquare,
  Square
} from "lucide-react";
import { toast } from "sonner";
import { 
  CAMPOS_EXPORTACAO, 
  CAMPOS_PADRAO, 
  CATEGORIAS_CAMPOS,
  exportarParaExcel,
  exportarParaCSV 
} from "@/lib/exportarPlanilha";
import { VINCULO_LABELS, SITUACAO_LABELS } from "@/types/rh";

export function ExportacaoServidoresCard() {
  const [camposSelecionados, setCamposSelecionados] = useState<string[]>(CAMPOS_PADRAO);
  const [formato, setFormato] = useState<'xlsx' | 'csv'>('xlsx');
  const [filtroUnidade, setFiltroUnidade] = useState<string>("all");
  const [filtroVinculo, setFiltroVinculo] = useState<string>("all");
  const [filtroSituacao, setFiltroSituacao] = useState<string>("all");
  const [categoriasAbertas, setCategoriasAbertas] = useState<string[]>(['Dados Pessoais', 'Dados Funcionais']);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch unidades
  const { data: unidades = [] } = useQuery({
    queryKey: ["unidades-export"],
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

    setIsExporting(true);
    try {
      // Buscar servidores com filtros
      let query = supabase
        .from("servidores")
        .select(`
          *,
          cargo:cargos(id, nome, sigla),
          unidade:estrutura_organizacional(id, nome, sigla)
        `)
        .eq("ativo", true);

      if (filtroUnidade !== "all") {
        query = query.eq("unidade_atual_id", filtroUnidade);
      }
      if (filtroVinculo !== "all") {
        query = query.eq("vinculo", filtroVinculo as any);
      }
      if (filtroSituacao !== "all") {
        query = query.eq("situacao", filtroSituacao as any);
      }

      const { data: servidores, error } = await query.order("nome_completo");

      if (error) throw error;

      if (!servidores || servidores.length === 0) {
        toast.error("Nenhum servidor encontrado com os filtros selecionados");
        return;
      }

      // Adicionar labels de vínculo e situação
      const servidoresComLabels = servidores.map(s => ({
        ...s,
        vinculo_label: s.vinculo ? (VINCULO_LABELS[s.vinculo as keyof typeof VINCULO_LABELS] || s.vinculo) : '',
        situacao_label: s.situacao ? (SITUACAO_LABELS[s.situacao as keyof typeof SITUACAO_LABELS] || s.situacao) : '',
      }));

      if (formato === 'xlsx') {
        exportarParaExcel(servidoresComLabels, camposSelecionados);
      } else {
        exportarParaCSV(servidoresComLabels, camposSelecionados);
      }

      toast.success(`Planilha exportada com sucesso! (${servidores.length} servidores)`);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao exportar planilha");
    } finally {
      setIsExporting(false);
    }
  };

  const camposCategoriaSelecionados = (categoria: string) => {
    const camposCategoria = CATEGORIAS_CAMPOS[categoria].map(c => c.id);
    return camposSelecionados.filter(c => camposCategoria.includes(c)).length;
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <FileSpreadsheet className="h-5 w-5 text-accent-foreground" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">Relatório Configurável de Servidores</CardTitle>
            <CardDescription>Selecione os campos desejados e exporte para Excel ou CSV</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formato de exportação */}
        <div className="space-y-2">
          <Label>Formato de Exportação</Label>
          <RadioGroup 
            value={formato} 
            onValueChange={(v) => setFormato(v as 'xlsx' | 'csv')}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="xlsx" id="xlsx" />
              <Label htmlFor="xlsx" className="font-normal cursor-pointer">
                Excel (.xlsx)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="csv" id="csv" />
              <Label htmlFor="csv" className="font-normal cursor-pointer">
                CSV (.csv)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Seleção de campos */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Campos para Exportação ({camposSelecionados.length} selecionados)</Label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={marcarTodos}>
                <CheckSquare className="h-4 w-4 mr-1" />
                Marcar Todos
              </Button>
              <Button variant="outline" size="sm" onClick={desmarcarTodos}>
                <Square className="h-4 w-4 mr-1" />
                Desmarcar Todos
              </Button>
            </div>
          </div>

          <div className="border rounded-lg divide-y max-h-[400px] overflow-y-auto">
            {Object.entries(CATEGORIAS_CAMPOS).map(([categoria, campos]) => {
              const isOpen = categoriasAbertas.includes(categoria);
              const selecionados = camposCategoriaSelecionados(categoria);
              const total = campos.length;
              
              return (
                <Collapsible key={categoria} open={isOpen}>
                  <CollapsibleTrigger 
                    className="flex items-center justify-between w-full p-3 hover:bg-muted/50 transition-colors"
                    onClick={() => toggleCategoria(categoria)}
                  >
                    <div className="flex items-center gap-2">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium">{categoria}</span>
                      <span className="text-sm text-muted-foreground">
                        ({selecionados}/{total})
                      </span>
                    </div>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs"
                        onClick={() => marcarTodosCategoria(categoria)}
                      >
                        Todos
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs"
                        onClick={() => desmarcarTodosCategoria(categoria)}
                      >
                        Nenhum
                      </Button>
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-3 pt-0 bg-muted/30">
                      {campos.map((campo) => (
                        <div key={campo.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={campo.id}
                            checked={camposSelecionados.includes(campo.id)}
                            onCheckedChange={() => toggleCampo(campo.id)}
                          />
                          <Label 
                            htmlFor={campo.id} 
                            className="text-sm font-normal cursor-pointer"
                          >
                            {campo.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </div>

        {/* Filtros opcionais */}
        <div className="space-y-3">
          <Label>Filtros Opcionais</Label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Unidade</Label>
              <Select value={filtroUnidade} onValueChange={setFiltroUnidade}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as unidades</SelectItem>
                  {unidades.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.sigla ? `${u.sigla} - ${u.nome}` : u.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Vínculo</Label>
              <Select value={filtroVinculo} onValueChange={setFiltroVinculo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os vínculos</SelectItem>
                  {Object.entries(VINCULO_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Situação</Label>
              <Select value={filtroSituacao} onValueChange={setFiltroSituacao}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as situações</SelectItem>
                  {Object.entries(SITUACAO_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Botão de exportar */}
        <Button 
          className="w-full" 
          size="lg"
          onClick={handleExportar}
          disabled={isExporting || camposSelecionados.length === 0}
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Exportar Planilha ({formato.toUpperCase()})
        </Button>
      </CardContent>
    </Card>
  );
}
