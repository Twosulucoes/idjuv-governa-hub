/**
 * MÓDULO: COMPRAS
 * Formulário: Termo de Demanda
 * 
 * Formulário para formalização de demandas de aquisição de bens e serviços
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileText, Download, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { generateTermoDemanda, generateDocumentNumber } from '@/lib/pdfGenerator';

const termoDemandaSchema = z.object({
  solicitante: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cargo: z.string().min(2, 'Cargo é obrigatório'),
  setor: z.string().min(2, 'Setor é obrigatório'),
  objeto: z.string().min(10, 'Descrição do objeto deve ter no mínimo 10 caracteres'),
  justificativa: z.string().min(20, 'Justificativa deve ter no mínimo 20 caracteres'),
  quantidade: z.string().min(1, 'Quantidade é obrigatória'),
  valorEstimado: z.string().min(1, 'Valor estimado é obrigatório'),
  prazoEntrega: z.string().min(1, 'Prazo de entrega é obrigatório'),
  prioridade: z.string().min(1, 'Prioridade é obrigatória'),
  observacoes: z.string().optional(),
});

type TermoDemandaFormData = z.infer<typeof termoDemandaSchema>;

const TermoDemandaPage = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [documentoGerado, setDocumentoGerado] = useState<string | null>(null);

  const form = useForm<TermoDemandaFormData>({
    resolver: zodResolver(termoDemandaSchema),
    defaultValues: {
      solicitante: '',
      cargo: '',
      setor: '',
      objeto: '',
      justificativa: '',
      quantidade: '',
      valorEstimado: '',
      prazoEntrega: '',
      prioridade: '',
      observacoes: '',
    },
  });

  const onSubmit = async (data: TermoDemandaFormData) => {
    setIsGenerating(true);
    
    try {
      const numero = generateDocumentNumber('TD');
      
      generateTermoDemanda({
        solicitante: data.solicitante,
        cargo: data.cargo,
        setor: data.setor,
        objeto: data.objeto,
        justificativa: data.justificativa,
        quantidade: data.quantidade,
        valorEstimado: data.valorEstimado,
        prazoEntrega: data.prazoEntrega,
        prioridade: data.prioridade,
        observacoes: data.observacoes || '',
      }, numero);
      
      setDocumentoGerado(numero);
      toast.success('Termo de Demanda gerado com sucesso!', {
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

  const setores = [
    'Presidência',
    'DIRAF - Diretoria Administrativa e Financeira',
    'DIGEP - Diretoria de Gestão de Políticas',
    'DIJEL - Diretoria de Juventude, Esporte e Lazer',
    'Assessoria Jurídica',
    'Controle Interno',
  ];

  const prioridades = [
    { value: 'baixa', label: 'Baixa - Pode aguardar' },
    { value: 'normal', label: 'Normal - Prazo regular' },
    { value: 'alta', label: 'Alta - Urgente' },
    { value: 'critica', label: 'Crítica - Imediato' },
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <Link to="/processos/compras" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
          <ArrowLeft className="h-4 w-4" />
          Voltar para Compras e Contratos
        </Link>

        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader className="bg-primary/5 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Termo de Demanda</CardTitle>
                  <CardDescription>
                    Formulário para formalização de demandas de aquisição de bens e serviços
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Seção 1: Identificação */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                      1. Identificação do Solicitante
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="solicitante"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome do servidor" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="cargo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cargo *</FormLabel>
                            <FormControl>
                              <Input placeholder="Cargo do servidor" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="setor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Setor *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o setor" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {setores.map((setor) => (
                                <SelectItem key={setor} value={setor}>
                                  {setor}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Seção 2: Descrição da Demanda */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                      2. Descrição da Demanda
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="objeto"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Objeto da Demanda *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descreva detalhadamente o bem ou serviço solicitado"
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="justificativa"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Justificativa *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Justifique a necessidade da aquisição, demonstrando sua importância para as atividades do setor"
                              className="min-h-[120px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Seção 3: Especificações */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                      3. Especificações
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="quantidade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantidade *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 10 unidades" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="valorEstimado"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor Estimado (R$) *</FormLabel>
                            <FormControl>
                              <Input placeholder="0,00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="prazoEntrega"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prazo de Entrega Desejado *</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 30 dias" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="prioridade"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prioridade *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a prioridade" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {prioridades.map((p) => (
                                  <SelectItem key={p.value} value={p.value}>
                                    {p.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  {/* Seção 4: Observações */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                      4. Observações Adicionais
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
                      {isGenerating ? 'Gerando PDF...' : 'Gerar Termo de Demanda (PDF)'}
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
                        <strong>Documento gerado:</strong> Termo de Demanda nº {documentoGerado}
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

export default TermoDemandaPage;
