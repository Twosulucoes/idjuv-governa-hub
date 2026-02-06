// ============================================
// PÁGINA DE ADMINISTRAÇÃO DE PERFIS (SIMPLIFICADO)
// ============================================
// Sistema de 3 perfis fixos: Super Admin, Gestor, Servidor

import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAdminPerfis } from '@/hooks/useAdminPerfis';
import { PERFIL_LABELS, PERFIL_DESCRICOES, PERFIL_CORES } from '@/types/rbac';
import type { PerfilCodigo } from '@/types/rbac';
import { 
  Shield, 
  UserCheck,
  User,
  Info,
  Loader2,
  Lock,
  CheckCircle,
} from 'lucide-react';

// Ícones para cada perfil
const PERFIL_ICONES: Record<PerfilCodigo, React.ReactNode> = {
  super_admin: <Shield className="h-8 w-8 text-red-500" />,
  gestor: <UserCheck className="h-8 w-8 text-blue-500" />,
  servidor: <User className="h-8 w-8 text-green-500" />,
};

export default function GestaoPerfilPage() {
  const { perfis, loading } = useAdminPerfis();

  return (
    <AdminLayout 
      title="Perfis do Sistema" 
      description="Os 3 perfis institucionais de acesso"
    >
      <div className="space-y-6">
        {/* Aviso institucional */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            O sistema possui <strong>3 perfis fixos</strong>: Super Administrador, Gestor e Servidor. 
            Usuários são associados a um perfil que define seu nível de acesso. 
            Os módulos específicos são configurados individualmente para cada usuário.
          </AlertDescription>
        </Alert>

        {/* Lista de perfis */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3">
            {perfis.map((perfil) => {
              const codigo = perfil.codigo as PerfilCodigo;
              const icone = PERFIL_ICONES[codigo] || <Shield className="h-8 w-8" />;
              const cor = PERFIL_CORES[codigo] || '';
              
              return (
                <Card key={perfil.id} className="transition-all hover:shadow-md">
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 p-4 rounded-full bg-muted/50">
                      {icone}
                    </div>
                    <CardTitle className="flex items-center justify-center gap-2">
                      {PERFIL_LABELS[codigo] || perfil.nome}
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    </CardTitle>
                    <CardDescription>
                      {PERFIL_DESCRICOES[codigo] || perfil.descricao}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      {/* Badge do nível */}
                      <div className="flex justify-center">
                        <Badge className={cor}>
                          {PERFIL_LABELS[codigo] || perfil.nome}
                        </Badge>
                      </div>
                      
                      {/* Características */}
                      <div className="space-y-2 text-sm">
                        {codigo === 'super_admin' && (
                          <>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              Acesso total ao sistema
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              Não precisa de módulos específicos
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              Pode aprovar qualquer processo
                            </div>
                          </>
                        )}
                        
                        {codigo === 'gestor' && (
                          <>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              Pode aprovar processos
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              Acessa módulos liberados
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              Supervisiona equipes
                            </div>
                          </>
                        )}
                        
                        {codigo === 'servidor' && (
                          <>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              Acessa módulos liberados
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              Executa tarefas operacionais
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              Pode solicitar aprovações
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Nota informativa */}
        <Card className="bg-muted/30">
          <CardContent className="py-6 text-center text-muted-foreground text-sm">
            <Lock className="h-5 w-5 mx-auto mb-2" />
            Os perfis são <strong>fixos e institucionais</strong>. 
            Para alterar o acesso de um usuário, vá para <strong>Administração &gt; Usuários</strong> e 
            selecione o perfil e os módulos desejados.
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
