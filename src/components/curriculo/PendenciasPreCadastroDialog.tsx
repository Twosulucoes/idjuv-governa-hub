import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preCadastros: PreCadastro[];
  onVerDetalhes: (pc: PreCadastro) => void;
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

  // Verificar campos eSocial
  CAMPOS_ESOCIAL.forEach(({ campo, descricao, obrigatorio }) => {
    const valor = pc[campo as keyof PreCadastro];
    if (!valor || (typeof valor === "string" && valor.trim() === "")) {
      pendencias.push({ tipo: "esocial", campo, descricao, obrigatorio });
    }
  });

  // Verificar campos bancários
  CAMPOS_BANCARIOS.forEach(({ campo, descricao, obrigatorio }) => {
    const valor = pc[campo as keyof PreCadastro];
    if (!valor || (typeof valor === "string" && valor.trim() === "")) {
      pendencias.push({ tipo: "bancaria", campo, descricao, obrigatorio });
    }
  });

  // Verificar campos pessoais
  CAMPOS_PESSOAIS.forEach(({ campo, descricao, obrigatorio }) => {
    const valor = pc[campo as keyof PreCadastro];
    if (!valor || (typeof valor === "string" && valor.trim() === "")) {
      pendencias.push({ tipo: "pessoal", campo, descricao, obrigatorio });
    }
  });

  // Verificar campos opcionais
  CAMPOS_OPCIONAIS.forEach(({ campo, descricao, obrigatorio }) => {
    const valor = pc[campo as keyof PreCadastro];
    if (!valor || (typeof valor === "string" && valor.trim() === "")) {
      pendencias.push({ tipo: "opcional", campo, descricao, obrigatorio });
    }
  });

  return pendencias;
}

