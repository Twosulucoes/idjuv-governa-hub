/**
 * Validação e fechamento de frequência (chefia / RH).
 *
 * Aba "Abonos": fila de solicitações com aprovação em cadeia (chefia → RH) e rejeição com motivo.
 * Aba "Fechamento": grade servidor × etapas com validação da chefia, consolidação do RH
 * (por linha ou em lote), reabertura com justificativa e fechamento da competência.
 *
 * Premissa da spec: a RLS de hoje só deixa quem tem o módulo RH atualizar; a chefia sem
 * o módulo enxerga a tela mas o banco recusa a ação (policies da chefia ficam para a Onda B).
 */

import { useCallback, useMemo, useState } from "react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClipboardCheck, Search, Lock, ShieldCheck, Inbox, Users } from "lucide-react";
import { useFrequenciaResumo } from "@/hooks/useFrequencia";
import {
  useAprovarSolicitacaoAbono,
  useConfigFechamento,
  useConsolidarFrequenciaLote,
  useConsolidarFrequenciaRH,
  useFecharCompetencia,
  useFechamentosCompetencia,
  useMinhaEquipe,
  useReabrirFrequencia,
  useRejeitarSolicitacaoAbono,
  useSolicitacoesAbono,
  useValidarFrequenciaChefia,
} from "@/hooks/useParametrizacoesFrequencia";
import { MESES } from "@/types/folha";
import {
  STATUS_FECHAMENTO_LABELS,
  STATUS_SOLICITACAO_LABELS,
  type SolicitacaoAbono,
  type StatusSolicitacaoAbono,
} from "@/types/frequencia";
import {
  STATUS_ABONO_EM_ABERTO,
  abonosPendentesNaCompetencia,
  fechamentoTravado,
  type SituacaoFechamentoCompetencia,
} from "@/lib/frequenciaFluxo";
import { FilaAbonosTable } from "@/components/frequencia/validacao/FilaAbonosTable";
import { GradeFechamentoTable, type LinhaFechamento } from "@/components/frequencia/validacao/GradeFechamentoTable";
import { FecharCompetenciaDialog } from "@/components/frequencia/validacao/FecharCompetenciaDialog";

const TODAS = "todas";
const MINHA_EQUIPE = "equipe";
const EM_ABERTO = "em_aberto";
const TODOS_STATUS = "todos";

const STATUS_OPCOES: StatusSolicitacaoAbono[] = ["pendente", "aprovado_chefia", "aprovado", "rejeitado", "cancelado"];

