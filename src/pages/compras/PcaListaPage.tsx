/**
 * PCA (Plano de Contratações Anual): lista dos planos por exercício.
 * Compras cria o plano do ano seguinte e abre cada um para lançar os DFDs do SEI e os tetos da PLOA.
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ClipboardList, Plus } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { EmptyState, PageHeader, StatusBadge } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/formatters";
import { useCriarPcaPlano, usePcaPlanos, usePcaResumoPlanos } from "@/hooks/usePca";
import { SITUACAO_PCA_LABEL, TOM_SITUACAO_PCA } from "@/components/compras/pca/rotulos";

export default function PcaListaPage() {
  const { hasPermission } = useAuth();
  const podeEditar = hasPermission("compras.pca.editar");
  const navigate = useNavigate();
  const { data: planos, isLoading, isError, refetch } = usePcaPlanos();
  const { data: resumo } = usePcaResumoPlanos();
  const criar = useCriarPcaPlano();
  const [aberto, setAberto] = useState(false);
  const [exercicio, setExercicio] = useState(String(new Date().getFullYear() + 1));

  const ano = Number(exercicio);
  const anoValido = Number.isInteger(ano) && ano >= 2020 && ano <= 2100;

  const criarPlano = async () => {
    if (!anoValido) return;
    try {
      const p = await criar.mutateAsync(ano);
      setAberto(false);
      navigate(`/compras/pca/${p.exercicio}`);
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  return (
    <ModuleLayout module="compras">
      <div className="space-y-6">
        <PageHeader
          titulo="Plano de Contratações Anual (PCA)"
          descricao="Tudo o que o Instituto pretende comprar ou contratar no ano, a partir dos DFDs do SEI"
          migalhas={[{ rotulo: "Compras", href: "/compras" }, { rotulo: "PCA" }]}
          acoes={
            podeEditar && (
              <Button onClick={() => setAberto(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Novo PCA
              </Button>
            )
          }
        />

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-32" />)}
          </div>
        ) : isError ? (
          <EmptyState
            titulo="Não foi possível carregar os PCAs"
            descricao="Confira a conexão e tente de novo."
            acao={<Button variant="outline" onClick={() => refetch()}>Tentar novamente</Button>}
          />
        ) : !planos?.length ? (
          <EmptyState
            icone={ClipboardList}
            titulo="Nenhum PCA ainda"
            descricao={podeEditar ? "Crie o PCA do próximo exercício para começar a lançar os DFDs." : "Ainda não há PCA cadastrado."}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {planos.map((p) => {
              const r = resumo?.get(p.id);
              return (
                <Link key={p.id} to={`/compras/pca/${p.exercicio}`} className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <Card className="h-full transition-colors hover:bg-muted/50">
                    <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
                      <CardTitle className="text-lg">PCA {p.exercicio}</CardTitle>
                      <StatusBadge tom={TOM_SITUACAO_PCA[p.situacao]}>{SITUACAO_PCA_LABEL[p.situacao] ?? p.situacao}</StatusBadge>
                    </CardHeader>
                    <CardContent className="space-y-1 text-sm text-muted-foreground">
                      <p>{r?.itens ?? 0} item(ns)</p>
                      <p className="text-base font-semibold text-foreground">{formatCurrency(r?.total ?? 0)}</p>
                      {p.processo_sei && <p>Processo SEI {p.processo_sei}</p>}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={aberto} onOpenChange={setAberto}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Novo PCA</DialogTitle>
            <DialogDescription>Um PCA por exercício. Normalmente é o do ano que vem.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="pca-exercicio">Exercício</Label>
            <Input
              id="pca-exercicio"
              inputMode="numeric"
              value={exercicio}
              onChange={(e) => setExercicio(e.target.value.replace(/\D/g, "").slice(0, 4))}
              aria-invalid={!anoValido}
            />
            {!anoValido && <p className="text-sm text-destructive">Informe um ano entre 2020 e 2100.</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAberto(false)}>Cancelar</Button>
            <Button onClick={criarPlano} disabled={!anoValido || criar.isPending}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
