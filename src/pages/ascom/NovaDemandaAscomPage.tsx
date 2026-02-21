// ============================================
// PÁGINA DE NOVA DEMANDA ASCOM
// ============================================

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Upload, X, Send, Save } from 'lucide-react';

import { ModuleLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
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
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

import { useDemandasAscom } from '@/hooks/useDemandasAscom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  CategoriaDemandasAscom,
  TipoDemandaAscom,
  PrioridadeDemandaAscom,
  CATEGORIA_DEMANDA_LABELS,
  TIPO_DEMANDA_LABELS,
  PRIORIDADE_DEMANDA_LABELS,
  TIPOS_POR_CATEGORIA,
  TIPOS_REQUER_AUTORIZACAO
} from '@/types/ascom';
import { cn } from '@/lib/utils';

// Schema de validação
const demandaSchema = z.object({
  categoria: z.string().min(1, 'Selecione uma categoria'),
  tipo: z.string().min(1, 'Selecione um tipo'),
  titulo: z.string().min(5, 'Título deve ter no mínimo 5 caracteres').max(200, 'Título muito longo'),
  descricao_detalhada: z.string().min(20, 'Descrição deve ter no mínimo 20 caracteres').max(3000, 'Descrição muito longa'),
  objetivo_institucional: z.string().max(1000, 'Texto muito longo').optional(),
  publico_alvo: z.string().max(500, 'Texto muito longo').optional(),
  
  unidade_solicitante_id: z.string().optional(),
  nome_responsavel: z.string().min(3, 'Nome do responsável é obrigatório').max(150, 'Nome muito longo'),
  cargo_funcao: z.string().max(100, 'Texto muito longo').optional(),
  contato_telefone: z.string().max(20, 'Telefone inválido').optional(),
  contato_email: z.string().email('Email inválido').max(255).optional().or(z.literal('')),
  
  data_evento: z.date().optional(),
  hora_evento: z.string().max(5).optional(),
  local_evento: z.string().max(300, 'Local muito longo').optional(),
  prazo_entrega: z.date({ required_error: 'Prazo de entrega é obrigatório' }),
  
  prioridade: z.string().default('normal')
});

type DemandaFormData = z.infer<typeof demandaSchema>;

