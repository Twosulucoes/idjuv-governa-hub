// ============================================
// PÁGINA MEU PERFIL
// ============================================
// Permite ao usuário visualizar dados pessoais e alterar sua senha

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Shield, 
  Eye, 
  EyeOff, 
  Lock,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';

// Validação da nova senha
const passwordSchema = z.object({
  senhaAtual: z.string().min(1, 'Senha atual é obrigatória'),
  novaSenha: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
  confirmarSenha: z.string()
}).refine(data => data.novaSenha === data.confirmarSenha, {
  message: 'As senhas não coincidem',
  path: ['confirmarSenha']
});

export default function MeuPerfilPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleAlterarSenha = async () => {
    setErrors({});
    
    // Validar com Zod
    const validation = passwordSchema.safeParse({ senhaAtual, novaSenha, confirmarSenha });
    if (!validation.success) {
      const errs: Record<string, string> = {};
      validation.error.errors.forEach(e => {
        errs[e.path[0] as string] = e.message;
      });
      setErrors(errs);
      return;
    }

    setLoading(true);

    try {
      // Verificar senha atual re-autenticando
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || '',
        password: senhaAtual
      });

      if (signInError) {
        setErrors({ senhaAtual: 'Senha atual incorreta' });
        setLoading(false);
        return;
      }

      // Atualizar para nova senha
      const { error: updateError } = await supabase.auth.updateUser({
        password: novaSenha
      });

      if (updateError) {
        toast({
          variant: 'destructive',
          title: 'Erro ao atualizar senha',
          description: updateError.message
        });
        setLoading(false);
        return;
      }

      // Limpar campos
      setSenhaAtual('');
      setNovaSenha('');
      setConfirmarSenha('');

      toast({
        title: 'Senha alterada!',
        description: 'Sua senha foi atualizada com sucesso.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Ocorreu um erro ao alterar a senha.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl py-8">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">Gerencie suas informações pessoais e segurança</p>
        </div>

        <Tabs defaultValue="dados" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dados" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Dados Pessoais
            </TabsTrigger>
            <TabsTrigger value="seguranca" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Segurança
            </TabsTrigger>
          </TabsList>

          {/* Tab Dados Pessoais */}
          <TabsContent value="dados" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Usuário</CardTitle>
                <CardDescription>Seus dados cadastrados no sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={user.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl">
                      {getInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{user.fullName || 'Usuário'}</h3>
                    <p className="text-muted-foreground">{user.email}</p>
                    {user.tipoUsuario && (
                      <span className="text-sm text-muted-foreground capitalize">
                        {user.tipoUsuario}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground">Nome Completo</Label>
                    <p className="font-medium">{user.fullName || 'Não informado'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Email</Label>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Permissões</Label>
                    <p className="font-medium">{user.permissions.length} permissões atribuídas</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <p className="font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Ativo
                    </p>
                  </div>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Para alterar seus dados pessoais, entre em contato com o administrador do sistema.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab Segurança */}
          <TabsContent value="seguranca" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Alterar Senha
                </CardTitle>
                <CardDescription>
                  Mantenha sua conta segura alterando sua senha periodicamente
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Senha Atual */}
                <div className="space-y-2">
                  <Label htmlFor="senhaAtual">Senha Atual *</Label>
                  <div className="relative">
                    <Input
                      id="senhaAtual"
                      type={showSenhaAtual ? 'text' : 'password'}
                      value={senhaAtual}
                      onChange={(e) => setSenhaAtual(e.target.value)}
                      placeholder="Digite sua senha atual"
                      className={errors.senhaAtual ? 'border-destructive' : ''}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowSenhaAtual(!showSenhaAtual)}
                    >
                      {showSenhaAtual ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.senhaAtual && (
                    <p className="text-sm text-destructive">{errors.senhaAtual}</p>
                  )}
                </div>

                {/* Nova Senha */}
                <div className="space-y-2">
                  <Label htmlFor="novaSenha">Nova Senha *</Label>
                  <div className="relative">
                    <Input
                      id="novaSenha"
                      type={showNovaSenha ? 'text' : 'password'}
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      placeholder="Digite a nova senha"
                      className={errors.novaSenha ? 'border-destructive' : ''}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowNovaSenha(!showNovaSenha)}
                    >
                      {showNovaSenha ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.novaSenha && (
                    <p className="text-sm text-destructive">{errors.novaSenha}</p>
                  )}
                  <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres</p>
                </div>

                {/* Confirmar Nova Senha */}
                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha">Confirmar Nova Senha *</Label>
                  <div className="relative">
                    <Input
                      id="confirmarSenha"
                      type={showConfirmar ? 'text' : 'password'}
                      value={confirmarSenha}
                      onChange={(e) => setConfirmarSenha(e.target.value)}
                      placeholder="Confirme a nova senha"
                      className={errors.confirmarSenha ? 'border-destructive' : ''}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowConfirmar(!showConfirmar)}
                    >
                      {showConfirmar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {errors.confirmarSenha && (
                    <p className="text-sm text-destructive">{errors.confirmarSenha}</p>
                  )}
                </div>

                <Button 
                  onClick={handleAlterarSenha} 
                  disabled={loading}
                  className="w-full mt-4"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Alterando...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Alterar Senha
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
