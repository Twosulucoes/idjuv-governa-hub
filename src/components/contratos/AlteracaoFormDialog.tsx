/**
 * Registro (ou correção) de uma alteração do contrato como está no SEI: termo aditivo, apostilamento, suspensão,
 * rescisão ou a situação anterior ao sistema. Os campos mudam pela espécie; antes de gravar, mostra como ficam o
 * valor atual e o fim da vigência e os avisos dos limites da lei (avisa, não trava). O ato é do SEI; aqui só se
 * registra. Exige contratos.editar (conferido também no banco, que recalcula o contrato).
 */

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { FormSection } from "@/components/design-system";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useSalvarAlteracao, type AlteracaoInput } from "@/hooks/useContratos";
import { avisosLimites, proximoNumero, resumoAlteracoes, simularAlteracao, tituloAlteracao } from "@/lib/contratos/alteracoes";
import { formatCurrency, formatDateBR } from "@/lib/formatters";
import { lerNumeroBr } from "@/lib/pca/numero";
import {
  ESPECIES_ALTERACAO,
  MOTIVOS_APOSTILAMENTO,
  MOTIVOS_RESCISAO,
  type Contrato,
  type ContratoAlteracao,
  type EspecieAlteracao,
} from "@/types/contratos";

type ContratoBase = Pick<
  Contrato,
  "id" | "numero_contrato" | "ano" | "processo_sei" | "valor_inicial" | "valor_atual" | "data_inicio" | "data_fim" | "data_fim_atual" | "prorrogavel" | "prazo_maximo_meses" | "reforma"
>;

const COM_PERCENTUAL = new Set(["reajuste", "repactuacao"]);
const COM_VARIACAO = new Set(["reajuste", "repactuacao", "outro"]);
const numero = (t: string) => {
  const v = t ? lerNumeroBr(t) : 0;
  return Number.isFinite(v) ? v : 0;
};
const valorInvalido = (t: string) => !!t && !(Number.isFinite(lerNumeroBr(t)) && lerNumeroBr(t) >= 0);
const valorTexto = (v: number | null | undefined) =>
  v ? Math.abs(v).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "";

type CamposEspecie = Partial<{ especie: EspecieAlteracao; motivo: string; altera_prazo: boolean; altera_valor: boolean }>;

/** Os campos que a espécie (e o motivo) usa: só eles são conferidos e gravados (os CHECKs da tabela pedem isso). */
function camposUsados(d: CamposEspecie) {
  const e = d.especie;
  const motivo = d.motivo ?? "";
  return {
    prazo: (e === "aditivo" && d.altera_prazo) || (e === "apostilamento" && motivo === "prorrogacao_suspensao") || e === "partida",
    acrescimo: e === "aditivo" && !!d.altera_valor,
    variacao: e === "partida" || (e === "apostilamento" && COM_VARIACAO.has(motivo)),
    percentual: e === "apostilamento" && COM_PERCENTUAL.has(motivo),
  };
}

