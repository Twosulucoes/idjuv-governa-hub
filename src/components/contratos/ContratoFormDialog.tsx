/**
 * Cadastro (ou edição) do contrato como assinado no SEI: número, contratado, objeto, valores, vigência, orçamento,
 * publicação e garantia. Gestor e fiscais ficam na aba Responsáveis; itens, na aba Itens. Cadastrar exige
 * contratos.criar e alterar exige contratos.editar (conferido também no banco).
 */

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus } from "lucide-react";
import { FormSection } from "@/components/design-system";
import { SeletorBusca } from "@/components/lancamento-setor/SeletorBusca";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useUnidadesEstrutura } from "@/hooks/useLancamentoPorSetor";
import {
  useCadastrarContratado,
  useContratados,
  useProcessosContratacao,
  type ContratoInput,
} from "@/hooks/useContratos";
import { mascararDocumento } from "@/lib/bancario/comum";
import { lerNumeroBr } from "@/lib/pca/numero";
import { SITUACOES_CONTRATO, TIPOS_CONTRATO, type Contrato, type SituacaoContrato } from "@/types/contratos";

const NENHUM = "nenhum";
const valorBr = (obrigatorio: boolean) =>
  z.string().trim().refine((v) => (!v && !obrigatorio) || (Number.isFinite(lerNumeroBr(v)) && lerNumeroBr(v) >= 0), {
    message: obrigatorio ? "Informe o valor (ex.: 120.000,00)" : "Valor inválido",
  });

const schema = z
  .object({
    numero_contrato: z.string().trim().min(1, "Informe o número").max(30),
    ano: z.string().trim().regex(/^\d{4}$/, "Ano com 4 dígitos"),
    status: z.string(),
    processo_sei: z.string().trim().max(60).optional(),
    numero_pncp: z.string().trim().max(80).optional(),
    fornecedor_id: z.string().min(1, "Escolha o contratado"),
    objeto: z.string().trim().min(3, "Descreva o objeto").max(4000),
    objeto_resumido: z.string().trim().max(300).optional(),
    tipo_contrato: z.string(),
    fundamento_legal: z.string().trim().max(500).optional(),
    processo_licitatorio_id: z.string(),
    unidade_demandante_id: z.string().optional(),
    valor_inicial: valorBr(true),
    valor_atual: valorBr(false),
    data_assinatura: z.string().min(1, "Informe a data"),
    data_inicio: z.string().min(1, "Informe a data"),
    data_fim: z.string().min(1, "Informe a data"),
    data_fim_atual: z.string().optional(),
    prorrogavel: z.boolean(),
    prazo_maximo_meses: z.string().trim().refine((v) => !v || (/^\d+$/.test(v) && +v >= 1 && +v <= 600), "Entre 1 e 600 meses").optional(),
    natureza_despesa: z.string().trim().max(30).optional(),
    dotacao_orcamentaria: z.string().trim().max(200).optional(),
    fonte_recurso: z.string().trim().max(50).optional(),
    data_publicacao_doe: z.string().optional(),
    numero_doe: z.string().trim().max(20).optional(),
    garantia_tipo: z.string().trim().max(50).optional(),
    garantia_valor: valorBr(false),
    garantia_vencimento: z.string().optional(),
    observacoes: z.string().trim().max(4000).optional(),
  })
  .refine((d) => d.data_fim >= d.data_inicio, { message: "O fim vem depois do início", path: ["data_fim"] })
  .refine((d) => !d.data_fim_atual || d.data_fim_atual >= d.data_inicio, { message: "O fim atual vem depois do início", path: ["data_fim_atual"] });

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contrato?: Contrato | null;
  salvando?: boolean;
  onSalvar: (dados: ContratoInput) => Promise<unknown>;
}

const texto = (v: string | number | null | undefined) => (v === null || v === undefined ? "" : String(v));
const valorTexto = (v: number | null | undefined) =>
  v === null || v === undefined ? "" : v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const ouNulo = (v: string | undefined) => (v && v.trim() ? v.trim() : null);

