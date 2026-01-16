import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, FileSignature, Loader2 } from 'lucide-react';

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
import { useRegistrarAssinatura } from '@/hooks/usePortarias';
import { Portaria } from '@/types/portaria';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const formSchema = z.object({
  assinado_por: z.string().min(1, 'Nome do signatário é obrigatório'),
  data_assinatura: z.date({ required_error: 'Data da assinatura é obrigatória' }),
});

type FormData = z.infer<typeof formSchema>;

interface RegistrarAssinaturaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portaria: Portaria | null;
  onSuccess?: () => void;
}

export function RegistrarAssinaturaDialog({
  open,
  onOpenChange,
  portaria,
  onSuccess,
}: RegistrarAssinaturaDialogProps) {
  const registrarAssinatura = useRegistrarAssinatura();
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      assinado_por: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        assinado_por: '',
        data_assinatura: new Date(),
      });
      setArquivo(null);
    }
  }, [open, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Apenas arquivos PDF são aceitos');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 10MB');
        return;
      }
      setArquivo(file);
    }
  };

  const uploadArquivo = async (): Promise<string | null> => {
    if (!arquivo || !portaria) return null;

    const fileName = `portarias/${portaria.numero.replace(/\//g, '-')}_assinada_${Date.now()}.pdf`;
    
    const { error } = await supabase.storage
      .from('documentos')
      .upload(fileName, arquivo, { upsert: true });

    if (error) {
      console.error('Erro upload:', error);
      throw new Error('Erro ao fazer upload do arquivo');
    }

    const { data: urlData } = supabase.storage
      .from('documentos')
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  };

  const onSubmit = async (data: FormData) => {
    if (!portaria) return;

    try {
      setUploading(true);
      
      let arquivo_assinado_url: string | undefined;
      if (arquivo) {
        arquivo_assinado_url = (await uploadArquivo()) || undefined;
      }

      await registrarAssinatura.mutateAsync({
        id: portaria.id,
        assinado_por: data.assinado_por,
        data_assinatura: format(data.data_assinatura, 'yyyy-MM-dd'),
        arquivo_assinado_url,
      });

      form.reset();
      setArquivo(null);
      onOpenChange(false);
      onSuccess?.();
      toast.success('Assinatura registrada com sucesso!');
    } catch (error) {
      console.error('Erro ao registrar assinatura:', error);
      toast.error('Erro ao registrar assinatura');
    } finally {
      setUploading(false);
    }
  };

  const isPending = registrarAssinatura.isPending || uploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSignature className="h-5 w-5" />
            Registrar Assinatura
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
              name="assinado_por"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assinado por *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do signatário" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="data_assinatura"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data da Assinatura *</FormLabel>
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

            <div className="space-y-2">
              <FormLabel>Portaria Assinada (PDF)</FormLabel>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="flex-1"
                />
              </div>
              {arquivo && (
                <p className="text-sm text-muted-foreground">
                  Arquivo selecionado: {arquivo.name}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  'Registrar Assinatura'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
