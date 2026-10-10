/**
 * MURAL DE AVISOS E DATAS IMPORTANTES
 *
 * Para qualquer usuário logado: mural com os avisos vigentes do seu público e calendário do mês
 * (datas cadastradas, feriados e aniversariantes). A aba Gerenciar aparece para quem tem
 * avisos.gerenciar — a mesma permissão que a RLS exige para escrever.
 */

import { useMemo, useState } from "react";
import { addMonths, format, endOfMonth, startOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, Check, ChevronLeft, ChevronRight, Megaphone, Pencil, Plus, Settings2, Trash2 } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable, EmptyState, PageHeader, StatusBadge, type ColunaTabela, type TomStatus } from "@/components/design-system";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useModuleRouter } from "@/hooks/useModuleRouter";
import { avisoVigente, useAvisosGestao, useAvisosVigentes, useMarcarAvisoLido } from "@/hooks/useAvisos";
import { useDatasImportantes, useDatasImportantesGestao } from "@/hooks/useDatasImportantes";
import { AvisoFormDialog, DataImportanteFormDialog } from "@/components/avisos";
import { AvisoLink } from "@/components/avisos/AvisoLink";
import { PRIORIDADE_AVISO_ESTILO, TIPO_DATA_ESTILO, diaMes } from "@/components/avisos/avisosVisual";
import { MODULES_CONFIG } from "@/shared/config/modules.config";
import {
  PERMISSAO_GERENCIAR_AVISOS,
  PRIORIDADE_AVISO_LABEL,
  TIPO_DATA_LABEL,
  type Aviso,
  type DataImportante,
  type EventoDataImportante,
} from "@/types/avisos";

const formatarDataHora = (iso: string) => format(new Date(iso), "dd/MM/yyyy HH:mm");
const tituloMes = (mes: Date) => {
  const texto = format(mes, "MMMM 'de' yyyy", { locale: ptBR });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};
const nomeModulo = (codigo: string) => MODULES_CONFIG.find((m) => m.codigo === codigo)?.nome ?? codigo;

// ---------------------------------------------------------------------------
// Mural
// ---------------------------------------------------------------------------

