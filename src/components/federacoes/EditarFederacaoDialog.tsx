import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Save, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { ScrollArea } from '@/components/ui/scroll-area';

// Schema de validação
const federacaoEditSchema = z.object({
  nome: z.string().min(5, 'Nome deve ter pelo menos 5 caracteres'),
  sigla: z.string().min(2, 'Sigla deve ter pelo menos 2 caracteres').max(10, 'Sigla deve ter no máximo 10 caracteres'),
  cnpj: z.string().min(14, 'CNPJ deve ter 14 dígitos').max(18, 'CNPJ inválido'),
  data_criacao: z.string().min(1, 'Informe a data de criação'),
  endereco_logradouro: z.string().min(3, 'Logradouro deve ter pelo menos 3 caracteres'),
  endereco_numero: z.string().min(1, 'Informe o número'),
  endereco_bairro: z.string().min(2, 'Bairro deve ter pelo menos 2 caracteres'),
  telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  email: z.string().email('E-mail inválido'),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  mandato_inicio: z.string().min(1, 'Informe a data de início do mandato'),
  mandato_fim: z.string().min(1, 'Informe a data de fim do mandato'),
  presidente_nome: z.string().min(5, 'Nome deve ter pelo menos 5 caracteres'),
  presidente_nascimento: z.string().min(1, 'Informe a data de nascimento'),
  presidente_telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  presidente_email: z.string().email('E-mail inválido'),
  presidente_endereco_logradouro: z.string().optional(),
  presidente_endereco_numero: z.string().optional(),
  presidente_endereco_bairro: z.string().optional(),
  presidente_instagram: z.string().optional(),
  presidente_facebook: z.string().optional(),
  vice_presidente_nome: z.string().min(5, 'Nome deve ter pelo menos 5 caracteres'),
  vice_presidente_telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  vice_presidente_data_nascimento: z.string().min(1, 'Informe a data de nascimento'),
  vice_presidente_instagram: z.string().optional(),
  vice_presidente_facebook: z.string().optional(),
  diretor_tecnico_nome: z.string().optional(),
  diretor_tecnico_telefone: z.string().optional(),
  diretor_tecnico_data_nascimento: z.string().optional(),
  diretor_tecnico_instagram: z.string().optional(),
  diretor_tecnico_facebook: z.string().optional(),
});

type FederacaoEditFormData = z.infer<typeof federacaoEditSchema>;

interface Federacao {
  id: string;
  nome: string;
  sigla: string;
  cnpj?: string | null;
  data_criacao: string;
  endereco: string;
  endereco_logradouro?: string | null;
  endereco_numero?: string | null;
  endereco_bairro?: string | null;
  telefone: string;
  email: string;
  instagram: string | null;
  facebook?: string | null;
  mandato_inicio: string;
  mandato_fim: string;
  presidente_nome: string;
  presidente_nascimento: string;
  presidente_telefone: string;
  presidente_email: string;
  presidente_endereco?: string | null;
  presidente_endereco_logradouro?: string | null;
  presidente_endereco_numero?: string | null;
  presidente_endereco_bairro?: string | null;
  presidente_instagram?: string | null;
  presidente_facebook?: string | null;
  vice_presidente_nome: string;
  vice_presidente_telefone: string;
  vice_presidente_data_nascimento?: string | null;
  vice_presidente_instagram?: string | null;
  vice_presidente_facebook?: string | null;
  diretor_tecnico_nome: string;
  diretor_tecnico_telefone: string;
  diretor_tecnico_data_nascimento?: string | null;
  diretor_tecnico_instagram?: string | null;
  diretor_tecnico_facebook?: string | null;
  status: 'em_analise' | 'ativo' | 'inativo' | 'rejeitado';
}

interface EditarFederacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  federacao: Federacao | null;
}

