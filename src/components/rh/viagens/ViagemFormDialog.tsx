/**
 * Formulário de viagem a serviço (criar/editar) com as regras de
 * `@/lib/diariasRegras`: quantidade de diárias contada pelas datas (meia diária
 * no retorno) e valor unitário sugerido pela tabela do perfil do tenant
 * (`rh.diarias`), a partir do cargo do servidor e da faixa de destino.
 *
 * Quantidade e valor são recalculados ao mudar servidor, datas, destino ou ônus.
 * "Ajuste manual" libera os dois campos e exige justificativa; sem linha na
 * tabela para o cargo/destino, os campos ficam liberados com aviso.
 * Edição: campos bloqueados conforme o status; com workflow DIRAF concluído,
 * quantidade/valor (e o ônus) ficam travados.
 */

import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Loader2, Plane } from "lucide-react";
import { toast } from "sonner";
import { useTenant } from "@/core/tenant";
import { useCriarViagem, useAtualizarViagem } from "@/hooks/useViagens";
import {
  FAIXA_DESTINO_LABELS,
  TODOS_CAMPOS_VIAGEM,
  UF_EXTERIOR,
  calcularQuantidadeDiarias,
  calcularTotalDiarias,
  camposEditaveisPorStatus,
  classificarDestino,
  contarPernoites,
  ehBrasil,
  validarPeriodo,
  valorDiariaPorTabela,
  valoresBloqueados,
  type CampoViagem,
} from "@/lib/diariasRegras";
import { TIPO_ONUS_LABELS, type ServidorParaViagem, type TipoOnus, type ViagemDiariaComServidor, type ViagemDiariaInput } from "@/types/rh";

const UFS = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];

const schema = z
  .object({
    servidor_id: z.string().min(1, "Selecione o servidor"),
    tipo_onus: z.enum(["com_onus", "sem_onus"]),
    data_saida: z.string().min(1, "Informe a data de saída"),
    data_retorno: z.string().min(1, "Informe a data de retorno"),
    destino_cidade: z.string().trim().min(1, "Informe a cidade de destino"),
    destino_uf: z.string(),
    destino_pais: z.string().trim().min(1, "Informe o país"),
    finalidade: z.string().trim().min(1, "Informe a finalidade"),
    justificativa: z.string().optional(),
    portaria_numero: z.string().optional(),
    portaria_data: z.string().optional(),
    meio_transporte: z.string().optional(),
    quantidade_diarias: z.coerce.number().min(0, "Não pode ser negativo"),
    valor_diaria: z.coerce.number().min(0, "Não pode ser negativo"),
    ajuste_manual: z.boolean(),
    observacoes: z.string().optional(),
  })
  .superRefine((d, ctx) => {
    const erroPeriodo = validarPeriodo(d.data_saida, d.data_retorno);
    if (erroPeriodo) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["data_retorno"], message: erroPeriodo });
    if (ehBrasil(d.destino_pais) && !d.destino_uf) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["destino_uf"], message: "Informe a UF de destino" });
    }
    if (d.tipo_onus === "com_onus" && d.ajuste_manual && !d.justificativa?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["justificativa"], message: "Justifique o ajuste manual de quantidade/valor" });
    }
  });

type ViagemFormValues = z.infer<typeof schema>;

const VALORES_VAZIOS: ViagemFormValues = {
  servidor_id: "",
  tipo_onus: "com_onus",
  data_saida: "",
  data_retorno: "",
  destino_cidade: "",
  destino_uf: "",
  destino_pais: "Brasil",
  finalidade: "",
  justificativa: "",
  portaria_numero: "",
  portaria_data: "",
  meio_transporte: "",
  quantidade_diarias: 0,
  valor_diaria: 0,
  ajuste_manual: false,
  observacoes: "",
};

const formatarMoeda = (valor: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

interface ViagemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servidores: ServidorParaViagem[];
  /** Registro em edição; ausente = criar. */
  viagem?: ViagemDiariaComServidor | null;
}

