import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Package, 
  Search, 
  Download,
  MapPin,
  Building2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function PatrimonioPublicoPage() {
  const [filtroSituacao, setFiltroSituacao] = useState<string>("todos");
  const [busca, setBusca] = useState("");

  // LGPD-Safe: Busca SEM dados de responsável pessoal
  const { data: bens, isLoading } = useQuery({
    queryKey: ['transparencia-patrimonio'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bens_patrimoniais')
        .select(`
          id,
          numero_patrimonio,
          descricao,
          marca,
          modelo,
          situacao,
          estado_conservacao,
          valor_aquisicao,
          data_aquisicao,
          unidades_locais!bens_patrimoniais_unidade_local_id_fkey(nome, municipio),
          estrutura_organizacional!bens_patrimoniais_unidade_id_fkey(nome)
        `)
        .order('numero_patrimonio', { ascending: true });
      
      if (error) throw error;
      
      // LGPD-Safe: SEM responsavel_id, responsavel_nome, responsavel_matricula
      return (data || []).map((item: any) => ({
        id: item.id,
        numero_patrimonio: item.numero_patrimonio,
        descricao: item.descricao,
        marca: item.marca,
        modelo: item.modelo,
        situacao: item.situacao,
        estado_conservacao: item.estado_conservacao,
        valor_aquisicao: item.valor_aquisicao,
        data_aquisicao: item.data_aquisicao,
        // Apenas dados institucionais
        localizacao: item.unidades_locais?.nome,
        municipio: item.unidades_locais?.municipio,
        unidade_administrativa: item.estrutura_organizacional?.nome
      }));
    }
  });

  const bensFiltrados = (bens || []).filter(bem => {
    const matchBusca = busca === "" || 
      bem.descricao?.toLowerCase().includes(busca.toLowerCase()) ||
      bem.numero_patrimonio?.toLowerCase().includes(busca.toLowerCase());
    
    const matchSituacao = filtroSituacao === "todos" || bem.situacao === filtroSituacao;
    
    return matchBusca && matchSituacao;
  });

  const formatCurrency = (value: number | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getSituacaoBadge = (situacao: string | null) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'em_uso': 'default',
      'disponivel': 'secondary',
      'baixado': 'destructive',
      'cedido': 'outline',
      'em_manutencao': 'outline',
    };
    const labels: Record<string, string> = {
      'em_uso': 'Em Uso',
      'disponivel': 'Disponível',
      'baixado': 'Baixado',
      'cedido': 'Cedido',
      'em_manutencao': 'Em Manutenção',
    };
    if (!situacao) return <Badge variant="outline">-</Badge>;
    return (
      <Badge variant={variants[situacao] || 'outline'}>
        {labels[situacao] || situacao}
      </Badge>
    );
  };

  const getEstadoBadge = (estado: string | null) => {
    const labels: Record<string, string> = {
      'otimo': 'Ótimo',
      'bom': 'Bom',
      'regular': 'Regular',
      'ruim': 'Ruim',
      'inservivel': 'Inservível',
    };
    if (!estado) return <span className="text-muted-foreground">-</span>;
    return (
      <span className="px-2 py-0.5 rounded text-xs font-medium bg-muted">
        {labels[estado] || estado}
      </span>
    );
  };

  // Estatísticas agregadas (sem identificação pessoal)
  const totalBens = bensFiltrados.length;
  const valorTotal = bensFiltrados.reduce((acc, b) => acc + (b.valor_aquisicao || 0), 0);

  return (
    <MainLayout>
      {/* Cabeçalho */}
      <section className="bg-secondary text-secondary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 text-sm mb-4 opacity-80">
            <Link to="/" className="hover:underline">Início</Link>
            <span>/</span>
            <Link to="/transparencia" className="hover:underline">Transparência</Link>
            <span>/</span>
            <span>Patrimônio</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center">
              <Package className="w-8 h-8 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-3xl lg:text-4xl font-bold">
                Patrimônio Público
              </h1>
              <p className="opacity-90 mt-1">
                Bens patrimoniais do IDJUV
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Estatísticas agregadas */}
      <section className="py-6 bg-muted/30 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-background p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">Total de Bens</p>
              <p className="text-2xl font-bold">{totalBens}</p>
            </div>
            <div className="bg-background p-4 rounded-lg border">
              <p className="text-sm text-muted-foreground">Valor Total</p>
              <p className="text-2xl font-bold">{formatCurrency(valorTotal)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Filtros */}
      <section className="py-6 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por descrição ou número de patrimônio..."
                  className="pl-10"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <label className="text-sm font-medium mb-1 block">Situação</label>
              <Select value={filtroSituacao} onValueChange={setFiltroSituacao}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="em_uso">Em Uso</SelectItem>
                  <SelectItem value="disponivel">Disponível</SelectItem>
                  <SelectItem value="cedido">Cedido</SelectItem>
                  <SelectItem value="em_manutencao">Em Manutenção</SelectItem>
                  <SelectItem value="baixado">Baixado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Tabela */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Bens Patrimoniais</CardTitle>
                  <CardDescription>
                    {isLoading ? "Carregando..." : `${bensFiltrados.length} bem(ns) encontrado(s)`}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  Carregando dados...
                </div>
              ) : bensFiltrados.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum bem encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patrimônio</TableHead>
                        <TableHead className="max-w-xs">Descrição</TableHead>
                        <TableHead>Marca/Modelo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Aquisição</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Situação</TableHead>
                        <TableHead>Localização</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bensFiltrados.slice(0, 100).map((bem) => (
                        <TableRow key={bem.id}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {bem.numero_patrimonio}
                          </TableCell>
                          <TableCell className="max-w-xs truncate" title={bem.descricao}>
                            {bem.descricao}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {bem.marca} {bem.modelo && `/ ${bem.modelo}`}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatCurrency(bem.valor_aquisicao)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(bem.data_aquisicao)}
                          </TableCell>
                          <TableCell>
                            {getEstadoBadge(bem.estado_conservacao)}
                          </TableCell>
                          <TableCell>
                            {getSituacaoBadge(bem.situacao)}
                          </TableCell>
                          <TableCell>
                            {bem.localizacao ? (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-muted-foreground" />
                                <span className="truncate max-w-[120px]">{bem.localizacao}</span>
                              </div>
                            ) : bem.unidade_administrativa ? (
                              <div className="flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-muted-foreground" />
                                <span className="truncate max-w-[120px]">{bem.unidade_administrativa}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {bensFiltrados.length > 100 && (
                    <p className="text-center text-sm text-muted-foreground mt-4">
                      Exibindo 100 de {bensFiltrados.length} registros
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Nota LGPD */}
          <div className="mt-8 bg-muted/50 rounded-xl p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="w-5 h-5 text-secondary" />
              Nota sobre Dados
            </h3>
            <p className="text-sm text-muted-foreground">
              Em conformidade com a LGPD (Art. 6º, III - princípio da minimização), 
              esta listagem exibe apenas dados institucionais do patrimônio. 
              Dados de responsáveis são de uso interno administrativo.
            </p>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
