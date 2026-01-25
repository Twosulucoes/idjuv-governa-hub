// ============================================
// GESTÃO DE PERFIS E PERMISSÕES V2
// ============================================

import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GestaoPerfilLista, 
  ArvoreFuncoes, 
  MatrizPermissoes, 
  UsuarioPerfilAssociacao 
} from '@/components/perfis';
import type { Perfil } from '@/types/perfis';
import { Shield, Key, Grid3X3, Users } from 'lucide-react';

export default function GestaoPerfilPage() {
  const [selectedPerfil, setSelectedPerfil] = useState<Perfil | null>(null);

  return (
    <AdminLayout 
      title="Gestão de Perfis e Permissões" 
      description="Configure os perfis de acesso, funções e permissões do sistema"
    >
      <Tabs defaultValue="perfis" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="perfis" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Perfis</span>
          </TabsTrigger>
          <TabsTrigger value="funcoes" className="gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">Funções</span>
          </TabsTrigger>
          <TabsTrigger value="matriz" className="gap-2">
            <Grid3X3 className="h-4 w-4" />
            <span className="hidden sm:inline">Matriz</span>
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Usuários</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfis">
          <GestaoPerfilLista 
            onPerfilSelect={setSelectedPerfil}
            selectedPerfilId={selectedPerfil?.id}
          />
        </TabsContent>

        <TabsContent value="funcoes">
          <ArvoreFuncoes showActions={true} />
        </TabsContent>

        <TabsContent value="matriz">
          <MatrizPermissoes />
        </TabsContent>

        <TabsContent value="usuarios">
          <UsuarioPerfilAssociacao />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
