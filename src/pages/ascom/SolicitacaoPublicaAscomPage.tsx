// ============================================
// PÁGINA PÚBLICA DE SOLICITAÇÃO ASCOM
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  FileText, 
  Send, 
  Upload, 
  X, 
  Building2, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  MapPin,
  AlertCircle,
  CheckCircle2,
  Megaphone,
  Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { LogoIdjuv } from '@/components/ui/LogoIdjuv';

import {
  CategoriaDemandasAscom,
  TipoDemandaAscom,
  CATEGORIA_DEMANDA_LABELS,
  TIPO_DEMANDA_LABELS,
  TIPOS_POR_CATEGORIA,
  TIPOS_REQUER_AUTORIZACAO,
  PrioridadeDemandaAscom,
  PRIORIDADE_DEMANDA_LABELS
} from '@/types/ascom';

// Schema de validação
const solicitacaoSchema = z.object({
  nome_responsavel: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100),
  cargo_funcao: z.string().optional(),
  setor_departamento: z.string().min(2, 'Informe o setor/departamento').max(100),
  contato_telefone: z.string().min(10, 'Telefone inválido').max(20),
  contato_email: z.string().email('Email inválido').max(255),
  categoria: z.string().min(1, 'Selecione uma categoria'),
  tipo: z.string().min(1, 'Selecione o tipo de demanda'),
  titulo: z.string().min(5, 'Título deve ter pelo menos 5 caracteres').max(200),
  descricao_detalhada: z.string().min(20, 'Descrição deve ter pelo menos 20 caracteres').max(2000),
  objetivo_institucional: z.string().optional(),
  publico_alvo: z.string().optional(),
  data_evento: z.string().optional(),
  hora_evento: z.string().optional(),
  local_evento: z.string().optional(),
  prazo_entrega: z.string().min(1, 'Informe o prazo desejado'),
  prioridade: z.string().default('normal')
});

type SolicitacaoFormData = z.infer<typeof solicitacaoSchema>;

