/**
 * Relatórios do módulo Gestores Escolares
 */

import { useState, useMemo } from 'react';
import { Download, FileSpreadsheet, BarChart3, PieChart, TrendingUp, School, Users, Clock, CheckCircle } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useGestoresEscolares } from '@/hooks/useGestoresEscolares';
import { useEscolasJer } from '@/hooks/useEscolasJer';
import { calcularMetricas, STATUS_GESTOR_CONFIG, type StatusGestor } from '@/types/gestoresEscolares';
import * as XLSX from 'xlsx';

export default function RelatoriosGestoresPage() {
  const { gestores, isLoading: loadingGestores } = useGestoresEscolares();
  const { escolas, isLoading: loadingEscolas } = useEscolasJer();
  
  const metricas = useMemo(() => calcularMetricas(gestores), [gestores]);
  
  const escolasSemGestor = useMemo(() => {
    return escolas.filter(e => !e.ja_cadastrada);
  }, [escolas]);
  
  const escolasComGestor = useMemo(() => {
    return escolas.filter(e => e.ja_cadastrada);
  }, [escolas]);

  const percentualCobertura = escolas.length > 0 
    ? Math.round((escolasComGestor.length / escolas.length) * 100) 
    : 0;

  // Exportar relatório completo
  const exportarRelatorioCompleto = () => {
    const dados = gestores.map(g => ({
      'Escola': g.escola?.nome || '',
      'Município': g.escola?.municipio || '',
      'Gestor': g.nome,
      'CPF': g.cpf,
      'Email': g.email,
      'Celular': g.celular,
      'Status': STATUS_GESTOR_CONFIG[g.status as StatusGestor]?.label || g.status,
      'Responsável': g.responsavel_nome || '',
      'Data Cadastro': new Date(g.created_at).toLocaleDateString('pt-BR'),
      'Cadastrado CBDE': g.data_cadastro_cbde ? new Date(g.data_cadastro_cbde).toLocaleDateString('pt-BR') : '',
      'Data Contato': g.data_contato ? new Date(g.data_contato).toLocaleDateString('pt-BR') : '',
      'Data Confirmação': g.data_confirmacao ? new Date(g.data_confirmacao).toLocaleDateString('pt-BR') : '',
    }));

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Gestores');
    
    // Adicionar aba de resumo
    const resumo = [
      { 'Métrica': 'Total de Gestores', 'Valor': metricas.total },
      { 'Métrica': 'Aguardando', 'Valor': metricas.aguardando },
      { 'Métrica': 'Em Processamento', 'Valor': metricas.em_processamento },
      { 'Métrica': 'Cadastrado CBDE', 'Valor': metricas.cadastrado_cbde },
      { 'Métrica': 'Contato Realizado', 'Valor': metricas.contato_realizado },
      { 'Métrica': 'Confirmados', 'Valor': metricas.confirmado },
      { 'Métrica': 'Problemas', 'Valor': metricas.problema },
      { 'Métrica': '% Concluído', 'Valor': `${metricas.percentualConcluido}%` },
      { 'Métrica': 'Total Escolas', 'Valor': escolas.length },
      { 'Métrica': 'Escolas com Gestor', 'Valor': escolasComGestor.length },
      { 'Métrica': 'Escolas sem Gestor', 'Valor': escolasSemGestor.length },
      { 'Métrica': '% Cobertura', 'Valor': `${percentualCobertura}%` },
    ];
    const wsResumo = XLSX.utils.json_to_sheet(resumo);
    XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');
    
    XLSX.writeFile(wb, `relatorio-gestores-jer-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Exportar escolas sem gestor
  const exportarEscolasSemGestor = () => {
    const dados = escolasSemGestor.map(e => ({
      'Escola': e.nome,
      'Município': e.municipio || '',
      'INEP': e.inep || '',
    }));

    const ws = XLSX.utils.json_to_sheet(dados);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Escolas sem Gestor');
    XLSX.writeFile(wb, `escolas-sem-gestor-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const isLoading = loadingGestores || loadingEscolas;

  return (
    <AdminLayout 
      title="Relatórios" 
      description="Gestores Escolares - Jogos Escolares de Roraima"
    >
      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <Users className="h-8 w-8 text-primary" />
              <span className="text-3xl font-bold">{isLoading ? '...' : metricas.total}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Total de Gestores</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <School className="h-8 w-8 text-warning" />
              <span className="text-3xl font-bold">{isLoading ? '...' : escolas.length}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Total de Escolas</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <CheckCircle className="h-8 w-8 text-success" />
              <span className="text-3xl font-bold">{isLoading ? '...' : metricas.confirmado}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Confirmados</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <Clock className="h-8 w-8 text-warning" />
              <span className="text-3xl font-bold">{isLoading ? '...' : metricas.aguardando + metricas.em_processamento}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Pendentes</p>
          </CardContent>
        </Card>
      </div>

      {/* Progresso */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progresso do Credenciamento
            </CardTitle>
            <CardDescription>Gestores confirmados vs total</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Confirmados</span>
                <span className="text-sm text-muted-foreground">
                  {metricas.confirmado} de {metricas.total} ({metricas.percentualConcluido}%)
                </span>
              </div>
              <Progress value={metricas.percentualConcluido} className="h-3" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <School className="h-5 w-5" />
              Cobertura de Escolas
            </CardTitle>
            <CardDescription>Escolas com gestor cadastrado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Com Gestor</span>
                <span className="text-sm text-muted-foreground">
                  {escolasComGestor.length} de {escolas.length} ({percentualCobertura}%)
                </span>
              </div>
              <Progress value={percentualCobertura} className="h-3" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Detalhado */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Status Detalhado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(STATUS_GESTOR_CONFIG).map(([status, config]) => {
              const count = metricas[status as keyof typeof metricas] || 0;
              return (
                <div key={status} className={`p-4 rounded-lg ${config.bgColor}`}>
                  <p className={`text-2xl font-bold ${config.color}`}>{count}</p>
                  <p className={`text-sm ${config.color}`}>{config.label}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Ações de Exportação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Exportar Relatórios
          </CardTitle>
          <CardDescription>Baixe os dados em formato Excel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button onClick={exportarRelatorioCompleto} disabled={isLoading}>
              <Download className="h-4 w-4 mr-2" />
              Relatório Completo
            </Button>
            <Button variant="outline" onClick={exportarEscolasSemGestor} disabled={isLoading}>
              <Download className="h-4 w-4 mr-2" />
              Escolas sem Gestor ({escolasSemGestor.length})
            </Button>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
