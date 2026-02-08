/**
 * REQUISIÇÕES DE MATERIAL
 * Solicitação e atendimento de materiais de consumo
 */

import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { 
  ClipboardList, Plus, Search, Eye, Check, X,
  User, Building2, Calendar, Package
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useRequisicoesMaterial } from "@/hooks/useAlmoxarifado";
import { NovaRequisicaoDialog } from "@/components/inventario/NovaRequisicaoDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_REQUISICAO = [
  { value: 'pendente', label: 'Pendente', color: 'bg-warning' },
  { value: 'em_analise', label: 'Em Análise', color: 'bg-info' },
  { value: 'atendida', label: 'Atendida', color: 'bg-success' },
  { value: 'atendida_parcial', label: 'Atendida Parcialmente', color: 'bg-primary' },
  { value: 'rejeitada', label: 'Rejeitada', color: 'bg-destructive' },
  { value: 'cancelada', label: 'Cancelada', color: 'bg-muted' },
];

export default function RequisicoesMaterialPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("");
  const [dialogNovaRequisicaoOpen, setDialogNovaRequisicaoOpen] = useState(false);

  // Verifica se tem ação no URL
  useEffect(() => {
    if (searchParams.get("acao") === "nova") {
      setDialogNovaRequisicaoOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: requisicoes, isLoading } = useRequisicoesMaterial({
    status: filtroStatus || undefined,
  });

  const requisicoesFiltradas = requisicoes?.filter(req => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      req.numero?.toLowerCase().includes(termo) ||
      (req as any).solicitante?.nome_completo?.toLowerCase().includes(termo)
    );
  });

  const getStatusBadge = (status: string | null) => {
    const st = STATUS_REQUISICAO.find(s => s.value === status);
    return st ? (
      <Badge variant="outline" className={`${st.color} text-white border-0`}>
        {st.label}
      </Badge>
    ) : (
      <Badge variant="secondary">-</Badge>
    );
  };

  return (
    <AdminLayout>
      {/* Header */}
      <section className="bg-secondary text-secondary-foreground py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm mb-3 opacity-80">
            <Link to="/inventario" className="hover:underline">Inventário</Link>
            <span>/</span>
            <span>Requisições</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ClipboardList className="w-8 h-8" />
              <div>
                <h1 className="font-serif text-2xl font-bold">Requisições de Material</h1>
                <p className="opacity-90 text-sm">Solicitação e atendimento de materiais</p>
              </div>
            </div>
            <Button onClick={() => setDialogNovaRequisicaoOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Requisição
            </Button>
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
                  placeholder="Buscar por número ou solicitante..."
                  className="pl-10"
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                />
              </div>
            </div>
            <Select value={filtroStatus || "all"} onValueChange={v => setFiltroStatus(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {STATUS_REQUISICAO.map(s => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
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
                    <TableHead>Nº Requisição</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Solicitante</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : requisicoesFiltradas?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhuma requisição encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    requisicoesFiltradas?.map(req => (
                      <TableRow key={req.id}>
                        <TableCell className="font-mono text-sm font-medium">
                          {req.numero || '-'}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            {req.created_at 
                              ? format(new Date(req.created_at), 'dd/MM/yyyy', { locale: ptBR })
                              : '-'
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-muted-foreground" />
                            {(req as any).solicitante?.nome_completo?.split(' ').slice(0, 2).join(' ') || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-muted-foreground" />
                            {(req as any).setor?.sigla || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Package className="w-3 h-3 text-muted-foreground" />
                            {(req as any).itens?.length || 0} item(s)
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(req.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" asChild>
                              <Link to={`/inventario/requisicoes/${req.id}`}>
                                <Eye className="w-4 h-4" />
                              </Link>
                            </Button>
                            {req.status === 'pendente' && (
                              <>
                                <Button variant="ghost" size="icon" className="text-success">
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive">
                                  <X className="w-4 h-4" />
                                </Button>
                              </>
                            )}
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

      <NovaRequisicaoDialog 
        open={dialogNovaRequisicaoOpen} 
        onOpenChange={setDialogNovaRequisicaoOpen} 
      />
    </AdminLayout>
  );
}
