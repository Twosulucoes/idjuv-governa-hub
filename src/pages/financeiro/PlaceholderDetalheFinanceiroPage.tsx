/**
 * PÁGINA PLACEHOLDER PARA DETALHES DO FINANCEIRO
 * Usada quando a página de detalhe ainda não foi implementada
 */

import { Link, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Construction } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PlaceholderDetalheFinanceiroPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  // Determinar o tipo de entidade baseado na URL
  const path = location.pathname;
  let tipo = "Registro";
  let voltar = "/financeiro";

  if (path.includes("/solicitacoes")) {
    tipo = "Solicitação";
    voltar = "/financeiro/solicitacoes";
  } else if (path.includes("/empenhos")) {
    tipo = "Empenho";
    voltar = "/financeiro/empenhos";
  } else if (path.includes("/pagamentos")) {
    tipo = "Pagamento";
    voltar = "/financeiro/pagamentos";
  } else if (path.includes("/liquidacoes")) {
    tipo = "Liquidação";
    voltar = "/financeiro/liquidacoes";
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-sm mb-6 text-muted-foreground">
          <Link to="/financeiro" className="hover:underline">Financeiro</Link>
          <span>/</span>
          <span>{tipo}</span>
        </div>
        
        <Card>
          <CardContent className="py-12 text-center">
            <Construction className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <CardTitle className="mb-2">Página em Construção</CardTitle>
            <CardDescription className="max-w-md mx-auto">
              A visualização detalhada de {tipo.toLowerCase()} está sendo desenvolvida. 
              Em breve você poderá visualizar todas as informações aqui.
            </CardDescription>
            <p className="text-sm font-mono text-muted-foreground mt-4">ID: {id}</p>
            <Button asChild className="mt-6">
              <Link to={voltar}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar para Listagem
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
