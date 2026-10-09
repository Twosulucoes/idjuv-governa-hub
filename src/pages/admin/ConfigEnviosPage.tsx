/**
 * ENVIO DE E-MAIL E WHATSAPP
 *
 * O próprio cliente configura por onde o sistema dispara: e-mail (SMTP da instituição ou
 * Resend) e WhatsApp pela API oficial da Meta. Senha/token vão para o Vault pela RPC
 * salvar_segredo_envio e nunca voltam para a tela. Aba Histórico mostra os últimos envios.
 *
 * Ver: admin.envios. Editar, gravar credencial e testar: admin.envios.configurar (a RLS e a
 * Edge Function exigem a mesma permissão).
 */

import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { History, KeyRound, Loader2, Mail, MessageCircle, Save, Send } from "lucide-react";
import { ModuleLayout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useIdentidade, useMarca, useLogoOrgao } from "@/core/tenant";
import {
  mascararDestinatario,
  useConfigEnvio,
  useEnviosLog,
  useSalvarConfigEnvio,
  useSalvarSegredoEnvio,
  useTestarEnvio,
} from "@/hooks/useConfigEnvio";
import {
  ORIGEM_ENVIO_LABEL,
  PERMISSAO_CONFIGURAR_ENVIOS,
  USOS_TEMPLATE_WHATSAPP,
  type CanalEnvio,
  type ConfigEnvio,
} from "@/types/envios";

const formatarDataHora = (iso: string) => format(new Date(iso), "dd/MM/yyyy HH:mm");

// Campo de texto opcional: "" vira null antes de ir para o banco.
const opcional = (schema: z.ZodString) =>
  z.union([schema, z.literal("")]).transform((v) => (v === "" ? null : v));

const emailOpcional = opcional(z.string().trim().email("E-mail inválido"));

// ---------------------------------------------------------------------------
// Credencial (só escrita) e teste — comuns aos dois canais
// ---------------------------------------------------------------------------

