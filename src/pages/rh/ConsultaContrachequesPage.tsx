/**
 * Consulta de Contracheques - Módulo RH
 * Permite ao RH consultar contracheques de todos os servidores
 */
import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  DollarSign, 
  Users,
  Search,
  Loader2,
  User,
  Building,
  Calculator,
  CreditCard,
  Printer,
} from 'lucide-react';
import { useContrachequesRH, useContrachequeDetalhe, useLogAcessoContracheque, type FichaFinanceiraComServidor } from '@/hooks/useContracheque';
import { generateContracheque, generateContrachequeEmLote } from '@/lib/pdfContracheque';
import { MESES } from '@/types/folha';
import { toast } from 'sonner';

export default function ConsultaContrachequesPage() {
  const anoAtual = new Date().getFullYear();
  const [anoFiltro, setAnoFiltro] = useState<string>(String(anoAtual));
  const [mesFiltro, setMesFiltro] = useState<string>('todos');
  const [busca, setBusca] = useState('');
  const [fichaDetalhe, setFichaDetalhe] = useState<string | null>(null);
  const [gerando, setGerando] = useState<string | null>(null);
  const [gerandoLote, setGerandoLote] = useState(false);
  
  const { data: contracheques, isLoading } = useContrachequesRH({
    ano: anoFiltro === 'todos' ? undefined : Number(anoFiltro),
    mes: mesFiltro === 'todos' ? undefined : Number(mesFiltro),
  });
  const { data: detalhe, isLoading: loadingDetalhe } = useContrachequeDetalhe(fichaDetalhe || undefined);
  const logAcesso = useLogAcessoContracheque();
  
  const formatCurrency = (value: number | null | undefined) => {
    return (value ?? 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };
  
  // Filtrar por busca
  const contrachequesFiltered = contracheques?.filter(c => {
    if (!busca) return true;
    const termo = busca.toLowerCase();
    return (
      c.servidor?.nome_completo?.toLowerCase().includes(termo) ||
      c.servidor?.cpf?.includes(busca) ||
      c.servidor?.matricula?.toLowerCase().includes(termo)
    );
  }) || [];
  
  // Anos disponíveis
  const anosDisponiveis = [...new Set(contracheques?.map(c => c.competencia_ano) || [])].sort((a, b) => b - a);
  if (!anosDisponiveis.includes(anoAtual)) {
    anosDisponiveis.unshift(anoAtual);
  }
  
  const handleGerarPDF = async (ficha: FichaFinanceiraComServidor) => {
    setGerando(ficha.id);
    try {
      const competencia = `${MESES[ficha.competencia_mes - 1]}/${ficha.competencia_ano}`;
      
      await generateContracheque({
        ficha: {
          id: ficha.id,
          servidor_id: ficha.servidor_id,
          cargo_nome: ficha.cargo_nome,
          unidade_nome: ficha.unidade_nome,
          total_proventos: ficha.total_proventos || 0,
          total_descontos: ficha.total_descontos || 0,
          valor_liquido: ficha.valor_liquido || 0,
          base_inss: ficha.base_inss,
          valor_inss: ficha.valor_inss,
          base_irrf: ficha.base_irrf,
          valor_irrf: ficha.valor_irrf,
          quantidade_dependentes: ficha.quantidade_dependentes,
          servidor: ficha.servidor ? {
            nome_completo: ficha.servidor.nome_completo,
            cpf: ficha.servidor.cpf || '',
            matricula: ficha.servidor.matricula,
            pis_pasep: ficha.servidor.pis_pasep,
          } : undefined,
        },
        competencia,
        competenciaAno: ficha.competencia_ano,
        competenciaMes: ficha.competencia_mes,
      });
      
      logAcesso.mutate({ fichaId: ficha.id, acao: 'imprimir' });
      toast.success('Contracheque gerado!');
    } catch (error) {
      console.error('Erro ao gerar contracheque:', error);
      toast.error('Erro ao gerar contracheque');
    } finally {
      setGerando(null);
    }
  };
  
  const handleGerarLote = async () => {
    if (!contrachequesFiltered.length) return;
    
    setGerandoLote(true);
    try {
      const mes = mesFiltro === 'todos' ? 1 : Number(mesFiltro);
      const ano = anoFiltro === 'todos' ? anoAtual : Number(anoFiltro);
      const competencia = `${MESES[mes - 1]}/${ano}`;
      
      const fichasParaLote = contrachequesFiltered.map(f => ({
        id: f.id,
        servidor_id: f.servidor_id,
        cargo_nome: f.cargo_nome,
        unidade_nome: f.unidade_nome,
        total_proventos: f.total_proventos || 0,
        total_descontos: f.total_descontos || 0,
        valor_liquido: f.valor_liquido || 0,
        base_inss: f.base_inss,
        valor_inss: f.valor_inss,
        base_irrf: f.base_irrf,
        valor_irrf: f.valor_irrf,
        quantidade_dependentes: f.quantidade_dependentes,
        servidor: f.servidor ? {
          nome_completo: f.servidor.nome_completo,
          cpf: f.servidor.cpf || '',
          matricula: f.servidor.matricula,
          pis_pasep: f.servidor.pis_pasep,
        } : undefined,
      }));
      
      await generateContrachequeEmLote(fichasParaLote, competencia, ano, mes);
      toast.success(`${fichasParaLote.length} contracheques gerados!`);
    } catch (error) {
      console.error('Erro ao gerar lote:', error);
      toast.error('Erro ao gerar contracheques em lote');
    } finally {
      setGerandoLote(false);
    }
  };
  
  const handleVisualizarDetalhe = (fichaId: string) => {
    setFichaDetalhe(fichaId);
    logAcesso.mutate({ fichaId, acao: 'visualizar' });
  };
  
  // Dados para o dialog de detalhe
  const proventos = detalhe?.itens?.filter(i => i.tipo === 'provento') || [];
  const descontos = detalhe?.itens?.filter(i => i.tipo === 'desconto') || [];
  
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Users className="h-6 w-6 text-primary" />
              Consulta de Contracheques
            </h1>
            <p className="text-muted-foreground">
              Visualize e exporte contracheques dos servidores
            </p>
          </div>
          
          <Button
            variant="default"
            onClick={handleGerarLote}
            disabled={gerandoLote || contrachequesFiltered.length === 0}
          >
            {gerandoLote ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Printer className="h-4 w-4 mr-2" />
            )}
            Gerar Lote ({contrachequesFiltered.length})
          </Button>
        </div>
        
        {/* Filtros */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, CPF ou matrícula..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={anoFiltro} onValueChange={setAnoFiltro}>
                <SelectTrigger className="w-[120px]">
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {anosDisponiveis.map(ano => (
                    <SelectItem key={ano} value={String(ano)}>{ano}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={mesFiltro} onValueChange={setMesFiltro}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Mês" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os meses</SelectItem>
                  {MESES.map((mes, idx) => (
                    <SelectItem key={idx} value={String(idx + 1)}>{mes}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabela */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contracheques
            </CardTitle>
            <CardDescription>
              {contrachequesFiltered.length} registro(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : contrachequesFiltered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum contracheque encontrado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Servidor</TableHead>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Competência</TableHead>
                      <TableHead className="text-right">Proventos</TableHead>
                      <TableHead className="text-right">Descontos</TableHead>
                      <TableHead className="text-right">Líquido</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contrachequesFiltered.map((ficha) => (
                      <TableRow key={ficha.id}>
                        <TableCell className="font-medium">
                          {ficha.servidor?.nome_completo || 'N/A'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {ficha.servidor?.matricula || 'S/M'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-mono">
                            {MESES[ficha.competencia_mes - 1]}/{ficha.competencia_ano}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono text-green-600">
                          {formatCurrency(ficha.total_proventos)}
                        </TableCell>
                        <TableCell className="text-right font-mono text-red-600">
                          {formatCurrency(ficha.total_descontos)}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-blue-600">
                          {formatCurrency(ficha.valor_liquido)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleVisualizarDetalhe(ficha.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleGerarPDF(ficha)}
                              disabled={gerando === ficha.id}
                            >
                              {gerando === ficha.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Download className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Dialog de Detalhe */}
        <Dialog open={!!fichaDetalhe} onOpenChange={() => setFichaDetalhe(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Detalhe do Contracheque
              </DialogTitle>
              {detalhe?.ficha && (
                <DialogDescription>
                  {detalhe.ficha.servidor?.nome_completo} • {MESES[(detalhe.ficha.competencia_mes || 1) - 1]}/{detalhe.ficha.competencia_ano}
                </DialogDescription>
              )}
            </DialogHeader>
            
            {loadingDetalhe ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : detalhe?.ficha ? (
              <Tabs defaultValue="resumo" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="resumo">Resumo</TabsTrigger>
                  <TabsTrigger value="rubricas">Rubricas</TabsTrigger>
                  <TabsTrigger value="tributos">Tributos</TabsTrigger>
                </TabsList>
                
                {/* Resumo */}
                <TabsContent value="resumo" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Identificação
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Nome:</span>
                        <p className="font-medium">{detalhe.ficha.servidor?.nome_completo}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Matrícula:</span>
                        <p className="font-medium">{detalhe.ficha.servidor?.matricula || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cargo:</span>
                        <p className="font-medium">{detalhe.ficha.cargo_nome || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Unidade:</span>
                        <p className="font-medium">{detalhe.ficha.unidade_nome || 'N/A'}</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <Card className="border-green-200 bg-green-50/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-green-800 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Total Proventos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-green-700">
                          {formatCurrency(detalhe.ficha.total_proventos)}
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-red-200 bg-red-50/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-red-800 flex items-center gap-2">
                          <Calculator className="h-4 w-4" />
                          Total Descontos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-red-700">
                          {formatCurrency(detalhe.ficha.total_descontos)}
                        </p>
                      </CardContent>
                    </Card>
                    
                    <Card className="border-blue-200 bg-blue-50/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-blue-800 flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          Valor Líquido
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-blue-700">
                          {formatCurrency(detalhe.ficha.valor_liquido)}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                {/* Rubricas */}
                <TabsContent value="rubricas" className="space-y-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-green-700">Proventos ({proventos.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {proventos.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum provento registrado</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Descrição</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {proventos.map(item => (
                              <TableRow key={item.id}>
                                <TableCell>{item.descricao}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(item.valor)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-red-700">Descontos ({descontos.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {descontos.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nenhum desconto registrado</p>
                      ) : (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Descrição</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {descontos.map(item => (
                              <TableRow key={item.id}>
                                <TableCell>{item.descricao}</TableCell>
                                <TableCell className="text-right font-mono text-red-600">{formatCurrency(item.valor)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Tributos */}
                <TabsContent value="tributos" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">INSS Servidor</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Base de Cálculo:</span>
                          <span className="font-mono">{formatCurrency(detalhe.ficha.base_inss)}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>Valor INSS:</span>
                          <span className="font-mono text-red-600">{formatCurrency(detalhe.ficha.valor_inss)}</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">IRRF</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Base de Cálculo:</span>
                          <span className="font-mono">{formatCurrency(detalhe.ficha.base_irrf)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Dependentes:</span>
                          <span>{detalhe.ficha.quantidade_dependentes || 0}</span>
                        </div>
                        <Separator />
                        <div className="flex justify-between font-medium">
                          <span>Valor IRRF:</span>
                          <span className="font-mono text-red-600">{formatCurrency(detalhe.ficha.valor_irrf)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
