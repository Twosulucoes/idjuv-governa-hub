/**
 * Setores dos módulos (/admin/setores-modulos) — regra "só lança servidor do setor", fase 1.
 *
 * Por módulo: quais unidades da estrutura organizacional são o setor (com ou sem as subordinadas) e o modo da regra.
 * Os dados vêm do órgão; nada é fixo no código. Só o papel admin grava (RLS de setores_modulo e regra_lancamento);
 * quem abre a tela sem o papel vê só a consulta.
 *
 * Nesta fase o banco só checa o fundamento nas tabelas do RH: nos demais módulos o setor pode ser cadastrado, mas o
 * modo fica travado (MODULOS_COM_REGRA_NO_BANCO). Pela tela o modo só vai entre desligado e registrar: "exigir" liga
 * por migração, módulo a módulo (o banco recusa pela API). Quantos seriam bloqueados (trilha dos últimos 30 dias) é
 * lido só quando o admin pede.
 */

import { useMemo, useState } from "react";
import { subDays } from "date-fns";
import { BarChart3, Building2, Info, Plus, Trash2 } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { EmptyState, PageHeader, StatusBadge } from "@/components/design-system";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { SeletorBusca } from "@/components/lancamento-setor/SeletorBusca";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAdicionarSetorModulo,
  useAlterarSetorModulo,
  useBloqueiosLancamento,
  useRegrasLancamento,
  useSalvarModoRegra,
  useSetoresModulo,
  useUnidadesEstrutura,
  type UnidadeEstrutura,
} from "@/hooks/useLancamentoPorSetor";
import {
  hojeISO,
  moduloTemRegraNoBanco,
  resumirBloqueiosPorModulo,
  type ResumoBloqueioModulo,
} from "@/lib/lancamentoSetorRegras";
import { modulosHabilitados, type ModuleConfig } from "@/shared/config/modules.config";
import {
  MODOS_REGRA_LANCAMENTO,
  MODO_REGRA_DESCRICOES,
  MODO_REGRA_LABELS,
  type ModoRegraLancamento,
  type SetorModulo,
} from "@/types/lancamentoSetor";

// "Exigir" não é sucesso: é a regra recusando gravações (tom de atenção)
const TOM_MODO = { desligado: "neutro", registrar: "andamento", exigir: "pendente" } as const;

// Premissa 1 da spec: configuração de acesso continua com o admin; a regra vale para lançamento de domínio.
const MODULOS_FORA_DA_REGRA = new Set(["admin"]);

const AVISO_SUBORDINADAS =
  "Com as subordinadas, quem está lotado em qualquer unidade abaixo desta na estrutura também lança no módulo.";

interface CartaoModuloProps {
  modulo: ModuleConfig;
  modo: ModoRegraLancamento;
  setores: SetorModulo[];
  unidades: UnidadeEstrutura[];
  carregandoUnidades: boolean;
  /** Resumo da trilha (30 dias); undefined enquanto não foi pedido. */
  resumo: ResumoBloqueioModulo | null | undefined;
  podeEditar: boolean;
  aoTrocarModo: (modulo: ModuleConfig, modo: Exclude<ModoRegraLancamento, "exigir">) => void;
  aoRetirar: (modulo: ModuleConfig, setor: SetorModulo) => void;
}

