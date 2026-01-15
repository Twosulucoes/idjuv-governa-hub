import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building2, 
  Users, 
  Download, 
  Printer, 
  Settings, 
  BarChart3,
  ArrowLeft,
  Network,
  Link2,
  Link2Off,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

import { useOrganograma } from '@/hooks/useOrganograma';
import OrganogramaCanvas from '@/components/organograma/OrganogramaCanvas';
import UnidadeDetailPanel from '@/components/organograma/UnidadeDetailPanel';
import { UnidadeOrganizacional, LABELS_UNIDADE } from '@/types/organograma';
import { AdminOnly } from '@/components/auth';
import { gerarOrganogramaPDF, gerarOrganogramaListaPDF, OrganogramaConfig } from '@/lib/pdfOrganograma';
import { ExportOrganogramaDialog } from '@/components/organograma/ExportOrganogramaDialog';

export default function OrganogramaPage() {
  const { unidades, lotacoes, loading, error, contarServidores, getLotacoesByUnidade, atualizarHierarquia, verificarCiclo } = useOrganograma();
  const [selectedUnidade, setSelectedUnidade] = useState<UnidadeOrganizacional | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Estatísticas
  const totalUnidades = unidades.length;
  const totalServidores = lotacoes.length;
  const unidadesPorTipo = unidades.reduce((acc, u) => {
    acc[u.tipo] = (acc[u.tipo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Exportar com configuração
  const handleExport = async (tipo: 'grafico' | 'lista', config: OrganogramaConfig) => {
    setIsExporting(true);
    try {
      if (tipo === 'grafico') {
        await gerarOrganogramaPDF({
          unidades,
          contarServidores,
          getLotacoesByUnidade,
          titulo: 'ORGANOGRAMA INSTITUCIONAL',
          config,
        });
      } else {
        await gerarOrganogramaListaPDF({
          unidades,
          contarServidores,
          getLotacoesByUnidade,
          titulo: 'ESTRUTURA ORGANIZACIONAL',
          config,
        });
      }
      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar relatório');
    } finally {
      setIsExporting(false);
    }
  };

  // Imprimir
  const handleImprimir = () => {
    window.print();
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 px-4">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-[600px] w-full" />
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto py-8 px-4">
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">Erro ao carregar organograma: {error}</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/governanca" className="hover:text-primary flex items-center gap-1">
            <ArrowLeft className="h-4 w-4" />
            Governança
          </Link>
          <span>/</span>
          <span className="text-foreground">Organograma</span>
        </div>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Network className="h-8 w-8 text-primary" />
              Organograma Institucional
            </h1>
            <p className="text-muted-foreground mt-1">
              Estrutura organizacional do IDJUV - Instituto de Desporto, Juventude e Lazer
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setExportDialogOpen(true)}
              disabled={isExporting}
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Exportar PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleImprimir}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <AdminOnly>
              <Button 
                variant={editMode ? "secondary" : "outline"} 
                size="sm"
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? (
                  <>
                    <Link2Off className="h-4 w-4 mr-2" />
                    Sair Edição
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4 mr-2" />
                    Editar Ligações
                  </>
                )}
              </Button>
              <Button variant="default" size="sm" asChild>
                <Link to="/organograma/gestao">
                  <Settings className="h-4 w-4 mr-2" />
                  Gerenciar
                </Link>
              </Button>
            </AdminOnly>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalUnidades}</p>
                  <p className="text-sm text-muted-foreground">Unidades</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <Users className="h-5 w-5 text-secondary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalServidores}</p>
                  <p className="text-sm text-muted-foreground">Servidores</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{unidadesPorTipo['diretoria'] || 0}</p>
                  <p className="text-sm text-muted-foreground">Diretorias</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-highlight/10 rounded-lg">
                  <Building2 className="h-5 w-5 text-highlight" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {(unidadesPorTipo['departamento'] || 0) + (unidadesPorTipo['setor'] || 0)}
                  </p>
                  <p className="text-sm text-muted-foreground">Dep./Setores</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="visual" className="space-y-6">
          <TabsList>
            <TabsTrigger value="visual">Visualização Gráfica</TabsTrigger>
            <TabsTrigger value="lista">Lista de Unidades</TabsTrigger>
          </TabsList>

          <TabsContent value="visual">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  Estrutura Hierárquica
                  {editMode && (
                    <span className="text-sm font-normal text-primary bg-primary/10 px-2 py-1 rounded">
                      Modo Edição Ativo
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  {editMode 
                    ? 'Arraste do ponto inferior de uma unidade para o ponto superior de outra para alterar a hierarquia. Clique em uma linha para removê-la.'
                    : 'Clique nas unidades para ver detalhes. Use o scroll para navegar e os controles para zoom.'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="flex">
                  <div className={selectedUnidade ? 'flex-1' : 'w-full'}>
                    <OrganogramaCanvas
                      unidades={unidades}
                      contarServidores={contarServidores}
                      onSelectUnidade={editMode ? () => {} : setSelectedUnidade}
                      selectedUnidade={editMode ? null : selectedUnidade}
                      editMode={editMode}
                      onEditModeChange={setEditMode}
                      onUpdateHierarchy={atualizarHierarquia}
                      onVerifyCycle={verificarCiclo}
                    />
                  </div>
                  {selectedUnidade && (
                    <UnidadeDetailPanel
                      unidade={selectedUnidade}
                      lotacoes={getLotacoesByUnidade(selectedUnidade.id)}
                      onClose={() => setSelectedUnidade(null)}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="lista">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lista de Unidades Organizacionais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {unidades.map((unidade) => (
                    <div
                      key={unidade.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedUnidade(unidade)}
                    >
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-1 h-12 rounded-full"
                          style={{ 
                            backgroundColor: unidade.tipo === 'presidencia' 
                              ? 'hsl(var(--primary))' 
                              : unidade.tipo === 'diretoria'
                              ? 'hsl(var(--secondary))'
                              : 'hsl(var(--accent))'
                          }}
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            {unidade.sigla && (
                              <span className="text-xs font-mono text-muted-foreground">
                                {unidade.sigla}
                              </span>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {LABELS_UNIDADE[unidade.tipo]}
                            </Badge>
                          </div>
                          <p className="font-medium">{unidade.nome}</p>
                          {unidade.servidor_responsavel && (
                            <p className="text-sm text-muted-foreground">
                              Responsável: {unidade.servidor_responsavel.full_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {contarServidores(unidade.id, false)} servidores
                        </p>
                        <p className="text-xs text-muted-foreground">Nível {unidade.nivel}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Rodapé com referência legal */}
        <Card className="mt-8 bg-muted/30 border-dashed">
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">Base Legal</p>
                <p>
                  Estrutura definida conforme <strong>Projeto de Lei nº 290/25</strong> de 22 de dezembro de 2025
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs">
                  Dispõe sobre a criação do Instituto de Desporto, Juventude e Lazer do Estado de Roraima – IDJuv
                </p>
                <p className="text-xs mt-1">
                  Governador: Antonio Denarium
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dialog de Exportação */}
        <ExportOrganogramaDialog
          open={exportDialogOpen}
          onOpenChange={setExportDialogOpen}
          onExport={handleExport}
          isExporting={isExporting}
        />
      </div>
    </MainLayout>
  );
}
