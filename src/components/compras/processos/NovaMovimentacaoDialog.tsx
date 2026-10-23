/**
 * Nova movimentação do processo no SEI: data, etapa, setor e o que aconteceu. A mais recente vira o estado atual
 * do processo (gatilho no banco). Movimentação errada não se apaga: registra-se outra.
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
import { ETAPAS_PROCESSO, type ProcessoContratacao } from "@/types/processos";
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
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processo: ProcessoContratacao;
  salvando?: boolean;
  onSalvar: (dados: AndamentoInput) => Promise<unknown>;
}

export function NovaMovimentacaoDialog({ open, onOpenChange, processo, salvando, onSalvar }: Props) {
  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
    form.reset({ data: hojeIso(), etapa: processo.etapa, setor: processo.setor_atual ?? "", situacao: "" });
  }, [open, processo, form]);

  const onSubmit = async (d: FormData) => {
    try {
      await onSalvar({ processo_id: processo.id, data: d.data, etapa: d.etapa, setor: d.setor || null, situacao: d.situacao });
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova movimentação</DialogTitle>
          <DialogDescription>Processo {processo.numero_processo}</DialogDescription>
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={salvando}>Registrar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
