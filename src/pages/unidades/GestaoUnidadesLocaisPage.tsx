import { useState, useEffect } from "react";
import { ModuleLayout } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  Eye, 
  Building2, 
  MapPin,
  Users,
  Filter,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  UnidadeLocal,
  TipoUnidadeLocal,
  StatusUnidadeLocal,
  TIPO_UNIDADE_LABELS,
  STATUS_UNIDADE_LABELS,
  STATUS_UNIDADE_COLORS,
  MUNICIPIOS_RORAIMA,
} from "@/types/unidadesLocais";
import { UnidadeLocalForm } from "@/components/unidades/UnidadeLocalForm";

function GestaoUnidadesLocaisContent() {
  const navigate = useNavigate();
  const [unidades, setUnidades] = useState<UnidadeLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
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
    const matchesSearch =
      unidade.nome_unidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      unidade.municipio.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMunicipio = filterMunicipio === "all" || unidade.municipio === filterMunicipio;
    const matchesTipo = filterTipo === "all" || unidade.tipo_unidade === filterTipo;
    const matchesStatus = filterStatus === "all" || unidade.status === filterStatus;
    return matchesSearch && matchesMunicipio && matchesTipo && matchesStatus;
  });

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

  return (
    <ModuleLayout module="patrimonio">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Unidades Locais</h1>
            <p className="text-muted-foreground">
              Gestão de ginásios, estádios, parques aquáticos e outras unidades esportivas
            </p>
          </div>
          <Button onClick={handleNewUnidade}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Unidade
          </Button>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar unidade..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filterMunicipio} onValueChange={setFilterMunicipio}>
                <SelectTrigger>
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
                <SelectTrigger>
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
                <SelectTrigger>
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
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Building2 className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{unidades.length}</p>
                  <p className="text-sm text-muted-foreground">Total de Unidades</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <MapPin className="h-8 w-8 text-success" />
                <div>
                  <p className="text-2xl font-bold">
                    {unidades.filter((u) => u.status === "ativa").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Users className="h-8 w-8 text-warning" />
                <div>
                  <p className="text-2xl font-bold">
                    {unidades.filter((u) => u.status === "manutencao").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Em Manutenção</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Building2 className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">
                    {new Set(unidades.map((u) => u.municipio)).size}
                  </p>
                  <p className="text-sm text-muted-foreground">Municípios</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Município</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Chefe Atual</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUnidades.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {searchTerm || filterMunicipio !== "all" || filterTipo !== "all" || filterStatus !== "all"
                          ? "Nenhuma unidade encontrada com os filtros selecionados"
                          : "Nenhuma unidade cadastrada"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUnidades.map((unidade) => (
                      <TableRow key={unidade.id}>
                        <TableCell className="font-medium">{unidade.municipio}</TableCell>
                        <TableCell>{unidade.nome_unidade}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {TIPO_UNIDADE_LABELS[unidade.tipo_unidade]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={STATUS_UNIDADE_COLORS[unidade.status]}>
                            {STATUS_UNIDADE_LABELS[unidade.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {unidade.chefe_atual ? (
                            <span className="text-sm">{unidade.chefe_atual.servidor_nome}</span>
                          ) : (
                            <span className="text-sm text-muted-foreground italic">
                              Sem chefe designado
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewUnidade(unidade)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
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
