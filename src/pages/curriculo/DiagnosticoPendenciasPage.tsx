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
  GraduationCap,
  Filter,
  Printer,
  ArrowLeft,
  RefreshCw,
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
import type { PreCadastro } from "@/types/preCadastro";
import { gerarPdfRelatorioPendencias } from "@/lib/pdfRelatorioPendencias";
import { usePreCadastros } from "@/hooks/usePreCadastro";

interface PendenciaItem {
  tipo: "esocial" | "bancaria" | "pessoal" | "opcional";
  campo: string;
  descricao: string;
  obrigatorio: boolean;
}

interface PreCadastroComPendencias {
  preCadastro: PreCadastro;
  pendencias: PendenciaItem[];
  temPendenciaEsocial: boolean;
  temPendenciaBancaria: boolean;
  temPendenciaPessoal: boolean;
  temPendenciaOpcional: boolean;
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

// Campos de dados pessoais complementares (obrigatórios)
const CAMPOS_PESSOAIS = [
  { campo: "telefone_celular", descricao: "Telefone Celular", obrigatorio: true },
  { campo: "endereco_cep", descricao: "CEP", obrigatorio: true },
  { campo: "endereco_logradouro", descricao: "Logradouro", obrigatorio: true },
  { campo: "endereco_numero", descricao: "Número", obrigatorio: true },
  { campo: "endereco_bairro", descricao: "Bairro", obrigatorio: true },
  { campo: "endereco_cidade", descricao: "Cidade", obrigatorio: true },
  { campo: "endereco_uf", descricao: "UF", obrigatorio: true },
];

// Campos opcionais (para histórico completo)
const CAMPOS_OPCIONAIS = [
  { campo: "nome_social", descricao: "Nome Social", obrigatorio: false },
  { campo: "nacionalidade", descricao: "Nacionalidade", obrigatorio: false },
  { campo: "telefone_fixo", descricao: "Telefone Fixo", obrigatorio: false },
  { campo: "endereco_complemento", descricao: "Complemento Endereço", obrigatorio: false },
  { campo: "rg_data_emissao", descricao: "Data Emissão RG", obrigatorio: false },
  { campo: "titulo_eleitor", descricao: "Título de Eleitor", obrigatorio: false },
  { campo: "titulo_zona", descricao: "Zona Eleitoral", obrigatorio: false },
  { campo: "titulo_secao", descricao: "Seção Eleitoral", obrigatorio: false },
  { campo: "certificado_reservista", descricao: "Certificado Reservista", obrigatorio: false },
  { campo: "escolaridade", descricao: "Escolaridade", obrigatorio: false },
  { campo: "formacao_academica", descricao: "Formação Acadêmica", obrigatorio: false },
  { campo: "instituicao_ensino", descricao: "Instituição de Ensino", obrigatorio: false },
  { campo: "ano_conclusao", descricao: "Ano de Conclusão", obrigatorio: false },
  { campo: "cnh_numero", descricao: "Número CNH", obrigatorio: false },
  { campo: "cnh_categoria", descricao: "Categoria CNH", obrigatorio: false },
  { campo: "cnh_validade", descricao: "Validade CNH", obrigatorio: false },
  { campo: "registro_conselho", descricao: "Registro Conselho", obrigatorio: false },
  { campo: "conselho_numero", descricao: "Número Conselho", obrigatorio: false },
  { campo: "experiencia_resumo", descricao: "Experiência Profissional", obrigatorio: false },
  { campo: "foto_url", descricao: "Foto", obrigatorio: false },
];

type FiltroIncompleto = "todos" | "incompletos" | "com_obrigatorios" | "completos";

function verificarPendencias(pc: PreCadastro): PendenciaItem[] {
  const pendencias: PendenciaItem[] = [];

  CAMPOS_ESOCIAL.forEach(({ campo, descricao, obrigatorio }) => {
    const valor = pc[campo as keyof PreCadastro];
    if (!valor || (typeof valor === "string" && valor.trim() === "")) {
      pendencias.push({ tipo: "esocial", campo, descricao, obrigatorio });
    }
  });

  CAMPOS_BANCARIOS.forEach(({ campo, descricao, obrigatorio }) => {
    const valor = pc[campo as keyof PreCadastro];
    if (!valor || (typeof valor === "string" && valor.trim() === "")) {
      pendencias.push({ tipo: "bancaria", campo, descricao, obrigatorio });
    }
  });

  CAMPOS_PESSOAIS.forEach(({ campo, descricao, obrigatorio }) => {
    const valor = pc[campo as keyof PreCadastro];
    if (!valor || (typeof valor === "string" && valor.trim() === "")) {
      pendencias.push({ tipo: "pessoal", campo, descricao, obrigatorio });
    }
  });

  CAMPOS_OPCIONAIS.forEach(({ campo, descricao, obrigatorio }) => {
    const valor = pc[campo as keyof PreCadastro];
    if (!valor || (typeof valor === "string" && valor.trim() === "")) {
      pendencias.push({ tipo: "opcional", campo, descricao, obrigatorio });
    }
  });

  return pendencias;
}

export default function DiagnosticoPendenciasPage() {
  const navigate = useNavigate();
  const { preCadastros, isLoading, refetch } = usePreCadastros();
  const [selectedTab, setSelectedTab] = useState("esocial");
  const [filtroIncompleto, setFiltroIncompleto] = useState<FiltroIncompleto>("todos");

  // Filtrar apenas pré-cadastros enviados ou aprovados
  const preCadastrosRelevantes = useMemo(() => {
    return (preCadastros || []).filter(
      (pc) => pc.status === "enviado" || pc.status === "aprovado"
    );
  }, [preCadastros]);

  // Analisar pendências de cada pré-cadastro
  const analise = useMemo<PreCadastroComPendencias[]>(() => {
    return preCadastrosRelevantes.map((pc) => {
      const pendencias = verificarPendencias(pc);
      return {
        preCadastro: pc,
        pendencias,
        temPendenciaEsocial: pendencias.some((p) => p.tipo === "esocial"),
        temPendenciaBancaria: pendencias.some((p) => p.tipo === "bancaria"),
        temPendenciaPessoal: pendencias.some((p) => p.tipo === "pessoal"),
        temPendenciaOpcional: pendencias.some((p) => p.tipo === "opcional"),
      };
    });
  }, [preCadastrosRelevantes]);

  // Aplicar filtro de incompletos
  const analiseFiltrada = useMemo(() => {
    switch (filtroIncompleto) {
      case "incompletos":
        return analise.filter(
          (a) => a.temPendenciaEsocial || a.temPendenciaBancaria || a.temPendenciaPessoal || a.temPendenciaOpcional
        );
      case "com_obrigatorios":
        return analise.filter(
          (a) => a.temPendenciaEsocial || a.temPendenciaBancaria || a.temPendenciaPessoal
        );
      case "completos":
        return analise.filter(
          (a) => !a.temPendenciaEsocial && !a.temPendenciaBancaria && !a.temPendenciaPessoal
        );
      default:
        return analise;
    }
  }, [analise, filtroIncompleto]);

  // Estatísticas
  const stats = useMemo(() => {
    const comPendenciaEsocial = analise.filter((a) => a.temPendenciaEsocial).length;
    const comPendenciaBancaria = analise.filter((a) => a.temPendenciaBancaria).length;
    const comPendenciaPessoal = analise.filter((a) => a.temPendenciaPessoal).length;
    const comPendenciaOpcional = analise.filter((a) => a.temPendenciaOpcional).length;
    const completos = analise.filter(
      (a) => !a.temPendenciaEsocial && !a.temPendenciaBancaria && !a.temPendenciaPessoal
    ).length;

    return {
      total: analise.length,
      comPendenciaEsocial,
      comPendenciaBancaria,
      comPendenciaPessoal,
      comPendenciaOpcional,
      completos,
    };
  }, [analise]);

  // Filtrar por tab selecionada
  const dadosFiltrados = useMemo(() => {
    switch (selectedTab) {
      case "esocial":
        return analiseFiltrada.filter((a) => a.temPendenciaEsocial);
      case "bancaria":
        return analiseFiltrada.filter((a) => a.temPendenciaBancaria);
      case "pessoal":
        return analiseFiltrada.filter((a) => a.temPendenciaPessoal);
      case "opcional":
        return analiseFiltrada.filter((a) => a.temPendenciaOpcional);
      case "completos":
        return analiseFiltrada.filter(
          (a) => !a.temPendenciaEsocial && !a.temPendenciaBancaria && !a.temPendenciaPessoal
        );
      default:
        return analiseFiltrada;
    }
  }, [analiseFiltrada, selectedTab]);

  const getPendenciasPorTipo = (
    pendencias: PendenciaItem[],
    tipo: "esocial" | "bancaria" | "pessoal" | "opcional"
  ) => {
    return pendencias.filter((p) => p.tipo === tipo);
  };

  const handleVerDetalhes = (pc: PreCadastro) => {
    navigate(`/sistema/pre-cadastros`);
  };

  const handleImprimir = () => {
    const filtroTexto = {
      todos: "Todos os pré-cadastros",
      incompletos: "Qualquer pendência",
      com_obrigatorios: "Pendências obrigatórias",
      completos: "Dados obrigatórios completos",
    }[filtroIncompleto];
    gerarPdfRelatorioPendencias(analiseFiltrada, stats, filtroTexto);
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
                Diagnóstico de Pendências
              </h1>
              <p className="text-muted-foreground">
                Verificação de dados obrigatórios e opcionais para eSocial, remessa bancária e cadastro completo
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
            <Button onClick={handleImprimir} className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimir Relatório
            </Button>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Total Analisados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{stats.total}</p>
            </CardContent>
          </Card>

          <Card className="border-destructive/30 bg-destructive/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Pendências eSocial
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-destructive">{stats.comPendenciaEsocial}</p>
            </CardContent>
          </Card>

          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-orange-600 flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Pendências Bancárias
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
                Pendências Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-purple-600">{stats.comPendenciaPessoal}</p>
            </CardContent>
          </Card>

          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Campos Opcionais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{stats.comPendenciaOpcional}</p>
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
                  <SelectItem value="todos">Todos os pré-cadastros</SelectItem>
                  <SelectItem value="incompletos">Qualquer pendência</SelectItem>
                  <SelectItem value="com_obrigatorios">Pendências obrigatórias</SelectItem>
                  <SelectItem value="completos">Dados obrigatórios completos</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="secondary" className="text-sm">
                {analiseFiltrada.length} de {analise.length} registros
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
                  <TabsTrigger value="esocial" className="gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <span className="hidden sm:inline">eSocial</span>
                    <Badge variant="destructive" className="ml-1">{stats.comPendenciaEsocial}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="bancaria" className="gap-2">
                    <Building2 className="h-4 w-4 text-orange-500" />
                    <span className="hidden sm:inline">Bancária</span>
                    <Badge className="ml-1 bg-orange-500">{stats.comPendenciaBancaria}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="pessoal" className="gap-2">
                    <User className="h-4 w-4 text-purple-500" />
                    <span className="hidden sm:inline">Pessoal</span>
                    <Badge className="ml-1 bg-purple-500">{stats.comPendenciaPessoal}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="opcional" className="gap-2">
                    <GraduationCap className="h-4 w-4 text-blue-500" />
                    <span className="hidden sm:inline">Opcionais</span>
                    <Badge className="ml-1 bg-blue-500">{stats.comPendenciaOpcional}</Badge>
                  </TabsTrigger>
                  <TabsTrigger value="completos" className="gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <span className="hidden sm:inline">Completos</span>
                    <Badge className="ml-1 bg-green-500">{stats.completos}</Badge>
                  </TabsTrigger>
                </TabsList>
              </div>

              <ScrollArea className="h-[calc(100vh-520px)] min-h-[400px]">
                <div className="p-4">
                  <TabsContent value="esocial" className="mt-0">
                    <TabelaPendencias
                      dados={dadosFiltrados}
                      tipo="esocial"
                      onVerDetalhes={handleVerDetalhes}
                      getPendenciasPorTipo={getPendenciasPorTipo}
                    />
                  </TabsContent>

                  <TabsContent value="bancaria" className="mt-0">
                    <TabelaPendencias
                      dados={dadosFiltrados}
                      tipo="bancaria"
                      onVerDetalhes={handleVerDetalhes}
                      getPendenciasPorTipo={getPendenciasPorTipo}
                    />
                  </TabsContent>

                  <TabsContent value="pessoal" className="mt-0">
                    <TabelaPendencias
                      dados={dadosFiltrados}
                      tipo="pessoal"
                      onVerDetalhes={handleVerDetalhes}
                      getPendenciasPorTipo={getPendenciasPorTipo}
                    />
                  </TabsContent>

                  <TabsContent value="opcional" className="mt-0">
                    <TabelaPendencias
                      dados={dadosFiltrados}
                      tipo="opcional"
                      onVerDetalhes={handleVerDetalhes}
                      getPendenciasPorTipo={getPendenciasPorTipo}
                    />
                  </TabsContent>

                  <TabsContent value="completos" className="mt-0">
                    <TabelaPendencias
                      dados={dadosFiltrados}
                      tipo="completos"
                      onVerDetalhes={handleVerDetalhes}
                      getPendenciasPorTipo={getPendenciasPorTipo}
                    />
                  </TabsContent>
                </div>
              </ScrollArea>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

interface TabelaPendenciasProps {
  dados: PreCadastroComPendencias[];
  tipo: "esocial" | "bancaria" | "pessoal" | "opcional" | "completos";
  onVerDetalhes: (pc: PreCadastro) => void;
  getPendenciasPorTipo: (
    pendencias: PendenciaItem[],
    tipo: "esocial" | "bancaria" | "pessoal" | "opcional"
  ) => PendenciaItem[];
}

function TabelaPendencias({
  dados,
  tipo,
  onVerDetalhes,
  getPendenciasPorTipo,
}: TabelaPendenciasProps) {
  if (dados.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <CheckCircle2 className="h-12 w-12 mb-4 text-green-500" />
        <p className="text-lg font-medium">
          {tipo === "completos"
            ? "Nenhum cadastro completo encontrado"
            : "Nenhuma pendência encontrada nesta categoria"}
        </p>
        <p className="text-sm">
          {tipo === "completos"
            ? "Os pré-cadastros ainda possuem pendências obrigatórias"
            : "Todos os campos desta categoria estão preenchidos"}
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[250px]">Nome</TableHead>
          <TableHead className="w-[140px]">CPF</TableHead>
          <TableHead className="w-[100px]">Status</TableHead>
          {tipo !== "completos" && <TableHead>Campos Pendentes</TableHead>}
          <TableHead className="w-[100px] text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dados.map((item) => {
          const pendenciasDoTipo =
            tipo !== "completos"
              ? getPendenciasPorTipo(item.pendencias, tipo as "esocial" | "bancaria" | "pessoal" | "opcional")
              : [];

          return (
            <TableRow key={item.preCadastro.id}>
              <TableCell className="font-medium">
                {item.preCadastro.nome_completo || "-"}
              </TableCell>
              <TableCell>{formatCPF(item.preCadastro.cpf) || "-"}</TableCell>
              <TableCell>
                <Badge
                  variant={item.preCadastro.status === "aprovado" ? "default" : "secondary"}
                >
                  {item.preCadastro.status === "aprovado" ? "Aprovado" : "Enviado"}
                </Badge>
              </TableCell>
              {tipo !== "completos" && (
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {pendenciasDoTipo.map((p) => (
                      <Badge
                        key={p.campo}
                        variant="outline"
                        className="text-xs bg-muted"
                      >
                        {p.descricao}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
              )}
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onVerDetalhes(item.preCadastro)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