function criarSchema(inicioContrato: string) {
  return z
    .object({
      especie: z.enum(["aditivo", "apostilamento", "suspensao", "rescisao", "partida"]),
      numero: z.string().trim(),
      altera_prazo: z.boolean(),
      altera_valor: z.boolean(),
      altera_objeto: z.boolean(),
      motivo: z.string(),
      valor_acrescimo: z.string().trim(),
      valor_supressao: z.string().trim(),
      sentido: z.enum(["aumenta", "reduz"]),
      valor_variacao: z.string().trim(),
      percentual: z.string().trim(),
      indice: z.string().trim().max(60),
      nova_data_fim: z.string(),
      data_inicio: z.string(),
      data_retomada: z.string(),
      documento_retomada_sei: z.string().trim().max(60),
      descricao: z.string().trim().min(1, "Resuma o que o documento diz").max(2000),
      justificativa: z.string().trim().max(2000),
      fundamento_legal: z.string().trim().max(500),
      processo_sei: z.string().trim().max(60),
      documento_sei: z.string().trim().max(60),
      data_assinatura: z.string(),
      data_publicacao_doe: z.string(),
      numero_doe: z.string().trim().max(20),
    })
    .superRefine((d, ctx) => {
      const erro = (path: string, message: string) => ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message });
      const antesDoInicio = (v: string) => !!v && v < inicioContrato;
      const e = d.especie;
      const usa = camposUsados(d);
      if ((e === "aditivo" || e === "apostilamento") && !(/^\d+$/.test(d.numero) && +d.numero >= 1 && +d.numero <= 999)) {
        erro("numero", "De 1 a 999");
      }
      if ((e === "aditivo" || e === "apostilamento") && !d.data_assinatura) erro("data_assinatura", "Informe a data de assinatura");
      const numericos = [...(usa.acrescimo ? ["valor_acrescimo", "valor_supressao"] as const : []), ...(usa.variacao ? ["valor_variacao"] as const : [])];
      for (const campo of numericos) {
        if (valorInvalido(d[campo])) erro(campo, "Valor inválido (ex.: 12.000,00)");
      }
      if (e === "aditivo") {
        if (!d.altera_prazo && !d.altera_valor && !d.altera_objeto) erro("altera_objeto", "Marque o que o aditivo muda");
        if (d.altera_prazo && !d.nova_data_fim) erro("nova_data_fim", "Informe o novo fim da vigência");
        if (usa.acrescimo && numero(d.valor_acrescimo) <= 0 && numero(d.valor_supressao) <= 0) {
          erro("valor_acrescimo", "Informe o acréscimo ou a supressão");
        }
      }
      if (e === "apostilamento") {
        if (!d.motivo) erro("motivo", "Escolha o motivo");
        if (d.motivo === "prorrogacao_suspensao" && !d.nova_data_fim) erro("nova_data_fim", "Informe o novo fim da vigência");
        if (d.percentual && usa.percentual) {
          const p = lerNumeroBr(d.percentual);
          if (!Number.isFinite(p) || p < -100 || p > 1000) erro("percentual", "Entre -100 e 1000");
        }
      }
      if (e === "suspensao" || e === "rescisao") {
        if (!d.data_inicio) erro("data_inicio", "Informe a data");
        else if (antesDoInicio(d.data_inicio)) erro("data_inicio", `Não pode ser antes do início do contrato (${formatDateBR(inicioContrato)})`);
      }
      if (e === "suspensao" && d.data_retomada && d.data_inicio && d.data_retomada < d.data_inicio) {
        erro("data_retomada", "A retomada não pode ser antes do início da suspensão");
      }
      if (e === "rescisao" && !d.motivo) erro("motivo", "Escolha a forma da rescisão");
      if (e === "partida" && numero(d.valor_variacao) === 0 && !d.nova_data_fim) {
        erro("valor_variacao", "Informe a diferença de valor ou o fim");
      }
      if (usa.prazo && antesDoInicio(d.nova_data_fim)) erro("nova_data_fim", `Não pode ser antes do início do contrato (${formatDateBR(inicioContrato)})`);
    });
}

type FormData = z.infer<ReturnType<typeof criarSchema>>;

/** Do formulário para a linha do banco: cada espécie só leva os campos dela (os CHECKs da tabela pedem isso). */
function montarAlteracao(d: FormData, contratoId: string): AlteracaoInput {
  const e = d.especie;
  const usa = camposUsados(d);
  const ou = (t: string) => t.trim() || null;
  return {
    contrato_id: contratoId,
    especie: e,
    numero: e === "aditivo" || e === "apostilamento" ? Number(d.numero) : null,
    altera_prazo: e === "aditivo" && d.altera_prazo,
    altera_valor: e === "aditivo" && d.altera_valor,
    altera_objeto: e === "aditivo" && d.altera_objeto,
    motivo: e === "apostilamento" || e === "rescisao" ? d.motivo || null : null,
    valor_acrescimo: usa.acrescimo ? numero(d.valor_acrescimo) : 0,
    valor_supressao: usa.acrescimo ? numero(d.valor_supressao) : 0,
    valor_variacao: usa.variacao ? (d.sentido === "reduz" ? -1 : 1) * numero(d.valor_variacao) : 0,
    percentual: usa.percentual && d.percentual ? lerNumeroBr(d.percentual) : null,
    indice: usa.percentual ? ou(d.indice) : null,
    nova_data_fim: usa.prazo ? d.nova_data_fim || null : null,
    data_inicio: e === "suspensao" || e === "rescisao" ? d.data_inicio : null,
    data_retomada: e === "suspensao" ? d.data_retomada || null : null,
    documento_retomada_sei: e === "suspensao" && d.data_retomada ? ou(d.documento_retomada_sei) : null,
    descricao: d.descricao.trim(),
    justificativa: ou(d.justificativa),
    fundamento_legal: ou(d.fundamento_legal),
    processo_sei: ou(d.processo_sei),
    documento_sei: ou(d.documento_sei),
    data_assinatura: e === "suspensao" || e === "partida" ? null : d.data_assinatura || null,
    data_publicacao_doe: e === "partida" ? null : d.data_publicacao_doe || null,
    numero_doe: e === "partida" ? null : ou(d.numero_doe),
  };
}

