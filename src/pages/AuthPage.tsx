// ============================================
// PÁGINA DE AUTENTICAÇÃO
// ============================================
// Login e Recuperação de Senha (cadastro feito pelo admin)
// Melhorias: toggle senha, validação real-time, auto-focus, ARIA, responsividade

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, ArrowLeft, Shield, KeyRound, CheckCircle, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { z } from 'zod';

// ============================================
// SCHEMAS DE VALIDAÇÃO
// ============================================

const loginSchema = z.object({
  email: z.string().trim().email('Email inválido').max(255, 'Email muito longo'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').max(128, 'Senha muito longa')
});

const resetPasswordSchema = z.object({
  email: z.string().trim().email('Email inválido').max(255, 'Email muito longo')
});

const newPasswordSchema = z.object({
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres').max(128, 'Senha muito longa'),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword']
});

// ============================================
// RATE LIMITING LOCAL
// ============================================
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60_000; // 1 minuto

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
  
  // Password visibility toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Field-level validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  
  // Rate limiting
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);
  
  // Refs for auto-focus
  const emailInputRef = useRef<HTMLInputElement>(null);
  const forgotEmailRef = useRef<HTMLInputElement>(null);
  const newPasswordRef = useRef<HTMLInputElement>(null);
  
  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [forgotForm, setForgotForm] = useState({ email: '' });
  const [newPasswordForm, setNewPasswordForm] = useState({ password: '', confirmPassword: '' });

  // ============================================
  // AUTO-FOCUS
  // ============================================
  useEffect(() => {
    if (!isCheckingSession && !authLoading && !isResetMode) {
      const timer = setTimeout(() => {
        if (activeTab === 'login') {
          emailInputRef.current?.focus();
        } else if (activeTab === 'forgot') {
          forgotEmailRef.current?.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [activeTab, isCheckingSession, authLoading, isResetMode]);

  useEffect(() => {
    if (isResetMode && isRecoveryReady) {
      const timer = setTimeout(() => newPasswordRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isResetMode, isRecoveryReady]);

  // ============================================
  // LOCKOUT TIMER
  // ============================================
  useEffect(() => {
    if (!lockoutUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, lockoutUntil - Date.now());
      setLockoutRemaining(Math.ceil(remaining / 1000));
      if (remaining <= 0) {
        setLockoutUntil(null);
        setAttempts(0);
        setLockoutRemaining(0);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  // ============================================
  // RESET MODE DETECTION
  // ============================================
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

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          setError('Link de recuperação inválido ou expirado. Solicite um novo email.');
          setIsRecoveryReady(false);
          setIsCheckingSession(false);
          return;
        }
        navigate('/auth?mode=reset', { replace: true });
      }

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

  // ============================================
  // REDIRECT IF AUTHENTICATED
  // ============================================
  useEffect(() => {
    if (isAuthenticated && !isResetMode && !isCheckingSession) {
      const from = (location.state as any)?.from?.pathname || '/sistema';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location, isResetMode, isCheckingSession]);

  // ============================================
  // REAL-TIME FIELD VALIDATION
  // ============================================
  const validateField = useCallback((field: string, value: string) => {
    setFieldErrors(prev => {
      const next = { ...prev };
      switch (field) {
        case 'email':
          if (value && !z.string().email().safeParse(value).success) {
            next.email = 'Formato de email inválido';
          } else {
            delete next.email;
          }
          break;
        case 'password':
          if (value && value.length > 0 && value.length < 6) {
            next.password = 'Mínimo 6 caracteres';
          } else {
            delete next.password;
          }
          break;
        case 'newPassword':
          if (value && value.length > 0 && value.length < 8) {
            next.newPassword = 'Mínimo 8 caracteres';
          } else {
            delete next.newPassword;
          }
          if (newPasswordForm.confirmPassword && value !== newPasswordForm.confirmPassword) {
            next.confirmPassword = 'Senhas não coincidem';
          } else {
            delete next.confirmPassword;
          }
          break;
        case 'confirmPassword':
          if (value && value !== newPasswordForm.password) {
            next.confirmPassword = 'Senhas não coincidem';
          } else {
            delete next.confirmPassword;
          }
          break;
      }
      return next;
    });
  }, [newPasswordForm.password, newPasswordForm.confirmPassword]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    
    // Check lockout
    if (lockoutUntil && Date.now() < lockoutUntil) {
      setError(`Muitas tentativas. Aguarde ${lockoutRemaining}s para tentar novamente.`);
      return;
    }
    
    try {
      loginSchema.parse(loginForm);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        err.errors.forEach(e => {
          if (e.path[0]) errors[String(e.path[0])] = e.message;
        });
        setFieldErrors(errors);
        return;
      }
    }
    
    setIsLoading(true);
    const { error } = await signIn(loginForm.email.trim(), loginForm.password);
    setIsLoading(false);
    
    if (error) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= MAX_ATTEMPTS) {
        const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
        setLockoutUntil(lockUntil);
        setError(`Muitas tentativas falhas. Aguarde 60 segundos para tentar novamente.`);
      } else {
        const remaining = MAX_ATTEMPTS - newAttempts;
        setError(`Email ou senha incorretos. ${remaining} tentativa${remaining > 1 ? 's' : ''} restante${remaining > 1 ? 's' : ''}.`);
      }
    } else {
      setAttempts(0);
      setLockoutUntil(null);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setFieldErrors({});
    
    try {
      resetPasswordSchema.parse(forgotForm);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setError(err.errors[0].message);
        return;
      }
    }
    
    setIsLoading(true);
    const { error } = await resetPassword(forgotForm.email.trim());
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
    setFieldErrors({});
    
    try {
      newPasswordSchema.parse(newPasswordForm);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        err.errors.forEach(e => {
          if (e.path[0]) errors[String(e.path[0])] = e.message;
        });
        setFieldErrors(errors);
        return;
      }
    }
    
    setIsLoading(true);
    const { error } = await updatePassword(newPasswordForm.password);
    setIsLoading(false);
    
    if (!error) {
      setSuccess('Senha atualizada com sucesso! Redirecionando...');
      setTimeout(() => {
        navigate('/auth', { replace: true });
      }, 2000);
    }
  };

  // ============================================
  // HELPER: Password Toggle Button
  // ============================================
  const PasswordToggle = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}
      tabIndex={-1}
    >
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  // ============================================
  // HELPER: Field Error Display
  // ============================================
  const FieldError = ({ field }: { field: string }) => {
    const msg = fieldErrors[field];
    if (!msg) return null;
    return (
      <p className="text-xs text-destructive mt-1" role="alert" aria-live="polite">
        {msg}
      </p>
    );
  };

  // ============================================
  // LOADING GLOBAL
  // ============================================

  if (authLoading || isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verificando sessão...</p>
        </div>
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
                <Alert variant="destructive" className="mb-4" role="alert">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              {success && (
                  <Alert className="mb-4 border-success/50 bg-success/10 text-success" role="status">
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
                <form onSubmit={handleUpdatePassword} className="space-y-4" noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nova Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        ref={newPasswordRef}
                        id="new-password"
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Mínimo 8 caracteres"
                        className="pl-10 pr-10"
                        value={newPasswordForm.password}
                        onChange={(e) => {
                          setNewPasswordForm({ ...newPasswordForm, password: e.target.value });
                          validateField('newPassword', e.target.value);
                        }}
                        aria-describedby="new-password-error"
                        aria-invalid={!!fieldErrors.newPassword}
                        required
                        autoComplete="new-password"
                      />
                      <PasswordToggle show={showNewPassword} onToggle={() => setShowNewPassword(!showNewPassword)} />
                    </div>
                    <FieldError field="newPassword" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-new-password">Confirmar Nova Senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-new-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Repita a senha"
                        className="pl-10 pr-10"
                        value={newPasswordForm.confirmPassword}
                        onChange={(e) => {
                          setNewPasswordForm({ ...newPasswordForm, confirmPassword: e.target.value });
                          validateField('confirmPassword', e.target.value);
                        }}
                        aria-describedby="confirm-password-error"
                        aria-invalid={!!fieldErrors.confirmPassword}
                        required
                        autoComplete="new-password"
                      />
                      <PasswordToggle show={showConfirmPassword} onToggle={() => setShowConfirmPassword(!showConfirmPassword)} />
                    </div>
                    <FieldError field="confirmPassword" />
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
  // RENDERIZAÇÃO - LOGIN / FORGOT
  // ============================================

  const isLockedOut = lockoutUntil !== null && Date.now() < lockoutUntil;

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
            // ============================================
            // FORMULÁRIO: ESQUECI A SENHA
            // ============================================
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
                  <Alert variant="destructive" className="mb-4" role="alert">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                {success && (
                  <Alert className="mb-4 border-success/50 bg-success/10 text-success" role="status">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleForgotPassword} className="space-y-4" noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        ref={forgotEmailRef}
                        id="forgot-email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10"
                        value={forgotForm.email}
                        onChange={(e) => setForgotForm({ email: e.target.value })}
                        aria-label="Email para recuperação"
                        required
                        autoComplete="email"
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
                  onClick={() => { setActiveTab('login'); setError(null); setSuccess(null); setFieldErrors({}); }}
                  className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para login
                </button>
              </CardFooter>
            </>
          ) : (
            // ============================================
            // FORMULÁRIO: LOGIN
            // ============================================
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
                  <Alert variant="destructive" className="mb-4" role="alert" aria-live="assertive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {isLockedOut && (
                  <Alert variant="destructive" className="mb-4" role="alert">
                    <Lock className="h-4 w-4" />
                    <AlertDescription>
                      Conta temporariamente bloqueada. Tente novamente em {lockoutRemaining}s.
                    </AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleLogin} className="space-y-4" noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        ref={emailInputRef}
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        className="pl-10"
                        value={loginForm.email}
                        onChange={(e) => {
                          setLoginForm({ ...loginForm, email: e.target.value });
                          validateField('email', e.target.value);
                        }}
                        onBlur={(e) => validateField('email', e.target.value)}
                        aria-describedby="email-error"
                        aria-invalid={!!fieldErrors.email}
                        aria-label="Email de acesso"
                        required
                        autoComplete="email"
                        disabled={isLockedOut}
                      />
                    </div>
                    <FieldError field="email" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="login-password">Senha</Label>
                      <button
                        type="button"
                        onClick={() => { setActiveTab('forgot'); setError(null); setFieldErrors({}); }}
                        className="text-xs text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded"
                      >
                        Esqueci a senha
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        value={loginForm.password}
                        onChange={(e) => {
                          setLoginForm({ ...loginForm, password: e.target.value });
                          validateField('password', e.target.value);
                        }}
                        onBlur={(e) => validateField('password', e.target.value)}
                        aria-describedby="password-error"
                        aria-invalid={!!fieldErrors.password}
                        aria-label="Senha de acesso"
                        required
                        autoComplete="current-password"
                        disabled={isLockedOut}
                      />
                      <PasswordToggle show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                    </div>
                    <FieldError field="password" />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || isLockedOut}
                    aria-busy={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Entrando...
                      </>
                    ) : isLockedOut ? (
                      `Aguarde ${lockoutRemaining}s`
                    ) : (
                      'Entrar'
                    )}
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="flex justify-center border-t pt-4">
                <Link 
                  to="/" 
                  className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 rounded"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para o início
                </Link>
              </CardFooter>
            </>
          )}
        </Card>

        {/* Footer info */}
        <p className="text-center text-xs text-muted-foreground">
          Acesso restrito a usuários cadastrados pelo administrador.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
