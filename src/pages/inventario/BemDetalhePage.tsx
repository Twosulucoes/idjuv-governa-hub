/**
 * DETALHE DO BEM PATRIMONIAL
 * Visualização completa de um bem específico
 */

import { Link, useParams } from "react-router-dom";
import { Package, ArrowLeft, Edit } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useBemPatrimonial } from "@/hooks/usePatrimonio";

export default function BemDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const { data: bem, isLoading, error } = useBemPatrimonial(id || '');

  if (isLoading) {
    return (
      <ModuleLayout module="patrimonio">
        <div className="container mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </ModuleLayout>
    );
  }

  if (error || !bem) {
    return (
      <ModuleLayout module="patrimonio">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Bem não encontrado</p>
              <Button asChild className="mt-4">
                <Link to="/inventario/bens">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout module="patrimonio">
      <section className="bg-secondary text-secondary-foreground py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm mb-3 opacity-80">
            <Link to="/inventario" className="hover:underline">Inventário</Link>
            <span>/</span>
            <Link to="/inventario/bens" className="hover:underline">Bens</Link>
            <span>/</span>
            <span>{bem.numero_patrimonio || 'Detalhe'}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8" />
              <div>
                <h1 className="font-serif text-2xl font-bold">{bem.descricao}</h1>
                <p className="opacity-90 text-sm">
                  Patrimônio: {bem.numero_patrimonio}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/inventario/bens">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Link>
              </Button>
              <Button asChild>
                <Link to={`/inventario/bens/${bem.id}/editar`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-6">
        <div className="container mx-auto px-4 space-y-6">
          {/* Informações Gerais */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Categoria</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="capitalize">
                  {bem.categoria_bem?.replace('_', ' ') || '-'}
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Situação</CardDescription>
              </CardHeader>
              <CardContent>
                <Badge>{bem.situacao || 'Cadastrado'}</Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Valor de Aquisição</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">
                  {bem.valor_aquisicao 
                    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bem.valor_aquisicao)
                    : '-'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detalhes */}
          <Card>
            <CardHeader>
              <CardTitle>Detalhes do Bem</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 text-sm">
                <div>
                  <dt className="text-muted-foreground">Marca</dt>
                  <dd className="font-medium">{bem.marca || '-'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Modelo</dt>
                  <dd className="font-medium">{bem.modelo || '-'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Nº Série</dt>
                  <dd className="font-medium">{bem.numero_serie || '-'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Estado de Conservação</dt>
                  <dd className="font-medium capitalize">{bem.estado_conservacao || '-'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Data de Aquisição</dt>
                  <dd className="font-medium">{bem.data_aquisicao || '-'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Observações */}
          {bem.observacao && (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{bem.observacao}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </ModuleLayout>
  );
}
