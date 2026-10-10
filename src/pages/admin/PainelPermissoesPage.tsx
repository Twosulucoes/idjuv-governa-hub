/**
 * PAINEL CONSOLIDADO DE PERMISSÕES
 * 
 * Visão matriz de todos os usuários x módulos x permissões.
 * Permite gerenciar tudo em uma única tela.
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { ModuleLayout } from "@/components/layout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MODULES_CONFIG, MODULO_COR_CLASSES } from "@/shared/config/modules.config";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState, KpiCard, PageHeader, StatusBadge } from "@/components/design-system";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Users,
  Shield,
  Search,
  Save,
  Loader2,
  RotateCcw,
  CheckCircle2,
  XCircle,
  UserCheck,
  LayoutGrid,
  List,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ================================
// TYPES
// ================================

interface CatalogItem {
  id: string;
  module_code: string;
  permission_code: string;
  label: string;
  category: string | null;
  action_type: string;
  sort_order: number;
}

interface UserWithModules {
  user_id: string;
  full_name: string;
  email: string;
  role: string | null;
  modules: {
    id: string; // user_modules.id
    module: string;
    permissions: string[];
  }[];
}

// ================================
// ACTION TYPE COLORS
// ================================

// Tokens do design system; o tipo da ação sempre aparece escrito no selo.
const ACTION_COLORS: Record<string, string> = {
  visualizar: 'bg-info/15 text-info',
  criar: 'bg-success/15 text-success',
  editar: 'bg-warning/15 text-warning',
  excluir: 'bg-destructive/15 text-destructive',
  gerenciar: 'bg-primary/10 text-primary',
  processar: 'bg-accent/15 text-accent',
  exportar: 'bg-muted text-foreground',
};

const MIGALHAS = [{ rotulo: "Administração", href: "/admin" }, { rotulo: "Painel de permissões" }];

// ================================
// MAIN COMPONENT
// ================================

export default function PainelPermissoesPage() {
  const { toast } = useToast();
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [users, setUsers] = useState<UserWithModules[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState<string>("all");
  const [pendingChanges, setPendingChanges] = useState<Record<string, string[]>>({});
  const [viewMode, setViewMode] = useState<"users" | "matrix">("users");

  // ================================
  // DATA FETCHING
  // ================================

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [catalogRes, modulesRes, profilesRes, rolesRes] = await Promise.all([
        supabase.from('module_permissions_catalog').select('*').order('module_code, sort_order'),
        supabase.from('user_modules').select('id, user_id, module, permissions'),
        supabase.from('profiles').select('id, full_name, email'),
        supabase.from('user_roles').select('user_id, role'),
      ]);

      if (catalogRes.data) {
        setCatalog(catalogRes.data as unknown as CatalogItem[]);
      }

      // Build user map
      const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]));
      const roleMap = new Map((rolesRes.data || []).map((r: any) => [r.user_id, r.role]));
      
      const userMap = new Map<string, UserWithModules>();
      
      for (const um of (modulesRes.data || []) as any[]) {
        if (!userMap.has(um.user_id)) {
          const profile = profileMap.get(um.user_id);
          userMap.set(um.user_id, {
            user_id: um.user_id,
            full_name: profile?.full_name || 'Desconhecido',
            email: profile?.email || '',
            role: roleMap.get(um.user_id) || null,
            modules: [],
          });
        }
        userMap.get(um.user_id)!.modules.push({
          id: um.id,
          module: um.module,
          permissions: um.permissions || [],
        });
      }

      const sortedUsers = Array.from(userMap.values())
        .sort((a, b) => a.full_name.localeCompare(b.full_name));
      
      setUsers(sortedUsers);
      setPendingChanges({});
    } catch (error) {
      console.error('[PainelPermissoes] Erro:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ================================
  // COMPUTED DATA
  // ================================

  // Group catalog by module
  const catalogByModule = useMemo(() => {
    const map: Record<string, CatalogItem[]> = {};
    for (const item of catalog) {
      if (!map[item.module_code]) map[item.module_code] = [];
      map[item.module_code].push(item);
    }
    return map;
  }, [catalog]);

  // Group catalog by module+category
  const catalogByModuleCategory = useMemo(() => {
    const map: Record<string, Record<string, CatalogItem[]>> = {};
    for (const item of catalog) {
      if (!map[item.module_code]) map[item.module_code] = {};
      const cat = item.category || 'Outros';
      if (!map[item.module_code][cat]) map[item.module_code][cat] = [];
      map[item.module_code][cat].push(item);
    }
    return map;
  }, [catalog]);

  // Module codes that have catalog entries
  const modulesWithCatalog = useMemo(() => 
    [...new Set(catalog.map(c => c.module_code))].sort(),
  [catalog]);

  // Filter users
  const filteredUsers = useMemo(() => {
    let filtered = users;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u =>
        u.full_name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      );
    }

    if (selectedModule !== "all") {
      filtered = filtered.filter(u =>
        u.modules.some(m => m.module === selectedModule)
      );
    }

    return filtered;
  }, [users, searchTerm, selectedModule]);

  // Stats
  const stats = useMemo(() => ({
    totalUsers: users.length,
    totalModules: modulesWithCatalog.length,
    totalPermissions: catalog.length,
    totalAssignments: users.reduce((sum, u) => sum + u.modules.length, 0),
  }), [users, modulesWithCatalog, catalog]);

  // ================================
  // PERMISSION MANAGEMENT
  // ================================

  const getPerms = (umId: string, saved: string[]): string[] => {
    return pendingChanges[umId] ?? saved;
  };

  const togglePerm = (umId: string, permCode: string, saved: string[]) => {
    const current = getPerms(umId, saved);
    const newPerms = current.includes(permCode)
      ? current.filter(p => p !== permCode)
      : [...current, permCode];
    setPendingChanges(prev => ({ ...prev, [umId]: newPerms }));
  };

  const toggleAllModule = (umId: string, moduleCode: string, saved: string[]) => {
    const moduleCodes = (catalogByModule[moduleCode] || []).map(c => c.permission_code);
    const current = getPerms(umId, saved);
    const hasAll = moduleCodes.every(c => current.includes(c));
    
    const newPerms = hasAll
      ? current.filter(p => !moduleCodes.includes(p))
      : [...new Set([...current, ...moduleCodes])];
    
    setPendingChanges(prev => ({ ...prev, [umId]: newPerms }));
  };

  const toggleCategory = (umId: string, catPerms: CatalogItem[], saved: string[]) => {
    const catCodes = catPerms.map(c => c.permission_code);
    const current = getPerms(umId, saved);
    const hasAll = catCodes.every(c => current.includes(c));
    
    const newPerms = hasAll
      ? current.filter(p => !catCodes.includes(p))
      : [...new Set([...current, ...catCodes])];
    
    setPendingChanges(prev => ({ ...prev, [umId]: newPerms }));
  };

  const saveUserModule = async (umId: string) => {
    const perms = pendingChanges[umId];
    if (!perms) return;

    setSaving(umId);
    try {
      const { error } = await supabase
        .from('user_modules')
        .update({ permissions: perms } as any)
        .eq('id', umId);

      if (error) throw error;

      setUsers(prev => prev.map(u => ({
        ...u,
        modules: u.modules.map(m =>
          m.id === umId ? { ...m, permissions: perms } : m
        ),
      })));

      setPendingChanges(prev => {
        const next = { ...prev };
        delete next[umId];
        return next;
      });

      toast({ title: "Permissões salvas com sucesso" });
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const saveAllPending = async () => {
    const entries = Object.entries(pendingChanges);
    if (entries.length === 0) return;

    setSaving('all');
    try {
      for (const [umId, perms] of entries) {
        const { error } = await supabase
          .from('user_modules')
          .update({ permissions: perms } as any)
          .eq('id', umId);
        if (error) throw error;
      }

      setUsers(prev => prev.map(u => ({
        ...u,
        modules: u.modules.map(m =>
          pendingChanges[m.id] ? { ...m, permissions: pendingChanges[m.id] } : m
        ),
      })));

      setPendingChanges({});
      toast({ title: `${entries.length} alteração(ões) salva(s) com sucesso` });
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const pendingCount = Object.keys(pendingChanges).length;

  // ================================
  // HELPER - Get module name
  // ================================

  const getModuleName = (code: string) => {
    return MODULES_CONFIG.find(m => m.codigo === code)?.nome || code;
  };

  const getModuleColor = (code: string) => {
    const config = MODULES_CONFIG.find(m => m.codigo === code);
    return config ? MODULO_COR_CLASSES[config.cor] : '';
  };

  // ================================
  // RENDER
  // ================================

  if (loading) {
    return (
      <ModuleLayout module="admin">
        <div className="space-y-6">
          <PageHeader
            migalhas={MIGALHAS}
            titulo="Painel de permissões"
            descricao="Visão consolidada de todos os usuários, módulos e permissões do sistema"
          />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20" />)}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </ModuleLayout>
    );
  }

  return (
    <ModuleLayout module="admin">
      <div className="space-y-6">
        <PageHeader
          migalhas={MIGALHAS}
          titulo="Painel de permissões"
          descricao="Visão consolidada de todos os usuários, módulos e permissões do sistema"
          acoes={
            <>
              {pendingCount > 0 && (
                <Button onClick={saveAllPending} disabled={saving === 'all'}>
                  {saving === 'all' ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" aria-hidden="true" />
                  )}
                  Salvar tudo ({pendingCount})
                </Button>
              )}
              <Button variant="outline" onClick={fetchData}>
                <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
                Atualizar
              </Button>
            </>
          }
        />

        {/* Indicadores */}
        <div className="grid gap-4 md:grid-cols-4">
          <KpiCard rotulo="Usuários" valor={stats.totalUsers} icone={Users} />
          <KpiCard rotulo="Módulos" valor={stats.totalModules} icone={LayoutGrid} />
          <KpiCard rotulo="Permissões" valor={stats.totalPermissions} icone={Shield} />
          <KpiCard rotulo="Atribuições" valor={stats.totalAssignments} icone={CheckCircle2} />
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              aria-label="Buscar usuário"
              placeholder="Buscar usuário..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedModule} onValueChange={setSelectedModule}>
            <SelectTrigger className="w-[200px]" aria-label="Filtrar por módulo">
              <SelectValue placeholder="Filtrar módulo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os módulos</SelectItem>
              {modulesWithCatalog.map(code => (
                <SelectItem key={code} value={code}>
                  {getModuleName(code)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Users List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredUsers.length} usuário(s) encontrado(s)
            </p>
            {pendingCount > 0 && (
              <StatusBadge tom="pendente">
                {pendingCount} alteração(ões) pendente(s)
              </StatusBadge>
            )}
          </div>

          <Accordion type="multiple" className="space-y-2">
            {filteredUsers.map(user => {
              const userModules = selectedModule === "all"
                ? user.modules
                : user.modules.filter(m => m.module === selectedModule);

              const userPendingCount = userModules.filter(m => !!pendingChanges[m.id]).length;

              return (
                <AccordionItem
                  key={user.user_id}
                  value={user.user_id}
                  className={cn(
                    "border rounded-lg overflow-hidden",
                    userPendingCount > 0 && "border-primary/50 bg-primary/5"
                  )}
                >
                  <AccordionTrigger className="hover:no-underline px-4 py-3">
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <UserCheck className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {user.role && (
                          <Badge variant="outline" className="text-xs">
                            {user.role}
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-xs">
                          {user.modules.length} módulo(s)
                        </Badge>
                        {userPendingCount > 0 && (
                          <StatusBadge tom="pendente" icone={false}>
                            {userPendingCount} alterado(s)
                          </StatusBadge>
                        )}
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      {userModules.map(um => {
                        const modulePerms = catalogByModule[um.module] || [];
                        const categories = catalogByModuleCategory[um.module] || {};
                        const currentPerms = getPerms(um.id, um.permissions);
                        const hasPending = !!pendingChanges[um.id];
                        const hasAllModule = modulePerms.length > 0 &&
                          modulePerms.every(p => currentPerms.includes(p.permission_code));
                        const permCount = modulePerms.filter(p => currentPerms.includes(p.permission_code)).length;

                        return (
                          <div key={um.id} className="border rounded-lg p-4 space-y-3">
                            {/* Module Header */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={cn(
                                  "h-8 w-8 rounded-md flex items-center justify-center text-xs font-bold",
                                  getModuleColor(um.module)
                                )}>
                                  {um.module.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-medium text-sm">{getModuleName(um.module)}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {permCount}/{modulePerms.length} permissões
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2">
                                  <Checkbox
                                    checked={hasAllModule}
                                    onCheckedChange={() => toggleAllModule(um.id, um.module, um.permissions)}
                                    aria-label={`Todas as permissões de ${getModuleName(um.module)}`}
                                  />
                                  <span className="text-xs text-muted-foreground">Todas</span>
                                </div>
                                {hasPending && (
                                  <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => saveUserModule(um.id)}
                                    disabled={saving === um.id}
                                  >
                                    {saving === um.id ? (
                                      <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                                    ) : (
                                      <Save className="h-3 w-3" aria-hidden="true" />
                                    )}
                                    <span className="ml-1">Salvar</span>
                                  </Button>
                                )}
                              </div>
                            </div>

                            <Separator />

                            {/* Categories */}
                            {Object.entries(categories).map(([catName, catPerms]) => {
                              const catCodes = catPerms.map(c => c.permission_code);
                              const hasAllCat = catCodes.every(c => currentPerms.includes(c));
                              const hasSomeCat = catCodes.some(c => currentPerms.includes(c));

                              return (
                                <div key={catName} className="space-y-1.5">
                                  <div className="flex items-center gap-2">
                                    <Checkbox
                                      checked={hasAllCat}
                                      onCheckedChange={() => toggleCategory(um.id, catPerms, um.permissions)}
                                      aria-label={`Todas as permissões da categoria ${catName}`}
                                    />
                                    <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                                      {catName}
                                    </span>
                                    <span className="text-caption text-muted-foreground">
                                      ({catCodes.filter(c => currentPerms.includes(c)).length}/{catCodes.length})
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 ml-6">
                                    {catPerms.map(perm => {
                                      const isChecked = currentPerms.includes(perm.permission_code);
                                      return (
                                        <label
                                          key={perm.permission_code}
                                          className={cn(
                                            "flex items-center gap-2 p-1.5 rounded text-xs cursor-pointer transition-colors",
                                            isChecked ? "bg-primary/5" : "hover:bg-muted/50"
                                          )}
                                        >
                                          <Checkbox
                                            checked={isChecked}
                                            onCheckedChange={() => togglePerm(um.id, perm.permission_code, um.permissions)}
                                          />
                                          <span className="flex-1 truncate">{perm.label}</span>
                                          <Badge
                                            variant="secondary"
                                            className={cn("text-[9px] px-1 py-0 shrink-0", ACTION_COLORS[perm.action_type])}
                                          >
                                            {perm.action_type}
                                          </Badge>
                                        </label>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>

          {filteredUsers.length === 0 && (
            <EmptyState icone={Users} titulo="Nenhum usuário encontrado com os filtros aplicados." />
          )}
        </div>
      </div>
    </ModuleLayout>
  );
}
