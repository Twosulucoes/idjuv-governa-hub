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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCPF } from "@/lib/formatters";
import type { PreCadastro } from "@/types/preCadastro";

interface PendenciaItem {
  tipo: "esocial" | "bancaria" | "pessoal";
  campo: string;
  descricao: string;
}

interface PreCadastroComPendencias {
  preCadastro: PreCadastro;
  pendencias: PendenciaItem[];
  temPendenciaEsocial: boolean;
  temPendenciaBancaria: boolean;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preCadastros: PreCadastro[];
  onVerDetalhes: (pc: PreCadastro) => void;
}

// Campos obrigatórios para eSocial
const CAMPOS_ESOCIAL = [
  { campo: "data_nascimento", descricao: "Data de Nascimento" },
  { campo: "pis_pasep", descricao: "PIS/PASEP" },
  { campo: "sexo", descricao: "Sexo" },
  { campo: "estado_civil", descricao: "Estado Civil" },
  { campo: "naturalidade_cidade", descricao: "Naturalidade (Cidade)" },
  { campo: "naturalidade_uf", descricao: "Naturalidade (UF)" },
  { campo: "rg", descricao: "RG" },
  { campo: "rg_orgao_expedidor", descricao: "Órgão Expedidor RG" },
  { campo: "rg_uf", descricao: "UF do RG" },
];

// Campos obrigatórios para remessa bancária
const CAMPOS_BANCARIOS = [
  { campo: "banco_codigo", descricao: "Código do Banco" },
  { campo: "banco_nome", descricao: "Nome do Banco" },
  { campo: "banco_agencia", descricao: "Agência" },
  { campo: "banco_conta", descricao: "Conta" },
  { campo: "banco_tipo_conta", descricao: "Tipo de Conta" },
];

// Campos de dados pessoais complementares
const CAMPOS_PESSOAIS = [
  { campo: "telefone_celular", descricao: "Telefone Celular" },
  { campo: "endereco_cep", descricao: "CEP" },
  { campo: "endereco_logradouro", descricao: "Logradouro" },
  { campo: "endereco_numero", descricao: "Número" },
  { campo: "endereco_bairro", descricao: "Bairro" },
  { campo: "endereco_cidade", descricao: "Cidade" },
  { campo: "endereco_uf", descricao: "UF" },
];

function verificarPendencias(pc: PreCadastro): PendenciaItem[] {
  const pendencias: PendenciaItem[] = [];

  // Verificar campos eSocial
  CAMPOS_ESOCIAL.forEach(({ campo, descricao }) => {
    const valor = pc[campo as keyof PreCadastro];
    if (!valor || (typeof valor === "string" && valor.trim() === "")) {
      pendencias.push({ tipo: "esocial", campo, descricao });
    }
  });

  // Verificar campos bancários
  CAMPOS_BANCARIOS.forEach(({ campo, descricao }) => {
    const valor = pc[campo as keyof PreCadastro];
    if (!valor || (typeof valor === "string" && valor.trim() === "")) {
      pendencias.push({ tipo: "bancaria", campo, descricao });
    }
  });

  // Verificar campos pessoais
  CAMPOS_PESSOAIS.forEach(({ campo, descricao }) => {
    const valor = pc[campo as keyof PreCadastro];
    if (!valor || (typeof valor === "string" && valor.trim() === "")) {
      pendencias.push({ tipo: "pessoal", campo, descricao });
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
      };
    });
  }, [preCadastrosRelevantes]);

  // Estatísticas
  const stats = useMemo(() => {
    const comPendenciaEsocial = analise.filter((a) => a.temPendenciaEsocial).length;
    const comPendenciaBancaria = analise.filter((a) => a.temPendenciaBancaria).length;
    const completos = analise.filter(
      (a) => !a.temPendenciaEsocial && !a.temPendenciaBancaria
    ).length;

    return {
      total: analise.length,
      comPendenciaEsocial,
      comPendenciaBancaria,
      completos,
    };
  }, [analise]);

  // Filtrar por tab selecionada
  const dadosFiltrados = useMemo(() => {
    switch (selectedTab) {
      case "esocial":
        return analise.filter((a) => a.temPendenciaEsocial);
      case "bancaria":
        return analise.filter((a) => a.temPendenciaBancaria);
      case "completos":
        return analise.filter(
          (a) => !a.temPendenciaEsocial && !a.temPendenciaBancaria
        );
      default:
        return analise;
    }
  }, [analise, selectedTab]);

  const getPendenciasPorTipo = (
    pendencias: PendenciaItem[],
    tipo: "esocial" | "bancaria" | "pessoal"
  ) => {
    return pendencias.filter((p) => p.tipo === tipo);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Diagnóstico de Pendências
          </DialogTitle>
          <DialogDescription>
            Verificação de dados obrigatórios para eSocial e remessa bancária
          </DialogDescription>
        </DialogHeader>

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                  <p className="text-xs text-muted-foreground">Pend. eSocial</p>
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
                  <p className="text-xs text-muted-foreground">Pend. Bancária</p>
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="esocial" className="text-xs sm:text-sm">
              <AlertTriangle className="h-3 w-3 mr-1 text-destructive" />
              eSocial ({stats.comPendenciaEsocial})
            </TabsTrigger>
            <TabsTrigger value="bancaria" className="text-xs sm:text-sm">
              <Building2 className="h-3 w-3 mr-1 text-orange-500" />
              Bancária ({stats.comPendenciaBancaria})
            </TabsTrigger>
            <TabsTrigger value="completos" className="text-xs sm:text-sm">
              <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
              Completos ({stats.completos})
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[350px] mt-4">
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
  tipo: "esocial" | "bancaria" | "completos";
  onVerDetalhes: (pc: PreCadastro) => void;
  getPendenciasPorTipo: (
    pendencias: PendenciaItem[],
    tipo: "esocial" | "bancaria" | "pessoal"
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
            <p>Nenhum pré-cadastro com dados completos</p>
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
              : tipo === "esocial"
              ? getPendenciasPorTipo(pendencias, "esocial")
              : getPendenciasPorTipo(pendencias, "bancaria");

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
                    Dados completos
                  </Badge>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {pendenciasTipo.slice(0, 3).map((p) => (
                      <Badge
                        key={p.campo}
                        variant="outline"
                        className="text-xs bg-destructive/10 text-destructive border-destructive/30"
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
