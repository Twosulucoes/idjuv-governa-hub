/**
 * PÁGINA PLACEHOLDER PARA DETALHES DO FINANCEIRO
 * Usada quando a página de detalhe ainda não foi implementada
 * Padrões do design system: PageHeader, EmptyState.
 */

import { Link, useParams, useLocation } from "react-router-dom";
import { Construction } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader } from "@/components/design-system";

export default function PlaceholderDetalheFinanceiroPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  // Determinar o tipo de entidade baseado na URL
  const path = location.pathname;
  let tipo = "Registro";
  let voltar = "/financeiro";
  let listagem: string | null = null;

  if (path.includes("/solicitacoes")) {
    tipo = "Solicitação";
    voltar = "/financeiro/solicitacoes";
    listagem = "Solicitações de despesa";
  } else if (path.includes("/empenhos")) {
    tipo = "Empenho";
    voltar = "/financeiro/empenhos";
    listagem = "Empenhos";
  } else if (path.includes("/pagamentos")) {
    tipo = "Pagamento";
    voltar = "/financeiro/pagamentos";
    listagem = "Pagamentos";
  } else if (path.includes("/liquidacoes")) {
    tipo = "Liquidação";
    voltar = "/financeiro/liquidacoes";
    listagem = "Liquidações";
  }

  return (
    <ModuleLayout module="financeiro">
      <div className="space-y-6">
        <PageHeader
          migalhas={[
            { rotulo: "Financeiro", href: "/financeiro" },
            ...(listagem ? [{ rotulo: listagem, href: voltar }] : []),
            { rotulo: tipo },
          ]}
          titulo={`Detalhe: ${tipo.toLowerCase()}`}
          descricao={<span className="font-mono">ID: {id}</span>}
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
