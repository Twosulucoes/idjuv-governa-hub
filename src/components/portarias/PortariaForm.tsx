import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, FileText, Wand2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useCreatePortaria, useGerarNumeroPortaria } from '@/hooks/usePortarias';
import { TIPO_PORTARIA_LABELS, CategoriaPortaria } from '@/types/portaria';

const formSchema = z.object({
  titulo: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  categoria: z.string().optional(),
  data_documento: z.date({ required_error: 'Data é obrigatória' }),
  ementa: z.string().optional(),
  conteudo_html: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface PortariaFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultValues?: Partial<FormData>;
  servidorId?: string;
  provimentoId?: string;
  designacaoId?: string;
}

export function PortariaForm({
  open,
  onOpenChange,
  onSuccess,
  defaultValues,
  servidorId,
  provimentoId,
  designacaoId,
}: PortariaFormProps) {
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(false);
  const [generatedNumber, setGeneratedNumber] = useState<string | null>(null);
  
  const createPortaria = useCreatePortaria();
  const gerarNumero = useGerarNumeroPortaria();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      titulo: defaultValues?.titulo || '',
      categoria: defaultValues?.categoria || 'pessoal',
      data_documento: defaultValues?.data_documento || new Date(),
      ementa: defaultValues?.ementa || '',
      conteudo_html: defaultValues?.conteudo_html || '',
      observacoes: defaultValues?.observacoes || '',
    },
  });

  const handleGenerateNumber = async () => {
    setIsGeneratingNumber(true);
    try {
      const dataDocumento = form.getValues('data_documento');
      const ano = dataDocumento ? dataDocumento.getFullYear() : new Date().getFullYear();
      const numero = await gerarNumero.mutateAsync(ano);
      setGeneratedNumber(numero);
    } catch (error) {
      console.error('Erro ao gerar número:', error);
    } finally {
      setIsGeneratingNumber(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      await createPortaria.mutateAsync({
        titulo: data.titulo,
        tipo: 'portaria',
        categoria: data.categoria as CategoriaPortaria,
        data_documento: format(data.data_documento, 'yyyy-MM-dd'),
        ementa: data.ementa,
        conteudo_html: data.conteudo_html,
        observacoes: data.observacoes,
        numero: generatedNumber || undefined,
        servidores_ids: servidorId ? [servidorId] : undefined,
        provimento_id: provimentoId,
        designacao_id: designacaoId,
      });
      
      form.reset();
      setGeneratedNumber(null);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Erro ao criar portaria:', error);
    }
  };

  const categorias: { value: CategoriaPortaria; label: string }[] = [
    { value: 'pessoal', label: 'Pessoal' },
    { value: 'nomeacao', label: 'Nomeação' },
    { value: 'exoneracao', label: 'Exoneração' },
    { value: 'designacao', label: 'Designação' },
    { value: 'dispensa', label: 'Dispensa' },
    { value: 'cessao', label: 'Cessão' },
    { value: 'ferias', label: 'Férias' },
    { value: 'licenca', label: 'Licença' },
    { value: 'estruturante', label: 'Estruturante' },
    { value: 'normativa', label: 'Normativa' },
    { value: 'delegacao', label: 'Delegação' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Nova Portaria
          </DialogTitle>
          <DialogDescription>
            Crie uma nova portaria. O número será gerado automaticamente se não informado.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <FormLabel>Número da Portaria</FormLabel>
                <div className="flex items-center gap-2 mt-1.5">
                  <Input
                    value={generatedNumber || ''}
                    onChange={(e) => setGeneratedNumber(e.target.value)}
                    placeholder="Será gerado automaticamente"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateNumber}
                    disabled={isGeneratingNumber}
                  >
                    <Wand2 className="h-4 w-4 mr-1" />
                    {isGeneratingNumber ? 'Gerando...' : 'Gerar'}
                  </Button>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="titulo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Nomeação - João da Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categorias.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="data_documento"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data do Documento *</FormLabel>
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
            </div>

            <FormField
              control={form.control}
              name="ementa"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ementa</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Resumo do conteúdo da portaria..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="conteudo_html"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conteúdo</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Texto completo da portaria..."
                      className="resize-none font-mono text-sm"
                      rows={8}
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
                  <FormLabel>Observações Internas</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações internas (não aparecem no documento)..."
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
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
              <Button type="submit" disabled={createPortaria.isPending}>
                {createPortaria.isPending ? 'Criando...' : 'Criar Portaria'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
