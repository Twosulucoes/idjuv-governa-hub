import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ModuleLayout } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DataTable, KpiCard, PageHeader, type ColunaTabela } from "@/components/design-system";
import {
  Plus,
  Eye,
  Users,
  UserCheck,
  ArrowRightLeft,
  Building2,
  CreditCard,
  AlertTriangle,
  BarChart3,
  Briefcase,
  Layers,
  Tag,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { CentralRelatoriosDialog } from "@/components/relatorios/CentralRelatoriosDialog";
import { EdicaoLoteBancarioDialog } from "@/components/rh/EdicaoLoteBancarioDialog";
import { GerenciarTagsDialog, getTagColorClass } from "@/components/rh/GerenciarTagsDialog";
import { ServidorTagsPopover } from "@/components/rh/ServidorTagsPopover";
import { SituacaoServidorBadge } from "@/components/rh/SituacaoServidorBadge";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  type SituacaoFuncional,
  SITUACAO_LABELS,
  type TipoServidor,
  TIPO_SERVIDOR_LABELS,
  TIPO_SERVIDOR_COLORS,
} from "@/types/rh";
import { TIPO_DERIVADO_LABELS, TIPO_DERIVADO_COLORS } from "@/hooks/useVinculosServidor";

interface ServidorCompleto {
  id: string;
  nome_completo: string;
  cpf: string;
  matricula?: string;
  codigo_interno?: string;
  foto_url?: string;
  tipo_servidor?: string;
  situacao: SituacaoFuncional;
  orgao_origem?: string;
  orgao_destino_cessao?: string;
  funcao_exercida?: string;
  ativo?: boolean;
  cargo?: { id: string; nome: string; sigla?: string };
  unidade?: { id: string; nome: string; sigla?: string };
}

type GroupBy = "none" | "tipo_servidor" | "situacao" | "unidade" | "tag";

interface LinhaServidor {
  /** Única por linha: no agrupamento por tag o mesmo servidor aparece em várias. */
  chave: string;
  grupo: string;
  servidor: ServidorCompleto & { banco_codigo?: string; banco_agencia?: string; banco_conta?: string };
}

const ROTULO_AGRUPAMENTO: Record<Exclude<GroupBy, "none">, string> = {
  tipo_servidor: "Tipo",
  situacao: "Situação",
  unidade: "Unidade",
  tag: "Tag",
};

// O tipo vem da view v_servidor_tipo_derivado (efetivo, comissionado,
// cedido_entrada…). Filtro e indicadores usam as mesmas categorias, para o
// clique no indicador e o select mostrarem o mesmo recorte.
type CategoriaTipo = "efetivos" | "comissionados" | "cedidos_entrada" | "cedidos_saida" | "federais" | "requisitados" | "sem_tipo";

const CATEGORIA_LABELS: Record<CategoriaTipo, string> = {
  efetivos: "Efetivos",
  comissionados: "Comissionados",
  cedidos_entrada: "Cedidos (entrada)",
  cedidos_saida: "Cedidos (saída)",
  federais: "Federais",
  requisitados: "Requisitados",
  sem_tipo: "Sem classificação",
};

// A view não tem "cedido para outro órgão": a cessão de saída aparece na
// situação funcional (o trigger de cessão grava situacao = "cedido").
function categoriaDoServidor(s: { tipo_servidor?: string; situacao?: string }): CategoriaTipo {
  if (s.situacao === "cedido" && s.tipo_servidor !== "cedido_entrada" && s.tipo_servidor !== "cedido_comissionado") {
    return "cedidos_saida";
  }
  switch (s.tipo_servidor) {
    case "efetivo":
    case "efetivo_comissionado":
    case "efetivo_idjuv":
      return "efetivos";
    case "comissionado":
    case "comissionado_idjuv":
      return "comissionados";
    case "cedido_entrada":
    case "cedido_comissionado":
      return "cedidos_entrada";
    case "federal":
    case "federal_comissionado":
      return "federais";
    case "requisitado":
      return "requisitados";
    default:
      return "sem_tipo";
  }
}