function CredencialCard({
  canal,
  config,
  podeEditar,
  rotulo,
  ajuda,
}: {
  canal: CanalEnvio;
  config?: ConfigEnvio;
  podeEditar: boolean;
  rotulo: string;
  ajuda: string;
}) {
  const [valor, setValor] = useState("");
  const salvar = useSalvarSegredoEnvio();
  // A RPC exige a configuração salva: trocar o provedor depois apagaria a credencial.
  const liberado = podeEditar && !!config?.provedor;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <KeyRound className="h-4 w-4" /> {rotulo}
        </CardTitle>
        <CardDescription>
          {config?.segredo_atualizado_em
            ? `Gravada em ${formatarDataHora(config.segredo_atualizado_em)}. Por segurança ela não é exibida; digite outra para trocar.`
            : "Nenhuma credencial gravada."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          {config?.provedor ? ajuda : "Salve a configuração acima antes de gravar a credencial."}
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type="password"
            autoComplete="new-password"
            aria-label={rotulo}
            value={valor}
            disabled={!liberado}
            onChange={(e) => setValor(e.target.value)}
            placeholder={config?.segredo_atualizado_em ? "••••••••" : ""}
          />
          <Button
            type="button"
            disabled={!liberado || !valor.trim() || salvar.isPending}
            onClick={() => salvar.mutate({ canal, segredo: valor }, { onSuccess: () => setValor("") })}
          >
            {salvar.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <KeyRound className="mr-1 h-4 w-4" />}
            Gravar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function TesteCard({ canal, podeEditar }: { canal: CanalEnvio; podeEditar: boolean }) {
  const [destino, setDestino] = useState("");
  const testar = useTestarEnvio();
  const email = canal === "email";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Send className="h-4 w-4" /> Enviar teste
        </CardTitle>
        <CardDescription>
          {email
            ? "Usa a configuração salva e a credencial gravada, mesmo com o canal ainda desligado."
            : "Usa a configuração salva, mesmo desligada, e envia o template hello_world, que já vem aprovado em toda conta do WhatsApp Business."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            type={email ? "email" : "tel"}
            aria-label={email ? "E-mail de destino do teste" : "Telefone de destino do teste"}
            placeholder={email ? "voce@instituicao.gov.br" : "(00) 90000-0000"}
            value={destino}
            disabled={!podeEditar}
            onChange={(e) => setDestino(e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            disabled={!podeEditar || !destino.trim() || testar.isPending}
            onClick={() => testar.mutate({ canal, destino })}
          >
            {testar.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
            Testar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// E-mail
// ---------------------------------------------------------------------------

const emailSchema = z
  .object({
    ativo: z.boolean(),
    provedor: z.enum(["smtp", "resend"]),
    remetente_nome: opcional(z.string().trim().max(120)),
    remetente_email: emailOpcional,
    responder_para: emailOpcional,
    smtp_host: opcional(z.string().trim().regex(/^[A-Za-z0-9.-]{1,253}$/, "Servidor inválido")),
    smtp_porta: z.coerce
      .number()
      .refine((p) => [25, 465, 587, 2525].includes(p), "Use 25, 465, 587 ou 2525"),
    smtp_seguranca: z.enum(["ssl", "starttls"]),
    smtp_usuario: opcional(z.string().trim().max(255)),
    marca_nome: opcional(z.string().trim().max(200)),
    marca_logo_url: opcional(z.string().trim().max(500).regex(/^https:\/\/\S+$/, "Use um endereço https://")),
    marca_cor: opcional(z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Cor no formato hexadecimal")),
    rodape: opcional(z.string().trim().max(500)),
  })
  .refine((v) => !v.ativo || !!v.remetente_email, {
    path: ["remetente_email"],
    message: "Informe o e-mail do remetente para ativar",
  })
  .refine((v) => !v.ativo || v.provedor !== "smtp" || (!!v.smtp_host && !!v.smtp_porta), {
    path: ["smtp_host"],
    message: "Informe servidor e porta SMTP para ativar",
  });

type EmailForm = z.input<typeof emailSchema>;
type EmailDados = z.output<typeof emailSchema>;

function Erro({ mensagem }: { mensagem?: string }) {
  return mensagem ? <p className="text-sm text-destructive">{mensagem}</p> : null;
}

function EmailTab({ config, podeEditar }: { config?: ConfigEnvio; podeEditar: boolean }) {
  const identidade = useIdentidade();
  const marca = useMarca();
  const logo = useLogoOrgao("dark");
  const salvar = useSalvarConfigEnvio();

  // Sugestões tiradas do perfil do tenant (placeholder) e botão para copiá-las de uma vez.
  const logoAbsoluta = useMemo(() => {
    try {
      const url = new URL(logo, window.location.origin).href;
      return url.startsWith("https://") ? url : "";
    } catch {
      return "";
    }
  }, [logo]);

  const valoresIniciais = (c?: ConfigEnvio): EmailForm => ({
    ativo: c?.ativo ?? false,
    provedor: c?.provedor === "resend" ? "resend" : "smtp",
    remetente_nome: c?.remetente_nome ?? "",
    remetente_email: c?.remetente_email ?? "",
    responder_para: c?.responder_para ?? "",
    smtp_host: c?.smtp_host ?? "",
    smtp_porta: c?.smtp_porta ?? 587,
    smtp_seguranca: c?.smtp_seguranca ?? "starttls",
    smtp_usuario: c?.smtp_usuario ?? "",
    marca_nome: c?.marca_nome ?? "",
    marca_logo_url: c?.marca_logo_url ?? "",
    marca_cor: c?.marca_cor ?? "",
    rodape: c?.rodape ?? "",
  });

  const { register, control, handleSubmit, watch, reset, setValue, formState: { errors, isDirty } } = useForm<
    EmailForm,
    unknown,
    EmailDados
  >({ resolver: zodResolver(emailSchema), defaultValues: valoresIniciais(config) });

  // Nova versão do banco (ex.: depois de gravar a credencial) sem perder o que está sendo editado.
  useEffect(() => {
    reset(valoresIniciais(config), { keepDirtyValues: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const provedor = watch("provedor");
  const desabilitado = !podeEditar;

  const usarMarcaDoSistema = () => {
    const opcoes = { shouldDirty: true, shouldValidate: true };
    setValue("marca_nome", identidade.nomeOficial ?? "", opcoes);
    setValue("marca_cor", marca.corPrimariaHex ?? "", opcoes);
    if (logoAbsoluta) setValue("marca_logo_url", logoAbsoluta, opcoes);
  };

  // handleSubmit entrega os valores já transformados pelo zod ("" → null).
  const onSubmit = handleSubmit((dados) => salvar.mutate({ canal: "email", dados }));

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">Remetente e servidor</CardTitle>
                <CardDescription>Todo e-mail disparado pelo sistema sai com este remetente.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Controller
                  control={control}
                  name="ativo"
                  render={({ field }) => (
                    <Switch id="email-ativo" checked={field.value} onCheckedChange={field.onChange} disabled={desabilitado} />
                  )}
                />
                <Label htmlFor="email-ativo">Ativo</Label>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label>Provedor</Label>
                <Controller
                  control={control}
                  name="provedor"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={desabilitado}>
                      <SelectTrigger aria-label="Provedor de e-mail"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="smtp">SMTP da instituição (Gmail, Microsoft 365, servidor próprio)</SelectItem>
                        <SelectItem value="resend">Resend (API)</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="remetente_nome">Nome do remetente</Label>
                <Input id="remetente_nome" disabled={desabilitado} placeholder={identidade.nomeCurto} {...register("remetente_nome")} />
                <Erro mensagem={errors.remetente_nome?.message} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="remetente_email">E-mail do remetente</Label>
                <Input id="remetente_email" type="email" disabled={desabilitado} placeholder="nao-responda@instituicao.gov.br" {...register("remetente_email")} />
                <Erro mensagem={errors.remetente_email?.message} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="responder_para">Responder para (opcional)</Label>
                <Input id="responder_para" type="email" disabled={desabilitado} {...register("responder_para")} />
                <Erro mensagem={errors.responder_para?.message} />
              </div>
            </div>

            {podeEditar && config?.segredo_atualizado_em && (
              <p className="text-sm text-muted-foreground">
                Trocar o provedor ou os dados do servidor SMTP apaga a credencial gravada; grave-a de novo depois de salvar.
              </p>
            )}

            {provedor === "smtp" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="smtp_host">Servidor SMTP</Label>
                  <Input id="smtp_host" disabled={desabilitado} placeholder="smtp.instituicao.gov.br" {...register("smtp_host")} />
                  <Erro mensagem={errors.smtp_host?.message} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="smtp_porta">Porta</Label>
                    <Input id="smtp_porta" type="number" inputMode="numeric" disabled={desabilitado} {...register("smtp_porta")} />
                    <Erro mensagem={errors.smtp_porta?.message} />
                  </div>
                  <div className="space-y-1">
                    <Label>Segurança</Label>
                    <Controller
                      control={control}
                      name="smtp_seguranca"
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange} disabled={desabilitado}>
                          <SelectTrigger aria-label="Segurança da conexão SMTP"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="starttls">STARTTLS (587)</SelectItem>
                            <SelectItem value="ssl">SSL/TLS (465)</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="smtp_usuario">Usuário SMTP</Label>
                  <Input id="smtp_usuario" autoComplete="off" disabled={desabilitado} {...register("smtp_usuario")} />
                  <Erro mensagem={errors.smtp_usuario?.message} />
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium">Identidade visual do e-mail</p>
                {podeEditar && (
                  <Button type="button" variant="outline" size="sm" onClick={usarMarcaDoSistema}>
                    Usar a marca do sistema
                  </Button>
                )}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="marca_nome">Nome no cabeçalho</Label>
                  <Input id="marca_nome" disabled={desabilitado} placeholder={identidade.nomeOficial} {...register("marca_nome")} />
                  <Erro mensagem={errors.marca_nome?.message} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="marca_cor">Cor do cabeçalho</Label>
                  <Input id="marca_cor" disabled={desabilitado} placeholder={marca.corPrimariaHex} {...register("marca_cor")} />
                  <Erro mensagem={errors.marca_cor?.message} />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="marca_logo_url">Endereço da logo (https)</Label>
                  <Input id="marca_logo_url" disabled={desabilitado} placeholder={logoAbsoluta} {...register("marca_logo_url")} />
                  <Erro mensagem={errors.marca_logo_url?.message} />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label htmlFor="rodape">Rodapé</Label>
                  <Textarea id="rodape" rows={2} disabled={desabilitado} {...register("rodape")} />
                  <Erro mensagem={errors.rodape?.message} />
                </div>
              </div>
            </div>

            {podeEditar && (
              <div className="flex justify-end">
                <Button type="submit" disabled={salvar.isPending || !isDirty}>
                  {salvar.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                  Salvar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </form>

      <CredencialCard
        canal="email"
        config={config}
        podeEditar={podeEditar}
        rotulo={provedor === "resend" ? "API key do Resend" : "Senha do SMTP"}
        ajuda={
          provedor === "resend"
            ? "Crie a chave no painel do Resend com o domínio do remetente verificado."
            : "No Gmail/Google Workspace e no Microsoft 365, use uma senha de app, não a senha da conta."
        }
      />
      <TesteCard canal="email" podeEditar={podeEditar} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// WhatsApp
// ---------------------------------------------------------------------------

const idMeta = opcional(z.string().trim().regex(/^[0-9]{5,30}$/, "Só números, como aparece no painel da Meta"));
const nomeTemplate = opcional(z.string().trim().regex(/^[a-z0-9_]{1,512}$/, "Letras minúsculas, números e _"));

const whatsappSchema = z
  .object({
    ativo: z.boolean(),
    wa_phone_number_id: idMeta,
    wa_business_account_id: idMeta,
    template_convite_nome: nomeTemplate,
    template_convite_idioma: z.string().trim().regex(/^[a-z]{2}(_[A-Z]{2})?$/, "Ex.: pt_BR"),
  })
  .refine((v) => !v.ativo || !!v.wa_phone_number_id, {
    path: ["wa_phone_number_id"],
    message: "Informe o ID do número para ativar",
  });

type WhatsAppForm = z.input<typeof whatsappSchema>;
type WhatsAppDados = z.output<typeof whatsappSchema>;

function WhatsAppTab({ config, podeEditar }: { config?: ConfigEnvio; podeEditar: boolean }) {
  const salvar = useSalvarConfigEnvio();

  const valoresIniciais = (c?: ConfigEnvio): WhatsAppForm => ({
    ativo: c?.ativo ?? false,
    wa_phone_number_id: c?.wa_phone_number_id ?? "",
    wa_business_account_id: c?.wa_business_account_id ?? "",
    template_convite_nome: c?.wa_templates?.convite_reuniao?.nome ?? "",
    template_convite_idioma: c?.wa_templates?.convite_reuniao?.idioma ?? "pt_BR",
  });

  const { register, control, handleSubmit, reset, formState: { errors, isDirty } } = useForm<
    WhatsAppForm,
    unknown,
    WhatsAppDados
  >({
    resolver: zodResolver(whatsappSchema),
    defaultValues: valoresIniciais(config),
  });

  useEffect(() => {
    reset(valoresIniciais(config), { keepDirtyValues: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config]);

  const desabilitado = !podeEditar;
  const uso = USOS_TEMPLATE_WHATSAPP.convite_reuniao;

  const onSubmit = handleSubmit((v) => {
    const templates = { ...(config?.wa_templates ?? {}) };
    if (v.template_convite_nome) {
      templates.convite_reuniao = { nome: v.template_convite_nome, idioma: v.template_convite_idioma };
    } else {
      delete templates.convite_reuniao;
    }
    salvar.mutate({
      canal: "whatsapp",
      dados: {
        ativo: v.ativo,
        provedor: "meta_cloud",
        wa_phone_number_id: v.wa_phone_number_id,
        wa_business_account_id: v.wa_business_account_id,
        wa_templates: templates,
      },
    });
  });

  return (
    <div className="space-y-4">
      <Alert>
        <MessageCircle className="h-4 w-4" />
        <AlertDescription>
          Usa a API oficial do WhatsApp (Meta Cloud API). Pela regra da Meta, mensagem iniciada pela instituição só
          sai com template aprovado no WhatsApp Manager. Sem template configurado, o convite continua abrindo o
          WhatsApp de quem envia, como antes.
        </AlertDescription>
      </Alert>

      <form onSubmit={onSubmit}>
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">Número e templates</CardTitle>
                <CardDescription>Dados do painel WhatsApp &gt; Configuração da API, no app da Meta.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Controller
                  control={control}
                  name="ativo"
                  render={({ field }) => (
                    <Switch id="wa-ativo" checked={field.value} onCheckedChange={field.onChange} disabled={desabilitado} />
                  )}
                />
                <Label htmlFor="wa-ativo">Ativo</Label>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="wa_phone_number_id">ID do número de telefone</Label>
                <Input id="wa_phone_number_id" inputMode="numeric" disabled={desabilitado} {...register("wa_phone_number_id")} />
                <Erro mensagem={errors.wa_phone_number_id?.message} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="wa_business_account_id">ID da conta do WhatsApp Business (opcional)</Label>
                <Input id="wa_business_account_id" inputMode="numeric" disabled={desabilitado} {...register("wa_business_account_id")} />
                <Erro mensagem={errors.wa_business_account_id?.message} />
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium">Template: {uso.label}</p>
              <p className="mb-3 text-sm text-muted-foreground">
                Variáveis do corpo, nesta ordem: {uso.variaveis.map((v, i) => `{{${i + 1}}} ${v}`).join(", ")}.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="template_convite_nome">Nome do template</Label>
                  <Input id="template_convite_nome" disabled={desabilitado} placeholder="convite_reuniao" {...register("template_convite_nome")} />
                  <Erro mensagem={errors.template_convite_nome?.message} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="template_convite_idioma">Idioma</Label>
                  <Input id="template_convite_idioma" disabled={desabilitado} {...register("template_convite_idioma")} />
                  <Erro mensagem={errors.template_convite_idioma?.message} />
                </div>
              </div>
            </div>

            {podeEditar && (
              <div className="flex justify-end">
                <Button type="submit" disabled={salvar.isPending || !isDirty}>
                  {salvar.isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />}
                  Salvar
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </form>

      <CredencialCard
        canal="whatsapp"
        config={config}
        podeEditar={podeEditar}
        rotulo="Token de acesso"
        ajuda="Use o token permanente de um usuário do sistema no Business Manager (o token temporário do painel expira em 24h)."
      />
      <TesteCard canal="whatsapp" podeEditar={podeEditar} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Histórico
// ---------------------------------------------------------------------------

function HistoricoTab() {
  const { data: envios = [], isLoading } = useEnviosLog();

  if (isLoading) return <Skeleton className="h-40 w-full" />;

  if (envios.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">Nenhum envio registrado ainda.</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quando</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Origem</TableHead>
              <TableHead>Destinatário</TableHead>
              <TableHead>Assunto/template</TableHead>
              <TableHead>Situação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {envios.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="whitespace-nowrap">{formatarDataHora(e.criado_em)}</TableCell>
                <TableCell>{e.canal === "email" ? "E-mail" : "WhatsApp"}</TableCell>
                <TableCell>{ORIGEM_ENVIO_LABEL[e.origem_modulo] ?? e.origem_modulo}</TableCell>
                <TableCell className="whitespace-nowrap">{mascararDestinatario(e.destinatario)}</TableCell>
                <TableCell className="max-w-xs truncate" title={e.assunto ?? undefined}>{e.assunto ?? "—"}</TableCell>
                <TableCell>
                  {e.status === "enviado" ? (
                    <Badge variant="secondary">Enviado</Badge>
                  ) : (
                    <Badge variant="destructive" title={e.erro ?? undefined}>Falhou</Badge>
                  )}
                  {e.status === "falhou" && e.erro && (
                    <p className="mt-1 max-w-xs break-words text-xs text-muted-foreground">{e.erro}</p>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------

export default function ConfigEnviosPage() {
  const { hasPermission } = useAuth();
  const podeEditar = hasPermission(PERMISSAO_CONFIGURAR_ENVIOS);
  const { data: configs, isLoading } = useConfigEnvio();

  return (
    <ModuleLayout
      module="admin"
      title="Envio de e-mail e WhatsApp"
      description="Por onde o sistema dispara e-mails e mensagens, com o remetente e a marca da instituição"
    >
      {!podeEditar && (
        <Alert className="mb-4">
          <AlertDescription>Você pode consultar, mas só quem tem permissão de configurar envios altera estes dados.</AlertDescription>
        </Alert>
      )}
      <Tabs defaultValue="email" className="space-y-4">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="email">
            <Mail className="mr-1 h-4 w-4" /> E-mail
          </TabsTrigger>
          <TabsTrigger value="whatsapp">
            <MessageCircle className="mr-1 h-4 w-4" /> WhatsApp
          </TabsTrigger>
          <TabsTrigger value="historico">
            <History className="mr-1 h-4 w-4" /> Histórico
          </TabsTrigger>
        </TabsList>
        <TabsContent value="email">
          {isLoading ? <Skeleton className="h-64 w-full" /> : <EmailTab config={configs?.email} podeEditar={podeEditar} />}
        </TabsContent>
        <TabsContent value="whatsapp">
          {isLoading ? <Skeleton className="h-64 w-full" /> : <WhatsAppTab config={configs?.whatsapp} podeEditar={podeEditar} />}
        </TabsContent>
        <TabsContent value="historico">
          <HistoricoTab />
        </TabsContent>
      </Tabs>
    </ModuleLayout>
  );
}
