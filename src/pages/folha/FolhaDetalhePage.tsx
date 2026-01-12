import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Loader2, Users, DollarSign, FileText, Calculator } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { STATUS_FOLHA_LABELS, STATUS_FOLHA_COLORS, MESES, type StatusFolha } from "@/types/folha";

export default function FolhaDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Buscar dados da folha
  const { data: folha, isLoading: loadingFolha } = useQuery({
    queryKey: ["folha-detalhe", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("folhas_pagamento")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Buscar fichas financeiras da folha
  const { data: fichas, isLoading: loadingFichas } = useQuery({
    queryKey: ["fichas-financeiras", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fichas_financeiras")
        .select(`
          *,
          servidor:servidores(id, nome_completo, cpf, matricula)
        `)
        .eq("folha_id", id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const formatCurrency = (value: number | null | undefined) => {
    return (value ?? 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  if (loadingFolha) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AdminLayout>
    );
  }

  if (!folha) {
    return (
      <AdminLayout>
        <div className="text-center py-24">
          <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold mb-2">Folha não encontrada</h2>
          <p className="text-muted-foreground mb-4">
            A folha de pagamento solicitada não existe ou foi removida.
          </p>
          <Button onClick={() => navigate("/folha/gestao")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Gestão
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const competencia = `${MESES[folha.competencia_mes - 1]}/${folha.competencia_ano}`;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/folha/gestao")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Folha {competencia}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={STATUS_FOLHA_COLORS[folha.status as StatusFolha] || "bg-gray-100"}>
                  {STATUS_FOLHA_LABELS[folha.status as StatusFolha] || folha.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Tipo: {folha.tipo_folha}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Servidores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{folha.quantidade_servidores || 0}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Bruto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatCurrency(folha.total_bruto)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                Total Descontos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-orange-600">
                {formatCurrency(folha.total_descontos)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Líquido
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(folha.total_liquido)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Encargos Patronais */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                INSS Servidor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{formatCurrency(folha.total_inss_servidor)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                INSS Patronal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{formatCurrency(folha.total_inss_patronal)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                IRRF
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{formatCurrency(folha.total_irrf)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Encargos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xl font-semibold">{formatCurrency(folha.total_encargos_patronais)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Fichas Financeiras */}
        <Card>
          <CardHeader>
            <CardTitle>Fichas Financeiras</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingFichas ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : fichas?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma ficha financeira processada para esta competência.</p>
                <p className="text-sm mt-2">
                  Processe a folha para gerar as fichas financeiras dos servidores.
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Servidor</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead className="text-right">Proventos</TableHead>
                      <TableHead className="text-right">Descontos</TableHead>
                      <TableHead className="text-right">Líquido</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fichas?.map((ficha) => (
                      <TableRow key={ficha.id}>
                        <TableCell className="font-mono">
                          {ficha.servidor?.matricula || "-"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {ficha.servidor?.nome_completo || "Servidor não encontrado"}
                        </TableCell>
                        <TableCell>{ficha.cargo_nome || "-"}</TableCell>
                        <TableCell className="text-right font-mono">
                          {formatCurrency(ficha.total_proventos)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-orange-600">
                          {formatCurrency(ficha.total_descontos)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium text-green-600">
                          {formatCurrency(ficha.valor_liquido)}
                        </TableCell>
                        <TableCell className="text-center">
                          {ficha.tem_inconsistencia ? (
                            <Badge variant="destructive">Inconsistência</Badge>
                          ) : ficha.processado ? (
                            <Badge className="bg-green-100 text-green-800">Processado</Badge>
                          ) : (
                            <Badge variant="secondary">Pendente</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Observações */}
        {folha.observacoes && (
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground whitespace-pre-wrap">{folha.observacoes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
