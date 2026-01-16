import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Newspaper, Loader2, ExternalLink } from 'lucide-react';

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
  FormDescription,
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const formSchema = z.object({
  doe_numero: z.string().min(1, 'Número do DOE é obrigatório'),
  doe_data: z.date({ required_error: 'Data do DOE é obrigatória' }),
  data_publicacao: z.date().optional(),
  doe_link: z.string().url('URL inválida').optional().or(z.literal('')),
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
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      doe_numero: '',
      doe_link: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        doe_numero: '',
        doe_link: '',
        doe_data: undefined,
        data_publicacao: undefined,
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

    const fileName = `portarias/${portaria.numero.replace(/\//g, '-')}_publicada_${Date.now()}.pdf`;
    
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

      let arquivo_url: string | undefined;
      if (arquivo) {
        arquivo_url = (await uploadArquivo()) || undefined;
      }

      await registrarPublicacao.mutateAsync({
        id: portaria.id,
        doe_numero: data.doe_numero,
        doe_data: format(data.doe_data, 'yyyy-MM-dd'),
        data_publicacao: data.data_publicacao
          ? format(data.data_publicacao, 'yyyy-MM-dd')
          : undefined,
        doe_link: data.doe_link || undefined,
        arquivo_url,
      });

      form.reset();
      setArquivo(null);
      onOpenChange(false);
      onSuccess?.();
      toast.success('Publicação registrada com sucesso!');
    } catch (error) {
      console.error('Erro ao registrar publicação:', error);
      toast.error('Erro ao registrar publicação');
    } finally {
      setUploading(false);
    }
  };

  const isPending = registrarPublicacao.isPending || uploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
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
            <div className="grid grid-cols-2 gap-4">
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
                              <span>Selecione</span>
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
            </div>

            <FormField
              control={form.control}
              name="data_publicacao"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data da Publicação</FormLabel>
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
                  <FormDescription>
                    Se diferente da data do DOE
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="doe_link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1">
                    Link do DOE
                    <ExternalLink className="h-3 w-3" />
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="url" 
                      placeholder="https://diario.rr.gov.br/..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    URL para acesso ao Diário Oficial
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Anexo da Portaria Publicada (PDF)</FormLabel>
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
                  'Registrar Publicação'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
