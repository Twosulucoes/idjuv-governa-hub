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
import {
  DataTable,
  KpiCard,
  PageHeader,
  StatusBadge,
  type ColunaTabela,
  type TomStatus,
} from '@/components/design-system';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  HardDrive, 
  Cloud, 
  Play, 
  RefreshCw, 
  Clock, 
  Download,
  Trash2,
  Shield,
  Settings,
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

const statusConfig: Record<string, { label: string; tom: TomStatus }> = {
  pending: { label: 'Pendente', tom: 'pendente' },
  running: { label: 'Executando', tom: 'andamento' },
  success: { label: 'Sucesso', tom: 'sucesso' },
  failed: { label: 'Falhou', tom: 'erro' },
  partial: { label: 'Parcial', tom: 'pendente' },
};

function StatusBackupBadge({ status }: { status: string }) {
  const cfg = statusConfig[status];
  return <StatusBadge tom={cfg?.tom ?? 'neutro'}>{cfg?.label ?? status}</StatusBadge>;
}

type RegistroBackup = NonNullable<ReturnType<typeof useBackupOffsite>['history']>[number];

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
    generateDestSchema,
    exportLocalBackup,
    refetchHistory
  } = useBackupOffsite();

  const [filterType, setFilterType] = useState<string>('all');
  const [confirmBackup, setConfirmBackup] = useState(false);
  const [backupFormat, setBackupFormat] = useState<string>('json');

  const filteredHistory = history?.filter(b => 
    filterType === 'all' || b.backup_type === filterType
  );

  const lastSuccessful = history?.find(b => b.status === 'success');

  const colunas: ColunaTabela<RegistroBackup>[] = [
    {
      id: 'started_at',
      cabecalho: 'Data/hora',
      celula: (backup) => format(new Date(backup.started_at), "dd/MM/yyyy HH:mm", { locale: ptBR }),
      ordenarPor: (backup) => new Date(backup.started_at),
      mobile: 'titulo',
    },
    {
      id: 'tipo',
      cabecalho: 'Tipo',
      celula: (backup) => (
        <Badge variant="outline">{typeLabels[backup.backup_type] || backup.backup_type}</Badge>
      ),
      ordenarPor: (backup) => backup.backup_type,
    },
    {
      id: 'status',
      cabecalho: 'Situação',
      celula: (backup) => <StatusBackupBadge status={backup.status} />,
      ordenarPor: (backup) => backup.status,
    },
    {
      id: 'tamanho',
      cabecalho: 'Tamanho',
      celula: (backup) => formatBytes(backup.total_size),
      ordenarPor: (backup) => backup.total_size,
      alinhamento: 'direita',
    },
    {
      id: 'duracao',
      cabecalho: 'Duração',
      celula: (backup) => formatDuration(backup.duration_seconds),
      ordenarPor: (backup) => backup.duration_seconds,
      alinhamento: 'direita',
    },
  ];

  const ultimoStatus = config?.last_backup_status;

  return (
    <ModuleLayout module="admin">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Administração", href: "/admin" }, { rotulo: "Backup offsite" }]}
          titulo="Backup offsite"
          descricao="Execução, histórico e configuração das cópias de segurança externas"
        />

        {/* Status Cards */}
        <section aria-labelledby="backup-indicadores">
          <h2 id="backup-indicadores" className="sr-only">Indicadores</h2>
          <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <li>
              <KpiCard
                rotulo="Backup automático"
                valor={config?.enabled ? 'Ativo' : 'Desativado'}
                icone={HardDrive}
                carregando={configLoading}
                className="h-full"
              />
            </li>
            <li>
              <KpiCard
                rotulo="Último backup"
                valor={
                  config?.last_backup_at
                    ? format(new Date(config.last_backup_at), "dd/MM HH:mm", { locale: ptBR })
                    : 'Nunca'
                }
                detalhe={ultimoStatus ? <StatusBackupBadge status={ultimoStatus} /> : undefined}
                icone={Clock}
                carregando={configLoading}
                className="h-full"
              />
            </li>
            <li>
              <KpiCard
                rotulo="Tamanho total"
                valor={formatBytes(lastSuccessful?.total_size)}
                detalhe={`Duração: ${formatDuration(lastSuccessful?.duration_seconds)}`}
                icone={Database}
                carregando={historyLoading}
                className="h-full"
              />
            </li>
            <li>
              <KpiCard
                rotulo="Backups armazenados"
                valor={history?.filter(b => b.status === 'success').length || 0}
                icone={FileArchive}
                carregando={historyLoading}
                className="h-full"
              />
            </li>
          </ul>
        </section>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" aria-hidden="true" />
              Ações
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <AlertDialog open={confirmBackup} onOpenChange={setConfirmBackup}>
                <AlertDialogTrigger asChild>
                  <Button disabled={isExecuting}>
                    {isExecuting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" aria-hidden="true" />
                    )}
                    Executar backup agora
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmar backup</AlertDialogTitle>
                    <AlertDialogDescription>
                      Escolha o formato e confirme a execução do backup.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="py-4 space-y-3">
                    <Label htmlFor="backup-formato">Formato de exportação</Label>
                    <Select value={backupFormat} onValueChange={setBackupFormat}>
                      <SelectTrigger id="backup-formato">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="json">JSON (padrão - restauração rápida)</SelectItem>
                        <SelectItem value="csv">CSV (compatível com Excel/planilhas)</SelectItem>
                        <SelectItem value="sql">SQL (PostgreSQL - restauração direta)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {backupFormat === 'json' && 'Formato ideal para restauração automatizada via API.'}
                      {backupFormat === 'csv' && 'Permite abrir os dados em qualquer planilha ou ferramenta de ETL.'}
                      {backupFormat === 'sql' && 'Gera INSERTs SQL prontos para execução em qualquer PostgreSQL.'}
                    </p>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => {
                      executeBackup({ backupType: 'manual', format: backupFormat });
                      setConfirmBackup(false);
                    }}>
                      Executar backup ({backupFormat.toUpperCase()})
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button variant="outline" onClick={() => testConnection()}>
                <Shield className="h-4 w-4 mr-2" aria-hidden="true" />
                Testar conexão
              </Button>

              <Button variant="outline" onClick={() => refetchHistory()}>
                <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                Atualizar
              </Button>

              <Button variant="outline" onClick={() => cleanupOldBackups()}>
                <Trash2 className="h-4 w-4 mr-2" aria-hidden="true" />
                Limpar antigos
              </Button>

              <Button variant="outline" onClick={() => generateDestSchema()}>
                <Database className="h-4 w-4 mr-2" aria-hidden="true" />
                Gerar schema do BD destino
              </Button>

              <Button variant="secondary" onClick={() => exportLocalBackup('json')}>
                <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                Exportar JSON
              </Button>

              <Button variant="secondary" onClick={() => exportLocalBackup('csv')}>
                <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                Exportar CSV
              </Button>

              <Button variant="secondary" onClick={() => exportLocalBackup('sql')}>
                <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                Exportar SQL
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
            <DataTable
              rotulo="Histórico de backups"
              dados={filteredHistory ?? []}
              colunas={colunas}
              chaveLinha={(backup) => backup.id}
              carregando={historyLoading}
              filtros={
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-full sm:w-[150px]" aria-label="Tipo de backup">
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
              }
              vazio={{ icone: FileArchive, titulo: "Nenhum backup encontrado", descricao: "Execute um backup ou ajuste o filtro." }}
              acoesLinha={(backup) => {
                const quando = format(new Date(backup.started_at), "dd/MM/yyyy HH:mm", { locale: ptBR });
                return (
                  <div className="flex items-center justify-end gap-2">
                    {backup.status === 'success' && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => verifyIntegrity(backup.id)}
                          title="Verificar integridade"
                          aria-label={`Verificar integridade do backup de ${quando}`}
                        >
                          <Shield className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => downloadManifest(backup.id)}
                          title="Baixar manifesto"
                          aria-label={`Baixar manifesto do backup de ${quando}`}
                        >
                          <Download className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      </>
                    )}
                    {backup.error_message && (
                      <span className="text-caption text-destructive" title={backup.error_message}>
                        Erro
                      </span>
                    )}
                  </div>
                );
              }}
            />
          </TabsContent>

          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" aria-hidden="true" />
                  Configurações de backup
                </CardTitle>
                <CardDescription>
                  Configure o agendamento, retenção e buckets incluídos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {configLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Carregando configurações" />
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