export function EditarFederacaoDialog({ open, onOpenChange, federacao }: EditarFederacaoDialogProps) {
  const queryClient = useQueryClient();

  const form = useForm<FederacaoEditFormData>({
    resolver: zodResolver(federacaoEditSchema),
    defaultValues: {
      nome: '',
      sigla: '',
      cnpj: '',
      data_criacao: '',
      endereco_logradouro: '',
      endereco_numero: '',
      endereco_bairro: '',
      telefone: '',
      email: '',
      instagram: '',
      facebook: '',
      mandato_inicio: '',
      mandato_fim: '',
      presidente_nome: '',
      presidente_nascimento: '',
      presidente_telefone: '',
      presidente_email: '',
      presidente_endereco_logradouro: '',
      presidente_endereco_numero: '',
      presidente_endereco_bairro: '',
      presidente_instagram: '',
      presidente_facebook: '',
      vice_presidente_nome: '',
      vice_presidente_telefone: '',
      vice_presidente_data_nascimento: '',
      vice_presidente_instagram: '',
      vice_presidente_facebook: '',
      diretor_tecnico_nome: '',
      diretor_tecnico_telefone: '',
      diretor_tecnico_data_nascimento: '',
      diretor_tecnico_instagram: '',
      diretor_tecnico_facebook: '',
    },
  });

  // Popular formulário quando federação muda
  useEffect(() => {
    if (federacao) {
      form.reset({
        nome: federacao.nome || '',
        sigla: federacao.sigla || '',
        cnpj: federacao.cnpj || '',
        data_criacao: federacao.data_criacao?.split('T')[0] || '',
        endereco_logradouro: federacao.endereco_logradouro || '',
        endereco_numero: federacao.endereco_numero || '',
        endereco_bairro: federacao.endereco_bairro || '',
        telefone: federacao.telefone || '',
        email: federacao.email || '',
        instagram: federacao.instagram || '',
        facebook: federacao.facebook || '',
        mandato_inicio: federacao.mandato_inicio?.split('T')[0] || '',
        mandato_fim: federacao.mandato_fim?.split('T')[0] || '',
        presidente_nome: federacao.presidente_nome || '',
        presidente_nascimento: federacao.presidente_nascimento?.split('T')[0] || '',
        presidente_telefone: federacao.presidente_telefone || '',
        presidente_email: federacao.presidente_email || '',
        presidente_endereco_logradouro: federacao.presidente_endereco_logradouro || '',
        presidente_endereco_numero: federacao.presidente_endereco_numero || '',
        presidente_endereco_bairro: federacao.presidente_endereco_bairro || '',
        presidente_instagram: federacao.presidente_instagram || '',
        presidente_facebook: federacao.presidente_facebook || '',
        vice_presidente_nome: federacao.vice_presidente_nome || '',
        vice_presidente_telefone: federacao.vice_presidente_telefone || '',
        vice_presidente_data_nascimento: federacao.vice_presidente_data_nascimento?.split('T')[0] || '',
        vice_presidente_instagram: federacao.vice_presidente_instagram || '',
        vice_presidente_facebook: federacao.vice_presidente_facebook || '',
        diretor_tecnico_nome: federacao.diretor_tecnico_nome || '',
        diretor_tecnico_telefone: federacao.diretor_tecnico_telefone || '',
        diretor_tecnico_data_nascimento: federacao.diretor_tecnico_data_nascimento?.split('T')[0] || '',
        diretor_tecnico_instagram: federacao.diretor_tecnico_instagram || '',
        diretor_tecnico_facebook: federacao.diretor_tecnico_facebook || '',
      });
    }
  }, [federacao, form]);

  const updateMutation = useMutation({
    mutationFn: async (data: FederacaoEditFormData) => {
      if (!federacao) throw new Error('Federação não selecionada');

      const enderecoCompleto = `${data.endereco_logradouro}, ${data.endereco_numero} - ${data.endereco_bairro}`.toUpperCase();
      const presidenteEnderecoCompleto = data.presidente_endereco_logradouro
        ? `${data.presidente_endereco_logradouro}, ${data.presidente_endereco_numero || 'S/N'} - ${data.presidente_endereco_bairro || ''}`.toUpperCase()
        : null;

      const { error } = await supabase
        .from('federacoes_esportivas')
        .update({
          nome: data.nome.toUpperCase(),
          sigla: data.sigla.toUpperCase(),
          cnpj: data.cnpj.replace(/\D/g, ''),
          data_criacao: data.data_criacao,
          endereco_logradouro: data.endereco_logradouro.toUpperCase(),
          endereco_numero: data.endereco_numero.toUpperCase(),
          endereco_bairro: data.endereco_bairro.toUpperCase(),
          endereco: enderecoCompleto,
          telefone: data.telefone,
          email: data.email.toLowerCase(),
          instagram: data.instagram || null,
          facebook: data.facebook || null,
          mandato_inicio: data.mandato_inicio,
          mandato_fim: data.mandato_fim,
          presidente_nome: data.presidente_nome.toUpperCase(),
          presidente_nascimento: data.presidente_nascimento,
          presidente_telefone: data.presidente_telefone,
          presidente_email: data.presidente_email.toLowerCase(),
          presidente_endereco_logradouro: data.presidente_endereco_logradouro?.toUpperCase() || null,
          presidente_endereco_numero: data.presidente_endereco_numero?.toUpperCase() || null,
          presidente_endereco_bairro: data.presidente_endereco_bairro?.toUpperCase() || null,
          presidente_endereco: presidenteEnderecoCompleto,
          presidente_instagram: data.presidente_instagram || null,
          presidente_facebook: data.presidente_facebook || null,
          vice_presidente_nome: data.vice_presidente_nome.toUpperCase(),
          vice_presidente_telefone: data.vice_presidente_telefone,
          vice_presidente_data_nascimento: data.vice_presidente_data_nascimento,
          vice_presidente_instagram: data.vice_presidente_instagram || null,
          vice_presidente_facebook: data.vice_presidente_facebook || null,
          diretor_tecnico_nome: data.diretor_tecnico_nome?.toUpperCase() || null,
          diretor_tecnico_telefone: data.diretor_tecnico_telefone || null,
          diretor_tecnico_data_nascimento: data.diretor_tecnico_data_nascimento || null,
          diretor_tecnico_instagram: data.diretor_tecnico_instagram || null,
          diretor_tecnico_facebook: data.diretor_tecnico_facebook || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', federacao.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['federacoes'] });
      toast.success('Federação atualizada com sucesso!');
      onOpenChange(false);
    },
    onError: (error) => {
      console.error('Erro ao atualizar federação:', error);
      toast.error('Erro ao atualizar federação');
    },
  });

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
    if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
    if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
    return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12, 14)}`;
  };

  const handlePhoneChange = (field: any) => (e: React.ChangeEvent<HTMLInputElement>) => {
    field.onChange(formatPhone(e.target.value));
  };

  const handleCNPJChange = (field: any) => (e: React.ChangeEvent<HTMLInputElement>) => {
    field.onChange(formatCNPJ(e.target.value));
  };

  const onSubmit = (data: FederacaoEditFormData) => {
    updateMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Editar Federação</DialogTitle>
          <DialogDescription>
            Atualize os dados cadastrais da federação
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Dados da Federação */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Dados da Federação
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Nome *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sigla"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sigla *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            maxLength={10}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="00.000.000/0000-00"
                            onChange={handleCNPJChange(field)}
                            maxLength={18}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="data_criacao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Criação *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endereco_logradouro"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Endereço (Logradouro) *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endereco_numero"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endereco_bairro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bairro *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={handlePhoneChange(field)}
                            maxLength={15}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail *</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="facebook"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facebook</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Mandato */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Mandato
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="mandato_inicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Início *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="mandato_fim"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fim *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Presidente */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Presidente
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="presidente_nome"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Nome *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="presidente_nascimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nascimento *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="presidente_telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={handlePhoneChange(field)}
                            maxLength={15}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="presidente_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail *</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="presidente_instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Vice-Presidente */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Vice-Presidente
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="vice_presidente_nome"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Nome *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vice_presidente_data_nascimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nascimento *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vice_presidente_telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={handlePhoneChange(field)}
                            maxLength={15}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vice_presidente_instagram"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Instagram</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Diretor Técnico */}
              <div className="space-y-4">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Diretor Técnico (Opcional)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="diretor_tecnico_nome"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormLabel>Nome</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="diretor_tecnico_data_nascimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nascimento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="diretor_tecnico_telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            onChange={handlePhoneChange(field)}
                            maxLength={15}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </form>
          </Form>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
