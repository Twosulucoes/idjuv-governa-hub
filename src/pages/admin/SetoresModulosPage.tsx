/**
 * Setores dos módulos (/admin/setores-modulos) — regra "só lança servidor do setor", fase 1.
 *
 * Por módulo: quais unidades da estrutura organizacional são o setor (com ou sem as subordinadas) e o modo da regra
 * (desligado, registrar, exigir). Os dados vêm do órgão; nada é fixo no código. Só o papel admin grava (RLS de
 * setores_modulo e regra_lancamento); quem abre a tela sem o papel vê só a consulta.
 *
 * Nesta fase o banco só checa o fundamento nas tabelas do RH: nos demais módulos o setor pode ser cadastrado, mas o
 * modo fica travado (MODULOS_COM_REGRA_NO_BANCO). Passar para "exigir" pede confirmação e mostra quantos teriam sido
 * bloqueados nos últimos 30 dias (trilha com fundamento negado).
 */

import { useMemo, useState } from "react";
import { subDays } from "date-fns";
import { Building2, Info, Plus, Trash2 } from "lucide-react";
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

const TOM_MODO = { desligado: "neutro", registrar: "andamento", exigir: "sucesso" } as const;

// Premissa 1 da spec: configuração de acesso continua com o admin; a regra vale para lançamento de domínio.
const MODULOS_FORA_DA_REGRA = new Set(["admin"]);

interface CartaoModuloProps {
  modulo: ModuleConfig;
  modo: ModoRegraLancamento;
  setores: SetorModulo[];
  unidades: UnidadeEstrutura[];
  carregandoUnidades: boolean;
  resumo: ResumoBloqueioModulo | null;
  podeEditar: boolean;
  aoPedirModo: (modulo: ModuleConfig, modo: ModoRegraLancamento) => void;
}

function CartaoModulo({ modulo, modo, setores, unidades, carregandoUnidades, resumo, podeEditar, aoPedirModo }: CartaoModuloProps) {
  const [unidadeId, setUnidadeId] = useState("");
  const [comSubordinadas, setComSubordinadas] = useState(true);
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
      { onSuccess: () => setUnidadeId("") },
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
              {resumo && comRegra && modo !== "desligado" && (
                <> · {resumo.responsaveis} responsável(is) sem fundamento nos últimos 30 dias</>
              )}
            </CardDescription>
          </div>
          <div className="flex flex-col gap-1 sm:w-56">
            <Label htmlFor={`${idBase}-modo`}>Modo da regra</Label>
            {comRegra ? (
              <Select
                value={modo}
                disabled={!podeEditar}
                onValueChange={(v) => aoPedirModo(modulo, v as ModoRegraLancamento)}
              >
                <SelectTrigger id={`${idBase}-modo`} aria-describedby={`${idBase}-modo-desc`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODOS_REGRA_LANCAMENTO.map((m) => (
                    <SelectItem key={m} value={m}>
                      {MODO_REGRA_LABELS[m]}
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
              {comRegra ? MODO_REGRA_DESCRICOES[modo] : "A checagem deste módulo no banco chega numa próxima fase."}
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
                      onClick={() => alterar.mutate({ id: s.id, ativo: false })}
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
          <div className="flex flex-col gap-3 rounded-md border border-dashed p-3 md:flex-row md:items-end">
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
                onCheckedChange={(v) => setComSubordinadas(v === true)}
              />
              <Label htmlFor={`${idBase}-com-sub`} className="font-normal">
                Com as subordinadas
              </Label>
            </div>
            <Button type="button" className="gap-2" onClick={incluir} disabled={!unidadeId} loading={adicionar.isPending}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Incluir
            </Button>
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
  const periodo = useMemo(() => ({ inicio: hojeISO(subDays(new Date(), 30)) }), []);
  const bloqueios = useBloqueiosLancamento(periodo, isSuperAdmin);
  const resumo = useMemo(() => resumirBloqueiosPorModulo(bloqueios.data?.linhas ?? []), [bloqueios.data]);
  const [pedido, setPedido] = useState<{ modulo: ModuleConfig; modo: ModoRegraLancamento } | null>(null);

  const modulos = modulosHabilitados().filter((m) => !MODULOS_FORA_DA_REGRA.has(m.codigo));
  const modoDe = (codigo: string): ModoRegraLancamento =>
    regras.data?.find((r) => r.modulo === codigo)?.modo ?? "desligado";

  const pedirModo = (modulo: ModuleConfig, modo: ModoRegraLancamento) => {
    if (modo === modoDe(modulo.codigo)) return;
    if (modo === "exigir") setPedido({ modulo, modo });
    else salvarModo.mutate({ modulo: modulo.codigo, modo });
  };

  const resumoPedido = pedido ? resumo.get(pedido.modulo.codigo) ?? null : null;
  const setoresPedido = pedido
    ? (setores.data ?? []).filter((s) => s.modulo === pedido.modulo.codigo && s.ativo).length
    : 0;
  const carregando = regras.isLoading || setores.isLoading;
  const erro = regras.error || setores.error;

  return (
    <ModuleLayout module="admin">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Administração", href: "/admin" }, { rotulo: "Setores dos módulos" }]}
          titulo="Setores dos módulos"
          descricao="Quais unidades lançam em cada módulo e se a regra de setor só registra ou já exige"
        />

        <Alert role="note">
          <Info className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Como a regra funciona</AlertTitle>
          <AlertDescription className="space-y-1">
            <p>
              Lança no módulo o servidor lotado num setor dele, designado para o setor (designação aprovada, vigente e
              com ato) ou membro de comissão vigente do módulo. Login sem servidor só consulta. O que é do próprio
              servidor (férias, frequência, requerimentos) e as decisões de chefia continuam liberados.
            </p>
            <p>
              Nesta fase o banco só checa o RH. Em "registrar" ninguém é bloqueado: a trilha anota quem seria (relatório
              em RH › Trilha de auditoria › Lançamento por setor).
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
                resumo={resumo.get(m.codigo) ?? null}
                podeEditar={podeEditar}
                aoPedirModo={pedirModo}
              />
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!pedido} onOpenChange={(a) => !a && setPedido(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exigir a regra de setor em {pedido?.modulo.nome}?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  Quem não tem fundamento passa a <strong>não lançar</strong> em {pedido?.modulo.nome}: o banco recusa a
                  gravação e a tela fica só para consulta. Inclui logins sem servidor vinculado, até de administradores.
                </p>
                <p>
                  {bloqueios.isLoading
                    ? "Contando quem teria sido bloqueado…"
                    : bloqueios.error
                      ? "Não foi possível contar quem teria sido bloqueado (leitura da trilha)."
                      : resumoPedido
                        ? `Nos últimos 30 dias, ${resumoPedido.responsaveis} responsável(is) teriam sido bloqueados (${resumoPedido.gravacoes} gravações).`
                        : "Nos últimos 30 dias, a trilha não anotou ninguém sem fundamento neste módulo."}
                  {bloqueios.data?.cortado && " A contagem leu só as gravações mais recentes e pode estar abaixo do real."}
                </p>
                {setoresPedido === 0 && (
                  <p className="font-medium text-destructive">
                    Nenhum setor cadastrado: ninguém lança por lotação, só por designação ou comissão.
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Manter como está</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (pedido) salvarModo.mutate({ modulo: pedido.modulo.codigo, modo: pedido.modo });
                setPedido(null);
              }}
            >
              Passar para exigir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ModuleLayout>
  );
}
