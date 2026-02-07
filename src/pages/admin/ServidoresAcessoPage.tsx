// ============================================
// PÁGINA DE GESTÃO DE ACESSO DOS SERVIDORES
// Atualizado para usar user_roles e user_modules
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { QuickModuloToggle } from '@/components/admin/QuickModuloToggle';
import { MODULES_CONFIG, type Modulo } from '@/shared/config/modules.config';
import type { AppRole } from '@/types/rbac';
import { 
  Search, 
  Loader2, 
  RefreshCw, 
  UserCheck,
  UserX,
  ChevronDown,
  ChevronUp,
  Mail,
  Shield,
} from 'lucide-react';

interface UsuarioServidor {
  profile_id: string;
  servidor_id: string;
  nome_completo: string;
  matricula: string | null;
  vinculo: string;
  cargo_nome: string | null;
  unidade_nome: string | null;
  email: string;
  is_active: boolean;
  role: AppRole | null;
  modulos: Modulo[];
}

export default function ServidoresAcessoPage() {
  const [usuarios, setUsuarios] = useState<UsuarioServidor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ativo' | 'bloqueado'>('all');
  const [filterVinculo, setFilterVinculo] = useState<string>('all');
  const [expandedUsuario, setExpandedUsuario] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsuarios = useCallback(async () => {
    setLoading(true);
    try {
      // Buscar profiles com servidor vinculado
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, is_active, servidor_id')
        .not('servidor_id', 'is', null);

      if (profilesError) throw profilesError;

      if (!profiles || profiles.length === 0) {
        setUsuarios([]);
        setLoading(false);
        return;
      }

      const servidorIds = profiles.map(p => p.servidor_id).filter(Boolean);
      const profileIds = profiles.map(p => p.id);

      // Buscar dados dos servidores
      const { data: servidores } = await supabase
        .from('servidores')
        .select(`
          id,
          nome_completo,
          matricula,
          vinculo,
          cargo:cargos(nome),
          unidade:estrutura_organizacional(nome)
        `)
        .in('id', servidorIds);

      // Buscar roles dos usuários (nova tabela)
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', profileIds);

      // Buscar módulos dos usuários (nova tabela)
      const { data: modulosData } = await supabase
        .from('user_modules')
        .select('user_id, module')
        .in('user_id', profileIds);

      // Mapear dados
      const usuariosMapeados: UsuarioServidor[] = profiles.map(profile => {
        const servidor = servidores?.find(s => s.id === profile.servidor_id);
        const roleInfo = (rolesData as any[])?.find(r => r.user_id === profile.id);
        const modulos = (modulosData as any[])
          ?.filter(m => m.user_id === profile.id)
          .map(m => m.module as Modulo) || [];

        return {
          profile_id: profile.id,
          servidor_id: profile.servidor_id!,
          nome_completo: servidor?.nome_completo || 'Nome não encontrado',
          matricula: servidor?.matricula || null,
          vinculo: servidor?.vinculo || 'N/A',
          cargo_nome: (servidor?.cargo as any)?.nome || null,
          unidade_nome: (servidor?.unidade as any)?.nome || null,
          email: profile.email || '',
          is_active: profile.is_active ?? false,
          role: roleInfo?.role as AppRole || null,
          modulos,
        };
      });

      // Ordenar por nome
      usuariosMapeados.sort((a, b) => a.nome_completo.localeCompare(b.nome_completo));
      setUsuarios(usuariosMapeados);
    } catch (err: any) {
      console.error('Erro ao buscar usuários:', err);
      toast({ variant: 'destructive', title: 'Erro', description: err.message });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  // Filtrar usuários
  const usuariosFiltrados = usuarios.filter(u => {
    const matchesSearch = 
      u.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.matricula?.includes(searchTerm);
    
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'ativo' && u.is_active) ||
      (filterStatus === 'bloqueado' && !u.is_active);
    
    const matchesVinculo = filterVinculo === 'all' || u.vinculo === filterVinculo;
    
    return matchesSearch && matchesStatus && matchesVinculo;
  });

  // Toggle status ativo/bloqueado
  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    setSaving(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !currentStatus })
        .eq('id', userId);

      if (error) throw error;
      
      toast({ title: !currentStatus ? 'Usuário ativado' : 'Usuário bloqueado' });
      await fetchUsuarios();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message });
    } finally {
      setSaving(null);
    }
  };

  // Toggle módulo
  const handleToggleModulo = async (userId: string, modulo: Modulo, temAtualmente: boolean) => {
    setSaving(userId);
    try {
      if (temAtualmente) {
        await supabase
          .from('user_modules')
          .delete()
          .eq('user_id', userId)
          .eq('module', modulo);
      } else {
        await supabase
          .from('user_modules')
          .insert({ user_id: userId, module: modulo });
      }
      toast({ title: temAtualmente ? 'Módulo removido' : 'Módulo adicionado' });
      await fetchUsuarios();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message });
    } finally {
      setSaving(null);
    }
  };

  // Obter vínculos únicos para filtro
  const vinculos = [...new Set(usuarios.map(u => u.vinculo))].sort();

  // Estatísticas
  const stats = {
    total: usuarios.length,
    ativos: usuarios.filter(u => u.is_active).length,
    bloqueados: usuarios.filter(u => !u.is_active).length,
  };

  return (
    <AdminLayout 
      title="Gestão de Acesso dos Servidores" 
      description="Gerencie o acesso e módulos dos servidores cadastrados no sistema"
    >
      <div className="space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="py-4">
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total com Conta</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="text-2xl font-bold text-primary">{stats.ativos}</div>
              <div className="text-sm text-muted-foreground">Ativos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="text-2xl font-bold text-destructive">{stats.bloqueados}</div>
              <div className="text-sm text-muted-foreground">Bloqueados</div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou matrícula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
            <SelectTrigger className="w-full lg:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="bloqueado">Bloqueados</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterVinculo} onValueChange={setFilterVinculo}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Vínculo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os vínculos</SelectItem>
              {vinculos.map(v => (
                <SelectItem key={v} value={v}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={fetchUsuarios} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Lista de usuários */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {usuarios.length === 0 
                ? 'Nenhum servidor possui conta no sistema ainda.' 
                : 'Nenhum usuário encontrado com os filtros aplicados.'}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {usuariosFiltrados.map((usuario) => {
              const isExpanded = expandedUsuario === usuario.profile_id;
              const isAdmin = usuario.role === 'admin';
              const isSaving = saving === usuario.profile_id;
              
              return (
                <Card 
                  key={usuario.profile_id}
                  className={`transition-all ${!usuario.is_active ? 'opacity-60 border-destructive/30' : ''}`}
                >
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      {/* Ícone de status */}
                      <div className="shrink-0">
                        {usuario.is_active ? (
                          <UserCheck className="h-5 w-5 text-primary" />
                        ) : (
                          <UserX className="h-5 w-5 text-destructive" />
                        )}
                      </div>

                      {/* Nome e informações */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">
                            {usuario.nome_completo}
                          </span>
                          {isAdmin && (
                            <Badge className="bg-primary/10 text-primary border-primary/30 text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                          <span className="capitalize">{usuario.vinculo}</span>
                          {usuario.cargo_nome && (
                            <>
                              <span>•</span>
                              <span className="truncate">{usuario.cargo_nome}</span>
                            </>
                          )}
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {usuario.email}
                          </span>
                        </div>
                      </div>

                      {/* Toggle ativo/bloqueado */}
                      {!isAdmin && (
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-muted-foreground hidden sm:block">
                            {usuario.is_active ? 'Ativo' : 'Bloqueado'}
                          </span>
                          <Switch
                            checked={usuario.is_active}
                            onCheckedChange={() => handleToggleStatus(usuario.profile_id, usuario.is_active)}
                            disabled={isSaving}
                          />
                        </div>
                      )}

                      {/* Módulos (resumo) */}
                      {!isAdmin && (
                        <Badge variant="outline" className="text-xs hidden md:flex">
                          {usuario.modulos.length} módulo(s)
                        </Badge>
                      )}

                      {/* Botão expandir */}
                      {!isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedUsuario(isExpanded ? null : usuario.profile_id)}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>

                    {/* Área expandida - Módulos */}
                    {isExpanded && !isAdmin && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-muted-foreground mb-3">
                          Clique para ativar/desativar módulos:
                        </p>
                        <QuickModuloToggle
                          modulosAtivos={usuario.modulos}
                          onToggle={(modulo, temAtualmente) => 
                            handleToggleModulo(usuario.profile_id, modulo, temAtualmente)
                          }
                          disabled={isSaving}
                          isSuperAdmin={false}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Contador */}
        <div className="text-center text-sm text-muted-foreground">
          Exibindo {usuariosFiltrados.length} de {usuarios.length} usuários
        </div>
      </div>
    </AdminLayout>
  );
}
