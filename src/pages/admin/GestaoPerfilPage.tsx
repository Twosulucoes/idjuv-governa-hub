// ============================================
// PÁGINA DE INFORMAÇÃO SOBRE O SISTEMA DE ACESSO
// ============================================

import { ModuleLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PageHeader } from '@/components/design-system';
import { 
  Info,
  CheckCircle,
  Boxes,
  Shield,
} from 'lucide-react';

export default function GestaoPerfilPage() {
  return (
    <ModuleLayout module="admin">
      <div className="space-y-6">
        <PageHeader
          migalhas={[{ rotulo: 'Administração', href: '/admin' }, { rotulo: 'Perfis de acesso' }]}
          titulo="Perfis de acesso"
          descricao="Como o acesso ao sistema é definido"
        />

        <Alert>
          <Info className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>
            O sistema utiliza controle de acesso baseado em <strong>módulos e permissões granulares</strong>. 
            Não existe conceito de "role" separado. O acesso é definido pelos módulos atribuídos a cada usuário.
          </AlertDescription>
        </Alert>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 rounded-full bg-muted/50">
                <Shield className="h-8 w-8 text-primary" aria-hidden="true" />
              </div>
              <CardTitle>Super admin</CardTitle>
              <CardDescription>Acesso total ao sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-success" aria-hidden="true" />
                Acesso a todos os módulos
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-success" aria-hidden="true" />
                Gerencia usuários e permissões
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 rounded-full bg-muted/50">
                <Boxes className="h-8 w-8 text-primary" aria-hidden="true" />
              </div>
              <CardTitle>Usuário com módulos</CardTitle>
              <CardDescription>Acesso definido por módulos atribuídos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-success" aria-hidden="true" />
                Acessa apenas módulos liberados
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-success" aria-hidden="true" />
                Permissões granulares por funcionalidade
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-muted/30">
          <CardContent className="py-6 text-center text-muted-foreground text-sm">
            Para alterar o acesso de um usuário, vá para <strong>Administração &gt; Usuários</strong> e 
            configure os módulos desejados.
          </CardContent>
        </Card>
      </div>
    </ModuleLayout>
  );
}
