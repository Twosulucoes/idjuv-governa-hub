import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ModuleLayout } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Plus, 
  Search, 
  Eye,
  Users,
  UserCheck,
  ArrowRightLeft,
  Building2,
  CreditCard,
  AlertTriangle,
  BarChart3,
  Briefcase,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  Tag,
} from "lucide-react";
import { CentralRelatoriosDialog } from "@/components/relatorios/CentralRelatoriosDialog";
import { EdicaoLoteBancarioDialog } from "@/components/rh/EdicaoLoteBancarioDialog";
import { GerenciarTagsDialog, getTagColorClass } from "@/components/rh/GerenciarTagsDialog";
import { ServidorTagsPopover } from "@/components/rh/ServidorTagsPopover";
import { useNavigate } from "react-router-dom";
import { 
  type SituacaoFuncional,
  SITUACAO_LABELS,
  SITUACAO_COLORS,
  type TipoServidor,
  TIPO_SERVIDOR_LABELS,
  TIPO_SERVIDOR_COLORS,
} from "@/types/rh";

interface ServidorCompleto {
  id: string;
  nome_completo: string;
  cpf: string;
  matricula?: string;
  codigo_interno?: string;
  foto_url?: string;
  tipo_servidor?: TipoServidor;
  situacao: SituacaoFuncional;
  orgao_origem?: string;
  orgao_destino_cessao?: string;
  funcao_exercida?: string;
  ativo?: boolean;
  cargo?: { id: string; nome: string; sigla?: string };
  unidade?: { id: string; nome: string; sigla?: string };
}

type SortField = "nome" | "tipo" | "cargo" | "unidade" | "situacao";
type SortDir = "asc" | "desc";
type GroupBy = "none" | "tipo_servidor" | "situacao" | "unidade" | "tag";

