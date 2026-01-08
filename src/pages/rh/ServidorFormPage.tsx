import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { gerarMatricula } from "@/lib/matriculaUtils";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  Save, 
  User, 
  FileText, 
  MapPin, 
  Phone, 
  Building2,
  Briefcase,
  GraduationCap,
  Wallet,
  Loader2,
  Download,
  FileDown
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  generateFichaCadastral,
  generateDeclaracaoAcumulacao,
  generateDeclaracaoBens,
  generateDeclaracaoResidencia,
  generateFichaCadastralModelo,
  generateDeclaracaoAcumulacaoModelo,
  generateDeclaracaoBensModelo
} from "@/lib/pdfGenerator";
import { toast } from "sonner";
import { 
  type VinculoFuncional,
  type SituacaoFuncional,
  type TipoServidor,
  VINCULO_LABELS,
  SITUACAO_LABELS,
  TIPO_SERVIDOR_LABELS,
  REGRAS_TIPO_SERVIDOR,
  UFS,
  ESTADOS_CIVIS,
  ESCOLARIDADES,
  BANCOS
} from "@/types/rh";

type FormData = {
  nome_completo: string;
  nome_social: string;
  cpf: string;
  rg: string;
  rg_orgao_expedidor: string;
  rg_uf: string;
  data_nascimento: string;
  sexo: string;
  estado_civil: string;
  nacionalidade: string;
  naturalidade_cidade: string;
  naturalidade_uf: string;
  email_pessoal: string;
  email_institucional: string;
  telefone_fixo: string;
  telefone_celular: string;
  endereco_logradouro: string;
  endereco_numero: string;
  endereco_complemento: string;
  endereco_bairro: string;
  endereco_cidade: string;
  endereco_uf: string;
  endereco_cep: string;
  matricula: string;
  tipo_servidor: TipoServidor | '';
  vinculo: VinculoFuncional;
  situacao: SituacaoFuncional;
  cargo_atual_id: string;
  unidade_atual_id: string;
  orgao_origem: string;
  orgao_destino_cessao: string;
  funcao_exercida: string;
  data_admissao: string;
  data_posse: string;
  data_exercicio: string;
  carga_horaria: string;
  regime_juridico: string;
  remuneracao_bruta: string;
  escolaridade: string;
  formacao_academica: string;
  instituicao_ensino: string;
  ano_conclusao: string;
  banco_codigo: string;
  banco_agencia: string;
  banco_conta: string;
  banco_tipo_conta: string;
  pis_pasep: string;
  titulo_eleitor: string;
  titulo_zona: string;
  titulo_secao: string;
  acumula_cargo: boolean;
  acumulo_descricao: string;
  observacoes: string;
};

const initialFormData: FormData = {
  nome_completo: '',
  nome_social: '',
  cpf: '',
  rg: '',
  rg_orgao_expedidor: '',
  rg_uf: '',
  data_nascimento: '',
  sexo: '',
  estado_civil: '',
  nacionalidade: 'Brasileira',
  naturalidade_cidade: '',
  naturalidade_uf: '',
  email_pessoal: '',
  email_institucional: '',
  telefone_fixo: '',
  telefone_celular: '',
  endereco_logradouro: '',
  endereco_numero: '',
  endereco_complemento: '',
  endereco_bairro: '',
  endereco_cidade: '',
  endereco_uf: '',
  endereco_cep: '',
  matricula: '',
  tipo_servidor: '',
  vinculo: 'comissionado',
  situacao: 'ativo',
  cargo_atual_id: '',
  unidade_atual_id: '',
  orgao_origem: '',
  orgao_destino_cessao: '',
  funcao_exercida: '',
  data_admissao: '',
  data_posse: '',
  data_exercicio: '',
  carga_horaria: '40',
  regime_juridico: '',
  remuneracao_bruta: '',
  escolaridade: '',
  formacao_academica: '',
  instituicao_ensino: '',
  ano_conclusao: '',
  banco_codigo: '',
  banco_agencia: '',
  banco_conta: '',
  banco_tipo_conta: '',
  pis_pasep: '',
  titulo_eleitor: '',
  titulo_zona: '',
  titulo_secao: '',
  acumula_cargo: false,
  acumulo_descricao: '',
  observacoes: '',
};