export default function SolicitacaoPublicaAscomPage() {
  const navigate = useNavigate();
  const [arquivosParaUpload, setArquivosParaUpload] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requerAutorizacao, setRequerAutorizacao] = useState(false);
  const [protocoloGerado, setProtocoloGerado] = useState<string | null>(null);
  const [isLoadingServidor, setIsLoadingServidor] = useState(true);
  const [servidorLogado, setServidorLogado] = useState<{
    id: string;
    nome: string;
    cargo_nome: string;
    telefone: string;
    email: string;
    unidade_nome: string;
  } | null>(null);

  const form = useForm<SolicitacaoFormData>({
    resolver: zodResolver(solicitacaoSchema),
    defaultValues: {
      prioridade: 'normal',
      categoria: '',
      tipo: '',
      nome_responsavel: '',
      cargo_funcao: '',
      setor_departamento: '',
      contato_telefone: '',
      contato_email: ''
    }
  });

  const categoriaWatch = form.watch('categoria');
  const tipoWatch = form.watch('tipo');

  // Carregar dados do servidor logado (se estiver autenticado)
  useEffect(() => {
    const fetchServidorLogado = async () => {
      setIsLoadingServidor(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user?.id) {
          setIsLoadingServidor(false);
          return;
        }
        
        const { data: servidor } = await supabase
          .from('servidores')
          .select(`
            id,
            nome_completo,
            telefone_celular,
            email_institucional,
            unidade_atual_id,
            cargo_atual_id,
            cargos:cargo_atual_id (nome),
            unidade:unidade_atual_id (nome, sigla)
          `)
          .eq('user_id', user.id)
          .single();
        
        if (servidor) {
          const cargoNome = (servidor.cargos as { nome: string } | null)?.nome || '';
          const unidadeNome = servidor.unidade 
            ? `${(servidor.unidade as { sigla: string; nome: string }).sigla} - ${(servidor.unidade as { sigla: string; nome: string }).nome}`
            : '';
          
          setServidorLogado({
            id: servidor.id,
            nome: servidor.nome_completo,
            cargo_nome: cargoNome,
            telefone: servidor.telefone_celular || '',
            email: servidor.email_institucional || '',
            unidade_nome: unidadeNome
          });
          
          // Preencher formulário com dados do servidor
          form.setValue('nome_responsavel', servidor.nome_completo);
          form.setValue('cargo_funcao', cargoNome);
          form.setValue('setor_departamento', unidadeNome);
          form.setValue('contato_telefone', servidor.telefone_celular || '');
          form.setValue('contato_email', servidor.email_institucional || '');
        }
      } catch (error) {
        console.error('Erro ao buscar dados do servidor:', error);
      } finally {
        setIsLoadingServidor(false);
      }
    };
    
    fetchServidorLogado();
  }, [form]);

  // Verificar se requer autorização
  useEffect(() => {
    if (tipoWatch) {
      setRequerAutorizacao(TIPOS_REQUER_AUTORIZACAO.includes(tipoWatch as TipoDemandaAscom));
    }
  }, [tipoWatch]);

  // Resetar tipo quando categoria muda
  useEffect(() => {
    if (categoriaWatch) {
      form.setValue('tipo', '');
    }
  }, [categoriaWatch, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = Array.from(files);
      const validFiles = newFiles.filter(f => f.size <= 10 * 1024 * 1024); // 10MB max
      if (validFiles.length !== newFiles.length) {
        toast.warning('Alguns arquivos excederam o limite de 10MB');
      }
      setArquivosParaUpload(prev => [...prev, ...validFiles]);
    }
    e.target.value = '';
  };

  const removerArquivo = (index: number) => {
    setArquivosParaUpload(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (dados: SolicitacaoFormData) => {
    setIsSubmitting(true);
    try {
      // Criar demanda
      const { data: demanda, error: demandaError } = await (supabase as any)
        .from('demandas_ascom')
        .insert({
          nome_responsavel: dados.nome_responsavel.trim(),
          cargo_funcao: dados.cargo_funcao?.trim() || null,
          contato_telefone: dados.contato_telefone.trim(),
          contato_email: dados.contato_email.trim(),
          email_solicitante: dados.contato_email.trim(),
          telefone_solicitante: dados.contato_telefone.trim(),
          categoria: dados.categoria,
          tipo: dados.tipo,
          titulo: dados.titulo.trim(),
          descricao_detalhada: dados.descricao_detalhada.trim(),
          objetivo_institucional: dados.objetivo_institucional?.trim() || null,
          publico_alvo: dados.publico_alvo?.trim() || null,
          data_evento: dados.data_evento || null,
          hora_evento: dados.hora_evento?.trim() || null,
          local_evento: dados.local_evento?.trim() || null,
          prazo_entrega: dados.prazo_entrega,
          prioridade: dados.prioridade,
          requer_autorizacao_presidencia: requerAutorizacao,
          servidor_solicitante_id: servidorLogado?.id || null,
          status: 'enviada'
        })
        .select('id, numero_demanda')
        .single();

      if (demandaError) throw demandaError;

      // Upload de anexos
      for (const file of arquivosParaUpload) {
        const fileName = `${demanda.id}/${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('ascom-demandas')
          .upload(fileName, file);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('ascom-demandas')
            .getPublicUrl(fileName);

          await (supabase as any)
            .from('demandas_ascom_anexos')
            .insert({
              demanda_id: demanda.id,
              tipo_anexo: 'solicitacao',
              nome_arquivo: file.name,
              url_arquivo: urlData.publicUrl,
              tipo_mime: file.type,
              tamanho_bytes: file.size
            });
        }
      }

      setProtocoloGerado(demanda.numero_demanda);
      toast.success('Solicitação enviada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao enviar solicitação:', error);
      toast.error('Erro ao enviar solicitação. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tela de sucesso
  if (protocoloGerado) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 w-fit">
              <CheckCircle2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
            </div>
            <CardTitle className="text-2xl text-emerald-700 dark:text-emerald-400">
              Solicitação Enviada!
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Sua demanda foi registrada com sucesso na ASCOM do IDJuv
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Número do Protocolo</p>
              <p className="text-3xl font-bold text-primary">{protocoloGerado}</p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Guarde este número!</AlertTitle>
              <AlertDescription>
                Use o protocolo acima para acompanhar o andamento da sua solicitação.
              </AlertDescription>
            </Alert>

            <div className="flex flex-col gap-3">
              <Button 
                variant="default" 
                className="w-full"
                onClick={() => navigate(`/ascom/consultar?protocolo=${protocoloGerado}`)}
              >
                Consultar Andamento
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setProtocoloGerado(null);
                  form.reset();
                  setArquivosParaUpload([]);
                }}
              >
                Nova Solicitação
              </Button>
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => navigate('/')}
              >
                Voltar ao Site
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <header className="bg-background border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoIdjuv className="h-10 w-auto" />
            <div>
              <h1 className="font-semibold text-lg">IDJuv - ASCOM</h1>
              <p className="text-sm text-muted-foreground">Assessoria de Comunicação</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/ascom/consultar')}>
            Consultar Protocolo
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-4">
            <Megaphone className="h-5 w-5" />
            <span className="font-medium">Solicitação de Demanda</span>
          </div>
          <h2 className="text-3xl font-bold mb-2">Solicitar Serviço da ASCOM</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Preencha o formulário abaixo para solicitar cobertura de eventos, criação de materiais, 
            conteúdo institucional ou outros serviços da Assessoria de Comunicação.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Dados do Solicitante */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Dados do Solicitante
                </CardTitle>
                <CardDescription>
                  {servidorLogado 
                    ? 'Dados preenchidos automaticamente a partir do seu cadastro de servidor'
                    : 'Informações de contato para retorno'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoadingServidor && (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verificando dados do servidor...
                  </div>
                )}
                
                {servidorLogado && (
                  <Alert className="mb-4">
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertTitle>Identificação automática</AlertTitle>
                    <AlertDescription>
                      Seus dados foram preenchidos automaticamente. Você pode editá-los se necessário.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="nome_responsavel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome Completo *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Seu nome completo" 
                            {...field} 
                            className={servidorLogado ? 'bg-muted/50' : ''}
                          />
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
                          <Input 
                            placeholder="Seu cargo ou função" 
                            {...field} 
                            className={servidorLogado ? 'bg-muted/50' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="setor_departamento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Setor/Departamento *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Ex: Diretoria de Esportes" 
                            {...field} 
                            className={servidorLogado ? 'bg-muted/50' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contato_telefone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefone *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="(95) 99999-9999" 
                            {...field} 
                            className={servidorLogado ? 'bg-muted/50' : ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="contato_email"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>E-mail *</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="seu.email@exemplo.com" 
                            {...field} 
                            className={servidorLogado ? 'bg-muted/50' : ''}
                          />
                        </FormControl>
                        <FormDescription>
                          Você receberá atualizações sobre sua solicitação neste e-mail
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Classificação da Demanda */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Classificação da Demanda
                </CardTitle>
                <CardDescription>Selecione a categoria e tipo de serviço</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
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
                          {Object.entries(CATEGORIA_DEMANDA_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
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
                            <SelectValue placeholder={categoriaWatch ? 'Selecione o tipo' : 'Selecione a categoria primeiro'} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categoriaWatch && TIPOS_POR_CATEGORIA[categoriaWatch as CategoriaDemandasAscom]?.map(tipo => (
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

                <FormField
                  control={form.control}
                  name="prioridade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prioridade</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(PRIORIDADE_DEMANDA_LABELS).map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prazo_entrega"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prazo Desejado *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} min={new Date().toISOString().split('T')[0]} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {requerAutorizacao && (
                  <div className="md:col-span-2">
                    <Alert variant="default" className="bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800">
                      <AlertCircle className="h-4 w-4 text-orange-600" />
                      <AlertTitle className="text-orange-800 dark:text-orange-300">Autorização Necessária</AlertTitle>
                      <AlertDescription className="text-orange-700 dark:text-orange-400">
                        Este tipo de demanda requer autorização da Presidência antes de ser executada.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detalhamento */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhamento da Solicitação</CardTitle>
                <CardDescription>Descreva sua demanda com o máximo de detalhes possível</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="titulo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título da Demanda *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Cobertura do evento de abertura do programa..." maxLength={200} {...field} />
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
                          placeholder="Descreva detalhadamente o que você precisa, incluindo contexto, expectativas e informações relevantes..."
                          className="min-h-[120px]"
                          maxLength={2000}
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>Mínimo de 20 caracteres</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="objetivo_institucional"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Objetivo Institucional</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Qual o objetivo institucional dessa ação?"
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
                            placeholder="Quem é o público-alvo dessa ação?"
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

            {/* Dados do Evento (se aplicável) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Dados do Evento
                  <Badge variant="outline" className="ml-2">Opcional</Badge>
                </CardTitle>
                <CardDescription>Preencha se a demanda estiver relacionada a um evento específico</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="data_evento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data do Evento</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hora_evento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="local_evento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local</FormLabel>
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
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Anexos
                  <Badge variant="outline" className="ml-2">Opcional</Badge>
                </CardTitle>
                <CardDescription>Anexe arquivos de referência (máximo 10MB por arquivo)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    id="anexos"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  />
                  <label htmlFor="anexos" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Clique para selecionar arquivos</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Imagens, PDFs, documentos do Office (máx. 10MB cada)
                    </p>
                  </label>
                </div>

                {arquivosParaUpload.length > 0 && (
                  <div className="space-y-2">
                    {arquivosParaUpload.map((file, index) => (
                      <div key={index} className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm truncate max-w-[200px]">{file.name}</span>
                          <span className="text-xs text-muted-foreground">
                            ({(file.size / 1024 / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removerArquivo(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex flex-col sm:flex-row gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting ? (
                  <>Enviando...</>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Enviar Solicitação
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-12">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
          <p>Instituto de Desenvolvimento da Juventude, Esporte e Lazer de Roraima - IDJuv</p>
          <p className="mt-1">Assessoria de Comunicação Social - ASCOM</p>
        </div>
      </footer>
    </div>
  );
}
