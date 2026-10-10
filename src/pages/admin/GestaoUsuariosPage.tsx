// ============================================
// TELA DE GESTÃO DE USUÁRIOS — PAINEL DIVIDIDO
// Lista à esquerda, detalhes + edição à direita
// ============================================

import { useState, useCallback } from 'react';
import { ModuleLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState, KpiCard, PageHeader, StatusBadge } from '@/components/design-system';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAdminUsuarios } from '@/hooks/useAdminUsuarios';
import { QuickModuloToggle } from '@/components/admin/QuickModuloToggle';
import { CriarUsuarioDialog } from '@/components/admin/CriarUsuarioDialog';
import { MODULO_LABELS, type UsuarioAdmin, type Modulo } from '@/types/rbac';
import { isProtectedAdmin } from '@/shared/config/protected-users.config';
import {
  Search, Loader2, RefreshCw, UserPlus, Lock, ShieldCheck,
  ShieldOff, User, Mail, Calendar, Package, AlertTriangle,
  CheckCircle2, XCircle, ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// ——— Painel de detalhes do usuário selecionado ———
interface PainelDetalhesProps {
  usuario: UsuarioAdmin;
  saving: boolean;
  onToggleModulo: (modulo: Modulo, tem: boolean) => void;
  onToggleAtivo: (ativo: boolean) => void;
}

function PainelDetalhes({ usuario, saving, onToggleModulo, onToggleAtivo }: PainelDetalhesProps) {
  const [confirmBloqueio, setConfirmBloqueio] = useState(false);
  const isProtected = isProtectedAdmin(usuario.id, usuario.email);

  const getInitials = (name: string | null) =>
    !name ? 'U' : name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Cabeçalho do usuário */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16 shrink-0">
              <AvatarImage src={usuario.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                {getInitials(usuario.full_name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-semibold">{usuario.full_name || 'Sem nome'}</h2>
                {isProtected && (
                  <StatusBadge tom="pendente" icone={false}>
                    <Lock className="h-3 w-3" aria-hidden="true" /> Protegido
                  </StatusBadge>
                )}
                {!usuario.is_active && (
                  <StatusBadge tom="erro">Bloqueado</StatusBadge>
                )}
                {usuario.is_active && (
                  <StatusBadge tom="sucesso">Ativo</StatusBadge>
                )}
              </div>

              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{usuario.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="capitalize">{usuario.tipo_usuario === 'tecnico' ? 'Usuário técnico' : 'Usuário-servidor'}</span>
                </div>
                {usuario.created_at && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>Cadastrado em {format(new Date(usuario.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Botão de bloqueio */}
          {!isProtected && (
            <div className="mt-4 pt-4 border-t">
              {usuario.is_active ? (
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                  disabled={saving}
                  onClick={() => setConfirmBloqueio(true)}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldOff className="h-4 w-4" aria-hidden="true" />}
                  Bloquear usuário
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2 text-success border-success/40 hover:bg-success/10"
                  disabled={saving}
                  onClick={() => onToggleAtivo(true)}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
                  Desbloquear usuário
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Módulos */}
      <Card className="flex-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Package className="h-4 w-4" aria-hidden="true" />
            Módulos de acesso
            <Badge variant="secondary" className="ml-auto text-xs">
              {usuario.modulos.length} ativo{usuario.modulos.length !== 1 ? 's' : ''}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isProtected ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>Super admin — acesso total a todos os módulos</span>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-3">
                Clique para ativar/desativar módulos deste usuário:
              </p>
              <QuickModuloToggle
                modulosAtivos={usuario.modulos}
                onToggle={onToggleModulo}
                disabled={saving}
                isSuperAdmin={false}
              />
              {usuario.modulos.length === 0 && (
                <Alert className="mt-3" variant="destructive">
                  <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                  <AlertDescription>
                    Usuário sem módulos — não conseguirá acessar o sistema.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirmar bloqueio */}
      <AlertDialog open={confirmBloqueio} onOpenChange={setConfirmBloqueio}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bloquear usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{usuario.full_name || usuario.email}</strong> não conseguirá acessar o sistema
              enquanto estiver bloqueado. Você pode desbloquear a qualquer momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => { setConfirmBloqueio(false); onToggleAtivo(false); }}
            >
              Bloquear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ——— Página principal ———
export default function GestaoUsuariosPage() {
  const { usuarios, loading, saving, error, fetchUsuarios, toggleModulo, toggleUsuarioAtivo } = useAdminUsuarios();

  const [searchTerm, setSearchTerm] = useState('');
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<UsuarioAdmin | null>(null);
  const [showCriarDialog, setShowCriarDialog] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativos' | 'bloqueados'>('todos');

  const usuariosFiltrados = usuarios.filter(u => {
    const matchSearch =
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus =
      filtroStatus === 'todos' ||
      (filtroStatus === 'ativos' && u.is_active) ||
      (filtroStatus === 'bloqueados' && !u.is_active);
    return matchSearch && matchStatus;
  });

  // Sync usuário selecionado com dados atualizados
  const usuarioAtual = usuarioSelecionado
    ? usuarios.find(u => u.id === usuarioSelecionado.id) ?? usuarioSelecionado
    : null;

  const getInitials = (name: string | null) =>
    !name ? 'U' : name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleToggleModulo = useCallback(async (modulo: Modulo, tem: boolean) => {
    if (!usuarioAtual) return;
    await toggleModulo(usuarioAtual.id, modulo, tem);
  }, [usuarioAtual, toggleModulo]);

  const handleToggleAtivo = useCallback(async (ativo: boolean) => {
    if (!usuarioAtual) return;
    await toggleUsuarioAtivo(usuarioAtual.id, ativo);
  }, [usuarioAtual, toggleUsuarioAtivo]);

  const stats = {
    total: usuarios.length,
    ativos: usuarios.filter(u => u.is_active).length,
    bloqueados: usuarios.filter(u => !u.is_active).length,
    semModulos: usuarios.filter(u => u.is_active && u.modulos.length === 0).length,
  };

  return (
    <ModuleLayout module="admin">
      <div className="flex flex-col gap-6 h-full">
        <PageHeader
          migalhas={[{ rotulo: 'Administração', href: '/admin' }, { rotulo: 'Usuários' }]}
          titulo="Usuários"
          descricao="Acesso dos usuários por módulo e bloqueio de contas"
          acoes={
            <>
              <Button variant="outline" onClick={() => fetchUsuarios()} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                Atualizar
              </Button>
              <Button onClick={() => setShowCriarDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" aria-hidden="true" />
                Novo usuário
              </Button>
            </>
          }
        />

        {/* Indicadores */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <KpiCard rotulo="Total" valor={stats.total} icone={User} carregando={loading} />
          <KpiCard rotulo="Ativos" valor={stats.ativos} icone={CheckCircle2} carregando={loading} />
          <KpiCard rotulo="Bloqueados" valor={stats.bloqueados} icone={XCircle} carregando={loading} />
          <KpiCard rotulo="Sem módulo" valor={stats.semModulos} icone={AlertTriangle} carregando={loading} />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>Erro ao carregar usuários: {error}</AlertDescription>
          </Alert>
        )}

        {/* Layout dividido */}
        <div className="flex gap-4 flex-1 min-h-0" style={{ minHeight: '500px' }}>
          {/* Coluna esquerda — lista */}
          <div className="flex flex-col gap-3 w-full lg:w-80 xl:w-96 shrink-0">
            {/* Barra de busca */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  aria-label="Buscar usuário"
                  placeholder="Buscar usuário..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Filtros de status */}
            <div className="flex gap-1" role="group" aria-label="Filtrar por situação">
              {(['todos', 'ativos', 'bloqueados'] as const).map(f => (
                <Button
                  key={f}
                  aria-pressed={filtroStatus === f}
                  variant={filtroStatus === f ? 'secondary' : 'ghost'}
                  size="sm"
                  className="flex-1 text-xs capitalize"
                  onClick={() => setFiltroStatus(f)}
                >
                  {f}
                </Button>
              ))}
            </div>

            {/* Lista de usuários */}
            <Card className="flex-1 overflow-hidden">
              {loading ? (
                <div className="flex items-center justify-center py-12" role="status" aria-label="Carregando usuários">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
                </div>
              ) : usuariosFiltrados.length === 0 ? (
                <EmptyState icone={User} titulo="Nenhum usuário encontrado" />
              ) : (
                <ScrollArea className="h-full">
                  <div className="divide-y">
                    {usuariosFiltrados.map(usuario => {
                      const selecionado = usuarioAtual?.id === usuario.id;
                      const isProtected = isProtectedAdmin(usuario.id, usuario.email);

                      return (
                        <button
                          key={usuario.id}
                          className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors hover:bg-muted/50
                            ${selecionado ? 'bg-primary/5 border-l-2 border-primary' : 'border-l-2 border-transparent'}
                            ${!usuario.is_active ? 'opacity-60' : ''}`}
                          onClick={() => setUsuarioSelecionado(usuario)}
                          aria-current={selecionado ? 'true' : undefined}
                        >
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarImage src={usuario.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {getInitials(usuario.full_name)}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-medium truncate">
                                {usuario.full_name || 'Sem nome'}
                              </span>
                              {isProtected && <Lock className="h-3 w-3 text-warning shrink-0" role="img" aria-label="Protegido" />}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-muted-foreground truncate">{usuario.email}</span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            {!usuario.is_active ? (
                              <StatusBadge tom="erro" icone={false} className="px-1.5 py-0">Bloqueado</StatusBadge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground">
                                {usuario.modulos.length} mod.
                              </Badge>
                            )}
                            {selecionado && <ChevronRight className="h-3.5 w-3.5 text-primary" aria-hidden="true" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </Card>
          </div>

          {/* Coluna direita — detalhes */}
          <div className="flex-1 min-w-0">
            {usuarioAtual ? (
              <PainelDetalhes
                usuario={usuarioAtual}
                saving={saving}
                onToggleModulo={handleToggleModulo}
                onToggleAtivo={handleToggleAtivo}
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <EmptyState
                  icone={User}
                  titulo="Selecione um usuário na lista"
                  descricao="para ver e editar seus dados"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <CriarUsuarioDialog
        open={showCriarDialog}
        onOpenChange={setShowCriarDialog}
        onSuccess={() => fetchUsuarios()}
      />
    </ModuleLayout>
  );
}
