 /**
  * Central de Relatórios de Unidades Locais
  * Hub unificado com categorias: Simples, Operacionais, Avançados
  */
 import React, { useState, useEffect, useMemo } from 'react';
 import { ModuleLayout } from "@/components/layout";
 import { ProtectedRoute } from '@/components/auth';
 import { supabase } from '@/integrations/supabase/client';
 import { toast } from 'sonner';
 import { format } from 'date-fns';
 import {
   Building2,
   FileText,
   MapPin,
   Package,
   Calendar,
   Users,
   TrendingUp,
   BarChart3,
   Loader2,
   ClipboardList,
   FileCheck,
   AlertTriangle,
   PieChart,
   Activity,
 } from 'lucide-react';
 
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
 import { Badge } from '@/components/ui/badge';
 import { Separator } from '@/components/ui/separator';
 
 import { ReportCard } from '@/components/unidades/reports/ReportCard';
 import { ReportFilters, type ReportFiltersState } from '@/components/unidades/reports/ReportFilters';
 
 // PDF Generators
 import { generateFichaUnidadeLocal, type FichaUnidadeLocalData } from '@/lib/pdfFichaUnidadeLocal';
 import { generateListagemUnidades, type UnidadeResumo } from '@/lib/pdfListagemUnidades';
 
 import {
   TIPO_UNIDADE_LABELS,
   STATUS_UNIDADE_LABELS,
 } from '@/types/unidadesLocais';
 
 // Tipos
 interface UnidadeData {
   id: string;
   codigo_unidade: string;
   nome_unidade: string;
   tipo_unidade: string;
   municipio: string;
   endereco_completo: string | null;
   status: string;
   natureza_uso: string | null;
   diretoria_vinculada: string | null;
   capacidade: number | null;
   horario_funcionamento: string | null;
   estrutura_disponivel: string | null;
   areas_disponiveis: string[];
   chefe_atual_nome: string | null;
   chefe_atual_cargo: string | null;
   chefe_ato_numero: string | null;
   total_patrimonio: number;
   patrimonio_valor_total: number;
   total_agendamentos: number;
   agendamentos_aprovados: number;
   agendamentos_pendentes: number;
 }
 
 // Definição dos relatórios por categoria
 const RELATORIOS_SIMPLES = [
   {
     id: 'listagem-geral',
     titulo: 'Listagem Geral de Unidades',
     descricao: 'Visão tabular consolidada de todas as unidades do acervo estadual',
     icon: ClipboardList,
     badge: 'Mais usado',
   },
   {
     id: 'ficha-cadastral',
     titulo: 'Ficha Cadastral Individual',
     descricao: 'Documento oficial com todos os dados de uma unidade específica',
     icon: FileText,
   },
   {
     id: 'inventario-areas',
     titulo: 'Inventário de Áreas',
     descricao: 'Catálogo completo de espaços disponíveis por unidade',
     icon: MapPin,
   },
 ];
 
 const RELATORIOS_OPERACIONAIS = [
   {
     id: 'patrimonio-unidade',
     titulo: 'Patrimônio por Unidade',
     descricao: 'Inventário de bens patrimoniais alocados em cada unidade',
     icon: Package,
   },
   {
     id: 'cedencias-agenda',
     titulo: 'Agenda de Cedências',
     descricao: 'Histórico de agendamentos e uso das unidades por período',
     icon: Calendar,
   },
   {
     id: 'termos-cessao',
     titulo: 'Termos de Cessão Emitidos',
     descricao: 'Controle documental de termos emitidos e assinados',
     icon: FileCheck,
   },
   {
     id: 'responsaveis',
     titulo: 'Chefes e Responsáveis',
     descricao: 'Relação de designações com alertas de unidades sem gestor',
     icon: Users,
   },
 ];
 
 const RELATORIOS_AVANCADOS = [
   {
     id: 'dashboard-analitico',
     titulo: 'Dashboard Analítico',
     descricao: 'Visão executiva consolidada com KPIs e gráficos',
     icon: BarChart3,
     badge: 'Em breve',
     disabled: true,
   },
   {
     id: 'mapa-ocupacao',
     titulo: 'Mapa de Ocupação',
     descricao: 'Taxa de utilização e ociosidade das unidades',
     icon: PieChart,
     badge: 'Em breve',
     disabled: true,
   },
   {
     id: 'indicadores-desempenho',
     titulo: 'Indicadores de Desempenho',
     descricao: 'KPIs comparativos: aprovações, tempo de resposta, público',
     icon: Activity,
     badge: 'Em breve',
     disabled: true,
   },
   {
     id: 'conformidade',
     titulo: 'Relatório de Conformidade',
     descricao: 'Auditoria com pendências: sem chefe, sem patrimônio, termos vencidos',
     icon: AlertTriangle,
   },
 ];
 
 function RelatoriosCentralContent() {
   const [unidades, setUnidades] = useState<UnidadeData[]>([]);
   const [loading, setLoading] = useState(true);
   const [generating, setGenerating] = useState<string | null>(null);
 
   // Filtros
   const [filters, setFilters] = useState<ReportFiltersState>({
     municipio: 'all',
     tipo: 'all',
     status: 'all',
   });
 
   useEffect(() => {
     loadUnidades();
   }, []);
 
   const loadUnidades = async () => {
     setLoading(true);
     try {
       const { data, error } = await supabase
         .from('v_relatorio_unidades_locais')
         .select('*')
         .order('municipio')
         .order('nome_unidade');
 
       if (error) throw error;
       setUnidades((data as any[]) || []);
     } catch (error: any) {
       console.error('Erro ao carregar unidades:', error);
       toast.error('Erro ao carregar dados das unidades');
     } finally {
       setLoading(false);
     }
   };
 
   // Filtrar unidades
   const filteredUnidades = useMemo(() => {
     return unidades.filter((u) => {
       if (filters.municipio !== 'all' && u.municipio !== filters.municipio) return false;
       if (filters.tipo !== 'all' && u.tipo_unidade !== filters.tipo) return false;
       if (filters.status !== 'all' && u.status !== filters.status) return false;
       return true;
     });
   }, [unidades, filters]);
 
   // Estatísticas resumidas
   const stats = useMemo(() => {
     return {
       total: filteredUnidades.length,
       ativas: filteredUnidades.filter((u) => u.status === 'ativa').length,
       comChefe: filteredUnidades.filter((u) => u.chefe_atual_nome).length,
       comPatrimonio: filteredUnidades.filter((u) => u.total_patrimonio > 0).length,
     };
   }, [filteredUnidades]);
 
   // Handlers de geração
   const handleGenerateListagem = async () => {
     setGenerating('listagem-geral');
     try {
       const dados: UnidadeResumo[] = filteredUnidades.map((u) => ({
         codigo: u.codigo_unidade,
         nome: u.nome_unidade,
         tipo: u.tipo_unidade,
         municipio: u.municipio,
         status: u.status,
         chefe: u.chefe_atual_nome || undefined,
         capacidade: u.capacidade || undefined,
       }));
 
       await generateListagemUnidades(dados, {
         titulo: 'RELATÓRIO DE UNIDADES LOCAIS',
         filtros: {
           municipio: filters.municipio !== 'all' ? filters.municipio : undefined,
           tipo: filters.tipo !== 'all' ? filters.tipo : undefined,
           status: filters.status !== 'all' ? filters.status : undefined,
         },
       });
       toast.success('Listagem gerada com sucesso!');
     } catch (error) {
       console.error(error);
       toast.error('Erro ao gerar listagem');
     } finally {
       setGenerating(null);
     }
   };
 
   const handleGenerateFicha = async () => {
     if (filteredUnidades.length === 0) {
       toast.error('Nenhuma unidade encontrada com os filtros aplicados');
       return;
     }
     
     // Para ficha individual, usar a primeira unidade filtrada
     // Em produção, abrir modal para seleção
     const unidade = filteredUnidades[0];
     
     setGenerating('ficha-cadastral');
     try {
       const dados: FichaUnidadeLocalData = {
         identificacao: {
           codigo: unidade.codigo_unidade,
           nome: unidade.nome_unidade,
           tipo: unidade.tipo_unidade,
           status: unidade.status,
           diretoria: unidade.diretoria_vinculada || undefined,
           capacidade: unidade.capacidade || undefined,
         },
         localizacao: {
           municipio: unidade.municipio,
           endereco: unidade.endereco_completo || undefined,
         },
         estrutura: {
           areas: unidade.areas_disponiveis || [],
           estrutura: unidade.estrutura_disponivel || undefined,
           horarioFuncionamento: unidade.horario_funcionamento || undefined,
         },
         responsavel: unidade.chefe_atual_nome
           ? {
               nome: unidade.chefe_atual_nome,
               cargo: unidade.chefe_atual_cargo || 'Chefe de Unidade',
               numeroAto: unidade.chefe_ato_numero || undefined,
             }
           : null,
         patrimonio: unidade.total_patrimonio > 0
           ? {
               totalItens: unidade.total_patrimonio,
               valorEstimado: unidade.patrimonio_valor_total,
               porEstado: {},
             }
           : undefined,
         cedencias: unidade.total_agendamentos > 0
           ? {
               totalSolicitadas: unidade.total_agendamentos,
               aprovadas: unidade.agendamentos_aprovados,
               pendentes: unidade.agendamentos_pendentes,
               rejeitadas: 0,
               canceladas: 0,
             }
           : undefined,
       };
 
       await generateFichaUnidadeLocal(dados);
       toast.success('Ficha cadastral gerada com sucesso!');
     } catch (error) {
       console.error(error);
       toast.error('Erro ao gerar ficha cadastral');
     } finally {
       setGenerating(null);
     }
   };
 
   const handleGenerateConformidade = async () => {
     setGenerating('conformidade');
     try {
       // Filtrar unidades com pendências
       const pendencias = filteredUnidades.filter(
         (u) => !u.chefe_atual_nome || u.total_patrimonio === 0 || u.status !== 'ativa'
       );
 
       const dados: UnidadeResumo[] = pendencias.map((u) => ({
         codigo: u.codigo_unidade,
         nome: u.nome_unidade,
         tipo: u.tipo_unidade,
         municipio: u.municipio,
         status: u.status,
         chefe: u.chefe_atual_nome || '⚠ SEM RESPONSÁVEL',
         capacidade: u.capacidade || undefined,
       }));
 
       await generateListagemUnidades(dados, {
         titulo: 'RELATÓRIO DE CONFORMIDADE',
         subtitulo: `${pendencias.length} unidades com pendências identificadas`,
       });
       toast.success('Relatório de conformidade gerado!');
     } catch (error) {
       console.error(error);
       toast.error('Erro ao gerar relatório');
     } finally {
       setGenerating(null);
     }
   };
 
   const getGenerateHandler = (reportId: string) => {
     switch (reportId) {
       case 'listagem-geral':
         return handleGenerateListagem;
       case 'ficha-cadastral':
         return handleGenerateFicha;
       case 'conformidade':
         return handleGenerateConformidade;
       default:
         return undefined;
     }
   };
 
   if (loading) {
     return (
       <div className="flex items-center justify-center h-96">
         <Loader2 className="h-8 w-8 animate-spin text-primary" />
       </div>
     );
   }
 
   return (
     <div className="space-y-6 p-6">
       {/* Header */}
       <div className="flex flex-col gap-2">
         <div className="flex items-center gap-2">
           <Building2 className="h-6 w-6 text-primary" />
           <h1 className="text-2xl font-bold">Central de Relatórios</h1>
         </div>
         <p className="text-muted-foreground">
           Gere relatórios institucionais padronizados para unidades locais
         </p>
       </div>
 
       {/* Estatísticas rápidas */}
       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <Card>
           <CardContent className="p-4">
             <div className="text-2xl font-bold">{stats.total}</div>
             <div className="text-sm text-muted-foreground">Unidades no filtro</div>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{stats.ativas}</div>
             <div className="text-sm text-muted-foreground">Ativas</div>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="p-4">
             <div className="text-2xl font-bold">{stats.comChefe}</div>
             <div className="text-sm text-muted-foreground">Com responsável</div>
           </CardContent>
         </Card>
         <Card>
           <CardContent className="p-4">
             <div className="text-2xl font-bold">{stats.comPatrimonio}</div>
             <div className="text-sm text-muted-foreground">Com patrimônio</div>
           </CardContent>
         </Card>
       </div>
 
       {/* Filtros */}
       <ReportFilters filters={filters} onChange={setFilters} />
 
       <Separator />
 
       {/* Tabs de categorias */}
       <Tabs defaultValue="simples" className="w-full">
         <TabsList className="grid w-full grid-cols-3 max-w-md">
           <TabsTrigger value="simples">Simples</TabsTrigger>
           <TabsTrigger value="operacionais">Operacionais</TabsTrigger>
           <TabsTrigger value="avancados">Avançados</TabsTrigger>
         </TabsList>
 
         {/* Relatórios Simples */}
         <TabsContent value="simples" className="mt-6">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {RELATORIOS_SIMPLES.map((r) => (
               <ReportCard
                 key={r.id}
                 id={r.id}
                 titulo={r.titulo}
                 descricao={r.descricao}
                 icon={r.icon}
                 badge={r.badge}
                 loading={generating === r.id}
                 onGenerate={getGenerateHandler(r.id)}
               />
             ))}
           </div>
         </TabsContent>
 
         {/* Relatórios Operacionais */}
         <TabsContent value="operacionais" className="mt-6">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {RELATORIOS_OPERACIONAIS.map((r) => (
               <ReportCard
                 key={r.id}
                 id={r.id}
                 titulo={r.titulo}
                 descricao={r.descricao}
                 icon={r.icon}
                 badge="Em breve"
                 badgeVariant="outline"
                 disabled
                 loading={generating === r.id}
               />
             ))}
           </div>
           <p className="text-sm text-muted-foreground mt-4 text-center">
             Relatórios operacionais serão implementados na próxima fase.
           </p>
         </TabsContent>
 
         {/* Relatórios Avançados */}
         <TabsContent value="avancados" className="mt-6">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {RELATORIOS_AVANCADOS.map((r) => (
               <ReportCard
                 key={r.id}
                 id={r.id}
                 titulo={r.titulo}
                 descricao={r.descricao}
                 icon={r.icon}
                 badge={r.badge}
                 badgeVariant={r.disabled ? 'outline' : 'secondary'}
                 disabled={r.disabled}
                 loading={generating === r.id}
                 onGenerate={getGenerateHandler(r.id)}
               />
             ))}
           </div>
         </TabsContent>
       </Tabs>
     </div>
   );
 }
 
export default function RelatoriosCentralPage() {
  return (
    <ProtectedRoute>
      <ModuleLayout module="patrimonio">
        <RelatoriosCentralContent />
       </ModuleLayout>
     </ProtectedRoute>
   );
 }