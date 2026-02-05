// ============================================
// PÁGINA DE TROCA DE SENHA OBRIGATÓRIA
// ============================================
// Exibida quando o admin reseta a senha e o usuário precisa trocar

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  Lock,
  Eye, 
  EyeOff, 
  AlertTriangle,
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { z } from 'zod';

// Validação da nova senha
const passwordSchema = z.object({
  novaSenha: z.string().min(6, 'Nova senha deve ter pelo menos 6 caracteres'),
  confirmarSenha: z.string()
}).refine(data => data.novaSenha === data.confirmarSenha, {
  message: 'As senhas não coincidem',
  path: ['confirmarSenha']
});

export default function TrocaSenhaObrigatoriaPage() {
  const { user, refreshUser, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleTrocarSenha = async () => {
    setErrors({});
    
    // Validar com Zod
    const validation = passwordSchema.safeParse({ novaSenha, confirmarSenha });
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
      // Atualizar senha no Supabase Auth
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

      // Remover flag requires_password_change do profile
      if (user?.id) {
        await supabase
          .from('profiles')
          .update({ 
            requires_password_change: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
      }

      toast({
        title: 'Senha alterada com sucesso!',
        description: 'Você será redirecionado para o sistema.',
      });

      // Atualizar contexto e redirecionar
      await refreshUser();
      navigate('/sistema');

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

  const handleSair = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
          </div>
          <CardTitle>Troca de Senha Obrigatória</CardTitle>
          <CardDescription>
            Sua senha foi resetada pelo administrador. 
            Por segurança, você precisa definir uma nova senha antes de continuar.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950/30">
            <ShieldCheck className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-700 dark:text-amber-400">Atenção</AlertTitle>
            <AlertDescription className="text-amber-600 dark:text-amber-300">
              Você não poderá acessar o sistema até definir uma nova senha.
            </AlertDescription>
          </Alert>

          {/* Nova Senha */}
          <div className="space-y-2">
            <Label htmlFor="novaSenha">Nova Senha *</Label>
            <div className="relative">
              <Input
                id="novaSenha"
                type={showNovaSenha ? 'text' : 'password'}
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
                placeholder="Digite sua nova senha"
                className={errors.novaSenha ? 'border-destructive' : ''}
                autoFocus
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
                placeholder="Confirme sua nova senha"
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

          <div className="flex flex-col gap-2 pt-2">
            <Button 
              onClick={handleTrocarSenha} 
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Alterando...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Definir Nova Senha
                </>
              )}
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={handleSair}
              className="w-full text-muted-foreground"
            >
              Sair do Sistema
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
