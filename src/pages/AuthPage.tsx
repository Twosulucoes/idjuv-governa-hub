// ============================================
// PÁGINA DE AUTENTICAÇÃO
// ============================================
// Login e Recuperação de Senha (cadastro feito pelo admin)

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, ArrowLeft, Shield, KeyRound, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { z } from 'zod';

// ============================================
// SCHEMAS DE VALIDAÇÃO
// ============================================

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres')
});

const resetPasswordSchema = z.object({
  email: z.string().email('Email inválido')
});

const newPasswordSchema = z.object({
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword']
});

// ============================================
// COMPONENTE
// ============================================

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { signIn, resetPassword, updatePassword, isAuthenticated, isLoading: authLoading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'login' | 'forgot'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isResetMode, setIsResetMode] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [isRecoveryReady, setIsRecoveryReady] = useState(false);
  
  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [forgotForm, setForgotForm] = useState({ email: '' });
  const [newPasswordForm, setNewPasswordForm] = useState({ password: '', confirmPassword: '' });

  // Detectar e concluir o modo de reset via URL (hash com token OU query com code)
  useEffect(() => {
    const checkResetMode = async () => {
      const mode = searchParams.get('mode');
      const code = searchParams.get('code');
      const hash = window.location.hash;

      const isLikelyResetLink =
        mode === 'reset' ||
        (hash && (hash.includes('type=recovery') || hash.includes('access_token'))) ||
        !!code;

      if (!isLikelyResetLink) {
        setIsCheckingSession(false);
        return;
      }

      setIsResetMode(true);

      // Se vier no formato novo (?code=), precisamos trocar por sessão antes de atualizar senha
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError('Link de recuperação inválido ou expirado. Solicite um novo email.');
          setIsRecoveryReady(false);
          setIsCheckingSession(false);
          return;
        }

        // Limpa a URL (evita reprocessar o code)
        navigate('/auth?mode=reset', { replace: true });
      }

      // Confirma que existe sessão (token válido) para permitir updateUser(password)
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setError('Link de recuperação inválido ou expirado. Solicite um novo email.');
        setIsRecoveryReady(false);
      } else {
        setIsRecoveryReady(true);
      }

      setIsCheckingSession(false);
    };

    checkResetMode();
  }, [searchParams, navigate]);

  // Redirect se já autenticado (exceto no modo de reset)
  useEffect(() => {
    if (isAuthenticated && !isResetMode && !isCheckingSession) {
      const from = (location.state as any)?.from?.pathname || '/sistema';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location, isResetMode, isCheckingSession]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      loginSchema.parse(loginForm);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }
    
    setIsLoading(true);
    const { error } = await signIn(loginForm.email, loginForm.password);
    setIsLoading(false);
    
    if (error) {
      setError('Email ou senha incorretos');
    }
  };


  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      resetPasswordSchema.parse(forgotForm);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }
    
    setIsLoading(true);
    const { error } = await resetPassword(forgotForm.email);
    setIsLoading(false);
    
    if (!error) {
      setSuccess('Email de recuperação enviado! Verifique sua caixa de entrada.');
      setForgotForm({ email: '' });
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    try {
      newPasswordSchema.parse(newPasswordForm);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }
    
    setIsLoading(true);
    const { error } = await updatePassword(newPasswordForm.password);
    setIsLoading(false);
    
    if (!error) {
      setSuccess('Senha atualizada com sucesso!');
      setTimeout(() => {
        navigate('/auth', { replace: true });
      }, 2000);
    }
  };

  // ============================================
  // LOADING GLOBAL
  // ============================================

  if (authLoading || isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ============================================
  // RENDERIZAÇÃO - MODO RESET
  // ============================================

  if (isResetMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center">
              <div className="p-3 bg-primary/10 rounded-full">
                <KeyRound className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Redefinir Senha</h1>
            <p className="text-muted-foreground">Digite sua nova senha</p>
          </div>

          <Card className="shadow-lg">
            <CardContent className="pt-6">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                <Alert className="mb-4 border-green-500 bg-green-50 text-green-700">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {!isRecoveryReady ? (
                <div className="space-y-4">
                  <Alert variant="destructive" className="mb-2">
                    <AlertDescription>
                      {error || 'Link de recuperação inválido ou expirado. Solicite um novo email.'}
                    </AlertDescription>
                  </Alert>

                  <Button
                    type="button"
                    className="w-full"
                    onClick={() => {
                      setIsResetMode(false);
                      setActiveTab('forgot');
                      setError(null);
                      setSuccess(null);
                      navigate('/auth', { replace: true });
                    }}
                  >
                    Solicitar novo email de recuperação
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nova Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        className="pl-10"
                        value={newPasswordForm.password}
                        onChange={(e) => setNewPasswordForm({ ...newPasswordForm, password: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-new-password">Confirmar Nova Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-new-password"
                        type="password"
                        placeholder="Repita a senha"
                        className="pl-10"
                        value={newPasswordForm.confirmPassword}
                        onChange={(e) => setNewPasswordForm({ ...newPasswordForm, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar Nova Senha'
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
            
            <CardFooter className="flex justify-center border-t pt-4">
              <Link to="/auth" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" />
                Voltar para login
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDERIZAÇÃO - LOGIN/SIGNUP/FORGOT
  // ============================================

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-3 bg-primary/10 rounded-full">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-foreground">IDJUV - Sistema</h1>
          <p className="text-muted-foreground">Acesse sua conta para continuar</p>
        </div>

        {/* Card de Auth */}
        <Card className="shadow-lg">
          {activeTab === 'forgot' ? (
            // Formulário de Esqueci a Senha
            <>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <CardTitle>Recuperar Senha</CardTitle>
                <CardDescription>
                  Digite seu email para receber o link de recuperação
                </CardDescription>
              </CardHeader>

              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {success && (
                  <Alert className="mb-4 border-green-500 bg-green-50 text-green-700">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10"
                        value={forgotForm.email}
                        onChange={(e) => setForgotForm({ email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      'Enviar Email de Recuperação'
                    )}
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="flex justify-center border-t pt-4">
                <button 
                  onClick={() => { setActiveTab('login'); setError(null); setSuccess(null); }}
                  className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para login
                </button>
              </CardFooter>
            </>
          ) : (
            // Formulário de Login (sem cadastro público)
            <>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <CardTitle>Entrar no Sistema</CardTitle>
                <CardDescription>
                  Use suas credenciais para acessar
                </CardDescription>
              </CardHeader>

              <CardContent>
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="login-password">Senha</Label>
                      <button
                        type="button"
                        onClick={() => { setActiveTab('forgot'); setError(null); }}
                        className="text-xs text-primary hover:underline"
                      >
                        Esqueci a senha
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="flex justify-center border-t pt-4">
                <Link to="/" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para o início
                </Link>
              </CardFooter>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;