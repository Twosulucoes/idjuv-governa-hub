// ============================================
// PÁGINA DE AUDITORIA
// ============================================

import { useState, useEffect } from 'react';
import { ModuleLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { 
  AuditLog, 
  AuditAction,
  AUDIT_ACTION_LABELS,
} from '@/types/auth';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Search, 
  Download, 
  Eye,
  Filter,
  Calendar,
  User,
  Activity
} from 'lucide-react';

const ACTION_COLORS: Record<AuditAction, string> = {
  login: 'bg-green-100 text-green-800',
  logout: 'bg-gray-100 text-gray-800',
  login_failed: 'bg-red-100 text-red-800',
  password_change: 'bg-blue-100 text-blue-800',
  password_reset: 'bg-yellow-100 text-yellow-800',
  create: 'bg-emerald-100 text-emerald-800',
  update: 'bg-sky-100 text-sky-800',
  delete: 'bg-red-100 text-red-800',
  view: 'bg-slate-100 text-slate-800',
  export: 'bg-purple-100 text-purple-800',
  upload: 'bg-indigo-100 text-indigo-800',
  download: 'bg-violet-100 text-violet-800',
  approve: 'bg-green-100 text-green-800',
  reject: 'bg-orange-100 text-orange-800',
  submit: 'bg-blue-100 text-blue-800'
};

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [moduleFilter, setModuleFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [modules, setModules] = useState<string[]>([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      // Buscar logs sem JOIN problemático
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          org_unit:estrutura_organizacional!audit_logs_org_unit_id_fkey(nome)
        `)
        .order('timestamp', { ascending: false })
        .limit(500);

      if (error) throw error;

      // Buscar nomes dos usuários separadamente
      const userIds = [...new Set((data || []).map((l: any) => l.user_id).filter(Boolean))];
      const profilesMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);
        (profiles || []).forEach((p: any) => {
          profilesMap[p.id] = p.full_name;
        });
      }

      if (error) throw error;

      const mapped: AuditLog[] = (data || []).map((log: any) => ({
        id: log.id,
        timestamp: log.timestamp,
        userId: log.user_id,
        userName: profilesMap[log.user_id] || log.user?.full_name,
        action: log.action,
        entityType: log.entity_type,
        entityId: log.entity_id,
        moduleName: log.module_name,
        beforeData: log.before_data,
        afterData: log.after_data,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        orgUnitId: log.org_unit_id,
        orgUnitName: log.org_unit?.nome,
        roleAtTime: log.role_at_time,
        description: log.description,
        metadata: log.metadata
      }));

      setLogs(mapped);

      // Extrair módulos únicos
      const uniqueModules = [...new Set(mapped.map(l => l.moduleName).filter(Boolean))] as string[];
      setModules(uniqueModules);
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.moduleName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesModule = moduleFilter === 'all' || log.moduleName === moduleFilter;

    return matchesSearch && matchesAction && matchesModule;
  });

  const exportToCSV = () => {
    const headers = ['Data/Hora', 'Usuário', 'Ação', 'Módulo', 'Entidade', 'Descrição', 'IP'];
    const rows = filteredLogs.map(log => [
      format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss'),
      log.userName || '-',
      AUDIT_ACTION_LABELS[log.action],
      log.moduleName || '-',
      log.entityType || '-',
      log.description || '-',
      log.ipAddress || '-'
    ]);

    const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auditoria_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
    link.click();
  };

  return (
    <ModuleLayout module="admin">
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Logins Hoje</CardTitle>
            <User className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter(l => 
                l.action === 'login' && 
                new Date(l.timestamp).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Falhas de Login</CardTitle>
            <User className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter(l => l.action === 'login_failed').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alterações Hoje</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter(l => 
                ['create', 'update', 'delete'].includes(l.action) && 
                new Date(l.timestamp).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por usuário, módulo, descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                {Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Módulo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os módulos</SelectItem>
                {modules.map(module => (
                  <SelectItem key={module} value={module} className="capitalize">
                    {module}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" className="gap-2" onClick={exportToCSV}>
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de logs */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Ação</TableHead>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead className="text-right">Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.slice(0, 100).map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-sm">
                      {format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                    </TableCell>
                    <TableCell>{log.userName || 'Sistema'}</TableCell>
                    <TableCell>
                      <Badge className={ACTION_COLORS[log.action]}>
                        {AUDIT_ACTION_LABELS[log.action]}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{log.moduleName || '-'}</TableCell>
                    <TableCell>{log.entityType || '-'}</TableCell>
                    <TableCell>
                      {log.roleAtTime && (
                        <Badge variant="outline">
                          {log.roleAtTime}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {filteredLogs.length > 100 && (
            <p className="text-center text-sm text-muted-foreground mt-4">
              Exibindo 100 de {filteredLogs.length} registros. Use os filtros para refinar a busca.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dialog de detalhes */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Registro de Auditoria</DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Data/Hora</label>
                  <p>{format(new Date(selectedLog.timestamp), "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Usuário</label>
                  <p>{selectedLog.userName || 'Sistema'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Ação</label>
                  <p>
                    <Badge className={ACTION_COLORS[selectedLog.action]}>
                      {AUDIT_ACTION_LABELS[selectedLog.action]}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Módulo</label>
                  <p className="capitalize">{selectedLog.moduleName || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Entidade</label>
                  <p>{selectedLog.entityType || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">ID da Entidade</label>
                  <p className="text-xs font-mono">{selectedLog.entityId || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Unidade</label>
                  <p>{selectedLog.orgUnitName || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">IP</label>
                  <p className="font-mono">{selectedLog.ipAddress || '-'}</p>
                </div>
              </div>

              {selectedLog.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Descrição</label>
                  <p>{selectedLog.description}</p>
                </div>
              )}

              {selectedLog.beforeData && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Dados Anteriores</label>
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.beforeData, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.afterData && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Dados Novos</label>
                  <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-40">
                    {JSON.stringify(selectedLog.afterData, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.userAgent && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">User Agent</label>
                  <p className="text-xs text-muted-foreground">{selectedLog.userAgent}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </ModuleLayout>
  );
}
