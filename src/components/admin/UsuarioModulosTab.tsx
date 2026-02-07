// ============================================
// TAB DE MÓDULOS DO USUÁRIO (SIMPLIFICADO)
// ============================================
// Permite selecionar quais módulos o usuário pode acessar

import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, Loader2 } from 'lucide-react';
import { MODULES_CONFIG, type Modulo, getModuloCorClass } from '@/shared/config/modules.config';
import type { UsuarioAdmin } from '@/types/rbac';

interface UsuarioModulosTabProps {
  usuario: UsuarioAdmin;
  saving: boolean;
  onToggleModulo: (modulo: Modulo, temAtualmente: boolean) => void;
}

export function UsuarioModulosTab({ usuario, saving, onToggleModulo }: UsuarioModulosTabProps) {
  // Admin (role 'admin') tem acesso a tudo automaticamente
  const ehSuperAdmin = usuario.role === 'admin';

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
          {MODULES_CONFIG.map((config) => {
            const temAcesso = usuario.modulos.includes(config.codigo);
            const Icon = config.icone;
            const corClass = getModuloCorClass(config.cor);

            return (
              <div
                key={config.codigo}
                className={`flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                  temAcesso 
                    ? 'bg-primary/10 border-primary/30' 
                    : 'hover:bg-accent'
                }`}
                onClick={() => !saving && onToggleModulo(config.codigo, temAcesso)}
              >
                <Checkbox 
                  checked={temAcesso} 
                  disabled={saving} 
                  onCheckedChange={() => !saving && onToggleModulo(config.codigo, temAcesso)}
                />
                <div className={`p-2 rounded-md ${corClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{config.nome}</div>
                  <div className="text-sm text-muted-foreground">
                    {config.descricao}
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