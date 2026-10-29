/**
 * Pesquisas de preços do módulo Compras, uma por processo SEI (Decreto 39.050-E/2025). Cada pesquisa reúne os itens,
 * os preços coletados com a fonte e o saneamento; a ficha gera o relatório que vai anexo à nota técnica no SEI.
 */

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Scale } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { EmptyState, PageHeader, StatusBadge } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { dataBR } from "@/lib/compras/relatorioPesquisaPrecos";
import { usePesquisasPrecos, useSalvarPesquisa } from "@/hooks/usePesquisaPrecos";
import { PesquisaDialog } from "@/components/compras/pesquisa-precos/PesquisaDialog";
import { FINALIDADE_LABEL, SITUACAO_PESQUISA_LABEL, TOM_SITUACAO_PESQUISA } from "@/components/compras/pesquisa-precos/rotulos";

export default function PesquisasPrecosListaPage() {
  const { hasPermission } = useAuth();
  const podeEditar = hasPermission("compras.pesquisa_precos.editar");
  const navigate = useNavigate();
  const { data: pesquisas, isLoading, isError, refetch } = usePesquisasPrecos();
  const salvar = useSalvarPesquisa();
  const [aberto, setAberto] = useState(false);

  return (
    <ModuleLayout module="compras">
      <div className="space-y-6">
        <PageHeader
          titulo="Pesquisa de preços"
          descricao="Preços do Compras.gov.br, do PNCP e de outras fontes, com a origem de cada um, o saneamento e o relatório para o SEI"
          migalhas={[{ rotulo: "Compras", href: "/compras" }, { rotulo: "Pesquisa de preços" }]}
          acoes={
            podeEditar && (
              <Button onClick={() => setAberto(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Nova pesquisa
              </Button>
            )
          }
        />

        {isLoading ? (
          <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)}</div>
        ) : isError ? (
          <EmptyState
            titulo="Não foi possível carregar as pesquisas"
            descricao="Confira a conexão e tente de novo."
            acao={<Button variant="outline" onClick={() => refetch()}>Tentar novamente</Button>}
          />
        ) : !pesquisas?.length ? (
          <EmptyState
            icone={Scale}
            titulo="Nenhuma pesquisa de preços ainda"
            descricao={podeEditar ? "Abra a pesquisa do processo SEI e lance os itens do termo de referência." : "Ainda não há pesquisa cadastrada."}
          />
        ) : (
          <div className="space-y-3">
            {pesquisas.map((p) => (
              <Link key={p.id} to={`/compras/pesquisa-precos/${p.id}`} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Card className="transition-colors hover:bg-muted/50">
                  <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                    <div className="space-y-1">
                      <p className="font-medium">{p.objeto}</p>
                      <p className="text-sm text-muted-foreground">
                        Processo SEI {p.numero_sei} · {FINALIDADE_LABEL[p.finalidade] ?? p.finalidade} · referência {dataBR(p.data_referencia)}
                      </p>
                    </div>
                    <StatusBadge tom={TOM_SITUACAO_PESQUISA[p.situacao]}>{SITUACAO_PESQUISA_LABEL[p.situacao] ?? p.situacao}</StatusBadge>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      <PesquisaDialog
        open={aberto}
        onOpenChange={setAberto}
        salvando={salvar.isPending}
        onSalvar={async (dados) => {
          const p = await salvar.mutateAsync(dados);
          navigate(`/compras/pesquisa-precos/${p.id}`);
        }}
      />
    </ModuleLayout>
  );
}
