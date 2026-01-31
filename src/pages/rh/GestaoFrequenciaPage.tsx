import { useState } from "react";
import { AdminLayout } from "@/components/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Calendar,
  Clock,
  Users,
  FileText,
  Loader2,
  Search,
  AlertTriangle,
  CheckCircle,
  Download,
  Plus,
  Printer,
  MoreHorizontal,
  FileSpreadsheet,
} from "lucide-react";
import { useFrequenciaResumo, type FrequenciaServidorResumo } from "@/hooks/useFrequencia";
import { MESES } from "@/types/folha";
import { LancarFaltaDialog } from "@/components/frequencia/LancarFaltaDialog";
import { ImprimirFrequenciaDialog } from "@/components/frequencia/ImprimirFrequenciaDialog";
import { generateRelatorioFrequenciaGeral } from "@/lib/pdfRelatorioFrequencia";
import { format } from "date-fns";

export default function GestaoFrequenciaPage() {
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;

  const [ano, setAno] = useState(anoAtual);
  const [mes, setMes] = useState(mesAtual);
  const [busca, setBusca] = useState("");
  const [showLancarFalta, setShowLancarFalta] = useState(false);
  const [showImprimirFrequencia, setShowImprimirFrequencia] = useState(false);
  const [servidorSelecionado, setServidorSelecionado] = useState<FrequenciaServidorResumo | null>(null);

  const { data: servidores, isLoading } = useFrequenciaResumo(ano, mes);

  const competencia = `${MESES[mes - 1]}/${ano}`;

  // Filtrar servidores
  const servidoresFiltrados = servidores?.filter((s) => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      s.servidor_nome.toLowerCase().includes(termo) ||
      s.servidor_matricula?.toLowerCase().includes(termo) ||
      s.servidor_cargo?.toLowerCase().includes(termo)
    );
  });

  // Calcular totais
  const totalFaltas = servidoresFiltrados?.reduce((acc, s) => acc + s.faltas, 0) || 0;
  const mediaPresenca =
    servidoresFiltrados && servidoresFiltrados.length > 0
      ? servidoresFiltrados.reduce((acc, s) => acc + s.percentual_presenca, 0) / servidoresFiltrados.length
      : 0;

  const handleLancarFalta = (servidor: FrequenciaServidorResumo) => {
    setServidorSelecionado(servidor);
    setShowLancarFalta(true);
  };

  const handleImprimirFrequencia = (servidor: FrequenciaServidorResumo) => {
    setServidorSelecionado(servidor);
    setShowImprimirFrequencia(true);
  };

  const handleGerarRelatorio = async () => {
    if (!servidoresFiltrados) return;

    await generateRelatorioFrequenciaGeral({
      competencia,
      servidores: servidoresFiltrados,
      dataGeracao: format(new Date(), "dd/MM/yyyy"),
    });
  };

  const anos = Array.from({ length: 5 }, (_, i) => anoAtual - i);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Clock className="h-8 w-8 text-primary" />
              Gestão de Frequência
            </h1>
            <p className="text-muted-foreground mt-1">
              Controle de presença e lançamento de faltas dos servidores
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {MESES.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1)}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {anos.map((a) => (
                  <SelectItem key={a} value={String(a)}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleGerarRelatorio}>
              <Download className="mr-2 h-4 w-4" />
              Imprimir Relatório
            </Button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Servidores
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{servidoresFiltrados?.length || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Total de Faltas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">{totalFaltas}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Média de Presença
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${mediaPresenca >= 95 ? "text-success" : mediaPresenca >= 80 ? "text-warning" : "text-destructive"}`}>
                {mediaPresenca.toFixed(1)}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Competência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{competencia}</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Servidores */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle>Frequência dos Servidores</CardTitle>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou matrícula..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : servidoresFiltrados?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum servidor encontrado.</p>
              </div>
            ) : (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Servidor</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead className="text-center">Dias Úteis</TableHead>
                      <TableHead className="text-center">Trabalhados</TableHead>
                      <TableHead className="text-center">Faltas</TableHead>
                      <TableHead className="text-center">Atestados</TableHead>
                      <TableHead className="text-center">Férias/Lic.</TableHead>
                      <TableHead className="text-center">% Presença</TableHead>
                      <TableHead className="text-center">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {servidoresFiltrados?.map((s) => (
                      <TableRow key={s.servidor_id}>
                        <TableCell className="font-mono">{s.servidor_matricula || "-"}</TableCell>
                        <TableCell className="font-medium">{s.servidor_nome}</TableCell>
                        <TableCell>{s.servidor_cargo || "-"}</TableCell>
                        <TableCell className="text-center">{s.dias_uteis}</TableCell>
                        <TableCell className="text-center">{s.dias_trabalhados}</TableCell>
                        <TableCell className="text-center">
                          {s.faltas > 0 ? (
                            <Badge variant="destructive">{s.faltas}</Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">{s.atestados}</TableCell>
                        <TableCell className="text-center">{s.ferias + s.licencas}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={
                              s.percentual_presenca >= 95
                                ? "bg-success/15 text-success border-success/30"
                                : s.percentual_presenca >= 80
                                ? "bg-warning/15 text-warning border-warning/30"
                                : "bg-destructive/15 text-destructive border-destructive/30"
                            }
                          >
                            {s.percentual_presenca.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleLancarFalta(s)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Lançar Ocorrência
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleImprimirFrequencia(s)}>
                                <Printer className="mr-2 h-4 w-4" />
                                Imprimir Frequência
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de Lançamento */}
      <LancarFaltaDialog
        open={showLancarFalta}
        onOpenChange={setShowLancarFalta}
        servidor={servidorSelecionado}
        ano={ano}
        mes={mes}
      />

      {/* Dialog de Impressão */}
      <ImprimirFrequenciaDialog
        open={showImprimirFrequencia}
        onOpenChange={setShowImprimirFrequencia}
        servidor={servidorSelecionado}
        ano={ano}
        mes={mes}
      />
    </AdminLayout>
  );
}
