/**
 * DETALHE DO BEM PATRIMONIAL
 * Visualização completa de um bem específico
 */

import { Link, useParams } from "react-router-dom";
import { Package, ArrowLeft, Edit } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
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
      <AdminLayout>
        <div className="container mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !bem) {
    return (
      <AdminLayout>
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
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
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
                <p className="opacity-90 text-sm font-mono">{bem.numero_patrimonio}</p>
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
                <Link to={`/inventario/bens/${id}/editar`}>
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
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Categoria</span>
                  <Badge variant="outline" className="capitalize">
                    {bem.categoria_bem?.replace('_', ' ') || '-'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Situação</span>
                  <Badge>{bem.situacao || '-'}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Marca</span>
                  <span>{bem.marca || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modelo</span>
                  <span>{bem.modelo || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nº Série</span>
                  <span className="font-mono text-sm">{bem.numero_serie || '-'}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dados Financeiros</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor de Aquisição</span>
                  <span className="font-semibold">
                    {bem.valor_aquisicao 
                      ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(bem.valor_aquisicao)
                      : '-'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data de Aquisição</span>
                  <span>{bem.data_aquisicao || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estado de Conservação</span>
                  <Badge variant="outline">{bem.estado_conservacao || '-'}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {bem.observacao && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{bem.observacao}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </AdminLayout>
  );
}