export default function GestaoServidoresPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipoServidor, setFilterTipoServidor] = useState<string>("all");
  const [filterSituacao, setFilterSituacao] = useState<string>("all");
  const [filterUnidade, setFilterUnidade] = useState<string>("all");
  const [filterTag, setFilterTag] = useState<string>("all");
  const [showEdicaoBancaria, setShowEdicaoBancaria] = useState(false);
  const [centralRelatoriosOpen, setCentralRelatoriosOpen] = useState(false);
  const [gerenciarTagsOpen, setGerenciarTagsOpen] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<SortField>("nome");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // Grouping
  const [groupBy, setGroupBy] = useState<GroupBy>("none");

  // Fetch servidores
  const { data: servidores = [], isLoading } = useQuery({
    queryKey: ["servidores-rh"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servidores")
        .select(`
          id, nome_completo, cpf, matricula, codigo_interno, foto_url,
          tipo_servidor, situacao, orgao_origem, orgao_destino_cessao,
          funcao_exercida, ativo, banco_codigo, banco_agencia, banco_conta,
          cargo:cargos!servidores_cargo_atual_id_fkey(id, nome, sigla),
          unidade:estrutura_organizacional!servidores_unidade_atual_id_fkey(id, nome, sigla)
        `)
        .eq("ativo", true)
        .order("nome_completo");
      if (error) throw error;
      return data as unknown as (ServidorCompleto & { banco_codigo?: string; banco_agencia?: string; banco_conta?: string })[];
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

  // Filter
  const filteredServidores = useMemo(() => {
    let result = servidores.filter((s) => {
      const matchesSearch =
        s.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.cpf?.includes(searchTerm) ||
        s.matricula?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.codigo_interno?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTipo = filterTipoServidor === "all" || 
        (filterTipoServidor === "sem_tipo" ? !s.tipo_servidor : s.tipo_servidor === filterTipoServidor);
      const matchesSituacao = filterSituacao === "all" || s.situacao === filterSituacao;
      const matchesUnidade = filterUnidade === "all" || s.unidade?.id === filterUnidade;
      const matchesTag = filterTag === "all" || 
        (filterTag === "sem_tag" ? !(servidorTagsMap.get(s.id)?.length) : servidorTagsMap.get(s.id)?.includes(filterTag));
      return matchesSearch && matchesTipo && matchesSituacao && matchesUnidade && matchesTag;
    });

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "nome": cmp = a.nome_completo.localeCompare(b.nome_completo); break;
        case "tipo": cmp = (a.tipo_servidor || "zzz").localeCompare(b.tipo_servidor || "zzz"); break;
        case "cargo": {
          const ca = a.tipo_servidor === 'cedido_entrada' ? (a.funcao_exercida || "") : (a.cargo?.nome || "");
          const cb = b.tipo_servidor === 'cedido_entrada' ? (b.funcao_exercida || "") : (b.cargo?.nome || "");
          cmp = ca.localeCompare(cb);
          break;
        }
        case "unidade": cmp = (a.unidade?.nome || "zzz").localeCompare(b.unidade?.nome || "zzz"); break;
        case "situacao": cmp = a.situacao.localeCompare(b.situacao); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [servidores, searchTerm, filterTipoServidor, filterSituacao, filterUnidade, filterTag, sortField, sortDir, servidorTagsMap]);

  // Grouping
  const groupedServidores = useMemo(() => {
    if (groupBy === "none") return [{ key: "", label: "", items: filteredServidores }];

    const groups = new Map<string, ServidorCompleto[]>();
    filteredServidores.forEach((s) => {
      let key = "";
      switch (groupBy) {
        case "tipo_servidor": key = s.tipo_servidor || "sem_tipo"; break;
        case "situacao": key = s.situacao; break;
        case "unidade": key = s.unidade?.sigla || s.unidade?.nome || "Sem lotação"; break;
        case "tag": {
          const sTags = servidorTagsMap.get(s.id) || [];
          if (sTags.length === 0) { key = "Sem tag"; }
          else {
            // Add to each tag group
            sTags.forEach((tagId) => {
              const tagName = tags.find(t => t.id === tagId)?.nome || tagId;
              const list = groups.get(tagName) || [];
              list.push(s);
              groups.set(tagName, list);
            });
            return; // already added
          }
          break;
        }
      }
      const list = groups.get(key) || [];
      list.push(s);
      groups.set(key, list);
    });

    return Array.from(groups.entries()).map(([key, items]) => ({
      key,
      label: getGroupLabel(groupBy, key),
      items,
    }));
  }, [filteredServidores, groupBy, servidorTagsMap, tags]);

  function getGroupLabel(group: GroupBy, key: string): string {
    switch (group) {
      case "tipo_servidor":
        return key === "sem_tipo" ? "Não classificado" : (TIPO_SERVIDOR_LABELS[key as TipoServidor] || key);
      case "situacao":
        return SITUACAO_LABELS[key as SituacaoFuncional] || key;
      default:
        return key;
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />;
  };

  // Stats
  const totalEfetivos = servidores.filter(s => s.tipo_servidor === 'efetivo_idjuv').length;
  const totalComissionados = servidores.filter(s => s.tipo_servidor === 'comissionado_idjuv').length;
  const totalCedidosEntrada = servidores.filter(s => s.tipo_servidor === 'cedido_entrada').length;
  const totalCedidosSaida = servidores.filter(s => s.tipo_servidor === 'cedido_saida').length;
  const totalSemTipo = servidores.filter(s => !s.tipo_servidor).length;
  const totalSemDadosBancarios = servidores.filter(s => !s.banco_codigo || !s.banco_agencia || !s.banco_conta).length;

  const getInitials = (nome: string) => nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  const formatCPF = (cpf: string) => cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');

  const getTipoServidorBadge = (tipo?: TipoServidor) => {
    if (!tipo) return <Badge variant="outline" className="bg-muted text-muted-foreground">Não classificado</Badge>;
    return <Badge className={TIPO_SERVIDOR_COLORS[tipo]}>{TIPO_SERVIDOR_LABELS[tipo]}</Badge>;
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

  return (
    <ProtectedRoute allowedRoles={["admin", "manager"]}>
      <ModuleLayout module="rh">
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">Gestão de Servidores</h1>
                <p className="text-muted-foreground">Cadastro e gerenciamento por tipo de servidor</p>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {totalSemDadosBancarios > 0 && (
                <Button variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50"
                  onClick={() => setShowEdicaoBancaria(true)}>
                  <AlertTriangle className="h-4 w-4 mr-2" />{totalSemDadosBancarios} sem banco
                </Button>
              )}
              <Button variant="outline" onClick={() => setShowEdicaoBancaria(true)}>
                <CreditCard className="h-4 w-4 mr-2" />Dados Bancários
              </Button>
              <Button variant="outline" onClick={() => setGerenciarTagsOpen(true)}>
                <Tag className="h-4 w-4 mr-2" />Tags
              </Button>
              <Button variant="outline" onClick={() => setCentralRelatoriosOpen(true)}>
                <BarChart3 className="h-4 w-4 mr-2" />Relatórios
              </Button>
              <Button onClick={() => navigate('/rh/servidores/novo')}>
                <Plus className="h-4 w-4 mr-2" />Novo Servidor
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setFilterTipoServidor('efetivo_idjuv')}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 bg-success/10 rounded-lg"><UserCheck className="h-6 w-6 text-success" /></div>
                <div><p className="text-sm text-muted-foreground">Efetivos IDJuv</p><p className="text-2xl font-bold">{totalEfetivos}</p></div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setFilterTipoServidor('comissionado_idjuv')}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 bg-primary/10 rounded-lg"><Briefcase className="h-6 w-6 text-primary" /></div>
                <div><p className="text-sm text-muted-foreground">Comissionados</p><p className="text-2xl font-bold">{totalComissionados}</p></div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setFilterTipoServidor('cedido_entrada')}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 bg-info/10 rounded-lg"><ArrowRightLeft className="h-6 w-6 text-info" /></div>
                <div><p className="text-sm text-muted-foreground">Cedidos (Entrada)</p><p className="text-2xl font-bold">{totalCedidosEntrada}</p></div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setFilterTipoServidor('cedido_saida')}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="p-3 bg-warning/10 rounded-lg"><Building2 className="h-6 w-6 text-warning" /></div>
                <div><p className="text-sm text-muted-foreground">Cedidos (Saída)</p><p className="text-2xl font-bold">{totalCedidosSaida}</p></div>
              </CardContent>
            </Card>
            {totalSemTipo > 0 && (
              <Card className="cursor-pointer hover:bg-muted/50 transition-colors border-destructive/50" onClick={() => setFilterTipoServidor('sem_tipo')}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="p-3 bg-destructive/10 rounded-lg"><Users className="h-6 w-6 text-destructive" /></div>
                  <div><p className="text-sm text-destructive">Sem Tipo</p><p className="text-2xl font-bold text-destructive">{totalSemTipo}</p></div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome, CPF ou matrícula..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
            <Select value={filterTipoServidor} onValueChange={setFilterTipoServidor}>
              <SelectTrigger className="w-full lg:w-[220px]"><SelectValue placeholder="Tipo de Servidor" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                {Object.entries(TIPO_SERVIDOR_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
                <SelectItem value="sem_tipo">Sem classificação</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSituacao} onValueChange={setFilterSituacao}>
              <SelectTrigger className="w-full lg:w-[180px]"><SelectValue placeholder="Situação" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as situações</SelectItem>
                {Object.entries(SITUACAO_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterUnidade} onValueChange={setFilterUnidade}>
              <SelectTrigger className="w-full lg:w-[200px]"><SelectValue placeholder="Unidade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as unidades</SelectItem>
                {unidades.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.sigla || u.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Second row: Tag filter + Grouping */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {tags.length > 0 && (
              <Select value={filterTag} onValueChange={setFilterTag}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Filtrar por tag" />
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
              <SelectTrigger className="w-full sm:w-[220px]">
                <Layers className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Agrupar por..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem agrupamento</SelectItem>
                <SelectItem value="tipo_servidor">Por Tipo de Servidor</SelectItem>
                <SelectItem value="situacao">Por Situação</SelectItem>
                <SelectItem value="unidade">Por Unidade</SelectItem>
                {tags.length > 0 && <SelectItem value="tag">Por Tag</SelectItem>}
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground flex items-center ml-auto">
              {filteredServidores.length} servidor{filteredServidores.length !== 1 ? "es" : ""}
            </div>
          </div>

          {/* Table with Groups */}
          {groupedServidores.map((group) => (
            <div key={group.key} className="mb-6">
              {groupBy !== "none" && (
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-sm font-semibold text-foreground">{group.label}</h3>
                  <Badge variant="secondary" className="text-xs">{group.items.length}</Badge>
                </div>
              )}
              <div className="bg-card rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort("nome")}>
                        <div className="flex items-center gap-1">Servidor <SortIcon field="nome" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort("tipo")}>
                        <div className="flex items-center gap-1">Tipo <SortIcon field="tipo" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort("cargo")}>
                        <div className="flex items-center gap-1">Cargo / Função <SortIcon field="cargo" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none" onClick={() => handleSort("unidade")}>
                        <div className="flex items-center gap-1">Lotação <SortIcon field="unidade" /></div>
                      </TableHead>
                      <TableHead className="cursor-pointer select-none text-center" onClick={() => handleSort("situacao")}>
                        <div className="flex items-center justify-center gap-1">Situação <SortIcon field="situacao" /></div>
                      </TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8">Carregando...</TableCell></TableRow>
                    ) : group.items.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum servidor encontrado</TableCell></TableRow>
                    ) : (
                      group.items.map((servidor) => (
                        <TableRow key={servidor.id} className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/rh/servidores/${servidor.id}`)}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={servidor.foto_url || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary">{getInitials(servidor.nome_completo)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{servidor.nome_completo}</p>
                                <p className="text-xs text-muted-foreground">
                                  {servidor.codigo_interno && <span className="font-mono mr-2">{servidor.codigo_interno}</span>}
                                  {servidor.matricula ? `Mat: ${servidor.matricula}` : formatCPF(servidor.cpf)}
                                </p>
                                {renderTagBadges(servidor.id)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{getTipoServidorBadge(servidor.tipo_servidor as TipoServidor)}</TableCell>
                          <TableCell>
                            {servidor.tipo_servidor === 'cedido_entrada'
                              ? servidor.funcao_exercida || 'Função não informada'
                              : servidor.cargo?.nome || '-'}
                          </TableCell>
                          <TableCell>
                            {servidor.tipo_servidor === 'cedido_entrada' ? (
                              <div>
                                <p>{servidor.unidade?.sigla || servidor.unidade?.nome || '-'}</p>
                                {servidor.orgao_origem && <p className="text-xs text-muted-foreground">Origem: {servidor.orgao_origem}</p>}
                              </div>
                            ) : servidor.tipo_servidor === 'cedido_saida' ? (
                              <div>
                                <p className="text-warning">{servidor.orgao_destino_cessao || 'Órgão não informado'}</p>
                                <p className="text-xs text-muted-foreground">Cedido para outro órgão</p>
                              </div>
                            ) : servidor.unidade?.sigla || servidor.unidade?.nome || '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={SITUACAO_COLORS[servidor.situacao as SituacaoFuncional]}>
                              {SITUACAO_LABELS[servidor.situacao as SituacaoFuncional]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <ServidorTagsPopover servidorId={servidor.id}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Tag className="h-4 w-4" />
                                </Button>
                              </ServidorTagsPopover>
                              <Button variant="ghost" size="icon" className="h-8 w-8"
                                onClick={(e) => { e.stopPropagation(); navigate(`/rh/servidores/${servidor.id}`); }}>
                                <Eye className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>

        {/* Dialogs */}
        <EdicaoLoteBancarioDialog open={showEdicaoBancaria} onOpenChange={setShowEdicaoBancaria} />
        <CentralRelatoriosDialog open={centralRelatoriosOpen} onOpenChange={setCentralRelatoriosOpen} tipoInicial="servidores" />
        <GerenciarTagsDialog open={gerenciarTagsOpen} onOpenChange={setGerenciarTagsOpen} />
      </ModuleLayout>
    </ProtectedRoute>
  );
}
