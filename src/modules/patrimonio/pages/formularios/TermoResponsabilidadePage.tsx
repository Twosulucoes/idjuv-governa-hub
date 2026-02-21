/**
 * MÓDULO: PATRIMÔNIO
 * Formulário: Termo de Responsabilidade Patrimonial
 * 
 * Formalização de guarda e responsabilidade sobre bens
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ClipboardCheck, Download, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'sonner';
import { generateTermoResponsabilidade, generateDocumentNumber } from '@/lib/pdfGenerator';

const termoResponsabilidadeSchema = z.object({
  servidor: z.string().trim().min(3, 'Nome deve ter no mínimo 3 caracteres').max(150, 'Máximo 150 caracteres'),
  cargo: z.string().trim().min(2, 'Cargo é obrigatório').max(100, 'Máximo 100 caracteres'),
  matricula: z.string().trim().min(1, 'Matrícula é obrigatória').max(30, 'Máximo 30 caracteres'),
  setor: z.string().min(2, 'Setor é obrigatório'),
  bens: z.string().trim().min(10, 'Liste os bens (mínimo 10 caracteres)').max(3000, 'Máximo 3000 caracteres'),
  localUtilizacao: z.string().trim().min(3, 'Local de utilização é obrigatório').max(200, 'Máximo 200 caracteres'),
  observacoes: z.string().trim().max(1000, 'Máximo 1000 caracteres').optional(),
});

type TermoResponsabilidadeFormData = z.infer<typeof termoResponsabilidadeSchema>;

const TermoResponsabilidadePage = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [documentoGerado, setDocumentoGerado] = useState<string | null>(null);

  const form = useForm<TermoResponsabilidadeFormData>({
    resolver: zodResolver(termoResponsabilidadeSchema),
    defaultValues: {
      servidor: '',
      cargo: '',
      matricula: '',
      setor: '',
      bens: '',
      localUtilizacao: '',
      observacoes: '',
    },
  });

  const onSubmit = async (data: TermoResponsabilidadeFormData) => {
    setIsGenerating(true);
    
    try {
      const numero = generateDocumentNumber('TR');
      
      generateTermoResponsabilidade({
        servidor: data.servidor,
        cargo: data.cargo,
        matricula: data.matricula,
        setor: data.setor,
        bens: data.bens,
        localUtilizacao: data.localUtilizacao,
        observacoes: data.observacoes || '',
      }, numero);
      
      setDocumentoGerado(numero);
      toast.success('Termo de Responsabilidade gerado com sucesso!', {
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
    'Patrimônio',
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <Link to="/inventario" className="inline-flex items-center gap-2 text-primary hover:underline mb-6">
          <ArrowLeft className="h-4 w-4" />
          Voltar para Patrimônio
        </Link>

        <div className="max-w-3xl mx-auto">
          <Card>
            <CardHeader className="bg-primary/5 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <ClipboardCheck className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle>Termo de Responsabilidade Patrimonial</CardTitle>
                  <CardDescription>
                    Formalização de guarda e responsabilidade sobre bens - Art. 7 da IN de Patrimônio
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm">
                  <strong>Atenção:</strong> O servidor que causar dano, extravio ou uso indevido de bem público responderá administrativa, civil e penalmente, conforme Art. 20 da IN de Patrimônio.
                </p>
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                      1. Identificação do Responsável
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="servidor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome Completo *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome do servidor" maxLength={150} {...field} />
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
                              <Input placeholder="Número da matrícula" maxLength={30} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="cargo"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cargo/Função *</FormLabel>
                            <FormControl>
                              <Input placeholder="Cargo ou função" maxLength={100} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

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
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                      2. Bens sob Responsabilidade
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="bens"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lista de Bens *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Liste os bens com número de tombamento, descrição e valor. Ex:&#10;- Tombamento 12345 - Notebook Dell Latitude - R$ 5.000,00&#10;- Tombamento 12346 - Monitor LG 24' - R$ 800,00&#10;- Tombamento 12347 - Cadeira Giratória - R$ 450,00"
                              className="min-h-[150px]"
                              maxLength={3000}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="localUtilizacao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Local de Utilização *</FormLabel>
                          <FormControl>
                            <Input placeholder="Sala, andar, prédio onde os bens serão utilizados" maxLength={200} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                      3. Observações
                    </h3>
                    
                    <FormField
                      control={form.control}
                      name="observacoes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Estado de conservação, defeitos observados, ou outras informações relevantes (opcional)"
                              className="min-h-[80px]"
                              maxLength={1000}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="bg-muted border border-border rounded-lg p-4">
                    <h4 className="font-semibold text-sm mb-2 text-foreground">Declaração de Responsabilidade</h4>
                    <p className="text-sm text-muted-foreground">
                      Ao gerar este termo, declaro ter recebido os bens acima descritos, comprometendo-me a zelar pela sua guarda, conservação e uso adequado, nos termos da IN de Patrimônio do IDJUV. Estou ciente de que responderei administrativa, civil e penalmente por dano, extravio ou uso indevido.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
                    <Button 
                      type="submit" 
                      className="flex-1"
                      disabled={isGenerating}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {isGenerating ? 'Gerando PDF...' : 'Gerar Termo de Responsabilidade (PDF)'}
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
                        <strong>Documento gerado:</strong> Termo de Responsabilidade nº {documentoGerado}
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

export default TermoResponsabilidadePage;
