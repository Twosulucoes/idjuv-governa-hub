/**
 * Formulário de solicitação de abono do próprio servidor (Minha Frequência).
 * A solicitação nasce `pendente` e segue para a chefia e o RH em
 * /rh/frequencia/validacao. Anexo de documento fica para outra entrega
 * (o hook só guarda `documento_url`; não há upload aqui).
 */

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useTiposAbono } from "@/hooks/useParametrizacoesFrequencia";
import type { SolicitacaoAbono } from "@/types/frequencia";

const schema = z
  .object({
    tipo_abono_id: z.string().min(1, "Selecione o tipo de abono"),
    data_inicio: z.string().min(1, "Informe a data inicial"),
    data_fim: z.string().min(1, "Informe a data final"),
    hora_inicio: z.string().optional(),
    hora_fim: z.string().optional(),
    justificativa: z.string().trim().min(10, "Descreva a justificativa (mínimo 10 caracteres)").max(2000),
  })
  .refine((d) => d.data_fim >= d.data_inicio, {
    path: ["data_fim"],
    message: "A data final não pode ser antes da inicial",
  })
  .refine((d) => !d.hora_inicio || !d.hora_fim || d.hora_fim > d.hora_inicio, {
    path: ["hora_fim"],
    message: "A hora final deve ser depois da inicial",
  });

type FormData = z.infer<typeof schema>;

interface SolicitarAbonoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servidorId: string;
  /** Competência exibida na página; usada só como data inicial sugerida. */
  ano: number;
  mes: number;
  salvando?: boolean;
  onSalvar: (input: Partial<SolicitacaoAbono>) => Promise<unknown>;
}

export function SolicitarAbonoDialog({
  open,
  onOpenChange,
  servidorId,
  ano,
  mes,
  salvando,
  onSalvar,
}: SolicitarAbonoDialogProps) {
  const { data: tipos = [], isLoading: carregandoTipos } = useTiposAbono();
  const form = useForm<FormData>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!open) return;
    const hoje = new Date();
    const mesmaCompetencia = hoje.getFullYear() === ano && hoje.getMonth() + 1 === mes;
    const dataSugerida = mesmaCompetencia
      ? hoje.toISOString().slice(0, 10)
      : `${ano}-${String(mes).padStart(2, "0")}-01`;
    form.reset({
      tipo_abono_id: "",
      data_inicio: dataSugerida,
      data_fim: dataSugerida,
      hora_inicio: "",
      hora_fim: "",
      justificativa: "",
    });
  }, [open, ano, mes, form]);

  const tipoSelecionado = tipos.find((t) => t.id === form.watch("tipo_abono_id"));

  const onSubmit = async (d: FormData) => {
    try {
      await onSalvar({
        servidor_id: servidorId,
        tipo_abono_id: d.tipo_abono_id,
        data_inicio: d.data_inicio,
        data_fim: d.data_fim,
        hora_inicio: d.hora_inicio || undefined,
        hora_fim: d.hora_fim || undefined,
        justificativa: d.justificativa,
        status: "pendente",
      });
      onOpenChange(false);
    } catch {
      // toast de erro já emitido pelo hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Solicitar abono</DialogTitle>
          <DialogDescription>
            A solicitação será analisada pela chefia e pelo RH. Você acompanha o andamento nesta página.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tipo_abono_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de abono</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={carregandoTipos}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={carregandoTipos ? "Carregando..." : "Selecione"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {tipos.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {tipoSelecionado?.exige_documento && (
                    <FormDescription>
                      Este tipo exige documento comprobatório: entregue-o ao RH.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="data_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data inicial</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data_fim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data final</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="hora_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora inicial (opcional)</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hora_fim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora final (opcional)</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="justificativa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Justificativa</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Explique o motivo do abono..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={salvando}>
                {salvando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar solicitação"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
