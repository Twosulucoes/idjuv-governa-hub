import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, ArrowLeft, KeyRound, CheckCircle, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useIdentidade } from '@/core/tenant';

// ============ SCHEMAS ============

const loginSchema = z.object({
  email: z.string().trim().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

const resetSchema = z.object({
  email: z.string().trim().email('Email inválido'),
});

const newPasswordSchema = z.object({
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

// ============ RATE LIMITING ============
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000;

// ============ LINKS DOS E-MAILS ============
// Os e-mails do Auth (tenants/<slug>/emails/, docs/EMAILS_AUTH.md) trazem
// /auth?token_hash=…&type=…; a página valida o token com verifyOtp. Assim o token
// só é gasto quando a pessoa abre a página, não quando um filtro de e-mail visita o link.
const TIPOS_LINK = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email'] as const;
type TipoLink = typeof TIPOS_LINK[number];
const ehTipoLink = (v: string | null): v is TipoLink => !!v && (TIPOS_LINK as readonly string[]).includes(v);
const MSG_LINK_INVALIDO = 'Este link é inválido, já foi usado ou expirou. Peça um novo e-mail.';

/** Lido na primeira renderização para não redirecionar quem chega por link de senha. */
function chegouParaCriarSenha(): boolean {
  const q = new URLSearchParams(window.location.search);
  const tipo = q.get('type');
  const hash = window.location.hash;
  return q.get('mode') === 'reset'
    || (!!q.get('token_hash') && (tipo === 'recovery' || tipo === 'invite'))
    || hash.includes('type=recovery') || hash.includes('type=invite');
}

// ============ COMPONENTE ============

const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { signIn, resetPassword, updatePassword, signOut, isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const identidade = useIdentidade();

  const [tab, setTab] = useState<'login' | 'forgot'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isResetMode, setIsResetMode] = useState(chegouParaCriarSenha);
  const [recoveryReady, setRecoveryReady] = useState(false);
  const [verificandoLink, setVerificandoLink] = useState(false);
  // Convite: a pessoa cria a primeira senha (mesma tela da redefinição, outro texto)
  const [primeiraSenha, setPrimeiraSenha] = useState(() => new URLSearchParams(window.location.search).get('type') === 'invite' || window.location.hash.includes('type=invite'));

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Rate limiting
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Form state
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  const [newPasswordForm, setNewPasswordForm] = useState({ password: '', confirmPassword: '' });

  // Refs
  const emailRef = useRef<HTMLInputElement>(null);
  const forgotRef = useRef<HTMLInputElement>(null);
  const newPassRef = useRef<HTMLInputElement>(null);

  // ============ LOCKOUT TIMER ============
  useEffect(() => {
    if (!lockoutUntil) return;
    const id = setInterval(() => {
      const rem = Math.max(0, lockoutUntil - Date.now());
      setLockoutRemaining(Math.ceil(rem / 1000));
      if (rem <= 0) { setLockoutUntil(null); setAttempts(0); setLockoutRemaining(0); }
    }, 1000);
    return () => clearInterval(id);
  }, [lockoutUntil]);

  // ============ LINKS DE E-MAIL (token_hash, erro do GoTrue, recuperação) ============
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const erroLink = searchParams.get('error_code') || hashParams.get('error_code')
      || searchParams.get('error') || hashParams.get('error');
    const tokenHash = searchParams.get('token_hash');
    const tipo = searchParams.get('type');
    const mode = searchParams.get('mode');
    const code = searchParams.get('code');
    const hash = window.location.hash;

    // Link expirado/usado: o GoTrue devolve #error_code=otp_expired&…
    if (erroLink) {
      setIsResetMode(false);
      setTab('forgot');
      setError(MSG_LINK_INVALIDO);
      navigate('/auth', { replace: true });
      return;
    }

    if (tokenHash && ehTipoLink(tipo)) {
      const criaSenha = tipo === 'recovery' || tipo === 'invite';
      setIsResetMode(criaSenha);
      setPrimeiraSenha(tipo === 'invite');
      setVerificandoLink(true);
      (async () => {
        const { error: ex } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: tipo });
        setVerificandoLink(false);
        if (ex) {
          setError(MSG_LINK_INVALIDO);
          if (!criaSenha) setTab('forgot');
          navigate(criaSenha ? '/auth?mode=reset' : '/auth', { replace: true });
          return;
        }
        if (criaSenha) {
          setRecoveryReady(true);
          navigate('/auth?mode=reset', { replace: true });
        } else {
          toast({
            title: tipo === 'email_change' ? 'E-mail alterado' : tipo === 'magiclink' ? 'Acesso liberado' : 'E-mail confirmado',
            description: 'Você já está conectado.',
          });
          // Com a sessão criada, o redirecionamento de autenticado leva ao sistema
          navigate('/auth', { replace: true });
        }
      })();
      return;
    }

    const isReset = mode === 'reset' || (hash && (hash.includes('type=recovery') || hash.includes('type=invite') || hash.includes('access_token'))) || !!code;
    if (!isReset) return;

    setIsResetMode(true);
    setVerificandoLink(true);

    (async () => {
      if (code) {
        const { error: ex } = await supabase.auth.exchangeCodeForSession(code);
        if (ex) {
          setVerificandoLink(false);
          setError(MSG_LINK_INVALIDO);
          return;
        }
        navigate('/auth?mode=reset', { replace: true });
      }
      const { data } = await supabase.auth.getSession();
      setVerificandoLink(false);
      if (data.session) {
        setRecoveryReady(true);
      } else {
        setError(MSG_LINK_INVALIDO);
      }
    })();
  }, [searchParams, navigate, toast]);

  // ============ AUTO-FOCUS ============
  useEffect(() => {
    if (!authLoading && !isResetMode) {
      const t = setTimeout(() => {
        if (tab === 'login') emailRef.current?.focus();
        else forgotRef.current?.focus();
      }, 100);
      return () => clearTimeout(t);
    }
  }, [tab, authLoading, isResetMode]);

  useEffect(() => {
    if (isResetMode && recoveryReady) {
      const t = setTimeout(() => newPassRef.current?.focus(), 100);
      return () => clearTimeout(t);
    }
  }, [isResetMode, recoveryReady]);

  // ============ REDIRECT IF AUTHENTICATED ============
  useEffect(() => {
    if (isAuthenticated && !isResetMode) {
      const from = (location.state as any)?.from?.pathname || '/sistema';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location, isResetMode]);

  // ============ FIELD VALIDATION ============
  const validateField = useCallback((field: string, value: string) => {
    setFieldErrors(prev => {
      const next = { ...prev };
      if (field === 'email') {
        if (value && !z.string().email().safeParse(value).success) next.email = 'Email inválido';
        else delete next.email;
      }
      if (field === 'password') {
        if (value && value.length < 6) next.password = 'Mínimo 6 caracteres';
        else delete next.password;
      }
      if (field === 'newPassword') {
        if (value && value.length < 8) next.newPassword = 'Mínimo 8 caracteres';
        else delete next.newPassword;
        if (newPasswordForm.confirmPassword && value !== newPasswordForm.confirmPassword)
          next.confirmPassword = 'Senhas não coincidem';
        else delete next.confirmPassword;
      }
      if (field === 'confirmPassword') {
        if (value && value !== newPasswordForm.password) next.confirmPassword = 'Senhas não coincidem';
        else delete next.confirmPassword;
      }
      return next;
    });
  }, [newPasswordForm.password, newPasswordForm.confirmPassword]);

  // ============ HANDLERS ============

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setFieldErrors({});

    if (lockoutUntil && Date.now() < lockoutUntil) {
      setError(`Muitas tentativas. Aguarde ${lockoutRemaining}s.`);
      return;
    }

    const parsed = loginSchema.safeParse(loginForm);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.errors.forEach(e => { if (e.path[0]) errs[String(e.path[0])] = e.message; });
      setFieldErrors(errs);
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(loginForm.email.trim(), loginForm.password);
    setIsLoading(false);

    if (error) {
      const n = attempts + 1;
      setAttempts(n);
      if (n >= MAX_ATTEMPTS) {
        setLockoutUntil(Date.now() + LOCKOUT_MS);
        setError('Muitas tentativas. Aguarde 60 segundos.');
      } else {
        const rem = MAX_ATTEMPTS - n;
        setError(`Credenciais incorretas. ${rem} tentativa${rem > 1 ? 's' : ''} restante${rem > 1 ? 's' : ''}.`);
      }
    } else {
      setAttempts(0); setLockoutUntil(null);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null);

    const parsed = resetSchema.safeParse({ email: forgotEmail });
    if (!parsed.success) { setError(parsed.error.errors[0].message); return; }

    setIsLoading(true);
    const { error } = await resetPassword(forgotEmail.trim());
    setIsLoading(false);

    if (!error) {
      setSuccess('Se o e-mail estiver cadastrado, você vai receber um link para criar uma nova senha. Confira também a pasta de spam.');
      setForgotEmail('');
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setFieldErrors({});

    const parsed = newPasswordSchema.safeParse(newPasswordForm);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.errors.forEach(e => { if (e.path[0]) errs[String(e.path[0])] = e.message; });
      setFieldErrors(errs);
      return;
    }

    setIsLoading(true);
    const { error } = await updatePassword(newPasswordForm.password);
    setIsLoading(false);

    if (!error) {
      setSuccess(primeiraSenha ? 'Senha criada! Agora entre com seu e-mail e a nova senha.' : 'Senha atualizada! Agora entre com a nova senha.');
      // Desloga o usuário após redefinir a senha para evitar redirect automático para /sistema
      setTimeout(async () => {
        await signOut();
        setIsResetMode(false);
        setPrimeiraSenha(false);
        navigate('/auth', { replace: true });
      }, 2500);
    }
  };

  // ============ SUB-COMPONENTS ============

  const PasswordToggle = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
    <button type="button" onClick={onToggle} aria-pressed={show}
      className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-md text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}>
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  const FieldError = ({ field }: { field: string }) => {
    const msg = fieldErrors[field];
    if (!msg) return null;
    return <p id={`${field}-erro`} className="text-sm text-destructive mt-1" role="alert">{msg}</p>;
  };

  // ============ LOADING GLOBAL ============
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // ============ RESET MODE ============
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
            <h1 className="text-2xl font-bold">{primeiraSenha ? 'Crie sua senha' : 'Redefinir senha'}</h1>
            <p className="text-muted-foreground text-sm">
              {primeiraSenha ? `Defina a senha do seu acesso ao Sistema de Gestão ${identidade.nomeCurto}` : 'Digite sua nova senha'}
            </p>
          </div>

          <Card className="shadow-lg">
            <CardContent className="pt-6 space-y-4">
              {error && (
                <Alert variant="destructive" role="alert">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className="border-primary/50 bg-primary/10 text-primary" role="status">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {verificandoLink ? (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground" role="status" aria-live="polite">
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Validando seu link…
                </div>
              ) : !recoveryReady ? (
                <Button className="w-full" onClick={() => { setIsResetMode(false); setTab('forgot'); setError(null); navigate('/auth', { replace: true }); }}>
                  Pedir um novo e-mail
                </Button>
              ) : (

                <form onSubmit={handleUpdatePassword} className="space-y-4" noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">{primeiraSenha ? 'Senha' : 'Nova senha'}</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input ref={newPassRef} id="new-password" type={showNewPassword ? 'text' : 'password'}
                        aria-describedby={fieldErrors.newPassword ? 'newPassword-erro' : 'new-password-dica'}
                        aria-invalid={!!fieldErrors.newPassword} className="pl-10 pr-10"
                        value={newPasswordForm.password} autoComplete="new-password"
                        onChange={e => { setNewPasswordForm(p => ({ ...p, password: e.target.value })); validateField('newPassword', e.target.value); }} />
                      <PasswordToggle show={showNewPassword} onToggle={() => setShowNewPassword(v => !v)} />
                    </div>
                    {!fieldErrors.newPassword && <p id="new-password-dica" className="text-sm text-muted-foreground">Use pelo menos 8 caracteres.</p>}
                    <FieldError field="newPassword" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirme a senha</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="confirm-password" type={showConfirmPassword ? 'text' : 'password'}
                        aria-describedby={fieldErrors.confirmPassword ? 'confirmPassword-erro' : undefined}
                        aria-invalid={!!fieldErrors.confirmPassword} className="pl-10 pr-10"
                        value={newPasswordForm.confirmPassword} autoComplete="new-password"
                        onChange={e => { setNewPasswordForm(p => ({ ...p, confirmPassword: e.target.value })); validateField('confirmPassword', e.target.value); }} />
                      <PasswordToggle show={showConfirmPassword} onToggle={() => setShowConfirmPassword(v => !v)} />
                    </div>
                    <FieldError field="confirmPassword" />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</> : primeiraSenha ? 'Criar senha' : 'Salvar nova senha'}
                  </Button>
                </form>
              )}
            </CardContent>
            <CardFooter className="flex justify-center border-t pt-4">
              <Link to="/auth" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                <ArrowLeft className="h-4 w-4" /> Voltar para login
              </Link>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  // ============ LOGIN / FORGOT ============
  const isLockedOut = lockoutUntil !== null && Date.now() < lockoutUntil;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-foreground">Sistema de Gestão {identidade.nomeCurto}</h1>
          <p className="text-sm text-muted-foreground">Acesse sua conta para continuar</p>
        </div>

        <Card className="shadow-lg">
          {tab === 'forgot' ? (
            <>
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-2">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                </div>
                <CardTitle>Recuperar Senha</CardTitle>
                <CardDescription>Enviaremos um link para o seu email</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && <Alert variant="destructive" role="alert"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
                {success && <Alert className="border-primary/50 bg-primary/10 text-primary" role="status"><CheckCircle className="h-4 w-4" /><AlertDescription>{success}</AlertDescription></Alert>}

                <form onSubmit={handleForgotPassword} className="space-y-4" noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input ref={forgotRef} id="forgot-email" type="email" placeholder="seu@email.com"
                        className="pl-10" value={forgotEmail} autoComplete="email"
                        onChange={e => setForgotEmail(e.target.value)} required />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Enviando...</> : 'Enviar Link de Recuperação'}
                  </Button>
                </form>
              </CardContent>
              <CardFooter className="flex justify-center border-t pt-4">
                <button onClick={() => { setTab('login'); setError(null); setSuccess(null); setFieldErrors({}); }}
                  className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                  <ArrowLeft className="h-4 w-4" /> Voltar para login
                </button>
              </CardFooter>
            </>
          ) : (
            <>
              <CardHeader className="text-center pb-2">
                <CardTitle>Entrar no Sistema</CardTitle>
                <CardDescription>Use suas credenciais de acesso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {error && <Alert variant="destructive" role="alert" aria-live="assertive"><AlertTriangle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert>}
                {isLockedOut && (
                  <Alert variant="destructive" role="alert">
                    <Lock className="h-4 w-4" />
                    <AlertDescription>Bloqueado temporariamente. Tente em {lockoutRemaining}s.</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={handleLogin} className="space-y-4" noValidate>
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input ref={emailRef} id="login-email" type="email" placeholder="seu@email.com"
                        className="pl-10" value={loginForm.email} autoComplete="email" disabled={isLockedOut}
                        aria-invalid={!!fieldErrors.email} aria-describedby={fieldErrors.email ? 'email-erro' : undefined}
                        onChange={e => { setLoginForm(p => ({ ...p, email: e.target.value })); validateField('email', e.target.value); }}
                        onBlur={e => validateField('email', e.target.value)} required />
                    </div>
                    <FieldError field="email" />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="login-password">Senha</Label>
                      <button type="button" onClick={() => { setTab('forgot'); setError(null); setFieldErrors({}); }}
                        className="text-sm text-primary hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                        Esqueci a senha
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="login-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                        className="pl-10 pr-10" value={loginForm.password} autoComplete="current-password" disabled={isLockedOut}
                        aria-invalid={!!fieldErrors.password} aria-describedby={fieldErrors.password ? 'password-erro' : undefined}
                        onChange={e => { setLoginForm(p => ({ ...p, password: e.target.value })); validateField('password', e.target.value); }}
                        onBlur={e => validateField('password', e.target.value)} required />
                      <PasswordToggle show={showPassword} onToggle={() => setShowPassword(v => !v)} />
                    </div>
                    <FieldError field="password" />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading || isLockedOut} aria-busy={isLoading}>
                    {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Entrando...</>
                      : isLockedOut ? `Aguarde ${lockoutRemaining}s`
                      : 'Entrar'}
                  </Button>
                </form>
              </CardContent>

              <CardFooter className="flex justify-center border-t pt-4">
                <Link to="/" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1">
                  <ArrowLeft className="h-4 w-4" /> Voltar para o início
                </Link>
              </CardFooter>
            </>
          )}
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          Acesso restrito a usuários cadastrados pelo administrador.
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
