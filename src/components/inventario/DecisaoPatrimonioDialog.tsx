/**
 * DIALOG: DECISÃO DE PATRIMÔNIO (aprovar / rejeitar)
 * Usado por movimentações e baixas. Aprovar pede só confirmação; rejeitar exige o motivo,
 * que o banco também valida (RPC patrimonio_decidir_*).
 */

import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const rejeicaoSchema = z.object({
  motivo: z.string().trim().min(5, "Informe o motivo da rejeição (mín. 5 caracteres)"),
});

type RejeicaoForm = z.infer<typeof rejeicaoSchema>;

export type ModoDecisao = "aprovar" | "rejeitar";

interface DecisaoPatrimonioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modo: ModoDecisao;
  titulo: string;
  descricao: string;
  /** Texto de alerta extra mostrado na confirmação (ex.: efeito no bem). */
  aviso?: string;
  processando?: boolean;
  onConfirmar: (motivoRejeicao?: string) => void;
}

export function DecisaoPatrimonioDialog({
  open,
  onOpenChange,
  modo,
  titulo,
  descricao,
  aviso,
  processando,
  onConfirmar,
}: DecisaoPatrimonioDialogProps) {
  const form = useForm<RejeicaoForm>({
    resolver: zodResolver(rejeicaoSchema),
    defaultValues: { motivo: "" },
  });

  useEffect(() => {
    if (open) form.reset({ motivo: "" });
  }, [open, form]);

  // Enquanto o diálogo fecha (animação), o pai costuma limpar a seleção e as props
  // voltam ao padrão ("aprovar", título vazio). Guarda o último conteúdo aberto para
  // não piscar o outro modo/título durante a saída.
  const ultimoConteudo = useRef({ modo, titulo, descricao, aviso });
  if (open) ultimoConteudo.current = { modo, titulo, descricao, aviso };
  const exibido = open ? { modo, titulo, descricao, aviso } : ultimoConteudo.current;

  const handleOpenChange = (valor: boolean) => {
    if (!processando) onOpenChange(valor);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{exibido.titulo}</DialogTitle>
          <DialogDescription>{exibido.descricao}</DialogDescription>
        </DialogHeader>

        {exibido.modo === "aprovar" ? (
          <>
            {exibido.aviso && (
              <p role="alert" className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm">
                {exibido.aviso}
              </p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={processando}>
                Cancelar
              </Button>
              <Button onClick={() => onConfirmar()} disabled={processando}>
                {processando && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                Aprovar
              </Button>
            </DialogFooter>
          </>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit((dados) => onConfirmar(dados.motivo.trim()))} className="space-y-4">
              <FormField
                control={form.control}
                name="motivo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Motivo da rejeição *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Explique por que o pedido foi rejeitado..." className="min-h-[90px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={processando}>
                  Cancelar
                </Button>
                <Button type="submit" variant="destructive" disabled={processando}>
                  {processando && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
                  Rejeitar
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
