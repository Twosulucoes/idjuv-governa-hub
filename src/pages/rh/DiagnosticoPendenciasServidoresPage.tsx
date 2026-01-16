import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AdminLayout } from "@/components/admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  CheckCircle2,
  Building2,
  FileText,
  User,
  Eye,
  Filter,
  Printer,
  ArrowLeft,
  RefreshCw,
  Briefcase,
  UserX,
  CreditCard,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCPF } from "@/lib/formatters";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { gerarPdfRelatorioPendenciasServidores } from "@/lib/pdfRelatorioPendenciasServidores";

// Interface para pendência
interface PendenciaItem {
  tipo: "elegibilidade" | "esocial" | "bancaria" | "pessoal";
  campo: string;
  descricao: string;
  obrigatorio: boolean;
}

// Interface para servidor com pendências analisadas
interface ServidorComPendencias {
  servidor: ServidorCompleto;
  pendencias: PendenciaItem[];
  temPendenciaElegibilidade: boolean;
  temPendenciaEsocial: boolean;
  temPendenciaBancaria: boolean;
  temPendenciaPessoal: boolean;
}

// Interface para dados do servidor
interface ServidorCompleto {
  id: string;
  nome_completo: string;
  cpf: string;
  matricula: string | null;
  situacao: string;
  tipo_servidor: string | null;
  // Dados pessoais
  data_nascimento: string | null;
  sexo: string | null;
  estado_civil: string | null;
  naturalidade_cidade: string | null;
  naturalidade_uf: string | null;
  // Documentos
  rg: string | null;
  rg_orgao_expedidor: string | null;
  rg_uf: string | null;
  pis_pasep: string | null;
  // Dados bancários
  banco_codigo: string | null;
  banco_nome: string | null;
  banco_agencia: string | null;
  banco_conta: string | null;
  banco_tipo_conta: string | null;
  // Contato
  telefone_celular: string | null;
  email: string | null;
  // Endereço
  endereco_cep: string | null;
  endereco_logradouro: string | null;
  endereco_numero: string | null;
  endereco_bairro: string | null;
  endereco_cidade: string | null;
  endereco_uf: string | null;
  // Cargo e provimento
  cargo_nome: string | null;
  unidade_nome: string | null;
  tem_provimento_ativo: boolean;
  vencimento_base: number | null;
}

// Campos obrigatórios para eSocial
const CAMPOS_ESOCIAL = [
  { campo: "data_nascimento", descricao: "Data de Nascimento", obrigatorio: true },
  { campo: "pis_pasep", descricao: "PIS/PASEP", obrigatorio: true },
  { campo: "sexo", descricao: "Sexo", obrigatorio: true },
  { campo: "estado_civil", descricao: "Estado Civil", obrigatorio: true },
  { campo: "naturalidade_cidade", descricao: "Naturalidade (Cidade)", obrigatorio: true },
  { campo: "naturalidade_uf", descricao: "Naturalidade (UF)", obrigatorio: true },
  { campo: "rg", descricao: "RG", obrigatorio: true },
  { campo: "rg_orgao_expedidor", descricao: "Órgão Expedidor RG", obrigatorio: true },
  { campo: "rg_uf", descricao: "UF do RG", obrigatorio: true },
];

// Campos obrigatórios para remessa bancária
const CAMPOS_BANCARIOS = [
  { campo: "banco_codigo", descricao: "Código do Banco", obrigatorio: true },
  { campo: "banco_nome", descricao: "Nome do Banco", obrigatorio: true },
  { campo: "banco_agencia", descricao: "Agência", obrigatorio: true },
  { campo: "banco_conta", descricao: "Conta", obrigatorio: true },
  { campo: "banco_tipo_conta", descricao: "Tipo de Conta", obrigatorio: true },
];

// Campos de dados pessoais complementares
const CAMPOS_PESSOAIS = [
  { campo: "telefone_celular", descricao: "Telefone Celular", obrigatorio: true },
  { campo: "email", descricao: "E-mail", obrigatorio: true },
  { campo: "endereco_cep", descricao: "CEP", obrigatorio: true },
  { campo: "endereco_logradouro", descricao: "Logradouro", obrigatorio: true },
  { campo: "endereco_numero", descricao: "Número", obrigatorio: true },
  { campo: "endereco_bairro", descricao: "Bairro", obrigatorio: true },
  { campo: "endereco_cidade", descricao: "Cidade", obrigatorio: true },
  { campo: "endereco_uf", descricao: "UF", obrigatorio: true },
];