const labelTipo = (tipo?: string) =>
  !tipo || tipo === "nao_classificado"
    ? "Não classificado"
    : TIPO_DERIVADO_LABELS[tipo] || TIPO_SERVIDOR_LABELS[tipo as TipoServidor] || tipo;

const numero = new Intl.NumberFormat("pt-BR");

export default function GestaoServidoresPage() {
  const navigate = useNavigate();
  const [filterTipoServidor, setFilterTipoServidor] = useState<string>("all");
  const [filterSituacao, setFilterSituacao] = useState<string>("all");
  const [filterUnidade, setFilterUnidade] = useState<string>("all");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [showInativos, setShowInativos] = useState(false);
  const [showEdicaoBancaria, setShowEdicaoBancaria] = useState(false);
  const [centralRelatoriosOpen, setCentralRelatoriosOpen] = useState(false);
  const [gerenciarTagsOpen, setGerenciarTagsOpen] = useState(false);

  // Grouping
  const [groupBy, setGroupBy] = useState<GroupBy>("none");

  // Fetch servidores
  const { data: servidores = [], isLoading, error, refetch } = useQuery({
    queryKey: ["servidores-rh", showInativos],
    queryFn: async () => {
      // Buscar servidores
      let query = supabase
        .from("servidores")
        .select(`
          id, nome_completo, cpf, matricula, foto_url,
          situacao, orgao_origem, orgao_destino_cessao,
          funcao_exercida, ativo, banco_codigo, banco_agencia, banco_conta,
          cargo_atual_id, unidade_atual_id
        `)
        .order("nome_completo");

      if (!showInativos) {
        query = query.eq("ativo", true).neq("situacao", "inativo");
      }

      const { data: servidoresData, error } = await query;
      if (error) throw error;

      if (!servidoresData || servidoresData.length === 0) return [];

      // Buscar tipo derivado da view
      const { data: tiposDerivados, error: erroTipos } = await supabase
        .from("v_servidor_tipo_derivado")
        .select("servidor_id, tipo_derivado, tipos_ativos");
      // Sem a view todos cairiam em "Sem classificação" sem aviso
      if (erroTipos) throw erroTipos;

      const tipoMap = new Map<string, string>(
        (tiposDerivados || []).map((t: any) => [t.servidor_id, t.tipo_derivado])
      );

      // Buscar cargos e unidades
      const cargoIds = [...new Set(servidoresData.map((s: any) => s.cargo_atual_id).filter(Boolean))];
      const unidadeIds = [...new Set(servidoresData.map((s: any) => s.unidade_atual_id).filter(Boolean))];

      const [cargosResult, unidadesResult] = await Promise.all([
        cargoIds.length > 0 
          ? supabase.from("cargos").select("id, nome, sigla").in("id", cargoIds)
          : Promise.resolve({ data: [] }),
        unidadeIds.length > 0
          ? supabase.from("estrutura_organizacional").select("id, nome, sigla").in("id", unidadeIds)
          : Promise.resolve({ data: [] }),
      ]);

      const cargosMap = new Map((cargosResult.data || []).map((c: any) => [c.id, c]));
      const unidadesMap = new Map((unidadesResult.data || []).map((u: any) => [u.id, u]));

      return servidoresData.map((s: any) => ({
        ...s,
        tipo_servidor: tipoMap.get(s.id) || undefined,
        cargo: s.cargo_atual_id ? cargosMap.get(s.cargo_atual_id) || null : null,
        unidade: s.unidade_atual_id ? unidadesMap.get(s.unidade_atual_id) || null : null,
      })) as unknown as (ServidorCompleto & { banco_codigo?: string; banco_agencia?: string; banco_conta?: string })[];
    },
  });

  // Fetch unidades para filtro
  const { data: unidades = [] } = useQuery({
    queryKey: ["unidades-filtro"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estrutura_organizacional")
        .select("id, nome, sigla")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Fetch tags
  const { data: tags = [] } = useQuery({
    queryKey: ["servidor-tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servidor_tags")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Fetch all tag vinculos (for display and filtering)
  const { data: allVinculos = [] } = useQuery({
    queryKey: ["servidor-tag-vinculos-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servidor_tag_vinculos")
        .select("servidor_id, tag_id");
      if (error) throw error;
      return data;
    },
  });

  // Map servidor -> tags
  const servidorTagsMap = useMemo(() => {
    const map = new Map<string, string[]>();
    allVinculos.forEach((v) => {
      const list = map.get(v.servidor_id) || [];
      list.push(v.tag_id);
      map.set(v.servidor_id, list);
    });
    return map;
  }, [allVinculos]);

  // Filtros da página (a busca por texto fica na própria tabela)
  const filteredServidores = useMemo(
    () =>
      servidores.filter((s) => {
        const matchesTipo = filterTipoServidor === "all" || categoriaDoServidor(s) === filterTipoServidor;
        const matchesSituacao = filterSituacao === "all" || s.situacao === filterSituacao;
        const matchesUnidade = filterUnidade === "all" || s.unidade?.id === filterUnidade;
        const matchesTag =
          filterTag === "all" ||
          (filterTag === "sem_tag" ? !servidorTagsMap.get(s.id)?.length : servidorTagsMap.get(s.id)?.includes(filterTag));
        return matchesTipo && matchesSituacao && matchesUnidade && matchesTag;
      }),
    [servidores, filterTipoServidor, filterSituacao, filterUnidade, filterTag, servidorTagsMap],
  );

  // Agrupamento: vira a primeira coluna e a ordem inicial da tabela.
  // Por tag, o servidor aparece uma vez em cada tag que tem.
  const linhas = useMemo<LinhaServidor[]>(() => {
    if (groupBy === "none") return filteredServidores.map((s) => ({ chave: s.id, grupo: "", servidor: s }));
    const resultado: LinhaServidor[] = [];
    filteredServidores.forEach((s) => {
      // id distingue grupos de mesmo nome (tags podem repetir nome)
      let grupos: { id: string; nome: string }[];
      switch (groupBy) {
        case "tipo_servidor":
          grupos = [{ id: s.tipo_servidor || "sem_tipo", nome: labelTipo(s.tipo_servidor) }];
          break;
        case "situacao":
          grupos = [{ id: s.situacao, nome: SITUACAO_LABELS[s.situacao] || s.situacao }];
          break;
        case "unidade":
          grupos = [{ id: s.unidade?.id || "sem_lotacao", nome: s.unidade?.sigla || s.unidade?.nome || "Sem lotação" }];
          break;
        case "tag": {
          const doServidor = (servidorTagsMap.get(s.id) || [])
            .map((tagId) => tags.find((t) => t.id === tagId))
            .filter((t): t is NonNullable<typeof t> => Boolean(t))
            .map((t) => ({ id: t.id, nome: t.nome }));
          grupos = doServidor.length > 0 ? doServidor : [{ id: "sem_tag", nome: "Sem tag" }];
          break;
        }
      }
      grupos.forEach((g) => resultado.push({ chave: `${g.id}:${s.id}`, grupo: g.nome, servidor: s }));
    });
    return resultado.sort((a, b) => a.grupo.localeCompare(b.grupo, "pt-BR"));
  }, [filteredServidores, groupBy, servidorTagsMap, tags]);

  // Stats
  const totalEfetivos = servidores.filter((s) => categoriaDoServidor(s) === "efetivos").length;
  const totalComissionados = servidores.filter((s) => categoriaDoServidor(s) === "comissionados").length;
  const totalCedidosEntrada = servidores.filter((s) => categoriaDoServidor(s) === "cedidos_entrada").length;
  const totalCedidosSaida = servidores.filter((s) => categoriaDoServidor(s) === "cedidos_saida").length;
  const totalSemTipo = servidores.filter((s) => categoriaDoServidor(s) === "sem_tipo").length;
  const totalSemDadosBancarios = servidores.filter(s => !s.banco_codigo || !s.banco_agencia || !s.banco_conta).length;

  const indicadores: { categoria: CategoriaTipo; rotulo: string; total: number; icone: LucideIcon }[] = [
    { categoria: "efetivos", rotulo: "Efetivos", total: totalEfetivos, icone: UserCheck },
    { categoria: "comissionados", rotulo: "Comissionados", total: totalComissionados, icone: Briefcase },
    { categoria: "cedidos_entrada", rotulo: "Cedidos (entrada)", total: totalCedidosEntrada, icone: ArrowRightLeft },
    { categoria: "cedidos_saida", rotulo: "Cedidos (saída)", total: totalCedidosSaida, icone: Building2 },
    ...(totalSemTipo > 0
      ? [{ categoria: "sem_tipo" as const, rotulo: "Sem classificação", total: totalSemTipo, icone: AlertTriangle }]
      : []),
  ];

  const getInitials = (nome: string) => nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const formatCPF = (cpf: string) => cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  const cargoOuFuncao = (s: ServidorCompleto) =>
    s.tipo_servidor === "cedido_entrada" ? s.funcao_exercida || "Função não informada" : s.cargo?.nome || "-";

  const getTipoServidorBadge = (tipo?: string) => {
    if (!tipo || tipo === 'nao_classificado') return <Badge variant="outline" className="bg-muted text-muted-foreground">Não classificado</Badge>;
    const colorClass = TIPO_DERIVADO_COLORS[tipo] || TIPO_SERVIDOR_COLORS[tipo as TipoServidor] || "bg-muted text-muted-foreground";
    return <Badge className={colorClass}>{labelTipo(tipo)}</Badge>;
  };

  const renderTagBadges = (servidorId: string) => {
    const tagIds = servidorTagsMap.get(servidorId) || [];
    if (tagIds.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {tagIds.slice(0, 3).map((tagId) => {
          const tag = tags.find(t => t.id === tagId);
          if (!tag) return null;
          return (
            <Badge key={tagId} className={`${getTagColorClass(tag.cor)} text-[10px] px-1.5 py-0`}>
              {tag.nome}
            </Badge>
          );
        })}
        {tagIds.length > 3 && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">+{tagIds.length - 3}</Badge>
        )}
      </div>
    );
  };

  const colunas: ColunaTabela<LinhaServidor>[] = [
    ...(groupBy !== "none"
      ? [
          {
            id: "grupo",
            cabecalho: ROTULO_AGRUPAMENTO[groupBy],
            celula: (l: LinhaServidor) => <span className="font-medium">{l.grupo}</span>,
            ordenarPor: (l: LinhaServidor) => l.grupo,
          },
        ]
      : []),
    {
      id: "servidor",
      cabecalho: "Servidor",
      mobile: "titulo",
      ordenarPor: ({ servidor: s }) => s.nome_completo,
      buscarPor: ({ servidor: s }) =>
        [s.nome_completo, s.cpf, s.cpf && formatCPF(s.cpf), s.matricula, s.codigo_interno].filter(Boolean).join(" "),
      celula: ({ servidor: s }) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={s.foto_url || undefined} alt="" />
            <AvatarFallback className="bg-primary/10 text-primary">{getInitials(s.nome_completo)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{s.nome_completo}</p>
            <p className="text-caption text-muted-foreground">
              {s.codigo_interno && <span className="font-mono mr-2">{s.codigo_interno}</span>}
              {s.matricula ? `Mat.: ${s.matricula}` : formatCPF(s.cpf)}
            </p>
            {renderTagBadges(s.id)}
          </div>
        </div>
      ),
    },
    {
      id: "tipo",
      cabecalho: "Tipo",
      ordenarPor: ({ servidor: s }) => labelTipo(s.tipo_servidor),
      celula: ({ servidor: s }) => getTipoServidorBadge(s.tipo_servidor),
    },
    {
      id: "cargo",
      cabecalho: "Cargo / Função",
      ordenarPor: ({ servidor: s }) => cargoOuFuncao(s),
      buscarPor: ({ servidor: s }) => cargoOuFuncao(s),
      celula: ({ servidor: s }) => cargoOuFuncao(s),
    },
    {
      id: "lotacao",
      cabecalho: "Lotação",
      ordenarPor: ({ servidor: s }) =>
        categoriaDoServidor(s) === "cedidos_saida" ? s.orgao_destino_cessao : s.unidade?.sigla || s.unidade?.nome,
      buscarPor: ({ servidor: s }) => [s.unidade?.sigla, s.unidade?.nome, s.orgao_origem].filter(Boolean).join(" "),
      celula: ({ servidor: s }) =>
        s.tipo_servidor === "cedido_entrada" ? (
          <div>
            <p>{s.unidade?.sigla || s.unidade?.nome || "-"}</p>
            {s.orgao_origem && <p className="text-caption text-muted-foreground">Origem: {s.orgao_origem}</p>}
          </div>
        ) : categoriaDoServidor(s) === "cedidos_saida" ? (
          <div>
            <p>{s.orgao_destino_cessao || "Órgão não informado"}</p>
            <p className="text-caption text-muted-foreground">Cedido para outro órgão</p>
          </div>
        ) : (
          s.unidade?.sigla || s.unidade?.nome || "-"
        ),
    },
    {
      id: "situacao",
      cabecalho: "Situação",
      ordenarPor: ({ servidor: s }) => SITUACAO_LABELS[s.situacao] || s.situacao,
      celula: ({ servidor: s }) => <SituacaoServidorBadge situacao={s.situacao} />,
    },
  ];

  const filtrosAtivos =
    filterTipoServidor !== "all" || filterSituacao !== "all" || filterUnidade !== "all" || filterTag !== "all";
  const limparFiltros = () => {
    setFilterTipoServidor("all");
    setFilterSituacao("all");
    setFilterUnidade("all");
    setFilterTag("all");
  };

  return (
    <ProtectedRoute requiredModule="rh">
      <ModuleLayout module="rh">
        <div className="space-y-6">
          <PageHeader
            migalhas={[{ rotulo: "Recursos Humanos", href: "/rh" }, { rotulo: "Servidores" }]}
            titulo="Servidores"
            descricao="Cadastro e gerenciamento por tipo de servidor"
            acoes={
              <>
                <Button variant="outline" onClick={() => setShowEdicaoBancaria(true)}>
                  <CreditCard className="h-4 w-4" aria-hidden="true" />Dados bancários
                </Button>
                <Button variant="outline" onClick={() => setGerenciarTagsOpen(true)}>
                  <Tag className="h-4 w-4" aria-hidden="true" />Tags
                </Button>
                <Button variant="outline" onClick={() => setCentralRelatoriosOpen(true)}>
                  <BarChart3 className="h-4 w-4" aria-hidden="true" />Relatórios
                </Button>
                <Button onClick={() => navigate('/rh/servidores/novo')}>
                  <Plus className="h-4 w-4" aria-hidden="true" />Novo servidor
                </Button>
              </>
            }
          />

          {totalSemDadosBancarios > 0 && (
            <Alert className="border-warning/40">
              <AlertTriangle className="h-4 w-4 !text-warning" aria-hidden="true" />
              <AlertDescription className="flex flex-wrap items-center gap-2">
                {totalSemDadosBancarios} servidor{totalSemDadosBancarios !== 1 ? "es" : ""} sem dados bancários completos.
                <Button variant="outline" size="sm" onClick={() => setShowEdicaoBancaria(true)}>
                  Completar dados bancários
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Indicadores por tipo: clicar filtra a tabela (clicar de novo desfaz) */}
          <section aria-labelledby="servidores-por-tipo">
            <h2 id="servidores-por-tipo" className="sr-only">Servidores por tipo</h2>
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-5">
              {indicadores.map((ind) => {
                const ativo = filterTipoServidor === ind.categoria;
                return (
                  <li key={ind.categoria}>
                    <button
                      type="button"
                      aria-pressed={ativo}
                      aria-label={`Filtrar ${ind.rotulo.toLowerCase()}: ${numero.format(ind.total)}`}
                      onClick={() => setFilterTipoServidor(ativo ? "all" : ind.categoria)}
                      className={cn(
                        "block h-full w-full rounded-lg text-left transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        ativo && "ring-2 ring-primary",
                      )}
                    >
                      <KpiCard
                        rotulo={ind.rotulo}
                        valor={numero.format(ind.total)}
                        icone={ind.icone}
                        carregando={isLoading}
                        className="h-full"
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <div className="flex items-center gap-2">
            <Switch id="mostrar-inativos" checked={showInativos} onCheckedChange={setShowInativos} />
            <Label htmlFor="mostrar-inativos">Incluir exonerados e inativos</Label>
          </div>

          <DataTable
            rotulo="Servidores"
            dados={linhas}
            colunas={colunas}
            chaveLinha={(l) => l.chave}
            carregando={isLoading}
            erro={error ? "Verifique a conexão e tente de novo." : null}
            aoTentarNovamente={() => refetch()}
            busca={{ placeholder: "Nome, CPF, matrícula ou cargo…" }}
            aoClicarLinha={(l) => navigate(`/rh/servidores/${l.servidor.id}`)}
            tamanhoPagina={50}
            vazio={
              filtrosAtivos
                ? {
                    icone: Users,
                    titulo: "Nenhum servidor com esses filtros",
                    acao: (
                      <Button variant="outline" onClick={limparFiltros}>
                        Limpar filtros
                      </Button>
                    ),
                  }
                : {
                    icone: Users,
                    titulo: "Nenhum servidor cadastrado",
                    acao: <Button onClick={() => navigate('/rh/servidores/novo')}>Novo servidor</Button>,
                  }
            }
            filtros={
              <>
                <Select value={filterTipoServidor} onValueChange={setFilterTipoServidor}>
                  <SelectTrigger className="w-full sm:w-[190px]" aria-label="Filtrar por tipo de servidor">
                    <SelectValue placeholder="Tipo de servidor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    {Object.entries(CATEGORIA_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterSituacao} onValueChange={setFilterSituacao}>
                  <SelectTrigger className="w-full sm:w-[170px]" aria-label="Filtrar por situação">
                    <SelectValue placeholder="Situação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as situações</SelectItem>
                    {Object.entries(SITUACAO_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterUnidade} onValueChange={setFilterUnidade}>
                  <SelectTrigger className="w-full sm:w-[170px]" aria-label="Filtrar por unidade">
                    <SelectValue placeholder="Unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as unidades</SelectItem>
                    {unidades.map((u) => (
                      <SelectItem key={u.id} value={u.id}>{u.sigla || u.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {tags.length > 0 && (
                  <Select value={filterTag} onValueChange={setFilterTag}>
                    <SelectTrigger className="w-full sm:w-[150px]" aria-label="Filtrar por tag">
                      <SelectValue placeholder="Tag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as tags</SelectItem>
                      <SelectItem value="sem_tag">Sem tag</SelectItem>
                      {tags.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Select value={groupBy} onValueChange={(v) => setGroupBy(v as GroupBy)}>
                  <SelectTrigger className="w-full sm:w-[190px]" aria-label="Agrupar por">
                    <Layers className="h-4 w-4 mr-2" aria-hidden="true" />
                    <SelectValue placeholder="Agrupar por..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem agrupamento</SelectItem>
                    <SelectItem value="tipo_servidor">Por tipo de servidor</SelectItem>
                    <SelectItem value="situacao">Por situação</SelectItem>
                    <SelectItem value="unidade">Por unidade</SelectItem>
                    {tags.length > 0 && <SelectItem value="tag">Por tag</SelectItem>}
                  </SelectContent>
                </Select>
              </>
            }
            acoesLinha={({ servidor: s }) => (
              <div className="flex items-center justify-end gap-1">
                <ServidorTagsPopover servidorId={s.id}>
                  <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={`Tags de ${s.nome_completo}`}>
                    <Tag className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </ServidorTagsPopover>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  aria-label={`Ver ficha de ${s.nome_completo}`}
                  onClick={() => navigate(`/rh/servidores/${s.id}`)}
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            )}
          />
        </div>

        {/* Dialogs */}
        <EdicaoLoteBancarioDialog open={showEdicaoBancaria} onOpenChange={setShowEdicaoBancaria} />
        <CentralRelatoriosDialog open={centralRelatoriosOpen} onOpenChange={setCentralRelatoriosOpen} tipoInicial="servidores" />
        <GerenciarTagsDialog open={gerenciarTagsOpen} onOpenChange={setGerenciarTagsOpen} />
      </ModuleLayout>
    </ProtectedRoute>
  );
}