export default function ValidacaoFrequenciaPage() {
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;
  const [ano, setAno] = useState(anoAtual);
  const [mes, setMes] = useState(mesAtual);
  const [filtroUnidade, setFiltroUnidade] = useState(TODAS);
  const [filtroStatus, setFiltroStatus] = useState(EM_ABERTO);
  const [busca, setBusca] = useState("");
  const [selecionados, setSelecionados] = useState<string[]>([]);
  const [abrirFechar, setAbrirFechar] = useState(false);

  // Dados
  const { data: resumo = [], isLoading: loadingResumo } = useFrequenciaResumo(ano, mes);
  const { data: fechamentos = [], isLoading: loadingFechamentos } = useFechamentosCompetencia(ano, mes);
  const { data: configFechamento } = useConfigFechamento(ano, mes);
  const { data: equipe } = useMinhaEquipe();
  const unidadeConcreta = filtroUnidade !== TODAS && filtroUnidade !== MINHA_EQUIPE ? filtroUnidade : undefined;
  const statusFiltro =
    filtroStatus === EM_ABERTO ? STATUS_ABONO_EM_ABERTO : filtroStatus === TODOS_STATUS ? undefined : (filtroStatus as StatusSolicitacaoAbono);
  const { data: fila = [], isLoading: loadingFila } = useSolicitacoesAbono({ status: statusFiltro, unidadeId: unidadeConcreta });
  const { data: emAberto = [] } = useSolicitacoesAbono({ status: STATUS_ABONO_EM_ABERTO });

  // Mutações
  const aprovar = useAprovarSolicitacaoAbono();
  const rejeitar = useRejeitarSolicitacaoAbono();
  const validarChefia = useValidarFrequenciaChefia();
  const consolidarRH = useConsolidarFrequenciaRH();
  const consolidarLote = useConsolidarFrequenciaLote();
  const reabrir = useReabrirFrequencia();
  const fecharCompetencia = useFecharCompetencia();
  const processando =
    aprovar.isPending || rejeitar.isPending || validarChefia.isPending || consolidarRH.isPending ||
    consolidarLote.isPending || reabrir.isPending;

  const competencia = `${MESES[mes - 1]}/${ano}`;
  const anos = Array.from({ length: 3 }, (_, i) => anoAtual - i);
  const equipeIds = useMemo(() => equipe?.unidadeIds ?? [], [equipe]);

  const unidades = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const s of resumo) {
      if (s.servidor_unidade_id && !mapa.has(s.servidor_unidade_id)) {
        mapa.set(s.servidor_unidade_id, s.servidor_unidade || s.servidor_unidade_id);
      }
    }
    return Array.from(mapa.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [resumo]);

  const pertenceAoFiltro = useCallback(
    (unidadeId?: string | null) => {
      if (filtroUnidade === TODAS) return true;
      if (filtroUnidade === MINHA_EQUIPE) return !!unidadeId && equipeIds.includes(unidadeId);
      return unidadeId === filtroUnidade;
    },
    [filtroUnidade, equipeIds],
  );

  const filaFiltrada = useMemo(
    () =>
      fila.filter((s) => {
        if (!pertenceAoFiltro(s.servidor?.unidade_atual_id)) return false;
        if (!busca) return true;
        const termo = busca.toLowerCase();
        return (
          s.servidor?.nome_completo?.toLowerCase().includes(termo) ||
          s.servidor?.matricula?.toLowerCase().includes(termo)
        );
      }),
    [fila, pertenceAoFiltro, busca],
  );

  const linhas: LinhaFechamento[] = useMemo(() => {
    const porServidor = new Map(fechamentos.map((f) => [f.servidor_id, f]));
    return resumo
      .map((s) => ({
        servidor_id: s.servidor_id,
        nome: s.servidor_nome,
        matricula: s.servidor_matricula,
        unidade: s.servidor_unidade,
        unidade_id: s.servidor_unidade_id,
        fechamento: porServidor.get(s.servidor_id) ?? null,
      }))
      .filter((l) => {
        if (!pertenceAoFiltro(l.unidade_id)) return false;
        if (!busca) return true;
        const termo = busca.toLowerCase();
        return l.nome.toLowerCase().includes(termo) || l.matricula?.toLowerCase().includes(termo);
      });
  }, [resumo, fechamentos, pertenceAoFiltro, busca]);

  // Situação geral da competência (independe dos filtros)
  const situacao: SituacaoFechamentoCompetencia = useMemo(() => {
    const porServidor = new Map(fechamentos.map((f) => [f.servidor_id, f]));
    return {
      totalServidores: resumo.length,
      consolidados: resumo.filter((s) => fechamentoTravado(porServidor.get(s.servidor_id))).length,
      abonosPendentes: abonosPendentesNaCompetencia(emAberto, ano, mes),
      statusAtual: configFechamento?.status,
    };
  }, [resumo, fechamentos, emAberto, ano, mes, configFechamento]);

  const competenciaConsolidada = configFechamento?.status === "consolidado";

  // Handlers
  const handleAprovarChefia = (s: SolicitacaoAbono, encerra: boolean) =>
    aprovar.mutate({ id: s.id, nivel: "chefia", encerra });
  const handleAprovarRH = (s: SolicitacaoAbono) => aprovar.mutate({ id: s.id, nivel: "rh" });
  const handleRejeitar = (s: SolicitacaoAbono, motivo: string) => rejeitar.mutateAsync({ id: s.id, motivo });
  const handleValidarChefia = (servidorId: string) => validarChefia.mutate({ servidor_id: servidorId, ano, mes });
  const handleConsolidarRH = (servidorId: string) => {
    consolidarRH.mutate({ servidor_id: servidorId, ano, mes });
    setSelecionados((prev) => prev.filter((id) => id !== servidorId));
  };
  const handleConsolidarLote = async () => {
    await consolidarLote.mutateAsync({ servidorIds: selecionados, ano, mes });
    setSelecionados([]);
  };
  const handleReabrir = (servidorId: string, justificativa: string) =>
    reabrir.mutateAsync({ servidorId, ano, mes, justificativa });
  const handleFecharCompetencia = async () => {
    await fecharCompetencia.mutateAsync({ ano, mes });
    setAbrirFechar(false);
  };

  return (
    <ModuleLayout module="rh">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <ClipboardCheck className="h-8 w-8 text-primary" />
              Validação e Fechamento
            </h1>
            <p className="text-muted-foreground mt-1">
              Abonos, validação da chefia e consolidação do RH em {competencia}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={String(mes)} onValueChange={(v) => { setMes(Number(v)); setSelecionados([]); }}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {MESES.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(ano)} onValueChange={(v) => { setAno(Number(v)); setSelecionados([]); }}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {anos.map((a) => (
                  <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filtroUnidade} onValueChange={setFiltroUnidade}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Unidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODAS}>Todas as unidades</SelectItem>
                {equipeIds.length > 0 && <SelectItem value={MINHA_EQUIPE}>Minha equipe</SelectItem>}
                {unidades.map(([id, nome]) => (
                  <SelectItem key={id} value={id}>{nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Indicadores */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Competência
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={competenciaConsolidada ? "default" : "outline"}>
                {STATUS_FECHAMENTO_LABELS[configFechamento?.status ?? "aberto"]}
              </Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Inbox className="h-4 w-4" />
                Abonos em aberto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${situacao.abonosPendentes > 0 ? "text-warning" : ""}`}>
                {situacao.abonosPendentes}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Consolidados pelo RH
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {situacao.consolidados} <span className="text-base font-normal text-muted-foreground">/ {situacao.totalServidores}</span>
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" />
                Minha equipe
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{equipe?.servidores.length ?? 0}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="abonos">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList>
              <TabsTrigger value="abonos">Abonos</TabsTrigger>
              <TabsTrigger value="fechamento">Fechamento da competência</TabsTrigger>
            </TabsList>
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

          <TabsContent value="abonos" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Solicitações de abono</CardTitle>
                    <CardDescription>
                      Chefia aprova o pendente; RH aprova depois da chefia (ou direto, se o tipo dispensa a chefia).
                    </CardDescription>
                  </div>
                  <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={EM_ABERTO}>Em aberto</SelectItem>
                      {STATUS_OPCOES.map((s) => (
                        <SelectItem key={s} value={s}>{STATUS_SOLICITACAO_LABELS[s]}</SelectItem>
                      ))}
                      <SelectItem value={TODOS_STATUS}>Todos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <FilaAbonosTable
                  solicitacoes={filaFiltrada}
                  isLoading={loadingFila}
                  processando={processando}
                  onAprovarChefia={handleAprovarChefia}
                  onAprovarRH={handleAprovarRH}
                  onRejeitar={handleRejeitar}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fechamento" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Fechamento individual</CardTitle>
                    <CardDescription>
                      Chefia valida, RH consolida. Reabrir exige justificativa e libera novos lançamentos.
                    </CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      disabled={selecionados.length === 0 || processando}
                      onClick={handleConsolidarLote}
                    >
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      Consolidar selecionados ({selecionados.length})
                    </Button>
                    <Button disabled={competenciaConsolidada || processando} onClick={() => setAbrirFechar(true)}>
                      <Lock className="mr-2 h-4 w-4" />
                      {competenciaConsolidada ? "Competência fechada" : "Fechar competência"}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <GradeFechamentoTable
                  linhas={linhas}
                  isLoading={loadingResumo || loadingFechamentos}
                  processando={processando}
                  permiteReabertura={configFechamento?.permite_reabertura ?? true}
                  selecionados={selecionados}
                  onSelecionadosChange={setSelecionados}
                  onValidarChefia={handleValidarChefia}
                  onConsolidarRH={handleConsolidarRH}
                  onReabrir={handleReabrir}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <FecharCompetenciaDialog
        open={abrirFechar}
        onOpenChange={setAbrirFechar}
        ano={ano}
        mes={mes}
        situacao={situacao}
        fechando={fecharCompetencia.isPending}
        onConfirmar={handleFecharCompetencia}
      />
    </ModuleLayout>
  );
}
