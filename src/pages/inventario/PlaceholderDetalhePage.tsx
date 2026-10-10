/**
 * PÁGINA PLACEHOLDER PARA DETALHES
 * Usada quando a página de detalhe ainda não foi implementada
 * Padrões do design system: PageHeader, EmptyState.
 */

import { Link, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Construction } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/design-system";

export default function PlaceholderDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  // Determinar o tipo de entidade baseado na URL
  const path = location.pathname;
  let tipo = "Registro";
  let voltar = "/inventario";

  if (path.includes("/campanhas")) {
    tipo = "Campanha";
    voltar = "/inventario/campanhas";
  } else if (path.includes("/requisicoes")) {
    tipo = "Requisição";
    voltar = "/inventario/requisicoes";
  } else if (path.includes("/movimentacoes")) {
    tipo = "Movimentação";
    voltar = "/inventario/movimentacoes";
  } else if (path.includes("/manutencoes")) {
    tipo = "Manutenção";
    voltar = "/inventario/manutencoes";
  } else if (path.includes("/almoxarifado")) {
    tipo = "Item";
    voltar = "/inventario/almoxarifado";
  } else if (path.includes("/baixas")) {
    tipo = "Baixa";
    voltar = "/inventario/baixas";
  }

  return (
    <ModuleLayout module="patrimonio">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Inventário", href: "/inventario" }, { rotulo: tipo }]}
          titulo={`Detalhe: ${tipo.toLowerCase()}`}
          descricao={<span className="font-mono">ID: {id}</span>}
          acoes={
            <Button variant="outline" asChild>
              <Link to={voltar}>
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                Voltar
              </Link>
            </Button>
          }
        />

        <Card>
          <EmptyState
            icone={Construction}
            titulo="Página em construção"
            descricao={`A visualização detalhada de ${tipo.toLowerCase()} está sendo desenvolvida. Em breve você poderá visualizar todas as informações aqui.`}
            acao={
              <Button asChild>
                <Link to={voltar}>Voltar para a listagem</Link>
              </Button>
            }
            className="py-12"
          />
        </Card>
      </div>
    </ModuleLayout>
  );
}
