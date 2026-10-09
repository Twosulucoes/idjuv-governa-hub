/**
 * Minha Frequência — autoatendimento do servidor.
 *
 * Mostra o resumo mensal da própria frequência, a situação do fechamento
 * (validação da chefia / consolidação do RH) e as solicitações de abono do
 * servidor, com botão para abrir uma nova. Mesmo padrão de MeusDadosPage:
 * quem não tem servidor vinculado recebe o alerta para procurar o RH.
 */

import { useState } from "react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarCheck, AlertCircle, Plus, CheckCircle, Clock, Lock, AlertTriangle } from "lucide-react";
import { useMeuServidor } from "@/hooks/useMeusDados";
import { useFrequenciaMensal } from "@/hooks/useFrequencia";
import {
  useConfigFechamento,
  useFechamentoServidor,
  useSolicitacoesAbono,
  useSalvarSolicitacaoAbono,
} from "@/hooks/useParametrizacoesFrequencia";
import { MESES } from "@/types/folha";
import { STATUS_FECHAMENTO_LABELS } from "@/types/frequencia";
import { lancamentoBloqueado } from "@/lib/frequenciaFluxo";
import { SolicitarAbonoDialog } from "@/components/frequencia/SolicitarAbonoDialog";
import { MinhasSolicitacoesAbonoTable } from "@/components/frequencia/MinhasSolicitacoesAbonoTable";

function Indicador({ label, value, destaque }: { label: string; value: number | string; destaque?: "destructive" }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-bold ${destaque === "destructive" ? "text-destructive" : ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function EtapaFechamento({ feita, label, quando }: { feita: boolean; label: string; quando?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {feita ? <CheckCircle className="h-4 w-4 text-success" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
      <span className={feita ? "text-foreground" : "text-muted-foreground"}>{label}</span>
      {feita && quando && (
        <span className="text-xs text-muted-foreground">em {new Date(quando).toLocaleDateString("pt-BR")}</span>
      )}
    </div>
  );
}

export default function MinhaFrequenciaPage() {
  const anoAtual = new Date().getFullYear();
  const mesAtual = new Date().getMonth() + 1;
  const [ano, setAno] = useState(anoAtual);
  const [mes, setMes] = useState(mesAtual);
  const [abrirSolicitacao, setAbrirSolicitacao] = useState(false);

  const { data: servidor, isLoading } = useMeuServidor();
  const { data: resumo, isLoading: loadingResumo } = useFrequenciaMensal(servidor?.id, ano, mes);
  const { data: fechamento } = useFechamentoServidor(servidor?.id, ano, mes);
  const { data: configFechamento } = useConfigFechamento(ano, mes);
  const { data: solicitacoes = [], isLoading: loadingSolicitacoes } = useSolicitacoesAbono({
    servidorId: servidor?.id,
    enabled: !!servidor?.id,
  });
  const salvarSolicitacao = useSalvarSolicitacaoAbono();

  const anos = Array.from({ length: 3 }, (_, i) => anoAtual - i);
  const competencia = `${MESES[mes - 1]}/${ano}`;
  const consolidada = lancamentoBloqueado(configFechamento?.status, fechamento).bloqueado;

  if (isLoading) {
    return (
      <ModuleLayout module="rh">
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </ModuleLayout>
    );
  }

  if (!servidor) {
    return (
      <ModuleLayout module="rh">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-primary" />
            Minha Frequência
          </h1>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Seu usuário não está vinculado a um cadastro de servidor.
              Entre em contato com o RH para regularizar seu acesso.
            </AlertDescription>
          </Alert>
        </div>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout module="rh">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <CalendarCheck className="h-6 w-6 text-primary" />
              Minha Frequência
            </h1>
            <p className="text-muted-foreground">
              {servidor.nome_social || servidor.nome_completo}
              {servidor.matricula ? ` · Matrícula ${servidor.matricula}` : ""}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Mês" />
              </SelectTrigger>
              <SelectContent>
                {MESES.map((m, i) => (
                  <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Ano" />
              </SelectTrigger>
              <SelectContent>
                {anos.map((a) => (
                  <SelectItem key={a} value={String(a)}>{a}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setAbrirSolicitacao(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Solicitar abono
            </Button>
          </div>
        </div>

        {consolidada && (
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertDescription>
              A frequência de {competencia} já foi consolidada pelo RH. Correções dependem de reabertura pelo RH.
            </AlertDescription>
          </Alert>
        )}

        {/* Resumo mensal */}
        {loadingResumo ? (
          <Skeleton className="h-24 w-full" />
        ) : resumo ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <Indicador label="Dias trabalhados" value={resumo.dias_trabalhados ?? 0} />
            <Indicador label="Faltas" value={resumo.dias_falta ?? 0} destaque={(resumo.dias_falta ?? 0) > 0 ? "destructive" : undefined} />
            <Indicador label="Atestados" value={resumo.dias_atestado ?? 0} />
            <Indicador label="Férias / Licenças" value={(resumo.dias_ferias ?? 0) + (resumo.dias_licenca ?? 0)} />
            <Indicador label="Presença" value={`${Number(resumo.percentual_presenca ?? 0).toFixed(1)}%`} />
          </div>
        ) : (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Ainda não há resumo de frequência calculado para {competencia}.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Situação do fechamento */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Fechamento de {competencia}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                Competência:
                <Badge variant="outline">
                  {STATUS_FECHAMENTO_LABELS[configFechamento?.status ?? "aberto"]}
                </Badge>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <EtapaFechamento feita={!!fechamento?.validado_chefia} label="Validada pela chefia" quando={fechamento?.validado_chefia_em} />
              <EtapaFechamento feita={!!fechamento?.consolidado_rh} label="Consolidada pelo RH" quando={fechamento?.consolidado_rh_em} />
              {fechamento?.reaberto && (
                <div className="text-sm text-warning flex items-start gap-2 pt-1">
                  <AlertTriangle className="h-4 w-4 mt-0.5" />
                  <span>
                    Reaberta pelo RH
                    {fechamento.justificativa_reabertura ? `: ${fechamento.justificativa_reabertura}` : "."}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Solicitações de abono */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Minhas solicitações de abono</CardTitle>
              <CardDescription>Todas as suas solicitações, da mais recente para a mais antiga.</CardDescription>
            </CardHeader>
            <CardContent>
              <MinhasSolicitacoesAbonoTable solicitacoes={solicitacoes} isLoading={loadingSolicitacoes} />
            </CardContent>
          </Card>
        </div>
      </div>

      <SolicitarAbonoDialog
        open={abrirSolicitacao}
        onOpenChange={setAbrirSolicitacao}
        servidorId={servidor.id}
        ano={ano}
        mes={mes}
        salvando={salvarSolicitacao.isPending}
        onSalvar={(input) => salvarSolicitacao.mutateAsync(input)}
      />
    </ModuleLayout>
  );
}
