// ============================================
// PÁGINA DE DETALHES DO USUÁRIO (SIMPLIFICADO)
// ============================================

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAdminUsuarios } from '@/hooks/useAdminUsuarios';
import { UsuarioPerfilTab } from '@/components/admin/UsuarioPerfilTab';
import { UsuarioModulosTab } from '@/components/admin/UsuarioModulosTab';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PERFIL_LABELS, PERFIL_CORES, type PerfilCodigo, type Modulo } from '@/types/rbac';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowLeft,
  Shield,
  Loader2,
  Ban,
  CheckCircle,
  Boxes,
  KeyRound,
  Copy,
  AlertTriangle,
  User,
  Mail,
  Calendar,
} from 'lucide-react';

export default function UsuarioDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { 
    usuarios, 
    loading, 
    saving, 
    definirPerfil, 
    toggleModulo, 
    toggleUsuarioAtivo 
  } = useAdminUsuarios();
  
  // Estados para reset de senha
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  // Buscar usuário atual
  const usuario = usuarios.find(u => u.id === id) || null;

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleToggleStatus = async () => {
    if (!usuario) return;
    await toggleUsuarioAtivo(usuario.id, !usuario.is_active);
  };

  const handleDefinirPerfil = async (perfilCodigo: PerfilCodigo) => {
    if (!usuario) return;
    await definirPerfil(usuario.id, perfilCodigo);
  };

  const handleToggleModulo = async (modulo: Modulo, temAtualmente: boolean) => {
    if (!usuario) return;
    await toggleModulo(usuario.id, modulo, temAtualmente);
  };

  // Função para resetar senha via edge function
  const handleResetPassword = async () => {
    if (!usuario) return;
    
    setResetting(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-reset-password', {
        body: { userId: usuario.id }
      });

      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erro ao resetar senha',
          description: error.message
        });
        return;
      }

      if (data?.error) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: data.error
        });
        return;
      }

      setTempPassword(data.senhaTemporaria);
      setResetDialogOpen(true);
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Ocorreu um erro ao resetar a senha.'
      });
    } finally {
      setResetting(false);
    }
  };

  const handleCopyPassword = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      toast({
        title: 'Copiado!',
        description: 'Senha copiada para a área de transferência.'
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Carregando..." description="">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (!usuario) {
    return (
      <AdminLayout title="Usuário não encontrado" description="">
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <AlertTriangle className="h-12 w-12 text-muted-foreground" />
          <p className="text-muted-foreground">Usuário não encontrado ou sem permissão de acesso.</p>
          <Button variant="outline" onClick={() => navigate('/admin/usuarios')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para lista
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const perfilCodigo = usuario.perfil?.perfil?.codigo as PerfilCodigo | undefined;

  return (
    <AdminLayout 
      title="Detalhes do Usuário" 
      description="Visualize e gerencie as informações do usuário"
    >
      <div className="space-y-6">
        {/* Header com botão voltar e informações do usuário */}
        <div className="flex flex-col md:flex-row md:items-start gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/admin/usuarios')}
            className="self-start"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <Card className="flex-1">
            <CardContent className="py-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={usuario.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-xl">
                    {getInitials(usuario.full_name)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold truncate">
                    {usuario.full_name || 'Sem nome'}
                  </h2>
                  <p className="text-muted-foreground truncate">
                    {usuario.email}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {perfilCodigo && (
                      <Badge className={PERFIL_CORES[perfilCodigo]}>
                        {PERFIL_LABELS[perfilCodigo]}
                      </Badge>
                    )}
                    {usuario.is_active ? (
                      <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/30">
                        Ativo
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        Bloqueado
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cards de ações rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status do usuário */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Status do Usuário</div>
                  <div className="text-sm text-muted-foreground">
                    {usuario.is_active ? 'Usuário pode acessar o sistema' : 'Acesso ao sistema bloqueado'}
                  </div>
                </div>
                <Button
                  variant={usuario.is_active ? 'destructive' : 'default'}
                  size="sm"
                  onClick={handleToggleStatus}
                  disabled={saving}
                >
                  {usuario.is_active ? (
                    <>
                      <Ban className="h-4 w-4 mr-2" />
                      Bloquear
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Desbloquear
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resetar Senha */}
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">Segurança</div>
                  <div className="text-sm text-muted-foreground">
                    Gerar nova senha temporária
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetPassword}
                  disabled={resetting}
                >
                  {resetting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Resetando...
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-4 w-4 mr-2" />
                      Resetar Senha
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs simplificadas: Perfil + Módulos */}
        <Tabs defaultValue="perfil" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dados" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Dados</span>
            </TabsTrigger>
            <TabsTrigger value="perfil" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Perfil</span>
            </TabsTrigger>
            <TabsTrigger value="modulos" className="flex items-center gap-2">
              <Boxes className="h-4 w-4" />
              <span className="hidden sm:inline">Módulos</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab Dados */}
          <TabsContent value="dados" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Informações Básicas
                </CardTitle>
                <CardDescription>
                  Dados cadastrais do usuário
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      Email
                    </div>
                    <p className="font-medium">{usuario.email}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      Perfil
                    </div>
                    <p className="font-medium">
                      {perfilCodigo ? PERFIL_LABELS[perfilCodigo] : 'Sem perfil'}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      Data de Criação
                    </div>
                    <p className="font-medium">
                      {usuario.created_at 
                        ? format(new Date(usuario.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                        : 'Não informada'}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Boxes className="h-4 w-4" />
                      Módulos Liberados
                    </div>
                    <p className="font-medium">
                      {perfilCodigo === 'super_admin' 
                        ? 'Todos (Super Admin)' 
                        : `${usuario.modulos.length} módulo(s)`
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Perfil */}
          <TabsContent value="perfil" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Tipo de Perfil
                </CardTitle>
                <CardDescription>
                  Defina se o usuário é Gestor ou Servidor
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UsuarioPerfilTab
                  usuario={usuario}
                  saving={saving}
                  onDefinirPerfil={handleDefinirPerfil}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Módulos */}
          <TabsContent value="modulos" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Boxes className="h-5 w-5" />
                  Módulos Liberados
                </CardTitle>
                <CardDescription>
                  Selecione quais áreas do sistema o usuário pode acessar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UsuarioModulosTab
                  usuario={usuario}
                  saving={saving}
                  onToggleModulo={handleToggleModulo}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de senha temporária */}
        <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Senha Temporária Gerada</DialogTitle>
              <DialogDescription>
                Uma nova senha temporária foi criada para o usuário. Copie e envie para o usuário.
              </DialogDescription>
            </DialogHeader>

            <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
              <code className="text-lg font-mono">{tempPassword}</code>
              <Button variant="ghost" size="sm" onClick={handleCopyPassword}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>

            <DialogFooter>
              <Button onClick={() => setResetDialogOpen(false)}>
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