function MuralAvisos() {
  const { data: avisos = [], isLoading } = useAvisosVigentes();
  const marcarLido = useMarcarAvisoLido();

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  if (avisos.length === 0) {
    return (
      <Card>
        <EmptyState icone={Megaphone} titulo="Nenhum aviso no momento" />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {avisos.map((aviso) => {
        const { borda, texto, icone: Icone } = PRIORIDADE_AVISO_ESTILO[aviso.prioridade];
        return (
          <Card key={aviso.id} className={cn(!aviso.lido && ["border-l-4", borda])}>
            <CardHeader className="pb-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 items-start gap-2">
                  <Icone className={cn("mt-0.5 h-5 w-5 shrink-0", texto)} aria-hidden="true" />
                  <div className="min-w-0">
                    <h2 className="break-words text-h3 text-foreground">{aviso.titulo}</h2>
                    <CardDescription>Publicado em {formatarDataHora(aviso.inicio_em)}</CardDescription>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-1">
                  <Badge variant="outline">{PRIORIDADE_AVISO_LABEL[aviso.prioridade]}</Badge>
                  {aviso.lido ? (
                    <StatusBadge tom="neutro">Lido</StatusBadge>
                  ) : (
                    <StatusBadge tom="andamento">Novo</StatusBadge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="whitespace-pre-line break-words text-body">{aviso.conteudo}</p>
              <div className="flex flex-wrap items-center gap-3">
                {aviso.link && <AvisoLink href={aviso.link} className="text-primary" />}
                {aviso.expira_em && (
                  <span className="text-caption text-muted-foreground">Válido até {formatarDataHora(aviso.expira_em)}</span>
                )}
                {!aviso.lido && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="ml-auto"
                    disabled={marcarLido.isPending}
                    onClick={() => marcarLido.mutate([aviso.id])}
                  >
                    <Check className="mr-1 h-4 w-4" aria-hidden="true" /> Marcar como lido
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calendário do mês
// ---------------------------------------------------------------------------

function CalendarioMes() {
  const [mes, setMes] = useState(() => startOfMonth(new Date()));
  const { data: eventos = [], isLoading } = useDatasImportantes({ inicio: mes, fim: endOfMonth(mes) });

  const porDia = useMemo(() => {
    const mapa = new Map<string, EventoDataImportante[]>();
    eventos.forEach((e) => mapa.set(e.data, [...(mapa.get(e.data) ?? []), e]));
    return [...mapa.entries()];
  }, [eventos]);

  const hoje = format(new Date(), "yyyy-MM-dd");

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0">
        <Button variant="outline" size="icon" aria-label="Mês anterior" onClick={() => setMes((m) => subMonths(m, 1))}>
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <h2 className="text-center text-h3 text-foreground" aria-live="polite">
          {tituloMes(mes)}
        </h2>
        <Button variant="outline" size="icon" aria-label="Próximo mês" onClick={() => setMes((m) => addMonths(m, 1))}>
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : porDia.length === 0 ? (
          <EmptyState icone={CalendarDays} titulo="Nenhuma data neste mês" />
        ) : (
          <ul className="divide-y">
            {porDia.map(([dia, lista]) => (
              <li key={dia} className="flex gap-3 py-3">
                <div
                  className={cn(
                    "flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-md border text-caption",
                    dia === hoje && "border-primary bg-primary text-primary-foreground",
                  )}
                >
                  <span className="text-lg font-bold leading-none">{dia.slice(8, 10)}</span>
                  {dia === hoje && <span className="sr-only">(hoje)</span>}
                  <span className="capitalize">{format(new Date(`${dia}T12:00:00`), "EEE", { locale: ptBR })}</span>
                </div>
                <ul className="min-w-0 flex-1 space-y-1.5">
                  {lista.map((e) => (
                    <li key={e.id} className="flex flex-wrap items-center gap-2">
                      <span className={cn("rounded px-1.5 py-0.5 text-caption font-medium", TIPO_DATA_ESTILO[e.tipo])}>
                        {TIPO_DATA_LABEL[e.tipo]}
                      </span>
                      <span className="min-w-0 break-words text-body font-medium">{e.titulo}</span>
                      {e.dataFim && e.dataFim !== e.data && (
                        <span className="text-caption text-muted-foreground">até {diaMes(e.dataFim)}</span>
                      )}
                      {e.descricao && <p className="w-full text-caption text-muted-foreground">{e.descricao}</p>}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Gestão (avisos.gerenciar)
// ---------------------------------------------------------------------------

// Situação do aviso → selo (texto + tom; nunca só cor)
function situacaoAviso(aviso: Aviso): { label: string; tom: TomStatus } {
  if (!aviso.ativo) return { label: "Inativo", tom: "neutro" };
  if (avisoVigente(aviso)) return { label: "No ar", tom: "sucesso" };
  if (new Date(aviso.inicio_em) > new Date()) return { label: "Agendado", tom: "pendente" };
  return { label: "Expirado", tom: "neutro" };
}

const dataDaLista = (d: DataImportante) =>
  d.recorrente_anual ? `${diaMes(d.data)} (anual)` : d.data.split("-").reverse().join("/");

type AvisoGestao = Aviso & { leituras: number };

type Exclusao = { tipo: "aviso" | "data"; id: string; titulo: string } | null;

function Gestao() {
  const avisosGestao = useAvisosGestao(true);
  const datasGestao = useDatasImportantesGestao(true);
  const [avisoEditando, setAvisoEditando] = useState<Aviso | null>(null);
  const [avisoAberto, setAvisoAberto] = useState(false);
  const [dataEditando, setDataEditando] = useState<DataImportante | null>(null);
  const [dataAberta, setDataAberta] = useState(false);
  const [exclusao, setExclusao] = useState<Exclusao>(null);

  const confirmarExclusao = () => {
    if (!exclusao) return;
    if (exclusao.tipo === "aviso") avisosGestao.excluir.mutate(exclusao.id);
    else datasGestao.excluir.mutate(exclusao.id);
    setExclusao(null);
  };

  const colunasAvisos: ColunaTabela<AvisoGestao>[] = [
    {
      id: "titulo",
      cabecalho: "Título",
      mobile: "titulo",
      ordenarPor: (aviso) => aviso.titulo,
      buscarPor: (aviso) => aviso.titulo,
      celula: (aviso) => (
        <>
          <p className="font-medium">{aviso.titulo}</p>
          <p className="text-caption text-muted-foreground">
            {PRIORIDADE_AVISO_LABEL[aviso.prioridade]}
            {aviso.destaque && " · em destaque"} · {formatarDataHora(aviso.inicio_em)}
          </p>
        </>
      ),
    },
    {
      id: "situacao",
      cabecalho: "Situação",
      ordenarPor: (aviso) => situacaoAviso(aviso).label,
      celula: (aviso) => {
        const situacao = situacaoAviso(aviso);
        return <StatusBadge tom={situacao.tom}>{situacao.label}</StatusBadge>;
      },
    },
    {
      id: "para",
      cabecalho: "Para",
      buscarPor: (aviso) => (aviso.publico === "todos" ? "Todos" : aviso.modulos_alvo.map(nomeModulo).join(", ")),
      celula: (aviso) => (aviso.publico === "todos" ? "Todos" : aviso.modulos_alvo.map(nomeModulo).join(", ")),
    },
    {
      id: "leituras",
      cabecalho: "Leituras",
      alinhamento: "direita",
      ordenarPor: (aviso) => aviso.leituras,
      celula: (aviso) => aviso.leituras,
    },
  ];

  const colunasDatas: ColunaTabela<DataImportante>[] = [
    {
      id: "data",
      cabecalho: "Data",
      ordenarPor: (d) => d.data,
      celula: (d) => <span className="whitespace-nowrap font-mono text-caption">{dataDaLista(d)}</span>,
    },
    {
      id: "titulo",
      cabecalho: "Título",
      mobile: "titulo",
      ordenarPor: (d) => d.titulo,
      buscarPor: (d) => d.titulo,
      celula: (d) => (
        <>
          <p className="font-medium">{d.titulo}</p>
          <p className="text-caption text-muted-foreground">
            {TIPO_DATA_LABEL[d.tipo]}
            {!d.ativo && " · inativa"}
          </p>
        </>
      ),
    },
    {
      id: "para",
      cabecalho: "Para",
      buscarPor: (d) => (d.modulos_alvo.length === 0 ? "Todos" : d.modulos_alvo.map(nomeModulo).join(", ")),
      celula: (d) => (d.modulos_alvo.length === 0 ? "Todos" : d.modulos_alvo.map(nomeModulo).join(", ")),
    },
  ];

  return (
    <div className="space-y-8">
      <section aria-labelledby="gestao-avisos" className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="gestao-avisos" className="text-h2 text-foreground">Avisos</h2>
            <p className="text-body text-muted-foreground">Publicados, agendados e expirados.</p>
          </div>
          <Button
            onClick={() => {
              setAvisoEditando(null);
              setAvisoAberto(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" aria-hidden="true" /> Novo aviso
          </Button>
        </div>
        <DataTable
          rotulo="Avisos"
          dados={avisosGestao.avisos}
          colunas={colunasAvisos}
          chaveLinha={(aviso) => aviso.id}
          carregando={avisosGestao.isLoading}
          erro={avisosGestao.isError ? "Não foi possível carregar os avisos." : null}
          aoTentarNovamente={() => avisosGestao.refetch()}
          busca={{ placeholder: "Buscar aviso…" }}
          vazio={{ icone: Megaphone, titulo: "Nenhum aviso cadastrado" }}
          acoesLinha={(aviso) => (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Editar aviso ${aviso.titulo}`}
                onClick={() => {
                  setAvisoEditando(aviso);
                  setAvisoAberto(true);
                }}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Excluir aviso ${aviso.titulo}`}
                onClick={() => setExclusao({ tipo: "aviso", id: aviso.id, titulo: aviso.titulo })}
              >
                <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
              </Button>
            </div>
          )}
        />
      </section>

      <section aria-labelledby="gestao-datas" className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="gestao-datas" className="text-h2 text-foreground">Datas importantes</h2>
            <p className="text-body text-muted-foreground">
              Prazos, eventos e reuniões. Feriados ficam em Configuração de Frequência.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setDataEditando(null);
              setDataAberta(true);
            }}
          >
            <Plus className="mr-1 h-4 w-4" aria-hidden="true" /> Nova data
          </Button>
        </div>
        <DataTable
          rotulo="Datas importantes"
          dados={datasGestao.datas}
          colunas={colunasDatas}
          chaveLinha={(d) => d.id}
          carregando={datasGestao.isLoading}
          erro={datasGestao.isError ? "Não foi possível carregar as datas." : null}
          aoTentarNovamente={() => datasGestao.refetch()}
          busca={{ placeholder: "Buscar data…" }}
          vazio={{ icone: CalendarDays, titulo: "Nenhuma data cadastrada" }}
          acoesLinha={(d) => (
            <div className="flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Editar data ${d.titulo}`}
                onClick={() => {
                  setDataEditando(d);
                  setDataAberta(true);
                }}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Excluir data ${d.titulo}`}
                onClick={() => setExclusao({ tipo: "data", id: d.id, titulo: d.titulo })}
              >
                <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
              </Button>
            </div>
          )}
        />
      </section>

      <AvisoFormDialog
        open={avisoAberto}
        onOpenChange={setAvisoAberto}
        aviso={avisoEditando}
        salvando={avisosGestao.salvar.isPending}
        onSalvar={(input) => avisosGestao.salvar.mutateAsync(input)}
      />
      <DataImportanteFormDialog
        open={dataAberta}
        onOpenChange={setDataAberta}
        dataImportante={dataEditando}
        salvando={datasGestao.salvar.isPending}
        onSalvar={(input) => datasGestao.salvar.mutateAsync(input)}
      />

      <AlertDialog open={!!exclusao} onOpenChange={(aberto) => !aberto && setExclusao(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir {exclusao?.tipo === "aviso" ? "aviso" : "data"}?</AlertDialogTitle>
            <AlertDialogDescription>
              "{exclusao?.titulo}" será excluído de vez. Para só tirar do ar, edite e desmarque "Ativo".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarExclusao}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------------------------------------------------------------------------

export default function AvisosPage() {
  const { hasPermission } = useAuth();
  const { authorizedModules, primaryModule } = useModuleRouter();
  const podeGerenciar = hasPermission(PERMISSAO_GERENCIAR_AVISOS);
  const modulo = authorizedModules.includes("comunicacao") ? "comunicacao" : primaryModule ?? "admin";

  return (
    <ModuleLayout module={modulo}>
      <div className="space-y-6">
        <PageHeader titulo="Avisos e datas importantes" descricao="Comunicados internos e calendário institucional" />
        <Tabs defaultValue="mural" className="space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
            <TabsTrigger value="mural">
              <Megaphone className="mr-1 h-4 w-4" aria-hidden="true" /> Mural
            </TabsTrigger>
            <TabsTrigger value="calendario">
              <CalendarDays className="mr-1 h-4 w-4" aria-hidden="true" /> Datas
            </TabsTrigger>
            {podeGerenciar && (
              <TabsTrigger value="gerenciar">
                <Settings2 className="mr-1 h-4 w-4" aria-hidden="true" /> Gerenciar
              </TabsTrigger>
            )}
          </TabsList>
          <TabsContent value="mural">
            <MuralAvisos />
          </TabsContent>
          <TabsContent value="calendario">
            <CalendarioMes />
          </TabsContent>
          {podeGerenciar && (
            <TabsContent value="gerenciar">
              <Gestao />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </ModuleLayout>
  );
}