export default function ServidorFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [formData, setFormData] = useState<FormData>(initialFormData);

  // Fetch servidor se editando
  const { data: servidor, isLoading: isLoadingServidor } = useQuery({
    queryKey: ["servidor", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("servidores")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch cargos
  const { data: cargos = [] } = useQuery({
    queryKey: ["cargos-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cargos")
        .select("id, nome, sigla")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Fetch unidades
  const { data: unidades = [] } = useQuery({
    queryKey: ["unidades-select"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("estrutura_organizacional")
        .select("id, nome, sigla")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return data;
    },
  });

  // Preencher form com dados do servidor
  useEffect(() => {
    if (servidor) {
      setFormData({
        nome_completo: servidor.nome_completo || '',
        nome_social: servidor.nome_social || '',
        cpf: servidor.cpf || '',
        rg: servidor.rg || '',
        rg_orgao_expedidor: servidor.rg_orgao_expedidor || '',
        rg_uf: servidor.rg_uf || '',
        data_nascimento: servidor.data_nascimento || '',
        sexo: servidor.sexo || '',
        estado_civil: servidor.estado_civil || '',
        nacionalidade: servidor.nacionalidade || 'Brasileira',
        naturalidade_cidade: servidor.naturalidade_cidade || '',
        naturalidade_uf: servidor.naturalidade_uf || '',
        email_pessoal: servidor.email_pessoal || '',
        email_institucional: servidor.email_institucional || '',
        telefone_fixo: servidor.telefone_fixo || '',
        telefone_celular: servidor.telefone_celular || '',
        endereco_logradouro: servidor.endereco_logradouro || '',
        endereco_numero: servidor.endereco_numero || '',
        endereco_complemento: servidor.endereco_complemento || '',
        endereco_bairro: servidor.endereco_bairro || '',
        endereco_cidade: servidor.endereco_cidade || '',
        endereco_uf: servidor.endereco_uf || '',
        endereco_cep: servidor.endereco_cep || '',
        matricula: servidor.matricula || '',
        tipo_servidor: servidor.tipo_servidor || '',
        vinculo: servidor.vinculo || 'comissionado',
        situacao: servidor.situacao || 'ativo',
        cargo_atual_id: servidor.cargo_atual_id || '',
        unidade_atual_id: servidor.unidade_atual_id || '',
        orgao_origem: servidor.orgao_origem || '',
        orgao_destino_cessao: servidor.orgao_destino_cessao || '',
        funcao_exercida: servidor.funcao_exercida || '',
        data_admissao: servidor.data_admissao || '',
        data_posse: servidor.data_posse || '',
        data_exercicio: servidor.data_exercicio || '',
        carga_horaria: servidor.carga_horaria?.toString() || '40',
        regime_juridico: servidor.regime_juridico || '',
        remuneracao_bruta: servidor.remuneracao_bruta?.toString() || '',
        escolaridade: servidor.escolaridade || '',
        formacao_academica: servidor.formacao_academica || '',
        instituicao_ensino: servidor.instituicao_ensino || '',
        ano_conclusao: servidor.ano_conclusao?.toString() || '',
        banco_codigo: servidor.banco_codigo || '',
        banco_agencia: servidor.banco_agencia || '',
        banco_conta: servidor.banco_conta || '',
        banco_tipo_conta: servidor.banco_tipo_conta || '',
        pis_pasep: servidor.pis_pasep || '',
        titulo_eleitor: servidor.titulo_eleitor || '',
        titulo_zona: servidor.titulo_zona || '',
        titulo_secao: servidor.titulo_secao || '',
        acumula_cargo: servidor.acumula_cargo || false,
        acumulo_descricao: servidor.acumulo_descricao || '',
        observacoes: servidor.observacoes || '',
      });
    }
  }, [servidor]);

  // Mutation
  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Gerar matrícula automaticamente se for novo servidor e não tiver matrícula
      let matriculaFinal = data.matricula;
      if (!isEditing && !matriculaFinal) {
        matriculaFinal = await gerarMatricula();
      }

      const payload = {
        nome_completo: data.nome_completo,
        nome_social: data.nome_social || null,
        cpf: data.cpf.replace(/\D/g, ''),
        rg: data.rg || null,
        rg_orgao_expedidor: data.rg_orgao_expedidor || null,
        rg_uf: data.rg_uf || null,
        data_nascimento: data.data_nascimento || null,
        sexo: data.sexo || null,
        estado_civil: data.estado_civil || null,
        nacionalidade: data.nacionalidade || null,
        naturalidade_cidade: data.naturalidade_cidade || null,
        naturalidade_uf: data.naturalidade_uf || null,
        email_pessoal: data.email_pessoal || null,
        email_institucional: data.email_institucional || null,
        telefone_fixo: data.telefone_fixo || null,
        telefone_celular: data.telefone_celular || null,
        endereco_logradouro: data.endereco_logradouro || null,
        endereco_numero: data.endereco_numero || null,
        endereco_complemento: data.endereco_complemento || null,
        endereco_bairro: data.endereco_bairro || null,
        endereco_cidade: data.endereco_cidade || null,
        endereco_uf: data.endereco_uf || null,
        endereco_cep: data.endereco_cep?.replace(/\D/g, '') || null,
        matricula: matriculaFinal || null,
        tipo_servidor: data.tipo_servidor || null,
        vinculo: data.vinculo,
        situacao: data.situacao,
        cargo_atual_id: data.cargo_atual_id || null,
        unidade_atual_id: data.unidade_atual_id || null,
        orgao_origem: data.orgao_origem || null,
        orgao_destino_cessao: data.orgao_destino_cessao || null,
        funcao_exercida: data.funcao_exercida || null,
        data_admissao: data.data_admissao || null,
        data_posse: data.data_posse || null,
        data_exercicio: data.data_exercicio || null,
        carga_horaria: parseInt(data.carga_horaria) || 40,
        regime_juridico: data.regime_juridico || null,
        remuneracao_bruta: parseFloat(data.remuneracao_bruta) || null,
        escolaridade: data.escolaridade || null,
        formacao_academica: data.formacao_academica || null,
        instituicao_ensino: data.instituicao_ensino || null,
        ano_conclusao: parseInt(data.ano_conclusao) || null,
        banco_codigo: data.banco_codigo || null,
        banco_nome: BANCOS.find(b => b.codigo === data.banco_codigo)?.nome || null,
        banco_agencia: data.banco_agencia || null,
        banco_conta: data.banco_conta || null,
        banco_tipo_conta: data.banco_tipo_conta || null,
        pis_pasep: data.pis_pasep || null,
        titulo_eleitor: data.titulo_eleitor || null,
        titulo_zona: data.titulo_zona || null,
        titulo_secao: data.titulo_secao || null,
        acumula_cargo: data.acumula_cargo,
        acumulo_descricao: data.acumulo_descricao || null,
        observacoes: data.observacoes || null,
      };

      let servidorId: string | null = null;

      if (isEditing && id) {
        const { error } = await supabase
          .from("servidores")
          .update(payload)
          .eq("id", id);
        if (error) throw error;
        servidorId = id;
      } else {
        // Inserir novo servidor
        const { data: novoServidor, error } = await supabase
          .from("servidores")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        servidorId = novoServidor.id;

        // Criar usuário automaticamente para o servidor
        const emailParaUsuario = data.email_institucional || data.email_pessoal;
        if (emailParaUsuario && servidorId) {
          try {
            // Gerar senha temporária
            const tempPassword = generateTempPassword();
            
            // Criar usuário no Auth
            const { error: authError } = await supabase.auth.signUp({
              email: emailParaUsuario,
              password: tempPassword,
              options: {
                emailRedirectTo: `${window.location.origin}/auth`,
                data: {
                  full_name: data.nome_completo,
                  servidor_id: servidorId,
                  cpf: data.cpf.replace(/\D/g, ''),
                  tipo_usuario: 'servidor',
                  role: 'user'
                }
              }
            });

            if (authError) {
              console.error('Erro ao criar usuário:', authError);
              // Não lançar erro - servidor foi criado com sucesso
              toast.info('Servidor cadastrado! Usuário pode ser criado posteriormente.');
            } else {
              toast.success('Usuário criado! Email de confirmação enviado.');
            }
          } catch (userError) {
            console.error('Erro ao criar usuário:', userError);
            toast.info('Servidor cadastrado! Usuário pode ser criado posteriormente.');
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servidores-rh"] });
      toast.success(isEditing ? "Servidor atualizado!" : "Servidor cadastrado!");
      navigate("/rh/servidores");
    },
    onError: (error: any) => {
      toast.error(`Erro ao salvar: ${error.message}`);
    },
  });

  // Função para gerar senha temporária
  const generateTempPassword = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome_completo || !formData.cpf) {
      toast.error("Nome e CPF são obrigatórios");
      return;
    }
    mutation.mutate(formData);
  };

  const updateField = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (isEditing && isLoadingServidor) {
    return (
      <ProtectedRoute allowedRoles={["admin"]}>
        <AdminLayout>
          <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <AdminLayout>
        <div className="container mx-auto py-8 px-4 max-w-5xl">
{/* Header */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  {isEditing ? "Editar Servidor" : "Novo Servidor"}
                </h1>
                <p className="text-muted-foreground">
                  Ficha cadastral completa do servidor
                </p>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Download className="h-4 w-4" />
                  Documentos PDF
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>Modelos em Branco</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => generateFichaCadastralModelo()}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Ficha Cadastral (Modelo)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => generateDeclaracaoAcumulacaoModelo()}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Declaração de Acumulação (Modelo)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => generateDeclaracaoBensModelo()}>
                  <FileDown className="h-4 w-4 mr-2" />
                  Declaração de Bens (Modelo)
                </DropdownMenuItem>
                
                {isEditing && servidor && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>Documentos Preenchidos</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => {
                      const cargoSelecionado = cargos.find(c => c.id === formData.cargo_atual_id);
                      const unidadeSelecionada = unidades.find(u => u.id === formData.unidade_atual_id);
                      generateFichaCadastral({
                        ...servidor,
                        cargo_nome: cargoSelecionado?.nome,
                        cargo_sigla: cargoSelecionado?.sigla,
                        unidade_nome: unidadeSelecionada?.nome,
                        unidade_sigla: unidadeSelecionada?.sigla,
                      });
                    }}>
                      <FileText className="h-4 w-4 mr-2" />
                      Ficha Cadastral Completa
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      const cargoSelecionado = cargos.find(c => c.id === formData.cargo_atual_id);
                      const unidadeSelecionada = unidades.find(u => u.id === formData.unidade_atual_id);
                      generateDeclaracaoAcumulacao({
                        nome_completo: servidor.nome_completo,
                        cpf: servidor.cpf,
                        rg: servidor.rg,
                        rg_orgao_expedidor: servidor.rg_orgao_expedidor,
                        cargo_nome: cargoSelecionado?.nome,
                        unidade_nome: unidadeSelecionada?.nome,
                        acumula_cargo: servidor.acumula_cargo || false,
                        acumulo_descricao: servidor.acumulo_descricao,
                      });
                    }}>
                      <FileText className="h-4 w-4 mr-2" />
                      Declaração de Acumulação
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      const cargoSelecionado = cargos.find(c => c.id === formData.cargo_atual_id);
                      const unidadeSelecionada = unidades.find(u => u.id === formData.unidade_atual_id);
                      generateDeclaracaoBens({
                        nome_completo: servidor.nome_completo,
                        cpf: servidor.cpf,
                        rg: servidor.rg,
                        rg_orgao_expedidor: servidor.rg_orgao_expedidor,
                        cargo_nome: cargoSelecionado?.nome,
                        unidade_nome: unidadeSelecionada?.nome,
                        data_admissao: servidor.data_admissao,
                      });
                    }}>
                      <FileText className="h-4 w-4 mr-2" />
                      Declaração de Bens
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      generateDeclaracaoResidencia({
                        nome_completo: servidor.nome_completo,
                        cpf: servidor.cpf,
                        rg: servidor.rg,
                        rg_orgao_expedidor: servidor.rg_orgao_expedidor,
                        endereco_logradouro: servidor.endereco_logradouro,
                        endereco_numero: servidor.endereco_numero,
                        endereco_complemento: servidor.endereco_complemento,
                        endereco_bairro: servidor.endereco_bairro,
                        endereco_cidade: servidor.endereco_cidade,
                        endereco_uf: servidor.endereco_uf,
                        endereco_cep: servidor.endereco_cep,
                      });
                    }}>
                      <FileText className="h-4 w-4 mr-2" />
                      Declaração de Residência
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="pessoal" className="space-y-6">
              <TabsList className="grid grid-cols-3 lg:grid-cols-6 gap-2">
                <TabsTrigger value="pessoal" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">Pessoal</span>
                </TabsTrigger>
                <TabsTrigger value="documentos" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Documentos</span>
                </TabsTrigger>
                <TabsTrigger value="endereco" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="hidden sm:inline">Endereço</span>
                </TabsTrigger>
                <TabsTrigger value="funcional" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  <span className="hidden sm:inline">Funcional</span>
                </TabsTrigger>
                <TabsTrigger value="formacao" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  <span className="hidden sm:inline">Formação</span>
                </TabsTrigger>
                <TabsTrigger value="bancario" className="flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  <span className="hidden sm:inline">Bancário</span>
                </TabsTrigger>
              </TabsList>

              {/* Dados Pessoais */}
              <TabsContent value="pessoal">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5 text-primary" />
                      Dados Pessoais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label>Nome Completo *</Label>
                        <Input
                          value={formData.nome_completo}
                          onChange={(e) => updateField('nome_completo', e.target.value)}
                          placeholder="Nome completo do servidor"
                          required
                        />
                      </div>
                      <div>
                        <Label>Nome Social</Label>
                        <Input
                          value={formData.nome_social}
                          onChange={(e) => updateField('nome_social', e.target.value)}
                          placeholder="Nome social (se aplicável)"
                        />
                      </div>
                      <div>
                        <Label>Data de Nascimento</Label>
                        <Input
                          type="date"
                          value={formData.data_nascimento}
                          onChange={(e) => updateField('data_nascimento', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Sexo</Label>
                        <Select value={formData.sexo} onValueChange={(v) => updateField('sexo', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="M">Masculino</SelectItem>
                            <SelectItem value="F">Feminino</SelectItem>
                            <SelectItem value="O">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Estado Civil</Label>
                        <Select value={formData.estado_civil} onValueChange={(v) => updateField('estado_civil', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {ESTADOS_CIVIS.map(ec => (
                              <SelectItem key={ec} value={ec}>{ec}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Nacionalidade</Label>
                        <Input
                          value={formData.nacionalidade}
                          onChange={(e) => updateField('nacionalidade', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Naturalidade (Cidade)</Label>
                        <Input
                          value={formData.naturalidade_cidade}
                          onChange={(e) => updateField('naturalidade_cidade', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Naturalidade (UF)</Label>
                        <Select value={formData.naturalidade_uf} onValueChange={(v) => updateField('naturalidade_uf', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="UF" />
                          </SelectTrigger>
                          <SelectContent>
                            {UFS.map(uf => (
                              <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Email Pessoal</Label>
                        <Input
                          type="email"
                          value={formData.email_pessoal}
                          onChange={(e) => updateField('email_pessoal', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Email Institucional</Label>
                        <Input
                          type="email"
                          value={formData.email_institucional}
                          onChange={(e) => updateField('email_institucional', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Telefone Fixo</Label>
                        <Input
                          value={formData.telefone_fixo}
                          onChange={(e) => updateField('telefone_fixo', e.target.value)}
                          placeholder="(00) 0000-0000"
                        />
                      </div>
                      <div>
                        <Label>Telefone Celular</Label>
                        <Input
                          value={formData.telefone_celular}
                          onChange={(e) => updateField('telefone_celular', e.target.value)}
                          placeholder="(00) 00000-0000"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Documentos */}
              <TabsContent value="documentos">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Documentos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>CPF *</Label>
                        <Input
                          value={formData.cpf}
                          onChange={(e) => updateField('cpf', e.target.value)}
                          placeholder="000.000.000-00"
                          required
                        />
                      </div>
                      <div>
                        <Label>RG</Label>
                        <Input
                          value={formData.rg}
                          onChange={(e) => updateField('rg', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Órgão Expedidor</Label>
                        <Input
                          value={formData.rg_orgao_expedidor}
                          onChange={(e) => updateField('rg_orgao_expedidor', e.target.value)}
                          placeholder="SSP"
                        />
                      </div>
                      <div>
                        <Label>UF do RG</Label>
                        <Select value={formData.rg_uf} onValueChange={(v) => updateField('rg_uf', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="UF" />
                          </SelectTrigger>
                          <SelectContent>
                            {UFS.map(uf => (
                              <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>PIS/PASEP</Label>
                        <Input
                          value={formData.pis_pasep}
                          onChange={(e) => updateField('pis_pasep', e.target.value)}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Título de Eleitor</Label>
                        <Input
                          value={formData.titulo_eleitor}
                          onChange={(e) => updateField('titulo_eleitor', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Zona</Label>
                        <Input
                          value={formData.titulo_zona}
                          onChange={(e) => updateField('titulo_zona', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Seção</Label>
                        <Input
                          value={formData.titulo_secao}
                          onChange={(e) => updateField('titulo_secao', e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Endereço */}
              <TabsContent value="endereco">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Endereço Residencial
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label>CEP</Label>
                        <Input
                          value={formData.endereco_cep}
                          onChange={(e) => updateField('endereco_cep', e.target.value)}
                          placeholder="00000-000"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <Label>Logradouro</Label>
                        <Input
                          value={formData.endereco_logradouro}
                          onChange={(e) => updateField('endereco_logradouro', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Número</Label>
                        <Input
                          value={formData.endereco_numero}
                          onChange={(e) => updateField('endereco_numero', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Complemento</Label>
                        <Input
                          value={formData.endereco_complemento}
                          onChange={(e) => updateField('endereco_complemento', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Bairro</Label>
                        <Input
                          value={formData.endereco_bairro}
                          onChange={(e) => updateField('endereco_bairro', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Cidade</Label>
                        <Input
                          value={formData.endereco_cidade}
                          onChange={(e) => updateField('endereco_cidade', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>UF</Label>
                        <Select value={formData.endereco_uf} onValueChange={(v) => updateField('endereco_uf', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="UF" />
                          </SelectTrigger>
                          <SelectContent>
                            {UFS.map(uf => (
                              <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Dados Funcionais */}
              <TabsContent value="funcional">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Dados Funcionais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Matrícula</Label>
                        <Input
                          value={formData.matricula}
                          onChange={(e) => updateField('matricula', e.target.value)}
                          placeholder={isEditing ? "" : "Gerada automaticamente"}
                          disabled={!isEditing && !formData.matricula}
                          className={!isEditing && !formData.matricula ? "bg-muted" : ""}
                        />
                        {!isEditing && !formData.matricula && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Será gerada automaticamente (ex: 0001)
                          </p>
                        )}
                      </div>
                      <div>
                        <Label>Vínculo</Label>
                        <Select value={formData.vinculo} onValueChange={(v) => updateField('vinculo', v as VinculoFuncional)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(VINCULO_LABELS).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Situação</Label>
                        <Select value={formData.situacao} onValueChange={(v) => updateField('situacao', v as SituacaoFuncional)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(SITUACAO_LABELS).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Cargo</Label>
                        <Select value={formData.cargo_atual_id} onValueChange={(v) => updateField('cargo_atual_id', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o cargo" />
                          </SelectTrigger>
                          <SelectContent>
                            {cargos.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.sigla ? `${c.sigla} - ${c.nome}` : c.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Unidade de Lotação</Label>
                        <Select value={formData.unidade_atual_id} onValueChange={(v) => updateField('unidade_atual_id', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a unidade" />
                          </SelectTrigger>
                          <SelectContent>
                            {unidades.map((u) => (
                              <SelectItem key={u.id} value={u.id}>
                                {u.sigla ? `${u.sigla} - ${u.nome}` : u.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Carga Horária (h/sem)</Label>
                        <Input
                          type="number"
                          value={formData.carga_horaria}
                          onChange={(e) => updateField('carga_horaria', e.target.value)}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Data de Admissão</Label>
                        <Input
                          type="date"
                          value={formData.data_admissao}
                          onChange={(e) => updateField('data_admissao', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Data da Posse</Label>
                        <Input
                          type="date"
                          value={formData.data_posse}
                          onChange={(e) => updateField('data_posse', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Data do Exercício</Label>
                        <Input
                          type="date"
                          value={formData.data_exercicio}
                          onChange={(e) => updateField('data_exercicio', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Remuneração Bruta (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.remuneracao_bruta}
                          onChange={(e) => updateField('remuneracao_bruta', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Regime Jurídico</Label>
                        <Input
                          value={formData.regime_juridico}
                          onChange={(e) => updateField('regime_juridico', e.target.value)}
                          placeholder="Ex: Estatutário, CLT, etc."
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="acumula_cargo"
                          checked={formData.acumula_cargo}
                          onCheckedChange={(v) => updateField('acumula_cargo', v as boolean)}
                        />
                        <Label htmlFor="acumula_cargo">Acumula cargo público</Label>
                      </div>
                      {formData.acumula_cargo && (
                        <div>
                          <Label>Descrição do Acúmulo</Label>
                          <Textarea
                            value={formData.acumulo_descricao}
                            onChange={(e) => updateField('acumulo_descricao', e.target.value)}
                            placeholder="Descreva o cargo acumulado..."
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Formação */}
              <TabsContent value="formacao">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      Formação Acadêmica
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Escolaridade</Label>
                        <Select value={formData.escolaridade} onValueChange={(v) => updateField('escolaridade', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {ESCOLARIDADES.map(e => (
                              <SelectItem key={e} value={e}>{e}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Curso / Formação</Label>
                        <Input
                          value={formData.formacao_academica}
                          onChange={(e) => updateField('formacao_academica', e.target.value)}
                          placeholder="Ex: Administração, Direito..."
                        />
                      </div>
                      <div>
                        <Label>Instituição de Ensino</Label>
                        <Input
                          value={formData.instituicao_ensino}
                          onChange={(e) => updateField('instituicao_ensino', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Ano de Conclusão</Label>
                        <Input
                          type="number"
                          value={formData.ano_conclusao}
                          onChange={(e) => updateField('ano_conclusao', e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Dados Bancários */}
              <TabsContent value="bancario">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-5 w-5 text-primary" />
                      Dados Bancários
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Banco</Label>
                        <Select value={formData.banco_codigo} onValueChange={(v) => updateField('banco_codigo', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o banco" />
                          </SelectTrigger>
                          <SelectContent>
                            {BANCOS.map(b => (
                              <SelectItem key={b.codigo} value={b.codigo}>
                                {b.codigo} - {b.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Tipo de Conta</Label>
                        <Select value={formData.banco_tipo_conta} onValueChange={(v) => updateField('banco_tipo_conta', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="corrente">Conta Corrente</SelectItem>
                            <SelectItem value="poupanca">Conta Poupança</SelectItem>
                            <SelectItem value="salario">Conta Salário</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Agência</Label>
                        <Input
                          value={formData.banco_agencia}
                          onChange={(e) => updateField('banco_agencia', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Conta</Label>
                        <Input
                          value={formData.banco_conta}
                          onChange={(e) => updateField('banco_conta', e.target.value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Observações e Submit */}
            <Card className="mt-6">
              <CardContent className="pt-6">
                <Label>Observações Gerais</Label>
                <Textarea
                  value={formData.observacoes}
                  onChange={(e) => updateField('observacoes', e.target.value)}
                  placeholder="Observações adicionais..."
                  rows={3}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4 mt-6">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}
