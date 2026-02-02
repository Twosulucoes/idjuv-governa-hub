import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  FileText, 
  Search, 
  Download,
  Building2,
  ExternalLink,
  Gavel
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LicitacaoPublica {
  id: string;
  numero_processo: string;
  ano: number;
  modalidade: string;
  objeto: string;
  situacao: string;
  valor_estimado: number | null;
  data_abertura: string | null;
  data_homologacao: string | null;
  unidade_requisitante: string | null;
  vencedor_nome: string | null;
  vencedor_documento_parcial: string | null;
}

export default function LicitacoesPublicasPage() {
  const [filtroAno, setFiltroAno] = useState<string>("todos");
  const [filtroModalidade, setFiltroModalidade] = useState<string>("todos");
  const [busca, setBusca] = useState("");

  // LGPD-Safe: Busca apenas fornecedores pessoa jurídica
  const { data: licitacoes, isLoading } = useQuery({
    queryKey: ['transparencia-licitacoes', filtroAno, filtroModalidade],
    queryFn: async () => {
      let query = supabase
        .from('processos_licitatorios')
        .select(`
          id,
          numero_processo,
          ano,
          modalidade,
          objeto,
          fase_atual,
          valor_estimado,
          data_abertura,
          data_homologacao,
          unidade_requisitante_id,
          estrutura_organizacional!processos_licitatorios_unidade_requisitante_id_fkey(nome),
          fornecedores!processos_licitatorios_fornecedor_id_fkey(razao_social, tipo_pessoa, cnpj)
        `)
        .order('ano', { ascending: false })
        .order('numero_processo', { ascending: false });

      if (filtroAno !== "todos") {
        query = query.eq('ano', parseInt(filtroAno));
      }
      if (filtroModalidade !== "todos") {
        query = query.eq('modalidade', filtroModalidade as any);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      
      // LGPD-Safe: Exclui pessoa física, mascara CNPJ
      return (data || [])
        .filter((item: any) => 
          !item.fornecedores || item.fornecedores.tipo_pessoa !== 'fisica'
        )
        .map((item: any) => ({
          id: item.id,
          numero_processo: item.numero_processo,
          ano: item.ano,
          modalidade: item.modalidade,
          objeto: item.objeto,
          situacao: item.fase_atual,
          valor_estimado: item.valor_estimado,
          data_abertura: item.data_abertura,
          data_homologacao: item.data_homologacao,
          unidade_requisitante: item.estrutura_organizacional?.nome,
          // Apenas razão social de PJ (nunca nome de pessoa física)
          vencedor_nome: item.fornecedores?.tipo_pessoa === 'juridica' 
            ? item.fornecedores?.razao_social 
            : null,
          // CNPJ mascarado (nunca CPF)
          vencedor_documento_parcial: item.fornecedores?.cnpj 
            ? `${item.fornecedores.cnpj.substring(0, 8)}****${item.fornecedores.cnpj.substring(12)}`
            : null
        })) as LicitacaoPublica[];
    }
  });

  const licitacoesFiltradas = (licitacoes || []).filter(lic => 
    busca === "" || 
    lic.objeto?.toLowerCase().includes(busca.toLowerCase()) ||
    lic.numero_processo?.toLowerCase().includes(busca.toLowerCase())
  );

  const formatCurrency = (value: number | null) => {
    if (!value) return "-";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getSituacaoBadge = (situacao: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      'em_andamento': 'default',
      'homologado': 'secondary',
      'revogado': 'destructive',
      'deserto': 'outline',
      'fracassado': 'destructive',
    };
    const labels: Record<string, string> = {
      'em_andamento': 'Em Andamento',
      'homologado': 'Homologado',
      'revogado': 'Revogado',
      'deserto': 'Deserto',
      'fracassado': 'Fracassado',
      'publicado': 'Publicado',
      'julgamento': 'Em Julgamento',
    };
    return (
      <Badge variant={variants[situacao] || 'outline'}>
        {labels[situacao] || situacao}
      </Badge>
    );
  };

  const anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <MainLayout>
      {/* Cabeçalho */}
      <section className="bg-primary text-primary-foreground py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 text-sm mb-4 opacity-80">
            <Link to="/" className="hover:underline">Início</Link>
            <span>/</span>
            <Link to="/transparencia" className="hover:underline">Transparência</Link>
            <span>/</span>
            <span>Licitações e Contratos</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center">
              <Gavel className="w-8 h-8 text-accent-foreground" />
            </div>
            <div>
              <h1 className="font-serif text-3xl lg:text-4xl font-bold">
                Licitações e Contratos
              </h1>
              <p className="opacity-90 mt-1">
                Processos licitatórios públicos do IDJUV
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Filtros */}
      <section className="py-6 bg-muted/30 border-b">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-1 block">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por objeto ou número do processo..."
                  className="pl-10"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full md:w-40">
              <label className="text-sm font-medium mb-1 block">Ano</label>
              <Select value={filtroAno} onValueChange={setFiltroAno}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {anos.map(ano => (
                    <SelectItem key={ano} value={ano.toString()}>{ano}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <label className="text-sm font-medium mb-1 block">Modalidade</label>
              <Select value={filtroModalidade} onValueChange={setFiltroModalidade}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas</SelectItem>
                  <SelectItem value="pregao_eletronico">Pregão Eletrônico</SelectItem>
                  <SelectItem value="pregao_presencial">Pregão Presencial</SelectItem>
                  <SelectItem value="concorrencia">Concorrência</SelectItem>
                  <SelectItem value="dispensa">Dispensa</SelectItem>
                  <SelectItem value="inexigibilidade">Inexigibilidade</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Tabela */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Processos Licitatórios</CardTitle>
                  <CardDescription>
                    {isLoading ? "Carregando..." : `${licitacoesFiltradas.length} processo(s) encontrado(s)`}
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">
                  Carregando dados...
                </div>
              ) : licitacoesFiltradas.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum processo encontrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Processo</TableHead>
                        <TableHead>Modalidade</TableHead>
                        <TableHead className="max-w-xs">Objeto</TableHead>
                        <TableHead>Valor Estimado</TableHead>
                        <TableHead>Abertura</TableHead>
                        <TableHead>Situação</TableHead>
                        <TableHead>Vencedor (PJ)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {licitacoesFiltradas.map((lic) => (
                        <TableRow key={lic.id}>
                          <TableCell className="font-medium whitespace-nowrap">
                            {lic.numero_processo}/{lic.ano}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {lic.modalidade?.replace(/_/g, ' ')}
                          </TableCell>
                          <TableCell className="max-w-xs truncate" title={lic.objeto}>
                            {lic.objeto}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatCurrency(lic.valor_estimado)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {formatDate(lic.data_abertura)}
                          </TableCell>
                          <TableCell>
                            {getSituacaoBadge(lic.situacao)}
                          </TableCell>
                          <TableCell className="text-sm">
                            {lic.vencedor_nome ? (
                              <div>
                                <p className="font-medium truncate max-w-[150px]">{lic.vencedor_nome}</p>
                                <p className="text-muted-foreground text-xs">{lic.vencedor_documento_parcial}</p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informações adicionais */}
          <div className="mt-8 bg-muted/50 rounded-xl p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Informações Complementares
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Os dados exibidos seguem a Lei nº 14.133/2021 (Nova Lei de Licitações) e a LGPD. 
              Contratos com pessoa física não são exibidos para proteção de dados pessoais.
            </p>
            <a 
              href="https://transparencia.rr.gov.br"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-primary hover:underline text-sm font-medium"
            >
              Portal de Transparência do Estado
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}
