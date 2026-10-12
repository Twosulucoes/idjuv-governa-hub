/**
 * INTELIGÊNCIA ARTIFICIAL DA INSTITUIÇÃO
 *
 * A própria instituição liga a IA, escolhe o provedor (OpenAI, Anthropic, Gemini ou um
 * serviço compatível com OpenAI), informa o modelo e os limites e cadastra a chave de API.
 * A chave vai para o Vault pela RPC salvar_chave_ia e nunca volta para a tela: só se mostra
 * quando foi gravada e os 4 últimos caracteres. Toda chamada passa pela Edge Function
 * ia-gateway, que aplica permissão, cota por hora, teto mensal e registra o uso.
 *
 * Acesso: ia.configurar (a RLS, as RPCs e o recurso "testar" exigem a mesma permissão).
 */

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { Activity, AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Gauge, KeyRound, Loader2, PlugZap, RefreshCw, Save } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { KpiCard, PageHeader, StatusBadge } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useConfigIA,
  useResumoUsoIA,
  useSalvarChaveIA,
  useSalvarConfigIA,
  useTestarIA,
} from "@/hooks/useConfigIA";
import { PROVEDOR_IA_LABEL, type ConfigIA, type ConfigIAInput, type ProvedorIA } from "@/types/ia";

const formatarData = (iso: string) => format(new Date(iso), "dd/MM/yyyy");
const numero = new Intl.NumberFormat("pt-BR");

// Mesmas regras dos CHECKs de ia_config.
const REGEX_URL_BASE = /^https:\/\/[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+(:[0-9]{2,5})?(\/[A-Za-z0-9._~/-]*)?$/;
const REGEX_MODELO = /^[A-Za-z0-9._:/@-]{1,120}$/;

// Só exemplos de formato; o modelo é sempre digitado pelo administrador.
const EXEMPLO_MODELO: Record<ProvedorIA, string> = {
  openai: "ex.: gpt-4o-mini",
  anthropic: "ex.: claude-sonnet-4-5",
  gemini: "ex.: gemini-2.5-flash",
  compativel_openai: "ex.: llama-3.1-70b-instruct",
};

const PROVEDORES = Object.keys(PROVEDOR_IA_LABEL) as ProvedorIA[];

const configSchema = z
  .object({
    ativo: z.boolean(),
    provedor: z.enum(["openai", "anthropic", "gemini", "compativel_openai"]),
    url_base: z.string().trim(),
    modelo: z.string().trim().regex(REGEX_MODELO, "Use letras, números e . _ : / @ - (até 120 caracteres)"),
    limite_chamadas_hora: z.coerce
      .number({ invalid_type_error: "Informe um número" })
      .int("Use um número inteiro")
      .min(1, "Mínimo 1")
      .max(1000, "Máximo 1000"),
    teto_tokens_mes: z
      .string()
      .trim()
      .refine((v) => v === "" || /^[1-9][0-9]{0,14}$/.test(v), "Use um número inteiro maior que zero ou deixe vazio"),
    enviar_dados_pessoais: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.provedor !== "compativel_openai") return;
    if (!v.url_base) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["url_base"], message: "Informe a URL base do serviço" });
    } else if (v.url_base.length > 300 || !REGEX_URL_BASE.test(v.url_base)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["url_base"],
        message: "Use um endereço https:// com domínio (ex.: https://ia.instituicao.gov.br/v1), até 300 caracteres",
      });
    }
  })
  .transform((v) => ({
    ...v,
    url_base: v.provedor === "compativel_openai" ? v.url_base : null,
    teto_tokens_mes: v.teto_tokens_mes === "" ? null : Number(v.teto_tokens_mes),
  }));

type ConfigForm = z.input<typeof configSchema>;
type ConfigDados = z.output<typeof configSchema>;

function Erro({ id, mensagem }: { id?: string; mensagem?: string }) {
  return mensagem ? (
    <p id={id} className="text-sm text-destructive">
      {mensagem}
    </p>
  ) : null;
}