export default function NovaDemandaAscomPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { criarDemanda, alterarStatus, uploadAnexo } = useDemandasAscom();
  
  const [unidades, setUnidades] = useState<Array<{ id: string; nome: string; sigla: string }>>([]);
  const [tiposDisponiveis, setTiposDisponiveis] = useState<TipoDemandaAscom[]>([]);
  const [arquivosParaUpload, setArquivosParaUpload] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requerAutorizacao, setRequerAutorizacao] = useState(false);
  const [servidorLogado, setServidorLogado] = useState<{
    id: string;
    nome: string;
    cargo_nome: string;
    telefone: string;
    email: string;
    unidade_id: string;
  } | null>(null);

  const form = useForm<DemandaFormData>({
    resolver: zodResolver(demandaSchema),
    defaultValues: {
      prioridade: 'normal',
      nome_responsavel: '',
      titulo: '',
      descricao_detalhada: ''
    }
  });

  const categoriaWatch = form.watch('categoria');
  const tipoWatch = form.watch('tipo');

  // Carregar dados do servidor logado
  useEffect(() => {
    const fetchServidorLogado = async () => {
      if (!user?.id) return;
      
      const { data: servidor } = await supabase
        .from('servidores')
        .select(`
          id,
          nome_completo,
          telefone_celular,
          email_institucional,
          unidade_atual_id,
          cargo_atual_id,
          cargos:cargo_atual_id (nome)
        `)
        .eq('user_id', user.id)
        .single();
      
      if (servidor) {
        const cargoNome = (servidor.cargos as { nome: string } | null)?.nome || '';
        setServidorLogado({
          id: servidor.id,
          nome: servidor.nome_completo,
          cargo_nome: cargoNome,
          telefone: servidor.telefone_celular || '',
          email: servidor.email_institucional || '',
          unidade_id: servidor.unidade_atual_id || ''
        });
        
        // Preencher formulário com dados do servidor
        form.setValue('nome_responsavel', servidor.nome_completo);
        form.setValue('cargo_funcao', cargoNome);
        form.setValue('contato_telefone', servidor.telefone_celular || '');
        form.setValue('contato_email', servidor.email_institucional || '');
        if (servidor.unidade_atual_id) {
          form.setValue('unidade_solicitante_id', servidor.unidade_atual_id);
        }
      }
    };
    fetchServidorLogado();
  }, [user?.id, form]);

  // Carregar unidades
  useEffect(() => {
    const fetchUnidades = async () => {
      const { data } = await supabase
        .from('estrutura_organizacional')
        .select('id, nome, sigla')
        .order('nome');
      
      if (data) setUnidades(data);
    };
    fetchUnidades();
  }, []);

  // Atualizar tipos disponíveis quando categoria muda
  useEffect(() => {
    if (categoriaWatch) {
      const tipos = TIPOS_POR_CATEGORIA[categoriaWatch as CategoriaDemandasAscom] || [];
      setTiposDisponiveis(tipos);
      form.setValue('tipo', '');
    }
  }, [categoriaWatch, form]);

  // Verificar se tipo requer autorização
  useEffect(() => {
    if (tipoWatch) {
      setRequerAutorizacao(TIPOS_REQUER_AUTORIZACAO.includes(tipoWatch as TipoDemandaAscom));
    }
  }, [tipoWatch]);

  // Lidar com upload de arquivos
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const novosArquivos = Array.from(e.target.files);
      const validFiles = novosArquivos.filter(f => f.size <= 10 * 1024 * 1024); // 10MB max
      if (validFiles.length !== novosArquivos.length) {
        toast.warning('Alguns arquivos excederam o limite de 10MB e foram ignorados');
      }
      setArquivosParaUpload(prev => [...prev, ...validFiles]);
    }
    e.target.value = '';
  };

  const removeFile = (index: number) => {
    setArquivosParaUpload(prev => prev.filter((_, i) => i !== index));
  };

  // Submeter formulário
  const onSubmit = async (data: DemandaFormData, enviar: boolean = false) => {
    setIsSubmitting(true);
    try {
      const demanda = await criarDemanda({
        categoria: data.categoria as CategoriaDemandasAscom,
        tipo: data.tipo as TipoDemandaAscom,
        titulo: data.titulo.trim(),
        descricao_detalhada: data.descricao_detalhada.trim(),
        objetivo_institucional: data.objetivo_institucional?.trim() || undefined,
        publico_alvo: data.publico_alvo?.trim() || undefined,
        unidade_solicitante_id: data.unidade_solicitante_id || undefined,
        servidor_solicitante_id: servidorLogado?.id || undefined,
        nome_responsavel: data.nome_responsavel.trim(),
        cargo_funcao: data.cargo_funcao?.trim() || undefined,
        contato_telefone: data.contato_telefone?.trim() || undefined,
        contato_email: data.contato_email?.trim() || undefined,
        data_evento: data.data_evento?.toISOString().split('T')[0],
        hora_evento: data.hora_evento?.trim() || undefined,
        local_evento: data.local_evento?.trim() || undefined,
        prazo_entrega: data.prazo_entrega.toISOString().split('T')[0],
        prioridade: data.prioridade as PrioridadeDemandaAscom,
        requer_autorizacao_presidencia: requerAutorizacao,
        status: 'rascunho'
      });

      if (!demanda) {
        throw new Error('Falha ao criar demanda');
      }

      // Upload de arquivos
      for (const arquivo of arquivosParaUpload) {
        await uploadAnexo(demanda.id, arquivo, 'solicitacao');
      }

      // Se deve enviar, alterar status
      if (enviar) {
        await alterarStatus(demanda.id, 'enviada');
        toast.success('Demanda enviada com sucesso!');
      } else {
        toast.success('Rascunho salvo com sucesso!');
      }

      navigate(`/ascom/demandas/${demanda.id}`);
    } catch (error) {
      console.error('Erro ao criar demanda:', error);
      toast.error('Erro ao criar demanda');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModuleLayout module="comunicacao">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Nova Demanda ASCOM</h1>
          <p className="text-muted-foreground">
            Preencha os dados da solicitação de comunicação institucional
          </p>
        </div>

        <Form {...form}>
          <form className="space-y-6">
            {/* Classificação */}
            <Card>
              <CardHeader>
                <CardTitle>Classificação da Demanda</CardTitle>
                <CardDescription>
                  Selecione a categoria e o tipo de solicitação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="categoria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(CATEGORIA_DEMANDA_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Demanda *</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value}
                          disabled={!categoriaWatch}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tiposDisponiveis.map((tipo) => (
                              <SelectItem key={tipo} value={tipo}>
                                {TIPO_DEMANDA_LABELS[tipo]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {requerAutorizacao && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-800 flex items-center gap-2">
                      <Badge variant="outline" className="bg-orange-100">
                        Atenção
                      </Badge>
                      Este tipo de demanda requer autorização da Presidência antes da execução.
                    </p>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="prioridade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-[200px]">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(PRIORIDADE_DEMANDA_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Detalhamento */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhamento da Demanda</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título *</FormLabel>
                      <FormControl>
                        <Input placeholder="Título da demanda" maxLength={200} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descricao_detalhada"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição Detalhada *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Descreva detalhadamente o que precisa ser feito..."
                          className="min-h-[120px]"
                          maxLength={3000}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Seja o mais específico possível sobre a demanda
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="objetivo_institucional"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Objetivo Institucional</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Qual o objetivo desta comunicação?"
                            className="min-h-[80px]"
                            maxLength={1000}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="publico_alvo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Público-Alvo</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Quem é o público-alvo desta comunicação?"
                            className="min-h-[80px]"
                            maxLength={500}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Solicitante */}
            <Card>
              <CardHeader>
                <CardTitle>Identificação do Solicitante</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="unidade_solicitante_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unidade Solicitante</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a unidade" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {unidades.map((unidade) => (
                            <SelectItem key={unidade.id} value={unidade.id}>
                              {unidade.sigla} - {unidade.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nome_responsavel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome do Responsável *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome completo" maxLength={150} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cargo_funcao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cargo/Função</FormLabel>
                        <FormControl>
                          <Input placeholder="Cargo ou função" maxLength={100} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contato_telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone</FormLabel>
                        <FormControl>
                          <Input placeholder="(99) 99999-9999" maxLength={20} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contato_email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="email@exemplo.com" maxLength={255} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Datas e Prazos */}
            <Card>
              <CardHeader>
                <CardTitle>Datas e Prazos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="data_evento"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Data do Evento</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy")
                                ) : (
                                  <span>Selecione</span>
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
                              disabled={(date) => date < new Date()}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormDescription>Se aplicável</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hora_evento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horário do Evento</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="prazo_entrega"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Prazo de Entrega *</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "dd/MM/yyyy")
                                ) : (
                                  <span>Selecione</span>
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
                              disabled={(date) => date < new Date()}
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
                  name="local_evento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local do Evento</FormLabel>
                      <FormControl>
                        <Input placeholder="Endereço ou local do evento" maxLength={300} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Anexos */}
            <Card>
              <CardHeader>
                <CardTitle>Anexos</CardTitle>
                <CardDescription>
                  Anexe programação, texto base, referências visuais ou outros documentos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    id="file-upload"
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.mp4,.mov"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center gap-2"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Clique para selecionar arquivos ou arraste-os aqui
                    </span>
                    <span className="text-xs text-muted-foreground">
                      PDF, DOC, DOCX, Imagens, Vídeos
                    </span>
                  </label>
                </div>

                {arquivosParaUpload.length > 0 && (
                  <div className="space-y-2">
                    {arquivosParaUpload.map((arquivo, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-2 bg-muted rounded"
                      >
                        <span className="text-sm truncate">{arquivo.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ações */}
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/ascom/demandas')}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={form.handleSubmit((data) => onSubmit(data, false))}
                disabled={isSubmitting}
              >
                <Save className="h-4 w-4 mr-2" />
                Salvar Rascunho
              </Button>
              <Button
                type="button"
                onClick={form.handleSubmit((data) => onSubmit(data, true))}
                disabled={isSubmitting}
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Demanda
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </ModuleLayout>
  );
}
