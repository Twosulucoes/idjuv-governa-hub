/**
 * GESTÃO DE MÓDULOS
 * 
 * Painel administrativo para visualizar, ativar/desativar módulos
 * e configurar funcionalidades de cada módulo do sistema.
 * 
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from "react";
import { ModuleLayout } from "@/components/layout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MODULES_CONFIG, MODULO_COR_CLASSES, type Modulo } from "@/shared/config/modules.config";
import { MODULE_MENUS } from "@/config/module-menus.config";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Users,
  Settings,
  Search,
  ChevronRight,
  Power,
  PowerOff,
  LayoutGrid,
  Save,
  RotateCcw,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleSettingsRow {
  id: string;
  module_code: string;
  enabled: boolean;
  display_name: string | null;
  description: string | null;
  features: any;
  settings: any;
  updated_at: string;
}

interface ModuleUserCount {
  module: string;
  count: number;
}

export default function GestaoModulosPage() {
  const { toast } = useToast();
  const [moduleSettings, setModuleSettings] = useState<ModuleSettingsRow[]>([]);
  const [userCounts, setUserCounts] = useState<ModuleUserCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");

  // Fetch module settings and user counts
  const fetchData = useCallback(async () => {
    try {
      const [settingsRes, usersRes] = await Promise.all([
        supabase.from('module_settings').select('*').order('module_code'),
        supabase.from('user_modules').select('module'),
      ]);

      if (settingsRes.data) {
        setModuleSettings(settingsRes.data as unknown as ModuleSettingsRow[]);
      }

      // Count users per module
      if (usersRes.data) {
        const counts: Record<string, number> = {};
        (usersRes.data as any[]).forEach((row) => {
          counts[row.module] = (counts[row.module] || 0) + 1;
        });
        setUserCounts(Object.entries(counts).map(([module, count]) => ({ module, count })));
      }
    } catch (error) {
      console.error('[GestaoModulos] Erro:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toggle module enabled/disabled
  const toggleModule = async (moduleCode: string, enabled: boolean) => {
    // Don't allow disabling admin module
    if (moduleCode === 'admin' && !enabled) {
      toast({
        title: "Ação não permitida",
        description: "O módulo Administração não pode ser desativado.",
        variant: "destructive",
      });
      return;
    }

    setSaving(moduleCode);
    try {
      const { error } = await supabase
        .from('module_settings')
        .update({ enabled } as any)
        .eq('module_code', moduleCode);

      if (error) throw error;

      setModuleSettings(prev =>
        prev.map(m => m.module_code === moduleCode ? { ...m, enabled } : m)
      );

      toast({
        title: enabled ? "Módulo ativado" : "Módulo desativado",
        description: `${getModuleConfig(moduleCode)?.nome || moduleCode} foi ${enabled ? 'ativado' : 'desativado'}.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  // Save module description
  const saveDescription = async (moduleCode: string) => {
    setSaving(moduleCode);
    try {
      const { error } = await supabase
        .from('module_settings')
        .update({ description: editDescription } as any)
        .eq('module_code', moduleCode);

      if (error) throw error;

      setModuleSettings(prev =>
        prev.map(m => m.module_code === moduleCode ? { ...m, description: editDescription } : m)
      );

      toast({ title: "Descrição atualizada" });
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const getModuleConfig = (code: string) => MODULES_CONFIG.find(m => m.codigo === code);
  const getModuleMenu = (code: string) => MODULE_MENUS[code as Modulo];
  const getUserCount = (code: string) => userCounts.find(u => u.module === code)?.count || 0;
  const getSettings = (code: string) => moduleSettings.find(m => m.module_code === code);

  const filteredModules = MODULES_CONFIG.filter(m =>
    m.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.descricao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const enabledCount = moduleSettings.filter(m => m.enabled).length;
  const totalUsers = userCounts.reduce((sum, u) => sum + u.count, 0);

  const selectedConfig = selectedModule ? getModuleConfig(selectedModule) : null;
  const selectedSettings = selectedModule ? getSettings(selectedModule) : null;
  const selectedMenu = selectedModule ? getModuleMenu(selectedModule) : null;

  if (loading) {
    return (
      <ModuleLayout module="admin">
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-40" />)}
          </div>
        </div>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout module="admin">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestão de Módulos</h1>
            <p className="text-muted-foreground">
              Gerencie os módulos disponíveis no sistema, suas funcionalidades e status
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <LayoutGrid className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{MODULES_CONFIG.length}</p>
                <p className="text-sm text-muted-foreground">Módulos Totais</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Power className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{enabledCount}</p>
                <p className="text-sm text-muted-foreground">Módulos Ativos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="h-12 w-12 rounded-lg bg-accent flex items-center justify-center">
                <Users className="h-6 w-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalUsers}</p>
                <p className="text-sm text-muted-foreground">Atribuições de Módulos</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar módulo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Module Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredModules.map((moduleConfig) => {
            const settings = getSettings(moduleConfig.codigo);
            const isEnabled = settings?.enabled ?? true;
            const count = getUserCount(moduleConfig.codigo);
            const menu = getModuleMenu(moduleConfig.codigo);
            const Icon = moduleConfig.icone;
            const isSaving = saving === moduleConfig.codigo;

            return (
              <Card
                key={moduleConfig.codigo}
                className={cn(
                  "transition-all duration-200",
                  !isEnabled && "opacity-60 border-dashed"
                )}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center",
                      MODULO_COR_CLASSES[moduleConfig.cor]
                    )}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => toggleModule(moduleConfig.codigo, checked)}
                      disabled={isSaving || moduleConfig.codigo === 'admin'}
                    />
                  </div>
                  <CardTitle className="text-base mt-2">{moduleConfig.nome}</CardTitle>
                  <CardDescription className="text-xs line-clamp-2">
                    {settings?.description || moduleConfig.descricao}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      <span>{count} {count === 1 ? 'usuário' : 'usuários'}</span>
                    </div>
                    <Badge variant={isEnabled ? "default" : "secondary"} className="text-xs">
                      {isEnabled ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Package className="h-3.5 w-3.5" />
                    <span>{menu?.items.length || 0} funcionalidades</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-between text-xs"
                    onClick={() => {
                      setSelectedModule(moduleConfig.codigo);
                      setEditDescription(settings?.description || moduleConfig.descricao);
                    }}
                  >
                    Ver detalhes
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Detail Dialog */}
        <Dialog open={!!selectedModule} onOpenChange={() => setSelectedModule(null)}>
          <DialogContent className="max-w-2xl max-h-[85vh]">
            {selectedConfig && selectedSettings && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center",
                      MODULO_COR_CLASSES[selectedConfig.cor]
                    )}>
                      <selectedConfig.icone className="h-5 w-5" />
                    </div>
                    <div>
                      <DialogTitle>{selectedConfig.nome}</DialogTitle>
                      <DialogDescription>
                        Código: <code className="text-xs bg-muted px-1 rounded">{selectedConfig.codigo}</code>
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh]">
                  <div className="space-y-6 pr-4">
                    {/* Status */}
                    <div className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        {selectedSettings.enabled ? (
                          <Power className="h-4 w-4 text-primary" />
                        ) : (
                          <PowerOff className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium text-sm">
                          {selectedSettings.enabled ? "Módulo Ativo" : "Módulo Inativo"}
                        </span>
                      </div>
                      <Switch
                        checked={selectedSettings.enabled}
                        onCheckedChange={(checked) => toggleModule(selectedConfig.codigo, checked)}
                        disabled={selectedConfig.codigo === 'admin'}
                      />
                    </div>

                    {/* Description Edit */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Descrição</label>
                      <Textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        placeholder="Descrição do módulo..."
                        rows={2}
                      />
                      <Button
                        size="sm"
                        onClick={() => saveDescription(selectedConfig.codigo)}
                        disabled={saving === selectedConfig.codigo}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Salvar Descrição
                      </Button>
                    </div>

                    <Separator />

                    {/* Routes */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Rotas do Módulo
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedConfig.rotas.map(rota => (
                          <Badge key={rota} variant="outline" className="text-xs font-mono">
                            {rota}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Features / Menu Items */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Funcionalidades ({selectedMenu?.items.length || 0})
                      </h4>
                      <div className="space-y-1.5">
                        {selectedMenu?.items.map(item => {
                          const ItemIcon = item.icon;
                          return (
                            <div key={item.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 text-sm">
                              <ItemIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium">{item.label}</p>
                                <p className="text-xs text-muted-foreground font-mono truncate">{item.route}</p>
                              </div>
                              {item.children && (
                                <Badge variant="secondary" className="text-xs">
                                  +{item.children.length} sub
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Users */}
                    <Separator />
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {getUserCount(selectedConfig.codigo)} usuário(s) com acesso a este módulo
                      </span>
                    </div>

                    {/* Last update */}
                    <p className="text-xs text-muted-foreground">
                      Última atualização: {new Date(selectedSettings.updated_at).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </ScrollArea>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ModuleLayout>
  );
}