export function ViagemFormDialog({ open, onOpenChange, servidores, viagem }: ViagemFormDialogProps) {
  const editando = !!viagem;
  const editaveis = editando ? camposEditaveisPorStatus(viagem.status) : TODOS_CAMPOS_VIAGEM;
  const bloqueiaTudo = editando && editaveis.length === 0;
  const valoresTravados = editando && valoresBloqueados(viagem);
  const bloqueado = (campo: CampoViagem) => bloqueiaTudo || !editaveis.includes(campo);

  const tenant = useTenant();
  const tabela = tenant.rh?.diarias;
  const ufSede = tenant.endereco?.uf;
  const meiaDiariaNoRetorno = tabela?.regras?.meiaDiariaNoRetorno ?? true;

  const criar = useCriarViagem();
  const atualizar = useAtualizarViagem();
  const salvando = criar.isPending || atualizar.isPending;

  const form = useForm<ViagemFormValues>({ resolver: zodResolver(schema), defaultValues: VALORES_VAZIOS });

  const servidorId = form.watch("servidor_id");
  const tipoOnus = form.watch("tipo_onus");
  const dataSaida = form.watch("data_saida");
  const dataRetorno = form.watch("data_retorno");
  const destinoUf = form.watch("destino_uf");
  const destinoPais = form.watch("destino_pais");
  const ajusteManual = form.watch("ajuste_manual");
  const quantidade = form.watch("quantidade_diarias");
  const valorDiaria = form.watch("valor_diaria");

  const semOnus = tipoOnus === "sem_onus";
  const exterior = !ehBrasil(destinoPais);

  // Em edição de servidor inativo (fora da lista de ativos), inclui o próprio para o nome aparecer.
  const opcoesServidores = useMemo<ServidorParaViagem[]>(() => {
    if (!viagem?.servidor || servidores.some((s) => s.id === viagem.servidor_id)) return servidores;
    return [viagem.servidor, ...servidores];
  }, [servidores, viagem]);

  // Sugestão da tabela: faixa de destino + cargo do servidor → valor; datas → quantidade.
  const servidor = opcoesServidores.find((s) => s.id === servidorId);
  const faixa = classificarDestino(destinoUf, destinoPais, ufSede);
  const cargo = servidor?.cargo ? { categoria: servidor.cargo.categoria, nivelHierarquico: servidor.cargo.nivel_hierarquico } : null;
  const valorTabela = valorDiariaPorTabela(tabela, cargo, faixa);
  const quantidadeCalculada = calcularQuantidadeDiarias(dataSaida, dataRetorno, { tipoOnus, meiaDiariaNoRetorno });
  const pernoites = contarPernoites(dataSaida, dataRetorno);
  const semLinhaTabela = !semOnus && !!servidorId && valorTabela === null;
  const camposLivres = ajusteManual || semLinhaTabela;
  const total = calcularTotalDiarias(quantidade, valorDiaria);

  // Chave dos campos que alimentam a sugestão; só recalcula quando ela muda
  // DEPOIS de abrir (ao abrir, mantém o que está gravado).
  const chaveSugestao = `${servidorId}|${tipoOnus}|${dataSaida}|${dataRetorno}|${destinoUf}|${destinoPais}`;
  const chaveAplicada = useRef(chaveSugestao);

  // Preenche o formulário ao abrir (criar ou editar).
  useEffect(() => {
    if (!open) return;
    form.reset(
      viagem
        ? {
            servidor_id: viagem.servidor_id,
            tipo_onus: viagem.tipo_onus,
            data_saida: viagem.data_saida,
            data_retorno: viagem.data_retorno,
            destino_cidade: viagem.destino_cidade,
            destino_uf: viagem.destino_uf === UF_EXTERIOR ? "" : viagem.destino_uf,
            destino_pais: viagem.destino_pais || "Brasil",
            finalidade: viagem.finalidade,
            justificativa: viagem.justificativa ?? "",
            portaria_numero: viagem.portaria_numero ?? "",
            portaria_data: viagem.portaria_data ?? "",
            meio_transporte: viagem.meio_transporte ?? "",
            quantidade_diarias: viagem.quantidade_diarias ?? 0,
            valor_diaria: viagem.valor_diaria ?? 0,
            ajuste_manual: false,
            observacoes: viagem.observacoes ?? "",
          }
        : VALORES_VAZIOS,
    );
    chaveAplicada.current = viagem
      ? `${viagem.servidor_id}|${viagem.tipo_onus}|${viagem.data_saida}|${viagem.data_retorno}|${viagem.destino_uf === UF_EXTERIOR ? "" : viagem.destino_uf}|${viagem.destino_pais || "Brasil"}`
      : `|com_onus||||Brasil`;
  }, [open, viagem, form]);

  // Aplica a sugestão (quantidade pela regra, valor pela tabela) aos campos.
  const aplicarSugestao = () => {
    if (semOnus) {
      form.setValue("quantidade_diarias", 0, { shouldDirty: true });
      form.setValue("valor_diaria", 0, { shouldDirty: true });
      return;
    }
    if (quantidadeCalculada !== null) form.setValue("quantidade_diarias", quantidadeCalculada, { shouldDirty: true });
    if (valorTabela !== null) form.setValue("valor_diaria", valorTabela, { shouldDirty: true });
  };

  // Recalcula quando servidor/datas/destino/ônus mudam (fora do ajuste manual e dos valores travados).
  useEffect(() => {
    if (!open || chaveAplicada.current === chaveSugestao) return;
    chaveAplicada.current = chaveSugestao;
    if (valoresTravados) return;
    if (ajusteManual && !semOnus) return;
    aplicarSugestao();
    // `aplicarSugestao` lê os mesmos valores já representados em `chaveSugestao`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, chaveSugestao, ajusteManual, semOnus, valoresTravados]);

  const quantidadeValorDesabilitados =
    semOnus || valoresTravados || bloqueado("quantidade_diarias") || bloqueado("valor_diaria") || !camposLivres;

  const onSubmit = async (d: ViagemFormValues) => {
    const semOnusFinal = d.tipo_onus === "sem_onus";
    const ufFinal = ehBrasil(d.destino_pais) ? d.destino_uf.toUpperCase() : UF_EXTERIOR;
    const input: ViagemDiariaInput = {
      servidor_id: d.servidor_id,
      tipo_onus: d.tipo_onus,
      data_saida: d.data_saida,
      data_retorno: d.data_retorno,
      destino_cidade: d.destino_cidade,
      destino_uf: ufFinal,
      destino_pais: d.destino_pais,
      finalidade: d.finalidade,
      justificativa: d.justificativa?.trim() || null,
      portaria_numero: d.portaria_numero?.trim() || null,
      portaria_data: d.portaria_data || null,
      meio_transporte: d.meio_transporte?.trim() || null,
      quantidade_diarias: semOnusFinal ? null : d.quantidade_diarias,
      valor_diaria: semOnusFinal ? null : d.valor_diaria,
      valor_total: semOnusFinal ? null : calcularTotalDiarias(d.quantidade_diarias, d.valor_diaria),
      observacoes: d.observacoes?.trim() || null,
    };

    try {
      if (editando) {
        // Só os campos liberados pelo status vão para o banco.
        const parcial: Partial<ViagemDiariaInput> = {};
        for (const campo of editaveis) {
          if (campo in input) {
            (parcial as Record<string, unknown>)[campo] = (input as Record<string, unknown>)[campo];
          }
        }
        if (valoresTravados) {
          delete parcial.tipo_onus;
          delete parcial.quantidade_diarias;
          delete parcial.valor_diaria;
        } else if (editaveis.includes("quantidade_diarias") || editaveis.includes("tipo_onus")) {
          parcial.valor_total = input.valor_total;
          if (d.tipo_onus !== viagem.tipo_onus) {
            // Mudou o ônus: sem ônus não tem workflow; com ônus volta a pendente.
            parcial.workflow_diraf_status = semOnusFinal ? null : "pendente";
          }
        }
        await atualizar.mutateAsync({ id: viagem.id, ...parcial });
        toast.success("Viagem atualizada com sucesso!");
      } else {
        await criar.mutateAsync({ ...input, status: "solicitada", workflow_diraf_status: semOnusFinal ? null : "pendente" });
        toast.success(
          semOnusFinal
            ? "Viagem cadastrada (sem ônus - sem diárias)!"
            : "Viagem cadastrada! Notificação enviada à DIRAF para abertura de processo.",
        );
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(`Erro ao salvar viagem: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5 text-primary" />
            {editando ? "Editar Viagem" : "Nova Viagem"}
          </DialogTitle>
          <DialogDescription>
            Uma diária por pernoite fora da sede{meiaDiariaNoRetorno ? " e meia diária no dia do retorno" : ""}; o valor
            unitário vem da tabela de diárias do órgão, pelo cargo do servidor e pela faixa de destino.
            {editando && viagem.status === "autorizada" && " Viagem autorizada: o servidor não pode ser alterado."}
            {editando && viagem.status === "em_andamento" && " Viagem em andamento: só portaria, meio de transporte e observações podem ser alterados."}
          </DialogDescription>
        </DialogHeader>

        {bloqueiaTudo && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Edição não permitida</AlertTitle>
            <AlertDescription>Viagens concluídas ou canceladas não podem ser editadas.</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="servidor_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Servidor *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={bloqueado("servidor_id")}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o servidor" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {opcoesServidores.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.nome_completo}
                          {s.matricula ? ` (${s.matricula})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo_onus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Ônus *</FormLabel>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(Object.keys(TIPO_ONUS_LABELS) as TipoOnus[]).map((valor) => {
                      const selecionado = field.value === valor;
                      const desabilitado = bloqueado("tipo_onus") || valoresTravados;
                      return (
                        <button
                          key={valor}
                          type="button"
                          disabled={desabilitado}
                          onClick={() => field.onChange(valor)}
                          aria-pressed={selecionado}
                          className={`p-3 rounded-lg border-2 text-left transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                            selecionado ? "border-primary bg-primary/10" : "border-border hover:border-muted-foreground"
                          }`}
                        >
                          <p className="font-semibold text-foreground">{TIPO_ONUS_LABELS[valor]}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {valor === "sem_onus" ? "Não gera diárias nem custos financeiros" : "Gera diárias — processo DIRAF obrigatório"}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                  {valoresTravados && (
                    <FormDescription>Workflow DIRAF concluído: ônus, quantidade e valor não podem mais ser alterados.</FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="data_saida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Saída *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={bloqueado("data_saida")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data_retorno"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Retorno *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={bloqueado("data_retorno")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <FormField
                control={form.control}
                name="destino_cidade"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Cidade *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={bloqueado("destino_cidade")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destino_uf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UF{exterior ? "" : " *"}</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={exterior || bloqueado("destino_uf")}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={exterior ? "Exterior" : "UF"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {UFS.map((uf) => (
                          <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="destino_pais"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>País *</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={bloqueado("destino_pais")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="finalidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Finalidade *</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} disabled={bloqueado("finalidade")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!semOnus && (
              <div className="rounded-lg border bg-muted/30 p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">Diárias</p>
                  <FormField
                    control={form.control}
                    name="ajuste_manual"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            disabled={valoresTravados || bloqueado("quantidade_diarias")}
                            onCheckedChange={(v) => {
                              field.onChange(v === true);
                              // Ao desligar o ajuste, volta para a sugestão da tabela.
                              if (v !== true) aplicarSugestao();
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">Ajuste manual (exige justificativa)</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                {semLinhaTabela && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Sem valor na tabela para este cargo/destino — informe manualmente.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="quantidade_diarias"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.5" min={0} {...field} disabled={quantidadeValorDesabilitados} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="valor_diaria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Valor unitário (R$)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" min={0} {...field} disabled={quantidadeValorDesabilitados} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-2">
                    <p className="text-sm font-medium leading-none">Total</p>
                    <Input value={formatarMoeda(total)} readOnly className="bg-muted font-semibold" />
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  {pernoites === null
                    ? "Informe as datas para contar as diárias."
                    : pernoites === 0
                      ? "Sem pernoite: meia diária."
                      : `${pernoites} pernoite${pernoites > 1 ? "s" : ""}${meiaDiariaNoRetorno ? " + meia diária no retorno" : ""}`}
                  {" · "}Destino {FAIXA_DESTINO_LABELS[faixa].toLowerCase()}
                  {valorTabela !== null && ` · tabela: ${formatarMoeda(valorTabela)}`}
                  {tabela?.vigencia && ` (${tabela.vigencia})`}
                </p>
              </div>
            )}

            <FormField
              control={form.control}
              name="justificativa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justificativa{!semOnus && ajusteManual ? " *" : ""}</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} disabled={bloqueado("justificativa")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="portaria_numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número da Portaria</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={bloqueado("portaria_numero")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="portaria_data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data da Portaria</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={bloqueado("portaria_data")} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="meio_transporte"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meio de Transporte</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Aéreo, Terrestre, Veículo oficial..." disabled={bloqueado("meio_transporte")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} disabled={bloqueado("observacoes")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvando || bloqueiaTudo}>
                {salvando && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                {editando ? "Salvar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
