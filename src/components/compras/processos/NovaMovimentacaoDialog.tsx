/**
 * Nova movimentação do processo no SEI (data, etapa, setor e o que aconteceu) ou correção de uma já registrada
 * (`andamento` preenchido: pede o motivo, que vai para a trilha). A movimentação com a data mais recente vira o estado
 * atual do processo (gatilho no banco; a sem data nunca ganha da com data).
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ETAPAS_PROCESSO, type ProcessoAndamento, type ProcessoContratacao } from "@/types/processos";
import type { AndamentoInput } from "@/hooks/useProcessosContratacao";

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

  useEffect(() => {
    if (!open) return;
    if (andamento) {
      form.reset({
        data: andamento.data_informada ? andamento.data : "",
        etapa: andamento.etapa,
        setor: andamento.setor ?? "",
        situacao: andamento.situacao,
        motivo: andamento.data_informada ? "" : "Data informada pelo SEI",
      });
    } else {
      form.reset({ data: hojeIso(), etapa: processo.etapa, setor: processo.setor_atual ?? "", situacao: "", motivo: "" });
    }
  }, [open, processo, andamento, form]);

  const onSubmit = async (d: FormData) => {
    if (corrigindo && (d.motivo ?? "").length < 3) {
      form.setError("motivo", { message: "Diga por que está corrigindo (mínimo 3 letras)" });
      return;
    }
    try {
      await onSalvar({
        processo_id: processo.id, data: d.data, etapa: d.etapa, setor: d.setor || null, situacao: d.situacao,
        motivo: corrigindo ? d.motivo : undefined,
      });
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
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
