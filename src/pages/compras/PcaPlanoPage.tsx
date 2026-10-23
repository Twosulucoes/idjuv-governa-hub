/**
 * PCA de um exercício: abas Itens (DFDs do SEI lançados por Compras) e Orçamento (teto PLOA/QDD × planejado).
 * Documentos, sugestões e situação entram nas próximas entregas (spec 2026-10-23-compras-gerador-pca-design.md).
 */

import { Link, useParams } from "react-router-dom";
import { ModuleLayout } from "@/components/layout";
import { EmptyState, PageHeader, StatusBadge } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { useClassificadoresPca, usePcaItens, usePcaPlano, usePcaTetos } from "@/hooks/usePca";
import { AtualizarCatalogoDialog } from "@/components/compras/pca/AtualizarCatalogoDialog";
import { PcaItensTab } from "@/components/compras/pca/PcaItensTab";
import { PcaOrcamentoTab } from "@/components/compras/pca/PcaOrcamentoTab";
import { SITUACAO_PCA_LABEL, TOM_SITUACAO_PCA } from "@/components/compras/pca/rotulos";

export default function PcaPlanoPage() {
  const { exercicio: param } = useParams();
  const exercicio = Number(param);
  const valido = Number.isInteger(exercicio) && exercicio >= 2020 && exercicio <= 2100;
  const { hasPermission } = useAuth();
  const podeEditar = hasPermission("compras.pca.editar");

  const plano = usePcaPlano(valido ? exercicio : undefined);
  const itens = usePcaItens(plano.data?.id);
  const tetos = usePcaTetos(plano.data?.id);
  const classificadores = useClassificadoresPca(valido ? exercicio : undefined);

  const migalhas = [{ rotulo: "Compras", href: "/compras" }, { rotulo: "PCA", href: "/compras/pca" }, { rotulo: String(param ?? "") }];

  let conteudo: React.ReactNode;
  if (!valido || (!plano.isLoading && !plano.isError && !plano.data)) {
    conteudo = (
      <EmptyState
        titulo="PCA não encontrado"
        descricao={valido ? `Ainda não existe PCA de ${exercicio}.` : "Exercício inválido."}
        acao={<Button asChild variant="outline"><Link to="/compras/pca">Voltar à lista</Link></Button>}
      />
    );
  } else if (plano.isLoading) {
    conteudo = <Skeleton className="h-64" />;
  } else if (plano.isError || !plano.data) {
    conteudo = (
      <EmptyState
        titulo="Não foi possível carregar o PCA"
        acao={<Button variant="outline" onClick={() => plano.refetch()}>Tentar novamente</Button>}
      />
    );
  } else {
    conteudo = (
      <Tabs defaultValue="itens">
        <TabsList>
          <TabsTrigger value="itens">Itens</TabsTrigger>
          <TabsTrigger value="orcamento">Orçamento</TabsTrigger>
        </TabsList>
        <TabsContent value="itens" className="mt-4">
          <PcaItensTab
            plano={plano.data}
            itens={itens.data}
            carregando={itens.isLoading}
            erro={itens.isError ? "Não foi possível carregar os itens." : null}
            aoTentarNovamente={() => itens.refetch()}
            classificadores={classificadores.data}
            podeEditar={podeEditar}
          />
        </TabsContent>
        <TabsContent value="orcamento" className="mt-4">
          <PcaOrcamentoTab
            plano={plano.data}
            tetos={tetos.data}
            itens={itens.data}
            classificadores={classificadores.data}
            podeEditar={podeEditar}
          />
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <ModuleLayout module="compras">
      <div className="space-y-6">
        <PageHeader
          titulo={valido ? `PCA ${exercicio}` : "PCA"}
          descricao="Plano de Contratações Anual (Lei 14.133/2021, art. 12, VII)"
          migalhas={migalhas}
          status={plano.data && (
            <StatusBadge tom={TOM_SITUACAO_PCA[plano.data.situacao]}>
              {SITUACAO_PCA_LABEL[plano.data.situacao] ?? plano.data.situacao}
            </StatusBadge>
          )}
          acoes={podeEditar && plano.data ? <AtualizarCatalogoDialog /> : undefined}
        />
        {conteudo}
      </div>
    </ModuleLayout>
  );
}
