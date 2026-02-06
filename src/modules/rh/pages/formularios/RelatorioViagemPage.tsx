/**
 * MÓDULO: RH
 * Formulário: Relatório de Viagem
 * 
 * Prestação de contas de viagem a serviço
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FileCheck, Download, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { generateRelatorioViagem, generateDocumentNumber } from '@/lib/pdfGenerator';

const relatorioViagemSchema = z.object({
  servidor: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cargo: z.string().min(2, 'Cargo é obrigatório'),
  matricula: z.string().min(1, 'Matrícula é obrigatória'),
  destino: z.string().min(2, 'Destino é obrigatório'),
  objetivoOriginal: z.string().min(10, 'Objetivo deve ter no mínimo 10 caracteres'),
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  dataFim: z.string().min(1, 'Data de fim é obrigatória'),
  atividadesRealizadas: z.string().min(20, 'Descreva as atividades realizadas (mínimo 20 caracteres)'),
  resultadosObtidos: z.string().min(10, 'Descreva os resultados obtidos'),
  despesasRealizadas: z.string().min(5, 'Informe as despesas realizadas'),
  observacoes: z.string().optional(),
});

type RelatorioViagemFormData = z.infer<typeof relatorioViagemSchema>;

const RelatorioViagemPage = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [documentoGerado, setDocumentoGerado] = useState<string | null>(null);

  const form = useForm<RelatorioViagemFormData>({
    resolver: zodResolver(relatorioViagemSchema),
    defaultValues: {
      servidor: '',
      cargo: '',
      matricula: '',
      destino: '',
      objetivoOriginal: '',
      dataInicio: '',
      dataFim: '',
      atividadesRealizadas: '',
      resultadosObtidos: '',
      despesasRealizadas: '',
      observacoes: '',
    },
  });

  const onSubmit = async (data: RelatorioViagemFormData) => {
    setIsGenerating(true);
    
    try {
      const numero = generateDocumentNumber('RV');
      
      generateRelatorioViagem({
        servidor: data.servidor,
        cargo: data.cargo,
        matricula: data.matricula,
        destino: data.destino,
        objetivoOriginal: data.objetivoOriginal,
        dataInicio: data.dataInicio,
        dataFim: data.dataFim,
        atividadesRealizadas: data.atividadesRealizadas,
        resultadosObtidos: data.resultadosObtidos,
        despesasRealizadas: data.despesasRealizadas,
        observacoes: data.observacoes || '',
      }, numero);
      
      setDocumentoGerado(numero);
      toast.success('Relatório de Viagem gerado com sucesso!', {
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

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <Link to="/rh/viagens" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
          <ArrowLeft className="h-4 w-4" />
          Voltar para Viagens
        </Link>

        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader className="bg-primary/5 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <FileCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Relatório de Viagem</CardTitle>
                  <CardDescription>
                    Prestação de contas de viagem a serviço - Art. 11 e 12 da IN de Diárias
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-amber-800 text-sm">
                  <strong>Atenção:</strong> Este relatório deve ser apresentado no prazo máximo de 05 (cinco) dias úteis após o retorno da viagem, conforme Art. 11 da IN de Diárias.
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                              <Input placeholder="Nome do servidor" {...field} />
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
                            <Input placeholder="Cargo ou função do servidor" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                      2. Dados da Viagem
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="destino"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Destino *</FormLabel>
                          <FormControl>
                            <Input placeholder="Cidade/Estado de destino" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                      name="objetivoOriginal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Objetivo Original da Missão *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descreva o objetivo original da viagem conforme Ordem de Missão"
                              className="min-h-[80px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                      3. Relatório Sucinto da Missão
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="atividadesRealizadas"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Atividades Realizadas *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descreva detalhadamente as atividades desenvolvidas durante a viagem"
                              className="min-h-[120px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="resultadosObtidos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Resultados Obtidos *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descreva os resultados alcançados com a viagem"
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                      4. Despesas Realizadas
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="despesasRealizadas"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição das Despesas *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Liste as despesas realizadas (hospedagem, alimentação, transporte local, etc.)"
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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

                  <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={isGenerating}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isGenerating ? 'Gerando PDF...' : 'Gerar Relatório de Viagem (PDF)'}
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
                        <strong>Documento gerado:</strong> Relatório de Viagem nº {documentoGerado}
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

export default RelatorioViagemPage;
