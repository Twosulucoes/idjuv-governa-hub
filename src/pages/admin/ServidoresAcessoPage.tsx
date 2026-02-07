// ============================================
// PÁGINA DE GESTÃO DE ACESSO DOS SERVIDORES
// Lista todos os servidores e permite gerenciar acesso ao sistema
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { QuickModuloToggle } from '@/components/admin/QuickModuloToggle';
import { MODULES_CONFIG, type Modulo } from '@/shared/config/modules.config';
import { 
  Search, 
  Loader2, 
  RefreshCw, 
  UserPlus,
  UserCheck,
  UserX,
  ChevronDown,
  ChevronUp,
  Info,
  Mail,
} from 'lucide-react';

interface ServidorComAcesso {
  id: string;
  nome_completo: string;
  matricula: string | null;
  cpf: string | null;
  situacao: string;
  vinculo: string;
  cargo_nome: string | null;
  unidade_nome: string | null;
  // Dados do usuário (se existir)
  profile_id: string | null;
  email: string | null;
  is_active: boolean | null;
  perfil_codigo: string | null;
  modulos: Modulo[];
}

export default function ServidoresAcessoPage() {
  const [servidores, setServidores] = useState<ServidorComAcesso[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAcesso, setFilterAcesso] = useState<'all' | 'com_acesso' | 'sem_acesso'>('all');
  const [filterVinculo, setFilterVinculo] = useState<string>('all');
  const [expandedServidor, setExpandedServidor] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchServidores = useCallback(async () => {
    setLoading(true);
    try {
      // Buscar todos os servidores ativos com seus dados de acesso
      const { data, error } = await supabase
        .from('servidores')
        .select(`
          id,
          nome_completo,
          matricula,
          cpf,
          situacao,
          vinculo,
          cargo:cargos(nome),
          unidade:estrutura_organizacional(nome)
        `)
        .eq('situacao', 'ativo')
        .order('nome_completo');

      if (error) throw error;

      // Buscar profiles vinculados
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, servidor_id, email, is_active');

      // Buscar perfis dos usuários
      const { data: perfilData } = await supabase
        .from('usuario_perfis')
        .select('user_id, perfil:perfis(codigo)')
        .eq('ativo', true);

      // Buscar módulos dos usuários
      const { data: modulosData } = await supabase
        .from('usuario_modulos')
        .select('user_id, modulo');

      // Mapear dados
      const servidoresComAcesso: ServidorComAcesso[] = (data || []).map(s => {
        const profile = profiles?.find(p => p.servidor_id === s.id);
        const perfilInfo = perfilData?.find(p => p.user_id === profile?.id);
        const modulos = modulosData
          ?.filter(m => m.user_id === profile?.id)
          .map(m => m.modulo as Modulo) || [];

        return {
          id: s.id,
          nome_completo: s.nome_completo,
          matricula: s.matricula,
          cpf: s.cpf,
          situacao: s.situacao,
          vinculo: s.vinculo,
          cargo_nome: (s.cargo as any)?.nome || null,
          unidade_nome: (s.unidade as any)?.nome || null,
          profile_id: profile?.id || null,
          email: profile?.email || null,
          is_active: profile?.is_active ?? null,
          perfil_codigo: (perfilInfo?.perfil as any)?.codigo || null,
          modulos,
        };
      });

      setServidores(servidoresComAcesso);
    } catch (err: any) {
      console.error('Erro ao buscar servidores:', err);
      toast({ variant: 'destructive', title: 'Erro', description: err.message });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchServidores();
  }, [fetchServidores]);

  // Filtrar servidores
  const servidoresFiltrados = servidores.filter(s => {
    const matchesSearch = 
      s.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.matricula?.includes(searchTerm);
    
    const matchesAcesso = 
      filterAcesso === 'all' ||
      (filterAcesso === 'com_acesso' && s.profile_id) ||
      (filterAcesso === 'sem_acesso' && !s.profile_id);
    
    const matchesVinculo = filterVinculo === 'all' || s.vinculo === filterVinculo;
    
    return matchesSearch && matchesAcesso && matchesVinculo;
  });

  // Toggle módulo
  const handleToggleModulo = async (userId: string, modulo: Modulo, temAtualmente: boolean) => {
    setSaving(true);
    try {
      if (temAtualmente) {
        await supabase
          .from('usuario_modulos')
          .delete()
          .eq('user_id', userId)
          .eq('modulo', modulo);
      } else {
        await supabase
          .from('usuario_modulos')
          .insert({ user_id: userId, modulo });
      }
      toast({ title: temAtualmente ? 'Módulo removido' : 'Módulo adicionado' });
      await fetchServidores();
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Erro', description: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Obter vínculos únicos para filtro
  const vinculos = [...new Set(servidores.map(s => s.vinculo))].sort();

  // Estatísticas
  const stats = {
    total: servidores.length,
    comAcesso: servidores.filter(s => s.profile_id).length,
    semAcesso: servidores.filter(s => !s.profile_id).length,
    ativos: servidores.filter(s => s.is_active).length,
  };

  return (
    <AdminLayout 
      title="Gestão de Acesso dos Servidores" 
      description="Visualize todos os servidores e gerencie seus acessos ao sistema"
    >
      <div className="space-y-6">
        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="py-4">
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Servidores Ativos</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="text-2xl font-bold text-green-600">{stats.comAcesso}</div>
              <div className="text-sm text-muted-foreground">Com Acesso</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="text-2xl font-bold text-amber-600">{stats.semAcesso}</div>
              <div className="text-sm text-muted-foreground">Sem Conta</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="text-2xl font-bold text-blue-600">{stats.ativos}</div>
              <div className="text-sm text-muted-foreground">Usuários Ativos</div>
            </CardContent>
          </Card>
        </div>

        {/* Aviso */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Servidores <strong>sem conta</strong> precisam se cadastrar no sistema. 
            Para servidores <strong>com conta</strong>, expanda para gerenciar módulos.
          </AlertDescription>
        </Alert>

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
          
          <Select value={filterAcesso} onValueChange={(v) => setFilterAcesso(v as any)}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="Acesso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="com_acesso">Com acesso</SelectItem>
              <SelectItem value="sem_acesso">Sem conta</SelectItem>
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

          <Button variant="outline" onClick={fetchServidores} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Lista de servidores */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : servidoresFiltrados.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum servidor encontrado com os filtros aplicados.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {servidoresFiltrados.map((servidor) => {
              const isExpanded = expandedServidor === servidor.id;
              const isSuperAdmin = servidor.perfil_codigo === 'super_admin';
              
              return (
                <Card 
                  key={servidor.id}
                  className={`transition-all ${
                    !servidor.profile_id ? 'border-amber-200 dark:border-amber-900' : ''
                  } ${servidor.is_active === false ? 'opacity-60' : ''}`}
                >
                  <CardContent className="py-3">
                    <div className="flex items-center gap-3">
                      {/* Ícone de status */}
                      <div className="shrink-0">
                        {servidor.profile_id ? (
                          servidor.is_active ? (
                            <UserCheck className="h-5 w-5 text-green-600" />
                          ) : (
                            <UserX className="h-5 w-5 text-red-500" />
                          )
                        ) : (
                          <UserPlus className="h-5 w-5 text-amber-500" />
                        )}
                      </div>

                      {/* Nome e informações */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium truncate">
                            {servidor.nome_completo}
                          </span>
                          {isSuperAdmin && (
                            <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs">
                              Super Admin
                            </Badge>
                          )}
                          {servidor.is_active === false && (
                            <Badge variant="destructive" className="text-xs">
                              Bloqueado
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2 flex-wrap">
                          <span className="capitalize">{servidor.vinculo}</span>
                          {servidor.cargo_nome && (
                            <>
                              <span>•</span>
                              <span className="truncate">{servidor.cargo_nome}</span>
                            </>
                          )}
                          {servidor.email && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {servidor.email}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Módulos (resumo) */}
                      {servidor.profile_id && !isSuperAdmin && (
                        <div className="hidden md:block shrink-0">
                          <Badge variant="outline" className="text-xs">
                            {servidor.modulos.length} módulo(s)
                          </Badge>
                        </div>
                      )}

                      {/* Botão expandir */}
                      {servidor.profile_id && !isSuperAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedServidor(isExpanded ? null : servidor.id)}
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
                    {isExpanded && servidor.profile_id && !isSuperAdmin && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs text-muted-foreground mb-3">
                          Clique para ativar/desativar módulos:
                        </p>
                        <QuickModuloToggle
                          modulosAtivos={servidor.modulos}
                          onToggle={(modulo, temAtualmente) => 
                            handleToggleModulo(servidor.profile_id!, modulo, temAtualmente)
                          }
                          disabled={saving}
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
          Exibindo {servidoresFiltrados.length} de {servidores.length} servidores
        </div>
      </div>
    </AdminLayout>
  );
}
