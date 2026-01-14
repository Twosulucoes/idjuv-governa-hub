import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Newspaper } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useRegistrarPublicacao } from '@/hooks/usePortarias';
import { Portaria } from '@/types/portaria';

const formSchema = z.object({
  doe_numero: z.string().min(1, 'Número do DOE é obrigatório'),
  doe_data: z.date({ required_error: 'Data do DOE é obrigatória' }),
  data_publicacao: z.date().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface RegistrarPublicacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portaria: Portaria | null;
  onSuccess?: () => void;
}

export function RegistrarPublicacaoDialog({
  open,
  onOpenChange,
  portaria,
  onSuccess,
}: RegistrarPublicacaoDialogProps) {
  const registrarPublicacao = useRegistrarPublicacao();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      doe_numero: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!portaria) return;

    try {
      await registrarPublicacao.mutateAsync({
        id: portaria.id,
        doe_numero: data.doe_numero,
        doe_data: format(data.doe_data, 'yyyy-MM-dd'),
        data_publicacao: data.data_publicacao
          ? format(data.data_publicacao, 'yyyy-MM-dd')
          : undefined,
      });

      form.reset();
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao registrar publicação:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Newspaper className="h-5 w-5" />
            Registrar Publicação no DOE
          </DialogTitle>
          <DialogDescription>
            {portaria && (
              <span>
                Portaria nº <strong>{portaria.numero}</strong> -{' '}
                {portaria.titulo}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="doe_numero"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número do DOE *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 1234" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="doe_data"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data do DOE *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'dd/MM/yyyy')
                          ) : (
                            <span>Selecione a data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="data_publicacao"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Vigência (opcional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'dd/MM/yyyy')
                          ) : (
                            <span>Igual à data do DOE</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={registrarPublicacao.isPending}>
                {registrarPublicacao.isPending
                  ? 'Registrando...'
                  : 'Registrar Publicação'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
