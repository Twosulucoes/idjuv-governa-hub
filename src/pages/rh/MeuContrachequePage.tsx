/**
 * Página "Meu Contracheque" - Portal do Servidor
 * Visualização dos contracheques do próprio servidor logado
 */
import { useState } from 'react';
import { ModuleLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  DollarSign, 
  User,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useMeusContracheques, useServidorLogado, useLogAcessoContracheque } from '@/hooks/useContracheque';
import { generateContracheque } from '@/lib/pdfContracheque';
import { MESES } from '@/types/folha';
import { toast } from 'sonner';

export default function MeuContrachequePage() {
  const [anoFiltro, setAnoFiltro] = useState<string>('todos');
  const [gerando, setGerando] = useState<string | null>(null);
  
  const { data: servidor, isLoading: loadingServidor } = useServidorLogado();
  const { data: contracheques, isLoading: loadingContracheques } = useMeusContracheques();
  const logAcesso = useLogAcessoContracheque();
  
  const formatCurrency = (value: number | null | undefined) => {
    return (value ?? 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };
  
  const contrachequesFiltered = contracheques?.filter(c => {
    if (anoFiltro === 'todos') return true;
    return c.competencia_ano === Number(anoFiltro);
  }) || [];
  
  // Anos disponíveis para filtro
  const anosDisponiveis = [...new Set(contracheques?.map(c => c.competencia_ano) || [])].sort((a, b) => b - a);
  
  const handleGerarPDF = async (ficha: typeof contracheques[0]) => {
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
      
      // Registrar log de impressão
      logAcesso.mutate({ fichaId: ficha.id, acao: 'imprimir' });
      toast.success('Contracheque gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar contracheque:', error);
      toast.error('Erro ao gerar contracheque');
    } finally {
      setGerando(null);
    }
  };
  
  if (loadingServidor) {
    return (
      <ModuleLayout module="rh">
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </ModuleLayout>
    );
  }
  
  if (!servidor) {
    return (
      <ModuleLayout module="rh">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            Meu Contracheque
          </h1>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Seu usuário não está vinculado a um cadastro de servidor. 
              Entre em contato com o RH para regularizar seu acesso.
            </AlertDescription>
          </Alert>
        </div>
      </ModuleLayout>
    );
  }
  
  return (
    <ModuleLayout module="rh">
      <div className="space-y-6">
        {/* Cabeçalho */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Meu Contracheque
            </h1>
            <p className="text-muted-foreground">
              Consulte e baixe seus contracheques
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={anoFiltro} onValueChange={setAnoFiltro}>
              <SelectTrigger className="w-[140px]">
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
          </div>
        </div>
        
        {/* Dados do Servidor */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              Identificação
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Nome:</span>
              <p className="font-medium">{servidor.nome_completo}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Matrícula:</span>
              <p className="font-medium">{servidor.matricula || 'N/A'}</p>
            </div>
          </CardContent>
        </Card>
        
        {/* Lista de Contracheques */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Contracheques Disponíveis
            </CardTitle>
            <CardDescription>
              {contrachequesFiltered.length} contracheque(s) encontrado(s)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingContracheques ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : contrachequesFiltered.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum contracheque encontrado</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
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
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGerarPDF(ficha)}
                          disabled={gerando === ficha.id}
                        >
                          {gerando === ficha.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                          <span className="ml-2 hidden sm:inline">Baixar PDF</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
