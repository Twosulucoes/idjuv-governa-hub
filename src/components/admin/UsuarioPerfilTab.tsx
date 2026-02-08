// ============================================
// TAB DE PERFIL DO USUÁRIO (SIMPLIFICADO)
// ============================================
// Permite selecionar o perfil: Gestor ou Servidor

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Info, Shield, UserCheck, User, Loader2, Lock } from 'lucide-react';
import { 
  PERFIL_LABELS, 
  PERFIL_DESCRICOES, 
  PERFIL_CORES,
  ROLE_LABELS,
  type PerfilCodigo, 
  type UsuarioAdmin,
  type AppRole
} from '@/types/rbac';

interface UsuarioPerfilTabProps {
  usuario: UsuarioAdmin;
  saving: boolean;
  onDefinirPerfil: (perfilCodigo: PerfilCodigo) => void;
  isProtected?: boolean;
}

// Ícones para cada perfil
const PERFIL_ICONS: Record<PerfilCodigo, React.ReactNode> = {
  super_admin: <Shield className="h-5 w-5 text-red-500" />,
  gestor: <UserCheck className="h-5 w-5 text-blue-500" />,
  servidor: <User className="h-5 w-5 text-green-500" />,
};

export function UsuarioPerfilTab({ usuario, saving, onDefinirPerfil, isProtected = false }: UsuarioPerfilTabProps) {
  // Mapear role do novo sistema para PerfilCodigo legado
  const perfilAtual = usuario.role 
    ? (usuario.role === 'admin' ? 'super_admin' : usuario.role === 'manager' ? 'gestor' : 'servidor')
    : undefined;
  const ehSuperAdmin = usuario.role === 'admin';

  // Opções de perfil disponíveis (exceto super_admin que é especial)
  const perfisDisponiveis: PerfilCodigo[] = ['gestor', 'servidor'];

  // Se for protegido, mostrar apenas aviso
  if (isProtected) {
    return (
      <div className="space-y-6">
        <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
          <Lock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            Este é o <strong>Super Administrador principal</strong> do sistema. 
            Seu perfil está protegido e não pode ser alterado.
          </AlertDescription>
        </Alert>

        {perfilAtual && (
          <div className="pt-4 border-t">
            <div className="text-sm text-muted-foreground mb-2">Perfil atual:</div>
            <Badge className={PERFIL_CORES[perfilAtual]}>
              {PERFIL_LABELS[perfilAtual]}
            </Badge>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {ehSuperAdmin && (
        <Alert className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
          <Shield className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            Este usuário é <strong>Super Administrador</strong> com acesso total ao sistema. 
            Não é possível alterar seu perfil por aqui.
          </AlertDescription>
        </Alert>
      )}

      {!ehSuperAdmin && (
        <>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Selecione o tipo de perfil do usuário. O perfil define suas capacidades no sistema.
            </AlertDescription>
          </Alert>

          <RadioGroup
            value={perfilAtual || ''}
            onValueChange={(value) => onDefinirPerfil(value as PerfilCodigo)}
            className="space-y-3"
            disabled={saving}
          >
            {perfisDisponiveis.map((codigo) => (
              <div
                key={codigo}
                className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-colors ${
                  perfilAtual === codigo 
                    ? 'bg-primary/10 border-primary/30' 
                    : 'hover:bg-accent'
                }`}
                onClick={() => !saving && onDefinirPerfil(codigo)}
              >
                <RadioGroupItem value={codigo} id={codigo} disabled={saving} className="mt-1" />
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {PERFIL_ICONS[codigo]}
                    <Label 
                      htmlFor={codigo} 
                      className="text-base font-medium cursor-pointer"
                    >
                      {PERFIL_LABELS[codigo]}
                    </Label>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {PERFIL_DESCRICOES[codigo]}
                  </p>

                  {codigo === 'gestor' && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      Pode aprovar processos
                    </Badge>
                  )}
                </div>

                {saving && perfilAtual !== codigo && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            ))}
          </RadioGroup>
        </>
      )}

      {/* Informação do perfil atual */}
      {perfilAtual && (
        <div className="pt-4 border-t">
          <div className="text-sm text-muted-foreground mb-2">Perfil atual:</div>
          <Badge className={PERFIL_CORES[perfilAtual]}>
            {PERFIL_LABELS[perfilAtual]}
          </Badge>
        </div>
      )}

      {!perfilAtual && !ehSuperAdmin && (
        <Alert variant="destructive">
          <AlertDescription>
            Nenhum perfil associado. O usuário não tem acesso ao sistema.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
