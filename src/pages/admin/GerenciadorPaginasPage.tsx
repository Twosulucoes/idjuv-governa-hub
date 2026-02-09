/**
 * Página de gerenciamento de páginas públicas
 * Permite ativar/desativar e colocar em manutenção
 */

import { useState } from "react";
import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Globe,
  Construction,
  Power,
  PowerOff,
  Settings,
  History,
  ExternalLink,
  Loader2,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import {
  usePaginasPublicas,
  useToggleManutencao,
  useToggleAtivoPagina,
  useAtualizarPagina,
  useHistoricoPagina,
  type ConfigPaginaPublica,
} from "@/hooks/useConfigPaginasPublicas";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function GerenciadorPaginasPage() {
  const { data: paginas = [], isLoading } = usePaginasPublicas();
  const toggleManutencao = useToggleManutencao();
  const toggleAtivo = useToggleAtivoPagina();
  const atualizarPagina = useAtualizarPagina();

  const [busca, setBusca] = useState("");
  const [paginaSelecionada, setPaginaSelecionada] = useState<ConfigPaginaPublica | null>(null);
  const [modalConfig, setModalConfig] = useState(false);
  const [modalHistorico, setModalHistorico] = useState(false);

  // Estado do formulário de configuração
  const [configForm, setConfigForm] = useState({
    titulo_manutencao: "",
    mensagem_manutencao: "",
    previsao_retorno: "",
  });

  const { data: historico = [], isLoading: loadingHistorico } = useHistoricoPagina(
    modalHistorico ? paginaSelecionada?.id || null : null
  );

  // Filtrar páginas
  const paginasFiltradas = paginas.filter(
    (p) =>
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      p.rota.toLowerCase().includes(busca.toLowerCase())
  );

  // Agrupar por seção
  const grupos = paginasFiltradas.reduce((acc, pagina) => {
    const grupo = pagina.codigo.split("_")[0];
    const nomeGrupo = {
      portal: "Portal Institucional",
      transparencia: "Transparência",
      integridade: "Integridade",
      selecoes: "Seletivas Estudantis",
      cadastro: "Cadastros Públicos",
    }[grupo] || "Outras";

    if (!acc[nomeGrupo]) acc[nomeGrupo] = [];
    acc[nomeGrupo].push(pagina);
    return acc;
  }, {} as Record<string, ConfigPaginaPublica[]>);

  const handleToggleManutencao = (pagina: ConfigPaginaPublica) => {
    if (!pagina.em_manutencao) {
      // Abrir modal para configurar mensagem antes de ativar manutenção
      setPaginaSelecionada(pagina);
      setConfigForm({
        titulo_manutencao: pagina.titulo_manutencao || "Página em Manutenção",
        mensagem_manutencao: pagina.mensagem_manutencao || "Esta página está temporariamente em manutenção. Voltaremos em breve!",
        previsao_retorno: pagina.previsao_retorno?.slice(0, 16) || "",
      });
      setModalConfig(true);
    } else {
      // Desativar manutenção diretamente
      toggleManutencao.mutate({
        id: pagina.id,
        emManutencao: false,
      });
    }
  };

  const handleConfirmarManutencao = () => {
    if (!paginaSelecionada) return;

    toggleManutencao.mutate({
      id: paginaSelecionada.id,
      emManutencao: true,
      titulo: configForm.titulo_manutencao,
      mensagem: configForm.mensagem_manutencao,
      previsao: configForm.previsao_retorno || null,
    });

    setModalConfig(false);
    setPaginaSelecionada(null);
  };

  const handleToggleAtivo = (pagina: ConfigPaginaPublica) => {
    toggleAtivo.mutate({
      id: pagina.id,
      ativo: !pagina.ativo,
    });
  };

  const handleVerHistorico = (pagina: ConfigPaginaPublica) => {
    setPaginaSelecionada(pagina);
    setModalHistorico(true);
  };

  const getStatusBadge = (pagina: ConfigPaginaPublica) => {
    if (!pagina.ativo) {
      return (
        <Badge variant="destructive" className="gap-1">
          <PowerOff className="h-3 w-3" />
          Desativada
        </Badge>
      );
    }
    if (pagina.em_manutencao) {
      return (
        <Badge variant="outline" className="gap-1 border-warning text-warning">
          <Construction className="h-3 w-3" />
          Manutenção
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1 bg-success/20 text-success">
        <CheckCircle className="h-3 w-3" />
        Online
      </Badge>
    );
  };

  const getAcaoLabel = (acao: string) => {
    const labels: Record<string, { label: string; color: string }> = {
      ativar: { label: "Ativou", color: "text-success" },
      desativar: { label: "Desativou", color: "text-destructive" },
      manutencao_on: { label: "Manutenção ON", color: "text-warning" },
      manutencao_off: { label: "Manutenção OFF", color: "text-success" },
      atualizar: { label: "Atualizou", color: "text-muted-foreground" },
    };
    return labels[acao] || { label: acao, color: "text-muted-foreground" };
  };

  return (
    <ModuleLayout module="admin" title="Gerenciador de Páginas">
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Globe className="h-6 w-6 text-primary" />
              Gerenciador de Páginas Públicas
            </h1>
            <p className="text-muted-foreground">
              Controle o status das páginas públicas do portal
            </p>
          </div>

          {/* Busca */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar página..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{paginas.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-success/10">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {paginas.filter((p) => p.ativo && !p.em_manutencao).length}
                </p>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-warning/10">
                <Construction className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {paginas.filter((p) => p.em_manutencao).length}
                </p>
                <p className="text-xs text-muted-foreground">Manutenção</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-full bg-destructive/10">
                <XCircle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {paginas.filter((p) => !p.ativo).length}
                </p>
                <p className="text-xs text-muted-foreground">Desativadas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de páginas por grupo */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(grupos).map(([grupo, paginasGrupo]) => (
              <Card key={grupo}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{grupo}</CardTitle>
                  <CardDescription>
                    {paginasGrupo.length} página(s)
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Página</TableHead>
                        <TableHead>Rota</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Atualizado</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginasGrupo.map((pagina) => (
                        <TableRow key={pagina.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{pagina.nome}</p>
                              {pagina.descricao && (
                                <p className="text-xs text-muted-foreground">
                                  {pagina.descricao}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {pagina.rota}
                            </code>
                          </TableCell>
                          <TableCell>{getStatusBadge(pagina)}</TableCell>
                          <TableCell>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(pagina.updated_at), {
                                locale: ptBR,
                                addSuffix: true,
                              })}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {/* Toggle Manutenção */}
                              <Button
                                variant={pagina.em_manutencao ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleToggleManutencao(pagina)}
                                disabled={!pagina.ativo || toggleManutencao.isPending}
                                title={pagina.em_manutencao ? "Retirar de manutenção" : "Colocar em manutenção"}
                              >
                                <Construction className="h-4 w-4" />
                              </Button>

                              {/* Toggle Ativo */}
                              <Button
                                variant={pagina.ativo ? "ghost" : "destructive"}
                                size="sm"
                                onClick={() => handleToggleAtivo(pagina)}
                                disabled={toggleAtivo.isPending}
                                title={pagina.ativo ? "Desativar página" : "Ativar página"}
                              >
                                {pagina.ativo ? (
                                  <Power className="h-4 w-4" />
                                ) : (
                                  <PowerOff className="h-4 w-4" />
                                )}
                              </Button>

                              {/* Histórico */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleVerHistorico(pagina)}
                                title="Ver histórico"
                              >
                                <History className="h-4 w-4" />
                              </Button>

                              {/* Link externo */}
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                title="Abrir página"
                              >
                                <a href={pagina.rota} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Modal de Configuração de Manutenção */}
        <Dialog open={modalConfig} onOpenChange={setModalConfig}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Construction className="h-5 w-5 text-warning" />
                Colocar em Manutenção
              </DialogTitle>
              <DialogDescription>
                Configure a mensagem que será exibida aos visitantes
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  value={configForm.titulo_manutencao}
                  onChange={(e) =>
                    setConfigForm((prev) => ({
                      ...prev,
                      titulo_manutencao: e.target.value,
                    }))
                  }
                  placeholder="Página em Manutenção"
                />
              </div>

              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea
                  value={configForm.mensagem_manutencao}
                  onChange={(e) =>
                    setConfigForm((prev) => ({
                      ...prev,
                      mensagem_manutencao: e.target.value,
                    }))
                  }
                  placeholder="Descreva o motivo da manutenção..."
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Previsão de Retorno (opcional)</Label>
                <Input
                  type="datetime-local"
                  value={configForm.previsao_retorno}
                  onChange={(e) =>
                    setConfigForm((prev) => ({
                      ...prev,
                      previsao_retorno: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setModalConfig(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleConfirmarManutencao}
                disabled={toggleManutencao.isPending}
                className="bg-warning text-warning-foreground hover:bg-warning/90"
              >
                {toggleManutencao.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Ativar Manutenção
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal de Histórico */}
        <Dialog open={modalHistorico} onOpenChange={setModalHistorico}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                Histórico de Alterações
              </DialogTitle>
              <DialogDescription>
                {paginaSelecionada?.nome}
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-96">
              {loadingHistorico ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : historico.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma alteração registrada
                </p>
              ) : (
                <div className="space-y-3">
                  {historico.map((item) => {
                    const acaoInfo = getAcaoLabel(item.acao);
                    return (
                      <div
                        key={item.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        <div className="p-2 rounded-full bg-background">
                          <AlertTriangle className={`h-4 w-4 ${acaoInfo.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${acaoInfo.color}`}>
                            {acaoInfo.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(
                              new Date(item.created_at),
                              "dd/MM/yyyy 'às' HH:mm",
                              { locale: ptBR }
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => setModalHistorico(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ModuleLayout>
  );
}
