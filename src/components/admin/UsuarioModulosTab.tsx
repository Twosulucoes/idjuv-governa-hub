// ============================================
// TAB DE MÓDULOS DO USUÁRIO (SIMPLIFICADO)
// ============================================
// Permite selecionar quais módulos o usuário pode acessar

import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Loader2 } from 'lucide-react';
import { MODULOS, MODULO_LABELS, MODULO_ICONES, type Modulo, type UsuarioAdmin } from '@/types/rbac';

interface UsuarioModulosTabProps {
  usuario: UsuarioAdmin;
  saving: boolean;
  onToggleModulo: (modulo: Modulo, temAtualmente: boolean) => void;
}

export function UsuarioModulosTab({ usuario, saving, onToggleModulo }: UsuarioModulosTabProps) {
  // Super admin tem acesso a tudo, não precisa de módulos específicos
  const ehSuperAdmin = usuario.perfil?.perfil?.codigo === 'super_admin';

  if (ehSuperAdmin) {
    return (
      <Alert className="bg-primary/5 border-primary/20">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Super Administrador</strong> tem acesso a todos os módulos do sistema automaticamente.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Selecione os módulos que este usuário pode acessar. 
          Apenas os módulos marcados estarão disponíveis no menu.
        </AlertDescription>
      </Alert>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-2">
          {MODULOS.map((modulo) => {
            const temAcesso = usuario.modulos.includes(modulo);
            const icone = MODULO_ICONES[modulo];
            const label = MODULO_LABELS[modulo];

            return (
              <div
                key={modulo}
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  temAcesso 
                    ? 'bg-primary/10 border-primary/30' 
                    : 'hover:bg-accent'
                }`}
                onClick={() => !saving && onToggleModulo(modulo, temAcesso)}
              >
                <Checkbox 
                  checked={temAcesso} 
                  disabled={saving} 
                  onCheckedChange={() => !saving && onToggleModulo(modulo, temAcesso)}
                />
                <span className="text-xl">{icone}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{label}</div>
                  <div className="text-sm text-muted-foreground">
                    Código: {modulo}
                  </div>
                </div>
                {saving && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
