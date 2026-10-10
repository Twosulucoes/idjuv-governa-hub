// ============================================
// PÁGINA DE AUDITORIA
// ============================================

import { useState, useEffect } from 'react';
import { ModuleLayout } from '@/components/layout';
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
  DataTable,
  KpiCard,
  PageHeader,
  StatusBadge,
  type ColunaTabela,
  type TomStatus,
} from '@/components/design-system';
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
  Calendar,
  User,
  Activity
} from 'lucide-react';

// Tom do selo de cada ação (o texto do rótulo sempre aparece; cor nunca sozinha)
const ACTION_TONS: Record<AuditAction, TomStatus> = {
  login: 'sucesso',
  logout: 'neutro',
  login_failed: 'erro',
  password_change: 'andamento',
  password_reset: 'pendente',
  create: 'sucesso',
  update: 'andamento',
  delete: 'erro',
  view: 'neutro',
  export: 'neutro',
  upload: 'neutro',
  download: 'neutro',
  approve: 'sucesso',
  reject: 'erro',
  submit: 'andamento'
};

function AcaoBadge({ action }: { action: AuditAction }) {
  return (
    <StatusBadge tom={ACTION_TONS[action] ?? 'neutro'} icone={false}>
      {AUDIT_ACTION_LABELS[action] ?? action}
    </StatusBadge>
  );
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
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
    setErro(null);
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
      setErro('Não foi possível carregar os registros de auditoria.');
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

  const hoje = new Date().toDateString();

  const indicadores = [
    { rotulo: 'Total de registros', valor: logs.length, icone: Activity },
    {
      rotulo: 'Logins hoje',
      valor: logs.filter(l => l.action === 'login' && new Date(l.timestamp).toDateString() === hoje).length,
      icone: User,
    },
    { rotulo: 'Falhas de login', valor: logs.filter(l => l.action === 'login_failed').length, icone: User },
    {
      rotulo: 'Alterações hoje',
      valor: logs.filter(l =>
        ['create', 'update', 'delete'].includes(l.action) &&
        new Date(l.timestamp).toDateString() === hoje
      ).length,
      icone: Calendar,
    },
  ];

  const colunas: ColunaTabela<AuditLog>[] = [
    {
      id: 'timestamp',
      cabecalho: 'Data/hora',
      celula: (log) => format(new Date(log.timestamp), "dd/MM/yyyy HH:mm:ss", { locale: ptBR }),
      ordenarPor: (log) => new Date(log.timestamp),
      className: 'whitespace-nowrap',
    },
    {
      id: 'usuario',
      cabecalho: 'Usuário',
      celula: (log) => log.userName || 'Sistema',
      ordenarPor: (log) => log.userName,
      mobile: 'titulo',
    },
    {
      id: 'acao',
      cabecalho: 'Ação',
      celula: (log) => <AcaoBadge action={log.action} />,
      ordenarPor: (log) => AUDIT_ACTION_LABELS[log.action],
    },
    {
      id: 'modulo',
      cabecalho: 'Módulo',
      celula: (log) => <span className="capitalize">{log.moduleName || '-'}</span>,
      ordenarPor: (log) => log.moduleName,
    },
    {
      id: 'entidade',
      cabecalho: 'Entidade',
      celula: (log) => log.entityType || '-',
      ordenarPor: (log) => log.entityType,
    },
    {
      id: 'perfil',
      cabecalho: 'Perfil',
      celula: (log) => log.roleAtTime ? <Badge variant="outline">{log.roleAtTime}</Badge> : null,
      ordenarPor: (log) => log.roleAtTime,
    },
  ];

  return (
    <ModuleLayout module="admin">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: "Administração", href: "/admin" }, { rotulo: "Auditoria" }]}
          titulo="Auditoria"
          descricao="Registro das ações realizadas no sistema"
          acoes={
            <Button variant="outline" className="gap-2" onClick={exportToCSV}>
              <Download className="h-4 w-4" aria-hidden="true" />
              Exportar CSV
            </Button>
          }
        />

        {/* Cards de resumo */}
        <section aria-labelledby="auditoria-indicadores">
          <h2 id="auditoria-indicadores" className="sr-only">Indicadores</h2>
          <ul className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {indicadores.map((ind) => (
              <li key={ind.rotulo}>
                <KpiCard
                  rotulo={ind.rotulo}
                  valor={erro ? '—' : ind.valor}
                  icone={ind.icone}
                  carregando={loading}
                  className="h-full"
                />
              </li>
            ))}
          </ul>
        </section>

        {/* Tabela de logs */}
        <DataTable
          rotulo="Registros de auditoria"
          dados={filteredLogs}
          colunas={colunas}
          chaveLinha={(log) => log.id}
          carregando={loading}
          erro={erro}
          aoTentarNovamente={fetchLogs}
          filtros={
            <>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" aria-hidden="true" />
                <Input
                  aria-label="Buscar registros"
                  placeholder="Buscar por usuário, módulo, descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full sm:w-[180px]" aria-label="Tipo de ação">
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
                <SelectTrigger className="w-full sm:w-[180px]" aria-label="Módulo">
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
            </>
          }
          vazio={{
            icone: Activity,
            titulo: "Nenhum registro encontrado",
            descricao: "Ajuste a busca ou os filtros.",
          }}
          acoesLinha={(log) => (
            <Button
              size="icon"
              variant="ghost"
              aria-label={`Ver detalhes do registro de ${log.userName || 'Sistema'} em ${format(new Date(log.timestamp), "dd/MM/yyyy HH:mm", { locale: ptBR })}`}
              onClick={() => setSelectedLog(log)}
            >
              <Eye className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        />
      </div>

      {/* Dialog de detalhes */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do registro de auditoria</DialogTitle>
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
                    <AcaoBadge action={selectedLog.action} />
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
