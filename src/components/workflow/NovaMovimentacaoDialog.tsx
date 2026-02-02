/**
 * Dialog para criar nova movimentação/tramitação
 */
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useCriarMovimentacao } from '@/hooks/useWorkflow';
import { TIPO_MOVIMENTACAO_LABELS } from '@/types/workflow';

const formSchema = z.object({
  tipo_movimentacao: z.enum(['despacho', 'encaminhamento', 'juntada', 'decisao', 'informacao', 'ciencia', 'devolucao']),
  descricao: z.string().min(5, 'Mínimo 5 caracteres'),
  prazo_dias: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface NovaMovimentacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processoId: string;
}

export function NovaMovimentacaoDialog({ open, onOpenChange, processoId }: NovaMovimentacaoDialogProps) {
  const criarMovimentacao = useCriarMovimentacao();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo_movimentacao: 'encaminhamento',
      descricao: '',
      prazo_dias: '',
      observacoes: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    const prazoDias = data.prazo_dias ? parseInt(data.prazo_dias) : undefined;
    const prazoLimite = prazoDias 
      ? new Date(Date.now() + prazoDias * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : undefined;

    await criarMovimentacao.mutateAsync({
      processo_id: processoId,
      tipo_movimentacao: data.tipo_movimentacao,
      descricao: data.descricao,
      prazo_dias: prazoDias,
      prazo_limite: prazoLimite,
      observacoes: data.observacoes || undefined,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Movimentação</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tipo_movimentacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Movimentação *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(TIPO_MOVIMENTACAO_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descreva a movimentação..."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="prazo_dias"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prazo para Resposta (dias)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="Ex: 5"
                      {...field} 
                    />
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
                    <Textarea 
                      placeholder="Observações adicionais..."
                      className="min-h-[60px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={criarMovimentacao.isPending}>
                {criarMovimentacao.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar Movimentação
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
