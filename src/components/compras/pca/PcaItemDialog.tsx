/**
 * Lançamento (ou edição) de um item do PCA a partir de um DFD do SEI: número do processo, setor, item do catálogo,
 * quantidade, valor estimado, mês desejado, prioridade, ação orçamentária e fonte. A natureza vem indicada pelo
 * catálogo (portal do Compras.gov.br, casada com as naturezas do estado): uma só = preenchida; outra escolhida = aviso.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/formatters";
import { lerNumeroBr } from "@/lib/pca/numero";
import { casarNaturezasDoCatalogo } from "@/lib/pca/naturezaCatalogo";
import { useUnidadesEstrutura } from "@/hooks/useLancamentoPorSetor";
import { useNaturezasDoCatalogo, type ClassificadoresPca, type PcaItem, type PcaItemInput } from "@/hooks/usePca";
import { CatalogoBusca, type EscolhaCatalogo } from "./CatalogoBusca";
import { MESES, PRIORIDADE_LABEL, rotuloClassificador } from "./rotulos";

const SEM_VALOR = "nenhum";

const numeroBr = lerNumeroBr;

const schema = z.object({
  numero_sei: z.string().trim().min(1, "Informe o número do processo SEI do DFD").max(60),
  setor_id: z.string().optional(),
  descricao: z.string().trim().min(1, "Descreva o item").max(1000),
  unidade_fornecimento: z.string().trim().min(1, "Informe a unidade (ex.: unidade, caixa, mês)").max(60),
  quantidade: z.string().refine((v) => numeroBr(v) > 0, "Quantidade maior que zero"),
  valor_unitario: z.string().refine((v) => !Number.isNaN(numeroBr(v)) && numeroBr(v) >= 0, "Valor inválido"),
  mes_desejado: z.string().min(1, "Escolha o mês"),
  prioridade: z.enum(["alta", "media", "baixa"]),
  acao_id: z.string().min(1, "Escolha a ação orçamentária"),
  fonte_recurso_id: z.string().min(1, "Escolha a fonte de recurso"),
  natureza_despesa_id: z.string().optional(),
  justificativa: z.string().trim().max(2000).optional(),
});

type FormData = z.infer<typeof schema>;

interface PcaItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: PcaItem | null;
  /** nome e grupo do catálogo do item em edição */
  escolhaInicial?: EscolhaCatalogo | null;
  classificadores: ClassificadoresPca | undefined;
  salvando?: boolean;
  onSalvar: (item: PcaItemInput) => Promise<unknown>;
}

const paraTexto = (n: number | null | undefined) => (n == null ? "" : String(n).replace(".", ","));

