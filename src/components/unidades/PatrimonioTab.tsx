import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Package, Loader2, Eye, Search, ExternalLink } from "lucide-react";

interface PatrimonioTabProps {
  unidadeId: string;
}

interface BemPatrimonial {
  id: string;
  numero_patrimonio: string;
  descricao: string;
  categoria_bem: string | null;
  marca: string | null;
  modelo: string | null;
  estado_conservacao: string | null;
  situacao: string | null;
  valor_aquisicao: number | null;
  data_aquisicao: string | null;
  responsavel?: { id: string; nome_completo: string } | null;
}

const ESTADO_COLORS: Record<string, string> = {
  otimo: "bg-success text-success-foreground",
  bom: "bg-info text-info-foreground",
  regular: "bg-warning text-warning-foreground",
  ruim: "bg-destructive/80 text-destructive-foreground",
  inservivel: "bg-destructive text-destructive-foreground",
};

const SITUACAO_COLORS: Record<string, string> = {
  ativo: "bg-success/20 text-success border-success/40",
  em_uso: "bg-success/20 text-success border-success/40",
  em_manutencao: "bg-warning/20 text-warning border-warning/40",
  cedido: "bg-info/20 text-info border-info/40",
  baixado: "bg-destructive/20 text-destructive border-destructive/40",
  inservivel: "bg-muted text-muted-foreground",
};

const CATEGORIA_LABELS: Record<string, string> = {
  mobiliario: "Mobiliário",
  informatica: "Equipamentos de TI",
  equipamento_esportivo: "Equip. Esportivo",
  veiculo: "Veículo",
  eletrodomestico: "Eletrodoméstico",
  outros: "Outros",
};

export function PatrimonioTab({ unidadeId }: PatrimonioTabProps) {
  const [bens, setBens] = useState<BemPatrimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({ total: 0, valorTotal: 0 });

  useEffect(() => {
    loadBens();
  }, [unidadeId]);

  async function loadBens() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("bens_patrimoniais")
        .select(`
          id,
          numero_patrimonio,
          descricao,
          categoria_bem,
          marca,
          modelo,
          estado_conservacao,
          situacao,
          valor_aquisicao,
          data_aquisicao,
          responsavel:servidores!bens_patrimoniais_responsavel_id_fkey(id, nome_completo)
        `)
        .eq("unidade_local_id", unidadeId)
        .neq("situacao", "baixado")
        .order("numero_patrimonio");

      if (error) throw error;

      setBens((data || []) as BemPatrimonial[]);

      // Calcular estatísticas
      const total = data?.length || 0;
      const valorTotal = data?.reduce((sum, b) => sum + (b.valor_aquisicao || 0), 0) || 0;
      setStats({ total, valorTotal });
    } catch (error) {
      console.error("Erro ao carregar bens:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredBens = bens.filter((b) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      b.numero_patrimonio?.toLowerCase().includes(term) ||
      b.descricao?.toLowerCase().includes(term) ||
      b.marca?.toLowerCase().includes(term) ||
      b.modelo?.toLowerCase().includes(term)
    );
  });

  const formatCurrency = (value: number | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header com estatísticas */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5" />
            Bens Patrimoniais da Unidade
          </h3>
          <p className="text-sm text-muted-foreground">
            {stats.total} {stats.total === 1 ? "bem" : "bens"} • Valor total:{" "}
            {formatCurrency(stats.valorTotal)}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to={`/inventario/bens?unidade_local_id=${unidadeId}`}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Ver no Inventário
          </Link>
        </Button>
      </div>

      {/* Cards de resumo */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Bens</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Valor Total</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatCurrency(stats.valorTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ativos</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-success">
              {bens.filter((b) => b.situacao === "ativo" || b.situacao === "em_uso").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Em Manutenção</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-warning">
              {bens.filter((b) => b.situacao === "em_manutencao").length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar por patrimônio, descrição..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredBens.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm
                ? "Nenhum bem encontrado com este termo"
                : "Nenhum bem patrimonial vinculado a esta unidade"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patrimônio</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBens.map((bem) => (
                  <TableRow key={bem.id}>
                    <TableCell className="font-mono font-medium">
                      {bem.numero_patrimonio}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium truncate max-w-[200px]">{bem.descricao}</p>
                        {(bem.marca || bem.modelo) && (
                          <p className="text-xs text-muted-foreground">
                            {[bem.marca, bem.modelo].filter(Boolean).join(" - ")}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {bem.categoria_bem
                        ? CATEGORIA_LABELS[bem.categoria_bem] || bem.categoria_bem
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {bem.estado_conservacao ? (
                        <Badge
                          className={
                            ESTADO_COLORS[bem.estado_conservacao] || "bg-muted"
                          }
                        >
                          {bem.estado_conservacao.charAt(0).toUpperCase() +
                            bem.estado_conservacao.slice(1)}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      {bem.situacao ? (
                        <Badge
                          variant="outline"
                          className={SITUACAO_COLORS[bem.situacao] || ""}
                        >
                          {bem.situacao.replace("_", " ").toUpperCase()}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(bem.valor_aquisicao)}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link to={`/inventario/bens/${bem.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
