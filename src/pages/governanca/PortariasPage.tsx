import { ModuleLayout } from "@/components/layout/ModuleLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scale, FileText, Calendar, Download, Search, Building2, Users, Briefcase, Shield, Loader2 } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type Documento = Tables<"documentos">;
type CategoriaPortaria = 'estruturante' | 'normativa' | 'pessoal' | 'delegacao';

const PortariasPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTipo, setSelectedTipo] = useState<string>("todas");

  const { data: documentos = [], isLoading } = useQuery({
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
      case "estruturante": return <Building2 className="w-4 h-4" />;
      case "pessoal": return <Users className="w-4 h-4" />;
      case "normativa": return <FileText className="w-4 h-4" />;
      case "delegacao": return <Briefcase className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getTipoBadgeColor = (categoria: string) => {
    switch (categoria) {
      case "estruturante": return "bg-primary/10 text-primary border-primary/20";
      case "pessoal": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "normativa": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "delegacao": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusBadge = (status: Documento["status"]) => {
    switch (status) {
      case "vigente": return <Badge variant="default" className="bg-green-600">Vigente</Badge>;
      case "publicado": return <Badge variant="default" className="bg-blue-600">Publicado</Badge>;
      case "revogado": return <Badge variant="destructive">Revogado</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const countByCategoria = (cat: CategoriaPortaria) => 
    documentos.filter(d => (d.categoria || 'normativa') === cat).length;

  return (
    <ModuleLayout module="governanca">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Badge variant="outline" className="mb-4">
            <Scale className="w-3 h-3 mr-1" />
            Governança
          </Badge>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Portarias Estruturantes
          </h1>
          <p className="text-muted-foreground">
            Atos normativos que regulamentam a organização e funcionamento do IDJUV
          </p>
        </div>

        {/* Filtros */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por número ou assunto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Tabs value={selectedTipo} onValueChange={setSelectedTipo} className="w-full md:w-auto">
                <TabsList>
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

        {/* Resumo por Tipo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {countByCategoria("estruturante")}
                  </div>
                  <div className="text-xs text-muted-foreground">Estruturantes</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {countByCategoria("normativa")}
                  </div>
                  <div className="text-xs text-muted-foreground">Normativas</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {countByCategoria("pessoal")}
                  </div>
                  <div className="text-xs text-muted-foreground">Pessoal</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Briefcase className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {countByCategoria("delegacao")}
                  </div>
                  <div className="text-xs text-muted-foreground">Delegação</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Portarias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Portarias Publicadas
              <Badge variant="secondary" className="ml-2">{filteredPortarias.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
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
                              <Calendar className="w-4 h-4" />
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
                          >
                            <Download className="w-4 h-4 mr-1" />
                            PDF
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!isLoading && filteredPortarias.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhuma portaria encontrada com os filtros selecionados.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informações Adicionais */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Sobre as Portarias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  Portarias Estruturantes
                </h4>
                <p className="text-sm text-muted-foreground">
                  Definem a organização administrativa, estrutura de cargos e competências das unidades do IDJUV.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-green-600" />
                  Portarias Normativas
                </h4>
                <p className="text-sm text-muted-foreground">
                  Estabelecem procedimentos, fluxos de trabalho e normas internas para execução das atividades.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  Portarias de Pessoal
                </h4>
                <p className="text-sm text-muted-foreground">
                  Designam servidores para funções específicas, comissões e grupos de trabalho.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-amber-600" />
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
