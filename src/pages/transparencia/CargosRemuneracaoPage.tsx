import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Search, 
  Download, 
  Users, 
  Building2, 
  DollarSign, 
  ChevronLeft, 
  ChevronRight,
  ArrowUpDown,
  FileText,
  Calendar
} from "lucide-react";

type Cargo = {
  id: number;
  codigo: string;
  cargo: string;
  valor_unitario: number;
  valor_unitario_formatado: string;
  diretoria: string;
  unidade_setor: string;
  vinculo: string;
  nome_ocupante: string;
  indicacao: string;
  local_trabalho: string;
  observacoes: string;
};

type CargosData = {
  ultima_atualizacao: string;
  fonte: string;
  total_cargos: number;
  cargos: Cargo[];
};

const ITEMS_PER_PAGE = 15;

export default function CargosRemuneracaoPage() {
  const [data, setData] = useState<CargosData | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDiretoria, setFilterDiretoria] = useState<string>("all");
  const [filterCodigo, setFilterCodigo] = useState<string>("all");
  const [filterVinculo, setFilterVinculo] = useState<string>("all");
  const [sortField, setSortField] = useState<keyof Cargo>("id");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetch("/data/cargos.json")
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar dados:", err);
        setLoading(false);
      });
  }, []);

  const diretorias = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.cargos.map((c) => c.diretoria))].sort();
  }, [data]);

  const codigos = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.cargos.map((c) => c.codigo))].sort();
  }, [data]);

  const vinculos = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.cargos.map((c) => c.vinculo))].sort();
  }, [data]);

  const filteredCargos = useMemo(() => {
    if (!data) return [];
    
    let result = data.cargos.filter((cargo) => {
      const matchesSearch =
        cargo.cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cargo.unidade_setor.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cargo.nome_ocupante.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cargo.codigo.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDiretoria = filterDiretoria === "all" || cargo.diretoria === filterDiretoria;
      const matchesCodigo = filterCodigo === "all" || cargo.codigo === filterCodigo;
      const matchesVinculo = filterVinculo === "all" || cargo.vinculo === filterVinculo;
      
      return matchesSearch && matchesDiretoria && matchesCodigo && matchesVinculo;
    });

    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      
      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [data, searchTerm, filterDiretoria, filterCodigo, filterVinculo, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredCargos.length / ITEMS_PER_PAGE);
  const paginatedCargos = filteredCargos.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (field: keyof Cargo) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleExportCSV = () => {
    window.open("/data/cargos.csv", "_blank");
  };

  const stats = useMemo(() => {
    if (!data) return { total: 0, ocupados: 0, vagos: 0, valorTotal: 0 };
    
    const ocupados = data.cargos.filter((c) => c.nome_ocupante).length;
    const valorTotal = data.cargos.reduce((sum, c) => sum + c.valor_unitario, 0);
    
    return {
      total: data.total_cargos,
      ocupados,
      vagos: data.total_cargos - ocupados,
      valorTotal,
    };
  }, [data]);

  const getDiretoriaColor = (diretoria: string) => {
    switch (diretoria) {
      case "Presidência":
        return "bg-primary/10 text-primary border-primary/30";
      case "DIRAF":
        return "bg-info/10 text-info border-info/30";
      case "DIESP":
        return "bg-success/10 text-success border-success/30";
      case "DIJUV":
        return "bg-warning/10 text-warning border-warning/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-12 px-4">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
      <section className="bg-info text-info-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 text-sm mb-4 opacity-80">
            <Link to="/" className="hover:underline">Início</Link>
            <span>/</span>
            <Link to="/transparencia" className="hover:underline">Transparência</Link>
            <span>/</span>
            <span>Cargos e Remuneração</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center">
              <Users className="w-8 h-8 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-3xl lg:text-4xl font-bold">Cargos e Remuneração</h1>
              <p className="opacity-90 mt-1">
                Quadro de cargos comissionados do IDJuv
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Conteúdo */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {/* Cards de Resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Total de Cargos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">{stats.total}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Ocupados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-success">{stats.ocupados}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Vagos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-warning">{stats.vagos}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Valor Total Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-info">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(stats.valorTotal)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por cargo, unidade, nome..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
                
                <Select value={filterDiretoria} onValueChange={(v) => { setFilterDiretoria(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-full lg:w-48">
                    <SelectValue placeholder="Diretoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Diretorias</SelectItem>
                    {diretorias.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filterCodigo} onValueChange={(v) => { setFilterCodigo(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-full lg:w-40">
                    <SelectValue placeholder="Código" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Códigos</SelectItem>
                    {codigos.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterVinculo} onValueChange={(v) => { setFilterVinculo(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-full lg:w-40">
                    <SelectValue placeholder="Vínculo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Vínculos</SelectItem>
                    {vinculos.map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button variant="outline" onClick={handleExportCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabela */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("codigo")}
                      >
                        <span className="flex items-center gap-1">
                          Código
                          <ArrowUpDown className="w-3 h-3" />
                        </span>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("cargo")}
                      >
                        <span className="flex items-center gap-1">
                          Cargo
                          <ArrowUpDown className="w-3 h-3" />
                        </span>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("valor_unitario")}
                      >
                        <span className="flex items-center gap-1">
                          Valor (R$)
                          <ArrowUpDown className="w-3 h-3" />
                        </span>
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => handleSort("diretoria")}
                      >
                        <span className="flex items-center gap-1">
                          Diretoria
                          <ArrowUpDown className="w-3 h-3" />
                        </span>
                      </TableHead>
                      <TableHead>Unidade/Setor</TableHead>
                      <TableHead>Vínculo</TableHead>
                      <TableHead>Ocupante</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCargos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Nenhum cargo encontrado com os filtros aplicados
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedCargos.map((cargo) => (
                        <TableRow key={cargo.id}>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">
                              {cargo.codigo}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{cargo.cargo}</TableCell>
                          <TableCell className="font-mono text-right">
                            {cargo.valor_unitario_formatado}
                          </TableCell>
                          <TableCell>
                            <Badge className={getDiretoriaColor(cargo.diretoria)}>
                              {cargo.diretoria}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate" title={cargo.unidade_setor}>
                            {cargo.unidade_setor}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {cargo.vinculo}
                          </TableCell>
                          <TableCell>
                            {cargo.nome_ocupante ? (
                              <span className="text-foreground">{cargo.nome_ocupante}</span>
                            ) : (
                              <span className="text-muted-foreground italic">Vago</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Exibindo {((currentPage - 1) * ITEMS_PER_PAGE) + 1} a{" "}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredCargos.length)} de{" "}
                {filteredCargos.length} cargos
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Informações */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Última atualização: {data?.ultima_atualizacao ? new Date(data.ultima_atualizacao).toLocaleDateString("pt-BR") : "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>Fonte: {data?.fonte}</span>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
