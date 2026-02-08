/**
 * BAIXAS DE PATRIMÔNIO
 * Desfazimento e baixa de bens patrimoniais
 */

import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { 
  FileX, Plus, Search, Eye, Check, X,
  Package, Calendar, User, AlertTriangle
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBaixasPatrimonio } from "@/hooks/usePatrimonio";
import { NovaBaixaDialog } from "@/components/inventario/NovaBaixaDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_BAIXA = [
  { value: 'solicitada', label: 'Solicitada', color: 'bg-warning' },
  { value: 'em_analise', label: 'Em Análise', color: 'bg-info' },
  { value: 'aprovada', label: 'Aprovada', color: 'bg-success' },
  { value: 'rejeitada', label: 'Rejeitada', color: 'bg-destructive' },
  { value: 'efetivada', label: 'Efetivada', color: 'bg-muted' },
];

const MOTIVOS_BAIXA = [
  { value: 'inservivel', label: 'Inservível' },
  { value: 'obsoleto', label: 'Obsoleto' },
  { value: 'doacao', label: 'Doação' },
  { value: 'alienacao', label: 'Alienação' },
  { value: 'perda', label: 'Perda/Extravio' },
  { value: 'sinistro', label: 'Sinistro' },
];

export default function BaixasPatrimonioPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("");
  const [dialogNovaBaixaOpen, setDialogNovaBaixaOpen] = useState(false);

  // Verifica se tem ação no URL
  useEffect(() => {
    if (searchParams.get("acao") === "nova") {
      setDialogNovaBaixaOpen(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const { data: baixas, isLoading } = useBaixasPatrimonio(
    filtroStatus || undefined
  );

  const baixasFiltradas = baixas?.filter(baixa => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      (baixa as any).bem?.descricao?.toLowerCase().includes(termo) ||
      (baixa as any).bem?.numero_patrimonio?.toLowerCase().includes(termo)
    );
  });

  const getStatusBadge = (status: string | null) => {
    const st = STATUS_BAIXA.find(s => s.value === status);
    return st ? (
      <Badge variant="outline" className={`${st.color} text-white border-0`}>
        {st.label}
      </Badge>
    ) : (
      <Badge variant="secondary">-</Badge>
    );
  };

  const getMotivoLabel = (motivo: string | null) => {
    const m = MOTIVOS_BAIXA.find(m => m.value === motivo);
    return m?.label || motivo;
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
            <span>Baixas</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileX className="w-8 h-8" />
              <div>
                <h1 className="font-serif text-2xl font-bold">Baixas de Patrimônio</h1>
                <p className="opacity-90 text-sm">Desfazimento e baixa de bens</p>
              </div>
            </div>
            <Button onClick={() => setDialogNovaBaixaOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Baixa
            </Button>
          </div>
        </div>
      </section>

      {/* Alerta */}
      <section className="py-4">
        <div className="container mx-auto px-4">
          <Card className="border-warning/50 bg-warning/5">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                <div>
                  <p className="font-medium">Atenção</p>
                  <p className="text-sm text-muted-foreground">
                    A baixa de bens patrimoniais é um processo irreversível. Certifique-se de que todos os 
                    documentos necessários (laudo técnico, autorização) estejam anexados antes de efetivar.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
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
            <Select value={filtroStatus || "all"} onValueChange={v => setFiltroStatus(v === "all" ? "" : v)}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {STATUS_BAIXA.map(s => (
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
                    <TableHead>Data Solicitação</TableHead>
                    <TableHead>Bem</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead>Valor Residual</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : baixasFiltradas?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Nenhuma baixa encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    baixasFiltradas?.map(baixa => (
                      <TableRow key={baixa.id}>
                        <TableCell className="whitespace-nowrap">
                          {baixa.data_solicitacao 
                            ? format(new Date(baixa.data_solicitacao), 'dd/MM/yyyy', { locale: ptBR })
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <span className="font-mono text-xs">{(baixa as any).bem?.numero_patrimonio}</span>
                              <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                                {(baixa as any).bem?.descricao}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {getMotivoLabel(baixa.motivo)}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(baixa.valor_residual)}</TableCell>
                        <TableCell>{getStatusBadge(baixa.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" asChild>
                              <Link to={`/inventario/baixas/${baixa.id}`}>
                                <Eye className="w-4 h-4" />
                              </Link>
                            </Button>
                            {baixa.status === 'solicitada' && (
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

      <NovaBaixaDialog
        open={dialogNovaBaixaOpen}
        onOpenChange={setDialogNovaBaixaOpen}
      />
    </AdminLayout>
  );
}