const valoresIniciais = (c?: ConfigIA | null): ConfigForm => ({
  ativo: c?.ativo ?? false,
  provedor: c?.provedor ?? "openai",
  url_base: c?.url_base ?? "",
  modelo: c?.modelo ?? "",
  limite_chamadas_hora: c?.limite_chamadas_hora ?? 30,
  teto_tokens_mes: c?.teto_tokens_mes != null ? String(c.teto_tokens_mes) : "",
  enviar_dados_pessoais: c?.enviar_dados_pessoais ?? false,
});

// ---------------------------------------------------------------------------
// Provedor, modelo e limites
// ---------------------------------------------------------------------------

function ConfiguracaoCard({ config }: { config: ConfigIA | null }) {
  const salvar = useSalvarConfigIA();

  const { register, control, handleSubmit, watch, reset, setValue, formState: { errors, isDirty } } = useForm<
    ConfigForm,
    unknown,
    ConfigDados
  >({ resolver: zodResolver(configSchema), defaultValues: valoresIniciais(config) });

  // Nova versão do banco (ex.: depois de gravar a chave) sem perder o que está sendo editado.
  useEffect(() => {
    reset(valoresIniciais(config), { keepDirtyValues: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const provedor = watch("provedor");
  const urlBase = watch("url_base");
  const ativo = watch("ativo");

  // Trocar o provedor ou a URL base apaga a chave no banco e desliga a IA.
  const urlEfetiva = provedor === "compativel_openai" ? urlBase.trim() : "";
  const mudouDestino =
    !!config && (provedor !== config.provedor || urlEfetiva !== (config.url_base ?? ""));
  const temChave = !!config?.segredo_atualizado_em;
  const motivoBloqueio = !temChave
    ? "Cadastre a chave de API antes de ligar."
    : mudouDestino
      ? "Ao trocar o provedor ou a URL a chave é apagada: salve, cadastre a nova chave e depois ligue."
      : null;

  useEffect(() => {
    if (motivoBloqueio && ativo) setValue("ativo", false, { shouldDirty: true });
  }, [motivoBloqueio, ativo, setValue]);

  // handleSubmit entrega os valores já transformados pelo zod (url_base e teto vazios → null).
  const onSubmit = handleSubmit((dados) =>
    salvar.mutate({ ...(dados as ConfigIAInput), ativo: motivoBloqueio ? false : dados.ativo }),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-base">Provedor e limites</CardTitle>
              <CardDescription>Qual serviço de IA a instituição usa e quanto cada pessoa pode chamar.</CardDescription>
            </div>
            <div className="space-y-1 sm:text-right">
              <div className="flex items-center gap-2 sm:justify-end">
                <Controller
                  control={control}
                  name="ativo"
                  render={({ field }) => (
                    <Switch
                      id="ia-ativo"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={!!motivoBloqueio && !field.value}
                      aria-describedby={motivoBloqueio ? "ia-ativo-motivo" : undefined}
                    />
                  )}
                />
                <Label htmlFor="ia-ativo">IA ligada</Label>
              </div>
              {motivoBloqueio && (
                <p id="ia-ativo-motivo" className="max-w-xs text-sm text-muted-foreground">
                  {motivoBloqueio}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <Label id="ia-provedor-rotulo">Provedor</Label>
              <Controller
                control={control}
                name="provedor"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger aria-labelledby="ia-provedor-rotulo">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROVEDORES.map((p) => (
                        <SelectItem key={p} value={p}>
                          {PROVEDOR_IA_LABEL[p]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ia-modelo">Modelo</Label>
              <Input
                id="ia-modelo"
                autoComplete="off"
                placeholder={EXEMPLO_MODELO[provedor]}
                aria-invalid={!!errors.modelo}
                aria-describedby={errors.modelo ? "ia-modelo-erro" : undefined}
                {...register("modelo")}
              />
              <Erro id="ia-modelo-erro" mensagem={errors.modelo?.message} />
            </div>
            {provedor === "compativel_openai" && (
              <div className="space-y-1 sm:col-span-2">
                <Label htmlFor="ia-url-base">URL base do serviço (https)</Label>
                <Input
                  id="ia-url-base"
                  type="url"
                  inputMode="url"
                  autoComplete="off"
                  placeholder="https://ia.instituicao.gov.br/v1"
                  aria-invalid={!!errors.url_base}
                  aria-describedby={errors.url_base ? "ia-url-base-erro" : undefined}
                  {...register("url_base")}
                />
                <Erro id="ia-url-base-erro" mensagem={errors.url_base?.message} />
              </div>
            )}
            <div className="space-y-1">
              <Label htmlFor="ia-limite-hora">Limite por pessoa por hora (chamadas)</Label>
              <Input
                id="ia-limite-hora"
                type="number"
                inputMode="numeric"
                min={1}
                max={1000}
                aria-invalid={!!errors.limite_chamadas_hora}
                aria-describedby={errors.limite_chamadas_hora ? "ia-limite-hora-erro" : undefined}
                {...register("limite_chamadas_hora")}
              />
              <Erro id="ia-limite-hora-erro" mensagem={errors.limite_chamadas_hora?.message} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ia-teto-mes">Teto mensal de tokens (vazio = sem teto)</Label>
              <Input
                id="ia-teto-mes"
                inputMode="numeric"
                autoComplete="off"
                aria-invalid={!!errors.teto_tokens_mes}
                aria-describedby={errors.teto_tokens_mes ? "ia-teto-mes-erro" : undefined}
                {...register("teto_tokens_mes")}
              />
              <Erro id="ia-teto-mes-erro" mensagem={errors.teto_tokens_mes?.message} />
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-md border p-3">
            <Controller
              control={control}
              name="enviar_dados_pessoais"
              render={({ field }) => (
                <Switch
                  id="ia-dados-pessoais"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  aria-describedby="ia-dados-pessoais-ajuda"
                />
              )}
            />
            <div className="space-y-1">
              <Label htmlFor="ia-dados-pessoais">Permitir envio de dados pessoais ao provedor</Label>
              <p id="ia-dados-pessoais-ajuda" className="text-sm text-muted-foreground">
                Mantenha desligado salvo base legal (LGPD). Os recursos de IA que tratam dados de pessoas usam esta opção para decidir se mascaram nome, CPF e outros dados antes do envio.
              </p>
            </div>
          </div>

          {mudouDestino && temChave && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <AlertDescription>
                Ao salvar, a chave cadastrada será apagada e a IA ficará desligada.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={salvar.isPending || (!!config && !isDirty)}>
              {salvar.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Save className="mr-1 h-4 w-4" aria-hidden="true" />
              )}
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Chave de API (só escrita)
// ---------------------------------------------------------------------------

function ChaveCard({ config }: { config: ConfigIA | null }) {
  const [valor, setValor] = useState("");
  const salvar = useSalvarChaveIA();
  // A chave pertence ao provedor salvo: sem configuração salva não há onde gravá-la.
  const liberado = !!config;
  const valida = valor.length >= 8 && valor.length <= 4096 && valor === valor.trim();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4" aria-hidden="true" /> Chave de API
        </CardTitle>
        <CardDescription>
          {config?.segredo_atualizado_em
            ? `Chave cadastrada em ${formatarData(config.segredo_atualizado_em)}${config.segredo_final ? `, final ••••${config.segredo_final}` : ""}.`
            : "Nenhuma chave cadastrada."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Alert>
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>Trocar o provedor ou a URL apaga a chave e desliga a IA.</AlertDescription>
        </Alert>
        <p className="text-sm text-muted-foreground">
          {liberado
            ? "A chave fica guardada no cofre do banco e não é exibida de novo. Digite outra para trocar."
            : "Salve o provedor e o modelo acima antes de cadastrar a chave."}
        </p>
        <div className="space-y-1">
          <Label htmlFor="ia-chave">Nova chave</Label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id="ia-chave"
              type="password"
              autoComplete="new-password"
              spellCheck={false}
              value={valor}
              disabled={!liberado}
              onChange={(e) => setValor(e.target.value)}
              placeholder={config?.segredo_atualizado_em ? "••••••••" : ""}
              aria-describedby={valor && !valida ? "ia-chave-erro" : undefined}
              aria-invalid={!!valor && !valida}
            />
            <Button
              type="button"
              disabled={!liberado || !valida || salvar.isPending}
              onClick={() => salvar.mutate(valor, { onSuccess: () => setValor("") })}
            >
              {salvar.isPending ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <KeyRound className="mr-1 h-4 w-4" aria-hidden="true" />
              )}
              Salvar chave
            </Button>
          </div>
          {valor && !valida && (
            <Erro id="ia-chave-erro" mensagem="A chave tem de 8 a 4096 caracteres, sem espaços no começo ou no fim." />
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Teste de conexão
// ---------------------------------------------------------------------------

function TesteCard({ config }: { config: ConfigIA | null }) {
  const testar = useTestarIA();
  const temChave = !!config?.segredo_atualizado_em;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PlugZap className="h-4 w-4" aria-hidden="true" /> Testar conexão
        </CardTitle>
        <CardDescription>
          Faz uma chamada mínima ao provedor com a configuração e a chave salvas, mesmo com a IA desligada.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button type="button" variant="outline" disabled={!temChave || testar.isPending} onClick={() => testar.mutate()}>
          {testar.isPending ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <PlugZap className="mr-1 h-4 w-4" aria-hidden="true" />
          )}
          Testar conexão
        </Button>
        {!temChave && <p className="text-sm text-muted-foreground">Cadastre a chave para testar.</p>}
        <div aria-live="polite">
          {testar.isSuccess && (
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <StatusBadge tom="sucesso">Conectado</StatusBadge>
              {PROVEDOR_IA_LABEL[testar.data.provedor] ?? testar.data.provedor}, modelo {testar.data.modelo}
            </p>
          )}
          {testar.isError && (
            <p className="flex flex-wrap items-center gap-2 text-sm">
              <StatusBadge tom="erro">Falhou</StatusBadge>
              <span className="break-words">{testar.error.message}</span>
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Uso do mês
// ---------------------------------------------------------------------------

function UsoMesCard() {
  const { data: uso, isLoading, isError, refetch } = useResumoUsoIA();
  const totalTokens = uso ? uso.tokens_entrada + uso.tokens_saida : 0;
  const percentual =
    uso?.teto_tokens_mes ? Math.min(100, Math.round((totalTokens / uso.teto_tokens_mes) * 100)) : null;

  return (
    <section aria-labelledby="ia-uso-titulo" className="space-y-3">
      <h2 id="ia-uso-titulo" className="text-base font-semibold">
        Uso do mês
      </h2>
      {isError ? (
        <Alert>
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            Não foi possível carregar o uso do mês.
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-1 h-4 w-4" aria-hidden="true" /> Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard rotulo="Chamadas" icone={Activity} carregando={isLoading} valor={numero.format(uso?.chamadas ?? 0)} />
          <KpiCard
            rotulo="Tokens de entrada"
            icone={ArrowUpFromLine}
            carregando={isLoading}
            valor={numero.format(uso?.tokens_entrada ?? 0)}
          />
          <KpiCard
            rotulo="Tokens de saída"
            icone={ArrowDownToLine}
            carregando={isLoading}
            valor={numero.format(uso?.tokens_saida ?? 0)}
          />
          <KpiCard
            rotulo="Teto mensal de tokens"
            icone={Gauge}
            carregando={isLoading}
            valor={uso?.teto_tokens_mes ? numero.format(uso.teto_tokens_mes) : "Sem teto"}
            detalhe={percentual != null ? `${percentual}% usado` : undefined}
          />
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------

export default function ConfigIAPage() {
  const { data: config, isLoading, isError, refetch } = useConfigIA();

  return (
    <ModuleLayout module="admin">
      <PageHeader
        migalhas={[{ rotulo: "Administração", href: "/admin" }, { rotulo: "Inteligência Artificial" }]}
        titulo="Inteligência Artificial"
        descricao="Provedor, chave de API, limites e uso da IA da instituição"
      />
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      ) : isError ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            Não foi possível carregar a configuração de IA.
            <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-1 h-4 w-4" aria-hidden="true" /> Tentar novamente
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-4">
          <ConfiguracaoCard config={config ?? null} />
          <div className="grid gap-4 lg:grid-cols-2">
            <ChaveCard config={config ?? null} />
            <TesteCard config={config ?? null} />
          </div>
          <UsoMesCard />
        </div>
      )}
    </ModuleLayout>
  );
}
