/**
 * GESTÃO DE PERMISSÕES POR MÓDULO
 * 
 * Interface checklist para gerenciar permissões de cada usuário
 * que tem acesso ao módulo selecionado.
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Users,
  Save,
  CheckCircle2,
  Shield,
  UserCheck,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PermissionCatalogItem {
  id: string;
  module_code: string;
  permission_code: string;
  label: string;
  category: string | null;
  action_type: string;
  sort_order: number;
}

interface ModuleUser {
  id: string; // user_modules.id
  user_id: string;
  module: string;
  permissions: string[];
  profile: {
    full_name: string;
    email: string;
  };
  role: string | null;
}

interface Props {
  moduleCode: string;
  moduleName: string;
}

export default function ModulePermissionsManager({ moduleCode, moduleName }: Props) {
  const { toast } = useToast();
  const [catalog, setCatalog] = useState<PermissionCatalogItem[]>([]);
  const [users, setUsers] = useState<ModuleUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [pendingChanges, setPendingChanges] = useState<Record<string, string[]>>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch permission catalog for this module
      const { data: catalogData } = await supabase
        .from('module_permissions_catalog')
        .select('*')
        .eq('module_code', moduleCode)
        .order('sort_order');

      // Fetch users with this module
      const { data: moduleUsers } = await supabase
        .from('user_modules')
        .select('id, user_id, module, permissions')
        .eq('module', moduleCode as any);

      if (catalogData) {
        setCatalog(catalogData as unknown as PermissionCatalogItem[]);
      }

      if (moduleUsers && moduleUsers.length > 0) {
        // Fetch profiles and roles for these users
        const userIds = moduleUsers.map((u: any) => u.user_id);
        
        const [profilesRes, rolesRes] = await Promise.all([
          supabase.from('profiles').select('id, full_name, email').in('id', userIds),
          supabase.from('user_roles').select('user_id, role').in('user_id', userIds),
        ]);

        const profileMap = new Map((profilesRes.data || []).map((p: any) => [p.id, p]));
        const roleMap = new Map((rolesRes.data || []).map((r: any) => [r.user_id, r.role]));

        const enriched: ModuleUser[] = (moduleUsers as any[]).map(um => ({
          id: um.id,
          user_id: um.user_id,
          module: um.module,
          permissions: um.permissions || [],
          profile: profileMap.get(um.user_id) || { full_name: 'Desconhecido', email: '' },
          role: roleMap.get(um.user_id) || null,
        }));

        setUsers(enriched.sort((a, b) => a.profile.full_name.localeCompare(b.profile.full_name)));
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('[ModulePermissions] Erro:', error);
    } finally {
      setLoading(false);
    }
  }, [moduleCode]);

  useEffect(() => {
    fetchData();
    setPendingChanges({});
  }, [fetchData]);

  // Group catalog by category
  const categories = catalog.reduce<Record<string, PermissionCatalogItem[]>>((acc, item) => {
    const cat = item.category || 'Outros';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  // Get current permissions for a user (pending or saved)
  const getUserPermissions = (userModuleId: string, savedPermissions: string[]): string[] => {
    return pendingChanges[userModuleId] ?? savedPermissions;
  };

  // Toggle a permission for a user
  const togglePermission = (userModuleId: string, permCode: string, savedPermissions: string[]) => {
    const current = getUserPermissions(userModuleId, savedPermissions);
    const newPerms = current.includes(permCode)
      ? current.filter(p => p !== permCode)
      : [...current, permCode];
    
    setPendingChanges(prev => ({ ...prev, [userModuleId]: newPerms }));
  };

  // Select/deselect all for a user
  const toggleAllForUser = (userModuleId: string, savedPermissions: string[]) => {
    const current = getUserPermissions(userModuleId, savedPermissions);
    const allCodes = catalog.map(c => c.permission_code);
    const hasAll = allCodes.every(c => current.includes(c));
    
    setPendingChanges(prev => ({
      ...prev,
      [userModuleId]: hasAll ? [] : allCodes,
    }));
  };

  // Select/deselect category for a user
  const toggleCategoryForUser = (userModuleId: string, categoryPerms: PermissionCatalogItem[], savedPermissions: string[]) => {
    const current = getUserPermissions(userModuleId, savedPermissions);
    const catCodes = categoryPerms.map(c => c.permission_code);
    const hasAllCat = catCodes.every(c => current.includes(c));
    
    const newPerms = hasAllCat
      ? current.filter(p => !catCodes.includes(p))
      : [...new Set([...current, ...catCodes])];
    
    setPendingChanges(prev => ({ ...prev, [userModuleId]: newPerms }));
  };

  // Save permissions for a user
  const saveUserPermissions = async (userModuleId: string) => {
    const perms = pendingChanges[userModuleId];
    if (!perms) return;

    setSaving(userModuleId);
    try {
      const { error } = await supabase
        .from('user_modules')
        .update({ permissions: perms } as any)
        .eq('id', userModuleId);

      if (error) throw error;

      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === userModuleId ? { ...u, permissions: perms } : u
      ));
      
      setPendingChanges(prev => {
        const next = { ...prev };
        delete next[userModuleId];
        return next;
      });

      toast({ title: "Permissões salvas com sucesso" });
    } catch (error: any) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const actionTypeColors: Record<string, string> = {
    visualizar: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    criar: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    editar: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    excluir: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
    gerenciar: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    processar: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
    exportar: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-center">
        <Users className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Nenhum usuário atribuído ao módulo <strong>{moduleName}</strong>.
        </p>
        <p className="text-xs text-muted-foreground">
          Atribua módulos aos usuários na página de Gestão de Usuários.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-medium">
          Permissões por Usuário ({users.length})
        </h4>
      </div>
      <p className="text-xs text-muted-foreground">
        Configure quais ações cada usuário pode realizar neste módulo.
      </p>

      <Accordion type="single" collapsible className="space-y-2">
        {users.map(user => {
          const currentPerms = getUserPermissions(user.id, user.permissions);
          const hasPending = !!pendingChanges[user.id];
          const allCodes = catalog.map(c => c.permission_code);
          const hasAll = allCodes.length > 0 && allCodes.every(c => currentPerms.includes(c));
          const permCount = currentPerms.length;

          return (
            <AccordionItem
              key={user.id}
              value={user.id}
              className={cn(
                "border rounded-lg px-3",
                hasPending && "border-primary/50 bg-primary/5"
              )}
            >
              <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center gap-3 flex-1 text-left">
                  <UserCheck className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{user.profile.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.profile.email}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {user.role && (
                      <Badge variant="outline" className="text-xs">
                        {user.role}
                      </Badge>
                    )}
                    <Badge variant={hasAll ? "default" : "secondary"} className="text-xs">
                      {permCount}/{allCodes.length}
                    </Badge>
                    {hasPending && (
                      <Badge variant="destructive" className="text-xs animate-pulse">
                        Alterado
                      </Badge>
                    )}
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <div className="space-y-4">
                  {/* Select All */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={hasAll}
                        onCheckedChange={() => toggleAllForUser(user.id, user.permissions)}
                      />
                      <span className="text-sm font-medium">Selecionar Todas</span>
                    </div>
                    {hasPending && (
                      <Button
                        size="sm"
                        onClick={() => saveUserPermissions(user.id)}
                        disabled={saving === user.id}
                      >
                        {saving === user.id ? (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-1" />
                        )}
                        Salvar
                      </Button>
                    )}
                  </div>

                  <Separator />

                  {/* Permissions by Category */}
                  {Object.entries(categories).map(([catName, catPerms]) => {
                    const catCodes = catPerms.map(c => c.permission_code);
                    const hasAllCat = catCodes.every(c => currentPerms.includes(c));
                    const hasSomeCat = catCodes.some(c => currentPerms.includes(c));

                    return (
                      <div key={catName} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={hasAllCat}
                            // @ts-ignore
                            indeterminate={hasSomeCat && !hasAllCat}
                            onCheckedChange={() => toggleCategoryForUser(user.id, catPerms, user.permissions)}
                          />
                          <span className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">
                            {catName}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 ml-6">
                          {catPerms.map(perm => {
                            const isChecked = currentPerms.includes(perm.permission_code);
                            return (
                              <label
                                key={perm.permission_code}
                                className={cn(
                                  "flex items-center gap-2 p-1.5 rounded-md text-sm cursor-pointer transition-colors",
                                  isChecked ? "bg-primary/5" : "hover:bg-muted/50"
                                )}
                              >
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={() => togglePermission(user.id, perm.permission_code, user.permissions)}
                                />
                                <span className="flex-1 text-xs">{perm.label}</span>
                                <Badge
                                  variant="secondary"
                                  className={cn("text-[10px] px-1.5 py-0", actionTypeColors[perm.action_type])}
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
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