type FiltroIncompleto = "todos" | "incompletos" | "elegiveis" | "completos";

// Função para verificar pendências
function verificarPendencias(servidor: ServidorCompleto): PendenciaItem[] {
  const pendencias: PendenciaItem[] = [];

  // Pendências de elegibilidade (impedem entrada na folha)
  if (!servidor.tem_provimento_ativo) {
    pendencias.push({ 
      tipo: "elegibilidade", 
      campo: "provimento", 
      descricao: "Sem provimento ativo", 
      obrigatorio: true 
    });
  }
  if (servidor.tem_provimento_ativo && (!servidor.vencimento_base || servidor.vencimento_base <= 0)) {
    pendencias.push({ 
      tipo: "elegibilidade", 
      campo: "vencimento", 
      descricao: "Cargo sem vencimento", 
      obrigatorio: true 
    });
  }

  // Verificar campos eSocial
  CAMPOS_ESOCIAL.forEach(({ campo, descricao, obrigatorio }) => {
    const valor = servidor[campo as keyof ServidorCompleto];
    if (!valor || (typeof valor === "string" && valor.trim() === "")) {
      pendencias.push({ tipo: "esocial", campo, descricao, obrigatorio });
    }
  });

  // Verificar campos bancários
  CAMPOS_BANCARIOS.forEach(({ campo, descricao, obrigatorio }) => {
    const valor = servidor[campo as keyof ServidorCompleto];
    if (!valor || (typeof valor === "string" && valor.trim() === "")) {
      pendencias.push({ tipo: "bancaria", campo, descricao, obrigatorio });
    }
  });

  // Verificar campos pessoais
  CAMPOS_PESSOAIS.forEach(({ campo, descricao, obrigatorio }) => {
    const valor = servidor[campo as keyof ServidorCompleto];
    if (!valor || (typeof valor === "string" && valor.trim() === "")) {
      pendencias.push({ tipo: "pessoal", campo, descricao, obrigatorio });
    }
  });

  return pendencias;
}

