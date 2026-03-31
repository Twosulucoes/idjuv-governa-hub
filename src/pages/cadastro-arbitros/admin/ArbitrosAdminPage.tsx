/**
 * Página administrativa completa para gestão de cadastro de árbitros
 * Dashboard + Listagem + Relatórios Dinâmicos + CRUD Completo
 */
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft, LayoutDashboard, List, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

import { AdminDashboard } from "./components/AdminDashboard";
import { AdminListagem } from "./components/AdminListagem";
import { AdminRelatorios } from "./components/AdminRelatorios";
import { AdminDetalheModal } from "./components/AdminDetalheModal";
import { AdminEditModal } from "./components/AdminEditModal";
import { AdminDeleteDialog } from "./components/AdminDeleteDialog";
import { fetchArbitros, fetchEstatisticas, updateArbitroStatus, updateArbitro, deleteArbitro, syncModalidades, type ArbitroCadastro } from "./arbitrosAdminService";
import { toast } from "sonner";

export default function ArbitrosAdminPage() {
  const [tab, setTab] = useState("dashboard");
  const [selectedArbitro, setSelectedArbitro] = useState<ArbitroCadastro | null>(null);
  const [editingArbitro, setEditingArbitro] = useState<ArbitroCadastro | null>(null);
  const [deletingArbitro, setDeletingArbitro] = useState<ArbitroCadastro | null>(null);
  const [filtros, setFiltros] = useState({ status: "todos", categoria: "todos", uf: "todos", modalidade: "", busca: "" });
  const queryClient = useQueryClient();

  const { data: arbitros = [], isLoading } = useQuery({
    queryKey: ["admin-arbitros", filtros],
    queryFn: () => fetchArbitros(filtros),
  });

  const { data: estatisticas, isLoading: loadingStats } = useQuery({
    queryKey: ["admin-arbitros-stats"],
    queryFn: fetchEstatisticas,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-arbitros"] });
    queryClient.invalidateQueries({ queryKey: ["admin-arbitros-stats"] });
  };

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateArbitroStatus(id, status),
    onSuccess: () => {
      invalidate();
      toast.success("Status atualizado com sucesso");
      setSelectedArbitro(null);
    },
    onError: (err: any) => toast.error("Erro: " + err.message),
  });

  const editMutation = useMutation({
    mutationFn: ({ id, dados }: { id: string; dados: Partial<ArbitroCadastro> }) => updateArbitro(id, dados),
    onSuccess: () => {
      invalidate();
      toast.success("Cadastro atualizado com sucesso");
      setEditingArbitro(null);
    },
    onError: (err: any) => toast.error("Erro ao atualizar: " + err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteArbitro(id),
    onSuccess: () => {
      invalidate();
      toast.success("Cadastro excluído com sucesso");
      setDeletingArbitro(null);
    },
    onError: (err: any) => toast.error("Erro ao excluir: " + err.message),
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/sistema"><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Gestão de Árbitros</h1>
              <p className="text-sm text-muted-foreground">Administração de cadastros, aprovação e relatórios</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium">
              {arbitros.length} cadastros
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="listagem" className="gap-2">
              <List className="h-4 w-4" /> Cadastros
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="gap-2">
              <BarChart3 className="h-4 w-4" /> Relatórios
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AdminDashboard stats={estatisticas} loading={loadingStats} />
          </TabsContent>

          <TabsContent value="listagem">
            <AdminListagem
              arbitros={arbitros}
              loading={isLoading}
              filtros={filtros}
              setFiltros={setFiltros}
              onSelect={setSelectedArbitro}
              onEdit={setEditingArbitro}
              onDelete={setDeletingArbitro}
              onChangeStatus={(id, status) => statusMutation.mutate({ id, status })}
            />
          </TabsContent>

          <TabsContent value="relatorios">
            <AdminRelatorios stats={estatisticas} loading={loadingStats} arbitros={arbitros} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal detalhe */}
      {selectedArbitro && (
        <AdminDetalheModal
          arbitro={selectedArbitro}
          onClose={() => setSelectedArbitro(null)}
          onChangeStatus={(status) => statusMutation.mutate({ id: selectedArbitro.id, status })}
          onEdit={() => { setEditingArbitro(selectedArbitro); setSelectedArbitro(null); }}
          onDelete={() => { setDeletingArbitro(selectedArbitro); setSelectedArbitro(null); }}
          loading={statusMutation.isPending}
        />
      )}

      {/* Modal edição */}
      {editingArbitro && (
        <AdminEditModal
          arbitro={editingArbitro}
          onClose={() => setEditingArbitro(null)}
          onSave={(dados) => editMutation.mutate({ id: editingArbitro.id, dados })}
          loading={editMutation.isPending}
        />
      )}

      {/* Dialog exclusão */}
      {deletingArbitro && (
        <AdminDeleteDialog
          arbitro={deletingArbitro}
          onClose={() => setDeletingArbitro(null)}
          onConfirm={() => deleteMutation.mutate(deletingArbitro.id)}
          loading={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
