/**
 * Dialog para criar novo despacho
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
import { useCriarDespacho } from '@/hooks/useWorkflow';
import { TIPO_DESPACHO_LABELS, DECISAO_LABELS } from '@/types/workflow';

const formSchema = z.object({
  tipo_despacho: z.enum(['simples', 'decisorio', 'conclusivo']),
  texto_despacho: z.string().min(10, 'Mínimo 10 caracteres'),
  fundamentacao_legal: z.string().optional(),
  decisao: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface NovoDespachoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processoId: string;
}

export function NovoDespachoDialog({ open, onOpenChange, processoId }: NovoDespachoDialogProps) {
  const criarDespacho = useCriarDespacho();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo_despacho: 'simples',
      texto_despacho: '',
      fundamentacao_legal: '',
      decisao: '',
    },
  });

  const tipoDespacho = form.watch('tipo_despacho');
  const mostrarDecisao = tipoDespacho === 'decisorio' || tipoDespacho === 'conclusivo';

  const onSubmit = async (data: FormData) => {
    await criarDespacho.mutateAsync({
      processo_id: processoId,
      tipo_despacho: data.tipo_despacho,
      texto_despacho: data.texto_despacho,
      fundamentacao_legal: data.fundamentacao_legal || undefined,
      decisao: data.decisao ? (data.decisao as any) : undefined,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Novo Despacho</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo_despacho"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Despacho *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(TIPO_DESPACHO_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {mostrarDecisao && (
                <FormField
                  control={form.control}
                  name="decisao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Decisão</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(DECISAO_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="texto_despacho"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Texto do Despacho *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Digite o conteúdo do despacho..."
                      className="min-h-[150px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fundamentacao_legal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fundamentação Legal</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Art. 37 da CF/88, Lei 8.666/93..."
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
              <Button type="submit" disabled={criarDespacho.isPending}>
                {criarDespacho.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar Despacho
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
