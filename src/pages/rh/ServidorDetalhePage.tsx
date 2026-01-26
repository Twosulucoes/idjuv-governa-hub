import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  ArrowLeft, 
  Pencil,
  User, 
  MapPin, 
  Phone, 
  Briefcase,
  GraduationCap,
  Wallet,
  Loader2,
  Calendar,
  Plane,
  FileDown,
  History,
  Star,
  ChevronDown,
  FileText
} from "lucide-react";
import { generateFichaCadastral } from "@/lib/pdfGenerator";
import { downloadFichaCadastroGeral } from "@/lib/pdfFichaCadastroGeral";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  type Servidor,
  type HistoricoFuncional,
  type SituacaoFuncional,
  SITUACAO_LABELS,
  SITUACAO_COLORS,
  MOVIMENTACAO_LABELS
} from "@/types/rh";
import { formatDateBR } from "@/lib/formatters";
import { type TipoServidor } from "@/types/servidor";
import { HistoricoFuncionalTab } from "@/components/rh/HistoricoFuncionalTab";

export default function ServidorDetalheePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.role === 'ti_admin' || user?.role === 'presidencia';

  // Fetch servidor
  const { data: servidor, isLoading } = useQuery({
    queryKey: ["servidor-detalhe", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servidores")
        .select(`
          *,
          cargo:cargos!servidores_cargo_atual_id_fkey(id, nome, sigla),
          unidade:estrutura_organizacional!servidores_unidade_atual_id_fkey(id, nome, sigla)
        `)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data as unknown as Servidor;
    },
    enabled: !!id,
  });

  // Fetch lotação vigente da tabela lotacoes
  // Busca por servidor_id = servidores.id OU por user_id do servidor
  const { data: lotacaoVigente } = useQuery({
    queryKey: ["lotacao-vigente", id, servidor?.user_id],
    queryFn: async () => {
      // Primeiro tenta buscar pelo id do servidor
      let { data, error } = await supabase
        .from("lotacoes")
        .select(`
          *,
          unidade:estrutura_organizacional!lotacoes_unidade_id_fkey(id, nome, sigla),
          cargo:cargos!lotacoes_cargo_id_fkey(id, nome, sigla)
        `)
        .eq("servidor_id", id!)
        .eq("ativo", true)
        .order("data_inicio", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      // Se não encontrou e o servidor tem user_id, busca pelo user_id
      if (!data && servidor?.user_id) {
        const result = await supabase
          .from("lotacoes")
          .select(`
            *,
            unidade:estrutura_organizacional!lotacoes_unidade_id_fkey(id, nome, sigla),
            cargo:cargos!lotacoes_cargo_id_fkey(id, nome, sigla)
          `)
          .eq("servidor_id", servidor.user_id)
          .eq("ativo", true)
          .order("data_inicio", { ascending: false })
          .limit(1)
          .maybeSingle();
        data = result.data;
        error = result.error;
      }
      
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!servidor,
  });

  // Fetch histórico funcional
  const { data: historico = [] } = useQuery({
    queryKey: ["historico-funcional", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("historico_funcional")
        .select(`
          *,
          cargo_anterior:cargos!historico_funcional_cargo_anterior_id_fkey(id, nome),
          cargo_novo:cargos!historico_funcional_cargo_novo_id_fkey(id, nome),
          unidade_anterior:estrutura_organizacional!historico_funcional_unidade_anterior_id_fkey(id, nome, sigla),
          unidade_nova:estrutura_organizacional!historico_funcional_unidade_nova_id_fkey(id, nome, sigla)
        `)
        .eq("servidor_id", id)
        .order("data_evento", { ascending: false });
      if (error) throw error;
      return data as unknown as HistoricoFuncional[];
    },
    enabled: !!id,
  });

  // Portarias agora são gerenciadas exclusivamente pela aba Histórico via PortariasServidorSection

  // Fetch férias
  const { data: ferias = [] } = useQuery({
    queryKey: ["ferias-servidor", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ferias_servidor")
        .select("*")
        .eq("servidor_id", id)
        .order("data_inicio", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch viagens
  const { data: viagens = [] } = useQuery({
    queryKey: ["viagens-servidor", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("viagens_diarias")
        .select("*")
        .eq("servidor_id", id)
        .order("data_saida", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const getInitials = (nome: string) => {
    return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  };

  const formatCPF = (cpf: string) => {
    return cpf?.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4') || '-';
  };

  const formatDate = (date: string | undefined) => {
    return formatDateBR(date);
  };

  const formatCurrency = (value: number | undefined) => {
    if (!value) return '-';
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={["admin", "manager"]}>
        <AdminLayout>
          <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  if (!servidor) {
    return (
      <ProtectedRoute allowedRoles={["admin", "manager"]}>
        <AdminLayout>
          <div className="container mx-auto py-8 px-4 text-center">
            <p className="text-muted-foreground">Servidor não encontrado.</p>
            <Button className="mt-4" onClick={() => navigate('/rh/servidores')}>
              Voltar
            </Button>
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin", "manager"]}>
      <AdminLayout>
        <div className="container mx-auto py-8 px-4">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
            <div className="flex items-start gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar className="h-20 w-20">
                <AvatarImage src={servidor.foto_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {getInitials(servidor.nome_completo)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{servidor.nome_completo}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={SITUACAO_COLORS[servidor.situacao as SituacaoFuncional]}>
                    {SITUACAO_LABELS[servidor.situacao as SituacaoFuncional]}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-1">
                  {servidor.cargo?.nome || 'Sem cargo'} • {lotacaoVigente?.unidade?.sigla || lotacaoVigente?.unidade?.nome || servidor.unidade?.sigla || servidor.unidade?.nome || 'Sem lotação'}
                </p>
                {servidor.matricula && (
                  <p className="text-sm text-muted-foreground">Matrícula: {servidor.matricula}</p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <FileDown className="h-4 w-4 mr-2" />
                    Fichas PDF
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Documentos</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => {
                      downloadFichaCadastroGeral({
                        servidor: servidor as any,
                        cargo: servidor.cargo,
                        unidade: lotacaoVigente?.unidade || servidor.unidade,
                        dependentes: servidor.dependentes,
                      });
                    }}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Ficha Cadastro SEGAD
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => {
                      generateFichaCadastral({
                        nome_completo: servidor.nome_completo,
                        nome_social: servidor.nome_social,
                        cpf: servidor.cpf,
                        rg: servidor.rg,
                        rg_orgao_expedidor: servidor.rg_orgao_expedidor,
                        rg_uf: servidor.rg_uf,
                        rg_data_emissao: servidor.rg_data_emissao,
                        data_nascimento: servidor.data_nascimento,
                        sexo: servidor.sexo,
                        estado_civil: servidor.estado_civil,
                        nacionalidade: servidor.nacionalidade,
                        naturalidade_cidade: servidor.naturalidade_cidade,
                        naturalidade_uf: servidor.naturalidade_uf,
                        titulo_eleitor: servidor.titulo_eleitor,
                        titulo_zona: servidor.titulo_zona,
                        titulo_secao: servidor.titulo_secao,
                        pis_pasep: servidor.pis_pasep,
                        ctps_numero: servidor.ctps_numero,
                        ctps_serie: servidor.ctps_serie,
                        ctps_uf: servidor.ctps_uf,
                        cnh_numero: servidor.cnh_numero,
                        cnh_categoria: servidor.cnh_categoria,
                        cnh_validade: servidor.cnh_validade,
                        certificado_reservista: servidor.certificado_reservista,
                        email_pessoal: servidor.email_pessoal,
                        email_institucional: servidor.email_institucional,
                        telefone_fixo: servidor.telefone_fixo,
                        telefone_celular: servidor.telefone_celular,
                        telefone_emergencia: servidor.telefone_emergencia,
                        contato_emergencia_nome: servidor.contato_emergencia_nome,
                        contato_emergencia_parentesco: servidor.contato_emergencia_parentesco,
                        endereco_logradouro: servidor.endereco_logradouro,
                        endereco_numero: servidor.endereco_numero,
                        endereco_complemento: servidor.endereco_complemento,
                        endereco_bairro: servidor.endereco_bairro,
                        endereco_cidade: servidor.endereco_cidade,
                        endereco_uf: servidor.endereco_uf,
                        endereco_cep: servidor.endereco_cep,
                        matricula: servidor.matricula,
                        situacao: servidor.situacao,
                        cargo_nome: servidor.cargo?.nome,
                        cargo_sigla: servidor.cargo?.sigla,
                        unidade_nome: servidor.unidade?.nome,
                        unidade_sigla: servidor.unidade?.sigla,
                        carga_horaria: servidor.carga_horaria,
                        regime_juridico: servidor.regime_juridico,
                        data_admissao: servidor.data_admissao,
                        data_desligamento: servidor.data_desligamento,
                        escolaridade: servidor.escolaridade,
                        formacao_academica: servidor.formacao_academica,
                        instituicao_ensino: servidor.instituicao_ensino,
                        ano_conclusao: servidor.ano_conclusao,
                        cursos_especializacao: servidor.cursos_especializacao,
                        banco_codigo: servidor.banco_codigo,
                        banco_nome: servidor.banco_nome,
                        banco_agencia: servidor.banco_agencia,
                        banco_conta: servidor.banco_conta,
                        banco_tipo_conta: servidor.banco_tipo_conta,
                        remuneracao_bruta: servidor.remuneracao_bruta,
                        gratificacoes: servidor.gratificacoes,
                        descontos: servidor.descontos,
                        acumula_cargo: servidor.acumula_cargo,
                        acumulo_descricao: servidor.acumulo_descricao,
                        declaracao_bens_data: servidor.declaracao_bens_data,
                        declaracao_acumulacao_data: servidor.declaracao_acumulacao_data,
                        observacoes: servidor.observacoes,
                      });
                    }}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Ficha Cadastral IDJUV
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={() => navigate(`/rh/servidores/${id}/editar`)}>
                <Pencil className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </div>
          </div>

          <Tabs defaultValue="dados" className="space-y-6">
            <TabsList className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <TabsTrigger value="dados" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Dados</span>
              </TabsTrigger>
              <TabsTrigger value="historico" className="flex items-center gap-2">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">Histórico</span>
              </TabsTrigger>
              <TabsTrigger value="ferias" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Férias</span>
              </TabsTrigger>
              <TabsTrigger value="viagens" className="flex items-center gap-2">
                <Plane className="h-4 w-4" />
                <span className="hidden sm:inline">Viagens</span>
              </TabsTrigger>
            </TabsList>

            {/* Dados Cadastrais */}
            <TabsContent value="dados" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Dados Pessoais */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User className="h-5 w-5 text-primary" />
                      Dados Pessoais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <InfoRow label="CPF" value={formatCPF(servidor.cpf)} />
                    <InfoRow label="RG" value={servidor.rg ? `${servidor.rg} ${servidor.rg_orgao_expedidor || ''} ${servidor.rg_uf || ''}` : '-'} />
                    <InfoRow label="Data de Nascimento" value={formatDate(servidor.data_nascimento)} />
                    <InfoRow label="Sexo" value={servidor.sexo === 'M' ? 'Masculino' : servidor.sexo === 'F' ? 'Feminino' : servidor.sexo || '-'} />
                    <InfoRow label="Estado Civil" value={servidor.estado_civil || '-'} />
                    <InfoRow label="Nacionalidade" value={servidor.nacionalidade || '-'} />
                    <InfoRow label="Naturalidade" value={servidor.naturalidade_cidade ? `${servidor.naturalidade_cidade}/${servidor.naturalidade_uf}` : '-'} />
                  </CardContent>
                </Card>

                {/* Contato */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Phone className="h-5 w-5 text-primary" />
                      Contato
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <InfoRow label="Email Pessoal" value={servidor.email_pessoal || '-'} />
                    <InfoRow label="Email Institucional" value={servidor.email_institucional || '-'} />
                    <InfoRow label="Telefone Fixo" value={servidor.telefone_fixo || '-'} />
                    <InfoRow label="Telefone Celular" value={servidor.telefone_celular || '-'} />
                  </CardContent>
                </Card>

                {/* Endereço */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MapPin className="h-5 w-5 text-primary" />
                      Endereço
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground">
                      {servidor.endereco_logradouro ? (
                        <>
                          {servidor.endereco_logradouro}, {servidor.endereco_numero}
                          {servidor.endereco_complemento && ` - ${servidor.endereco_complemento}`}
                          <br />
                          {servidor.endereco_bairro} - {servidor.endereco_cidade}/{servidor.endereco_uf}
                          <br />
                          CEP: {servidor.endereco_cep}
                        </>
                      ) : (
                        <span className="text-muted-foreground">Não informado</span>
                      )}
                    </p>
                  </CardContent>
                </Card>

                {/* Dados Funcionais */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Briefcase className="h-5 w-5 text-primary" />
                      Dados Funcionais
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <InfoRow label="Matrícula" value={servidor.matricula || '-'} />
                    <InfoRow label="Cargo" value={servidor.cargo?.nome || '-'} />
                    <InfoRow 
                      label="Lotação" 
                      value={lotacaoVigente?.unidade?.nome || servidor.unidade?.nome || '-'} 
                    />
                    {lotacaoVigente?.funcao_exercida && (
                      <InfoRow label="Função Exercida" value={lotacaoVigente.funcao_exercida} />
                    )}
                    {lotacaoVigente?.data_inicio && (
                      <InfoRow label="Início da Lotação" value={formatDate(lotacaoVigente.data_inicio)} />
                    )}
                    <InfoRow label="Carga Horária" value={servidor.carga_horaria ? `${servidor.carga_horaria}h/semana` : '-'} />
                    <InfoRow label="Data de Admissão" value={formatDate(servidor.data_admissao)} />
                    <InfoRow label="Remuneração Bruta" value={formatCurrency(servidor.remuneracao_bruta)} />
                  </CardContent>
                </Card>

                {/* Formação */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      Formação
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <InfoRow label="Escolaridade" value={servidor.escolaridade || '-'} />
                    <InfoRow label="Formação" value={servidor.formacao_academica || '-'} />
                    <InfoRow label="Instituição" value={servidor.instituicao_ensino || '-'} />
                    <InfoRow label="Ano Conclusão" value={servidor.ano_conclusao?.toString() || '-'} />
                  </CardContent>
                </Card>

                {/* Dados Bancários */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Wallet className="h-5 w-5 text-primary" />
                      Dados Bancários
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <InfoRow label="Banco" value={servidor.banco_nome || '-'} />
                    <InfoRow label="Agência" value={servidor.banco_agencia || '-'} />
                    <InfoRow label="Conta" value={servidor.banco_conta || '-'} />
                    <InfoRow label="Tipo" value={servidor.banco_tipo_conta || '-'} />
                    <InfoRow label="PIS/PASEP" value={servidor.pis_pasep || '-'} />
                  </CardContent>
                </Card>

                {/* Indicação - Apenas para Admins */}
                {isAdmin && (servidor as any).indicacao && (
                  <Card className="border-dashed border-amber-500/50 bg-amber-500/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-sm">
                        <Star className="h-4 w-4 text-amber-500" />
                        <span className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                          Informação Estratégica
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-foreground">{(servidor as any).indicacao}</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Histórico Funcional Completo */}
            <TabsContent value="historico">
              <HistoricoFuncionalTab 
                servidorId={id!} 
                servidorNome={servidor.nome_completo}
                tipoServidor={(servidor as any).tipo_servidor as TipoServidor | undefined}
              />
            </TabsContent>


            {/* Férias */}
            <TabsContent value="ferias">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Histórico de Férias
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {ferias.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum registro de férias.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {ferias.map((f) => (
                        <div key={f.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium">
                              {formatDate(f.data_inicio)} a {formatDate(f.data_fim)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {f.dias_gozados} dias • Período aquisitivo: {formatDate(f.periodo_aquisitivo_inicio)} a {formatDate(f.periodo_aquisitivo_fim)}
                            </p>
                          </div>
                          <Badge variant={f.status === 'concluida' ? 'secondary' : 'default'}>
                            {f.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Viagens */}
            <TabsContent value="viagens">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plane className="h-5 w-5 text-primary" />
                    Histórico de Viagens
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {viagens.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum registro de viagem.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {viagens.map((v) => (
                        <div key={v.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                          <div>
                            <p className="font-medium">
                              {v.destino_cidade}/{v.destino_uf}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(v.data_saida)} a {formatDate(v.data_retorno)}
                            </p>
                            <p className="text-sm text-muted-foreground">{v.finalidade}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={v.status === 'concluida' ? 'secondary' : 'default'}>
                              {v.status}
                            </Badge>
                            {v.valor_total && (
                              <p className="text-sm font-medium mt-1">
                                {formatCurrency(v.valor_total)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </ProtectedRoute>
  );
}

// Componente auxiliar para exibir informação
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}
