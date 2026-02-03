/**
 * Dashboard do Módulo Financeiro
 * Visão consolidada de orçamento, despesas, receitas e pendências
 */

import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  AlertTriangle,
  FileText,
  Building2,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  PiggyBank,
  Receipt,
  CheckCircle2,
} from "lucide-react";
import { useDashboardFinanceiro } from "@/hooks/useFinanceiro";
import { Link } from "react-router-dom";
import { formatCurrency } from "@/lib/formatters";

export default function DashboardFinanceiroPage() {
  const { 
    resumoOrcamentario, 
    contasBancarias, 
    pagamentosPendentes,
    adiantamentosPendentes,
    solicitacoesPendentes,
    loading,
  } = useDashboardFinanceiro();

  const resumo = resumoOrcamentario.data;
  const contas = contasBancarias.data || [];
  const saldoTotal = contas.reduce((acc, c) => acc + Number(c.saldo_atual || 0), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Financeiro</h1>
            <p className="text-muted-foreground">
              Gestão orçamentária e financeira do IDJuv
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link to="/financeiro/relatorios">Relatórios</Link>
            </Button>
            <Button asChild>
              <Link to="/financeiro/solicitacoes?acao=nova">Nova Solicitação</Link>
            </Button>
          </div>
        </div>

        {/* Cards de Resumo Orçamentário */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Dotação Atual
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {formatCurrency(resumo?.dotacao_atual || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Inicial: {formatCurrency(resumo?.dotacao_inicial || 0)}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Empenhado
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatCurrency(resumo?.empenhado || 0)}
                  </div>
                  <Progress 
                    value={resumo?.dotacao_atual ? (resumo.empenhado / resumo.dotacao_atual) * 100 : 0} 
                    className="h-1 mt-2"
                  />
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pago
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(resumo?.pago || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(resumo?.percentual_executado || 0).toFixed(1)}% executado
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Saldo Disponível
              </CardTitle>
              <PiggyBank className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <>
                  <div className="text-2xl font-bold text-amber-600">
                    {formatCurrency(resumo?.saldo_disponivel || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Disponível para empenho
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Pendências e Alertas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Solicitações Pendentes
              </CardTitle>
              <FileText className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {solicitacoesPendentes.data || 0}
              </div>
              <Button variant="link" className="p-0 h-auto text-xs" asChild>
                <Link to="/financeiro/solicitacoes?status=pendente_analise">
                  Ver solicitações →
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Pagamentos Programados
              </CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {pagamentosPendentes.data || 0}
              </div>
              <Button variant="link" className="p-0 h-auto text-xs" asChild>
                <Link to="/financeiro/pagamentos?status=programado">
                  Ver pagamentos →
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                Adiantamentos Pendentes
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {adiantamentosPendentes.data || 0}
              </div>
              <Button variant="link" className="p-0 h-auto text-xs" asChild>
                <Link to="/financeiro/adiantamentos">
                  Ver adiantamentos →
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Contas Bancárias e Ações Rápidas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contas Bancárias */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Contas Bancárias
              </CardTitle>
              <Badge variant="outline">
                Total: {formatCurrency(saldoTotal)}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading ? (
                <>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </>
              ) : contas.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma conta cadastrada
                </p>
              ) : (
                contas.slice(0, 5).map((conta) => (
                  <div 
                    key={conta.id} 
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-8 w-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{conta.nome_conta}</p>
                        <p className="text-xs text-muted-foreground">
                          {conta.banco_nome} | Ag: {conta.agencia} | CC: {conta.conta}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${Number(conta.saldo_atual) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(Number(conta.saldo_atual))}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <Button variant="outline" className="w-full" asChild>
                <Link to="/financeiro/contas-bancarias">
                  Ver todas as contas
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Ações Rápidas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Operações
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link to="/financeiro/solicitacoes">
                  <FileText className="h-6 w-6" />
                  <span>Solicitações</span>
                </Link>
              </Button>
              
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link to="/financeiro/empenhos">
                  <Receipt className="h-6 w-6" />
                  <span>Empenhos</span>
                </Link>
              </Button>
              
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link to="/financeiro/liquidacoes">
                  <CheckCircle2 className="h-6 w-6" />
                  <span>Liquidações</span>
                </Link>
              </Button>
              
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link to="/financeiro/pagamentos">
                  <ArrowDownRight className="h-6 w-6" />
                  <span>Pagamentos</span>
                </Link>
              </Button>
              
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link to="/financeiro/receitas">
                  <ArrowUpRight className="h-6 w-6" />
                  <span>Receitas</span>
                </Link>
              </Button>
              
              <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
                <Link to="/financeiro/adiantamentos">
                  <Wallet className="h-6 w-6" />
                  <span>Adiantamentos</span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Execução por Fonte */}
        <Card>
          <CardHeader>
            <CardTitle>Execução Orçamentária</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Barra de progresso geral */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Empenhado</span>
                  <span className="font-medium">
                    {formatCurrency(resumo?.empenhado || 0)} / {formatCurrency(resumo?.dotacao_atual || 0)}
                  </span>
                </div>
                <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="absolute left-0 top-0 h-full bg-blue-500 transition-all"
                    style={{ 
                      width: `${resumo?.dotacao_atual ? (resumo.empenhado / resumo.dotacao_atual) * 100 : 0}%` 
                    }}
                  />
                  <div 
                    className="absolute left-0 top-0 h-full bg-green-500 transition-all"
                    style={{ 
                      width: `${resumo?.dotacao_atual ? (resumo.pago / resumo.dotacao_atual) * 100 : 0}%` 
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    Pago: {formatCurrency(resumo?.pago || 0)}
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    Liquidado: {formatCurrency(resumo?.liquidado || 0)}
                  </span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-amber-500 rounded-full" />
                    Disponível: {formatCurrency(resumo?.saldo_disponivel || 0)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
