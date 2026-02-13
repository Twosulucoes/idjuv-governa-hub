import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { gerarMatricula } from "@/lib/matriculaUtils";
import { ModuleLayout } from "@/components/layout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
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
import { MaskedInput, UppercaseInput, UppercaseTextarea } from "@/components/ui/masked-input";
import { 
  ArrowLeft, 
  Save, 
  User, 
  FileText, 
  MapPin, 
  GraduationCap,
  Wallet,
  Loader2,
  Download,
  FileDown,
  Settings,
  Briefcase
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
  UFS,
  ESTADOS_CIVIS,
  ESCOLARIDADES,
  BANCOS,
  RACAS_CORES,
  TIPOS_PCD,
  TIPOS_SANGUINEOS,
  CATEGORIAS_RESERVA
} from "@/types/rh";
import { SegundoVinculoSection } from "@/components/rh/SegundoVinculoSection";
import { VinculoFuncionalForm, useVinculoFuncionalValidation } from "@/components/rh/VinculoFuncionalForm";
import type { TipoServidor } from "@/types/servidor";

type FormData = {
  nome_completo: string;
  nome_social: string;
  cpf: string;
  rg: string;
  rg_orgao_expedidor: string;
  rg_uf: string;
  rg_data_emissao: string;
  data_nascimento: string;
  sexo: string;
  estado_civil: string;
  nacionalidade: string;
  naturalidade_cidade: string;
  naturalidade_uf: string;
  raca_cor: string;
  pcd: boolean;
  pcd_tipo: string;
  nome_mae: string;
  nome_pai: string;
  tipo_sanguineo: string;
  molestia_grave: boolean;
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
  carga_horaria: string;
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
  titulo_cidade_votacao: string;
  titulo_uf_votacao: string;
  titulo_data_emissao: string;
  certificado_reservista: string;
  reservista_orgao: string;
  reservista_data_emissao: string;
  reservista_categoria: string;
  reservista_ano: string;
  ctps_numero: string;
  ctps_serie: string;
  ctps_uf: string;
  ctps_data_emissao: string;
  cnh_numero: string;
  cnh_categoria: string;
  cnh_validade: string;
  cnh_data_expedicao: string;
  cnh_primeira_habilitacao: string;
  cnh_uf: string;
  acumula_cargo: boolean;
  acumulo_descricao: string;
  observacoes: string;
  indicacao: string;
  // Estrangeiro
  estrangeiro_data_chegada: string;
  estrangeiro_data_limite_permanencia: string;
  estrangeiro_registro_nacional: string;
  estrangeiro_ano_chegada: string;
  // Primeiro emprego
  ano_inicio_primeiro_emprego: string;
  ano_fim_primeiro_emprego: string;
  // Segundo vínculo
  possui_vinculo_externo: boolean;
  vinculo_externo_esfera: string;
  vinculo_externo_orgao: string;
  vinculo_externo_cargo: string;
  vinculo_externo_matricula: string;
  vinculo_externo_situacao: string;
  vinculo_externo_forma: string;
  vinculo_externo_ato_id: string | null;
  vinculo_externo_observacoes: string;
  // Vínculo funcional (tipo, cargo, unidade, admissão)
  tipo_servidor: TipoServidor | '';
  cargo_atual_id: string;
  unidade_atual_id: string;
  data_admissao: string;
};

