import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package, Download, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { generateRequisicaoMaterial, generateDocumentNumber } from '@/lib/pdfGenerator';

const requisicaoMaterialSchema = z.object({
  solicitante: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  cargo: z.string().min(2, 'Cargo é obrigatório'),
  setor: z.string().min(2, 'Setor é obrigatório'),
  itens: z.string().min(10, 'Liste os materiais solicitados (mínimo 10 caracteres)'),
  justificativa: z.string().min(20, 'Justificativa deve ter no mínimo 20 caracteres'),
  urgencia: z.string().min(1, 'Selecione o nível de urgência'),
  observacoes: z.string().optional(),
});

type RequisicaoMaterialFormData = z.infer<typeof requisicaoMaterialSchema>;

const RequisicaoMaterialPage = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [documentoGerado, setDocumentoGerado] = useState<string | null>(null);

  const form = useForm<RequisicaoMaterialFormData>({
    resolver: zodResolver(requisicaoMaterialSchema),
    defaultValues: {
      solicitante: '',
      cargo: '',
      setor: '',
      itens: '',
      justificativa: '',
      urgencia: '',
      observacoes: '',
    },
  });

  const onSubmit = async (data: RequisicaoMaterialFormData) => {
    setIsGenerating(true);
    
    try {
      const numero = generateDocumentNumber('RM');
      
      generateRequisicaoMaterial({
        solicitante: data.solicitante,
        cargo: data.cargo,
        setor: data.setor,
        itens: data.itens,
        justificativa: data.justificativa,
        urgencia: data.urgencia,
        observacoes: data.observacoes || '',
      }, numero);
      
      setDocumentoGerado(numero);
      toast.success('Requisição de Material gerada com sucesso!', {
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
    'Almoxarifado',
  ];

  const urgencias = [
    { value: 'normal', label: 'Normal - Prazo regular' },
    { value: 'urgente', label: 'Urgente - Necessidade imediata' },
    { value: 'programada', label: 'Programada - Para estoque' },
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <Link to="/processos/almoxarifado" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
          <ArrowLeft className="h-4 w-4" />
          Voltar para Almoxarifado
        </Link>

        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader className="bg-primary/5 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Requisição de Material</CardTitle>
                  <CardDescription>
                    Solicitação formal de materiais de consumo - Art. 7 da IN de Almoxarifado
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="bg-info/10 border border-info/30 rounded-lg p-4 mb-6">
                <p className="text-info text-sm">
                  <strong>Base Legal:</strong> A saída de material dependerá de requisição formal, devidamente autorizada pela chefia da unidade solicitante (Art. 7º da IN de Almoxarifado).
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                          <FormLabel>Setor Requisitante *</FormLabel>
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

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                      2. Materiais Solicitados
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="itens"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lista de Materiais *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Liste os materiais solicitados com quantidade. Ex:&#10;- 10 resmas de papel A4&#10;- 5 canetas esferográficas azul&#10;- 2 caixas de clips"
                              className="min-h-[150px]"
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
                      3. Justificativa e Urgência
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="justificativa"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Justificativa *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Justifique a necessidade dos materiais solicitados"
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
                      name="urgencia"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nível de Urgência *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a urgência" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {urgencias.map((u) => (
                                <SelectItem key={u.value} value={u.value}>
                                  {u.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

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

                  <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={isGenerating}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isGenerating ? 'Gerando PDF...' : 'Gerar Requisição de Material (PDF)'}
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
                        <strong>Documento gerado:</strong> Requisição de Material nº {documentoGerado}
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

export default RequisicaoMaterialPage;
