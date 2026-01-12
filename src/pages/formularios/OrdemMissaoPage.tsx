import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plane, Download, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { generateOrdemMissao, generateDocumentNumber } from '@/lib/pdfGenerator';
import { toUpperCase } from '@/lib/formatters';

const ordemMissaoSchema = z.object({
  servidor: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cargo: z.string().min(2, 'Cargo é obrigatório'),
  matricula: z.string().min(1, 'Matrícula é obrigatória'),
  destino: z.string().min(2, 'Destino é obrigatório'),
  objetivo: z.string().min(10, 'Objetivo deve ter no mínimo 10 caracteres'),
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  dataFim: z.string().min(1, 'Data de fim é obrigatória'),
  meioTransporte: z.string().min(1, 'Meio de transporte é obrigatório'),
  diarias: z.string().min(1, 'Quantidade de diárias é obrigatória'),
  valorDiarias: z.string().min(1, 'Valor das diárias é obrigatório'),
  observacoes: z.string().optional(),
});

type OrdemMissaoFormData = z.infer<typeof ordemMissaoSchema>;

const OrdemMissaoPage = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [documentoGerado, setDocumentoGerado] = useState<string | null>(null);

  const form = useForm<OrdemMissaoFormData>({
    resolver: zodResolver(ordemMissaoSchema),
    defaultValues: {
      servidor: '',
      cargo: '',
      matricula: '',
      destino: '',
      objetivo: '',
      dataInicio: '',
      dataFim: '',
      meioTransporte: '',
      diarias: '',
      valorDiarias: '',
      observacoes: '',
    },
  });

  const onSubmit = async (data: OrdemMissaoFormData) => {
    setIsGenerating(true);
    
    try {
      const numero = generateDocumentNumber('OM');
      
      generateOrdemMissao({
        servidor: data.servidor,
        cargo: data.cargo,
        matricula: data.matricula,
        destino: data.destino,
        objetivo: data.objetivo,
        dataInicio: data.dataInicio,
        dataFim: data.dataFim,
        meioTransporte: data.meioTransporte,
        diarias: data.diarias,
        valorDiarias: data.valorDiarias,
        observacoes: data.observacoes || '',
      }, numero);
      
      setDocumentoGerado(numero);
      toast.success('Ordem de Missão gerada com sucesso!', {
        description: `Documento nº ${numero} foi baixado.`,
      });
    } catch (error) {
      toast.error('Erro ao gerar documento', {
        description: 'Tente novamente em alguns instantes.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const meiosTransporte = [
    { value: 'aereo', label: 'Aéreo' },
    { value: 'terrestre_oficial', label: 'Veículo Oficial' },
    { value: 'terrestre_proprio', label: 'Veículo Próprio' },
    { value: 'terrestre_coletivo', label: 'Transporte Coletivo' },
    { value: 'fluvial', label: 'Fluvial' },
    { value: 'misto', label: 'Misto' },
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <Link to="/processos/diarias" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
          <ArrowLeft className="h-4 w-4" />
          Voltar para Diárias e Viagens
        </Link>

        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader className="bg-primary/5 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Plane className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Ordem de Missão</CardTitle>
                  <CardDescription>
                    Formulário para autorização de viagens a serviço e concessão de diárias
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Seção 1: Identificação do Servidor */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                      1. Identificação do Servidor
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="servidor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Nome do servidor" 
                                {...field} 
                                className="uppercase"
                                onChange={(e) => field.onChange(toUpperCase(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="matricula"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Matrícula *</FormLabel>
                            <FormControl>
                              <Input placeholder="Número da matrícula" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="cargo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cargo/Função *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Cargo ou função do servidor" 
                                {...field}
                                className="uppercase"
                                onChange={(e) => field.onChange(toUpperCase(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                    />
                  </div>

                  {/* Seção 2: Dados da Missão */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                      2. Dados da Missão
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="destino"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Destino *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Cidade/Estado de destino" 
                                {...field}
                                className="uppercase"
                                onChange={(e) => field.onChange(toUpperCase(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                    />

                    <FormField
                      control={form.control}
                      name="objetivo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Objetivo da Missão *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descreva detalhadamente o objetivo da viagem e as atividades a serem realizadas"
                              className="min-h-[120px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Seção 3: Período e Transporte */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                      3. Período e Transporte
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dataInicio"
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
                        name="dataFim"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Término *</FormLabel>
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
                      name="meioTransporte"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Meio de Transporte *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o meio de transporte" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {meiosTransporte.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Seção 4: Diárias */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                      4. Diárias
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="diarias"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantidade de Diárias *</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" step="0.5" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="valorDiarias"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor Total das Diárias (R$) *</FormLabel>
                            <FormControl>
                              <Input placeholder="0,00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Seção 5: Observações */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                      5. Observações Adicionais
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="observacoes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Informações complementares (opcional)"
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Botões */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={isGenerating}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isGenerating ? 'Gerando PDF...' : 'Gerar Ordem de Missão (PDF)'}
                    </Button>
                    
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => form.reset()}
                    >
                      Limpar Formulário
                    </Button>
                  </div>

                  {documentoGerado && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                      <p className="text-green-800 text-sm">
                        <strong>Documento gerado:</strong> Ordem de Missão nº {documentoGerado}
                      </p>
                      <p className="text-green-600 text-xs mt-1">
                        O arquivo PDF foi baixado automaticamente.
                      </p>
                    </div>
                  )}
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default OrdemMissaoPage;
