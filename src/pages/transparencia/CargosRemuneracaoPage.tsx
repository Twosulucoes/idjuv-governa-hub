import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, KpiCard, type ColunaTabela } from "@/components/design-system";
import { useIdentidade } from "@/core/tenant";
import { useTransparenciaCargos, type VagaCargoPublico } from "@/hooks/useTransparenciaCargos";
import { exportarParaCSV } from "@/export/exportCSV";
import {
  Download,
  Users,
  Building2,
  DollarSign,
  FileText,
  Calendar
} from "lucide-react";

// Uma linha por vaga, montada a partir da RPC pública (só campos públicos pela LAI)
type Cargo = {
  id: string;
  codigo: string;
  cargo: string;
  valor_unitario: number;
  valor_unitario_formatado: string;
  diretoria: string;
  diretoria_tipo: string | null;
  unidade_setor: string;
  vinculo: string;
  nome_ocupante: string;
};

const formatarMoeda = (valor: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

const SEM_UNIDADE = "Sem unidade definida";

function paraLinha(v: VagaCargoPublico): Cargo {
  const valor = Number(v.vencimento ?? 0);
  return {
    id: `${v.cargo_id}-${v.unidade_id ?? "sem-unidade"}-${v.vaga}`,
    codigo: v.simbolo?.trim() || "—",
    cargo: v.cargo,
    valor_unitario: valor,
    valor_unitario_formatado: v.vencimento == null ? "—" : formatarMoeda(valor),
    diretoria: v.diretoria ?? SEM_UNIDADE,
    diretoria_tipo: v.diretoria_tipo,
    unidade_setor: v.unidade ?? SEM_UNIDADE,
    vinculo: v.unidade_superior ?? "—",
    nome_ocupante: v.ocupante ?? "",
  };
}

// Cores dos selos de diretoria: a presidência (tipo vindo do banco) usa a primária; as demais
// recebem as cores na ordem alfabética, sem siglas fixas no código.
const CORES_DIRETORIA = [
  "bg-info/10 text-info border-info/30",
  "bg-success/10 text-success border-success/30",
  "bg-warning/10 text-warning border-warning/30",
];

const ITEMS_PER_PAGE = 15;

const COLUNAS_BASE: ColunaTabela<Cargo>[] = [
  {
    id: "codigo",
    cabecalho: "Código",
    celula: (c) => (
      <Badge variant="outline" className="font-mono">
        {c.codigo}
      </Badge>
    ),
    ordenarPor: (c) => c.codigo,
    buscarPor: (c) => c.codigo,
  },
  {
    id: "cargo",
    cabecalho: "Cargo",
    celula: (c) => <span className="font-medium">{c.cargo}</span>,
    ordenarPor: (c) => c.cargo,
    buscarPor: (c) => c.cargo,
    mobile: "titulo",
  },
  {
    id: "valor",
    cabecalho: "Valor (R$)",
    celula: (c) => <span className="font-mono tabular-nums">{c.valor_unitario_formatado}</span>,
    ordenarPor: (c) => c.valor_unitario,
    alinhamento: "direita",
  },
];

export default function CargosRemuneracaoPage() {
  const { data: vagas, isLoading: loading, isError } = useTransparenciaCargos();
  const [filterDiretoria, setFilterDiretoria] = useState<string>("all");
  const [filterCodigo, setFilterCodigo] = useState<string>("all");
  const [filterVinculo, setFilterVinculo] = useState<string>("all");
  const { sigla } = useIdentidade();

  const cargos = useMemo(() => (vagas ?? []).map(paraLinha), [vagas]);

  const diretorias = useMemo(() => [...new Set(cargos.map((c) => c.diretoria))].sort(), [cargos]);

  const codigos = useMemo(() => [...new Set(cargos.map((c) => c.codigo))].sort(), [cargos]);

  const vinculos = useMemo(() => [...new Set(cargos.map((c) => c.vinculo))].sort(), [cargos]);

  // Rodapé: lei(s) de criação dos cargos e data da última alteração do quadro, ambas do banco
  const fonte = useMemo(() => {
    const leis = new Set<string>();
    for (const v of vagas ?? []) {
      if (!v.lei_criacao_numero) continue;
      const data = v.lei_criacao_data
        ? `, de ${new Date(`${v.lei_criacao_data}T00:00:00`).toLocaleDateString("pt-BR")}`
        : "";
      leis.add(`Lei nº ${v.lei_criacao_numero}${data}`);
    }
    return [...leis].sort().join("; ");
  }, [vagas]);

  const ultimaAtualizacao = useMemo(() => {
    const datas = (vagas ?? []).map((v) => v.atualizado_em).filter((d): d is string => !!d).sort();
    return datas.length ? datas[datas.length - 1] : null;
  }, [vagas]);

  // Busca e ordenação ficam com a DataTable; aqui só os filtros por campo.
  const filteredCargos = useMemo(() => {
    return cargos.filter((cargo) => {
      const matchesDiretoria = filterDiretoria === "all" || cargo.diretoria === filterDiretoria;
      const matchesCodigo = filterCodigo === "all" || cargo.codigo === filterCodigo;
      const matchesVinculo = filterVinculo === "all" || cargo.vinculo === filterVinculo;
      return matchesDiretoria && matchesCodigo && matchesVinculo;
    });
  }, [cargos, filterDiretoria, filterCodigo, filterVinculo]);

  // CSV gerado no navegador com as mesmas colunas públicas da tabela (respeita os filtros)
  const handleExportCSV = () => {
    exportarParaCSV(
      filteredCargos.map((c) => ({
        codigo: c.codigo,
        cargo: c.cargo,
        valor_unitario: c.valor_unitario.toFixed(2),
        diretoria: c.diretoria,
        unidade_setor: c.unidade_setor,
        vinculo: c.vinculo,
        nome_ocupante: c.nome_ocupante,
      })),
      "cargos-e-remuneracao"
    );
  };

  const stats = useMemo(() => {
    const ocupados = cargos.filter((c) => c.nome_ocupante).length;
    const valorTotal = cargos.reduce((sum, c) => sum + c.valor_unitario, 0);

    return {
      total: cargos.length,
      ocupados,
      vagos: cargos.length - ocupados,
      valorTotal,
    };
  }, [cargos]);

  const coresPorDiretoria = useMemo(() => {
    const mapa = new Map<string, string>();
    const tipoPorDiretoria = new Map(cargos.map((c) => [c.diretoria, c.diretoria_tipo]));
    let i = 0;
    for (const d of diretorias) {
      const tipo = tipoPorDiretoria.get(d);
      if (tipo === "presidencia") mapa.set(d, "bg-primary/10 text-primary border-primary/30");
      else if (tipo) mapa.set(d, CORES_DIRETORIA[i++ % CORES_DIRETORIA.length]);
    }
    return mapa;
  }, [cargos, diretorias]);

  const getDiretoriaColor = (diretoria: string) =>
    coresPorDiretoria.get(diretoria) ?? "bg-muted text-muted-foreground";

  const colunas: ColunaTabela<Cargo>[] = [
    ...COLUNAS_BASE,
    {
      id: "diretoria",
      cabecalho: "Diretoria",
      celula: (c) => <Badge className={getDiretoriaColor(c.diretoria)}>{c.diretoria}</Badge>,
      ordenarPor: (c) => c.diretoria,
    },
    {
      id: "unidade",
      cabecalho: "Unidade/Setor",
      celula: (c) => (
        <span className="block max-w-xs truncate" title={c.unidade_setor}>
          {c.unidade_setor}
        </span>
      ),
      buscarPor: (c) => c.unidade_setor,
    },
    {
      id: "vinculo",
      cabecalho: "Vínculo",
      celula: (c) => <span className="text-muted-foreground">{c.vinculo}</span>,
    },
    {
      id: "ocupante",
      cabecalho: "Ocupante",
      celula: (c) =>
        c.nome_ocupante ? (
          <span className="text-foreground">{c.nome_ocupante}</span>
        ) : (
          <span className="text-muted-foreground italic">Vago</span>
        ),
      buscarPor: (c) => c.nome_ocupante,
    },
  ];

  return (
    <MainLayout>
      {/* Header */}
      <section className="bg-info text-info-foreground py-12">
        <div className="container mx-auto px-4">
          <nav aria-label="Trilha de navegação" className="flex items-center gap-3 text-sm mb-4 opacity-90">
            <Link to="/" className="inline-flex min-h-11 items-center hover:underline">Início</Link>
            <span aria-hidden="true">/</span>
            <Link to="/transparencia" className="inline-flex min-h-11 items-center hover:underline">Transparência</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">Cargos e remuneração</span>
          </nav>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center" aria-hidden="true">
              <Users className="w-8 h-8 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-3xl lg:text-4xl font-bold">Cargos e Remuneração</h1>
              <p className="text-base opacity-90 mt-1">
                Quadro de cargos comissionados do {sigla}
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
            <KpiCard rotulo="Total de cargos" valor={stats.total} icone={Users} carregando={loading} />
            <KpiCard rotulo="Ocupados" valor={stats.ocupados} icone={Building2} carregando={loading} />
            <KpiCard rotulo="Vagos" valor={stats.vagos} icone={Users} carregando={loading} />
            <KpiCard
              rotulo="Valor total mensal"
              valor={formatarMoeda(stats.valorTotal)}
              icone={DollarSign}
              carregando={loading}
            />
          </div>

          <div className="mb-4 flex justify-end">
            <Button variant="outline" onClick={handleExportCSV} disabled={filteredCargos.length === 0}>
              <Download className="w-4 h-4 mr-2" aria-hidden="true" />
              Exportar CSV
            </Button>
          </div>

          <DataTable
            key={`${filterDiretoria}-${filterCodigo}-${filterVinculo}`}
            rotulo="Cargos comissionados"
            dados={filteredCargos}
            colunas={colunas}
            chaveLinha={(c) => String(c.id)}
            carregando={loading}
            erro={isError ? "Os dados de cargos não estão disponíveis agora." : null}
            tamanhoPagina={ITEMS_PER_PAGE}
            busca={{ placeholder: "Buscar por cargo, unidade, nome…" }}
            filtros={
              <>
                <Select value={filterDiretoria} onValueChange={setFilterDiretoria}>
                  <SelectTrigger className="w-full sm:w-48" aria-label="Diretoria">
                    <SelectValue placeholder="Diretoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as diretorias</SelectItem>
                    {diretorias.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterCodigo} onValueChange={setFilterCodigo}>
                  <SelectTrigger className="w-full sm:w-40" aria-label="Código">
                    <SelectValue placeholder="Código" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os códigos</SelectItem>
                    {codigos.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterVinculo} onValueChange={setFilterVinculo}>
                  <SelectTrigger className="w-full sm:w-40" aria-label="Vínculo">
                    <SelectValue placeholder="Vínculo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os vínculos</SelectItem>
                    {vinculos.map((v) => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            }
            vazio={{
              icone: Users,
              titulo: "Nenhum cargo encontrado",
              descricao: "Ajuste os filtros para ver outros cargos.",
            }}
          />

          {/* Informações */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              <span>Última atualização: {ultimaAtualizacao ? new Date(ultimaAtualizacao).toLocaleDateString("pt-BR") : "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" aria-hidden="true" />
              <span>Fonte: {fonte || "-"}</span>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