export default function DiagnosticoPendenciasServidoresPage() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState("elegibilidade");
  const [filtroIncompleto, setFiltroIncompleto] = useState<FiltroIncompleto>("todos");

  // Buscar servidores ativos com todos os dados necessários
  const { data: servidores, isLoading, refetch } = useQuery({
    queryKey: ["servidores-pendencias-completo"],
    queryFn: async () => {
      // Buscar servidores ativos
      const { data: servidoresData, error: servidoresError } = await supabase
        .from("servidores")
        .select(`
          id,
          nome_completo,
          cpf,
          matricula,
          situacao,
          tipo_servidor,
          data_nascimento,
          sexo,
          estado_civil,
          naturalidade_cidade,
          naturalidade_uf,
          rg,
          rg_orgao_expedidor,
          rg_uf,
          pis_pasep,
          banco_codigo,
          banco_nome,
          banco_agencia,
          banco_conta,
          banco_tipo_conta,
          telefone_celular,
          email,
          endereco_cep,
          endereco_logradouro,
          endereco_numero,
          endereco_bairro,
          endereco_cidade,
          endereco_uf,
          cargo_atual:cargos!servidores_cargo_atual_id_fkey(nome, vencimento_base),
          lotacao_atual:estrutura_organizacional!servidores_lotacao_atual_id_fkey(nome)
        `)
        .eq("situacao", "ativo")
        .eq("ativo", true)
        .order("nome_completo");

      if (servidoresError) throw servidoresError;

      // Buscar provimentos ativos
      const { data: provimentosAtivos, error: provimentosError } = await supabase
        .from("provimentos")
        .select("servidor_id, cargo_id, cargos!provimentos_cargo_id_fkey(vencimento_base)")
        .eq("status", "ativo");

      if (provimentosError) throw provimentosError;

      // Mapear provimentos por servidor
      const provimentosPorServidor = new Map<string, { vencimento: number | null }>();
      provimentosAtivos?.forEach((p: any) => {
        provimentosPorServidor.set(p.servidor_id, {
          vencimento: p.cargos?.vencimento_base || null
        });
      });

      return servidoresData.map((s: any) => {
        const provimento = provimentosPorServidor.get(s.id);
        return {
          id: s.id,
          nome_completo: s.nome_completo,
          cpf: s.cpf,
          matricula: s.matricula,
          situacao: s.situacao,
          tipo_servidor: s.tipo_servidor,
          data_nascimento: s.data_nascimento,
          sexo: s.sexo,
          estado_civil: s.estado_civil,
          naturalidade_cidade: s.naturalidade_cidade,
          naturalidade_uf: s.naturalidade_uf,
          rg: s.rg,
          rg_orgao_expedidor: s.rg_orgao_expedidor,
          rg_uf: s.rg_uf,
          pis_pasep: s.pis_pasep,
          banco_codigo: s.banco_codigo,
          banco_nome: s.banco_nome,
          banco_agencia: s.banco_agencia,
          banco_conta: s.banco_conta,
          banco_tipo_conta: s.banco_tipo_conta,
          telefone_celular: s.telefone_celular,
          email: s.email,
          endereco_cep: s.endereco_cep,
          endereco_logradouro: s.endereco_logradouro,
          endereco_numero: s.endereco_numero,
          endereco_bairro: s.endereco_bairro,
          endereco_cidade: s.endereco_cidade,
          endereco_uf: s.endereco_uf,
          cargo_nome: s.cargo_atual?.nome || null,
          unidade_nome: s.lotacao_atual?.nome || null,
          tem_provimento_ativo: !!provimento,
          vencimento_base: provimento?.vencimento || s.cargo_atual?.vencimento_base || null,
        };
      }) as ServidorCompleto[];
    },
  });

  // Analisar pendências de cada servidor
  const analise = useMemo<ServidorComPendencias[]>(() => {
    return (servidores || []).map((servidor) => {
      const pendencias = verificarPendencias(servidor);
      return {
        servidor,
        pendencias,
        temPendenciaElegibilidade: pendencias.some((p) => p.tipo === "elegibilidade"),
        temPendenciaEsocial: pendencias.some((p) => p.tipo === "esocial"),
        temPendenciaBancaria: pendencias.some((p) => p.tipo === "bancaria"),
        temPendenciaPessoal: pendencias.some((p) => p.tipo === "pessoal"),
      };
    });
  }, [servidores]);

  // Aplicar filtro de incompletos
  const analiseFiltrada = useMemo(() => {
    switch (filtroIncompleto) {
      case "incompletos":
        return analise.filter(
          (a) => a.temPendenciaElegibilidade || a.temPendenciaEsocial || a.temPendenciaBancaria || a.temPendenciaPessoal
        );
      case "elegiveis":
        return analise.filter((a) => !a.temPendenciaElegibilidade);
      case "completos":
        return analise.filter(
          (a) => !a.temPendenciaElegibilidade && !a.temPendenciaEsocial && !a.temPendenciaBancaria && !a.temPendenciaPessoal
        );
      default:
        return analise;
    }
  }, [analise, filtroIncompleto]);

  // Estatísticas
  const stats = useMemo(() => {
    const comPendenciaElegibilidade = analise.filter((a) => a.temPendenciaElegibilidade).length;
    const comPendenciaEsocial = analise.filter((a) => a.temPendenciaEsocial).length;
    const comPendenciaBancaria = analise.filter((a) => a.temPendenciaBancaria).length;
    const comPendenciaPessoal = analise.filter((a) => a.temPendenciaPessoal).length;
    const completos = analise.filter(
      (a) => !a.temPendenciaElegibilidade && !a.temPendenciaEsocial && !a.temPendenciaBancaria && !a.temPendenciaPessoal
    ).length;
    const elegiveis = analise.filter((a) => !a.temPendenciaElegibilidade).length;

    return {
      total: analise.length,
      comPendenciaElegibilidade,
      comPendenciaEsocial,
      comPendenciaBancaria,
      comPendenciaPessoal,
      completos,
      elegiveis,
    };
  }, [analise]);

  // Filtrar por tab selecionada
  const dadosFiltrados = useMemo(() => {
    switch (selectedTab) {
      case "elegibilidade":
        return analiseFiltrada.filter((a) => a.temPendenciaElegibilidade);
      case "esocial":
        return analiseFiltrada.filter((a) => a.temPendenciaEsocial);
      case "bancaria":
        return analiseFiltrada.filter((a) => a.temPendenciaBancaria);
      case "pessoal":
        return analiseFiltrada.filter((a) => a.temPendenciaPessoal);
      case "completos":
        return analiseFiltrada.filter(
          (a) => !a.temPendenciaElegibilidade && !a.temPendenciaEsocial && !a.temPendenciaBancaria && !a.temPendenciaPessoal
        );
      default:
        return analiseFiltrada;
    }
  }, [analiseFiltrada, selectedTab]);

  const getPendenciasPorTipo = (
    pendencias: PendenciaItem[],
    tipo: "elegibilidade" | "esocial" | "bancaria" | "pessoal"
  ) => {
    return pendencias.filter((p) => p.tipo === tipo);
  };

  const handleVerDetalhes = (servidorId: string) => {
    navigate(`/rh/servidores/${servidorId}`);
  };

  const handleImprimir = () => {
    const filtroTexto = {
      todos: "Todos os servidores",
      incompletos: "Qualquer pendência",
      elegiveis: "Elegíveis para folha",
      completos: "Cadastro completo",
    }[filtroIncompleto];
    gerarPdfRelatorioPendenciasServidores(analiseFiltrada, stats, filtroTexto);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <FileText className="h-6 w-6 text-primary" />
                Diagnóstico de Pendências - Servidores
              </h1>
              <p className="text-muted-foreground">
                Verificação de dados obrigatórios para folha de pagamento, eSocial e remessa bancária
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Button onClick={handleImprimir} className="gap-2" disabled={isLoading}>
              <Printer className="h-4 w-4" />
              Imprimir Relatório
            </Button>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>

          <Card className="border-red-500/30 bg-red-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2">
                <UserX className="h-4 w-4" />
                Elegibilidade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{stats.comPendenciaElegibilidade}</p>
            </CardContent>
          </Card>

          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                eSocial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-destructive">{stats.comPendenciaEsocial}</p>
            </CardContent>
          </Card>

          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-600 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Bancárias
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{stats.comPendenciaBancaria}</p>
            </CardContent>
          </Card>

          <Card className="border-purple-500/30 bg-purple-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-purple-600 flex items-center gap-2">
                <User className="h-4 w-4" />
                Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">{stats.comPendenciaPessoal}</p>
            </CardContent>
          </Card>

          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Elegíveis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{stats.elegiveis}</p>
            </CardContent>
          </Card>

          <Card className="border-green-500/30 bg-green-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-green-600 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Completos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{stats.completos}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filtro */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filtrar:</span>
              </div>
              <Select value={filtroIncompleto} onValueChange={(v) => setFiltroIncompleto(v as FiltroIncompleto)}>
                <SelectTrigger className="w-[260px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os servidores</SelectItem>
                  <SelectItem value="incompletos">Com qualquer pendência</SelectItem>
                  <SelectItem value="elegiveis">Elegíveis para folha</SelectItem>
                  <SelectItem value="completos">Cadastro completo</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="secondary" className="text-sm">
                {analiseFiltrada.length} de {analise.length} servidores
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de categorias */}
        <Card>
          <CardContent className="p-0">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <div className="border-b px-4 pt-4">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="elegibilidade" className="gap-2">
                    <UserX className="h-4 w-4 text-red-500" />
                    <span className="hidden sm:inline">Elegibilidade</span>
                    <Badge variant="destructive" className="ml-1">{stats.comPendenciaElegibilidade}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="esocial" className="gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="hidden sm:inline">eSocial</span>
                    <Badge variant="destructive" className="ml-1">{stats.comPendenciaEsocial}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="bancaria" className="gap-2">
                    <CreditCard className="h-4 w-4 text-orange-500" />
                    <span className="hidden sm:inline">Bancária</span>
                    <Badge className="ml-1 bg-orange-500">{stats.comPendenciaBancaria}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="pessoal" className="gap-2">
                    <User className="h-4 w-4 text-purple-500" />
                    <span className="hidden sm:inline">Pessoal</span>
                    <Badge className="ml-1 bg-purple-500">{stats.comPendenciaPessoal}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="completos" className="gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="hidden sm:inline">Completos</span>
                    <Badge className="ml-1 bg-green-500">{stats.completos}</Badge>
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="h-[500px]">
                <div className="p-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                  ) : dadosFiltrados.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                      <p>Nenhum servidor encontrado com esta condição.</p>
                    </div>
                  ) : (
                    <TabelaPendencias 
                      dados={dadosFiltrados} 
                      tipo={selectedTab as any} 
                      onVerDetalhes={handleVerDetalhes}
                      getPendenciasPorTipo={getPendenciasPorTipo}
                    />
                  )}
                </div>
              </ScrollArea>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