const initialFormData: FormData = {
  nome_completo: '',
  nome_social: '',
  cpf: '',
  rg: '',
  rg_orgao_expedidor: '',
  rg_uf: '',
  rg_data_emissao: '',
  data_nascimento: '',
  sexo: '',
  estado_civil: '',
  nacionalidade: 'Brasileira',
  naturalidade_cidade: '',
  naturalidade_uf: '',
  raca_cor: '',
  pcd: false,
  pcd_tipo: '',
  nome_mae: '',
  nome_pai: '',
  tipo_sanguineo: '',
  molestia_grave: false,
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
  carga_horaria: '40',
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
  titulo_cidade_votacao: '',
  titulo_uf_votacao: '',
  titulo_data_emissao: '',
  certificado_reservista: '',
  reservista_orgao: '',
  reservista_data_emissao: '',
  reservista_categoria: '',
  reservista_ano: '',
  ctps_numero: '',
  ctps_serie: '',
  ctps_uf: '',
  ctps_data_emissao: '',
  cnh_numero: '',
  cnh_categoria: '',
  cnh_validade: '',
  cnh_data_expedicao: '',
  cnh_primeira_habilitacao: '',
  cnh_uf: '',
  acumula_cargo: false,
  acumulo_descricao: '',
  observacoes: '',
  indicacao: '',
  // Estrangeiro
  estrangeiro_data_chegada: '',
  estrangeiro_data_limite_permanencia: '',
  estrangeiro_registro_nacional: '',
  estrangeiro_ano_chegada: '',
  // Primeiro emprego
  ano_inicio_primeiro_emprego: '',
  ano_fim_primeiro_emprego: '',
  // Segundo vínculo
  possui_vinculo_externo: false,
  vinculo_externo_esfera: '',
  vinculo_externo_orgao: '',
  vinculo_externo_cargo: '',
  vinculo_externo_matricula: '',
  vinculo_externo_situacao: '',
  vinculo_externo_forma: '',
  vinculo_externo_ato_id: null,
  vinculo_externo_observacoes: '',
  // Vínculo funcional
  tipo_servidor: '',
  cargo_atual_id: '',
  unidade_atual_id: '',
  data_admissao: new Date().toISOString().split('T')[0],
};