export function PendenciasPreCadastroDialog({
  open,
  onOpenChange,
  preCadastros,
  onVerDetalhes,
}: Props) {
  const [selectedTab, setSelectedTab] = useState("esocial");
  const [filtroIncompleto, setFiltroIncompleto] = useState<FiltroIncompleto>("todos");

  // Filtrar apenas pré-cadastros enviados ou aprovados
  const preCadastrosRelevantes = useMemo(() => {
    return preCadastros.filter(
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Diagnóstico de Pendências
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const filtroTexto = {
                  todos: "Todos os pré-cadastros",
                  incompletos: "Qualquer pendência",
                  com_obrigatorios: "Pendências obrigatórias",
                  completos: "Dados obrigatórios completos",
                }[filtroIncompleto];
                gerarPdfRelatorioPendencias(analiseFiltrada, stats, filtroTexto);
              }}
              className="gap-2"
            >
              <Printer className="h-4 w-4" />
              Imprimir Relatório
            </Button>
          </div>
          <DialogDescription>
            Verificação de dados obrigatórios e opcionais para eSocial, remessa bancária e cadastro completo
          </DialogDescription>
        </DialogHeader>

        {/* Filtro de incompletos */}
        <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-lg">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtrar:</span>
          <Select value={filtroIncompleto} onValueChange={(v) => setFiltroIncompleto(v as FiltroIncompleto)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os pré-cadastros</SelectItem>
              <SelectItem value="incompletos">Qualquer pendência</SelectItem>
              <SelectItem value="com_obrigatorios">Pendências obrigatórias</SelectItem>
              <SelectItem value="completos">Dados obrigatórios completos</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground ml-2">
            ({analiseFiltrada.length} de {analise.length} registros)
          </span>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card className="border-border">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Analisados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="text-xl font-bold text-destructive">
                    {stats.comPendenciaEsocial}
                  </p>
                  <p className="text-xs text-muted-foreground">eSocial</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-xl font-bold text-orange-600">
                    {stats.comPendenciaBancaria}
                  </p>
                  <p className="text-xs text-muted-foreground">Bancária</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-500/30 bg-blue-500/5">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-xl font-bold text-blue-600">
                    {stats.comPendenciaOpcional}
                  </p>
                  <p className="text-xs text-muted-foreground">Opcionais</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-xl font-bold text-green-600">
                    {stats.completos}
                  </p>
                  <p className="text-xs text-muted-foreground">Completos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de categorias */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="esocial" className="text-xs">
              <AlertTriangle className="h-3 w-3 mr-1 text-destructive" />
              eSocial ({stats.comPendenciaEsocial})
            </TabsTrigger>
            <TabsTrigger value="bancaria" className="text-xs">
              <Building2 className="h-3 w-3 mr-1 text-orange-500" />
              Bancária ({stats.comPendenciaBancaria})
            </TabsTrigger>
            <TabsTrigger value="pessoal" className="text-xs">
              <User className="h-3 w-3 mr-1 text-purple-500" />
              Pessoal ({stats.comPendenciaPessoal})
            </TabsTrigger>
            <TabsTrigger value="opcional" className="text-xs">
              <GraduationCap className="h-3 w-3 mr-1 text-blue-500" />
              Opcionais ({stats.comPendenciaOpcional})
            </TabsTrigger>
            <TabsTrigger value="completos" className="text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
              Completos ({stats.completos})
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[320px] mt-4">
            <TabsContent value="esocial" className="mt-0">
              <TabelaPendencias
                dados={dadosFiltrados}
                tipo="esocial"
                onVerDetalhes={onVerDetalhes}
                getPendenciasPorTipo={getPendenciasPorTipo}
              />
            </TabsContent>

            <TabsContent value="bancaria" className="mt-0">
              <TabelaPendencias
                dados={dadosFiltrados}
                tipo="bancaria"
                onVerDetalhes={onVerDetalhes}
                getPendenciasPorTipo={getPendenciasPorTipo}
              />
            </TabsContent>

            <TabsContent value="pessoal" className="mt-0">
              <TabelaPendencias
                dados={dadosFiltrados}
                tipo="pessoal"
                onVerDetalhes={onVerDetalhes}
                getPendenciasPorTipo={getPendenciasPorTipo}
              />
            </TabsContent>

            <TabsContent value="opcional" className="mt-0">
              <TabelaPendencias
                dados={dadosFiltrados}
                tipo="opcional"
                onVerDetalhes={onVerDetalhes}
                getPendenciasPorTipo={getPendenciasPorTipo}
              />
            </TabsContent>

            <TabsContent value="completos" className="mt-0">
              <TabelaPendencias
                dados={dadosFiltrados}
                tipo="completos"
                onVerDetalhes={onVerDetalhes}
                getPendenciasPorTipo={getPendenciasPorTipo}
              />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
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
        {tipo === "completos" ? (
          <>
            <CheckCircle2 className="h-12 w-12 mb-3 text-green-500" />
            <p>Nenhum pré-cadastro com dados obrigatórios completos</p>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-12 w-12 mb-3 text-green-500" />
            <p>Nenhuma pendência encontrada nesta categoria</p>
          </>
        )}
      </div>
    );
  }

  const getBadgeColor = (tipoP: string) => {
    switch (tipoP) {
      case "esocial":
        return "bg-destructive/10 text-destructive border-destructive/30";
      case "bancaria":
        return "bg-orange-500/10 text-orange-600 border-orange-500/30";
      case "pessoal":
        return "bg-purple-500/10 text-purple-600 border-purple-500/30";
      case "opcional":
        return "bg-blue-500/10 text-blue-600 border-blue-500/30";
      default:
        return "";
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>CPF</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>
            {tipo === "completos" ? "Situação" : "Campos Pendentes"}
          </TableHead>
          <TableHead className="w-[60px]">Ação</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {dados.map(({ preCadastro, pendencias }) => {
          const pendenciasTipo =
            tipo === "completos"
              ? []
              : getPendenciasPorTipo(pendencias, tipo as "esocial" | "bancaria" | "pessoal" | "opcional");

          return (
            <TableRow key={preCadastro.id}>
              <TableCell className="font-medium">
                {preCadastro.nome_completo}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {formatCPF(preCadastro.cpf)}
              </TableCell>
              <TableCell>
                <Badge
                  variant={
                    preCadastro.status === "aprovado" ? "outline" : "default"
                  }
                  className="text-xs"
                >
                  {preCadastro.status === "aprovado" ? "Aprovado" : "Enviado"}
                </Badge>
              </TableCell>
              <TableCell>
                {tipo === "completos" ? (
                  <Badge
                    variant="outline"
                    className="bg-green-500/10 text-green-600 border-green-500/30"
                  >
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Dados obrigatórios completos
                  </Badge>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {pendenciasTipo.slice(0, 3).map((p) => (
                      <Badge
                        key={p.campo}
                        variant="outline"
                        className={`text-xs ${getBadgeColor(tipo)}`}
                      >
                        {p.descricao}
                      </Badge>
                    ))}
                    {pendenciasTipo.length > 3 && (
                      <Badge variant="secondary" className="text-xs">
                        +{pendenciasTipo.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onVerDetalhes(preCadastro)}
                  title="Ver detalhes"
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
