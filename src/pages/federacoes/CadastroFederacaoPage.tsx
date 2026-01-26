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
  cnpj: z.string().min(14, 'CNPJ deve ter 14 dígitos').max(18, 'CNPJ inválido'),
  data_criacao: z.string().min(1, 'Informe a data de criação'),
  endereco_logradouro: z.string().min(3, 'Logradouro deve ter pelo menos 3 caracteres'),
  endereco_numero: z.string().min(1, 'Informe o número'),
  endereco_bairro: z.string().min(2, 'Bairro deve ter pelo menos 2 caracteres'),
  telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  email: z.string().email('E-mail inválido'),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  site: z.string().url('URL inválida').optional().or(z.literal('')),
  
  // Mandato
  mandato_inicio: z.string().min(1, 'Informe a data de início do mandato'),
  mandato_fim: z.string().min(1, 'Informe a data de fim do mandato'),
  
  // Presidente
  presidente_nome: z.string().min(5, 'Nome deve ter pelo menos 5 caracteres'),
  presidente_nascimento: z.string().min(1, 'Informe a data de nascimento'),
  presidente_telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  presidente_email: z.string().email('E-mail inválido'),
  presidente_endereco_logradouro: z.string().optional(),
  presidente_endereco_numero: z.string().optional(),
  presidente_endereco_bairro: z.string().optional(),
  presidente_instagram: z.string().optional(),
  presidente_facebook: z.string().optional(),
  
  // Vice-Presidente
  vice_presidente_nome: z.string().min(5, 'Nome deve ter pelo menos 5 caracteres'),
  vice_presidente_telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  vice_presidente_data_nascimento: z.string().min(1, 'Informe a data de nascimento'),
  vice_presidente_instagram: z.string().optional(),
  vice_presidente_facebook: z.string().optional(),
  
  // Diretor Técnico (opcional)
  diretor_tecnico_nome: z.string().optional(),
  diretor_tecnico_telefone: z.string().optional(),
  diretor_tecnico_data_nascimento: z.string().optional(),
  diretor_tecnico_instagram: z.string().optional(),
  diretor_tecnico_facebook: z.string().optional(),
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
      cnpj: '',
      data_criacao: '',
      endereco_logradouro: '',
      endereco_numero: '',
      endereco_bairro: '',
      telefone: '',
      email: '',
      instagram: '',
      facebook: '',
      site: '',
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

  const onSubmit = async (data: FederacaoFormData) => {
    setIsSubmitting(true);
    try {
      // Monta o endereço completo para campos legados
      const enderecoCompleto = `${data.endereco_logradouro}, ${data.endereco_numero} - ${data.endereco_bairro}`.toUpperCase();
      const presidenteEnderecoCompleto = data.presidente_endereco_logradouro 
        ? `${data.presidente_endereco_logradouro}, ${data.presidente_endereco_numero || 'S/N'} - ${data.presidente_endereco_bairro || ''}`.toUpperCase()
        : null;

      const { error } = await supabase
        .from('federacoes_esportivas')
        .insert({
          nome: data.nome.toUpperCase(),
          sigla: data.sigla.toUpperCase(),
          cnpj: data.cnpj.replace(/\D/g, ''),
          data_criacao: data.data_criacao,
          // Campos de endereço separados
          endereco_logradouro: data.endereco_logradouro.toUpperCase(),
          endereco_numero: data.endereco_numero.toUpperCase(),
          endereco_bairro: data.endereco_bairro.toUpperCase(),
          // Campo legado para compatibilidade
          endereco: enderecoCompleto,
          telefone: data.telefone,
          email: data.email.toLowerCase(),
          instagram: data.instagram || null,
          facebook: data.facebook || null,
          site: data.site || null,
          mandato_inicio: data.mandato_inicio,
          mandato_fim: data.mandato_fim,
          presidente_nome: data.presidente_nome.toUpperCase(),
          presidente_nascimento: data.presidente_nascimento,
          presidente_telefone: data.presidente_telefone,
          presidente_email: data.presidente_email.toLowerCase(),
          presidente_endereco_logradouro: data.presidente_endereco_logradouro?.toUpperCase() || null,
          presidente_endereco_numero: data.presidente_endereco_numero?.toUpperCase() || null,
          presidente_endereco_bairro: data.presidente_endereco_bairro?.toUpperCase() || null,
          // Campo legado para compatibilidade
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
                Acompanhe as ações e comunicados do IDJuv pelo Instagram:
              </p>
              <a 
                href="https://www.instagram.com/idjuvroraima?igsh=Z3d3dmU0MTA3NHpi" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-semibold text-lg transition-colors"
              >
                @idjuvroraima
              </a>
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
                    name="cnpj"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CNPJ *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="00.000.000/0000-00" 
                            {...field} 
                            onChange={handleCNPJChange(field)}
                            maxLength={18}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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

                {/* Endereço separado */}
                <FormField
                  control={form.control}
                  name="endereco_logradouro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço (Logradouro) *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Rua, Avenida, etc." 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="endereco_numero"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Nº" 
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
                            placeholder="Bairro" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

                  <FormField
                    control={form.control}
                    name="facebook"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facebook</FormLabel>
                        <FormControl>
                          <Input placeholder="facebook.com/federacao" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="site"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site da Federação</FormLabel>
                      <FormControl>
                        <Input 
                          type="url" 
                          placeholder="https://www.federacao.com.br" 
                          {...field} 
                        />
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

                {/* Endereço do Presidente separado */}
                <FormField
                  control={form.control}
                  name="presidente_endereco_logradouro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço Residencial (Logradouro)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Rua, Avenida, etc." 
                          {...field}
                          onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="presidente_endereco_numero"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Nº" 
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
                    name="presidente_endereco_bairro"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bairro</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Bairro" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
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

                  <FormField
                    control={form.control}
                    name="presidente_facebook"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Facebook</FormLabel>
                        <FormControl>
                          <Input placeholder="facebook.com/usuario" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
              <CardContent className="space-y-6">
                {/* Vice-Presidente */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Vice-Presidente</h4>
                  
                  <FormField
                    control={form.control}
                    name="vice_presidente_nome"
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
                      name="vice_presidente_data_nascimento"
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
                      name="vice_presidente_instagram"
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

                    <FormField
                      control={form.control}
                      name="vice_presidente_facebook"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Facebook</FormLabel>
                          <FormControl>
                            <Input placeholder="facebook.com/usuario" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Diretor Técnico */}
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Diretor Técnico (opcional)</h4>
                  
                  <FormField
                    control={form.control}
                    name="diretor_tecnico_nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo</FormLabel>
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
                      name="diretor_tecnico_data_nascimento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Nascimento</FormLabel>
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
                      name="diretor_tecnico_instagram"
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

                    <FormField
                      control={form.control}
                      name="diretor_tecnico_facebook"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Facebook</FormLabel>
                          <FormControl>
                            <Input placeholder="facebook.com/usuario" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
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
