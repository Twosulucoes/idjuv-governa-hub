/**
 * Nova movimentação do processo no SEI (data, etapa, setor e o que aconteceu) ou correção de uma já registrada
 * (`andamento` preenchido: pede o motivo, que vai para a trilha). A movimentação com a data mais recente vira o estado
 * atual do processo (gatilho no banco; a sem data nunca ganha da com data). Desde a P2 (migração 20261122090000), toda
 * movimentação nova diz a próxima etapa, o responsável (servidor ou setor) e o prazo, menos Encerrado e Cancelado; o
 * sistema sugere a etapa seguinte e o prazo pelos dias da etapa. Na correção, a próxima ação só é obrigatória se a
 * movimentação já tinha uma (as antigas e as da planilha ficam como estão).
 */

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ServidorBusca } from "@/components/contratos/passagens/ServidorBusca";
import { ETAPAS_PROCESSO, type ProcessoAndamento, type ProcessoContratacao } from "@/types/processos";
import { useBuscarServidoresProcesso, useParametrosEtapa, type AndamentoInput } from "@/hooks/useProcessosContratacao";
import { diasDePrazo, exigeProximaAcao, faltaNaProximaAcao, proximaEtapaSugerida, somarDias } from "@/lib/compras/proximaAcao";

const hojeIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const schema = z.object({
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data").refine((v) => v <= hojeIso(), "A data não pode ser futura"),
  etapa: z.string().min(1, "Escolha a etapa"),
  setor: z.string().trim().max(200).optional(),
  situacao: z.string().trim().min(1, "Descreva a movimentação").max(2000),
  motivo: z.string().trim().max(500).optional(),
  proxima_etapa: z.string().optional(),
  tipo_responsavel: z.enum(["servidor", "setor"]),
  responsavel_setor: z.string().trim().max(200).optional(),
  prazo_proxima: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processo: ProcessoContratacao;
  salvando?: boolean;
  /** Movimentação a corrigir; sem ela, o diálogo registra uma nova. */
  andamento?: ProcessoAndamento | null;
  onSalvar: (dados: AndamentoInput & { motivo?: string }) => Promise<unknown>;
}

export function NovaMovimentacaoDialog({ open, onOpenChange, processo, salvando, andamento, onSalvar }: Props) {
  const corrigindo = !!andamento;
  const form = useForm<FormData>({ resolver: zodResolver(schema) });
  const parametros = useParametrosEtapa();
  const [servidor, setServidor] = useState<{ id: string; nome: string } | null>(null);
  const [erroProxima, setErroProxima] = useState<string | null>(null);
  // a sugestão de etapa e prazo para quando a pessoa mexe no campo
  const etapaManual = useRef(false);
  const prazoManual = useRef(false);

  useEffect(() => {
    if (!open) return;
    setErroProxima(null);
    if (andamento) {
      etapaManual.current = true;
      prazoManual.current = true;
      setServidor(andamento.responsavel_servidor_id
        ? { id: andamento.responsavel_servidor_id, nome: andamento.responsavel_nome ?? "Servidor" }
        : null);
      form.reset({
        data: andamento.data_informada ? andamento.data : "",
        etapa: andamento.etapa,
        setor: andamento.setor ?? "",
        situacao: andamento.situacao,
        motivo: andamento.data_informada ? "" : "Data informada pelo SEI",
        proxima_etapa: andamento.proxima_etapa ?? "",
        tipo_responsavel: andamento.responsavel_setor && !andamento.responsavel_servidor_id ? "setor" : "servidor",
        responsavel_setor: andamento.responsavel_setor ?? "",
        prazo_proxima: andamento.prazo_proxima ?? "",
      });
    } else {
      etapaManual.current = false;
      prazoManual.current = false;
      setServidor(null);
      form.reset({
        data: hojeIso(), etapa: processo.etapa, setor: processo.setor_atual ?? "", situacao: "", motivo: "",
        proxima_etapa: "", tipo_responsavel: "servidor", responsavel_setor: "", prazo_proxima: "",
      });
    }
  }, [open, processo, andamento, form]);

  const etapa = form.watch("etapa");
  const data = form.watch("data");
  const proxima = form.watch("proxima_etapa");
  const tipoResponsavel = form.watch("tipo_responsavel");
  const pedeProxima = exigeProximaAcao(etapa);

  // sugestões: a etapa seguinte e o prazo pelos dias da próxima etapa (só enquanto a pessoa não mexeu)
  useEffect(() => {
    if (!open || etapaManual.current) return;
    form.setValue("proxima_etapa", proximaEtapaSugerida(etapa) ?? "");
  }, [open, etapa, form]);
  useEffect(() => {
    if (!open || prazoManual.current || !proxima || !/^\d{4}-\d{2}-\d{2}$/.test(data ?? "")) return;
    form.setValue("prazo_proxima", somarDias(data, diasDePrazo(proxima, parametros.data)));
  }, [open, data, proxima, parametros.data, form]);

  const onSubmit = async (d: FormData) => {
    if (corrigindo && (d.motivo ?? "").length < 3) {
      form.setError("motivo", { message: "Diga por que está corrigindo (mínimo 3 letras)" });
      return;
    }
    const proximaAcao = {
      proxima_etapa: d.proxima_etapa || null,
      responsavel_servidor_id: d.tipo_responsavel === "servidor" ? (servidor?.id ?? null) : null,
      responsavel_setor: d.tipo_responsavel === "setor" ? (d.responsavel_setor?.trim() || null) : null,
      prazo_proxima: d.prazo_proxima || null,
    };
    const exige = exigeProximaAcao(d.etapa);
    const algumaInformada = Object.values(proximaAcao).some(Boolean);
    // nova: sempre; correção: se já tinha próxima ação ou se a pessoa informou alguma (a mesma regra do banco)
    if (exige && (!corrigindo || !!andamento?.proxima_etapa || algumaInformada)) {
      const falta = faltaNaProximaAcao({ etapa: d.etapa, data: d.data, ...proximaAcao });
      if (falta) {
        setErroProxima(falta);
        return;
      }
    }
    setErroProxima(null);
    try {
      await onSalvar({
        processo_id: processo.id, data: d.data, etapa: d.etapa, setor: d.setor || null, situacao: d.situacao,
        ...(exige ? proximaAcao : { proxima_etapa: null, responsavel_servidor_id: null, responsavel_setor: null, prazo_proxima: null }),
        motivo: corrigindo ? d.motivo : undefined,
      });
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{corrigindo ? "Corrigir movimentação" : "Nova movimentação"}</DialogTitle>
          <DialogDescription>
            Processo {processo.numero_processo}. Use a data em que o fato aconteceu no SEI; a data do registro fica guardada.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data *</FormLabel>
                    <FormControl><Input type="date" max={hojeIso()} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="etapa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etapa *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Escolha" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {ETAPAS_PROCESSO.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="setor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Setor no SEI</FormLabel>
                  <FormControl><Input placeholder="IDJUV/PRESI/DIRAF/EPC" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="situacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>O que aconteceu *</FormLabel>
                  <FormControl><Textarea rows={3} placeholder="Ex.: ETP concluído e enviado à assessoria jurídica" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {pedeProxima && (
              <fieldset className="space-y-4 rounded-md border border-border p-4">
                <legend className="px-1 text-sm font-medium">Depois desta movimentação</legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="proxima_etapa"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Próxima etapa{corrigindo && !andamento?.proxima_etapa ? "" : " *"}</FormLabel>
                        <Select
                          value={field.value || undefined}
                          onValueChange={(v) => {
                            etapaManual.current = true;
                            field.onChange(v);
                          }}
                        >
                          <FormControl><SelectTrigger><SelectValue placeholder="Escolha" /></SelectTrigger></FormControl>
                          <SelectContent>
                            {ETAPAS_PROCESSO.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="prazo_proxima"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prazo{corrigindo && !andamento?.proxima_etapa ? "" : " *"}</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            min={data || undefined}
                            {...field}
                            onChange={(e) => {
                              prazoManual.current = true;
                              field.onChange(e);
                            }}
                          />
                        </FormControl>
                        {proxima && !prazoManual.current && (
                          <p className="text-xs text-muted-foreground">
                            Sugerido: {diasDePrazo(proxima, parametros.data)} dias para essa etapa
                          </p>
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="tipo_responsavel"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel>Responsável{corrigindo && !andamento?.proxima_etapa ? "" : " *"}</FormLabel>
                      <RadioGroup value={field.value} onValueChange={field.onChange} className="flex gap-4">
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="servidor" id="resp-servidor" />
                          <Label htmlFor="resp-servidor" className="font-normal">Servidor</Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value="setor" id="resp-setor" />
                          <Label htmlFor="resp-setor" className="font-normal">Setor</Label>
                        </div>
                      </RadioGroup>
                    </FormItem>
                  )}
                />
                {tipoResponsavel === "servidor" ? (
                  <ServidorBusca
                    id="responsavel-servidor"
                    escolhido={servidor}
                    aoEscolher={(s) => setServidor(s ? { id: s.id, nome: s.nome } : null)}
                    useBusca={useBuscarServidoresProcesso}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="responsavel_setor"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl><Input aria-label="Setor responsável" placeholder="IDJUV/PRESI/DIRAF" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                {erroProxima && <p role="alert" className="text-sm font-medium text-destructive">{erroProxima}</p>}
              </fieldset>
            )}
            {corrigindo && (
              <FormField
                control={form.control}
                name="motivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo da correção *</FormLabel>
                    <FormControl><Input placeholder="Ex.: data conferida no SEI" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={salvando}>{corrigindo ? "Salvar correção" : "Registrar"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
