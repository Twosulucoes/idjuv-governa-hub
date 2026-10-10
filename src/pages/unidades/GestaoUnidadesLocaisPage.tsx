import { useState, useEffect } from "react";
import { ModuleLayout } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DataTable, KpiCard, PageHeader, type ColunaTabela } from "@/components/design-system";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Plus, 
  Eye, 
  Building2, 
  MapPin,
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  UnidadeLocal,
  TipoUnidadeLocal,
  StatusUnidadeLocal,
  TIPO_UNIDADE_LABELS,
  STATUS_UNIDADE_LABELS,
  MUNICIPIOS_RORAIMA,
} from "@/types/unidadesLocais";
import { UnidadeLocalForm } from "@/components/unidades/UnidadeLocalForm";
import { StatusUnidadeBadge } from "@/components/unidades/StatusUnidadeBadge";

function GestaoUnidadesLocaisContent() {
  const navigate = useNavigate();
  const [unidades, setUnidades] = useState<UnidadeLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMunicipio, setFilterMunicipio] = useState<string>("all");
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingUnidade, setEditingUnidade] = useState<UnidadeLocal | null>(null);

  useEffect(() => {
    loadUnidades();
  }, []);

  async function loadUnidades() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("unidades_locais")
        .select("*")
        .order("municipio", { ascending: true })
        .order("nome_unidade", { ascending: true });

      if (error) throw error;

      // Load chefe atual for each unidade
      const unidadesWithChefe = await Promise.all(
        (data || []).map(async (unidade) => {
          const { data: chefeData } = await supabase.rpc("get_chefe_unidade_atual", {
            p_unidade_id: unidade.id,
          });
          return {
            ...unidade,
            chefe_atual: chefeData?.[0] || null,
          } as UnidadeLocal;
        })
      );

      setUnidades(unidadesWithChefe);
    } catch (error: any) {
      console.error("Erro ao carregar unidades:", error);
      toast.error("Erro ao carregar unidades locais");
    } finally {
      setLoading(false);
    }
  }

  const filteredUnidades = unidades.filter((unidade) => {
    const matchesMunicipio = filterMunicipio === "all" || unidade.municipio === filterMunicipio;
    const matchesTipo = filterTipo === "all" || unidade.tipo_unidade === filterTipo;
    const matchesStatus = filterStatus === "all" || unidade.status === filterStatus;
    return matchesMunicipio && matchesTipo && matchesStatus;
  });
  const temFiltro = filterMunicipio !== "all" || filterTipo !== "all" || filterStatus !== "all";

  function handleNewUnidade() {
    setEditingUnidade(null);
    setShowFormDialog(true);
  }

  function handleViewUnidade(unidade: UnidadeLocal) {
    navigate(`/unidades/${unidade.id}`);
  }

  async function handleSaveUnidade() {
    setShowFormDialog(false);
    setEditingUnidade(null);
    await loadUnidades();
    toast.success("Unidade salva com sucesso!");
  }

  const colunas: ColunaTabela<UnidadeLocal>[] = [
    {
      id: "municipio",
      cabecalho: "Município",
      celula: (unidade) => <span className="font-medium">{unidade.municipio}</span>,
      ordenarPor: (unidade) => unidade.municipio,
      buscarPor: (unidade) => unidade.municipio,
    },
    {
      id: "unidade",
      cabecalho: "Unidade",
      celula: (unidade) => unidade.nome_unidade,
      ordenarPor: (unidade) => unidade.nome_unidade,
      buscarPor: (unidade) => unidade.nome_unidade,
      mobile: "titulo",
    },
    {
      id: "tipo",
      cabecalho: "Tipo",
      celula: (unidade) => <Badge variant="outline">{TIPO_UNIDADE_LABELS[unidade.tipo_unidade]}</Badge>,
      ordenarPor: (unidade) => TIPO_UNIDADE_LABELS[unidade.tipo_unidade],
    },
    {
      id: "status",
      cabecalho: "Status",
      celula: (unidade) => (
        <StatusUnidadeBadge status={unidade.status} />
      ),
      ordenarPor: (unidade) => unidade.status,
    },
    {
      id: "chefe",
      cabecalho: "Chefe atual",
      celula: (unidade) =>
        unidade.chefe_atual ? (
          <span className="text-sm">{unidade.chefe_atual.servidor_nome}</span>
        ) : (
          <span className="text-sm text-muted-foreground italic">Sem chefe designado</span>
        ),
      ordenarPor: (unidade) => unidade.chefe_atual?.servidor_nome,
    },
  ];

  return (
    <ModuleLayout module="patrimonio">
      <div className="space-y-6">
        <PageHeader
          titulo="Unidades locais"
          descricao="Gestão de ginásios, estádios, parques aquáticos e outras unidades esportivas"
          acoes={
            <Button onClick={handleNewUnidade}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Nova unidade
            </Button>
          }
        />

        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-4">
          <KpiCard rotulo="Total de unidades" valor={unidades.length} icone={Building2} carregando={loading} />
          <KpiCard
            rotulo="Ativas"
            valor={unidades.filter((u) => u.status === "ativa").length}
            icone={MapPin}
            carregando={loading}
          />
          <KpiCard
            rotulo="Em manutenção"
            valor={unidades.filter((u) => u.status === "manutencao").length}
            icone={Users}
            carregando={loading}
          />
          <KpiCard
            rotulo="Municípios"
            valor={new Set(unidades.map((u) => u.municipio)).size}
            icone={Building2}
            carregando={loading}
          />
        </div>

        {/* Tabela */}
        <DataTable
          rotulo="Unidades locais"
          dados={filteredUnidades}
          colunas={colunas}
          chaveLinha={(unidade) => unidade.id}
          carregando={loading}
          busca={{ placeholder: "Buscar unidade ou município" }}
          vazio={{
            icone: Building2,
            titulo: temFiltro
              ? "Nenhuma unidade encontrada com os filtros selecionados"
              : "Nenhuma unidade cadastrada",
          }}
          filtros={
            <>
              <Select value={filterMunicipio} onValueChange={setFilterMunicipio}>
                <SelectTrigger className="w-full sm:w-48" aria-label="Município">
                  <SelectValue placeholder="Município" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os municípios</SelectItem>
                  {MUNICIPIOS_RORAIMA.map((mun) => (
                    <SelectItem key={mun} value={mun}>
                      {mun}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="w-full sm:w-44" aria-label="Tipo">
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {Object.entries(TIPO_UNIDADE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-44" aria-label="Status">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {Object.entries(STATUS_UNIDADE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          }
          acoesLinha={(unidade) => (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleViewUnidade(unidade)}
              aria-label={`Ver unidade ${unidade.nome_unidade}`}
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        />
      </div>

      {/* Dialog de Formulário */}
      <Dialog open={showFormDialog} onOpenChange={setShowFormDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingUnidade ? "Editar Unidade" : "Nova Unidade Local"}
            </DialogTitle>
            <DialogDescription>
              Preencha os dados da unidade local
            </DialogDescription>
          </DialogHeader>
          <UnidadeLocalForm
            unidade={editingUnidade}
            onSuccess={handleSaveUnidade}
            onCancel={() => setShowFormDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}

export default function GestaoUnidadesLocaisPage() {
  return (
    <ProtectedRoute requiredModule="patrimonio">
      <GestaoUnidadesLocaisContent />
    </ProtectedRoute>
  );
}
