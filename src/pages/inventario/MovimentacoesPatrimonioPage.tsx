/**
 * MOVIMENTAÇÕES DE PATRIMÔNIO
 * Transferências, cessões e empréstimos de bens
 */

import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { 
  TrendingUp, Plus, Search, Filter, Eye, Check, X,
  ArrowRight, Building2, User, Calendar, Package
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useMovimentacoesPatrimonio } from "@/hooks/usePatrimonio";
import { NovaMovimentacaoDialog } from "@/components/inventario/NovaMovimentacaoDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const TIPOS_MOVIMENTACAO = [
  { value: 'transferencia_interna', label: 'Transferência Interna' },
  { value: 'cessao', label: 'Cessão' },
  { value: 'emprestimo', label: 'Empréstimo' },
  { value: 'recolhimento', label: 'Recolhimento' },
];

const STATUS_MOVIMENTACAO = [
  { value: 'pendente', label: 'Pendente', color: 'bg-warning' },
  { value: 'aprovada', label: 'Aprovada', color: 'bg-success' },
  { value: 'rejeitada', label: 'Rejeitada', color: 'bg-destructive' },
  { value: 'concluida', label: 'Concluída', color: 'bg-primary' },
];

export default function MovimentacoesPatrimonioPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState<string>("");
  const [filtroStatus, setFiltroStatus] = useState<string>("");
  const [dialogNovaMovimentacaoOpen, setDialogNovaMovimentacaoOpen] = useState(false);

  // Verifica se tem ação no URL
  useEffect(() => {
    if (searchParams.get("acao") === "nova") {
      setDialogNovaMovimentacaoOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: movimentacoes, isLoading } = useMovimentacoesPatrimonio();

  const movimentacoesFiltradas = movimentacoes?.filter(mov => {
    if (filtroTipo && mov.tipo !== filtroTipo) return false;
    if (filtroStatus && mov.status !== filtroStatus) return false;
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      (mov as any).bem?.descricao?.toLowerCase().includes(termo) ||
      (mov as any).bem?.numero_patrimonio?.toLowerCase().includes(termo)
    );
  });

  const getStatusBadge = (status: string | null) => {
    const st = STATUS_MOVIMENTACAO.find(s => s.value === status);
    return st ? (
      <Badge variant="outline" className={`${st.color} text-white border-0`}>
        {st.label}
      </Badge>
    ) : (
      <Badge variant="secondary">-</Badge>
    );
  };

  const getTipoLabel = (tipo: string | null) => {
    const t = TIPOS_MOVIMENTACAO.find(t => t.value === tipo);
    return t?.label || tipo;
  };

  return (
    <MainLayout>
      {/* Header */}
      <section className="bg-secondary text-secondary-foreground py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm mb-3 opacity-80">
            <Link to="/inventario" className="hover:underline">Inventário</Link>
            <span>/</span>
            <span>Movimentações</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8" />
              <div>
                <h1 className="font-serif text-2xl font-bold">Movimentações</h1>
                <p className="opacity-90 text-sm">Transferências, cessões e empréstimos</p>
              </div>
            </div>
            <Button onClick={() => setDialogNovaMovimentacaoOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Movimentação
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
                  placeholder="Buscar por bem..."
                  className="pl-10"
                  value={busca}
                  onChange={e => setBusca(e.target.value)}
                />
              </div>
            </div>
            <Select value={filtroTipo || "all"} onValueChange={v => setFiltroTipo(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {TIPOS_MOVIMENTACAO.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroStatus || "all"} onValueChange={v => setFiltroStatus(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {STATUS_MOVIMENTACAO.map(s => (
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
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Bem</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Solicitante</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : movimentacoesFiltradas?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhuma movimentação encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    movimentacoesFiltradas?.map(mov => (
                      <TableRow key={mov.id}>
                        <TableCell className="whitespace-nowrap">
                          {mov.data_movimentacao 
                            ? format(new Date(mov.data_movimentacao), 'dd/MM/yyyy', { locale: ptBR })
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getTipoLabel(mov.tipo)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <span className="font-mono text-xs">{(mov as any).bem?.numero_patrimonio}</span>
                              <p className="text-xs text-muted-foreground">{(mov as any).bem?.descricao}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Building2 className="w-3 h-3" />
                            {(mov as any).origem_unidade_local?.nome_unidade || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <ArrowRight className="w-3 h-3 text-muted-foreground" />
                            <Building2 className="w-3 h-3" />
                            {(mov as any).destino_unidade_local?.nome_unidade || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <User className="w-3 h-3" />
                            {(mov as any).solicitante?.nome_completo?.split(' ').slice(0, 2).join(' ') || '-'}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(mov.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" asChild>
                              <Link to={`/inventario/movimentacoes/${mov.id}`}>
                                <Eye className="w-4 h-4" />
                              </Link>
                            </Button>
                            {mov.status === 'pendente' && (
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

      <NovaMovimentacaoDialog
        open={dialogNovaMovimentacaoOpen}
        onOpenChange={setDialogNovaMovimentacaoOpen}
      />
    </MainLayout>
  );
}
