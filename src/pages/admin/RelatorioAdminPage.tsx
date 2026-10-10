import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ModuleLayout } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable, KpiCard, PageHeader, type ColunaTabela } from "@/components/design-system";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileDown, Search, FileText, Phone, Star, Users } from "lucide-react";
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
  const { data: servidores = [], isLoading, isError, refetch } = useQuery({
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

  const colunas: ColunaTabela<ServidorRelatorio>[] = [
    {
      id: "nome",
      cabecalho: "Nome",
      celula: (servidor) => <span className="font-medium">{servidor.nome_completo}</span>,
      ordenarPor: (servidor) => servidor.nome_completo,
      mobile: "titulo",
    },
    {
      id: "telefone",
      cabecalho: "Telefone",
      celula: (servidor) =>
        servidor.telefone_celular || servidor.telefone_fixo ? (
          <div className="flex items-center gap-1.5 text-sm">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
            {formatTelefone(servidor.telefone_celular || servidor.telefone_fixo)}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        ),
    },
    {
      id: "portaria",
      cabecalho: "Portaria",
      celula: (servidor) =>
        servidor.portarias.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {servidor.portarias.slice(0, 2).map((p, idx) => (
              <Badge key={idx} variant="secondary" className="text-caption">
                {p.numero}
              </Badge>
            ))}
            {servidor.portarias.length > 2 && (
              <Badge
                variant="outline"
                className="text-caption"
                aria-label={`Mais ${servidor.portarias.length - 2} portarias`}
              >
                +{servidor.portarias.length - 2}
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">Sem portaria</span>
        ),
      ordenarPor: (servidor) => servidor.portarias.length,
    },
    {
      id: "indicacao",
      cabecalho: "Indicação",
      celula: (servidor) =>
        servidor.indicacao ? (
          <div className="flex items-start gap-2">
            <Star className="h-4 w-4 text-warning mt-0.5 shrink-0" aria-hidden="true" />
            <span className="text-sm line-clamp-2">{servidor.indicacao}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-sm">-</span>
        ),
      ordenarPor: (servidor) => servidor.indicacao,
    },
  ];

  const indicadores = [
    { rotulo: "Total de servidores", valor: servidores.length, icone: Users },
    { rotulo: "Com indicação", valor: totalComIndicacao, icone: Star },
    { rotulo: "Com portaria", valor: totalComPortaria, icone: FileText },
  ];

  return (
    <ProtectedRoute requiredModule="admin">
      <ModuleLayout module="admin">
        <div className="space-y-6">
          <PageHeader
            migalhas={[{ rotulo: "Administração", href: "/admin" }, { rotulo: "Relatório administrativo" }]}
            titulo="Relatório administrativo"
            descricao="Visualização restrita com dados de indicação e portarias"
            acoes={
              <Button onClick={exportarExcel} className="gap-2">
                <FileDown className="h-4 w-4" aria-hidden="true" />
                Exportar Excel
              </Button>
            }
          />

          {/* Cards de Estatísticas */}
          <section aria-labelledby="relatorio-admin-indicadores">
            <h2 id="relatorio-admin-indicadores" className="sr-only">Indicadores</h2>
            <ul className="grid gap-4 md:grid-cols-3">
              {indicadores.map((ind) => (
                <li key={ind.rotulo}>
                  <KpiCard
                    rotulo={ind.rotulo}
                    valor={ind.valor}
                    icone={ind.icone}
                    carregando={isLoading}
                    className="h-full"
                  />
                </li>
              ))}
            </ul>
          </section>

          {/* Tabela */}
          <DataTable
            rotulo="Servidores ativos com indicação e portarias"
            dados={servidoresFiltrados}
            colunas={colunas}
            chaveLinha={(servidor) => servidor.id}
            carregando={isLoading}
            erro={isError ? "Não foi possível carregar os servidores." : null}
            aoTentarNovamente={() => refetch()}
            filtros={
              <>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <Input
                    aria-label="Buscar servidores"
                    placeholder="Buscar por nome, telefone ou indicação..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filtroIndicacao} onValueChange={setFiltroIndicacao}>
                  <SelectTrigger className="w-full sm:w-[180px]" aria-label="Filtrar indicação">
                    <SelectValue placeholder="Filtrar indicação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="com">Com indicação</SelectItem>
                    <SelectItem value="sem">Sem indicação</SelectItem>
                  </SelectContent>
                </Select>
              </>
            }
            vazio={{ icone: Users, titulo: "Nenhum servidor encontrado", descricao: "Ajuste a busca ou o filtro." }}
          />

          {/* Rodapé com contagem */}
          <p className="text-sm text-muted-foreground text-right" aria-live="polite">
            Exibindo {servidoresFiltrados.length} de {servidores.length} servidores
          </p>
        </div>
      </ModuleLayout>
    </ProtectedRoute>
  );
}
