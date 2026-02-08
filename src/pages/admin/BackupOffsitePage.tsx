// ============================================
// PÁGINA DE BACKUP OFFSITE
// ============================================

import { useState } from 'react';
import { ModuleLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  HardDrive, 
  Cloud, 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Download,
  Trash2,
  Shield,
  Settings,
  AlertTriangle,
  Loader2,
  Database,
  FileArchive
} from 'lucide-react';
import { useBackupOffsite, formatBytes, formatDuration } from '@/hooks/useBackupOffsite';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ReactNode }> = {
  pending: { label: 'Pendente', variant: 'secondary', icon: <Clock className="h-3 w-3" /> },
  running: { label: 'Executando', variant: 'default', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  success: { label: 'Sucesso', variant: 'default', icon: <CheckCircle2 className="h-3 w-3" /> },
  failed: { label: 'Falhou', variant: 'destructive', icon: <XCircle className="h-3 w-3" /> },
  partial: { label: 'Parcial', variant: 'outline', icon: <AlertTriangle className="h-3 w-3" /> },
};

const typeLabels: Record<string, string> = {
  daily: 'Diário',
  weekly: 'Semanal',
  monthly: 'Mensal',
  manual: 'Manual'
};

export default function BackupOffsitePage() {
  const {
    config,
    configLoading,
    history,
    historyLoading,
    isExecuting,
    updateConfig,
    testConnection,
    executeBackup,
    verifyIntegrity,
    cleanupOldBackups,
    downloadManifest,
    refetchHistory
  } = useBackupOffsite();

  const [filterType, setFilterType] = useState<string>('all');
  const [confirmBackup, setConfirmBackup] = useState(false);

  const filteredHistory = history?.filter(b => 
    filterType === 'all' || b.backup_type === filterType
  );

  const lastSuccessful = history?.find(b => b.status === 'success');

  return (
    <ModuleLayout module="admin">
      <div className="space-y-6">
        {/* Status Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {config?.enabled ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <span className="text-lg font-bold">Ativo</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-lg font-bold">Desativado</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Último Backup</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {config?.last_backup_at 
                  ? format(new Date(config.last_backup_at), "dd/MM HH:mm", { locale: ptBR })
                  : 'Nunca'}
              </div>
              {config?.last_backup_status && (
                <Badge variant={statusConfig[config.last_backup_status]?.variant}>
                  {statusConfig[config.last_backup_status]?.label}
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tamanho Total</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {formatBytes(lastSuccessful?.total_size)}
              </div>
              <p className="text-xs text-muted-foreground">
                Duração: {formatDuration(lastSuccessful?.duration_seconds)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Backups</CardTitle>
              <FileArchive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold">
                {history?.filter(b => b.status === 'success').length || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Total armazenado
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Ações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <AlertDialog open={confirmBackup} onOpenChange={setConfirmBackup}>
                <AlertDialogTrigger asChild>
                  <Button disabled={isExecuting}>
                    {isExecuting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Executar Backup Agora
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar Backup</AlertDialogTitle>
                    <AlertDialogDescription>
                      Deseja executar um backup manual agora? Isso pode levar alguns minutos.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                      executeBackup({ backupType: 'manual' });
                      setConfirmBackup(false);
                    }}>
                      Executar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button variant="outline" onClick={() => testConnection()}>
                <Shield className="h-4 w-4 mr-2" />
                Testar Conexão
              </Button>

              <Button variant="outline" onClick={() => refetchHistory()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar
              </Button>

              <Button variant="outline" onClick={() => cleanupOldBackups()}>
                <Trash2 className="h-4 w-4 mr-2" />
                Limpar Antigos
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="history" className="space-y-4">
          <TabsList>
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="config">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Histórico de Backups</CardTitle>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Filtrar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="manual">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data/Hora</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tamanho</TableHead>
                        <TableHead>Duração</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredHistory?.map((backup) => (
                        <TableRow key={backup.id}>
                          <TableCell>
                            {format(new Date(backup.started_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {typeLabels[backup.backup_type] || backup.backup_type}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={statusConfig[backup.status]?.variant}
                              className="flex items-center gap-1 w-fit"
                            >
                              {statusConfig[backup.status]?.icon}
                              {statusConfig[backup.status]?.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{formatBytes(backup.total_size)}</TableCell>
                          <TableCell>{formatDuration(backup.duration_seconds)}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {backup.status === 'success' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => verifyIntegrity(backup.id)}
                                    title="Verificar Integridade"
                                  >
                                    <Shield className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => downloadManifest(backup.id)}
                                    title="Download Manifest"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                              {backup.error_message && (
                                <span className="text-xs text-destructive" title={backup.error_message}>
                                  Erro
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {!filteredHistory?.length && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            Nenhum backup encontrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações de Backup
                </CardTitle>
                <CardDescription>
                  Configure o agendamento, retenção e buckets incluídos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {configLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : config && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Backup Automático</Label>
                        <p className="text-sm text-muted-foreground">
                          Habilitar execução automática de backups
                        </p>
                      </div>
                      <Switch
                        checked={config.enabled}
                        onCheckedChange={(enabled) => updateConfig({ enabled })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Criptografia</Label>
                        <p className="text-sm text-muted-foreground">
                          Criptografar backups antes do upload
                        </p>
                      </div>
                      <Switch
                        checked={config.encryption_enabled}
                        onCheckedChange={(encryption_enabled) => updateConfig({ encryption_enabled })}
                      />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>Horário (Cron)</Label>
                        <Input
                          value={config.schedule_cron}
                          onChange={(e) => updateConfig({ schedule_cron: e.target.value })}
                          placeholder="0 2 * * *"
                        />
                        <p className="text-xs text-muted-foreground">
                          Padrão: 0 2 * * * (02:00 diário)
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Dia Semanal (0-6)</Label>
                        <Input
                          type="number"
                          min={0}
                          max={6}
                          value={config.weekly_day}
                          onChange={(e) => updateConfig({ weekly_day: parseInt(e.target.value) })}
                        />
                        <p className="text-xs text-muted-foreground">
                          0 = Domingo, 6 = Sábado
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Política de Retenção</Label>
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label className="text-sm">Diários</Label>
                          <Input
                            type="number"
                            min={1}
                            value={config.retention_daily}
                            onChange={(e) => updateConfig({ retention_daily: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Semanais</Label>
                          <Input
                            type="number"
                            min={1}
                            value={config.retention_weekly}
                            onChange={(e) => updateConfig({ retention_weekly: parseInt(e.target.value) })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Mensais</Label>
                          <Input
                            type="number"
                            min={1}
                            value={config.retention_monthly}
                            onChange={(e) => updateConfig({ retention_monthly: parseInt(e.target.value) })}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Buckets Incluídos</Label>
                      <Input
                        value={config.buckets_included?.join(', ')}
                        onChange={(e) => updateConfig({ 
                          buckets_included: e.target.value.split(',').map(b => b.trim()).filter(Boolean)
                        })}
                        placeholder="documentos, uploads"
                      />
                      <p className="text-xs text-muted-foreground">
                        Separados por vírgula
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ModuleLayout>
  );
}
