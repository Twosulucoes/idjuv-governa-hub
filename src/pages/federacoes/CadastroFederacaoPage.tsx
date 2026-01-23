import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CheckCircle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FaixaBrasil } from '@/components/ui/FaixaBrasil';

import logoIdjuv from '@/assets/logo-idjuv-oficial.png';

// Schema de validação
const federacaoSchema = z.object({
  // Dados da Federação
  nome: z.string().min(5, 'Nome deve ter pelo menos 5 caracteres'),
  sigla: z.string().min(2, 'Sigla deve ter pelo menos 2 caracteres').max(10, 'Sigla deve ter no máximo 10 caracteres'),
  data_criacao: z.string().min(1, 'Informe a data de criação'),
  endereco: z.string().min(10, 'Endereço deve ter pelo menos 10 caracteres'),
  telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  email: z.string().email('E-mail inválido'),
  instagram: z.string().optional(),
  
  // Mandato
  mandato_inicio: z.string().min(1, 'Informe a data de início do mandato'),
  mandato_fim: z.string().min(1, 'Informe a data de fim do mandato'),
  
  // Presidente
  presidente_nome: z.string().min(5, 'Nome deve ter pelo menos 5 caracteres'),
  presidente_nascimento: z.string().min(1, 'Informe a data de nascimento'),
  presidente_telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  presidente_email: z.string().email('E-mail inválido'),
  presidente_endereco: z.string().optional(),
  presidente_instagram: z.string().optional(),
  
  // Outros Dirigentes
  vice_presidente_nome: z.string().min(5, 'Nome deve ter pelo menos 5 caracteres'),
  vice_presidente_telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  diretor_tecnico_nome: z.string().min(5, 'Nome deve ter pelo menos 5 caracteres'),
  diretor_tecnico_telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
});

type FederacaoFormData = z.infer<typeof federacaoSchema>;

export default function CadastroFederacaoPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<FederacaoFormData>({
    resolver: zodResolver(federacaoSchema),
    defaultValues: {
      nome: '',
      sigla: '',
      data_criacao: '',
      endereco: '',
      telefone: '',
      email: '',
      instagram: '',
      mandato_inicio: '',
      mandato_fim: '',
      presidente_nome: '',
      presidente_nascimento: '',
      presidente_telefone: '',
      presidente_email: '',
      presidente_endereco: '',
      presidente_instagram: '',
      vice_presidente_nome: '',
      vice_presidente_telefone: '',
      diretor_tecnico_nome: '',
      diretor_tecnico_telefone: '',
    },
  });

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 2) return numbers;
    if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    if (numbers.length <= 11) return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7)}`;
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  };

  const handlePhoneChange = (field: any) => (e: React.ChangeEvent<HTMLInputElement>) => {
    field.onChange(formatPhone(e.target.value));
  };

  const onSubmit = async (data: FederacaoFormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('federacoes_esportivas')
        .insert({
          nome: data.nome.toUpperCase(),
          sigla: data.sigla.toUpperCase(),
          data_criacao: data.data_criacao,
          endereco: data.endereco.toUpperCase(),
          telefone: data.telefone,
          email: data.email.toLowerCase(),
          instagram: data.instagram || null,
          mandato_inicio: data.mandato_inicio,
          mandato_fim: data.mandato_fim,
          presidente_nome: data.presidente_nome.toUpperCase(),
          presidente_nascimento: data.presidente_nascimento,
          presidente_telefone: data.presidente_telefone,
          presidente_email: data.presidente_email.toLowerCase(),
          presidente_endereco: data.presidente_endereco?.toUpperCase() || null,
          presidente_instagram: data.presidente_instagram || null,
          vice_presidente_nome: data.vice_presidente_nome.toUpperCase(),
          vice_presidente_telefone: data.vice_presidente_telefone,
          diretor_tecnico_nome: data.diretor_tecnico_nome.toUpperCase(),
          diretor_tecnico_telefone: data.diretor_tecnico_telefone,
          status: 'em_analise',
        });

      if (error) throw error;

      setIsSuccess(true);
      toast.success('Cadastro enviado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao enviar cadastro:', error);
      toast.error('Erro ao enviar cadastro. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        <FaixaBrasil />
        <div className="container max-w-lg mx-auto px-4 py-12">
          <Card className="text-center">
            <CardContent className="pt-12 pb-8">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Cadastro enviado com sucesso!
              </h2>
              <p className="text-muted-foreground mb-6">
                Obrigado pelo envio das informações!
              </p>
              <p className="text-sm text-muted-foreground">
                Sua federação será analisada pela equipe do IDJuv e você receberá uma resposta em breve.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <FaixaBrasil />
      
      <div className="container max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <img 
            src={logoIdjuv} 
            alt="IDJuv" 
            className="h-16 mx-auto mb-4"
          />
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Cadastro de Federações Esportivas
          </h1>
          <p className="text-muted-foreground">
            Preencha os dados para vincular sua federação ao IDJuv
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Seção 1 - Dados da Federação */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</span>
                  Dados da Federação
                </CardTitle>
                <CardDescription>Informações gerais da federação</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Federação *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nome completo (sem abreviações)" 
                          {...field} 
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="sigla"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Sigla *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: FERR" 
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
                </div>

                <FormField
                  control={form.control}
                  name="endereco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Rua, número e bairro" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="(00) 00000-0000" 
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
                          <Input 
                            type="email" 
                            placeholder="email@federacao.com" 
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="instagram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram</FormLabel>
                      <FormControl>
                        <Input placeholder="@federacao" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Seção 2 - Mandato */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</span>
                  Mandato da Diretoria
                </CardTitle>
                <CardDescription>Período do mandato atual</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="mandato_inicio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Início *</FormLabel>
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
                        <FormLabel>Data de Fim *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Seção 3 - Presidente */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</span>
                  Presidente da Federação
                </CardTitle>
                <CardDescription>Dados do presidente atual</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="presidente_nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nome completo" 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="presidente_nascimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Nascimento *</FormLabel>
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
                            placeholder="(00) 00000-0000" 
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

                <FormField
                  control={form.control}
                  name="presidente_email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail *</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="email@presidente.com" 
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="presidente_endereco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço Residencial</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Rua, número e bairro" 
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
                  name="presidente_instagram"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram</FormLabel>
                      <FormControl>
                        <Input placeholder="@usuario" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Seção 4 - Outros Dirigentes */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">4</span>
                  Outros Dirigentes
                </CardTitle>
                <CardDescription>Vice-presidente e diretor técnico</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="vice_presidente_nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vice-Presidente *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Nome completo" 
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
                    name="vice_presidente_telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="(00) 00000-0000" 
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="diretor_tecnico_nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Diretor Técnico *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Nome completo" 
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
                    name="diretor_tecnico_telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>WhatsApp *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="(00) 00000-0000" 
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
              </CardContent>
            </Card>

            {/* Botão de Envio */}
            <Button 
              type="submit" 
              className="w-full h-12 text-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Enviando...
                </>
              ) : (
                'Enviar Cadastro'
              )}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              * Campos obrigatórios
            </p>
          </form>
        </Form>
      </div>
    </div>
  );
}
