/**
 * ALMOXARIFADO - CONTROLE DE ESTOQUE
 * Gestão de materiais de consumo
 */

import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { 
  Boxes, Plus, Search, AlertTriangle, Edit, Eye,
  Package, TrendingDown, TrendingUp, Filter
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useItensMaterial, useAlmoxarifados, useEstatisticasAlmoxarifado } from "@/hooks/useAlmoxarifado";
import { NovoItemMaterialDialog } from "@/components/inventario/NovoItemMaterialDialog";

export default function AlmoxarifadoEstoquePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [busca, setBusca] = useState("");
  const [filtroEstoque, setFiltroEstoque] = useState<string>("");
  const [dialogNovoItemOpen, setDialogNovoItemOpen] = useState(false);

  // Verifica se tem ação no URL
  useEffect(() => {
    if (searchParams.get("acao") === "novo") {
      setDialogNovoItemOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: itens, isLoading } = useItensMaterial({
    abaixoEstoqueMinimo: filtroEstoque === 'baixo',
  });

  const { data: almoxarifados } = useAlmoxarifados();
  const { data: estatisticas } = useEstatisticasAlmoxarifado();

  const itensFiltrados = itens?.filter(item => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      item.descricao?.toLowerCase().includes(termo) ||
      item.codigo_sku?.toLowerCase().includes(termo)
    );
  });

  const getEstoqueBadge = (item: any) => {
    if (!item.estoque_minimo) return null;
    
    if (item.ponto_reposicao <= 0) {
      return <Badge variant="destructive">Sem Estoque</Badge>;
    }
    if (item.ponto_reposicao < item.estoque_minimo) {
      return <Badge variant="outline" className="bg-warning text-white border-0">Baixo</Badge>;
    }
    return null;
  };

  const formatCurrency = (value: number | null) => 
    value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) : '-';

  return (
    <AdminLayout>
      {/* Header */}
      <section className="bg-secondary text-secondary-foreground py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm mb-3 opacity-80">
            <Link to="/inventario" className="hover:underline">Inventário</Link>
            <span>/</span>
            <span>Almoxarifado</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Boxes className="w-8 h-8" />
              <div>
                <h1 className="font-serif text-2xl font-bold">Almoxarifado</h1>
                <p className="opacity-90 text-sm">Controle de estoque e materiais de consumo</p>
              </div>
            </div>
            <Button onClick={() => setDialogNovoItemOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Item
            </Button>
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="py-4 -mt-2">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Total de Itens
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estatisticas?.totalItens || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Valor em Estoque
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{formatCurrency(estatisticas?.valorTotal || 0)}</div>
              </CardContent>
            </Card>
            <Card className={estatisticas?.abaixoMinimo ? 'border-warning' : ''}>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Abaixo do Mínimo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">{estatisticas?.abaixoMinimo || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  Requisições Pendentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{estatisticas?.requisicoesPendentes || 0}</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Filtros */}
      <section className="py-4 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por descrição ou SKU..."
                  className="pl-10"
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                />
              </div>
            </div>
            <Select value={filtroEstoque || "all"} onValueChange={v => setFiltroEstoque(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Estoque" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="baixo">Abaixo do Mínimo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Lista */}
      <section className="py-6">
        <div className="container mx-auto px-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Estoque Mín.</TableHead>
                    <TableHead className="text-right">Estoque Máx.</TableHead>
                    <TableHead className="text-right">Valor Médio</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : itensFiltrados?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhum item encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    itensFiltrados?.map(item => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">
                          {item.codigo_sku || '-'}
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{item.descricao}</span>
                        </TableCell>
                        <TableCell>
                          {(item as any).categoria?.nome || '-'}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {item.estoque_minimo || '-'}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {item.estoque_maximo || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.valor_unitario_medio)}
                        </TableCell>
                        <TableCell>
                          {getEstoqueBadge(item)}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" asChild>
                              <Link to={`/inventario/almoxarifado/${item.id}`}>
                                <Eye className="w-4 h-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" asChild>
                              <Link to={`/inventario/almoxarifado/${item.id}/editar`}>
                                <Edit className="w-4 h-4" />
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </section>

      <NovoItemMaterialDialog 
        open={dialogNovoItemOpen} 
        onOpenChange={setDialogNovoItemOpen} 
      />
    </AdminLayout>
  );
}
