/**
 * Página de Controle de Pacotes de Frequência
 * 
 * Permite visualizar, gerar e gerenciar pacotes ZIP de frequências
 * para inserção de links em processos do SEI
 */
import { useState, useMemo } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Package,
  Download,
  Copy,
  Check,
  Loader2,
  FileArchive,
  Calendar,
  Building2,
  Link2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
} from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

import { 
  useFrequenciaPacotes, 
  useEstatisticasPeriodo,
  type FrequenciaPacote,
} from '@/hooks/useFrequenciaPacotes';
import { supabase } from '@/integrations/supabase/client';

// ============================================
// CONSTANTES
// ============================================

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const STATUS_CONFIG: Record<FrequenciaPacote['status'], { label: string; color: string; icon: React.ReactNode }> = {
  pendente: { label: 'Pendente', color: 'secondary', icon: <Clock className="h-3 w-3" /> },
  gerando: { label: 'Gerando...', color: 'warning', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  gerado: { label: 'Gerado', color: 'success', icon: <CheckCircle2 className="h-3 w-3" /> },
  erro: { label: 'Erro', color: 'destructive', icon: <AlertCircle className="h-3 w-3" /> },
};

// ============================================
// COMPONENTES AUXILIARES
// ============================================

function StatusBadge({ status }: { status: FrequenciaPacote['status'] }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant={config.color as any} className="gap-1">
      {config.icon}
      {config.label}
    </Badge>
  );
}

function CopyLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  
  // O link correto deve apontar para a edge function
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const fullUrl = `${supabaseUrl}/functions/v1/download-frequencia?link=${link}&action=info`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      toast.success('Link copiado! (Requer autenticação para download)');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar link');
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1">
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copiado!' : 'Copiar Link'}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-mono text-xs max-w-xs break-all">{fullUrl}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function DownloadButton({ pacote }: { pacote: FrequenciaPacote }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    if (!pacote.link_download) return;
    
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      // Verificar se o pacote tem arquivo
      if (!pacote.arquivo_path) {
        toast.error('Arquivo do pacote não disponível. Gere novamente o lote.');
        return;
      }

      // Chamar edge function para obter URL assinada
      const funcUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/download-frequencia?link=${pacote.link_download}`;
      const res = await fetch(funcUrl, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao obter download');
      }

      // Abrir URL de download
      window.open(data.download_url, '_blank');
      toast.success('Download iniciado!');
    } catch (error: any) {
      console.error('Erro no download:', error);
      toast.error(error.message || 'Erro ao fazer download');
    } finally {
      setLoading(false);
    }
  };

  // Desabilitar se não tiver arquivo
  const isDisabled = loading || pacote.status !== 'gerado' || !pacote.arquivo_path;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button 
              variant="default" 
              size="sm" 
              onClick={handleDownload}
              disabled={isDisabled}
              className="gap-1"
            >
              {loading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Download className="h-3 w-3" />
              )}
              Download
            </Button>
          </span>
        </TooltipTrigger>
        {!pacote.arquivo_path && pacote.status === 'gerado' && (
          <TooltipContent>
            <p>Arquivo não disponível. Gere o lote novamente.</p>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '-';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function ControlePacotesFrequenciaPage() {
  const now = new Date();
  const [ano, setAno] = useState(now.getFullYear());
  const [mes, setMes] = useState(now.getMonth() + 1);

  const periodo = useMemo(() => `${ano}-${String(mes).padStart(2, '0')}`, [ano, mes]);

  const { data: pacotes, isLoading: loadingPacotes, refetch } = useFrequenciaPacotes(periodo);
  const { data: estatisticas, isLoading: loadingStats } = useEstatisticasPeriodo(periodo);

  // Anos disponíveis
  const anos = useMemo(() => {
    const current = new Date().getFullYear();
    return [current - 1, current, current + 1];
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Package className="h-6 w-6 text-primary" />
              Controle de Pacotes de Frequência
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie e compartilhe pacotes ZIP de frequências para processos SEI
            </p>
          </div>
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>

        {/* Seletor de Período */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              Período de Referência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-1.5">
                <Label>Mês</Label>
                <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MESES.map((nome, idx) => (
                      <SelectItem key={idx} value={String(idx + 1)}>
                        {nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Ano</Label>
                <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
                  <SelectTrigger className="w-[120px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {anos.map((a) => (
                      <SelectItem key={a} value={String(a)}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Badge variant="outline" className="h-10 px-4 text-sm">
                  {MESES[mes - 1]} de {ano}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas do Período */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total de Frequências</CardDescription>
              <CardTitle className="text-3xl">
                {loadingStats ? <Skeleton className="h-9 w-16" /> : estatisticas?.totalArquivos || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <FileText className="h-3 w-3" />
                PDFs gerados e armazenados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Unidades com Frequências</CardDescription>
              <CardTitle className="text-3xl">
                {loadingStats ? <Skeleton className="h-9 w-16" /> : estatisticas?.porUnidade?.length || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Building2 className="h-3 w-3" />
                Setores com documentos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pacotes ZIP</CardDescription>
              <CardTitle className="text-3xl">
                {loadingStats ? <Skeleton className="h-9 w-16" /> : estatisticas?.pacotes?.length || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <FileArchive className="h-3 w-3" />
                Pacotes prontos para SEI
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Pacotes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileArchive className="h-5 w-5 text-muted-foreground" />
              Pacotes do Período
            </CardTitle>
            <CardDescription>
              Pacotes ZIP gerados para {MESES[mes - 1]} de {ano}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingPacotes ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : pacotes && pacotes.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Unidade/Agrupamento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Arquivos</TableHead>
                      <TableHead>Tamanho</TableHead>
                      <TableHead>Gerado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pacotes.map((pacote) => (
                      <TableRow key={pacote.id}>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {pacote.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {pacote.agrupamento_nome || pacote.unidade_nome || 'Geral'}
                        </TableCell>
                        <TableCell>
                          {pacote.arquivo_path ? (
                            <StatusBadge status={pacote.status} />
                          ) : pacote.status === 'gerado' ? (
                            <Badge variant="outline" className="gap-1 text-amber-600 dark:text-amber-400">
                              <AlertCircle className="h-3 w-3" />
                              Sem ZIP
                            </Badge>
                          ) : (
                            <StatusBadge status={pacote.status} />
                          )}
                        </TableCell>
                        <TableCell>{pacote.total_arquivos}</TableCell>
                        <TableCell>{formatFileSize(pacote.arquivo_tamanho)}</TableCell>
                        <TableCell>
                          {pacote.gerado_em ? (
                            format(new Date(pacote.gerado_em), "dd/MM/yyyy HH:mm", { locale: ptBR })
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {pacote.status === 'gerado' && pacote.link_download && pacote.arquivo_path && (
                              <>
                                <CopyLinkButton link={pacote.link_download} />
                                <DownloadButton pacote={pacote} />
                              </>
                            )}
                            {pacote.status === 'gerado' && !pacote.arquivo_path && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className="gap-1 text-muted-foreground">
                                      <FileText className="h-3 w-3" />
                                      {pacote.total_arquivos} PDFs
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Arquivos individuais salvos. ZIP não gerado.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {pacote.status === 'erro' && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <AlertCircle className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{pacote.erro_mensagem || 'Erro desconhecido'}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileArchive className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <p className="font-medium">Nenhum pacote encontrado</p>
                <p className="text-sm mt-1">
                  Gere frequências em lote para criar pacotes automaticamente
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Instruções de uso */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Link2 className="h-5 w-5 text-muted-foreground" />
              Como usar os links no SEI
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-3">
            <p>
              <strong>1.</strong> Gere as frequências do período desejado através do módulo de{' '}
              <strong>Impressão em Lote</strong>.
            </p>
            <p>
              <strong>2.</strong> Após gerar, um pacote ZIP será criado automaticamente e aparecerá nesta tela.
            </p>
            <p>
              <strong>3.</strong> Clique em <strong>"Copiar Link"</strong> para obter o endereço único do pacote.
            </p>
            <p>
              <strong>4.</strong> Cole o link no processo do SEI. O download requer autenticação no sistema.
            </p>
            <Separator className="my-4" />
            <p className="text-xs">
              <strong>Nota:</strong> Os links são permanentes, mas o download só é permitido para usuários 
              autenticados no sistema IDJUV.
            </p>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
