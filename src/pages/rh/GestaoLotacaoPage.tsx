import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Users,
  Building2,
  UserCheck,
  UserX,
  UserMinus,
  History,
  RefreshCw,
  Filter,
  LayoutDashboard,
  Briefcase,
} from "lucide-react";
import {
  useServidoresGestao,
  useEstatisticasLotacao,
  useUnidadesGestao,
  useCargosVagos,
  type ServidorGestao,
} from "@/hooks/useGestaoLotacao";
import { LotarServidorModal } from "@/components/rh/gestao-lotacao/LotarServidorModal";
import { ExonerarServidorModal } from "@/components/rh/gestao-lotacao/ExonerarServidorModal";
import { HistoricoServidorModal } from "@/components/rh/gestao-lotacao/HistoricoServidorModal";

type StatusFiltro = 'todos' | 'lotado' | 'vagando' | 'exonerado';

export default function GestaoLotacaoPage() {
  // Filtros
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>("todos");
  const [unidadeFiltro, setUnidadeFiltro] = useState<string>("");

  // Modais
  const [servidorSelecionado, setServidorSelecionado] = useState<ServidorGestao | null>(null);
  const [modalLotar, setModalLotar] = useState(false);
  const [modalExonerar, setModalExonerar] = useState(false);
  const [modalHistorico, setModalHistorico] = useState(false);

  // Dados
  const { data: servidores = [], isLoading: loadingServidores, refetch } = useServidoresGestao({
    status: statusFiltro,
    unidadeId: unidadeFiltro || undefined,
    busca: busca || undefined,
  });
  const { data: estatisticas, isLoading: loadingStats } = useEstatisticasLotacao();
  const { data: unidades = [] } = useUnidadesGestao();
  const { data: cargos = [] } = useCargosVagos();

  const cargosComVagas = cargos.filter(c => c.vagas_disponiveis > 0).length;

  // Handlers
  const handleLotar = (servidor: ServidorGestao) => {
    setServidorSelecionado(servidor);
    setModalLotar(true);
  };

  const handleExonerar = (servidor: ServidorGestao) => {
    setServidorSelecionado(servidor);
    setModalExonerar(true);
  };

  const handleHistorico = (servidor: ServidorGestao) => {
    setServidorSelecionado(servidor);
    setModalHistorico(true);
  };

  const handleCruzamento = () => {
    refetch();
  };

  // Componente de badge de status
  const StatusBadge = ({ status }: { status: ServidorGestao['status_lotacao'] }) => {
    const configs = {
      lotado: { label: 'LOTADO', className: 'bg-success text-success-foreground' },
      vagando: { label: 'VAGANDO', className: 'bg-warning text-warning-foreground' },
      exonerado: { label: 'EXONERADO', className: 'bg-destructive text-destructive-foreground' },
    };
    const config = configs[status];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-lg font-semibold">Gestão de Lotação</h1>
              <p className="text-xs text-muted-foreground">Sistema de Gestão Inteligente</p>
            </div>
          </div>

          {/* Busca Global */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou matrícula..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Botão de Cruzamento */}
          <Button onClick={handleCruzamento} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Cruzar Dados
          </Button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="container px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          {/* Coluna Esquerda - Filtros e Estatísticas */}
          <aside className="space-y-6">
            {/* Estatísticas */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Estatísticas em Tempo Real
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadingStats ? (
                  <>
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </>
                ) : (
                  <>
                    {/* Servidores Lotados */}
                    <div 
                      className="flex items-center justify-between p-3 rounded-lg bg-success/10 border border-success/20 cursor-pointer hover:bg-success/20 transition-colors"
                      onClick={() => setStatusFiltro('lotado')}
                    >
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-success" />
                        <span className="text-sm">Servidores Lotados</span>
                      </div>
                      <span className="text-2xl font-bold text-success">
                        {estatisticas?.servidores_lotados || 0}
                      </span>
                    </div>

                    {/* Servidores Vagando */}
                    <div 
                      className="flex items-center justify-between p-3 rounded-lg bg-warning/10 border border-warning/20 cursor-pointer hover:bg-warning/20 transition-colors"
                      onClick={() => setStatusFiltro('vagando')}
                    >
                      <div className="flex items-center gap-2">
                        <UserX className="h-5 w-5 text-warning" />
                        <span className="text-sm">Servidores Vagando</span>
                      </div>
                      <span className="text-2xl font-bold text-warning">
                        {estatisticas?.servidores_vagando || 0}
                      </span>
                    </div>

                    {/* Servidores Exonerados */}
                    <div 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted border cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={() => setStatusFiltro('exonerado')}
                    >
                      <div className="flex items-center gap-2">
                        <UserMinus className="h-5 w-5 text-muted-foreground" />
                        <span className="text-sm">Exonerados/Inativos</span>
                      </div>
                      <span className="text-2xl font-bold text-muted-foreground">
                        {estatisticas?.servidores_exonerados || 0}
                      </span>
                    </div>

                    <hr className="my-2" />

                    {/* Cargos Vagos */}
                    <div className="flex items-center justify-between p-3 rounded-lg bg-info/10 border border-info/20">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-info" />
                        <span className="text-sm">Cargos com Vagas</span>
                      </div>
                      <span className="text-2xl font-bold text-info">
                        {cargosComVagas}
                      </span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Filtros */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Situação</label>
                  <Select value={statusFiltro} onValueChange={(v) => setStatusFiltro(v as StatusFiltro)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="lotado">Lotados</SelectItem>
                      <SelectItem value="vagando">Vagando</SelectItem>
                      <SelectItem value="exonerado">Exonerados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Unidade */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Unidade</label>
                  <Select 
                    value={unidadeFiltro || "_all"} 
                    onValueChange={(v) => setUnidadeFiltro(v === "_all" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Todas as unidades" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_all">Todas as unidades</SelectItem>
                      {unidades.map((u: any) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.sigla && `${u.sigla} - `}{u.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Limpar Filtros */}
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setStatusFiltro('todos');
                    setUnidadeFiltro('');
                    setBusca('');
                  }}
                >
                  Limpar Filtros
                </Button>
              </CardContent>
            </Card>

            {/* Cargos com Vagas */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Cargos com Vagas Disponíveis
                </CardTitle>
                <CardDescription className="text-xs">
                  Clique para ver detalhes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[200px] pr-2">
                  <div className="space-y-2">
                    {cargos
                      .filter(c => c.vagas_disponiveis > 0)
                      .slice(0, 10)
                      .map((cargo) => (
                        <div
                          key={cargo.id}
                          className="flex items-center justify-between p-2 rounded-md bg-muted/50 hover:bg-muted transition-colors text-sm"
                        >
                          <div>
                            <p className="font-medium">{cargo.sigla || cargo.nome}</p>
                            {cargo.sigla && <p className="text-xs text-muted-foreground">{cargo.nome}</p>}
                          </div>
                          <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                            {cargo.vagas_disponiveis} vaga{cargo.vagas_disponiveis > 1 ? 's' : ''}
                          </Badge>
                        </div>
                      ))}
                    {cargosComVagas === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhum cargo com vagas disponíveis.
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </aside>

          {/* Coluna Direita - Tabela */}
          <main>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Servidores
                    </CardTitle>
                    <CardDescription>
                      {servidores.length} servidor{servidores.length !== 1 ? 'es' : ''} encontrado{servidores.length !== 1 ? 's' : ''}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingServidores ? (
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : servidores.length === 0 ? (
                  <div className="py-12 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">
                      Nenhum servidor encontrado com os filtros aplicados.
                    </p>
                    <Button 
                      variant="link" 
                      onClick={() => {
                        setStatusFiltro('todos');
                        setUnidadeFiltro('');
                        setBusca('');
                      }}
                    >
                      Limpar filtros
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="h-[calc(100vh-320px)]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[300px]">Servidor</TableHead>
                          <TableHead>Cargo Atual</TableHead>
                          <TableHead>Unidade</TableHead>
                          <TableHead className="text-center">Status</TableHead>
                          <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {servidores.map((servidor) => (
                          <TableRow key={servidor.id}>
                            {/* Servidor */}
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                  <AvatarImage src={servidor.foto_url || undefined} />
                                  <AvatarFallback className="text-xs">
                                    {servidor.nome_completo.split(' ').slice(0, 2).map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{servidor.nome_completo}</p>
                                  {servidor.matricula && (
                                    <p className="text-xs text-muted-foreground">Mat: {servidor.matricula}</p>
                                  )}
                                </div>
                              </div>
                            </TableCell>

                            {/* Cargo */}
                            <TableCell>
                              {servidor.cargo_nome ? (
                                <div>
                                  <p className="text-sm font-medium">{servidor.cargo_sigla || servidor.cargo_nome}</p>
                                  {servidor.cargo_sigla && (
                                    <p className="text-xs text-muted-foreground">{servidor.cargo_nome}</p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>

                            {/* Unidade */}
                            <TableCell>
                              {servidor.unidade_nome ? (
                                <div className="flex items-center gap-1">
                                  <Building2 className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-sm">{servidor.unidade_sigla || servidor.unidade_nome}</span>
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>

                            {/* Status */}
                            <TableCell className="text-center">
                              <StatusBadge status={servidor.status_lotacao} />
                            </TableCell>

                            {/* Ações */}
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                {/* Histórico (sempre visível) */}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleHistorico(servidor)}
                                  title="Ver histórico"
                                >
                                  <History className="h-4 w-4" />
                                </Button>

                                {/* Lotar (apenas para vagando) */}
                                {servidor.status_lotacao === 'vagando' && (
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={() => handleLotar(servidor)}
                                    className="bg-success hover:bg-success/90"
                                  >
                                    LOTAR
                                  </Button>
                                )}

                                {/* Exonerar (apenas para lotado) */}
                                {servidor.status_lotacao === 'lotado' && (
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleExonerar(servidor)}
                                  >
                                    EXONERAR
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>

      {/* Modais */}
      <LotarServidorModal
        servidor={servidorSelecionado}
        open={modalLotar}
        onOpenChange={setModalLotar}
      />
      <ExonerarServidorModal
        servidor={servidorSelecionado}
        open={modalExonerar}
        onOpenChange={setModalExonerar}
      />
      <HistoricoServidorModal
        servidor={servidorSelecionado}
        open={modalHistorico}
        onOpenChange={setModalHistorico}
      />
    </div>
  );
}
