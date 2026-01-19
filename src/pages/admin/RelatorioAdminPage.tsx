import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { FileDown, Search, FileText, Phone, Star, Filter } from "lucide-react";
import { utils, writeFile } from "xlsx";

interface ServidorRelatorio {
  id: string;
  nome_completo: string;
  telefone_celular: string | null;
  telefone_fixo: string | null;
  indicacao: string | null;
  portarias: {
    numero: string;
    categoria: string | null;
    status: string;
  }[];
}

export default function RelatorioAdminPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroIndicacao, setFiltroIndicacao] = useState<string>("todos");

  // Buscar servidores ativos com indicação
  const { data: servidores = [], isLoading } = useQuery({
    queryKey: ["relatorio-admin-indicacao"],
    queryFn: async () => {
      // Buscar servidores
      const { data: servidoresData, error: servidoresError } = await supabase
        .from("servidores")
        .select("id, nome_completo, telefone_celular, telefone_fixo, indicacao")
        .eq("ativo", true)
        .order("nome_completo");

      if (servidoresError) throw servidoresError;

      // Buscar portarias de todos os servidores
      const { data: portariasData, error: portariasError } = await supabase
        .from("documentos")
        .select("servidores_ids, numero, categoria, status")
        .eq("tipo", "portaria");

      if (portariasError) throw portariasError;

      // Mapear portarias para cada servidor
      const servidoresComPortarias: ServidorRelatorio[] = (servidoresData || []).map((servidor) => {
        const portariasServidor = (portariasData || [])
          .filter((p) => p.servidores_ids?.includes(servidor.id))
          .map((p) => ({
            numero: p.numero,
            categoria: p.categoria,
            status: p.status,
          }));

        return {
          ...servidor,
          portarias: portariasServidor,
        };
      });

      return servidoresComPortarias;
    },
  });

  // Filtrar servidores
  const servidoresFiltrados = servidores.filter((s) => {
    const matchSearch =
      s.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.telefone_celular?.includes(searchTerm) ||
      s.indicacao?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchIndicacao =
      filtroIndicacao === "todos" ||
      (filtroIndicacao === "com" && s.indicacao) ||
      (filtroIndicacao === "sem" && !s.indicacao);

    return matchSearch && matchIndicacao;
  });

  // Estatísticas
  const totalComIndicacao = servidores.filter((s) => s.indicacao).length;
  const totalComPortaria = servidores.filter((s) => s.portarias.length > 0).length;

  // Exportar para Excel
  const exportarExcel = () => {
    const dadosExport = servidoresFiltrados.map((s) => ({
      Nome: s.nome_completo,
      Telefone: s.telefone_celular || s.telefone_fixo || "-",
      "Possui Portaria": s.portarias.length > 0 ? "Sim" : "Não",
      Portarias: s.portarias.map((p) => p.numero).join(", ") || "-",
      Indicação: s.indicacao || "-",
    }));

    const ws = utils.json_to_sheet(dadosExport);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Relatório Admin");

    // Ajustar largura das colunas
    ws["!cols"] = [
      { wch: 40 }, // Nome
      { wch: 15 }, // Telefone
      { wch: 15 }, // Possui Portaria
      { wch: 30 }, // Portarias
      { wch: 50 }, // Indicação
    ];

    writeFile(wb, `relatorio-admin-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const formatTelefone = (telefone: string | null) => {
    if (!telefone) return null;
    const cleaned = telefone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return telefone;
  };

  const getCategoriaLabel = (categoria: string | null) => {
    const labels: Record<string, string> = {
      nomeacao: "Nomeação",
      exoneracao: "Exoneração",
      designacao: "Designação",
      dispensa_designacao: "Dispensa",
      lotacao: "Lotação",
      ferias: "Férias",
      licenca: "Licença",
      substituicao: "Substituição",
      outros: "Outros",
    };
    return labels[categoria || ""] || categoria || "-";
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Relatório Administrativo
              </h1>
              <p className="text-muted-foreground">
                Visualização restrita com dados de indicação e portarias
              </p>
            </div>
            <Button onClick={exportarExcel} className="gap-2">
              <FileDown className="h-4 w-4" />
              Exportar Excel
            </Button>
          </div>

          {/* Cards de Estatísticas */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Servidores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{servidores.length}</div>
              </CardContent>
            </Card>
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-amber-600 flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Com Indicação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {totalComIndicacao}
                </div>
              </CardContent>
            </Card>
            <Card className="border-blue-500/30 bg-blue-500/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Com Portaria
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {totalComPortaria}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, telefone ou indicação..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={filtroIndicacao} onValueChange={setFiltroIndicacao}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filtrar indicação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="com">Com Indicação</SelectItem>
                      <SelectItem value="sem">Sem Indicação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
                      <TableHead className="w-[300px]">Nome</TableHead>
                      <TableHead className="w-[150px]">Telefone</TableHead>
                      <TableHead className="w-[200px]">Portaria</TableHead>
                      <TableHead>Indicação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8">
                          Carregando...
                        </TableCell>
                      </TableRow>
                    ) : servidoresFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          Nenhum servidor encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      servidoresFiltrados.map((servidor) => (
                        <TableRow key={servidor.id}>
                          <TableCell className="font-medium">
                            {servidor.nome_completo}
                          </TableCell>
                          <TableCell>
                            {servidor.telefone_celular || servidor.telefone_fixo ? (
                              <div className="flex items-center gap-1.5 text-sm">
                                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                {formatTelefone(servidor.telefone_celular || servidor.telefone_fixo)}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {servidor.portarias.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {servidor.portarias.slice(0, 2).map((p, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {p.numero}
                                  </Badge>
                                ))}
                                {servidor.portarias.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{servidor.portarias.length - 2}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">
                                Sem portaria
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {servidor.indicacao ? (
                              <div className="flex items-start gap-2">
                                <Star className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                                <span className="text-sm line-clamp-2">
                                  {servidor.indicacao}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">-</span>
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

          {/* Rodapé com contagem */}
          <div className="text-sm text-muted-foreground text-right">
            Exibindo {servidoresFiltrados.length} de {servidores.length} servidores
          </div>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
