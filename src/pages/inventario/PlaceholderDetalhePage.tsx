/**
 * PÁGINA PLACEHOLDER PARA DETALHES
 * Usada quando a página de detalhe ainda não foi implementada
 */

import { Link, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Construction } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
    <MainLayout>
      <section className="bg-secondary text-secondary-foreground py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm mb-3 opacity-80">
            <Link to="/inventario" className="hover:underline">Inventário</Link>
            <span>/</span>
            <span>{tipo}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Construction className="w-8 h-8" />
              <div>
                <h1 className="font-serif text-2xl font-bold">Detalhe - {tipo}</h1>
                <p className="opacity-90 text-sm font-mono">ID: {id}</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link to={voltar}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container mx-auto px-4">
          <Card>
            <CardContent className="py-12 text-center">
              <Construction className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <CardTitle className="mb-2">Página em Construção</CardTitle>
              <CardDescription className="max-w-md mx-auto">
                A visualização detalhada de {tipo.toLowerCase()} está sendo desenvolvida. 
                Em breve você poderá visualizar todas as informações aqui.
              </CardDescription>
              <Button asChild className="mt-6">
                <Link to={voltar}>Voltar para Listagem</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
