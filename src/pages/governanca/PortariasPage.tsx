import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { EmptyState, KpiCard, PageHeader, StatusBadge, type TomStatus } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Calendar, Download, Search, Building2, Users, Briefcase, Shield, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useIdentidade } from "@/core/tenant";

type Documento = Tables<"documentos">;
type CategoriaPortaria = 'estruturante' | 'normativa' | 'pessoal' | 'delegacao';

// Situação do documento → rótulo e tom (status nunca só por cor)
const SITUACAO_PORTARIA: Record<string, { label: string; tom: TomStatus }> = {
  vigente: { label: "Vigente", tom: "sucesso" },
  publicado: { label: "Publicado", tom: "andamento" },
  revogado: { label: "Revogado", tom: "erro" },
};

const PortariasPage = () => {
  const { sigla } = useIdentidade();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTipo, setSelectedTipo] = useState<string>("todas");

  const { data: documentos = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["portarias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documentos")
        .select("*")
        .eq("tipo", "portaria")
        .in("status", ["publicado", "vigente"])
        .order("data_documento", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const filteredPortarias = documentos.filter(doc => {
    const matchSearch = 
      (doc.ementa?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (doc.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      doc.numero.toLowerCase().includes(searchTerm.toLowerCase());
    
    const categoria = doc.categoria || 'normativa';
    const matchTipo = selectedTipo === "todas" || categoria === selectedTipo;
    
    return matchSearch && matchTipo;
  });

  const getTipoIcon = (categoria: string) => {
    switch (categoria) {
      case "estruturante": return <Building2 className="w-4 h-4" aria-hidden="true" />;
      case "pessoal": return <Users className="w-4 h-4" aria-hidden="true" />;
      case "normativa": return <FileText className="w-4 h-4" aria-hidden="true" />;
      case "delegacao": return <Briefcase className="w-4 h-4" aria-hidden="true" />;
      default: return <FileText className="w-4 h-4" aria-hidden="true" />;
    }
  };

  const getTipoBadgeColor = (categoria: string) => {
    switch (categoria) {
      case "estruturante": return "bg-primary/10 text-primary border-primary/20";
      case "pessoal": return "bg-info/10 text-info border-info/20";
      case "normativa": return "bg-success/10 text-success border-success/20";
      case "delegacao": return "bg-warning/10 text-warning border-warning/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusBadge = (status: Documento["status"]) => {
    const situacao = SITUACAO_PORTARIA[status ?? ""];
    return situacao ? (
      <StatusBadge tom={situacao.tom}>{situacao.label}</StatusBadge>
    ) : (
      <StatusBadge>{status ?? "—"}</StatusBadge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const countByCategoria = (cat: CategoriaPortaria) => 
    documentos.filter(d => (d.categoria || 'normativa') === cat).length;

  return (
    <ModuleLayout module="governanca">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Governança", href: "/governanca" }, { rotulo: "Portarias" }]}
          titulo="Portarias estruturantes"
          descricao={`Atos normativos que regulamentam a organização e funcionamento do ${sigla}`}
        />

        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription className="flex flex-wrap items-center gap-2">
              Não foi possível carregar as portarias.
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder="Buscar por número ou assunto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  aria-label="Buscar portaria por número ou assunto"
                />
              </div>
              <Tabs value={selectedTipo} onValueChange={setSelectedTipo} className="w-full md:w-auto">
                <TabsList aria-label="Filtrar por categoria">
                  <TabsTrigger value="todas">Todas</TabsTrigger>
                  <TabsTrigger value="estruturante">Estruturantes</TabsTrigger>
                  <TabsTrigger value="normativa">Normativas</TabsTrigger>
                  <TabsTrigger value="pessoal">Pessoal</TabsTrigger>
                  <TabsTrigger value="delegacao">Delegação</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardContent>
        </Card>

        {/* Resumo por tipo */}
        <section aria-labelledby="portarias-resumo">
          <h2 id="portarias-resumo" className="sr-only">Resumo por categoria</h2>
          <ul className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {([
              { rotulo: "Estruturantes", categoria: "estruturante", icone: Building2 },
              { rotulo: "Normativas", categoria: "normativa", icone: FileText },
              { rotulo: "Pessoal", categoria: "pessoal", icone: Users },
              { rotulo: "Delegação", categoria: "delegacao", icone: Briefcase },
            ] as const).map((item) => (
              <li key={item.categoria}>
                <KpiCard
                  rotulo={item.rotulo}
                  valor={isError ? "—" : countByCategoria(item.categoria)}
                  icone={item.icone}
                  carregando={isLoading}
                  className="h-full"
                />
              </li>
            ))}
          </ul>
        </section>

        {/* Lista de Portarias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" aria-hidden="true" />
              Portarias publicadas
              <Badge variant="secondary" className="ml-2">{filteredPortarias.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" aria-hidden="true" />
                <span className="sr-only">Carregando portarias…</span>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPortarias.map((doc) => {
                  const categoria = doc.categoria || 'normativa';
                  return (
                    <div
                      key={doc.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex flex-col md:flex-row md:items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-semibold text-lg">
                              Portaria nº {doc.numero}
                            </span>
                            {getStatusBadge(doc.status)}
                          </div>
                          
                          <p className="text-muted-foreground mb-3">
                            {doc.ementa || doc.titulo}
                          </p>
                          
                          <div className="flex flex-wrap items-center gap-3 text-sm">
                            <Badge variant="outline" className={getTipoBadgeColor(categoria)}>
                              {getTipoIcon(categoria)}
                              <span className="ml-1 capitalize">{categoria}</span>
                            </Badge>
                            
                            <span className="flex items-center gap-1 text-muted-foreground">
                              <Calendar className="w-4 h-4" aria-hidden="true" />
                              {formatDate(doc.data_documento)}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            disabled={!doc.arquivo_url}
                            onClick={() => doc.arquivo_url && window.open(doc.arquivo_url, '_blank')}
                            aria-label={`Baixar PDF da Portaria nº ${doc.numero}`}
                          >
                            <Download className="w-4 h-4 mr-1" aria-hidden="true" />
                            PDF
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!isLoading && !isError && filteredPortarias.length === 0 && (
              <EmptyState
                icone={FileText}
                titulo="Nenhuma portaria encontrada"
                descricao="Ajuste a busca ou a categoria selecionada."
              />
            )}
          </CardContent>
        </Card>

        {/* Informações Adicionais */}
        <Card>
          <CardHeader>
            <CardTitle>Sobre as portarias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" aria-hidden="true" />
                  Portarias Estruturantes
                </h4>
                <p className="text-sm text-muted-foreground">
                  Definem a organização administrativa, estrutura de cargos e competências das unidades do IDJUV.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-success" aria-hidden="true" />
                  Portarias Normativas
                </h4>
                <p className="text-sm text-muted-foreground">
                  Estabelecem procedimentos, fluxos de trabalho e normas internas para execução das atividades.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-info" aria-hidden="true" />
                  Portarias de Pessoal
                </h4>
                <p className="text-sm text-muted-foreground">
                  Designam servidores para funções específicas, comissões e grupos de trabalho.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-warning" aria-hidden="true" />
                  Portarias de Delegação
                </h4>
                <p className="text-sm text-muted-foreground">
                  Delegam competências da Presidência aos Diretores e demais gestores.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
};

export default PortariasPage;