// Componente de tabela reutilizável
interface TabelaPendenciasProps {
  dados: ServidorComPendencias[];
  tipo: "elegibilidade" | "esocial" | "bancaria" | "pessoal" | "completos";
  onVerDetalhes: (id: string) => void;
  getPendenciasPorTipo: (pendencias: PendenciaItem[], tipo: any) => PendenciaItem[];
}

function TabelaPendencias({ dados, tipo, onVerDetalhes, getPendenciasPorTipo }: TabelaPendenciasProps) {
  const tipoLabel = {
    elegibilidade: "Elegibilidade",
    esocial: "eSocial",
    bancaria: "Bancária",
    pessoal: "Pessoal",
    completos: "Completos",
  }[tipo];

  const tipoCor = {
    elegibilidade: "text-red-600",
    esocial: "text-destructive",
    bancaria: "text-orange-600",
    pessoal: "text-purple-600",
    completos: "text-green-600",
  }[tipo];

  return (
    <TooltipProvider>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Servidor</TableHead>
            <TableHead className="w-[120px]">Matrícula</TableHead>
            <TableHead className="w-[120px]">CPF</TableHead>
            <TableHead className="w-[150px]">Cargo</TableHead>
            <TableHead>Pendências</TableHead>
            <TableHead className="w-[80px] text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {dados.map((item) => {
            const pendenciasTipo = tipo === "completos" 
              ? [] 
              : getPendenciasPorTipo(item.pendencias, tipo);
            
            return (
              <TableRow key={item.servidor.id}>
                <TableCell className="font-medium">{item.servidor.nome_completo}</TableCell>
                <TableCell className="font-mono">{item.servidor.matricula || "-"}</TableCell>
                <TableCell className="font-mono">{formatCPF(item.servidor.cpf)}</TableCell>
                <TableCell>{item.servidor.cargo_nome || "-"}</TableCell>
                <TableCell>
                  {tipo === "completos" ? (
                    <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">
                      Cadastro completo
                    </Badge>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {pendenciasTipo.slice(0, 3).map((p, idx) => (
                        <Tooltip key={idx}>
                          <TooltipTrigger asChild>
                            <Badge 
                              variant="outline" 
                              className={`text-xs cursor-help ${
                                tipo === "elegibilidade" 
                                  ? "border-red-300 text-red-700 bg-red-50"
                                  : tipo === "esocial"
                                  ? "border-destructive/30 text-destructive bg-destructive/10"
                                  : tipo === "bancaria"
                                  ? "border-orange-300 text-orange-700 bg-orange-50"
                                  : "border-purple-300 text-purple-700 bg-purple-50"
                              }`}
                            >
                              {p.descricao}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Campo obrigatório: {p.descricao}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                      {pendenciasTipo.length > 3 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="secondary" className="text-xs cursor-help">
                              +{pendenciasTipo.length - 3}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <ul className="text-sm">
                              {pendenciasTipo.slice(3).map((p, idx) => (
                                <li key={idx}>• {p.descricao}</li>
                              ))}
                            </ul>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => onVerDetalhes(item.servidor.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TooltipProvider>
  );
}
