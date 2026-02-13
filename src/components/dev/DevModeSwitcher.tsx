/**
 * DEV MODE SWITCHER
 * 
 * Componente para alternar entre roles e módulos em tempo real para testes.
 * Aparece apenas em ambiente de desenvolvimento ou quando ativado via localStorage.
 * 
 * @version 1.1.0
 */

import { useState, useEffect } from 'react';
import { Settings2, Shield, ShieldCheck, User, ChevronDown, ChevronUp, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/contexts/AuthContext';
import { MODULOS, MODULES_CONFIG, type Modulo } from '@/shared/config/modules.config';

const STORAGE_KEY = 'dev-mode-overrides';
const DEV_MODE_ENABLED_KEY = 'dev-mode-enabled';

interface DevModeOverrides {
  modules: Modulo[];
  isSuperAdmin: boolean;
}

// Helper para obter o nome amigável do módulo
function getModuleName(codigo: Modulo): string {
  const config = MODULES_CONFIG.find(m => m.codigo === codigo);
  return config?.nome || codigo;
}

// Hook para usar os overrides de dev mode
export function useDevModeOverrides() {
  const [overrides, setOverrides] = useState<DevModeOverrides | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    const enabled = localStorage.getItem(DEV_MODE_ENABLED_KEY) === 'true';
    setIsEnabled(enabled);

    if (enabled) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setOverrides(JSON.parse(saved));
        }
      } catch {
        // Ignora erros de parsing
      }
    }
  }, []);

  return { overrides, isEnabled };
}

