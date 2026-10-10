/**
 * Formulário Público de Pré-Cadastro de Gestores Escolares
 * /cadastrogestores
 */

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CheckCircle, Loader2, ArrowRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useEscolasJer } from '@/hooks/useEscolasJer';
import { useGestoresEscolares } from '@/hooks/useGestoresEscolares';
import { validarCPF, formatarCPF, formatarCelular } from '@/types/gestoresEscolares';
import { HeaderPublico } from '@/components/cadastrogestores/HeaderPublico';
import { SkipLink } from '@/components/design-system';
import { useIdentidade } from '@/core/tenant';

// Schema de validação
const formSchema = z.object({
  escola_id: z.string().min(1, 'Selecione a escola'),
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cpf: z.string()
    .min(11, 'CPF inválido')
    .refine((val) => validarCPF(val), 'CPF inválido'),
  rg: z.string().optional(),
  data_nascimento: z.string().optional(),
  email: z.string().email('Email inválido'),
  celular: z.string().min(10, 'Celular inválido'),
  endereco: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function FormularioGestorPage() {
  const { sigla } = useIdentidade();
  const [enviado, setEnviado] = useState(false);
  const [gestorCriado, setGestorCriado] = useState<{ nome: string; escola: string } | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [buscaEscola, setBuscaEscola] = useState('');
  const [escolaAberta, setEscolaAberta] = useState(false);

  const { escolasDisponiveis, isLoading: loadingEscolas } = useEscolasJer();

  const escolasFiltradas = useMemo(() => {
    if (!buscaEscola) return escolasDisponiveis;
    const termo = buscaEscola.toLowerCase();
    return escolasDisponiveis.filter(
      (e) => e.nome.toLowerCase().includes(termo) || (e.municipio && e.municipio.toLowerCase().includes(termo))
    );
  }, [escolasDisponiveis, buscaEscola]);
  const { criarGestor } = useGestoresEscolares();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      escola_id: '',
      nome: '',
      cpf: '',
      rg: '',
      data_nascimento: '',
      email: '',
      celular: '',
      endereco: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setErro(null);
    try {
      const resultado = await criarGestor.mutateAsync({
        escola_id: data.escola_id,
        nome: data.nome,
        cpf: data.cpf,
        rg: data.rg,
        data_nascimento: data.data_nascimento,
        email: data.email,
        celular: data.celular,
        endereco: data.endereco,
      });
      setGestorCriado({
        nome: resultado.nome,
        escola: resultado.escola?.nome || '',
      });
      setEnviado(true);
    } catch (error) {
      setErro((error as Error).message || 'Erro ao enviar formulário.');
    }
  };

  // Formatar CPF ao digitar
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, '').slice(0, 11);
    form.setValue('cpf', valor);
  };

  // Formatar celular ao digitar
  const handleCelularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, '').slice(0, 11);
    form.setValue('celular', valor);
  };

  if (enviado && gestorCriado) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
        <SkipLink />
        <HeaderPublico />

        <main id="conteudo" tabIndex={-1} className="container mx-auto px-4 py-12 focus:outline-none">
          <Card className="max-w-lg mx-auto">
            <CardContent className="pt-8 text-center">
              <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" aria-hidden="true" />
              <h2 className="text-2xl font-bold mb-2">Pré-cadastro realizado!</h2>
              <p className="text-muted-foreground mb-6">
                Seu pré-cadastro foi recebido com sucesso.
              </p>

              <div className="bg-muted p-4 rounded-lg mb-6 text-left">
                <p className="text-base"><strong>Gestor:</strong> {gestorCriado.nome}</p>
                <p className="text-base"><strong>Escola:</strong> {gestorCriado.escola}</p>
              </div>

              <div className="bg-info/10 border border-info/30 p-4 rounded-lg mb-6 text-left">
                <h3 className="font-semibold text-info mb-2">Próximos passos</h3>
                <ol className="text-base text-foreground space-y-1 list-decimal list-inside">
                  <li>A equipe {sigla} irá cadastrar você no sistema CBDE</li>
                  <li>Você receberá um email do CBDE com login e senha</li>
                  <li>A equipe entrará em contato para confirmar</li>
                  <li>Teste seu acesso ao sistema CBDE</li>
                </ol>
              </div>

              <div className="flex flex-col gap-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/cadastrogestores/consulta">
                    <Search className="h-4 w-4 mr-2" aria-hidden="true" />
                    Consultar situação
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <SkipLink />
      <HeaderPublico />

      <main id="conteudo" tabIndex={-1} className="container mx-auto px-4 py-8 focus:outline-none">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <h2 className="text-h3 leading-tight tracking-tight">Pré-cadastro de gestor escolar</h2>
            <CardDescription className="text-base">
              Preencha os dados abaixo para realizar o pré-cadastro para os Jogos Escolares de Roraima.
              Após o envio, você receberá as credenciais de acesso ao sistema CBDE por email.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Escola */}
                <FormField
                  control={form.control}
                  name="escola_id"
                  render={({ field }) => {
                    const escolaSelecionada = escolasDisponiveis.find((e) => e.id === field.value);
                    return (
                      <FormItem className="flex flex-col">
                        <FormLabel>Escola *</FormLabel>
                        <div className="relative">
                          <FormControl>
                          <button
                            type="button"
                            aria-expanded={escolaAberta}
                            className={cn(
                              'flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
                              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                              !field.value && 'text-muted-foreground',
                              loadingEscolas && 'opacity-50 cursor-not-allowed'
                            )}
                            disabled={loadingEscolas}
                            onClick={() => setEscolaAberta(!escolaAberta)}
                          >
                            <span className="truncate">
                              {escolaSelecionada
                                ? `${escolaSelecionada.nome}${escolaSelecionada.municipio ? ` - ${escolaSelecionada.municipio}` : ''}`
                                : 'Buscar escola...'}
                            </span>
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" aria-hidden="true" />
                          </button>
                          </FormControl>

                          {escolaAberta && (
                            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
                              <div className="p-2">
                                <Input
                                  placeholder="Digite o nome da escola..."
                                  aria-label="Buscar escola pelo nome"
                                  value={buscaEscola}
                                  onChange={(e) => setBuscaEscola(e.target.value)}
                                  autoFocus
                                />
                              </div>
                              <ScrollArea className="max-h-60">
                                <div className="p-1">
                                  {escolasFiltradas.length === 0 ? (
                                    <p className="p-3 text-sm text-muted-foreground text-center">Nenhuma escola disponível.</p>
                                  ) : (
                                    escolasFiltradas.map((escola) => (
                                      <button
                                        key={escola.id}
                                        type="button"
                                        aria-pressed={field.value === escola.id}
                                        className={cn(
                                          'w-full min-h-11 text-left px-3 py-2 text-sm rounded-sm hover:bg-accent cursor-pointer',
                                          field.value === escola.id && 'bg-accent font-medium'
                                        )}
                                        onClick={() => {
                                          field.onChange(escola.id);
                                          setEscolaAberta(false);
                                          setBuscaEscola('');
                                        }}
                                      >
                                        {escola.nome}
                                        {escola.municipio && (
                                          <span className="text-muted-foreground"> - {escola.municipio}</span>
                                        )}
                                      </button>
                                    ))
                                  )}
                                </div>
                              </ScrollArea>
                            </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    );
                  }}
                />

                {/* Nome */}
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome Completo *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nome completo do gestor" 
                          {...field} 
                          className="uppercase"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* CPF e RG */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CPF *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="000.000.000-00" 
                            value={formatarCPF(field.value)}
                            onChange={handleCpfChange}
                            maxLength={14}
                            inputMode="numeric"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RG</FormLabel>
                        <FormControl>
                          <Input placeholder="Número do RG" inputMode="numeric" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Data Nascimento */}
                <FormField
                  control={form.control}
                  name="data_nascimento"
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

                {/* Email e Celular */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input 
                            type="email" 
                            placeholder="seu@email.com" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="celular"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Celular *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="(95) 99999-9999" 
                            value={formatarCelular(field.value)}
                            onChange={handleCelularChange}
                            maxLength={15}
                            inputMode="numeric"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Endereço */}
                <FormField
                  control={form.control}
                  name="endereco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Endereço Completo</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Rua, número, bairro, cidade" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Erro */}
                {erro && (
                  <div role="alert" className="bg-destructive/10 border border-destructive/30 text-destructive p-3 rounded-md text-base">
                    {erro}
                  </div>
                )}

                {/* Botões */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={criarGestor.isPending}
                  >
                    {criarGestor.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    ) : (
                      <ArrowRight className="h-4 w-4 mr-2" aria-hidden="true" />
                    )}
                    Enviar pré-cadastro
                  </Button>
                </div>

                <p className="text-sm text-muted-foreground text-center">
                  Já fez o pré-cadastro?{' '}
                  <Link 
                    to="/cadastrogestores/consulta" 
                    className="text-primary hover:underline"
                  >
                    Consulte o status aqui
                  </Link>
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
