/**
 * MANUTENÇÕES DE BENS
 * Registro de manutenções preventivas e corretivas
 */

import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { 
  Wrench, Plus, Search, Eye, Package, Calendar, 
  User, CheckCircle2, Clock, AlertTriangle
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useManutencoesPatrimonio } from "@/hooks/usePatrimonio";
import { NovaManutencaoDialog } from "@/components/inventario/NovaManutencaoDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_MANUTENCAO = [
  { value: 'aberta', label: 'Aberta', color: 'bg-warning', icon: Clock },
  { value: 'em_andamento', label: 'Em Andamento', color: 'bg-info', icon: Wrench },
  { value: 'concluida', label: 'Concluída', color: 'bg-success', icon: CheckCircle2 },
  { value: 'cancelada', label: 'Cancelada', color: 'bg-muted', icon: AlertTriangle },
];

const TIPOS_MANUTENCAO = [
  { value: 'preventiva', label: 'Preventiva' },
  { value: 'corretiva', label: 'Corretiva' },
];

export default function ManutencoesBensPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("");
  const [filtroTipo, setFiltroTipo] = useState<string>("");
  const [dialogNovaManutencaoOpen, setDialogNovaManutencaoOpen] = useState(false);

  // Verifica se tem ação no URL
  useEffect(() => {
    if (searchParams.get("acao") === "nova") {
      setDialogNovaManutencaoOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: manutencoes, isLoading } = useManutencoesPatrimonio();

  const manutencoesFiltradas = manutencoes?.filter(man => {
    if (filtroStatus && man.status !== filtroStatus) return false;
    if (filtroTipo && man.tipo !== filtroTipo) return false;
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      (man as any).bem?.descricao?.toLowerCase().includes(termo) ||
      (man as any).bem?.numero_patrimonio?.toLowerCase().includes(termo)
    );
  });

  const getStatusBadge = (status: string | null) => {
    const st = STATUS_MANUTENCAO.find(s => s.value === status);
    if (!st) return <Badge variant="secondary">-</Badge>;
    const Icon = st.icon;
    return (
      <Badge variant="outline" className={`${st.color} text-white border-0`}>
        <Icon className="w-3 h-3 mr-1" />
        {st.label}
      </Badge>
    );
  };

  const formatCurrency = (value: number | null) => 
    value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value) : '-';

  return (
    <MainLayout>
      {/* Header */}
      <section className="bg-secondary text-secondary-foreground py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 text-sm mb-3 opacity-80">
            <Link to="/inventario" className="hover:underline">Inventário</Link>
            <span>/</span>
            <span>Manutenções</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Wrench className="w-8 h-8" />
              <div>
                <h1 className="font-serif text-2xl font-bold">Manutenções</h1>
                <p className="opacity-90 text-sm">Registro de manutenções preventivas e corretivas</p>
              </div>
            </div>
            <Button onClick={() => setDialogNovaManutencaoOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Manutenção
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
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {TIPOS_MANUTENCAO.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroStatus || "all"} onValueChange={v => setFiltroStatus(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {STATUS_MANUTENCAO.map(s => (
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
                    <TableHead>Data Abertura</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Bem</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Fornecedor</TableHead>
                    <TableHead className="text-right">Custo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : manutencoesFiltradas?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhuma manutenção encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    manutencoesFiltradas?.map(man => (
                      <TableRow key={man.id}>
                        <TableCell className="whitespace-nowrap">
                          {man.data_abertura 
                            ? format(new Date(man.data_abertura), 'dd/MM/yyyy', { locale: ptBR })
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {man.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <span className="font-mono text-xs">{(man as any).bem?.numero_patrimonio}</span>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {(man as any).bem?.descricao}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="truncate max-w-[200px]">{man.descricao_problema}</p>
                        </TableCell>
                        <TableCell>{man.fornecedor_externo || '-'}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(man.custo_final || man.custo_estimado)}
                        </TableCell>
                        <TableCell>{getStatusBadge(man.status)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/inventario/manutencoes/${man.id}`}>
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
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

      <NovaManutencaoDialog
        open={dialogNovaManutencaoOpen}
        onOpenChange={setDialogNovaManutencaoOpen}
      />
    </MainLayout>
  );
}
