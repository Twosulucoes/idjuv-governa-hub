import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Ban } from "lucide-react";
import { useCancelarRemessa } from "@/hooks/useArquivosFolha";

const schema = z.object({
  motivo: z
    .string()
    .trim()
    .min(10, "Descreva o motivo (mínimo de 10 caracteres)")
    .max(500, "Máximo de 500 caracteres"),
});

type FormData = z.infer<typeof schema>;

interface CancelarRemessaDialogProps {
  remessa: { id: string; numero_remessa: number; folha_id: string } | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Remessa não se exclui (sem DELETE pela API): é cancelada com motivo, que o banco grava com o autor (RPC
 * `cancelar_remessa`). O arquivo guardado continua no bucket.
 */
export function CancelarRemessaDialog({ remessa, onOpenChange }: CancelarRemessaDialogProps) {
  const cancelar = useCancelarRemessa();
  const form = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { motivo: "" } });

  useEffect(() => {
    if (remessa) form.reset({ motivo: "" });
  }, [remessa, form]);

  const onSubmit = (dados: FormData) => {
    if (!remessa) return;
    cancelar.mutate(
      { remessaId: remessa.id, folhaId: remessa.folha_id, motivo: dados.motivo },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={!!remessa} onOpenChange={(aberto) => !cancelar.isPending && onOpenChange(aberto)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cancelar remessa nº {remessa?.numero_remessa}</DialogTitle>
          <DialogDescription>
            A remessa não é apagada: fica marcada como cancelada, com o motivo e quem cancelou. Não envie ao banco um
            arquivo de remessa cancelada.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="motivo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Motivo do cancelamento</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} placeholder="Ex.: arquivo gerado com a conta errada" />
                  </FormControl>
                  <FormDescription>Obrigatório. Não informe CPF nem dados bancários.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={cancelar.isPending}>
                Voltar
              </Button>
              <Button type="submit" variant="destructive" disabled={cancelar.isPending}>
                {cancelar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-2 h-4 w-4" />}
                Cancelar remessa
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
