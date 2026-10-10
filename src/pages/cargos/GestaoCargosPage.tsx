import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ModuleLayout } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DataTable,
  KpiCard,
  PageHeader,
  StatusBadge,
  type ColunaTabela,
  type TomStatus,
} from "@/components/design-system";
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
import { Plus, Pencil, Trash2, Briefcase, Eye, EyeOff, Building2, FileDown, Power } from "lucide-react";
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

// Vacância (vagas − ocupadas) → selo: negativa é excesso, zero é quadro cheio
function seloVacancia(vacancia: number): { label: string; tom: TomStatus } {
  if (vacancia < 0) return { label: `${vacancia} (excedente)`, tom: "erro" };
  if (vacancia === 0) return { label: "0 (sem vagas)", tom: "pendente" };
  return { label: String(vacancia), tom: "sucesso" };
}

const vacanciaDo = (cargo: { quantidade_vagas: number | null; ocupadas: number }) =>
  (cargo.quantidade_vagas || 0) - cargo.ocupadas;

export default function GestaoCargosPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedCargo, setSelectedCargo] = useState<CargoComOcupacao | null>(null);
  const [selectedComposicao, setSelectedComposicao] = useState<ComposicaoItem[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const queryClient = useQueryClient();

  const { data: cargos = [], isLoading, isError, refetch } = useQuery({
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

      // Buscar contagem de vínculos ativos por cargo
      const { data: lotacoesCount, error: lotacoesError } = await supabase
        .from("vinculos_servidor")
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
      console.log("=== CREATE MUTATION INICIADA ===");
      console.log("Dados:", data);
      console.log("Composição recebida:", composicao);
      
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
      
      if (error) {
        console.error("Erro ao criar cargo:", error);
        throw error;
      }
      
      console.log("Cargo criado com ID:", novoCargo?.id);

      // Criar composição de cargos
      if (composicao.length > 0 && novoCargo) {
        console.log("Inserindo composição:", composicao.map(c => ({ unidade_id: c.unidade_id, quantidade_vagas: c.quantidade_vagas })));
        
        const { error: compError } = await supabase.from("composicao_cargos").insert(
          composicao.map(c => ({
            cargo_id: novoCargo.id,
            unidade_id: c.unidade_id,
            quantidade_vagas: c.quantidade_vagas,
          }))
        );
        
        if (compError) {
          console.error("Erro ao inserir composição:", compError);
          throw compError;
        }
        
        console.log("Composição inserida com sucesso!");
      } else {
        console.log("ATENÇÃO: Composição vazia, nada será inserido na composicao_cargos");
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
      console.log("=== UPDATE MUTATION INICIADA ===");
      console.log("ID do cargo:", id);
      console.log("Dados:", data);
      console.log("Composição recebida:", composicao);
      
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
      
      if (error) {
        console.error("Erro ao atualizar cargo:", error);
        throw error;
      }
      
      console.log("Cargo atualizado, agora deletando composições antigas...");

      // Deletar composições existentes e recriar
      const { error: deleteError } = await supabase
        .from("composicao_cargos")
        .delete()
        .eq("cargo_id", id);
      
      if (deleteError) {
        console.error("Erro ao deletar composições antigas:", deleteError);
        throw deleteError;
      }
      
      console.log("Composições antigas deletadas");

      // Criar novas composições
      if (composicao.length > 0) {
        console.log("Inserindo novas composições:", composicao.map(c => ({ unidade_id: c.unidade_id, quantidade_vagas: c.quantidade_vagas })));
        
        const { error: compError } = await supabase.from("composicao_cargos").insert(
          composicao.map(c => ({
            cargo_id: id,
            unidade_id: c.unidade_id,
            quantidade_vagas: c.quantidade_vagas,
          }))
        );
        
        if (compError) {
          console.error("Erro ao inserir novas composições:", compError);
          throw compError;
        }
        
        console.log("Novas composições inseridas com sucesso!");
      } else {
        console.log("ATENÇÃO: Composição vazia, nada será inserido na composicao_cargos");
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
    console.log("=== HANDLE FORM SUBMIT (PAGE) ===");
    console.log("selectedCargo:", selectedCargo?.id);
    console.log("Dados recebidos:", data);
    console.log("Composição recebida:", composicao);
    
    if (selectedCargo) {
      updateMutation.mutate({ id: selectedCargo.id, data, composicao });
    } else {
      createMutation.mutate({ data, composicao });
    }
  };

  const handleCloseForm = () => {
    // Verificar se há alterações pendentes
    const currentStr = JSON.stringify(selectedComposicao.map(v => ({ u: v.unidade_id, q: v.quantidade_vagas })).sort((a, b) => a.u.localeCompare(b.u)));
    const composicaoAtual = selectedCargo?.composicao?.map(c => ({ u: c.unidade_id, q: c.quantidade_vagas })).sort((a, b) => a.u.localeCompare(b.u)) || [];
    const originalStr = JSON.stringify(composicaoAtual);
    
    if (currentStr !== originalStr && selectedComposicao.length > 0) {
      const confirmClose = window.confirm("Há alterações não salvas na distribuição de vagas. Deseja fechar mesmo assim?");
      if (!confirmClose) {
        return;
      }
    }
    
    setIsFormOpen(false);
    setSelectedCargo(null);
    setSelectedComposicao([]);
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

  const colunas: ColunaTabela<CargoComOcupacao>[] = [
    {
      id: "cargo",
      cabecalho: "Cargo",
      mobile: "titulo",
      ordenarPor: (cargo) => cargo.nome,
      // Busca por nome, sigla ou CBO (mesmos campos da busca anterior)
      buscarPor: (cargo) => [cargo.nome, cargo.sigla, cargo.cbo].filter(Boolean).join(" "),
      celula: (cargo) => (
        <div>
          <p className="font-medium">{cargo.nome}</p>
          {cargo.sigla && <p className="text-body text-muted-foreground">{cargo.sigla}</p>}
        </div>
      ),
    },
    {
      id: "categoria",
      cabecalho: "Categoria",
      ordenarPor: (cargo) => CATEGORIA_LABELS[cargo.categoria] ?? cargo.categoria,
      celula: (cargo) => (
        <Badge variant="outline">{CATEGORIA_LABELS[cargo.categoria] ?? cargo.categoria}</Badge>
      ),
    },
    {
      id: "nivel",
      cabecalho: "Nível",
      alinhamento: "centro",
      ordenarPor: (cargo) => cargo.nivel_hierarquico,
      celula: (cargo) => cargo.nivel_hierarquico || "-",
    },
    {
      id: "unidades",
      cabecalho: "Unidades",
      celula: (cargo) =>
        cargo.composicao.length > 0 ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="flex cursor-help items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={`Distribuição de ${cargo.nome} por unidade: ${cargo.composicao.length} ${cargo.composicao.length === 1 ? "unidade" : "unidades"}`}
                >
                  <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                    {cargo.composicao.length} {cargo.composicao.length === 1 ? "unidade" : "unidades"}
                  </Badge>
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-1 text-caption">
                  <p className="mb-2 font-medium">Distribuição por unidade:</p>
                  {cargo.composicao.map((c, idx) => (
                    <div key={idx} className="flex justify-between gap-4">
                      <span className="truncate">{c.unidade_sigla || c.unidade_nome}</span>
                      <span className="font-medium">{c.quantidade_vagas} vagas</span>
                    </div>
                  ))}
                  <div className="mt-1 flex justify-between border-t pt-1 font-medium">
                    <span>Total distribuído:</span>
                    <span>{cargo.composicao.reduce((sum, c) => sum + c.quantidade_vagas, 0)} vagas</span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <span className="text-body text-muted-foreground">Não distribuído</span>
        ),
    },
    {
      id: "vagas",
      cabecalho: "Vagas",
      alinhamento: "centro",
      ordenarPor: (cargo) => cargo.quantidade_vagas || 0,
      celula: (cargo) => cargo.quantidade_vagas || 0,
    },
    {
      id: "ocupadas",
      cabecalho: "Ocupadas",
      alinhamento: "centro",
      ordenarPor: (cargo) => cargo.ocupadas,
      celula: (cargo) => cargo.ocupadas,
    },
    {
      id: "vacancia",
      cabecalho: "Vacância",
      alinhamento: "centro",
      ordenarPor: (cargo) => vacanciaDo(cargo),
      celula: (cargo) => {
        const selo = seloVacancia(vacanciaDo(cargo));
        return <StatusBadge tom={selo.tom}>{selo.label}</StatusBadge>;
      },
    },
    {
      id: "situacao",
      cabecalho: "Situação",
      alinhamento: "centro",
      ordenarPor: (cargo) => (cargo.ativo ? "Ativo" : "Inativo"),
      celula: (cargo) => (
        <StatusBadge tom={cargo.ativo ? "sucesso" : "neutro"}>{cargo.ativo ? "Ativo" : "Inativo"}</StatusBadge>
      ),
    },
  ];

  return (
    <ProtectedRoute requiredModule="governanca">
      <ModuleLayout module="governanca">
        <div className="space-y-6">
          <PageHeader
            migalhas={[{ rotulo: "Governança", href: "/governanca" }, { rotulo: "Gestão de cargos" }]}
            titulo="Gestão de cargos"
            descricao="Gerencie os cargos da estrutura organizacional"
            acoes={
              <>
                <Button variant="outline" onClick={handleExportPDF}>
                  <FileDown className="h-4 w-4" aria-hidden="true" />
                  Exportar PDF
                </Button>
                <Button onClick={handleOpenCreate}>
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Novo cargo
                </Button>
              </>
            }
          />

          {/* Resumo por categoria (só cargos ativos) */}
          <section aria-labelledby="cargos-resumo">
            <h2 id="cargos-resumo" className="sr-only">Cargos ativos por categoria</h2>
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-5">
              {Object.entries(CATEGORIA_LABELS).map(([key, label]) => (
                <li key={key}>
                  <KpiCard
                    rotulo={label}
                    valor={cargos.filter((c) => c.categoria === key && c.ativo).length}
                    icone={Briefcase}
                    carregando={isLoading}
                    className="h-full"
                  />
                </li>
              ))}
            </ul>
          </section>

          <DataTable
            rotulo="Cargos"
            dados={cargos}
            colunas={colunas}
            chaveLinha={(cargo) => cargo.id}
            carregando={isLoading}
            erro={isError ? "Não foi possível carregar os cargos." : null}
            aoTentarNovamente={() => refetch()}
            busca={{ placeholder: "Buscar por nome, sigla ou CBO..." }}
            filtros={
              <Button
                variant={showInactive ? "secondary" : "outline"}
                aria-pressed={showInactive}
                onClick={() => setShowInactive(!showInactive)}
              >
                {showInactive ? (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                )}
                {showInactive ? "Mostrando inativos" : "Mostrar inativos"}
              </Button>
            }
            vazio={{
              icone: Briefcase,
              titulo: "Nenhum cargo encontrado",
              descricao: showInactive ? undefined : "Cargos inativos estão ocultos. Use “Mostrar inativos” para vê-los.",
            }}
            acoesLinha={(cargo) => (
              <div className="flex justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleView(cargo)}
                  aria-label={`Ver detalhes de ${cargo.nome}`}
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(cargo)}
                  aria-label={`Editar ${cargo.nome}`}
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(cargo)}
                  aria-label={`${cargo.ativo ? "Desativar" : "Ativar"} ${cargo.nome}`}
                >
                  {cargo.ativo ? (
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Power className="h-4 w-4" aria-hidden="true" />
                  )}
                </Button>
              </div>
            )}
          />

          {/* Form Dialog */}
          <Dialog open={isFormOpen} onOpenChange={(open) => {
            if (!open) {
              handleCloseForm();
            } else {
              setIsFormOpen(true);
            }
          }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedCargo ? "Editar cargo" : "Novo cargo"}
                </DialogTitle>
              </DialogHeader>
              <CargoForm
                key={selectedCargo?.id || 'new'}
                cargo={selectedCargo}
                composicao={selectedComposicao}
                onSubmit={handleFormSubmit}
                onCancel={handleCloseForm}
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
      </ModuleLayout>
    </ProtectedRoute>
  );
}