export default function ServidorFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { user, isSuperAdmin, hasAnyPermission } = useAuth();
  const isEditing = !!id;
  const isAdmin = isSuperAdmin || hasAnyPermission(['admin', 'rh.servidores.editar']);

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
        rg_data_emissao: servidor.rg_data_emissao || '',
        data_nascimento: servidor.data_nascimento || '',
        sexo: servidor.sexo || '',
        estado_civil: servidor.estado_civil || '',
        nacionalidade: servidor.nacionalidade || 'Brasileira',
        naturalidade_cidade: servidor.naturalidade_cidade || '',
        naturalidade_uf: servidor.naturalidade_uf || '',
        raca_cor: servidor.raca_cor || '',
        pcd: servidor.pcd || false,
        pcd_tipo: servidor.pcd_tipo || '',
        nome_mae: servidor.nome_mae || '',
        nome_pai: servidor.nome_pai || '',
        tipo_sanguineo: servidor.tipo_sanguineo || '',
        molestia_grave: servidor.molestia_grave || false,
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
        carga_horaria: servidor.carga_horaria?.toString() || '40',
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
        titulo_cidade_votacao: servidor.titulo_cidade_votacao || '',
        titulo_uf_votacao: servidor.titulo_uf_votacao || '',
        titulo_data_emissao: servidor.titulo_data_emissao || '',
        certificado_reservista: servidor.certificado_reservista || '',
        reservista_orgao: servidor.reservista_orgao || '',
        reservista_data_emissao: servidor.reservista_data_emissao || '',
        reservista_categoria: servidor.reservista_categoria || '',
        reservista_ano: servidor.reservista_ano?.toString() || '',
        ctps_numero: servidor.ctps_numero || '',
        ctps_serie: servidor.ctps_serie || '',
        ctps_uf: servidor.ctps_uf || '',
        ctps_data_emissao: servidor.ctps_data_emissao || '',
        cnh_numero: servidor.cnh_numero || '',
        cnh_categoria: servidor.cnh_categoria || '',
        cnh_validade: servidor.cnh_validade || '',
        cnh_data_expedicao: servidor.cnh_data_expedicao || '',
        cnh_primeira_habilitacao: servidor.cnh_primeira_habilitacao || '',
        cnh_uf: servidor.cnh_uf || '',
        acumula_cargo: servidor.acumula_cargo || false,
        acumulo_descricao: servidor.acumulo_descricao || '',
        observacoes: servidor.observacoes || '',
        indicacao: servidor.indicacao || '',
        // Estrangeiro
        estrangeiro_data_chegada: servidor.estrangeiro_data_chegada || '',
        estrangeiro_data_limite_permanencia: servidor.estrangeiro_data_limite_permanencia || '',
        estrangeiro_registro_nacional: servidor.estrangeiro_registro_nacional || '',
        estrangeiro_ano_chegada: servidor.estrangeiro_ano_chegada?.toString() || '',
        // Primeiro emprego
        ano_inicio_primeiro_emprego: servidor.ano_inicio_primeiro_emprego?.toString() || '',
        ano_fim_primeiro_emprego: servidor.ano_fim_primeiro_emprego?.toString() || '',
        // Segundo vínculo
        possui_vinculo_externo: servidor.possui_vinculo_externo || false,
        vinculo_externo_esfera: servidor.vinculo_externo_esfera || '',
        vinculo_externo_orgao: servidor.vinculo_externo_orgao || '',
        vinculo_externo_cargo: servidor.vinculo_externo_cargo || '',
        vinculo_externo_matricula: servidor.vinculo_externo_matricula || '',
        vinculo_externo_situacao: servidor.vinculo_externo_situacao || '',
        vinculo_externo_forma: servidor.vinculo_externo_forma || '',
        vinculo_externo_ato_id: servidor.vinculo_externo_ato_id || null,
        vinculo_externo_observacoes: servidor.vinculo_externo_observacoes || '',
        // Vínculo funcional
        tipo_servidor: (servidor.tipo_servidor as TipoServidor) || '',
        cargo_atual_id: servidor.cargo_atual_id || '',
        unidade_atual_id: servidor.unidade_atual_id || '',
        data_admissao: servidor.data_admissao || new Date().toISOString().split('T')[0],
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
        rg_data_emissao: data.rg_data_emissao || null,
        data_nascimento: data.data_nascimento || null,
        sexo: data.sexo || null,
        estado_civil: data.estado_civil || null,
        nacionalidade: data.nacionalidade || null,
        naturalidade_cidade: data.naturalidade_cidade || null,
        naturalidade_uf: data.naturalidade_uf || null,
        raca_cor: data.raca_cor || null,
        pcd: data.pcd,
        pcd_tipo: data.pcd_tipo || null,
        nome_mae: data.nome_mae || null,
        nome_pai: data.nome_pai || null,
        tipo_sanguineo: data.tipo_sanguineo || null,
        molestia_grave: data.molestia_grave,
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
        carga_horaria: parseInt(data.carga_horaria) || 40,
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
        titulo_cidade_votacao: data.titulo_cidade_votacao || null,
        titulo_uf_votacao: data.titulo_uf_votacao || null,
        titulo_data_emissao: data.titulo_data_emissao || null,
        certificado_reservista: data.certificado_reservista || null,
        reservista_orgao: data.reservista_orgao || null,
        reservista_data_emissao: data.reservista_data_emissao || null,
        reservista_categoria: data.reservista_categoria || null,
        reservista_ano: parseInt(data.reservista_ano) || null,
        ctps_numero: data.ctps_numero || null,
        ctps_serie: data.ctps_serie || null,
        ctps_uf: data.ctps_uf || null,
        ctps_data_emissao: data.ctps_data_emissao || null,
        cnh_numero: data.cnh_numero || null,
        cnh_categoria: data.cnh_categoria || null,
        cnh_validade: data.cnh_validade || null,
        cnh_data_expedicao: data.cnh_data_expedicao || null,
        cnh_primeira_habilitacao: data.cnh_primeira_habilitacao || null,
        cnh_uf: data.cnh_uf || null,
        acumula_cargo: data.acumula_cargo,
        acumulo_descricao: data.acumulo_descricao || null,
        observacoes: data.observacoes || null,
        indicacao: data.indicacao || null,
        // Estrangeiro
        estrangeiro_data_chegada: data.estrangeiro_data_chegada || null,
        estrangeiro_data_limite_permanencia: data.estrangeiro_data_limite_permanencia || null,
        estrangeiro_registro_nacional: data.estrangeiro_registro_nacional || null,
        estrangeiro_ano_chegada: parseInt(data.estrangeiro_ano_chegada) || null,
        // Primeiro emprego
        ano_inicio_primeiro_emprego: parseInt(data.ano_inicio_primeiro_emprego) || null,
        ano_fim_primeiro_emprego: parseInt(data.ano_fim_primeiro_emprego) || null,
        // Segundo vínculo
        possui_vinculo_externo: data.possui_vinculo_externo,
        vinculo_externo_esfera: data.vinculo_externo_esfera || null,
        vinculo_externo_orgao: data.vinculo_externo_orgao || null,
        vinculo_externo_cargo: data.vinculo_externo_cargo || null,
        vinculo_externo_matricula: data.vinculo_externo_matricula || null,
        vinculo_externo_situacao: data.vinculo_externo_situacao || null,
        vinculo_externo_forma: data.vinculo_externo_forma || null,
        vinculo_externo_ato_id: data.vinculo_externo_ato_id || null,
        vinculo_externo_observacoes: data.vinculo_externo_observacoes || null,
        // Vínculo funcional
        tipo_servidor: data.tipo_servidor || null,
        cargo_atual_id: data.cargo_atual_id || null,
        unidade_atual_id: data.unidade_atual_id || null,
        data_admissao: data.data_admissao || null,
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

        // Criar lotação inicial (se tiver unidade selecionada)
        if (servidorId && data.unidade_atual_id) {
          try {
            await supabase.from('lotacoes').insert({
              servidor_id: servidorId,
              unidade_id: data.unidade_atual_id,
              cargo_id: data.cargo_atual_id || null,
              tipo_lotacao: 'lotacao_interna',
              data_inicio: data.data_admissao || new Date().toISOString().split('T')[0],
              ativo: true,
            });

            // Criar provimento (se tiver cargo)
            if (data.cargo_atual_id) {
              await supabase.from('provimentos').insert({
                servidor_id: servidorId,
                cargo_id: data.cargo_atual_id,
                unidade_id: data.unidade_atual_id,
                status: 'ativo',
                data_nomeacao: data.data_admissao || new Date().toISOString().split('T')[0],
                data_posse: data.data_admissao || new Date().toISOString().split('T')[0],
                data_exercicio: data.data_admissao || new Date().toISOString().split('T')[0],
              });
            }
          } catch (lotacaoError) {
            console.error('Erro ao criar lotação/provimento:', lotacaoError);
            // Não lançar erro - servidor foi criado com sucesso
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
      <ProtectedRoute requiredModule="rh">
        <ModuleLayout module="rh">
          <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </ModuleLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredModule="rh">
      <ModuleLayout module="rh">
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
                      generateFichaCadastral({
                        ...servidor,
                      });
                    }}>
                      <FileText className="h-4 w-4 mr-2" />
                      Ficha Cadastral Completa
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      generateDeclaracaoAcumulacao({
                        nome_completo: servidor.nome_completo,
                        cpf: servidor.cpf,
                        rg: servidor.rg,
                        rg_orgao_expedidor: servidor.rg_orgao_expedidor,
                        acumula_cargo: servidor.acumula_cargo || false,
                        acumulo_descricao: servidor.acumulo_descricao,
                      });
                    }}>
                      <FileText className="h-4 w-4 mr-2" />
                      Declaração de Acumulação
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      generateDeclaracaoBens({
                        nome_completo: servidor.nome_completo,
                        cpf: servidor.cpf,
                        rg: servidor.rg,
                        rg_orgao_expedidor: servidor.rg_orgao_expedidor,
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
                <TabsTrigger value="vinculo" className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  <span className="hidden sm:inline">Vínculo</span>
                </TabsTrigger>
                <TabsTrigger value="documentos" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Documentos</span>
                </TabsTrigger>
                <TabsTrigger value="endereco" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span className="hidden sm:inline">Endereço</span>
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
                        <UppercaseInput
                          value={formData.nome_completo}
                          onChange={(value) => updateField('nome_completo', value)}
                          placeholder="Nome completo do servidor"
                          required
                        />
                      </div>
                      <div>
                        <Label>Nome Social</Label>
                        <UppercaseInput
                          value={formData.nome_social}
                          onChange={(value) => updateField('nome_social', value)}
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
                        <UppercaseInput
                          value={formData.nacionalidade}
                          onChange={(value) => updateField('nacionalidade', value)}
                        />
                      </div>
                      <div>
                        <Label>Naturalidade (Cidade)</Label>
                        <UppercaseInput
                          value={formData.naturalidade_cidade}
                          onChange={(value) => updateField('naturalidade_cidade', value)}
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

                    {/* Raça/Cor e PCD */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label>Raça/Cor</Label>
                        <Select value={formData.raca_cor} onValueChange={(v) => updateField('raca_cor', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {RACAS_CORES.map(rc => (
                              <SelectItem key={rc} value={rc}>{rc}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Pessoa com Deficiência (PCD)</Label>
                        <Select value={formData.pcd ? "sim" : "nao"} onValueChange={(v) => updateField('pcd', v === 'sim')}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nao">Não</SelectItem>
                            <SelectItem value="sim">Sim</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {formData.pcd && (
                        <div>
                          <Label>Tipo de Deficiência</Label>
                          <Select value={formData.pcd_tipo} onValueChange={(v) => updateField('pcd_tipo', v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              {TIPOS_PCD.map(t => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* Tipo Sanguíneo e Moléstia Grave */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Tipo Sanguíneo</Label>
                        <Select value={formData.tipo_sanguineo} onValueChange={(v) => updateField('tipo_sanguineo', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS_SANGUINEOS.map(ts => (
                              <SelectItem key={ts} value={ts}>{ts}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Moléstia Grave</Label>
                        <Select value={formData.molestia_grave ? "sim" : "nao"} onValueChange={(v) => updateField('molestia_grave', v === 'sim')}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nao">Não</SelectItem>
                            <SelectItem value="sim">Sim</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Nome dos Pais */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Nome da Mãe</Label>
                        <UppercaseInput
                          value={formData.nome_mae}
                          onChange={(value) => updateField('nome_mae', value)}
                          placeholder="Nome completo da mãe"
                        />
                      </div>
                      <div>
                        <Label>Nome do Pai</Label>
                        <UppercaseInput
                          value={formData.nome_pai}
                          onChange={(value) => updateField('nome_pai', value)}
                          placeholder="Nome completo do pai"
                        />
                      </div>
                    </div>

                    {/* Dados de Estrangeiro */}
                    {formData.nacionalidade && formData.nacionalidade.toUpperCase() !== 'BRASILEIRA' && (
                      <>
                        <Separator />
                        <h4 className="text-sm font-semibold text-muted-foreground">Dados de Estrangeiro</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>Data de Chegada ao País</Label>
                            <Input
                              type="date"
                              value={formData.estrangeiro_data_chegada}
                              onChange={(e) => updateField('estrangeiro_data_chegada', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Data Limite de Permanência</Label>
                            <Input
                              type="date"
                              value={formData.estrangeiro_data_limite_permanencia}
                              onChange={(e) => updateField('estrangeiro_data_limite_permanencia', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Registro Nacional de Estrangeiro (RNE)</Label>
                            <UppercaseInput
                              value={formData.estrangeiro_registro_nacional}
                              onChange={(value) => updateField('estrangeiro_registro_nacional', value)}
                            />
                          </div>
                          <div>
                            <Label>Ano de Chegada</Label>
                            <Input
                              type="number"
                              min="1900"
                              max={new Date().getFullYear()}
                              value={formData.estrangeiro_ano_chegada}
                              onChange={(e) => updateField('estrangeiro_ano_chegada', e.target.value)}
                            />
                          </div>
                        </div>
                      </>
                    )}

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
                        <MaskedInput
                          mask="telefone"
                          value={formData.telefone_fixo}
                          onChange={(value) => updateField('telefone_fixo', value)}
                        />
                      </div>
                      <div>
                        <Label>Telefone Celular</Label>
                        <MaskedInput
                          mask="telefone"
                          value={formData.telefone_celular}
                          onChange={(value) => updateField('telefone_celular', value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Vínculo Funcional */}
              <TabsContent value="vinculo">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Vínculo Funcional
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <VinculoFuncionalForm
                      tipoServidor={formData.tipo_servidor}
                      cargoId={formData.cargo_atual_id}
                      unidadeId={formData.unidade_atual_id}
                      dataAdmissao={formData.data_admissao}
                      onTipoServidorChange={(tipo) => updateField('tipo_servidor', tipo)}
                      onCargoChange={(cargoId) => updateField('cargo_atual_id', cargoId)}
                      onUnidadeChange={(unidadeId) => updateField('unidade_atual_id', unidadeId)}
                      onDataAdmissaoChange={(data) => updateField('data_admissao', data)}
                    />
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
                        <MaskedInput
                          mask="cpf"
                          value={formData.cpf}
                          onChange={(value) => updateField('cpf', value)}
                          required
                        />
                      </div>
                      <div>
                        <Label>RG</Label>
                        <MaskedInput
                          mask="rg"
                          value={formData.rg}
                          onChange={(value) => updateField('rg', value)}
                        />
                      </div>
                      <div>
                        <Label>Órgão Expedidor</Label>
                        <UppercaseInput
                          value={formData.rg_orgao_expedidor}
                          onChange={(value) => updateField('rg_orgao_expedidor', value)}
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
                        <Label>Data de Emissão do RG</Label>
                        <Input
                          type="date"
                          value={formData.rg_data_emissao}
                          onChange={(e) => updateField('rg_data_emissao', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>PIS/PASEP</Label>
                        <MaskedInput
                          mask="pis"
                          value={formData.pis_pasep}
                          onChange={(value) => updateField('pis_pasep', value)}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Título de Eleitor</Label>
                        <MaskedInput
                          mask="titulo_eleitor"
                          value={formData.titulo_eleitor}
                          onChange={(value) => updateField('titulo_eleitor', value)}
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
                      <div>
                        <Label>Cidade de Votação</Label>
                        <UppercaseInput
                          value={formData.titulo_cidade_votacao}
                          onChange={(value) => updateField('titulo_cidade_votacao', value)}
                        />
                      </div>
                      <div>
                        <Label>UF de Votação</Label>
                        <Select value={formData.titulo_uf_votacao} onValueChange={(v) => updateField('titulo_uf_votacao', v)}>
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
                        <Label>Data de Emissão</Label>
                        <Input
                          type="date"
                          value={formData.titulo_data_emissao}
                          onChange={(e) => updateField('titulo_data_emissao', e.target.value)}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Certificado de Reservista */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Certificado de Reservista</Label>
                        <Input
                          value={formData.certificado_reservista}
                          onChange={(e) => updateField('certificado_reservista', e.target.value)}
                          placeholder="Número do certificado"
                        />
                      </div>
                      <div>
                        <Label>Órgão/UF Reservista</Label>
                        <UppercaseInput
                          value={formData.reservista_orgao}
                          onChange={(value) => updateField('reservista_orgao', value)}
                        />
                      </div>
                      <div>
                        <Label>Data de Expedição</Label>
                        <Input
                          type="date"
                          value={formData.reservista_data_emissao}
                          onChange={(e) => updateField('reservista_data_emissao', e.target.value)}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* CTPS */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label>CTPS Número</Label>
                        <Input
                          value={formData.ctps_numero}
                          onChange={(e) => updateField('ctps_numero', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>CTPS Série</Label>
                        <Input
                          value={formData.ctps_serie}
                          onChange={(e) => updateField('ctps_serie', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>CTPS UF</Label>
                        <Select value={formData.ctps_uf} onValueChange={(v) => updateField('ctps_uf', v)}>
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
                        <Label>Data de Expedição</Label>
                        <Input
                          type="date"
                          value={formData.ctps_data_emissao}
                          onChange={(e) => updateField('ctps_data_emissao', e.target.value)}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* CNH */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>CNH Número</Label>
                        <Input
                          value={formData.cnh_numero}
                          onChange={(e) => updateField('cnh_numero', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Categoria</Label>
                        <Select value={formData.cnh_categoria} onValueChange={(v) => updateField('cnh_categoria', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Categoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="A">A</SelectItem>
                            <SelectItem value="B">B</SelectItem>
                            <SelectItem value="AB">AB</SelectItem>
                            <SelectItem value="C">C</SelectItem>
                            <SelectItem value="D">D</SelectItem>
                            <SelectItem value="E">E</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Validade</Label>
                        <Input
                          type="date"
                          value={formData.cnh_validade}
                          onChange={(e) => updateField('cnh_validade', e.target.value)}
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
                        <MaskedInput
                          mask="cep"
                          value={formData.endereco_cep}
                          onChange={(value) => updateField('endereco_cep', value)}
                        />
                      </div>
                      <div className="md:col-span-3">
                        <Label>Logradouro</Label>
                        <UppercaseInput
                          value={formData.endereco_logradouro}
                          onChange={(value) => updateField('endereco_logradouro', value)}
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
                        <UppercaseInput
                          value={formData.endereco_complemento}
                          onChange={(value) => updateField('endereco_complemento', value)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Bairro</Label>
                        <UppercaseInput
                          value={formData.endereco_bairro}
                          onChange={(value) => updateField('endereco_bairro', value)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label>Cidade</Label>
                        <UppercaseInput
                          value={formData.endereco_cidade}
                          onChange={(value) => updateField('endereco_cidade', value)}
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
                        <UppercaseInput
                          value={formData.formacao_academica}
                          onChange={(value) => updateField('formacao_academica', value)}
                          placeholder="Ex: Administração, Direito..."
                        />
                      </div>
                      <div>
                        <Label>Instituição de Ensino</Label>
                        <UppercaseInput
                          value={formData.instituicao_ensino}
                          onChange={(value) => updateField('instituicao_ensino', value)}
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

                    <Separator />

                    {/* Primeiro Emprego */}
                    <h4 className="text-sm font-semibold text-muted-foreground">Primeiro Emprego</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Ano de Início</Label>
                        <Input
                          type="number"
                          min="1950"
                          max={new Date().getFullYear()}
                          value={formData.ano_inicio_primeiro_emprego}
                          onChange={(e) => updateField('ano_inicio_primeiro_emprego', e.target.value)}
                          placeholder="Ano"
                        />
                      </div>
                      <div>
                        <Label>Ano de Término</Label>
                        <Input
                          type="number"
                          min="1950"
                          max={new Date().getFullYear()}
                          value={formData.ano_fim_primeiro_emprego}
                          onChange={(e) => updateField('ano_fim_primeiro_emprego', e.target.value)}
                          placeholder="Ano"
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
                        <MaskedInput
                          mask="agencia"
                          value={formData.banco_agencia}
                          onChange={(value) => updateField('banco_agencia', value)}
                        />
                      </div>
                      <div>
                        <Label>Conta</Label>
                        <MaskedInput
                          mask="conta"
                          value={formData.banco_conta}
                          onChange={(value) => updateField('banco_conta', value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Informações Adicionais */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Informações Adicionais
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
                    <Label>Carga Horária (h/sem)</Label>
                    <Input
                      type="number"
                      value={formData.carga_horaria}
                      onChange={(e) => updateField('carga_horaria', e.target.value)}
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

                <Separator />

                {/* Segundo Vínculo Funcional */}
                <SegundoVinculoSection
                  data={{
                    possui_vinculo_externo: formData.possui_vinculo_externo,
                    vinculo_externo_esfera: formData.vinculo_externo_esfera,
                    vinculo_externo_orgao: formData.vinculo_externo_orgao,
                    vinculo_externo_cargo: formData.vinculo_externo_cargo,
                    vinculo_externo_matricula: formData.vinculo_externo_matricula,
                    vinculo_externo_situacao: formData.vinculo_externo_situacao,
                    vinculo_externo_forma: formData.vinculo_externo_forma,
                    vinculo_externo_ato_id: formData.vinculo_externo_ato_id,
                    vinculo_externo_observacoes: formData.vinculo_externo_observacoes,
                  }}
                  onChange={(field, value) => updateField(field as keyof FormData, value as string | boolean)}
                />

                <Separator />
                
                <div>
                  <Label>Observações Gerais</Label>
                  <Textarea
                    value={formData.observacoes}
                    onChange={(e) => updateField('observacoes', e.target.value)}
                    placeholder="Observações adicionais..."
                    rows={3}
                  />
                </div>

                {/* Campo de Indicação - Apenas para Admins */}
                {isAdmin && (
                  <>
                    <Separator />
                    <div className="border border-dashed border-muted-foreground/30 rounded-lg p-4 bg-muted/20">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 rounded-full bg-amber-500" />
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                          Informação Estratégica (Restrito)
                        </Label>
                      </div>
                      <Textarea
                        value={formData.indicacao}
                        onChange={(e) => updateField('indicacao', e.target.value)}
                        placeholder="Indicação..."
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  </>
                )}
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
      </ModuleLayout>
    </ProtectedRoute>
  );
}
