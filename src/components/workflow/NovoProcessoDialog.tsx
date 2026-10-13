/**
 * Dialog para abrir processo (acompanhamento do SEI). Grava pela RPC wf_abrir_processo e abre o detalhe.
 * `modeloCodigo` fixa o modelo (usado pelas telas de cada assunto) e esconde o seletor.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useAbrirProcesso, useModelosProcesso } from '@/hooks/useAcompanhamentoProcessos';
import { SIGILO_LABELS } from '@/types/workflow';

const formSchema = z.object({
  modelo_codigo: z.string().min(1, 'Selecione o modelo'),
  numero_sei: z.string().max(50, 'Máximo 50 caracteres').optional(),
  assunto: z.string().min(3, 'Mínimo 3 caracteres').max(200, 'Máximo 200 caracteres'),
  descricao: z.string().optional(),
  interessado_tipo: z.enum(['interno', 'externo']),
  interessado_nome: z.string().min(2, 'Mínimo 2 caracteres'),
  interessado_documento: z.string().optional(),
  sigilo: z.enum(['publico', 'restrito', 'sigiloso']),
});

type FormData = z.infer<typeof formSchema>;

interface NovoProcessoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Fixa o modelo do processo e esconde o seletor */
  modeloCodigo?: string;
}

export function NovoProcessoDialog({ open, onOpenChange, modeloCodigo }: NovoProcessoDialogProps) {
  const navigate = useNavigate();
  const abrirProcesso = useAbrirProcesso();
  const { data: modelos, isLoading: carregandoModelos, isError: erroModelos } = useModelosProcesso();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      modelo_codigo: modeloCodigo ?? '',
      numero_sei: '',
      assunto: '',
      descricao: '',
      interessado_tipo: 'interno',
      interessado_nome: '',
      interessado_documento: '',
      sigilo: 'publico',
    },
  });

  useEffect(() => {
    if (modeloCodigo) form.setValue('modelo_codigo', modeloCodigo);
  }, [modeloCodigo, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const id = await abrirProcesso.mutateAsync({
        modeloCodigo: data.modelo_codigo,
        assunto: data.assunto,
        descricao: data.descricao || undefined,
        interessadoTipo: data.interessado_tipo,
        interessadoNome: data.interessado_nome,
        interessadoDocumento: data.interessado_documento || undefined,
        sigilo: data.sigilo,
        numeroSei: data.numero_sei?.trim() || undefined,
      });
      form.reset();
      onOpenChange(false);
      navigate(`/workflow/processos/${id}`);
    } catch {
      // o toast com a mensagem do servidor já foi mostrado pelo hook; o diálogo fica aberto
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo processo</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {!modeloCodigo && (
                <FormField
                  control={form.control}
                  name="modelo_codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={carregandoModelos ? 'Carregando...' : 'Selecione...'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(modelos ?? []).map((m) => (
                            <SelectItem key={m.codigo} value={m.codigo}>{m.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {erroModelos && (
                        <p className="text-caption text-destructive">Não foi possível carregar os modelos.</p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="numero_sei"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº do processo no SEI</FormLabel>
                    <FormControl>
                      <Input placeholder="Opcional" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
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

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={abrirProcesso.isPending}>
                {abrirProcesso.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Abrir processo
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
