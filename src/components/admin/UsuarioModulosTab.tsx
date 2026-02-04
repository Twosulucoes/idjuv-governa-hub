// ============================================
// TAB DE MÓDULOS DO USUÁRIO
// ============================================

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, AlertTriangle, Boxes, Lock, Unlock } from 'lucide-react';
import { useAdminModulos } from '@/hooks/useAdminModulos';
import { getModuloCorClass } from '@/types/modulos';
import type { ModuloSistema, UsuarioModulo } from '@/types/modulos';

interface UsuarioModulosTabProps {
  userId: string;
  userName?: string;
}

export function UsuarioModulosTab({ userId, userName }: UsuarioModulosTabProps) {
  const {
    modulos,
    loading: loadingModulos,
    saving,
    fetchModulosUsuario,
    toggleRestringirModulos,
    toggleModuloAutorizado,
  } = useAdminModulos();

  const [restringir, setRestringir] = useState(false);
  const [modulosAutorizados, setModulosAutorizados] = useState<string[]>([]);
  const [loadingUsuario, setLoadingUsuario] = useState(true);

  // Carregar dados do usuário
  useEffect(() => {
    const load = async () => {
      setLoadingUsuario(true);
      const dados = await fetchModulosUsuario(userId);
      if (dados) {
        setRestringir(dados.restringirModulos);
        setModulosAutorizados(dados.modulosAutorizados.map(m => m.modulo_id));
      }
      setLoadingUsuario(false);
    };
    load();
  }, [userId, fetchModulosUsuario]);

  // Handler para toggle de restrição
  const handleToggleRestringir = async (checked: boolean) => {
    const success = await toggleRestringirModulos(userId, checked);
    if (success) {
      setRestringir(checked);
    }
  };

  // Handler para toggle de módulo
  const handleToggleModulo = async (moduloId: string, checked: boolean) => {
    const success = await toggleModuloAutorizado(userId, moduloId, checked);
    if (success) {
      if (checked) {
        setModulosAutorizados(prev => [...prev, moduloId]);
      } else {
        setModulosAutorizados(prev => prev.filter(id => id !== moduloId));
      }
    }
  };

  const loading = loadingModulos || loadingUsuario;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toggle de restrição */}
      <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
        <div className="flex items-center gap-3">
          {restringir ? (
            <Lock className="h-5 w-5 text-amber-500" />
          ) : (
            <Unlock className="h-5 w-5 text-green-500" />
          )}
          <div>
            <Label className="font-medium">Restringir acesso por módulos</Label>
            <p className="text-sm text-muted-foreground">
              {restringir 
                ? 'Usuário só acessa módulos marcados abaixo'
                : 'Usuário acessa todos os módulos permitidos por seus perfis'}
            </p>
          </div>
        </div>
        <Switch
          checked={restringir}
          onCheckedChange={handleToggleRestringir}
          disabled={saving}
        />
      </div>

      {/* Aviso de restrição ativa */}
      {restringir && (
        <Alert variant="default" className="border-amber-500/50 bg-amber-50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <strong>{userName || 'Este usuário'}</strong> só terá acesso aos módulos 
            marcados abaixo, mesmo que seus perfis concedam mais permissões.
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de módulos */}
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <Boxes className="h-4 w-4" />
          Módulos do Sistema
        </h4>
        
        <ScrollArea className="h-[350px] pr-4">
          <div className="space-y-2">
            {modulos.map(modulo => {
              const autorizado = modulosAutorizados.includes(modulo.id);
              const disabled = saving || !restringir;
              
              return (
                <div
                  key={modulo.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    restringir 
                      ? autorizado 
                        ? 'bg-primary/10 border-primary/30' 
                        : 'hover:bg-accent'
                      : 'bg-muted/30 opacity-60'
                  }`}
                >
                  <Checkbox
                    checked={restringir ? autorizado : true}
                    onCheckedChange={(checked) => 
                      handleToggleModulo(modulo.id, checked as boolean)
                    }
                    disabled={disabled}
                  />
                  
                  <div 
                    className={`px-2 py-1 rounded text-xs font-medium ${getModuloCorClass(modulo.cor)}`}
                  >
                    {modulo.codigo}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{modulo.nome}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {modulo.descricao || modulo.prefixos_rota.join(', ')}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        
        {!restringir && (
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Ative "Restringir acesso por módulos" para controlar quais módulos este usuário pode acessar.
          </p>
        )}
      </div>
    </div>
  );
}
