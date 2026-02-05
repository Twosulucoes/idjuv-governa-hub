// ============================================
// PÁGINA DE DETALHES DO USUÁRIO (TELA CHEIA)
// ============================================

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { useAdminPerfis } from '@/hooks/useAdminPerfis';
import { UsuarioModulosTab } from '@/components/admin/UsuarioModulosTab';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { UsuarioAdmin } from '@/types/rbac';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ArrowLeft,
  Shield,
  Info,
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
  UserCog,
} from 'lucide-react';

export default function UsuarioDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { usuarios, loading, saving, associarPerfil, desassociarPerfil, toggleUsuarioAtivo } = useAdminUsuarios();
  const { perfisAtivos } = useAdminPerfis();
  
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

  const handleTogglePerfil = async (perfilId: string) => {
    if (!usuario) return;
    
    const tem = usuario.perfis.some(p => p.perfil_id === perfilId);
    
    try {
      if (tem) {
        await desassociarPerfil(usuario.id, perfilId);
      } else {
        await associarPerfil(usuario.id, perfilId);
      }
    } catch {
      // Error handled by hook
    }
  };

  const handleToggleStatus = async () => {
    if (!usuario) return;
    await toggleUsuarioAtivo(usuario.id, !usuario.is_active);
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
                    <Badge variant="outline">
                      {usuario.tipo_usuario === 'servidor' ? 'Servidor' : 'Técnico'}
                    </Badge>
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

        {/* Tabs organizadas */}
        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dados" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Dados</span>
            </TabsTrigger>
            <TabsTrigger value="perfis" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Perfis</span>
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
                  <Info className="h-5 w-5" />
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
                      <UserCog className="h-4 w-4" />
                      Tipo de Usuário
                    </div>
                    <p className="font-medium">
                      {usuario.tipo_usuario === 'servidor' ? 'Servidor' : 'Técnico'}
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
                      <Shield className="h-4 w-4" />
                      Perfis Associados
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {usuario.perfis.length > 0 ? (
                        usuario.perfis.map(up => (
                          <Badge 
                            key={up.id} 
                            variant="secondary"
                            className="text-xs"
                            style={{ 
                              borderColor: up.perfil?.cor || undefined,
                              borderWidth: up.perfil?.cor ? 1 : 0
                            }}
                          >
                            {up.perfil?.nome || 'Perfil'}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">Nenhum perfil associado</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Perfis */}
          <TabsContent value="perfis" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Perfis de Acesso
                </CardTitle>
                <CardDescription>
                  Selecione os perfis que este usuário deve possuir
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="mb-4">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Usuários herdam todas as permissões dos perfis associados.
                    Clique em um perfil para associar ou desassociar.
                  </AlertDescription>
                </Alert>
                
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-2">
                    {perfisAtivos.map(perfil => {
                      const tem = usuario.perfis.some(p => p.perfil_id === perfil.id);
                      
                      return (
                        <div
                          key={perfil.id}
                          className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                            tem ? 'bg-primary/10 border-primary/30' : 'hover:bg-accent'
                          }`}
                          onClick={() => !saving && handleTogglePerfil(perfil.id)}
                        >
                          <Checkbox checked={tem} disabled={saving} />
                          <div 
                            className="w-4 h-4 rounded-full shrink-0"
                            style={{ backgroundColor: perfil.cor || 'hsl(var(--muted-foreground))' }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{perfil.nome}</div>
                            <div className="text-sm text-muted-foreground truncate">
                              {perfil.descricao || 'Sem descrição'}
                            </div>
                          </div>
                          {tem && (
                            <CheckCircle className="h-5 w-5 text-primary shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Módulos/Domínios */}
          <TabsContent value="modulos" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Boxes className="h-5 w-5" />
                  Domínios Acessíveis
                </CardTitle>
                <CardDescription>
                  Visualize os domínios que o usuário pode acessar com base nos perfis associados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UsuarioModulosTab 
                  userId={usuario.id} 
                  userName={usuario.full_name || undefined}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialog de Senha Temporária */}
        <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-amber-500" />
                Senha Resetada
              </DialogTitle>
              <DialogDescription>
                A senha foi alterada com sucesso. Anote a senha temporária abaixo.
              </DialogDescription>
            </DialogHeader>
            
            <Alert variant="default" className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                <strong>Atenção:</strong> Esta senha será exibida apenas uma vez.
                O usuário deverá alterá-la no próximo login.
              </AlertDescription>
            </Alert>

            <div className="flex items-center gap-2 p-4 bg-muted rounded-lg font-mono text-lg">
              <span className="flex-1 select-all">{tempPassword}</span>
              <Button variant="ghost" size="icon" onClick={handleCopyPassword}>
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