function CartaoModulo({
  modulo,
  modo,
  setores,
  unidades,
  carregandoUnidades,
  resumo,
  podeEditar,
  aoTrocarModo,
  aoRetirar,
}: CartaoModuloProps) {
  const [unidadeId, setUnidadeId] = useState("");
  const [comSubordinadas, setComSubordinadas] = useState(false); // mesmo padrão do banco
  const adicionar = useAdicionarSetorModulo();
  const alterar = useAlterarSetorModulo();
  const comRegra = moduloTemRegraNoBanco(modulo.codigo);
  const ativos = setores.filter((s) => s.ativo);
  const idsAtivos = new Set(ativos.map((s) => s.unidade_id));
  const idBase = `setor-${modulo.codigo}`;

  const opcoes = unidades.map((u) => ({
    valor: u.id,
    rotulo: u.nome,
    detalhe: u.sigla,
    desabilitada: idsAtivos.has(u.id),
  }));

  const incluir = () => {
    if (!unidadeId) return;
    adicionar.mutate(
      {
        modulo: modulo.codigo,
        unidade_id: unidadeId,
        inclui_subordinadas: comSubordinadas,
        existente: setores.find((s) => s.unidade_id === unidadeId && !s.ativo) ?? null,
      },
      {
        onSuccess: () => {
          setUnidadeId("");
          setComSubordinadas(false);
        },
      },
    );
  };

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle>{modulo.nome}</CardTitle>
            <CardDescription>
              {ativos.length === 0 ? "Nenhum setor cadastrado" : `${ativos.length} setor(es)`}
              {resumo !== undefined && comRegra && modo !== "desligado" && (
                <>
                  {" · "}
                  {resumo
                    ? `${resumo.responsaveis} responsável(is) sem fundamento nos últimos 30 dias (${resumo.gravacoes} gravações)`
                    : "ninguém sem fundamento nos últimos 30 dias"}
                </>
              )}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-1 sm:w-60">
            <Label htmlFor={`${idBase}-modo`}>Modo da regra</Label>
            {comRegra && podeEditar && modo !== "exigir" ? (
              <Select
                value={modo}
                onValueChange={(v) => aoTrocarModo(modulo, v as Exclude<ModoRegraLancamento, "exigir">)}
              >
                <SelectTrigger id={`${idBase}-modo`} aria-describedby={`${idBase}-modo-desc`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODOS_REGRA_LANCAMENTO.map((m) => (
                    <SelectItem key={m} value={m} disabled={m === "exigir"}>
                      {m === "exigir" ? "Exigir (liga por migração, módulo a módulo)" : MODO_REGRA_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <span id={`${idBase}-modo`}>
                <StatusBadge tom={TOM_MODO[modo]}>{MODO_REGRA_LABELS[modo]}</StatusBadge>
              </span>
            )}
            <p id={`${idBase}-modo-desc`} className="text-caption text-muted-foreground">
              {!comRegra
                ? "A checagem deste módulo no banco chega numa próxima fase."
                : modo === "exigir"
                  ? `${MODO_REGRA_DESCRICOES.exigir} Para sair do modo exigir, também por migração.`
                  : MODO_REGRA_DESCRICOES[modo]}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {ativos.length > 0 && (
          <ul className="divide-y rounded-md border" aria-label={`Setores de ${modulo.nome}`}>
            {ativos.map((s) => (
              <li key={s.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="min-w-0 break-words">
                  {s.unidade?.nome ?? "Unidade sem acesso de leitura"}
                  {s.unidade?.sigla && <span className="text-caption text-muted-foreground"> · {s.unidade.sigla}</span>}
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`${idBase}-sub-${s.id}`}
                      checked={s.inclui_subordinadas}
                      disabled={!podeEditar || alterar.isPending}
                      aria-describedby={`${idBase}-aviso-sub`}
                      onCheckedChange={(v) => alterar.mutate({ id: s.id, inclui_subordinadas: v })}
                    />
                    <Label htmlFor={`${idBase}-sub-${s.id}`} className="text-caption font-normal">
                      Inclui subordinadas
                    </Label>
                  </div>
                  {podeEditar && (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Retirar ${s.unidade?.nome ?? "unidade"} dos setores de ${modulo.nome}`}
                      disabled={alterar.isPending}
                      onClick={() => aoRetirar(modulo, s)}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {podeEditar && (
          <div className="space-y-2 rounded-md border border-dashed p-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-end">
              <div className="min-w-0 flex-1 space-y-1">
                <Label htmlFor={`${idBase}-unidade`}>Incluir unidade</Label>
                <SeletorBusca
                  id={`${idBase}-unidade`}
                  opcoes={opcoes}
                  valor={unidadeId}
                  aoEscolher={setUnidadeId}
                  carregando={carregandoUnidades}
                  placeholder="Escolha a unidade da estrutura"
                  placeholderBusca="Nome ou sigla"
                  vazio="Nenhuma unidade encontrada."
                />
              </div>
              <div className="flex items-center gap-2 md:pb-2">
                <Checkbox
                  id={`${idBase}-com-sub`}
                  checked={comSubordinadas}
                  aria-describedby={`${idBase}-aviso-sub`}
                  onCheckedChange={(v) => setComSubordinadas(v === true)}
                />
                <Label htmlFor={`${idBase}-com-sub`} className="font-normal">
                  Incluir subordinadas
                </Label>
              </div>
              <Button type="button" className="gap-2" onClick={incluir} disabled={!unidadeId} loading={adicionar.isPending}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Incluir
              </Button>
            </div>
            <p id={`${idBase}-aviso-sub`} className="text-caption text-muted-foreground">
              {AVISO_SUBORDINADAS}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SetoresModulosPage() {
  const { isSuperAdmin } = useAuth();
  const podeEditar = isSuperAdmin; // escrita só do papel admin (RLS)
  const regras = useRegrasLancamento();
  const setores = useSetoresModulo();
  const unidades = useUnidadesEstrutura(podeEditar);
  const salvarModo = useSalvarModoRegra();
  const alterar = useAlterarSetorModulo();
  // A trilha (até 5000 linhas) só é lida quando o admin pede
  const [contar, setContar] = useState(false);
  const periodo = useMemo(() => ({ inicio: hojeISO(subDays(new Date(), 30)) }), []);
  const bloqueios = useBloqueiosLancamento(periodo, contar && isSuperAdmin);
  const resumo = useMemo(
    () => (bloqueios.data ? resumirBloqueiosPorModulo(bloqueios.data.linhas) : null),
    [bloqueios.data],
  );
  const [retirando, setRetirando] = useState<{ modulo: ModuleConfig; setor: SetorModulo } | null>(null);

  const modulos = modulosHabilitados().filter((m) => !MODULOS_FORA_DA_REGRA.has(m.codigo));
  const modoDe = (codigo: string): ModoRegraLancamento =>
    regras.data?.find((r) => r.modulo === codigo)?.modo ?? "desligado";

  const trocarModo = (modulo: ModuleConfig, modo: Exclude<ModoRegraLancamento, "exigir">) => {
    if (modo !== modoDe(modulo.codigo)) salvarModo.mutate({ modulo: modulo.codigo, modo });
  };

  const carregando = regras.isLoading || setores.isLoading;
  const erro = regras.error || setores.error;

  return (
    <ModuleLayout module="admin">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Administração", href: "/admin" }, { rotulo: "Setores dos módulos" }]}
          titulo="Setores dos módulos"
          descricao="Quais unidades lançam em cada módulo e se a regra de setor está desligada ou só registra"
          acoes={
            isSuperAdmin && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => (contar ? bloqueios.refetch() : setContar(true))}
                loading={bloqueios.isFetching}
              >
                <BarChart3 className="h-4 w-4" aria-hidden="true" />
                {contar ? "Contar de novo" : "Contar quem seria bloqueado (30 dias)"}
              </Button>
            )
          }
        />

        <Alert role="note">
          <Info className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Como a regra funciona</AlertTitle>
          <AlertDescription className="space-y-1">
            <p>
              Lança no módulo o servidor lotado num setor dele ou designado para o setor (designação aprovada por outra
              pessoa, vigente e com ato). Login sem servidor só consulta. Na fase 1, comissão é só cadastro e ainda não
              vale como fundamento.
            </p>
            <p>
              Nesta fase o banco só checa o RH, e pela tela o modo vai só até "registrar": ninguém é bloqueado e a trilha
              anota quem seria (relatório em RH › Trilha de auditoria › Lançamento por setor). "Exigir" liga por
              migração, módulo a módulo.
            </p>
            {!podeEditar && <p className="font-medium">Somente consulta: só o papel administrador altera esta configuração.</p>}
          </AlertDescription>
        </Alert>

        {erro && (
          <Alert variant="destructive">
            <AlertTitle>Não foi possível carregar a configuração</AlertTitle>
            <AlertDescription>Verifique sua permissão ou se a migração da regra de setor já foi aplicada.</AlertDescription>
          </Alert>
        )}

        {contar && bloqueios.error && (
          <p role="alert" className="text-sm text-destructive">
            Não foi possível contar quem seria bloqueado (leitura da trilha).
          </p>
        )}
        {bloqueios.data?.cortado && (
          <p role="status" className="text-caption text-muted-foreground">
            A contagem leu só as gravações mais recentes e pode estar abaixo do real.
          </p>
        )}

        {carregando ? (
          <p role="status" className="text-muted-foreground">
            Carregando…
          </p>
        ) : modulos.length === 0 ? (
          <EmptyState icone={Building2} titulo="Nenhum módulo habilitado" />
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {modulos.map((m) => (
              <CartaoModulo
                key={m.codigo}
                modulo={m}
                modo={modoDe(m.codigo)}
                setores={(setores.data ?? []).filter((s) => s.modulo === m.codigo)}
                unidades={unidades.data ?? []}
                carregandoUnidades={unidades.isLoading}
                resumo={resumo ? resumo.get(m.codigo) ?? null : undefined}
                podeEditar={podeEditar}
                aoTrocarModo={trocarModo}
                aoRetirar={(modulo, setor) => setRetirando({ modulo, setor })}
              />
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!retirando} onOpenChange={(a) => !a && setRetirando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirar setor de {retirando?.modulo.nome}?</AlertDialogTitle>
            <AlertDialogDescription>
              {retirando?.setor.unidade?.nome ?? "A unidade"} deixa de ser setor de {retirando?.modulo.nome}
              {retirando?.setor.inclui_subordinadas ? ", junto com as subordinadas" : ""}: quem está lotado nela perde o
              fundamento de lançamento por lotação neste módulo. Incluir de novo reativa o mesmo cadastro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (retirando) alterar.mutate({ id: retirando.setor.id, ativo: false });
                setRetirando(null);
              }}
            >
              Retirar setor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModuleLayout>
  );
}
