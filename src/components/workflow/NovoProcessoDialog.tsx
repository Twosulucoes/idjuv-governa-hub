/**
 * Dialog para criar novo processo administrativo
 */
import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useCriarProcesso } from '@/hooks/useWorkflow';
import { TIPO_PROCESSO_LABELS, SIGILO_LABELS } from '@/types/workflow';

const formSchema = z.object({
  tipo_processo: z.string().min(1, 'Selecione o tipo'),
  assunto: z.string().min(3, 'Mínimo 3 caracteres').max(200, 'Máximo 200 caracteres'),
  descricao: z.string().optional(),
  interessado_tipo: z.enum(['interno', 'externo']),
  interessado_nome: z.string().min(2, 'Mínimo 2 caracteres'),
  interessado_documento: z.string().optional(),
  sigilo: z.enum(['publico', 'restrito', 'sigiloso']),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface NovoProcessoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NovoProcessoDialog({ open, onOpenChange }: NovoProcessoDialogProps) {
  const criarProcesso = useCriarProcesso();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tipo_processo: '',
      assunto: '',
      descricao: '',
      interessado_tipo: 'interno',
      interessado_nome: '',
      interessado_documento: '',
      sigilo: 'publico',
      observacoes: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    await criarProcesso.mutateAsync({
      tipo_processo: data.tipo_processo as any,
      assunto: data.assunto,
      descricao: data.descricao || undefined,
      interessado_tipo: data.interessado_tipo,
      interessado_nome: data.interessado_nome,
      interessado_documento: data.interessado_documento || undefined,
      sigilo: data.sigilo,
      observacoes: data.observacoes || undefined,
    });
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Processo Administrativo</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="tipo_processo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Processo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(TIPO_PROCESSO_LABELS).map(([key, label]) => (
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
                name="sigilo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nível de Sigilo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(SIGILO_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="assunto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assunto *</FormLabel>
                  <FormControl>
                    <Input placeholder="Descrição resumida do processo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição Detalhada</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Detalhes adicionais sobre o processo..."
                      className="min-h-[80px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="interessado_tipo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Interessado *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="interno">Interno (Servidor/Unidade)</SelectItem>
                        <SelectItem value="externo">Externo (Cidadão/Empresa)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="interessado_documento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF/CNPJ do Interessado</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="interessado_nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Interessado *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo ou razão social" {...field} />
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
                      placeholder="Observações internas..."
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
              <Button type="submit" disabled={criarProcesso.isPending}>
                {criarProcesso.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Processo
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
