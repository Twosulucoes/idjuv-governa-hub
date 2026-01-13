import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Pencil, Trash2, Briefcase, Eye, EyeOff, Building2, FileDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { CargoForm, type CargoFormData, type ComposicaoItem } from "@/components/cargos/CargoForm";
import { CargoDetailDialog } from "@/components/cargos/CargoDetailDialog";
import { generateRelatorioCargos } from "@/lib/pdfGenerator";

type Cargo = {
  id: string;
  nome: string;
  sigla: string | null;
  categoria: 'efetivo' | 'comissionado' | 'funcao_gratificada' | 'temporario' | 'estagiario';
  nivel_hierarquico: number | null;
  escolaridade: string | null;
  vencimento_base: number | null;
  quantidade_vagas: number | null;
  ativo: boolean | null;
  cbo: string | null;
  atribuicoes: string | null;
  competencias: string[] | null;
  responsabilidades: string[] | null;
  requisitos: string[] | null;
  conhecimentos_necessarios: string[] | null;
  experiencia_exigida: string | null;
  lei_criacao_numero: string | null;
  lei_criacao_data: string | null;
  lei_criacao_artigo: string | null;
  lei_documento_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type ComposicaoResumo = {
  unidade_id: string;
  unidade_nome: string;
  unidade_sigla: string | null;
  quantidade_vagas: number;
};

type CargoComOcupacao = Cargo & {
  ocupadas: number;
  composicao: ComposicaoResumo[];
};

const CATEGORIA_LABELS: Record<string, string> = {
  efetivo: "Efetivo",
  comissionado: "Comissionado",
  funcao_gratificada: "Função Gratificada",
  temporario: "Temporário",
  estagiario: "Estagiário",
};

const CATEGORIA_COLORS: Record<string, string> = {
  efetivo: "bg-success/20 text-success border-success/30",
  comissionado: "bg-primary/20 text-primary border-primary/30",
  funcao_gratificada: "bg-warning/20 text-warning border-warning/30",
  temporario: "bg-info/20 text-info border-info/30",
  estagiario: "bg-secondary/20 text-secondary-foreground border-secondary/30",
};

export default function GestaoCargosPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCargo, setSelectedCargo] = useState<CargoComOcupacao | null>(null);
  const [selectedComposicao, setSelectedComposicao] = useState<ComposicaoItem[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const queryClient = useQueryClient();

  const { data: cargos = [], isLoading } = useQuery({
    queryKey: ["cargos", showInactive],
    queryFn: async () => {
      let query = supabase
        .from("cargos")
        .select("*")
        .order("nivel_hierarquico", { ascending: true })
        .order("nome", { ascending: true });

      if (!showInactive) {
        query = query.eq("ativo", true);
      }

      const { data: cargosData, error } = await query;
      if (error) throw error;

      // Buscar contagem de lotações ativas por cargo
      const { data: lotacoesCount, error: lotacoesError } = await supabase
        .from("lotacoes")
        .select("cargo_id")
        .eq("ativo", true)
        .not("cargo_id", "is", null);

      if (lotacoesError) throw lotacoesError;

      // Buscar composição de cargos por unidade
      const { data: composicaoData, error: composicaoError } = await supabase
        .from("composicao_cargos")
        .select(`
          cargo_id,
          unidade_id,
          quantidade_vagas,
          estrutura_organizacional!inner(nome, sigla)
        `);

      if (composicaoError) throw composicaoError;

      // Agrupar composição por cargo
      const composicaoPorCargo = (composicaoData || []).reduce((acc, item: any) => {
        if (!acc[item.cargo_id]) {
          acc[item.cargo_id] = [];
        }
        acc[item.cargo_id].push({
          unidade_id: item.unidade_id,
          unidade_nome: item.estrutura_organizacional?.nome || '',
          unidade_sigla: item.estrutura_organizacional?.sigla || null,
          quantidade_vagas: item.quantidade_vagas,
        });
        return acc;
      }, {} as Record<string, ComposicaoResumo[]>);

      // Contar ocupações por cargo
      const ocupacaoPorCargo = lotacoesCount?.reduce((acc, lot) => {
        if (lot.cargo_id) {
          acc[lot.cargo_id] = (acc[lot.cargo_id] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>) || {};

      // Adicionar contagem aos cargos
      const cargosComOcupacao: CargoComOcupacao[] = (cargosData as Cargo[]).map(cargo => ({
        ...cargo,
        ocupadas: ocupacaoPorCargo[cargo.id] || 0,
        composicao: composicaoPorCargo[cargo.id] || [],
      }));

      return cargosComOcupacao;
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ data, composicao }: { data: CargoFormData; composicao: ComposicaoItem[] }) => {
      // Criar o cargo
      const { data: novoCargo, error } = await supabase.from("cargos").insert({
        nome: data.nome,
        sigla: data.sigla || null,
        categoria: data.categoria,
        nivel_hierarquico: data.nivel_hierarquico,
        escolaridade: data.escolaridade || null,
        vencimento_base: data.vencimento_base || null,
        quantidade_vagas: data.quantidade_vagas,
        cbo: data.cbo || null,
        atribuicoes: data.atribuicoes || null,
        competencias: data.competencias?.length ? data.competencias : null,
        responsabilidades: data.responsabilidades?.length ? data.responsabilidades : null,
        requisitos: data.requisitos?.length ? data.requisitos : null,
        conhecimentos_necessarios: data.conhecimentos_necessarios?.length ? data.conhecimentos_necessarios : null,
        experiencia_exigida: data.experiencia_exigida || null,
        lei_criacao_numero: data.lei_criacao_numero || null,
        lei_criacao_data: data.lei_criacao_data || null,
        lei_criacao_artigo: data.lei_criacao_artigo || null,
        lei_documento_url: data.lei_documento_url || null,
        ativo: true,
      }).select("id").single();
      if (error) throw error;

      // Criar composição de cargos
      if (composicao.length > 0 && novoCargo) {
        const { error: compError } = await supabase.from("composicao_cargos").insert(
          composicao.map(c => ({
            cargo_id: novoCargo.id,
            unidade_id: c.unidade_id,
            quantidade_vagas: c.quantidade_vagas,
          }))
        );
        if (compError) throw compError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cargos"] });
      queryClient.invalidateQueries({ queryKey: ["composicao-cargo"] });
      toast.success("Cargo criado com sucesso!");
      setIsFormOpen(false);
      setSelectedCargo(null);
      setSelectedComposicao([]);
    },
    onError: (error: Error) => {
      console.error("Erro ao criar cargo:", error);
      if (error.message.includes("composicao_cargos") || error.message.includes("row-level security")) {
        toast.error("Erro ao salvar distribuição de vagas. Verifique suas permissões de acesso.");
      } else {
        toast.error("Erro ao criar cargo: " + error.message);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data, composicao }: { id: string; data: CargoFormData; composicao: ComposicaoItem[] }) => {
      // Atualizar o cargo
      const { error } = await supabase
        .from("cargos")
        .update({
          nome: data.nome,
          sigla: data.sigla || null,
          categoria: data.categoria,
          nivel_hierarquico: data.nivel_hierarquico,
          escolaridade: data.escolaridade || null,
          vencimento_base: data.vencimento_base || null,
          quantidade_vagas: data.quantidade_vagas,
          cbo: data.cbo || null,
          atribuicoes: data.atribuicoes || null,
          competencias: data.competencias?.length ? data.competencias : null,
          responsabilidades: data.responsabilidades?.length ? data.responsabilidades : null,
          requisitos: data.requisitos?.length ? data.requisitos : null,
          conhecimentos_necessarios: data.conhecimentos_necessarios?.length ? data.conhecimentos_necessarios : null,
          experiencia_exigida: data.experiencia_exigida || null,
          lei_criacao_numero: data.lei_criacao_numero || null,
          lei_criacao_data: data.lei_criacao_data || null,
          lei_criacao_artigo: data.lei_criacao_artigo || null,
          lei_documento_url: data.lei_documento_url || null,
        })
        .eq("id", id);
      if (error) throw error;

      // Deletar composições existentes e recriar
      const { error: deleteError } = await supabase
        .from("composicao_cargos")
        .delete()
        .eq("cargo_id", id);
      if (deleteError) throw deleteError;

      // Criar novas composições
      if (composicao.length > 0) {
        const { error: compError } = await supabase.from("composicao_cargos").insert(
          composicao.map(c => ({
            cargo_id: id,
            unidade_id: c.unidade_id,
            quantidade_vagas: c.quantidade_vagas,
          }))
        );
        if (compError) throw compError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cargos"] });
      queryClient.invalidateQueries({ queryKey: ["composicao-cargo"] });
      toast.success("Cargo atualizado com sucesso!");
      setIsFormOpen(false);
      setSelectedCargo(null);
      setSelectedComposicao([]);
    },
    onError: (error: Error) => {
      console.error("Erro ao atualizar cargo:", error);
      if (error.message.includes("composicao_cargos") || error.message.includes("row-level security")) {
        toast.error("Erro ao salvar distribuição de vagas. Verifique suas permissões de acesso.");
      } else {
        toast.error("Erro ao atualizar cargo: " + error.message);
      }
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from("cargos")
        .update({ ativo })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { ativo }) => {
      queryClient.invalidateQueries({ queryKey: ["cargos"] });
      toast.success(ativo ? "Cargo ativado!" : "Cargo desativado!");
      setIsDeleteOpen(false);
      setSelectedCargo(null);
    },
    onError: () => {
      toast.error("Erro ao alterar status do cargo");
    },
  });

  const filteredCargos = cargos.filter(
    (cargo) =>
      cargo.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cargo.sigla?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cargo.cbo?.includes(searchTerm)
  );

  const handleEdit = async (cargo: CargoComOcupacao) => {
    setSelectedCargo(cargo);
    // Buscar composição existente
    const { data: composicaoData } = await supabase
      .from("composicao_cargos")
      .select(`
        id,
        unidade_id,
        quantidade_vagas,
        estrutura_organizacional!inner(nome, sigla)
      `)
      .eq("cargo_id", cargo.id);
    
    const composicaoFormatada: ComposicaoItem[] = (composicaoData || []).map((c: any) => ({
      id: c.id,
      unidade_id: c.unidade_id,
      quantidade_vagas: c.quantidade_vagas,
      unidade_nome: c.estrutura_organizacional?.nome,
      unidade_sigla: c.estrutura_organizacional?.sigla,
    }));
    
    setSelectedComposicao(composicaoFormatada);
    setIsFormOpen(true);
  };

  const handleView = (cargo: CargoComOcupacao) => {
    setSelectedCargo(cargo);
    setIsDetailOpen(true);
  };

  const handleDelete = (cargo: CargoComOcupacao) => {
    setSelectedCargo(cargo);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = (data: CargoFormData, composicao: ComposicaoItem[]) => {
    if (selectedCargo) {
      updateMutation.mutate({ id: selectedCargo.id, data, composicao });
    } else {
      createMutation.mutate({ data, composicao });
    }
  };

  const handleOpenCreate = () => {
    setSelectedCargo(null);
    setSelectedComposicao([]);
    setIsFormOpen(true);
  };

  const formatCurrency = (value: number | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleExportPDF = () => {
    const totalVagas = cargos.reduce((sum, c) => sum + (c.quantidade_vagas || 0), 0);
    const totalOcupadas = cargos.reduce((sum, c) => sum + c.ocupadas, 0);
    
    generateRelatorioCargos({
      cargos: cargos.map(c => ({
        nome: c.nome,
        sigla: c.sigla,
        categoria: c.categoria,
        nivel_hierarquico: c.nivel_hierarquico,
        quantidade_vagas: c.quantidade_vagas || 0,
        ocupadas: c.ocupadas,
        composicao: c.composicao.map(comp => ({
          unidade_nome: comp.unidade_nome,
          unidade_sigla: comp.unidade_sigla,
          quantidade_vagas: comp.quantidade_vagas,
        })),
      })),
      totalCargos: cargos.length,
      totalVagas,
      totalOcupadas,
      totalVacancia: totalVagas - totalOcupadas,
      dataGeracao: new Date().toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    });
    
    toast.success('Relatório PDF gerado com sucesso!');
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Briefcase className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Gestão de Cargos</h1>
                <p className="text-muted-foreground">
                  Gerencie os cargos da estrutura organizacional
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportPDF}>
                <FileDown className="h-4 w-4 mr-2" />
                Exportar PDF
              </Button>
              <Button onClick={handleOpenCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Cargo
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {Object.entries(CATEGORIA_LABELS).map(([key, label]) => {
              const count = cargos.filter((c) => c.categoria === key && c.ativo).length;
              return (
                <div key={key} className="bg-card rounded-lg p-4 border">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold">{count}</p>
                </div>
              );
            })}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, sigla ou CBO..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={showInactive ? "secondary" : "outline"}
              onClick={() => setShowInactive(!showInactive)}
            >
              {showInactive ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
              {showInactive ? "Mostrando inativos" : "Mostrar inativos"}
            </Button>
          </div>

          {/* Table */}
          <div className="bg-card rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
              <TableRow>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-center">Nível</TableHead>
                  <TableHead>Unidades</TableHead>
                  <TableHead className="text-center">Vagas</TableHead>
                  <TableHead className="text-center">Ocupadas</TableHead>
                  <TableHead className="text-center">Vacância</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : filteredCargos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      Nenhum cargo encontrado
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredCargos.map((cargo) => (
                    <TableRow key={cargo.id} className={!cargo.ativo ? "opacity-60" : ""}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{cargo.nome}</p>
                          {cargo.sigla && (
                            <p className="text-sm text-muted-foreground">{cargo.sigla}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={CATEGORIA_COLORS[cargo.categoria]}>
                          {CATEGORIA_LABELS[cargo.categoria]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">{cargo.nivel_hierarquico || "-"}</TableCell>
                      <TableCell>
                        {cargo.composicao.length > 0 ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2 cursor-help">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                                    {cargo.composicao.length} {cargo.composicao.length === 1 ? 'unidade' : 'unidades'}
                                  </Badge>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <div className="space-y-1 text-xs">
                                  <p className="font-medium mb-2">Distribuição por unidade:</p>
                                  {cargo.composicao.map((c, idx) => (
                                    <div key={idx} className="flex justify-between gap-4">
                                      <span className="truncate">
                                        {c.unidade_sigla || c.unidade_nome}
                                      </span>
                                      <span className="font-medium">{c.quantidade_vagas} vagas</span>
                                    </div>
                                  ))}
                                  <div className="border-t pt-1 mt-1 flex justify-between font-medium">
                                    <span>Total distribuído:</span>
                                    <span>{cargo.composicao.reduce((sum, c) => sum + c.quantidade_vagas, 0)} vagas</span>
                                  </div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-muted-foreground text-sm">Não distribuído</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{cargo.quantidade_vagas || 0}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="bg-info/20 text-info border-info/30">
                          {cargo.ocupadas}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {(() => {
                          const vagas = cargo.quantidade_vagas || 0;
                          const vacancia = vagas - cargo.ocupadas;
                          const isNegativo = vacancia < 0;
                          return (
                            <Badge 
                              variant="outline" 
                              className={isNegativo 
                                ? "bg-destructive/20 text-destructive border-destructive/30" 
                                : vacancia === 0 
                                  ? "bg-warning/20 text-warning border-warning/30"
                                  : "bg-success/20 text-success border-success/30"
                              }
                            >
                              {vacancia}
                            </Badge>
                          );
                        })()}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={cargo.ativo ? "default" : "secondary"}>
                          {cargo.ativo ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(cargo)}
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(cargo)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(cargo)}
                            title={cargo.ativo ? "Desativar" : "Ativar"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Form Dialog */}
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedCargo ? "Editar Cargo" : "Novo Cargo"}
                </DialogTitle>
              </DialogHeader>
              <CargoForm
                cargo={selectedCargo}
                composicao={selectedComposicao}
                onSubmit={handleFormSubmit}
                onCancel={() => setIsFormOpen(false)}
                isLoading={createMutation.isPending || updateMutation.isPending}
              />
            </DialogContent>
          </Dialog>

          {/* Detail Dialog */}
          <CargoDetailDialog
            cargo={selectedCargo}
            open={isDetailOpen}
            onOpenChange={setIsDetailOpen}
          />

          {/* Delete/Deactivate Confirmation */}
          <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {selectedCargo?.ativo ? "Desativar cargo?" : "Ativar cargo?"}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {selectedCargo?.ativo
                    ? `O cargo "${selectedCargo?.nome}" será desativado e não poderá ser utilizado em novas lotações.`
                    : `O cargo "${selectedCargo?.nome}" será reativado e poderá ser utilizado novamente.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() =>
                    selectedCargo &&
                    toggleStatusMutation.mutate({
                      id: selectedCargo.id,
                      ativo: !selectedCargo.ativo,
                    })
                  }
                >
                  {selectedCargo?.ativo ? "Desativar" : "Ativar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
