// ============================================
// GESTÃO DE PERFIS E PERMISSÕES
// ============================================

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { 
  AppRole, 
  AppPermission,
  ROLE_LABELS, 
  ROLE_DESCRIPTIONS,
  PERMISSION_LABELS,
  PERMISSION_GROUPS,
  ACCESS_SCOPE_LABELS,
  AccessScope
} from '@/types/auth';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Users, 
  Key,
  Save,
  Settings,
  CheckCircle
} from 'lucide-react';

interface RolePermission {
  role: AppRole;
  permission: AppPermission;
}

interface ModuleScope {
  id: string;
  role: AppRole;
  moduleName: string;
  accessScope: AccessScope;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canApprove: boolean;
}

export default function GestaoPerfilPage() {
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [moduleScopes, setModuleScopes] = useState<ModuleScope[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState<AppRole>('user');
  const { toast } = useToast();

  // Roles IDJuv principais
  const idjuvRoles: AppRole[] = [
    'presidencia', 'ti_admin', 'diraf', 'rh', 'controle_interno',
    'gabinete', 'juridico', 'cpl', 'ascom',
    'cadastrador_setor', 'cadastrador_local', 'cadastrador_leitura'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Buscar permissões por role
      const { data: perms } = await supabase
        .from('role_permissions')
        .select('role, permission');

      if (perms) {
        setRolePermissions(perms as RolePermission[]);
      }

      // Buscar escopos de módulo
      const { data: scopes } = await supabase
        .from('module_access_scopes')
        .select('*');

      if (scopes) {
        setModuleScopes(scopes.map((s: any) => ({
          id: s.id,
          role: s.role,
          moduleName: s.module_name,
          accessScope: s.access_scope,
          canCreate: s.can_create,
          canEdit: s.can_edit,
          canDelete: s.can_delete,
          canApprove: s.can_approve
        })));
      }
    } catch (error) {
      console.error('Erro ao buscar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (role: AppRole, permission: AppPermission) => {
    return rolePermissions.some(rp => rp.role === role && rp.permission === permission);
  };

  const togglePermission = async (role: AppRole, permission: AppPermission) => {
    setSaving(true);
    try {
      const exists = hasPermission(role, permission);

      if (exists) {
        await supabase
          .from('role_permissions')
          .delete()
          .eq('role', role)
          .eq('permission', permission);

        setRolePermissions(prev => 
          prev.filter(rp => !(rp.role === role && rp.permission === permission))
        );
      } else {
        await supabase
          .from('role_permissions')
          .insert({ role, permission });

        setRolePermissions(prev => [...prev, { role, permission }]);
      }

      toast({
        title: 'Permissão atualizada',
        description: `Permissão ${exists ? 'removida' : 'adicionada'} com sucesso.`
      });
    } catch (error) {
      console.error('Erro ao atualizar permissão:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar a permissão.'
      });
    } finally {
      setSaving(false);
    }
  };

  const getPermissionsForRole = (role: AppRole) => {
    return rolePermissions.filter(rp => rp.role === role).map(rp => rp.permission);
  };

  const getScopesForRole = (role: AppRole) => {
    return moduleScopes.filter(ms => ms.role === role);
  };

  return (
    <AdminLayout 
      title="Gestão de Perfis e Permissões" 
      description="Configure os perfis de acesso e suas permissões"
    >
      <Tabs defaultValue="perfis" className="space-y-6">
        <TabsList>
          <TabsTrigger value="perfis" className="gap-2">
            <Shield className="h-4 w-4" />
            Perfis IDJuv
          </TabsTrigger>
          <TabsTrigger value="permissoes" className="gap-2">
            <Key className="h-4 w-4" />
            Matriz de Permissões
          </TabsTrigger>
          <TabsTrigger value="escopos" className="gap-2">
            <Settings className="h-4 w-4" />
            Escopos por Módulo
          </TabsTrigger>
        </TabsList>

        {/* Aba de Perfis */}
        <TabsContent value="perfis">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {idjuvRoles.map(role => {
              const permissions = getPermissionsForRole(role);
              const scopes = getScopesForRole(role);
              
              return (
                <Card key={role} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{ROLE_LABELS[role]}</CardTitle>
                      <Badge variant="outline">{permissions.length} permissões</Badge>
                    </div>
                    <CardDescription>{ROLE_DESCRIPTIONS[role]}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium mb-2">Módulos com acesso:</p>
                        <div className="flex flex-wrap gap-1">
                          {scopes.length > 0 ? scopes.map(scope => (
                            <Badge key={scope.id} variant="secondary" className="text-xs">
                              {scope.moduleName} ({ACCESS_SCOPE_LABELS[scope.accessScope]})
                            </Badge>
                          )) : (
                            <span className="text-sm text-muted-foreground">Nenhum módulo configurado</span>
                          )}
                        </div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full"
                        onClick={() => setSelectedRole(role)}
                      >
                        Editar Permissões
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Aba de Matriz de Permissões */}
        <TabsContent value="permissoes">
          <Card>
            <CardHeader>
              <CardTitle>Matriz de Permissões por Perfil</CardTitle>
              <CardDescription>
                Clique em uma célula para adicionar ou remover a permissão
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <Accordion type="multiple" className="w-full">
                  {Object.entries(PERMISSION_GROUPS).map(([groupName, permissions]) => (
                    <AccordionItem key={groupName} value={groupName}>
                      <AccordionTrigger className="capitalize">
                        {groupName === 'users' ? 'Usuários' :
                         groupName === 'content' ? 'Conteúdo' :
                         groupName === 'reports' ? 'Relatórios' :
                         groupName === 'settings' ? 'Configurações' :
                         groupName === 'processes' ? 'Processos' :
                         groupName === 'documents' ? 'Documentos' :
                         groupName === 'requests' ? 'Solicitações' :
                         groupName === 'audit' ? 'Auditoria' :
                         groupName === 'admin' ? 'Administração' : groupName}
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[200px]">Permissão</TableHead>
                                {idjuvRoles.slice(0, 6).map(role => (
                                  <TableHead key={role} className="text-center text-xs">
                                    {ROLE_LABELS[role]}
                                  </TableHead>
                                ))}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {permissions.map(permission => (
                                <TableRow key={permission}>
                                  <TableCell className="font-medium text-sm">
                                    {PERMISSION_LABELS[permission]}
                                  </TableCell>
                                  {idjuvRoles.slice(0, 6).map(role => (
                                    <TableCell key={`${role}-${permission}`} className="text-center">
                                      <Checkbox
                                        checked={hasPermission(role, permission)}
                                        onCheckedChange={() => togglePermission(role, permission)}
                                        disabled={saving || role === 'presidencia'}
                                      />
                                    </TableCell>
                                  ))}
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Escopos */}
        <TabsContent value="escopos">
          <Card>
            <CardHeader>
              <CardTitle>Escopos de Acesso por Módulo</CardTitle>
              <CardDescription>
                Configure qual o nível de acesso de cada perfil em cada módulo do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Módulo</TableHead>
                    <TableHead>Escopo</TableHead>
                    <TableHead className="text-center">Criar</TableHead>
                    <TableHead className="text-center">Editar</TableHead>
                    <TableHead className="text-center">Excluir</TableHead>
                    <TableHead className="text-center">Aprovar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {moduleScopes.map(scope => (
                    <TableRow key={scope.id}>
                      <TableCell className="font-medium">
                        {ROLE_LABELS[scope.role]}
                      </TableCell>
                      <TableCell className="capitalize">{scope.moduleName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {ACCESS_SCOPE_LABELS[scope.accessScope]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {scope.canCreate && <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />}
                      </TableCell>
                      <TableCell className="text-center">
                        {scope.canEdit && <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />}
                      </TableCell>
                      <TableCell className="text-center">
                        {scope.canDelete && <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />}
                      </TableCell>
                      <TableCell className="text-center">
                        {scope.canApprove && <CheckCircle className="h-4 w-4 text-green-500 mx-auto" />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
