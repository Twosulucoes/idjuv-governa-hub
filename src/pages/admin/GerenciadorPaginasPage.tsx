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
import { EmptyState, KpiCard, PageHeader, StatusBadge } from "@/components/design-system";
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
      return <StatusBadge tom="erro">Desativada</StatusBadge>;
    }
    if (pagina.em_manutencao) {
      return <StatusBadge tom="pendente">Manutenção</StatusBadge>;
    }
    return <StatusBadge tom="sucesso">Online</StatusBadge>;
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
    <ModuleLayout module="admin">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Administração", href: "/admin" }, { rotulo: "Páginas públicas" }]}
          titulo="Gerenciador de páginas públicas"
          descricao="Controle o status das páginas públicas do portal"
        />

        {/* Stats rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard rotulo="Total" valor={paginas.length} icone={Globe} carregando={isLoading} />
          <KpiCard
            rotulo="Online"
            valor={paginas.filter((p) => p.ativo && !p.em_manutencao).length}
            icone={CheckCircle}
            carregando={isLoading}
          />
          <KpiCard
            rotulo="Manutenção"
            valor={paginas.filter((p) => p.em_manutencao).length}
            icone={Construction}
            carregando={isLoading}
          />
          <KpiCard
            rotulo="Desativadas"
            valor={paginas.filter((p) => !p.ativo).length}
            icone={XCircle}
            carregando={isLoading}
          />
        </div>

        {/* Busca */}
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Buscar página..."
            aria-label="Buscar página por nome ou rota"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Lista de páginas por grupo */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12" role="status" aria-label="Carregando páginas">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          </div>
        ) : paginasFiltradas.length === 0 ? (
          <EmptyState
            icone={Globe}
            titulo={busca ? "Nenhuma página encontrada" : "Nenhuma página pública configurada"}
            descricao={busca ? "Tente outro termo de busca." : undefined}
          />
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
                        <TableHead>Situação</TableHead>
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
                                aria-label={`${pagina.em_manutencao ? "Retirar de manutenção" : "Colocar em manutenção"}: ${pagina.nome}`}
                                aria-pressed={pagina.em_manutencao}
                              >
                                <Construction className="h-4 w-4" aria-hidden="true" />
                              </Button>

                              {/* Toggle Ativo */}
                              <Button
                                variant={pagina.ativo ? "ghost" : "destructive"}
                                size="sm"
                                onClick={() => handleToggleAtivo(pagina)}
                                disabled={toggleAtivo.isPending}
                                title={pagina.ativo ? "Desativar página" : "Ativar página"}
                                aria-label={`${pagina.ativo ? "Desativar página" : "Ativar página"}: ${pagina.nome}`}
                              >
                                {pagina.ativo ? (
                                  <Power className="h-4 w-4" aria-hidden="true" />
                                ) : (
                                  <PowerOff className="h-4 w-4" aria-hidden="true" />
                                )}
                              </Button>

                              {/* Histórico */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleVerHistorico(pagina)}
                                title="Ver histórico"
                                aria-label={`Ver histórico: ${pagina.nome}`}
                              >
                                <History className="h-4 w-4" aria-hidden="true" />
                              </Button>

                              {/* Link externo */}
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                title="Abrir página"
                              >
                                <a
                                  href={pagina.rota}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label={`Abrir página ${pagina.nome} em nova aba`}
                                >
                                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
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
                <Construction className="h-5 w-5 text-warning" aria-hidden="true" />
                Colocar em manutenção
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
                <History className="h-5 w-5 text-primary" aria-hidden="true" />
                Histórico de alterações
              </DialogTitle>
              <DialogDescription>
                {paginaSelecionada?.nome}
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-96">
              {loadingHistorico ? (
                <div className="flex items-center justify-center py-8" role="status" aria-label="Carregando histórico">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
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
                          <AlertTriangle className={`h-4 w-4 ${acaoInfo.color}`} aria-hidden="true" />
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