interface Props {
  /** "nova" abre em branco; uma alteração abre para corrigir. */
  alteracao: ContratoAlteracao | "nova" | null;
  contrato: ContratoBase;
  alteracoes: ContratoAlteracao[];
  onClose: () => void;
}

export function AlteracaoFormDialog({ alteracao, contrato, alteracoes, onClose }: Props) {
  const salvar = useSalvarAlteracao();
  const existente = alteracao && alteracao !== "nova" ? alteracao : null;
  const schema = useMemo(() => criarSchema(contrato.data_inicio), [contrato.data_inicio]);
  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  const atual = useMemo(() => resumoAlteracoes(contrato, alteracoes), [contrato, alteracoes]);

  useEffect(() => {
    if (!alteracao) return;
    const a = existente;
    form.reset({
      especie: (a?.especie ?? "aditivo") as EspecieAlteracao,
      numero: String(a?.numero ?? proximoNumero(alteracoes, "aditivo")),
      altera_prazo: a?.altera_prazo ?? false,
      altera_valor: a?.altera_valor ?? false,
      altera_objeto: a?.altera_objeto ?? false,
      motivo: a?.motivo ?? "",
      valor_acrescimo: valorTexto(a?.valor_acrescimo),
      valor_supressao: valorTexto(a?.valor_supressao),
      sentido: a && Number(a.valor_variacao) < 0 ? "reduz" : "aumenta",
      valor_variacao: valorTexto(a?.valor_variacao),
      percentual: a?.percentual !== null && a?.percentual !== undefined ? String(a.percentual).replace(".", ",") : "",
      indice: a?.indice ?? "",
      nova_data_fim: a?.nova_data_fim ?? "",
      data_inicio: a?.data_inicio ?? "",
      data_retomada: a?.data_retomada ?? "",
      documento_retomada_sei: a?.documento_retomada_sei ?? "",
      descricao: a?.descricao ?? "",
      justificativa: a?.justificativa ?? "",
      fundamento_legal: a?.fundamento_legal ?? "",
      processo_sei: a ? a.processo_sei ?? "" : contrato.processo_sei ?? "",
      documento_sei: a?.documento_sei ?? "",
      data_assinatura: a?.data_assinatura ?? "",
      data_publicacao_doe: a?.data_publicacao_doe ?? "",
      numero_doe: a?.numero_doe ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reabrir zera o formulário
  }, [alteracao]);

  const valores = form.watch();
  const especie = valores.especie ?? "aditivo";

  // espécie nova: o nº sugerido acompanha (1º, 2º...); a situação anterior não herda o processo do contrato
  const trocarEspecie = (v: EspecieAlteracao) => {
    form.setValue("especie", v);
    if (v === "aditivo" || v === "apostilamento") form.setValue("numero", String(proximoNumero(alteracoes, v)));
    form.setValue("motivo", "");
    form.setValue("processo_sei", v === "partida" ? "" : contrato.processo_sei ?? "");
    form.clearErrors();
  };

  const simulado = useMemo(() => {
    if (!alteracao || !valores.especie) return null;
    const linha = {
      ...montarAlteracao(valores as FormData, contrato.id),
      id: existente?.id ?? "",
      created_at: existente?.created_at ?? new Date().toISOString(),
    } as ContratoAlteracao;
    const resumo = simularAlteracao(contrato, alteracoes, linha);
    return { resumo, avisos: avisosLimites(contrato, [...alteracoes.filter((a) => a.id !== linha.id), linha], resumo) };
  }, [alteracao, valores, contrato, alteracoes, existente]);

  const onSubmit = async (d: FormData) => {
    try {
      await salvar.mutateAsync({ ...montarAlteracao(d, contrato.id), id: existente?.id });
      onClose();
    } catch {
      // erro já exibido pelo toast da mutation; o diálogo continua aberto
    }
  };

  const campo = (name: keyof FormData, rotulo: string, extra: React.ComponentProps<typeof Input> & { ajuda?: string } = {}) => {
    const { ajuda, ...props } = extra;
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{rotulo}</FormLabel>
            <FormControl>
              <Input {...props} value={(field.value as string | undefined) ?? ""} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} />
            </FormControl>
            {ajuda && <FormDescription>{ajuda}</FormDescription>}
            <FormMessage />
          </FormItem>
        )}
      />
    );
  };

  const lista = (name: "motivo" | "sentido", rotulo: string, opcoes: readonly { value: string; label: string }[]) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{rotulo}</FormLabel>
          <Select value={field.value || undefined} onValueChange={field.onChange}>
            <FormControl><SelectTrigger><SelectValue placeholder="Escolha" /></SelectTrigger></FormControl>
            <SelectContent>
              {opcoes.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const marca = (name: "altera_prazo" | "altera_valor" | "altera_objeto", rotulo: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-row items-center gap-2 space-y-0">
          <FormControl><Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} /></FormControl>
          <FormLabel className="!mt-0 font-normal">{rotulo}</FormLabel>
          {name === "altera_objeto" && <FormMessage className="basis-full" />}
        </FormItem>
      )}
    />
  );

  const variacao = (ajuda?: string) => (
    <>
      {lista("sentido", "Efeito no valor", [{ value: "aumenta", label: "Aumenta o valor" }, { value: "reduz", label: "Reduz o valor" }])}
      {campo("valor_variacao", "Diferença (R$)", { inputMode: "decimal", placeholder: "0,00", ajuda })}
    </>
  );

  // espécies que ainda cabem: uma rescisão, uma situação anterior e uma suspensão em aberto por contrato
  const especiesNovas = ESPECIES_ALTERACAO.filter((e) =>
    (e.value !== "rescisao" || !atual.rescisao) && (e.value !== "partida" || !alteracoes.some((a) => a.especie === "partida"))
    && (e.value !== "suspensao" || !atual.suspensaoAberta));

  const motivo = valores.motivo;
  const titulo = existente ? `Corrigir ${tituloAlteracao(existente).toLowerCase()}` : "Registrar alteração";

  return (
    <Dialog open={!!alteracao} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>
            Contrato {contrato.numero_contrato}/{contrato.ano}. Registre como está no documento assinado no SEI. Campos com * são obrigatórios.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <FormSection titulo="Tipo" colunas={2}>
              <FormField
                control={form.control}
                name="especie"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Espécie *</FormLabel>
                    <Select value={field.value} onValueChange={(v) => trocarEspecie(v as EspecieAlteracao)} disabled={!!existente}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {(existente ? ESPECIES_ALTERACAO : especiesNovas).map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              {(especie === "aditivo" || especie === "apostilamento") && campo("numero", "Nº *", { inputMode: "numeric", maxLength: 3, ajuda: "Sugerido: o próximo da espécie." })}
              {especie === "apostilamento" && lista("motivo", "Motivo *", MOTIVOS_APOSTILAMENTO)}
              {especie === "rescisao" && lista("motivo", "Forma da rescisão *", MOTIVOS_RESCISAO)}
            </FormSection>

            <FormSection titulo="O que muda" colunas={2}>
              {especie === "aditivo" && (
                <>
                  <div className="flex flex-wrap gap-x-6 gap-y-2 md:col-span-2">
                    {marca("altera_prazo", "Prorroga o prazo")}
                    {marca("altera_valor", "Muda o valor")}
                    {marca("altera_objeto", "Muda o objeto")}
                  </div>
                  {valores.altera_prazo && campo("nova_data_fim", "Novo fim da vigência *", { type: "date" })}
                  {valores.altera_valor && campo("valor_acrescimo", "Acréscimo (R$)", { inputMode: "decimal", placeholder: "0,00" })}
                  {valores.altera_valor && campo("valor_supressao", "Supressão (R$)", { inputMode: "decimal", placeholder: "0,00" })}
                </>
              )}
              {especie === "apostilamento" && COM_PERCENTUAL.has(motivo) && (
                <>
                  {campo("percentual", "Percentual (%)", { inputMode: "decimal", placeholder: "Ex.: 4,5" })}
                  {campo("indice", "Índice", { placeholder: "Ex.: IPCA" })}
                  {variacao("Quanto o valor do contrato muda.")}
                </>
              )}
              {especie === "apostilamento" && motivo === "prorrogacao_suspensao" &&
                campo("nova_data_fim", "Novo fim da vigência *", { type: "date", ajuda: "O fim volta a correr pelo tempo em que o contrato ficou parado (art. 115, §5º)." })}
              {especie === "apostilamento" && motivo === "outro" && variacao("Deixe vazio se não muda o valor.")}
              {especie === "apostilamento" && (motivo === "dotacao" || !motivo) && (
                <p className="text-sm text-muted-foreground md:col-span-2">
                  {motivo ? "Troca da dotação orçamentária: não muda o valor nem o prazo." : "Escolha o motivo do apostilamento."}
                </p>
              )}
              {especie === "suspensao" && (
                <>
                  {campo("data_inicio", "Início da paralisação *", { type: "date" })}
                  {existente && campo("data_retomada", "Retomada", { type: "date", ajuda: "Vazio enquanto o contrato está parado." })}
                  {existente && valores.data_retomada && campo("documento_retomada_sei", "Documento SEI da retomada", { inputMode: "numeric" })}
                </>
              )}
              {especie === "rescisao" && campo("data_inicio", "Data da extinção *", { type: "date", ajuda: "O fim atual do contrato passa a ser esta data." })}
              {especie === "partida" && (
                <>
                  {variacao("Diferença entre o valor atual e o inicial que já vinha antes do sistema.")}
                  {campo("nova_data_fim", "Fim da vigência que já vinha", { type: "date" })}
                </>
              )}
            </FormSection>

            <FormSection titulo="Documento no SEI" colunas={3}>
              {campo("processo_sei", "Processo SEI", { placeholder: especie === "partida" ? "" : "o do contrato", ajuda: especie === "partida" ? undefined : "Vazio = o do contrato." })}
              {campo("documento_sei", "Nº do documento SEI", { inputMode: "numeric" })}
              {especie !== "suspensao" && especie !== "partida" &&
                campo("data_assinatura", especie === "rescisao" ? "Assinatura do termo" : "Assinatura *", { type: "date" })}
              {especie !== "partida" && campo("data_publicacao_doe", "Publicação no DOE", { type: "date" })}
              {especie !== "partida" && campo("numero_doe", "Nº do DOE")}
            </FormSection>

            <FormSection titulo="Descrição" colunas={1}>
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>O que o documento diz *</FormLabel>
                    <FormControl><Textarea rows={2} placeholder="Ex.: Prorroga a vigência por 12 meses, de 01/01/2027 a 31/12/2027." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="justificativa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Justificativa</FormLabel>
                    <FormControl><Textarea rows={2} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {campo("fundamento_legal", "Fundamento legal", { placeholder: "Ex.: art. 107 da Lei 14.133/2021" })}
            </FormSection>

            {simulado && (
              <section aria-labelledby="alt-como-fica" className="space-y-3 rounded-md border border-border p-4">
                <h3 id="alt-como-fica" className="text-sm font-semibold">Como fica o contrato</h3>
                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">Valor atual</dt>
                    <dd className="flex flex-wrap items-center gap-1 tabular-nums">
                      {formatCurrency(atual.valorAtual)}
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-label="passa a" />
                      <strong>{formatCurrency(simulado.resumo.valorAtual)}</strong>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Fim da vigência</dt>
                    <dd className="flex flex-wrap items-center gap-1">
                      {formatDateBR(atual.fimAtual)}
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" aria-label="passa a" />
                      <strong>{formatDateBR(simulado.resumo.fimAtual)}</strong>
                    </dd>
                  </div>
                </dl>
                {simulado.avisos.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                    <AlertDescription>
                      <ul className="space-y-1">
                        {simulado.avisos.map((t) => <li key={t}>{t}</li>)}
                      </ul>
                      <p className="mt-1">O sistema avisa, mas não impede o registro: confira o documento no SEI.</p>
                    </AlertDescription>
                  </Alert>
                )}
              </section>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={salvar.isPending}>{existente ? "Salvar correção" : "Registrar"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