export function DevModeSwitcher() {
  const { user, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  
  const [selectedModules, setSelectedModules] = useState<Modulo[]>([]);
  const [selectedModules, setSelectedModules] = useState<Modulo[]>([]);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  // Carregar estado salvo
  useEffect(() => {
    const enabled = localStorage.getItem(DEV_MODE_ENABLED_KEY) === 'true';
    setIsEnabled(enabled);

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const overrides: DevModeOverrides = JSON.parse(saved);
        setSelectedModules(overrides.modules);
        setIsSuperAdmin(overrides.isSuperAdmin);
      }
    } catch {
      // Ignora erros de parsing
    }
  }, []);

  // Salvar mudanças e disparar evento
  const saveOverrides = (modules: Modulo[], superAdmin: boolean) => {
    const overrides: DevModeOverrides = {
      modules,
      isSuperAdmin: superAdmin,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    window.dispatchEvent(new CustomEvent('dev-mode-changed', { detail: overrides }));
  };

  const handleSuperAdminToggle = (checked: boolean) => {
    setIsSuperAdmin(checked);
    if (checked) {
      setSelectedModules([...MODULOS]);
      saveOverrides([...MODULOS], true);
    } else {
      setIsSuperAdmin(false);
      saveOverrides(role, selectedModules, false);
    }
  };

  const handleModuleToggle = (modulo: Modulo) => {
    const newModules = selectedModules.includes(modulo)
      ? selectedModules.filter(m => m !== modulo)
      : [...selectedModules, modulo];
    
    setSelectedModules(newModules);
    saveOverrides(selectedRole, newModules, isSuperAdmin);
  };

  const handleSuperAdminToggle = (checked: boolean) => {
    setIsSuperAdmin(checked);
    if (checked) {
      setSelectedRole('admin');
      setSelectedModules([...MODULOS]);
      saveOverrides('admin', [...MODULOS], true);
    } else {
      saveOverrides(selectedRole, selectedModules, false);
    }
  };

  const handleEnableToggle = (checked: boolean) => {
    setIsEnabled(checked);
    localStorage.setItem(DEV_MODE_ENABLED_KEY, String(checked));
    
    if (checked) {
      // Ao ativar, inicializar com role user e sem módulos
      setSelectedRole('user');
      setSelectedModules([]);
      setIsSuperAdmin(false);
      saveOverrides('user', [], false);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      setSelectedRole(null);
      setSelectedModules([]);
      setIsSuperAdmin(false);
      // Disparar evento para desativar
      window.dispatchEvent(new CustomEvent('dev-mode-changed', { detail: null }));
    }
  };

  const handleReset = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DEV_MODE_ENABLED_KEY);
    setSelectedRole(null);
    setSelectedModules([]);
    setIsSuperAdmin(false);
    setIsEnabled(false);
    window.dispatchEvent(new CustomEvent('dev-mode-changed', { detail: null }));
  };

  if (!isAuthenticated) return null;

  // Label do role selecionado
  const roleLabel = ROLES.find(r => r.value === selectedRole)?.label || 'Nenhum';
  const modulesLabel = selectedModules.map(m => getModuleName(m)).join(', ');

  return (
    <>
      {/* Banner de aviso quando Dev Mode está ativo */}
      {isEnabled && (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-amber-950 py-1.5 px-4 text-sm font-medium flex items-center justify-center gap-2 shadow-md">
          <AlertTriangle className="w-4 h-4" />
          <span>
            Modo Simulação: <strong>{isSuperAdmin ? 'Super Admin' : roleLabel}</strong>
            {!isSuperAdmin && selectedModules.length > 0 && (
              <span className="ml-1 opacity-90">
                ({selectedModules.length} módulo{selectedModules.length > 1 ? 's' : ''})
              </span>
            )}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="ml-2 h-6 px-2 text-amber-950 hover:text-amber-900 hover:bg-amber-400"
            onClick={handleReset}
          >
            Desativar
          </Button>
        </div>
      )}

      {/* Botão flutuante */}
      <Button
        variant="outline"
        size="icon"
        className={`fixed bottom-4 right-4 z-50 rounded-full w-12 h-12 shadow-lg bg-background border-2 ${
          isEnabled 
            ? 'border-amber-500 hover:border-amber-600' 
            : 'border-primary/50 hover:border-primary'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Settings2 className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-90' : ''} ${isEnabled ? 'text-amber-600' : ''}`} />
      </Button>

      {/* Painel */}
      {isOpen && (
        <Card className="fixed bottom-20 right-4 z-50 w-80 shadow-xl animate-in slide-in-from-bottom-5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Settings2 className="w-4 h-4" />
                Dev Mode - Simulação
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between pt-2">
              <Label htmlFor="dev-mode-toggle" className="text-xs text-muted-foreground">
                Ativar simulação
              </Label>
              <Switch
                id="dev-mode-toggle"
                checked={isEnabled}
                onCheckedChange={handleEnableToggle}
              />
            </div>
          </CardHeader>

          {isEnabled && (
            <CardContent className="space-y-4 pt-0">
              {/* Super Admin Toggle */}
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-primary" />
                  <Label htmlFor="super-admin" className="text-sm font-medium">
                    Super Admin
                  </Label>
                </div>
                <Switch
                  id="super-admin"
                  checked={isSuperAdmin}
                  onCheckedChange={handleSuperAdminToggle}
                />
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Role</Label>
                <div className="flex gap-2">
                  {ROLES.map((role) => (
                    <Button
                      key={role.value}
                      variant={selectedRole === role.value ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => handleRoleChange(role.value)}
                      disabled={isSuperAdmin && role.value !== 'admin'}
                    >
                      {role.icon}
                      <span className="ml-1">{role.label}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Modules */}
              <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between">
                    <span className="text-xs">
                      Módulos ({selectedModules.length}/{MODULOS.length})
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto">
                    {MODULES_CONFIG.map((config) => (
                      <div
                        key={config.codigo}
                        className={`flex items-center gap-2 p-2 rounded hover:bg-muted/50 cursor-pointer ${
                          selectedModules.includes(config.codigo) ? 'bg-primary/10' : ''
                        }`}
                        onClick={() => !isSuperAdmin && handleModuleToggle(config.codigo)}
                      >
                        <Switch
                          id={`mod-${config.codigo}`}
                          checked={selectedModules.includes(config.codigo)}
                          onCheckedChange={() => handleModuleToggle(config.codigo)}
                          disabled={isSuperAdmin}
                          className="scale-75"
                        />
                        <config.icone className="w-4 h-4 text-muted-foreground" />
                        <Label
                          htmlFor={`mod-${config.codigo}`}
                          className="text-xs cursor-pointer flex-1"
                        >
                          {config.nome}
                        </Label>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* Status atual */}
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">Status simulado:</p>
                <div className="flex flex-wrap gap-1">
                  {isSuperAdmin && (
                    <Badge variant="default" className="text-xs bg-amber-600">Super Admin</Badge>
                  )}
                  {selectedRole && !isSuperAdmin && (
                    <Badge variant="secondary" className="text-xs">{roleLabel}</Badge>
                  )}
                  {selectedModules.length > 0 && !isSuperAdmin && (
                    <Badge variant="outline" className="text-xs">
                      {selectedModules.length} módulo{selectedModules.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                  {!isSuperAdmin && selectedModules.length === 0 && (
                    <Badge variant="destructive" className="text-xs">Sem módulos</Badge>
                  )}
                </div>
              </div>

              {/* Reset */}
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs text-muted-foreground"
                onClick={handleReset}
              >
                Resetar e desativar
              </Button>
            </CardContent>
          )}
        </Card>
      )}
    </>
  );
}