export function PcaItemDialog({ open, onOpenChange, item, escolhaInicial, classificadores, salvando, onSalvar }: PcaItemDialogProps) {
  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  const { data: setores } = useUnidadesEstrutura(open);
  const [tipo, setTipo] = useState<"material" | "servico">("material");
  const [escolha, setEscolha] = useState<EscolhaCatalogo | null>(null);
  const [codigoItem, setCodigoItem] = useState<number | null>(null);
  const [erroCatalogo, setErroCatalogo] = useState(false);
  const preenchidaPeloCatalogo = useRef<string | null>(null);

  useEffect(() => {
    if (!open) {
      // Fechado: limpa a escolha, para a próxima abertura não consultar o catálogo do item anterior
      setEscolha(null);
      return;
    }
    setTipo((item?.tipo as "material" | "servico") ?? "material");
    setEscolha(escolhaInicial ?? null);
    setCodigoItem(item?.codigo_item ?? null);
    setErroCatalogo(false);
    preenchidaPeloCatalogo.current = null;
    form.reset({
      numero_sei: item?.numero_sei ?? "",
      setor_id: item?.setor_id ?? SEM_VALOR,
      descricao: item?.descricao ?? "",
      unidade_fornecimento: item?.unidade_fornecimento ?? "",
      quantidade: paraTexto(item?.quantidade),
      valor_unitario: paraTexto(item?.valor_unitario),
      mes_desejado: item?.mes_desejado ? String(item.mes_desejado) : "",
      prioridade: (item?.prioridade as FormData["prioridade"]) ?? "media",
      acao_id: item?.acao_id ?? "",
      fonte_recurso_id: item?.fonte_recurso_id ?? "",
      natureza_despesa_id: item?.natureza_despesa_id ?? SEM_VALOR,
      justificativa: item?.justificativa ?? "",
    });
  }, [open, item, escolhaInicial, form]);

  // Natureza indicada pelo catálogo para o PDM ou serviço escolhido
  const naturezasPortal = useNaturezasDoCatalogo(tipo, open ? escolha?.codigo : null);
  const indicadas = useMemo(
    () => casarNaturezasDoCatalogo(naturezasPortal.data ?? [], classificadores?.naturezas ?? []),
    [naturezasPortal.data, classificadores?.naturezas],
  );
  const idsIndicados = useMemo(() => new Set(indicadas.map((n) => n.id)), [indicadas]);
  const naturezasOrdenadas = useMemo(
    () => [...(classificadores?.naturezas ?? [])].sort((a, b) => Number(idsIndicados.has(b.id)) - Number(idsIndicados.has(a.id))),
    [classificadores?.naturezas, idsIndicados],
  );
  const naturezaEscolhida = form.watch("natureza_despesa_id");

  useEffect(() => {
    // Item novo, uma só indicada e nada escolhido ainda: preenche (na edição, "Não informada" pode ser de propósito)
    if (item || indicadas.length !== 1) return;
    const atual = form.getValues("natureza_despesa_id");
    if (!atual || atual === SEM_VALOR) {
      form.setValue("natureza_despesa_id", indicadas[0].id, { shouldDirty: true });
      preenchidaPeloCatalogo.current = indicadas[0].id;
    }
  }, [item, indicadas, form]);

  const quantidade = numeroBr(form.watch("quantidade") ?? "");
  const valorUnitario = numeroBr(form.watch("valor_unitario") ?? "");
  const total = quantidade > 0 && valorUnitario >= 0 ? Math.round(quantidade * valorUnitario * 100) / 100 : null;

  const onSubmit = async (d: FormData) => {
    if (!escolha) {
      setErroCatalogo(true);
      return;
    }
    try {
      await onSalvar({
        id: item?.id,
        numero_sei: d.numero_sei,
        setor_id: d.setor_id && d.setor_id !== SEM_VALOR ? d.setor_id : null,
        tipo,
        codigo_pdm: tipo === "material" ? escolha.codigo : null,
        codigo_servico: tipo === "servico" ? escolha.codigo : null,
        codigo_item: tipo === "material" ? codigoItem : null,
        descricao: d.descricao,
        unidade_fornecimento: d.unidade_fornecimento,
        quantidade: numeroBr(d.quantidade),
        valor_unitario: numeroBr(d.valor_unitario),
        mes_desejado: Number(d.mes_desejado),
        prioridade: d.prioridade,
        acao_id: d.acao_id,
        fonte_recurso_id: d.fonte_recurso_id,
        natureza_despesa_id: d.natureza_despesa_id && d.natureza_despesa_id !== SEM_VALOR ? d.natureza_despesa_id : null,
        justificativa: d.justificativa || null,
      });
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation; o diálogo continua aberto
    }
  };

  const selectClassificador = (nome: "acao_id" | "fonte_recurso_id", rotulo: string, lista: ClassificadoresPca["acoes"]) => (
    <FormField
      control={form.control}
      name={nome}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{rotulo} *</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger><SelectValue placeholder="Escolha" /></SelectTrigger>
            </FormControl>
            <SelectContent>
              {lista.map((c) => <SelectItem key={c.id} value={c.id}>{rotuloClassificador(c)}</SelectItem>)}
            </SelectContent>
          </Select>
          {lista.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma cadastrada no Financeiro.</p>}
          <FormMessage />
        </FormItem>
      )}
    />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Editar item do PCA" : "Lançar DFD no PCA"}</DialogTitle>
          <DialogDescription>Dados do DFD que chegou pelo SEI. O DFD continua sendo o documento oficial.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="numero_sei"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Processo SEI do DFD *</FormLabel>
                    <FormControl><Input placeholder="00000.000000/2026-00" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="setor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Setor requisitante</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={SEM_VALOR}>Não informado</SelectItem>
                        {(setores ?? []).map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.sigla ? `${s.sigla} – ${s.nome}` : s.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">É material ou serviço? *</legend>
              <RadioGroup
                className="flex gap-6"
                value={tipo}
                onValueChange={(v) => {
                  setTipo(v as "material" | "servico");
                  setEscolha(null);
                  setCodigoItem(null);
                  if (preenchidaPeloCatalogo.current && form.getValues("natureza_despesa_id") === preenchidaPeloCatalogo.current) {
                    form.setValue("natureza_despesa_id", SEM_VALOR);
                  }
                  preenchidaPeloCatalogo.current = null;
                }}
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="pca-tipo-material" value="material" />
                  <Label htmlFor="pca-tipo-material">Material</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem id="pca-tipo-servico" value="servico" />
                  <Label htmlFor="pca-tipo-servico">Serviço</Label>
                </div>
              </RadioGroup>
            </fieldset>

            <CatalogoBusca
              tipo={tipo}
              escolha={escolha}
              aoEscolher={(e) => {
                setEscolha(e);
                setErroCatalogo(false);
                // Trocou o item: a natureza que o catálogo tinha preenchido sai, para vir a do item novo
                if (preenchidaPeloCatalogo.current && form.getValues("natureza_despesa_id") === preenchidaPeloCatalogo.current) {
                  form.setValue("natureza_despesa_id", SEM_VALOR);
                }
                preenchidaPeloCatalogo.current = null;
                if (e && !form.getValues("descricao")) form.setValue("descricao", e.nome);
              }}
              codigoItem={codigoItem}
              aoEscolherItem={(c, descricao) => {
                setCodigoItem(c);
                if (descricao) form.setValue("descricao", descricao);
              }}
            />
            {erroCatalogo && <p className="text-sm font-medium text-destructive">Escolha o item no catálogo.</p>}

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição no PCA *</FormLabel>
                  <FormControl><Textarea rows={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="unidade_fornecimento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidade *</FormLabel>
                    <FormControl><Input placeholder="unidade, caixa, mês" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade *</FormLabel>
                    <FormControl><Input inputMode="decimal" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="valor_unitario"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor unitário estimado (R$) *</FormLabel>
                    <FormControl><Input inputMode="decimal" placeholder="0,00" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <p className="text-sm text-muted-foreground" aria-live="polite">
              Valor total: <span className="font-semibold text-foreground">{total == null ? "—" : formatCurrency(total)}</span>
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="mes_desejado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mês desejado *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Escolha" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {MESES.map((m, i) => <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="prioridade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(PRIORIDADE_LABEL).map(([v, r]) => <SelectItem key={v} value={v}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {selectClassificador("acao_id", "Ação orçamentária", classificadores?.acoes ?? [])}
              {selectClassificador("fonte_recurso_id", "Fonte de recurso", classificadores?.fontes ?? [])}
            </div>

            <FormField
              control={form.control}
              name="natureza_despesa_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Natureza de despesa</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={SEM_VALOR}>Não informada</SelectItem>
                      {naturezasOrdenadas.map((n) => (
                        <SelectItem key={n.id} value={n.id}>
                          {idsIndicados.has(n.id) ? `${rotuloClassificador(n)} · do catálogo` : rotuloClassificador(n)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {escolha && naturezasPortal.isError && (
                    <p className="text-sm text-muted-foreground">Não foi possível consultar a natureza no catálogo; escolha à mão.</p>
                  )}
                  {indicadas.length > 1 && (!naturezaEscolhida || naturezaEscolhida === SEM_VALOR) && (
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
                      O catálogo do governo indica {indicadas.length} naturezas para este item; elas aparecem primeiro na lista.
                    </p>
                  )}
                  {idsIndicados.has(naturezaEscolhida ?? "") && (
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
                      {indicadas.length === 1 ? "Sugerida pelo catálogo do governo." : "Uma das indicadas pelo catálogo do governo."}
                    </p>
                  )}
                  {indicadas.length > 0 && naturezaEscolhida && naturezaEscolhida !== SEM_VALOR && !idsIndicados.has(naturezaEscolhida) && (
                    <p className="flex items-start gap-1.5 text-sm" role="status">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
                      Esta natureza não é a indicada no catálogo para este item. Confira antes de salvar.
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="justificativa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justificativa resumida</FormLabel>
                  <FormControl><Textarea rows={2} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={salvando}>
                {salvando && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
