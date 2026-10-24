/**
 * Cadastro (ou edição) dos dados de um processo de contratação: nº SEI, ano, objeto, forma e valor estimado.
 * Etapa, setor e situação não se digitam aqui: vêm da movimentação mais recente (aba Andamento).
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { lerNumeroBr } from "@/lib/pca/numero";
import { FORMAS_CONTRATACAO, PADRAO_NUMERO_SEI, type ModalidadeLicitacao, type ProcessoContratacao } from "@/types/processos";
import type { ProcessoInput } from "@/hooks/useProcessosContratacao";

const A_DEFINIR = "a_definir";

const schema = z
  .object({
    numero_processo: z.string().trim().regex(PADRAO_NUMERO_SEI, "Use o formato 00000.000000/0000.00"),
    ano: z.string().regex(/^\d{4}$/, "Ano com 4 dígitos"),
    objeto: z.string().trim().min(1, "Descreva o objeto").max(4000),
    objeto_resumido: z.string().trim().max(500).optional(),
    modalidade: z.string(),
    valor_estimado: z.string().refine((v) => !v.trim() || lerNumeroBr(v) >= 0, "Valor inválido"),
    valor_estimado_obs: z.string().trim().max(1000).optional(),
  })
  .refine((d) => d.valor_estimado.trim() || d.valor_estimado_obs, {
    message: "Sem valor, diga por quê (ex.: aguardando cotação)",
    path: ["valor_estimado_obs"],
  });

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processo?: ProcessoContratacao | null;
  salvando?: boolean;
  onSalvar: (dados: ProcessoInput) => Promise<unknown>;
}

const paraTexto = (n: number | null | undefined) => (n == null ? "" : String(n).replace(".", ","));

export function ProcessoFormDialog({ open, onOpenChange, processo, salvando, onSalvar }: Props) {
  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
    form.reset({
      numero_processo: processo?.numero_processo ?? "",
      ano: String(processo?.ano ?? new Date().getFullYear()),
      objeto: processo?.objeto ?? "",
      objeto_resumido: processo?.objeto_resumido ?? "",
      modalidade: processo?.modalidade ?? A_DEFINIR,
      valor_estimado: paraTexto(processo?.valor_estimado),
      valor_estimado_obs: processo?.valor_estimado_obs ?? "",
    });
  }, [open, processo, form]);

  const onSubmit = async (d: FormData) => {
    try {
      await onSalvar({
        id: processo?.id,
        numero_processo: d.numero_processo,
        ano: Number(d.ano),
        objeto: d.objeto,
        objeto_resumido: d.objeto_resumido || null,
        modalidade: d.modalidade === A_DEFINIR ? null : (d.modalidade as ModalidadeLicitacao),
        valor_estimado: d.valor_estimado.trim() ? lerNumeroBr(d.valor_estimado) : null,
        valor_estimado_obs: d.valor_estimado_obs || null,
      });
      onOpenChange(false);
    } catch {
      // erro já exibido pelo toast da mutation; o diálogo continua aberto
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{processo ? "Editar processo" : "Novo processo de contratação"}</DialogTitle>
          <DialogDescription>Os dados do processo como estão no SEI. O andamento se registra na ficha.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="grid gap-4 sm:grid-cols-[1fr_8rem]">
              <FormField
                control={form.control}
                name="numero_processo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº do processo SEI *</FormLabel>
                    <FormControl><Input placeholder="17302.000000/2026.00" inputMode="numeric" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ano"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ano *</FormLabel>
                    <FormControl><Input inputMode="numeric" maxLength={4} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="objeto_resumido"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objeto (resumo)</FormLabel>
                  <FormControl><Input placeholder="Ex.: Manutenção dos elevadores do ginásio" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="objeto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objeto completo *</FormLabel>
                  <FormControl><Textarea rows={3} {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="modalidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forma de contratação</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value={A_DEFINIR}>A definir</SelectItem>
                      {FORMAS_CONTRATACAO.map((f) => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
              <FormField
                control={form.control}
                name="valor_estimado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor estimado (R$)</FormLabel>
                    <FormControl><Input inputMode="decimal" placeholder="0,00" {...field} /></FormControl>
                    <FormDescription>Valor total do processo.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="valor_estimado_obs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observação do valor</FormLabel>
                    <FormControl><Input placeholder="Ex.: total de 5 anos; aguardando cotação" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
              <Button type="submit" disabled={salvando}>Salvar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