export function ContratoFormDialog({ open, onOpenChange, contrato, salvando, onSalvar }: Props) {
  const contratados = useContratados(open);
  const unidades = useUnidadesEstrutura(open);
  const processos = useProcessosContratacao(open);
  const cadastrarContratado = useCadastrarContratado();
  const [novoContratado, setNovoContratado] = useState<{ doc: string; razao: string; fantasia: string } | null>(null);
  const [erroContratado, setErroContratado] = useState<string | null>(null);
  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  const prorrogavel = form.watch("prorrogavel");

  useEffect(() => {
    if (!open) return;
    setNovoContratado(null);
    setErroContratado(null);
    const c = contrato;
    form.reset({
      numero_contrato: c?.numero_contrato ?? "",
      ano: texto(c?.ano ?? new Date().getFullYear()),
      status: c?.status ?? "vigente",
      processo_sei: c?.processo_sei ?? "",
      numero_pncp: c?.numero_pncp ?? "",
      fornecedor_id: c?.fornecedor_id ?? "",
      objeto: c?.objeto ?? "",
      objeto_resumido: c?.objeto_resumido ?? "",
      tipo_contrato: c?.tipo_contrato ?? NENHUM,
      fundamento_legal: c?.fundamento_legal ?? "",
      processo_licitatorio_id: c?.processo_licitatorio_id ?? NENHUM,
      unidade_demandante_id: c?.unidade_demandante_id ?? "",
      valor_inicial: valorTexto(c?.valor_inicial),
      valor_atual: c && c.valor_atual !== c.valor_inicial ? valorTexto(c.valor_atual) : "",
      data_assinatura: c?.data_assinatura ?? "",
      data_inicio: c?.data_inicio ?? "",
      data_fim: c?.data_fim ?? "",
      // fim atual igual ao original = sem prorrogação registrada: o campo fica vazio e o banco copia o fim
      data_fim_atual: c?.data_fim_atual && c.data_fim_atual !== c.data_fim ? c.data_fim_atual : "",
      prorrogavel: c?.prorrogavel ?? false,
      prazo_maximo_meses: texto(c?.prazo_maximo_meses),
      natureza_despesa: c?.natureza_despesa ?? "",
      dotacao_orcamentaria: c?.dotacao_orcamentaria ?? "",
      fonte_recurso: c?.fonte_recurso ?? "",
      data_publicacao_doe: c?.data_publicacao_doe ?? "",
      numero_doe: c?.numero_doe ?? "",
      garantia_tipo: c?.garantia_tipo ?? "",
      garantia_valor: valorTexto(c?.garantia_valor),
      garantia_vencimento: c?.garantia_vencimento ?? "",
      observacoes: c?.observacoes ?? "",
    });
  }, [open, contrato, form]);

  const opcoesContratados = useMemo(
    () => (contratados.data ?? []).map((f) => ({ valor: f.id, rotulo: f.nome_fantasia || f.razao_social, detalhe: mascararDocumento(f.cpf_cnpj) })),
    [contratados.data],
  );
  const opcoesUnidades = useMemo(
    () => (unidades.data ?? []).map((u) => ({ valor: u.id, rotulo: u.nome, detalhe: u.sigla })),
    [unidades.data],
  );

  const salvarContratado = async () => {
    if (!novoContratado) return;
    const digitos = novoContratado.doc.replace(/\D/g, "");
    if (digitos.length !== 11 && digitos.length !== 14) return setErroContratado("CNPJ com 14 dígitos ou CPF com 11.");
    if (novoContratado.razao.trim().length < 3) return setErroContratado("Informe a razão social (ou o nome).");
    try {
      const f = await cadastrarContratado.mutateAsync({
        cpf_cnpj: novoContratado.doc.trim(),
        razao_social: novoContratado.razao.trim(),
        nome_fantasia: novoContratado.fantasia.trim() || null,
      });
      form.setValue("fornecedor_id", f.id, { shouldValidate: true });
      setNovoContratado(null);
      setErroContratado(null);
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  const onSubmit = async (d: FormData) => {
    const valorInicial = lerNumeroBr(d.valor_inicial);
    try {
      await onSalvar({
        id: contrato?.id,
        numero_contrato: d.numero_contrato.trim(),
        ano: Number(d.ano),
        status: d.status as SituacaoContrato,
        processo_sei: ouNulo(d.processo_sei),
        numero_pncp: ouNulo(d.numero_pncp),
        fornecedor_id: d.fornecedor_id,
        objeto: d.objeto.trim(),
        objeto_resumido: ouNulo(d.objeto_resumido),
        tipo_contrato: d.tipo_contrato === NENHUM ? null : d.tipo_contrato,
        fundamento_legal: ouNulo(d.fundamento_legal),
        processo_licitatorio_id: d.processo_licitatorio_id === NENHUM ? null : d.processo_licitatorio_id,
        unidade_demandante_id: d.unidade_demandante_id || null,
        valor_inicial: valorInicial,
        valor_atual: d.valor_atual ? lerNumeroBr(d.valor_atual) : valorInicial,
        data_assinatura: d.data_assinatura,
        data_inicio: d.data_inicio,
        data_fim: d.data_fim,
        data_fim_atual: d.data_fim_atual || null,
        prorrogavel: d.prorrogavel,
        prazo_maximo_meses: d.prorrogavel && d.prazo_maximo_meses ? Number(d.prazo_maximo_meses) : null,
        natureza_despesa: ouNulo(d.natureza_despesa),
        dotacao_orcamentaria: ouNulo(d.dotacao_orcamentaria),
        fonte_recurso: ouNulo(d.fonte_recurso),
        data_publicacao_doe: d.data_publicacao_doe || null,
        numero_doe: ouNulo(d.numero_doe),
        garantia_tipo: ouNulo(d.garantia_tipo),
        garantia_valor: d.garantia_valor ? lerNumeroBr(d.garantia_valor) : null,
        garantia_vencimento: d.garantia_vencimento || null,
        observacoes: ouNulo(d.observacoes),
      });
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation; o diálogo continua aberto
    }
  };

  const campo = (
    name: keyof FormData,
    rotulo: string,
    extra: React.ComponentProps<typeof Input> & { ajuda?: string; largo?: boolean } = {},
  ) => {
    const { ajuda, largo, ...props } = extra;
    return (
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem className={largo ? "md:col-span-2" : undefined}>
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

  const lista = (name: "status" | "tipo_contrato" | "processo_licitatorio_id", rotulo: string, opcoes: { value: string; label: string }[]) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{rotulo}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
            <SelectContent>
              {opcoes.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  const processosLista = processos.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{contrato ? `Editar contrato ${contrato.numero_contrato}/${contrato.ano}` : "Cadastrar contrato"}</DialogTitle>
          <DialogDescription>Os dados como estão no contrato assinado no SEI. Campos com * são obrigatórios.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <FormSection titulo="Identificação" colunas={3}>
              {campo("numero_contrato", "Nº do contrato *", { placeholder: "Ex.: 01" })}
              {campo("ano", "Ano *", { inputMode: "numeric", maxLength: 4 })}
              {/* contrato assinado não volta a rascunho (o banco também recusa) */}
              {lista("status", "Situação *", SITUACOES_CONTRATO.filter((s) => s.value !== "rascunho" || !contrato || contrato.status === "rascunho"))}
              {campo("processo_sei", "Processo SEI", { placeholder: "00000.000000/0000.00", largo: true })}
              {campo("numero_pncp", "Nº no PNCP")}
            </FormSection>

            <FormSection titulo="Contratado e objeto">
              <FormField
                control={form.control}
                name="fornecedor_id"
                render={({ field, fieldState }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel htmlFor="ct-contratado">Contratado *</FormLabel>
                    <SeletorBusca
                      id="ct-contratado"
                      opcoes={opcoesContratados}
                      valor={field.value}
                      aoEscolher={field.onChange}
                      carregando={contratados.isLoading}
                      placeholder="Escolha pelo nome ou CNPJ"
                      placeholderBusca="Nome, razão social ou CNPJ"
                      vazio="Nenhum contratado com esse nome. Cadastre abaixo."
                      invalido={!!fieldState.error}
                    />
                    <FormMessage />
                    {!novoContratado ? (
                      <Button type="button" variant="link" className="h-auto p-0" onClick={() => setNovoContratado({ doc: "", razao: "", fantasia: "" })}>
                        <UserPlus className="h-4 w-4" aria-hidden="true" />
                        Cadastrar contratado que não está na lista
                      </Button>
                    ) : (
                      <div className="space-y-3 rounded-md border border-border p-3">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="ct-novo-doc">CNPJ ou CPF</Label>
                            <Input id="ct-novo-doc" value={novoContratado.doc} inputMode="numeric"
                              onChange={(e) => setNovoContratado({ ...novoContratado, doc: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="ct-novo-fantasia">Nome fantasia</Label>
                            <Input id="ct-novo-fantasia" value={novoContratado.fantasia}
                              onChange={(e) => setNovoContratado({ ...novoContratado, fantasia: e.target.value })} />
                          </div>
                          <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="ct-novo-razao">Razão social (ou nome, se pessoa física)</Label>
                            <Input id="ct-novo-razao" value={novoContratado.razao}
                              onChange={(e) => setNovoContratado({ ...novoContratado, razao: e.target.value })} />
                          </div>
                        </div>
                        {erroContratado && <p className="text-sm font-medium text-destructive" role="alert">{erroContratado}</p>}
                        <div className="flex flex-wrap gap-2">
                          <Button type="button" size="sm" onClick={salvarContratado} disabled={cadastrarContratado.isPending}>Cadastrar e usar</Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => setNovoContratado(null)}>Cancelar</Button>
                        </div>
                      </div>
                    )}
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="objeto"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Objeto *</FormLabel>
                    <FormControl><Textarea rows={3} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {campo("objeto_resumido", "Objeto (resumo)", { placeholder: "Ex.: Limpeza e conservação", ajuda: "Aparece na lista e nos avisos." })}
              {lista("tipo_contrato", "Tipo", [{ value: NENHUM, label: "Não informado" }, ...TIPOS_CONTRATO])}
              {campo("fundamento_legal", "Modalidade e fundamento", { placeholder: "Ex.: Pregão eletrônico 05/2025, Lei 14.133/2021", largo: true })}
              <FormField
                control={form.control}
                name="unidade_demandante_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="ct-setor">Setor que pediu</FormLabel>
                    <SeletorBusca
                      id="ct-setor"
                      opcoes={opcoesUnidades}
                      valor={field.value}
                      aoEscolher={field.onChange}
                      carregando={unidades.isLoading}
                      placeholder="Escolha o setor"
                      placeholderBusca="Nome ou sigla"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              {processosLista.length > 0 &&
                lista("processo_licitatorio_id", "Processo de contratação (Compras)", [
                  { value: NENHUM, label: "Não ligado" },
                  ...processosLista.map((p) => ({ value: p.id, label: `${p.numero_processo} · ${p.objeto_resumido ?? p.objeto}`.slice(0, 120) })),
                ])}
            </FormSection>

            <FormSection titulo="Valores e vigência" colunas={3}>
              {campo("valor_inicial", "Valor inicial (R$) *", { inputMode: "decimal", placeholder: "0,00" })}
              {campo("valor_atual", "Valor atual (R$)", { inputMode: "decimal", placeholder: "igual ao inicial", ajuda: "Com aditivos e apostilas. Vazio = valor inicial." })}
              {campo("data_assinatura", "Assinatura *", { type: "date" })}
              {campo("data_inicio", "Início da vigência *", { type: "date" })}
              {campo("data_fim", "Fim da vigência *", { type: "date" })}
              {campo("data_fim_atual", "Fim atual (prorrogado)", { type: "date", ajuda: "Só se já houve prorrogação." })}
              <FormField
                control={form.control}
                name="prorrogavel"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3 space-y-0 pt-6">
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                    <FormLabel className="!mt-0">Pode ser prorrogado</FormLabel>
                  </FormItem>
                )}
              />
              {prorrogavel && campo("prazo_maximo_meses", "Prazo máximo (meses)", { inputMode: "numeric", ajuda: "Somando as prorrogações (ex.: 120 para serviço contínuo)." })}
            </FormSection>

            <FormSection titulo="Orçamento" colunas={3}>
              {campo("natureza_despesa", "Natureza da despesa", { placeholder: "Ex.: 3.3.90.39" })}
              {campo("dotacao_orcamentaria", "Dotação orçamentária")}
              {campo("fonte_recurso", "Fonte de recurso")}
            </FormSection>

            <FormSection titulo="Publicação e garantia" colunas={3}>
              {campo("data_publicacao_doe", "Publicação no DOE", { type: "date" })}
              {campo("numero_doe", "Nº do DOE")}
              <div className="hidden lg:block" aria-hidden="true" />
              {campo("garantia_tipo", "Garantia (tipo)", { placeholder: "Ex.: Seguro-garantia" })}
              {campo("garantia_valor", "Valor da garantia (R$)", { inputMode: "decimal" })}
              {campo("garantia_vencimento", "Vencimento da garantia", { type: "date" })}
            </FormSection>

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl><Textarea rows={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={salvando}>{contrato ? "Salvar alterações" : "Cadastrar contrato"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
